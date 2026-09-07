import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'bluecurrent.db');

// Recreate the DB each boot so seed data is always fresh during development.
// Swap `rmSync` for a persistent file in production.
if (fs.existsSync(DB_PATH)) fs.rmSync(DB_PATH);

export const db = new DatabaseSync(DB_PATH);

db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE vessels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    heading REAL NOT NULL,
    speed REAL NOT NULL,
    status TEXT NOT NULL
  );

  CREATE TABLE pfz_zones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    radius_m INTEGER NOT NULL,
    sst_c REAL NOT NULL,
    chlorophyll TEXT NOT NULL,
    density TEXT NOT NULL,
    yield_pct REAL NOT NULL,
    distance_km REAL NOT NULL
  );

  CREATE TABLE spills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    radius_m INTEGER NOT NULL,
    severity TEXT NOT NULL
  );

  CREATE TABLE debris (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    size TEXT NOT NULL
  );

  CREATE TABLE boundaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    coords TEXT NOT NULL
  );

  CREATE TABLE corridors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    points TEXT NOT NULL
  );

  CREATE TABLE alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    level TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    lat REAL,
    lng REAL,
    created_at TEXT NOT NULL,
    source_type TEXT,
    source_ref TEXT
  );

  CREATE TABLE weather (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    wave_height_m REAL NOT NULL,
    wind_speed_kmh REAL NOT NULL,
    sst_c REAL NOT NULL,
    condition TEXT NOT NULL
  );

  CREATE TABLE agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    status TEXT NOT NULL,
    latency_ms INTEGER NOT NULL,
    source TEXT NOT NULL,
    message TEXT NOT NULL
  );

  CREATE TABLE reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    generated_at TEXT NOT NULL,
    content TEXT NOT NULL
  );

  CREATE TABLE habitat_zones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    species TEXT NOT NULL,
    season TEXT NOT NULL,
    status TEXT NOT NULL,
    temp_min_c REAL NOT NULL,
    temp_max_c REAL NOT NULL,
    sst_c REAL NOT NULL,
    coords TEXT NOT NULL,
    description TEXT NOT NULL
  );

  CREATE TABLE vessel_tracks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vessel_id INTEGER NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    heading REAL NOT NULL,
    speed REAL NOT NULL,
    recorded_at TEXT NOT NULL
  );

  CREATE TABLE spill_analysis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    spill_id INTEGER NOT NULL,
    affected_area_km2 REAL NOT NULL,
    spread_points TEXT NOT NULL,
    affected_species TEXT NOT NULL,
    response_status TEXT NOT NULL,
    recommendations TEXT NOT NULL
  );

  CREATE TABLE agent_evidence (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id INTEGER NOT NULL,
    claim TEXT NOT NULL,
    source TEXT NOT NULL,
    confidence_factor REAL NOT NULL,
    reasoning TEXT NOT NULL
  );
`);

// ---- Seed data (Bay of Bengal area, ~18.4N 84.2E like the UI) ----

const seed = {
  vessels: [
    ['ORCA-01', 18.4, 84.2, 45, 14, 'ACTIVE'],
    ['ORCA-02', 18.1, 84.5, 120, 9, 'ACTIVE'],
    ['ORCA-03', 18.7, 83.9, 300, 11, 'CRUISING'],
  ],
  pfz: [
    ['PFZ Zone 01', 18.5, 84.3, 10000, 27.4, 'High', 'Pelagic', 92, 12],
    ['PFZ Zone 02', 18.1, 84.6, 8000, 26.8, 'High', 'Demersal', 87, 18],
    ['PFZ Zone 03', 18.9, 83.7, 12000, 27.9, 'Medium', 'Pelagic', 74, 26],
    ['PFZ Zone 04', 17.9, 84.0, 7000, 25.6, 'Low', 'Mixed', 51, 34],
  ],
  spills: [
    ['Seep Alpha', 18.6, 84.8, 9000, 'MODERATE'],
    ['Sheen Bravo', 18.0, 83.5, 5000, 'LOW'],
  ],
  debris: [
    ['Debris Cluster', 18.3, 84.1, 'Large'],
    ['Driftwood Field', 18.55, 84.6, 'Medium'],
    ['Container Debris', 18.15, 83.9, 'Large'],
  ],
  boundaries: [
    ['EEZ Boundary', 'exclusive_economic_zone', [[18.9, 84.9], [18.6, 85.1], [18.2, 85.0], [17.9, 84.7], [17.8, 84.2]]],
    ['Territorial Waters', 'territorial', [[18.6, 84.6], [18.3, 84.8], [18.0, 84.5], [18.0, 84.0], [18.4, 83.8]]],
    ['Marine Reserve', 'protected', [[18.7, 84.0], [18.8, 84.3], [18.5, 84.4], [18.4, 84.1]]],
  ],
  corridors: [
    ['Corridor A', [[18.4, 84.2], [18.5, 84.5], [18.7, 84.7]]],
    ['Corridor B', [[18.4, 84.2], [18.3, 84.5], [18.5, 84.8], [18.8, 84.6]]],
  ],
  alerts: [
    ['HIGH', 'Severe Weather Warning: Rapid Wind Shear', 'Gale-force winds up to 38 knots detected 15NM North-East. Small craft advised to seek shelter or alter heading immediately.', 18.9, 84.5, minutesAgo(2), 'random', null],
    ['CAUTION', 'Marine Debris & Driftwood Cluster', 'Floating container debris reported near coordinates 18.3°N, 84.1°E. Navigation hazard for surface hulls.', 18.3, 84.1, minutesAgo(18), 'hazard', 'Debris Cluster'],
    ['INFO', 'EEZ Boundary Patrol Active', 'Coast Guard patrol vessel operating near Sector 4. Maintain standard transponder frequency 156.8 MHz.', 18.6, 84.9, minutesAgo(45), 'random', null],
  ],
  weather: [
    [18.4, 84.2, 1.8, 24, 27.4, 'MODERATE CAUTION'],
    [18.9, 84.5, 2.4, 38, 27.1, 'HIGH WAVE'],
    [18.1, 83.9, 1.2, 15, 26.9, 'CALM'],
    [18.5, 84.8, 2.0, 28, 27.6, 'CAUTION'],
  ],
  agents: [
    ['Oceanography Agent', 'VERIFIED', 12, 'Sentinel-3', 'SST anomaly detected +0.4°C off eastern sector. Fish aggregation likelihood high at 18.5N, 84.3E.'],
    ['Weather Agent', 'MONITORING', 18, 'NOAA GFS', 'Squall front moving SSE at 18 knots. Wave height expected to peak at 2.4m within 3 hours.'],
    ['Security & Border Agent', 'VERIFIED', 8, 'AIS Live Feed', 'Evaluating EEZ geofence. No unauthorized entry or AIS spoofing detected.'],
  ],
  habitat_zones: [
    ['Sundarbans Hilsa Spawning Ground', 'Hilsa (Tenualosa ilisha)', 'Monsoon', 'breeding', 24, 30, 28.2, [[18.5, 84.2], [18.7, 84.3], [18.6, 84.5], [18.4, 84.4]], 'Critical spawning habitat for Hilsa during monsoon freshet.'],
    ['Visakhapatnam Mackerel Bank', 'Indian Mackerel (Rastrelliger kanagurta)', 'Pre-Monsoon', 'active', 25, 29, 27.8, [[18.2, 84.7], [18.4, 84.9], [18.3, 85.0], [18.1, 84.8]], 'Seasonal feeding ground with high plankton productivity.'],
    ['Chennai Sardine Nursery', 'Oil Sardine (Sardinella longiceps)', 'Post-Monsoon', 'active', 26, 31, 28.5, [[17.9, 84.0], [18.1, 84.2], [18.0, 84.4], [17.8, 84.1]], 'Juvenile sardine nursery with optimal temperature-salinity window.'],
    ['Gopalpur Tiger Prawn Estuary', 'Tiger Prawn (Penaeus monodon)', 'Monsoon', 'breeding', 22, 28, 26.0, [[18.6, 83.7], [18.8, 83.8], [18.7, 84.0], [18.5, 83.9]], 'Brackish water estuary supporting larval prawn development.'],
    ['Paradip Tuna Riff', 'Yellowfin Tuna (Thunnus albacares)', 'Pre-Monsoon', 'inactive', 24, 30, 27.2, [[18.9, 84.0], [19.1, 84.2], [19.0, 84.4], [18.8, 84.3]], 'Pelagic tuna aggregation zone — currently outside seasonal window.'],
  ],
  spill_analysis: [
    [1, 12.4, [[18.6, 84.8], [18.62, 84.85], [18.65, 84.9], [18.68, 84.95], [18.7, 85.0]], ['Hilsa', 'Mackerel', 'Sardine'], 'ACTIVE', 'Deploy containment boom NE; establish 2km exclusion zone; monitor wind shift SSE.'],
    [2, 3.1, [[18.0, 83.5], [18.02, 83.45], [18.05, 83.4], [18.08, 83.35]], ['Sardine', 'Tiger Prawn'], 'MONITORING', 'Natural dispersion expected within 48h; no containment action required.'],
  ],
  agent_evidence: [
    [1, 'SST anomaly +0.4°C detected at 18.5N, 84.3E', 'Sentinel-3', 94, 'SLSTR L2P product shows persistent warm patch over 72h; correlates with chlorophyll-a increase.'],
    [1, 'Fish aggregation likelihood high in eastern sector', 'Sentinel-3', 88, 'OLCI chlorophyll front matches PFZ Zone 01 boundary; eddy-driven upwelling confirmed.'],
    [2, 'Squall front moving SSE at 18 knots', 'NOAA GFS', 91, '00Z GFS run: 850hPa wind vector 180°/18kt; MCS initiation probability >70% per HREF.'],
    [2, 'Wave height expected to peak at 2.4m within 3h', 'NOAA GFS', 85, 'WW3 wave model forced by GFS winds; Hs 2.4m at 18.9N, 84.5E at T+3h.'],
    [3, 'No unauthorized entry or AIS spoofing detected', 'AIS Live Feed', 97, 'All 147 tracked vessels in sector match registered MMSI; zero AIS gap events >5min.'],
    [3, 'EEZ geofence integrity maintained', 'AIS Live Feed', 93, 'Boundary proximity alerts: 0 breaches in last 6h; nearest vessel 12.3NM outside EEZ.'],
  ],
  reports: [],
  vessel_tracks: [],
};

function minutesAgo(n) {
  return new Date(Date.now() - n * 60_000).toISOString();
}

function buildReportContent(type) {
  const vessels = db.prepare('SELECT * FROM vessels').all();
  const pfz = db.prepare('SELECT * FROM pfz_zones').all();
  const alerts = db.prepare('SELECT * FROM alerts').all();
  const weather = db.prepare('SELECT * FROM weather').all();
  const debris = db.prepare('SELECT * FROM debris').all();

  const activeVessels = vessels.filter((v) => v.status === 'ACTIVE').length;
  const topZone = pfz.reduce((a, b) => (a.yield_pct > b.yield_pct ? a : b), pfz[0]);
  const highAlerts = alerts.filter((a) => a.level === 'HIGH').length;
  const cautionAlerts = alerts.filter((a) => a.level === 'CAUTION').length;
  const infoAlerts = alerts.filter((a) => a.level === 'INFO').length;
  const wavePeak = Math.max(...weather.map((w) => w.wave_height_m));

  const period = type === 'weekly' ? 'Last 7 days' : 'Last 24 hours';
  const summary = type === 'weekly'
    ? `Weekly summary: ${activeVessels} active vessels, ${pfz.length} PFZ zones monitored, ${highAlerts + cautionAlerts + infoAlerts} total alerts issued. Peak wave: ${wavePeak}m.`
    : `Daily ops: ${activeVessels} vessels tracked, ${topZone?.name || '—'} leading at ${topZone?.yield_pct || 0}% yield, ${highAlerts} high / ${cautionAlerts} caution / ${infoAlerts} info alerts.`;

  const stats = {
    'Active Vessels': activeVessels,
    'PFZ Zones': pfz.length,
    'High Alerts': highAlerts,
    'Caution Alerts': cautionAlerts,
    'Info Alerts': infoAlerts,
    'Peak Wave (m)': wavePeak,
    'Debris Clusters': debris.length,
    'Top PFZ Yield': topZone ? `${topZone.yield_pct}%` : '—',
  };

  const sections = [
    {
      title: 'Vessel Activity',
      rows: vessels.map((v) => ({
        label: v.name,
        value: `${v.status} · ${v.speed} kn · ${v.heading}°`,
        severity: v.status === 'ACTIVE' ? 'ok' : 'warn',
      })),
    },
    {
      title: 'Alert Statistics',
      rows: [
        { label: 'HIGH', value: String(highAlerts), severity: 'crit' },
        { label: 'CAUTION', value: String(cautionAlerts), severity: 'warn' },
        { label: 'INFO', value: String(infoAlerts), severity: 'ok' },
      ],
    },
    {
      title: 'PFZ Zone Performance',
      rows: pfz.map((z) => ({
        label: z.name,
        value: `${z.yield_pct}% yield · SST ${z.sst_c}°C`,
        severity: z.yield_pct >= 85 ? 'ok' : z.yield_pct >= 70 ? 'warn' : 'crit',
      })),
    },
    {
      title: 'Safety Trend',
      rows: [
        { label: 'Current Risk Score', value: `${Math.round(wavePeak * 12 + highAlerts * 25 + cautionAlerts * 12)} / 100`, severity: 'ok' },
        { label: 'Peak Wave', value: `${wavePeak}m`, severity: wavePeak > 2 ? 'warn' : 'ok' },
        { label: 'Dominant Condition', value: weather[0]?.condition || '—', severity: 'ok' },
      ],
    },
    {
      title: 'Debris Tracking',
      rows: debris.map((d) => ({
        label: d.name,
        value: `${d.size} · ${d.lat.toFixed(2)}N, ${d.lng.toFixed(2)}E`,
        severity: d.size === 'Large' ? 'crit' : d.size === 'Medium' ? 'warn' : 'ok',
      })),
    },
  ];

  return { timeframe: type, period, summary, stats, sections };
}

for (const row of seed.vessels) db.prepare('INSERT INTO vessels (name,lat,lng,heading,speed,status) VALUES (?,?,?,?,?,?)').run(...row);

// ---- Seed vessel tracks: interpolate ~8 historical points per vessel backwards along heading ----
const DEG_PER_KM = 1 / 111.32;
const vesselsSeed = db.prepare('SELECT id, lat, lng, heading, speed FROM vessels').all();
for (const v of vesselsSeed) {
  const rad = (v.heading * Math.PI) / 180;
  const stepKm = (v.speed * (3 / 3600)) * 0.5; // 3s tick, half speed for history
  const stepDeg = stepKm * DEG_PER_KM;
  let lat = v.lat;
  let lng = v.lng;
  for (let i = 0; i < 8; i++) {
    lat -= Math.cos(rad) * stepDeg;
    lng -= Math.sin(rad) * stepDeg;
    const recorded = new Date(Date.now() - (8 - i) * 3000).toISOString();
    db.prepare('INSERT INTO vessel_tracks (vessel_id,lat,lng,heading,speed,recorded_at) VALUES (?,?,?,?,?,?)')
      .run(v.id, lat, lng, v.heading, v.speed, recorded);
  }
}
for (const row of seed.pfz) db.prepare('INSERT INTO pfz_zones (name,lat,lng,radius_m,sst_c,chlorophyll,density,yield_pct,distance_km) VALUES (?,?,?,?,?,?,?,?,?)').run(...row);
for (const row of seed.spills) db.prepare('INSERT INTO spills (name,lat,lng,radius_m,severity) VALUES (?,?,?,?,?)').run(...row);
for (const row of seed.debris) db.prepare('INSERT INTO debris (name,lat,lng,size) VALUES (?,?,?,?)').run(...row);
for (const row of seed.boundaries) db.prepare('INSERT INTO boundaries (name,type,coords) VALUES (?,?,?)').run(row[0], row[1], JSON.stringify(row[2]));
for (const row of seed.corridors) db.prepare('INSERT INTO corridors (name,points) VALUES (?,?)').run(row[0], JSON.stringify(row[1]));
for (const row of seed.alerts) db.prepare('INSERT INTO alerts (level,title,message,lat,lng,created_at,source_type,source_ref) VALUES (?,?,?,?,?,?,?,?)').run(...row);
for (const row of seed.weather) db.prepare('INSERT INTO weather (lat,lng,wave_height_m,wind_speed_kmh,sst_c,condition) VALUES (?,?,?,?,?,?)').run(...row);
for (const row of seed.agents) db.prepare('INSERT INTO agents (name,status,latency_ms,source,message) VALUES (?,?,?,?,?)').run(...row);
for (const row of seed.habitat_zones) db.prepare('INSERT INTO habitat_zones (name,species,season,status,temp_min_c,temp_max_c,sst_c,coords,description) VALUES (?,?,?,?,?,?,?,?,?)').run(row[0], row[1], row[2], row[3], row[4], row[5], row[6], JSON.stringify(row[7]), row[8]);
for (const row of seed.spill_analysis) db.prepare('INSERT INTO spill_analysis (spill_id,affected_area_km2,spread_points,affected_species,response_status,recommendations) VALUES (?,?,?,?,?,?)').run(row[0], row[1], JSON.stringify(row[2]), JSON.stringify(row[3]), row[4], row[5]);
for (const row of seed.agent_evidence) db.prepare('INSERT INTO agent_evidence (agent_id,claim,source,confidence_factor,reasoning) VALUES (?,?,?,?,?)').run(...row);

// ---- Seed initial reports (daily + weekly) — must run AFTER all other seed data so the summary is populated ----
const dailyContent = buildReportContent('daily');
const weeklyContent = buildReportContent('weekly');
db.prepare('INSERT INTO reports (type,title,generated_at,content) VALUES (?,?,?,?)')
  .run('daily', 'Daily Operations Summary', new Date().toISOString(), JSON.stringify(dailyContent));
db.prepare('INSERT INTO reports (type,title,generated_at,content) VALUES (?,?,?,?)')
  .run('weekly', 'Weekly Operations Summary', new Date().toISOString(), JSON.stringify(weeklyContent));

export const now = () => new Date().toISOString();
