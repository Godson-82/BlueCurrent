import { db } from './db.js';

// A tiny live-data engine. Every tick it nudges vessel positions, drifts
// debris, and occasionally emits a new weather alert, then broadcasts the
// snapshot over Socket.io so the UI updates without a refresh.

const DEG_PER_KM = 1 / 111.32;

function pointInPolygon([x, y], poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export class Simulator {
  constructor(io) {
    this.io = io;
    this.tickMs = 3000;
    this._timer = null;
    this._breachState = new Map();
  }

  start() {
    this._timer = setInterval(() => this.tick(), this.tickMs);
    console.log(`[simulator] running every ${this.tickMs}ms`);
  }

  stop() {
    if (this._timer) clearInterval(this._timer);
  }

  tick() {
    this._moveVessels();
    this._driftDebris();
    this._maybeSpawnAlert();
    this._checkGeofence();
    this.io.emit('live', this.snapshot());
  }

  _moveVessels() {
    const rows = db.prepare('SELECT id, lat, lng, heading, speed FROM vessels').all();
    const step = db.prepare('UPDATE vessels SET lat = ?, lng = ?, heading = ? WHERE id = ?');
    const insertTrack = db.prepare('INSERT INTO vessel_tracks (vessel_id,lat,lng,heading,speed,recorded_at) VALUES (?,?,?,?,?,?)');
    const trimTracks = db.prepare('DELETE FROM vessel_tracks WHERE id NOT IN (SELECT id FROM vessel_tracks WHERE vessel_id = ? ORDER BY id DESC LIMIT 40)');
    for (const v of rows) {
      const rad = (v.heading * Math.PI) / 180;
      const dist = (v.speed * (this.tickMs / 3600 / 1000)) * 0.5;
      const newLat = v.lat + Math.cos(rad) * dist * DEG_PER_KM;
      const newLng = v.lng + Math.sin(rad) * dist * DEG_PER_KM;
      const newHeading = (v.heading + (Math.random() * 12 - 6)) % 360;
      step.run(newLat, newLng, newHeading, v.id);
      insertTrack.run(v.id, newLat, newLng, newHeading, v.speed, new Date().toISOString());
      trimTracks.run(v.id);
    }
  }

  _driftDebris() {
    const rows = db.prepare('SELECT id, lat, lng FROM debris').all();
    const step = db.prepare('UPDATE debris SET lat = ?, lng = ? WHERE id = ?');
    for (const d of rows) {
      step.run(d.lat + (Math.random() - 0.5) * 0.01, d.lng + (Math.random() - 0.5) * 0.01, d.id);
    }
  }

  _maybeSpawnAlert() {
    if (Math.random() > 0.35) return;
    const levels = ['CAUTION', 'INFO'];
    const level = levels[Math.floor(Math.random() * levels.length)];
    const vessels = db.prepare('SELECT * FROM vessels').all();
    const spills = db.prepare('SELECT * FROM spills').all();
    const debris = db.prepare('SELECT * FROM debris').all();

    let lat = 18.3 + Math.random() * 0.6;
    let lng = 83.8 + Math.random() * 0.9;
    let sourceType = 'random';
    let sourceRef = null;
    let targetName = '';

    // Find nearest vessel within ~0.35°
    let nearestVessel = null;
    let minDistVessel = Infinity;
    for (const v of vessels) {
      const d = Math.hypot(v.lat - lat, v.lng - lng);
      if (d < minDistVessel) {
        minDistVessel = d;
        nearestVessel = v;
      }
    }
    if (nearestVessel && minDistVessel < 0.35) {
      lat = nearestVessel.lat;
      lng = nearestVessel.lng;
      sourceType = 'vessel';
      sourceRef = nearestVessel.name;
      targetName = ` near ${nearestVessel.name}`;
    } else {
      // Find nearest spill/debris within ~0.3°
      let nearestHazard = null;
      let minDistHazard = Infinity;
      let hazardType = '';
      for (const s of spills) {
        const d = Math.hypot(s.lat - lat, s.lng - lng);
        if (d < minDistHazard) {
          minDistHazard = d;
          nearestHazard = s;
          hazardType = 'spill';
        }
      }
      for (const d of debris) {
        const dist = Math.hypot(d.lat - lat, d.lng - lng);
        if (dist < minDistHazard) {
          minDistHazard = dist;
          nearestHazard = d;
          hazardType = 'debris';
        }
      }
      if (nearestHazard && minDistHazard < 0.3) {
        lat = nearestHazard.lat;
        lng = nearestHazard.lng;
        sourceType = 'hazard';
        sourceRef = nearestHazard.name;
        targetName = ` near ${nearestHazard.name} (${hazardType})`;
      }
    }

    const titles =
      level === 'CAUTION'
        ? ['Weather Squall Approaching', 'Localized Fog Bank Detected', 'Strong Current Advisory']
        : ['Vessel Movement Update', 'Satellite Sync Complete', 'Route Advisory Issued'];
    const title = titles[Math.floor(Math.random() * titles.length)];
    db.prepare(
      'INSERT INTO alerts (level,title,message,lat,lng,created_at,source_type,source_ref) VALUES (?,?,?,?,?,?,?,?)'
    ).run(
      level,
      title,
      `Automated advisory generated${targetName}. Check local conditions before proceeding.`,
      lat,
      lng,
      new Date().toISOString(),
      sourceType,
      sourceRef
    );
  }

  _checkGeofence() {
    const boundaries = db.prepare('SELECT * FROM boundaries').all();
    const vessels = db.prepare('SELECT * FROM vessels').all();
    for (const b of boundaries) {
      const coords = JSON.parse(b.coords);
      for (const v of vessels) {
        const inside = pointInPolygon([v.lat, v.lng], coords);
        const key = `${b.id}:${v.id}`;
        const prevInside = this._breachState.get(key);
        if (prevInside !== undefined && prevInside !== inside) {
          // Transition detected
          const entering = inside;
          const level = entering ? 'CAUTION' : 'INFO';
          const title = entering ? 'Vessel Entering Geofence' : 'Vessel Exiting Geofence';
          const msg = `${v.name} ${entering ? 'entered' : 'exited'} ${b.name} (${b.type}) at ${v.lat.toFixed(2)}N, ${v.lng.toFixed(2)}E.`;
          db.prepare(
            'INSERT INTO alerts (level,title,message,lat,lng,created_at,source_type,source_ref) VALUES (?,?,?,?,?,?,?,?)'
          ).run(level, title, msg, v.lat, v.lng, new Date().toISOString(), 'geofence', b.name);
        }
        this._breachState.set(key, inside);
      }
    }
  }

  snapshot() {
    return {
      vessels: db.prepare('SELECT * FROM vessels').all(),
      debris: db.prepare('SELECT * FROM debris').all(),
      alerts: db.prepare('SELECT * FROM alerts ORDER BY created_at DESC LIMIT 10').all(),
      weather: db.prepare('SELECT * FROM weather').all(),
    };
  }
}
