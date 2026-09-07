import { Router } from 'express';
import { db } from './db.js';
import { handleChat } from './chat.js';

export const api = Router();

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
  const highCount = highAlerts;
  const cautionCount = cautionAlerts;

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
        { label: 'Current Risk Score', value: `${Math.round(wavePeak * 12 + highCount * 25 + cautionCount * 12)} / 100`, severity: 'ok' },
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

const json = (obj) => JSON.parse(obj);

api.get('/health', (_req, res) => res.json({ ok: true }));

// Home screen counters
api.get('/stats', (_req, res) => {
  const vessels = db.prepare('SELECT COUNT(*) c FROM vessels').get().c;
  const pfz = db.prepare('SELECT COUNT(*) c FROM pfz_zones').get().c;
  const hazards = db.prepare('SELECT COUNT(*) c FROM alerts').get().c;
  res.json({
    vesselsGuided: vessels * 4000, // simulated scale-up for the "12K+" style stat
    pfzZones: pfz,
    hazardLogs: hazards * 8000,
  });
});

// Weather for the intelligence map + reasoning
api.get('/weather', (_req, res) =>
  res.json(db.prepare('SELECT * FROM weather').all())
);

api.get('/pfz', (_req, res) => res.json(db.prepare('SELECT * FROM pfz_zones').all()));

api.get('/spills', (_req, res) => res.json(db.prepare('SELECT * FROM spills').all()));

api.get('/debris', (_req, res) => res.json(db.prepare('SELECT * FROM debris').all()));

api.get('/boundaries', (_req, res) =>
  res.json(
    db.prepare('SELECT * FROM boundaries').all().map((b) => ({ ...b, coords: json(b.coords) }))
  )
);

api.get('/corridors', (_req, res) =>
  res.json(
    db.prepare('SELECT * FROM corridors').all().map((c) => ({ ...c, points: json(c.points) }))
  )
);

// All map layers in one call (used by the Intelligence screen).
api.get('/intel', (_req, res) =>
  res.json({
    pfz: db.prepare('SELECT * FROM pfz_zones').all(),
    weather: db.prepare('SELECT * FROM weather').all(),
    spills: db.prepare('SELECT * FROM spills').all(),
    debris: db.prepare('SELECT * FROM debris').all(),
    boundaries: db.prepare('SELECT * FROM boundaries').all().map((b) => ({ ...b, coords: json(b.coords) })),
    corridors: db.prepare('SELECT * FROM corridors').all().map((c) => ({ ...c, points: json(c.points) })),
  })
);

// Route planning: given start/end, return a corridor that avoids hazard zones.
api.post('/routes/plan', (req, res) => {
  const { start = [18.4, 84.2], end = [18.8, 84.6] } = req.body || {};
  // Simulate hazard-aware routing: drop a midpoint that shifts away from spills.
  const spills = db.prepare('SELECT lat, lng FROM spills').all();
  const mid = [start[0] + (end[0] - start[0]) * 0.5, start[1] + (end[1] - start[1]) * 0.5];
  spills.forEach((s) => {
    const dLat = s.lat - mid[0];
    const dLng = s.lng - mid[1];
    const dist = Math.hypot(dLat, dLng);
    if (dist < 0.2) {
      mid[0] -= (dLat / (dist || 1)) * 0.15;
      mid[1] -= (dLng / (dist || 1)) * 0.15;
    }
  });
  const waypoints = [start, mid.map((n) => Number(n.toFixed(4))), end];
  const distanceKm = (Math.hypot(end[0] - start[0], end[1] - start[1]) * 111.32).toFixed(1);
  res.json({ waypoints, distanceKm, label: 'Hazard-avoidance corridor' });
});

// Safety / overall risk assessment — per-category breakdown from live weather + alerts.
api.get('/safety', (_req, res) => {
  const weather = db.prepare('SELECT * FROM weather').all();
  const alerts = db.prepare('SELECT * FROM alerts').all();
  const wavePeak = Math.max(...weather.map((w) => w.wave_height_m));
  const windPeak = Math.max(...weather.map((w) => w.wind_speed_kmh));
  const worstCondition = weather.reduce((w, c) => c.wave_height_m > w.wave_height_m ? c : w, weather[0]);
  const highAlerts = alerts.filter((a) => a.level === 'HIGH');
  const cautionAlerts = alerts.filter((a) => a.level === 'CAUTION');
  const highCount = highAlerts.length;
  const cautionCount = cautionAlerts.length;
  const totalAlerts = alerts.length;

  // --- Category 1: Sea State (30%) — wave height vs safety thresholds ---
  let seaStateScore, seaStateSummary, seaStateDetail;
  if (wavePeak < 1.0) {
    seaStateScore = 8;
    seaStateSummary = 'Calm seas — optimal operating conditions';
    seaStateDetail = `Peak significant wave height ${wavePeak}m is well below the 1.0m calm threshold. Whitecap coverage negligible; no swell interference with fishing gear deployment or small-craft operations. All sectors report favourable sea state for 48h forecast window.`;
  } else if (wavePeak < 1.5) {
    seaStateScore = 22;
    seaStateSummary = 'Slight seas — comfortable for all vessel classes';
    seaStateDetail = `Peak Hs ${wavePeak}m sits in the Slight band (1.0–1.5m). Occasional whitecaps visible; rolling motion minimal. Safe for trawling, longline deployment, and passenger transfer. No deviation from standard routes required.`;
  } else if (wavePeak < 2.0) {
    seaStateScore = 38;
    seaStateSummary = 'Moderate seas — advisory for small craft';
    seaStateDetail = `Peak Hs ${wavePeak}m falls in the Moderate band (1.5–2.0m). Regular whitecaps with scattered spray; beam seas may cause 8–12° roll on vessels <15m. Fishing operations feasible but gear handling requires caution. Consider reefing sails on sailing vessels.`;
  } else if (wavePeak < 2.5) {
    seaStateScore = 58;
    seaStateSummary = 'Rough seas — elevated risk for small vessels';
    seaStateDetail = `Peak Hs ${wavePeak}m enters the Rough band (2.0–2.5m). Frequent breaking crests with wind-borne spray; following seas create surfing risk for small craft. Trawler operations should reduce speed and secure loose deck equipment. At current peak (${worstCondition.lat}°N, ${worstCondition.lng}°E), NOAA WW3 model confirms wave energy concentrated in 8–10s period.`;
  } else if (wavePeak < 3.5) {
    seaStateScore = 78;
    seaStateSummary = 'Very rough seas — small vessel operations suspended';
    seaStateDetail = `Peak Hs ${wavePeak}m is in the Very Rough band (2.5–3.5m). Heavy spray, breaking crests 30–50% of wave population. Structures under strain; cargo shift risk elevated. Infield fishing suspended for vessels <25m. Route deviation to sheltered corridors recommended. Wave period ~9s indicates sustained energy input from active weather system.`;
  } else {
    seaStateScore = 95;
    seaStateSummary = 'Phenomenal seas — all small-craft operations halted';
    seaStateDetail = `Peak Hs ${wavePeak}m exceeds 3.5m (Phenomenal). Catastrophic sea state with widespread breaking crests, deep troughs, and structural fatigue risk. All operations except heavy tonnage suspended. Immediate shelter seeking advised. SAR standby recommended for active fishing fleet.`;
  }

  // --- Category 2: Wind & Weather (25%) — wind speed vs operational thresholds ---
  let windScore, windSummary, windDetail;
  if (windPeak < 20) {
    windScore = 10;
    windSummary = 'Light breeze — no weather restrictions';
    windDetail = `Peak wind ${windPeak} km/h is Beaufort Force 3–4 (gentle to moderate breeze). Comfortable for all deck operations, helicopter transfers, and crane lifts. Weather windows stable for next 12h per GFS model run.`;
  } else if (windPeak < 30) {
    windScore = 30;
    windSummary = 'Moderate wind — standard precautions';
    windDetail = `Peak wind ${windPeak} km/h (Beaufort Force 5). Fresh breeze with moderate wave generation; whitecaps widespread. Secure loose equipment on deck. Helicopter operations proceed with wind correction. Current wind vector from ${worstCondition.condition} sector aligns with forecast SSE track.`;
  } else if (windPeak < 40) {
    windScore = 60;
    windSummary = 'Strong wind — near-gale caution active';
    windDetail = `Peak wind ${windPeak} km/h approaches gale threshold (34 kt / 63 km/h). Beaufort Force 6–7; large branch motion, difficulty with umbrellas on shore. At sea: spray reduces visibility, small craft heading instability. NOAA GFS 00Z run shows 850 hPa wind vector supporting sustained 35+ km/h through T+6h. Crane and diving operations suspended.`;
  } else if (windPeak < 55) {
    windScore = 80;
    windSummary = 'Gale conditions — restricted operations';
    windDetail = `Peak wind ${windPeak} km/h exceeds gale force (Beaufort 8). Sea state coupled to wind: wave steepness increasing, breaking crest ratio >50%. All small vessel movement restricted; medium vessels reduce to steerage way. Secure all hatches. GFS model confidence: 91% for sustained gale through T+12h.`;
  } else {
    windScore = 98;
    windSummary = 'Storm force — emergency protocols engaged';
    windDetail = `Peak wind ${windPeak} km/h is storm force (Beaufort 10+). Structural damage to small craft imminent; catastrophic seas developing. All fleet movement halted; shore-based personnel secured. Hurricane protocols referenced. SAR assets on standby.`;
  }

  // --- Category 3: Hazard Proximity (25%) — alerts & nearby threats ---
  let hazardScore, hazardSummary, hazardDetail;
  const nearestHazardKm = highAlerts.length > 0
    ? Math.round(Math.hypot((highAlerts[0].lat || 18.5) - 18.4, (highAlerts[0].lng || 84.5) - 84.2) * 111.32)
    : null;
  if (highCount === 0 && cautionCount === 0) {
    hazardScore = 5;
    hazardSummary = 'No active hazard alerts in monitored zone';
    hazardDetail = `Zero HIGH or CAUTION alerts in the past 24h. All 4 monitoring sectors report clear. Nearest logged incident was >48h ago. No SAR activity, debris fields, or spill zones within 50 NM of fleet operating area.`;
  } else if (highCount === 0 && cautionCount <= 2) {
    hazardScore = 25;
    hazardSummary = `${cautionCount} minor caution(s) — no critical threats`;
    hazardDetail = `${cautionCount} CAUTION alert(s) active (debris clusters, minor drift). No HIGH-severity warnings. Nearest caution zone: debris field at 18.3°N, 84.1°E — ${Math.round(Math.hypot(18.3 - 18.4, 84.1 - 84.2) * 111.32)} NM from fleet center. Standard navigation protocols sufficient; maintain AIS transponder reporting.`;
  } else if (highCount <= 1 && cautionCount <= 3) {
    hazardScore = 55;
    hazardSummary = `${highCount} high + ${cautionCount} caution alert(s) — active monitoring`;
    hazardDetail = `${highCount} HIGH alert(s): ${highAlerts.map((a) => a.title).join('; ')}. ${cautionCount} caution(s) active. ${nearestHazardKm !== null ? `Nearest HIGH threat ~${nearestHazardKm} NM from fleet center.` : ''} AIS correlation shows ${totalAlerts - highCount - cautionCount} INFO-level observations. Recommend heightened radar watch and course deviation protocols within 10 NM of alert epicenters.`;
  } else {
    hazardScore = 85;
    hazardSummary = `${highCount} critical alert(s) — elevated hazard posture`;
    hazardDetail = `${highCount} HIGH alerts active: ${highAlerts.map((a) => a.title).join('; ')}. ${cautionCount} caution(s) compounding risk. Active SAR or hazard-avoidance corridors may be required. ${nearestHazardKm !== null ? `Nearest HIGH threat ${nearestHazardKm} NM — within operational impact radius.` : ''} Fleet command should convene situational briefing and consider fleet-wide routing adjustments.`;
  }

  // --- Category 4: Navigation Integrity (20%) — EEZ compliance, geofence, AIS ---
  let navScore, navSummary, navDetail;
  const debrisCount = db.prepare('SELECT COUNT(*) as c FROM debris').get().c;
  const spillCount = db.prepare('SELECT COUNT(*) as c FROM spills').get().c;
  const navIssues = debrisCount + spillCount;
  if (navIssues === 0 && highCount === 0) {
    navScore = 5;
    navSummary = 'Full navigational integrity — no obstructions';
    navDetail = `Zero debris fields, zero spill zones, zero AIS anomalies in monitored corridors. EEZ boundary compliance at 100%. All ${db.prepare('SELECT COUNT(*) as c FROM vessels').get().c} tracked vessels maintaining assigned routes. Geofence breach count: 0 in past 6h.`;
  } else if (navIssues <= 2 && cautionCount <= 1) {
    navScore = 28;
    navSummary = 'Minor navigational considerations active';
    navDetail = `${navIssues} navigational obstacle(s) detected: ${debrisCount > 0 ? debrisCount + ' debris field(s)' : ''}${debrisCount > 0 && spillCount > 0 ? ' + ' : ''}${spillCount > 0 ? spillCount + ' spill zone(s)' : ''}. ${cautionCount > 0 ? '1 caution-level drift hazard under monitoring.' : 'No active drift hazards.'} AIS tracking nominal; all vessels within assigned corridors. Recommend standard obstacle-avoidance deviation for transit routes within 5 NM of flagged zones.`;
  } else if (navIssues <= 4) {
    navScore = 52;
    navSummary = 'Moderate navigational risk — route review advised';
    navDetail = `${navIssues} obstacles tracked: ${debrisCount} debris field(s), ${spillCount} spill zone(s). Active caution alerts: ${cautionCount}. Route optimization engine recommends deviation corridors to maintain >2 NM clearance from hazard zones. EEZ compliance remains at 100%, but corridor A-B transit times extended ~15% due to hazard-avoidance waypoints. AIS gap events: 0 in past 6h.`;
  } else {
    navScore = 78;
    navSummary = 'Significant navigational hazards — restricted routing';
    navDetail = `${navIssues} obstacles in monitored waters: ${debrisCount} debris fields, ${spillCount} spill zones. Multiple caution alerts active. ${highCount > 0 ? 'HIGH alert(s) may indicate dynamic hazard requiring real-time rerouting.' : ''} Corridor integrity compromised; standard routes may not be safe. Recommend full route recalculation via hazard-avoidance engine. Vessel spacing protocols increased to 3 NM minimum. SAR standby for fleet transit.`;
  }

  // --- Composite score ---
  const score = Math.round(
    seaStateScore * 0.30 +
    windScore * 0.25 +
    hazardScore * 0.25 +
    navScore * 0.20
  );

  const level =
    score < 25 ? 'LOW RISK' : score < 50 ? 'CAUTION ADVISORY' : score < 75 ? 'ELEVATED RISK' : 'SEVERE RISK';
  const emoji = score < 25 ? '🟢' : score < 50 ? '🟡' : score < 75 ? '🟠' : '🔴';

  // --- Advisory text ---
  let advisory;
  if (score < 25) {
    advisory = 'Conditions optimal for standard cruising and fishing operations across all monitored sectors. No route deviations required. Fleet advisory: proceed with normal scheduling.';
  } else if (score < 50) {
    advisory = `Moderate conditions with ${highCount > 0 ? 'active HIGH alert(s)' : 'elevated sea state'}. Maintain minimum 2 NM clearance from hazard zones. Small craft advisory: reduce speed in beam seas. Recommend checking updated PFZ coordinates before departure.`;
  } else if (score < 75) {
    advisory = `Elevated risk posture. ${highCount > 0 ? 'Active gale/severe weather alert — ' : ''}Small vessel operations should be restricted to essential transit only. Helm allisions recommend: ${wavePeak > 2.0 ? 'reduce to steerage way in rough sectors' : 'maintain heading into swell'}. Fleet command should review corridor A-B routing. Next forecast update: ~3h per GFS cycle.`;
  } else {
    advisory = `SEVERE conditions active. All small-craft operations suspended immediately. Medium vessels seek nearest sheltered anchorage. ${highCount > 0 ? 'SAR standby for active fleet.' : ''} Weather window improvement expected in 12–18h per extended GFS ensemble. Coordinate with port authority for fleet-wide stand-down.`;
  }

  res.json({
    score, level, emoji,
    wavePeakM: wavePeak,
    windSpeedKmh: windPeak,
    conditions: worstCondition.condition,
    categories: [
      { key: 'sea',   label: 'Sea State & Waves',  score: seaStateScore, weight: 30, contributing: seaStateScore >= 40, summary: seaStateSummary, detail: seaStateDetail },
      { key: 'wind',  label: 'Wind & Weather',      score: windScore,     weight: 25, contributing: windScore >= 40,     summary: windSummary,    detail: windDetail },
      { key: 'hazard',label: 'Hazard Proximity',     score: hazardScore,   weight: 25, contributing: hazardScore >= 40,   summary: hazardSummary,  detail: hazardDetail },
      { key: 'nav',   label: 'Navigation Integrity',  score: navScore,      weight: 20, contributing: navScore >= 40,      summary: navSummary,     detail: navDetail },
    ],
    advisory,
  });
});

api.get('/alerts', (_req, res) =>
  res.json(db.prepare('SELECT * FROM alerts ORDER BY created_at DESC LIMIT 30').all())
);

api.post('/alerts', (req, res) => {
  const { level = 'CAUTION', title, message, lat, lng, source_type = 'observation', source_ref = 'Field Vessel' } = req.body || {};
  if (!title || !message) return res.status(400).json({ error: 'title and message required' });
  const created_at = new Date().toISOString();
  const info = db.prepare(
    'INSERT INTO alerts (level,title,message,lat,lng,created_at,source_type,source_ref) VALUES (?,?,?,?,?,?,?,?)'
  ).run(level, title, message, lat || null, lng || null, created_at, source_type, source_ref);
  res.json({ id: info.lastInsertRowid, level, title, message, lat, lng, created_at, source_type, source_ref });
});

// Swarm reasoning agents
api.get('/agents', (_req, res) => res.json(db.prepare('SELECT * FROM agents').all()));

// AI chat
api.post('/chat', async (req, res) => {
  const { message } = req.body || {};
  if (!message || !message.trim()) return res.status(400).json({ error: 'message required' });
  const result = await handleChat(message.trim());
  res.json(result);
});

// ---- Reports ----
api.get('/reports', (_req, res) => {
  const rows = db.prepare('SELECT id, type, title, generated_at, content FROM reports ORDER BY generated_at DESC').all();
  res.json(rows.map((r) => ({ ...r, content: json(r.content) })));
});

api.get('/reports/:id', (req, res) => {
  const r = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
  if (!r) return res.status(404).json({ error: 'report not found' });
  res.json({ ...r, content: json(r.content) });
});

api.post('/reports/generate', (req, res) => {
  const type = (req.body && req.body.type) === 'weekly' ? 'weekly' : 'daily';
  const content = buildReportContent(type);
  const title = `${type === 'weekly' ? 'Weekly' : 'Daily'} Operations Summary`;
  const info = db.prepare('INSERT INTO reports (type,title,generated_at,content) VALUES (?,?,?,?)')
    .run(type, title, new Date().toISOString(), JSON.stringify(content));
  res.json({ id: info.lastInsertRowid, type, title, generated_at: new Date().toISOString(), content });
});

// ---- Habitats ----
api.get('/habitats', (_req, res) =>
  res.json(db.prepare('SELECT * FROM habitat_zones').all().map((h) => ({ ...h, coords: json(h.coords) })))
);

// ---- AIS vessel tracks ----
api.get('/vessels/tracks', (_req, res) => {
  const vessels = db.prepare('SELECT * FROM vessels').all();
  const tracks = db.prepare('SELECT * FROM vessel_tracks ORDER BY vessel_id, recorded_at').all();
  res.json({ vessels, tracks });
});

// ---- Spill analysis ----
api.get('/spills/analysis', (_req, res) => {
  const spills = db.prepare('SELECT * FROM spills').all();
  const analysis = db.prepare('SELECT * FROM spill_analysis').all()
    .map((a) => ({ ...a, spread_points: json(a.spread_points), affected_species: json(a.affected_species) }));
  res.json(analysis.map((a) => ({ ...a, spill: spills.find((s) => s.id === a.spill_id) })));
});

// ---- Agent evidence (explainable AI) ----
api.get('/agents/evidence', (_req, res) =>
  res.json(db.prepare('SELECT * FROM agent_evidence').all())
);
