import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import logo from './assets/header-logo-themed.png';
import { Compass, Plus, Fish, Droplets, Cpu, Activity } from 'lucide-react';
import { io } from 'socket.io-client';
import { get } from './api';
import type {
  PfzZone, Spill, Debris, Boundary, Corridor, Alert,
  WeatherPoint, Agent, Safety, Stats, LiveSnapshot,
  HabitatZone, SpillAnalysis, AgentEvidence, VesselTrack, Report
} from './api';

// Subcomponents for all 16 BlueCurrent features
import { MarineChatbot } from './components/MarineChatbot';
import { MultiAgentDesignView } from './components/MultiAgentDesignView';
import { UnifiedMarineMap } from './components/UnifiedMarineMap';
import { ObservationLogger } from './components/ObservationLogger';
import { OperationalReportsView } from './components/OperationalReportsView';
import { PFZRecommendationsView } from './components/PFZRecommendationsView';
import { HabitatMappingView } from './components/HabitatMappingView';
import { MarineSafetyScoreView } from './components/MarineSafetyScoreView';
import { HazardAlertPanel } from './components/HazardAlertPanel';
import { SmartGeofencingView } from './components/SmartGeofencingView';
import { SafeRouteOptimizer } from './components/SafeRouteOptimizer';
import { OilSpillWorkspace } from './components/OilSpillWorkspace';
import { AISVesselCorrelation } from './components/AISVesselCorrelation';
import { UnderwaterSonarAnomaly } from './components/UnderwaterSonarAnomaly';
import { OfflineModeStatus } from './components/OfflineModeStatus';
import { ExplainableAIEvidence } from './components/ExplainableAIEvidence';
import {
  AuroraBackground, CountUp, MagneticButton,
  SplitFlapText, TiltedCard, OceanRippleCursor,
} from './components/effects';

// Live WebSocket connection
const socket = io(import.meta.env.VITE_WS_URL || undefined);

type ActiveTab =
  | 'home'
  | 'map'
  | 'pfz'
  | 'habitats'
  | 'safety'
  | 'alerts'
  | 'spills'
  | 'debris'
  | 'routes'
  | 'vessels'
  | 'geofences'
  | 'swarm'
  | 'evidence'
  | 'reports';


export function App() {
  const [currentTab, setCurrentTab] = useState<ActiveTab>('home');
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [geotagModalOpen, setGeotagModalOpen] = useState<boolean>(false);
  const [geotagCoords, setGeotagCoords] = useState<[number, number]>([18.42, 84.25]);

  // Route prefill states
  const [routeTargetCoords, setRouteTargetCoords] = useState<[number, number] | null>(null);
  const [routeTargetName, setRouteTargetName] = useState<string | null>(null);

  // Core Data States
  const [stats, setStats] = useState<Stats | null>(null);
  const [pfz, setPfz] = useState<PfzZone[]>([]);
  const [weather, setWeather] = useState<WeatherPoint[]>([]);
  const [spills, setSpills] = useState<Spill[]>([]);
  const [debris, setDebris] = useState<Debris[]>([]);
  const [boundaries, setBoundaries] = useState<Boundary[]>([]);
  const [corridors, setCorridors] = useState<Corridor[]>([]);
  const [vessels, setVessels] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [safety, setSafety] = useState<Safety | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [habitats, setHabitats] = useState<HabitatZone[]>([]);
  const [spillAnalyses, setSpillAnalyses] = useState<SpillAnalysis[]>([]);
  const [evidence, setEvidence] = useState<AgentEvidence[]>([]);
  const [vesselTracks, setVesselTracks] = useState<VesselTrack[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  // Load All Primary Telemetry
  const fetchAllData = useCallback(async () => {
    try {
      const [
        statsData,
        intelData,
        safetyData,
        alertsData,
        agentsData,
        habitatsData,
        spillAnalysisData,
        evidenceData,
        tracksData,
        reportsData,
      ] = await Promise.all([
        get<Stats>('/api/stats').catch(() => null),
        get<any>('/api/intel').catch(() => null),
        get<Safety>('/api/safety').catch(() => null),
        get<Alert[]>('/api/alerts').catch(() => []),
        get<Agent[]>('/api/agents').catch(() => []),
        get<HabitatZone[]>('/api/habitats').catch(() => []),
        get<SpillAnalysis[]>('/api/spills/analysis').catch(() => []),
        get<AgentEvidence[]>('/api/agents/evidence').catch(() => []),
        get<{ vessels: any[]; tracks: VesselTrack[] }>('/api/vessels/tracks').catch(() => null),
        get<Report[]>('/api/reports').catch(() => []),
      ]);

      if (statsData) setStats(statsData);
      if (intelData) {
        if (intelData.pfz) setPfz(intelData.pfz);
        if (intelData.weather) setWeather(intelData.weather);
        if (intelData.spills) setSpills(intelData.spills);
        if (intelData.debris) setDebris(intelData.debris);
        if (intelData.boundaries) setBoundaries(intelData.boundaries);
        if (intelData.corridors) setCorridors(intelData.corridors);
      }
      if (safetyData) setSafety(safetyData);
      if (alertsData) setAlerts(alertsData);
      if (agentsData) setAgents(agentsData);
      if (habitatsData) setHabitats(habitatsData);
      if (spillAnalysisData) setSpillAnalyses(spillAnalysisData);
      if (evidenceData) setEvidence(evidenceData);
      if (tracksData) {
        if (tracksData.vessels) setVessels(tracksData.vessels);
        if (tracksData.tracks) setVesselTracks(tracksData.tracks);
      }
      if (reportsData) setReports(reportsData);
    } catch (e) {
      console.error('Initial data fetch error', e);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Live WebSocket streaming listener
  useEffect(() => {
    const onLive = (snap: LiveSnapshot) => {
      if (snap.vessels && snap.vessels.length) setVessels(snap.vessels);
      if (snap.debris && snap.debris.length) setDebris(snap.debris);
      if (snap.alerts && snap.alerts.length) setAlerts(snap.alerts);
      if (snap.weather && snap.weather.length) setWeather(snap.weather);
    };
    socket.on('live', onLive);
    return () => {
      socket.off('live', onLive);
    };
  }, []);

  const handleOpenGeotag = (coords?: [number, number]) => {
    if (coords) setGeotagCoords(coords);
    setGeotagModalOpen(true);
  };

  const handlePlanRouteToZone = (lat: number, lng: number, name: string) => {
    setRouteTargetCoords([lat, lng]);
    setRouteTargetName(name);
    setCurrentTab('routes');
  };

  // Navigation grouped into labeled dropdown menus so the top bar stays compact.
  // Home stays a direct link; the remaining tabs live inside 4 group menus.
  const navGroups: Array<{
    id: string;
    label: string;
    items: Array<{ id: ActiveTab; label: string; alert?: boolean }>;
  }> = [
      {
        id: 'discover',
        label: 'Discover',
        items: [
          { id: 'map', label: 'Unified GIS Map' },
          { id: 'pfz', label: 'PFZ Fisheries' },
          { id: 'habitats', label: 'Fish Habitats' },
        ],
      },
      {
        id: 'safety',
        label: 'Safety',
        items: [
          { id: 'safety', label: 'Safety Score' },
          { id: 'alerts', label: 'Hazard Alerts', alert: alerts.some((a) => a.level === 'HIGH') },
          { id: 'spills', label: 'Oil Spill SAR' },
          { id: 'debris', label: 'Sonar Debris' },
        ],
      },
      {
        id: 'fleet',
        label: 'Fleet',
        items: [
          { id: 'routes', label: 'Safe Routes' },
          { id: 'vessels', label: 'AIS Fleet' },
          { id: 'geofences', label: 'Geofencing' },
        ],
      },
      {
        id: 'ai',
        label: 'AI Insights',
        items: [
          { id: 'swarm', label: 'AI Swarm' },
          { id: 'evidence', label: 'Explainable AI' },
          { id: 'reports', label: 'Ops Reports' },
        ],
      },
    ];

  // Which group menu is currently open (click-to-toggle); null = all closed.
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  return (
    <div className="app-bg">
      {/* Animated ocean-depth aurora glow (reactbits Aurora-inspired, CSS-only) */}
      <AuroraBackground />

      {/* Marine-themed cursor ripple trail — lightweight CSS-only, runs behind content */}
      <OceanRippleCursor />

      {/* Low-Connectivity / Offline Mode Bar (Feature 15) */}
      <OfflineModeStatus
        isOffline={isOffline}
        setIsOffline={setIsOffline}
        onSyncComplete={fetchAllData}
      />

      {/* Navigation Header */}
      <nav className="app-nav anim-fade-only">
        <div className="nav-brand" onClick={() => setCurrentTab('home')}>
          <img src={logo} alt="BlueCurrent" style={{ height: 82, width: 'auto' }} />
        </div>

        <div className="nav-links">
          <button
            className={currentTab === 'home' ? 'nav-link-active' : 'nav-link'}
            onClick={() => setCurrentTab('home')}
          >
            Home
          </button>

          {navGroups.map((group) => {
            const tabActive = group.items.some((t) => t.id === currentTab);
            const groupAlert = group.items.some((t) => t.alert);
            const open = openGroup === group.id;
            const btnClass = [
              'nav-group-btn',
              tabActive ? 'nav-group-btn-active' : '',
              open ? 'nav-group-btn-open' : '',
            ].filter(Boolean).join(' ');
            return (
              <div className="nav-group" key={group.id}>
                <button
                  className={btnClass}
                  aria-expanded={open}
                  onClick={() => setOpenGroup(open ? null : group.id)}
                >
                  {group.label}
                  {groupAlert && <span className="nav-alert-dot" />}
                  <span className={`nav-group-caret${open ? ' nav-group-caret-open' : ''}`}>▾</span>
                </button>
                {open && (
                  <div className="nav-group-menu">
                    {group.items.map((tab) => (
                      <button
                        key={tab.id}
                        className={currentTab === tab.id ? 'nav-group-item-active' : 'nav-group-item'}
                        onClick={() => {
                          setCurrentTab(tab.id);
                          setOpenGroup(null);
                        }}
                      >
                        {tab.label}
                        {tab.alert && <span className="nav-alert-dot" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {openGroup && <div className="nav-menu-backdrop" onClick={() => setOpenGroup(null)} />}
        </div>
      </nav>

      {/* Main Content Router */}
      <main className="main-content">
        {currentTab === 'home' && (
          <HomeScreen
            stats={stats}
            safety={safety}
            weather={weather}
            alerts={alerts}
            agents={agents}
            setTab={setCurrentTab}
            onOpenGeotag={() => handleOpenGeotag()}
          />
        )}

        {/* Feature 3: Unified Interactive Marine Map & Feature 10: Smart Geofencing */}
        {currentTab === 'map' && (
          <UnifiedMarineMap
            pfz={pfz}
            weather={weather}
            spills={spills}
            debris={debris}
            boundaries={boundaries}
            corridors={corridors}
            vessels={vessels}
            habitats={habitats}
            alerts={alerts}
            onOpenGeotagModal={handleOpenGeotag}
          />
        )}

        {/* Feature 6: Potential Fishing Zone (PFZ) recommendations */}
        {currentTab === 'pfz' && (
          <PFZRecommendationsView
            zones={pfz}
            onPlanRouteToZone={handlePlanRouteToZone}
          />
        )}

        {/* Feature 7: Fish reproductive-habitat mapping */}
        {currentTab === 'habitats' && (
          <HabitatMappingView
            habitats={habitats}
          />
        )}

        {/* Feature 8: Marine safety score */}
        {currentTab === 'safety' && (
          <MarineSafetyScoreView
            safety={safety}
          />
        )}

        {/* Feature 9: Real-time hazard alert panel */}
        {currentTab === 'alerts' && (
          <HazardAlertPanel
            alerts={alerts}
            onOpenGeotagModal={() => handleOpenGeotag()}
          />
        )}

        {/* Feature 12: Oil-spill detection workspace */}
        {currentTab === 'spills' && (
          <OilSpillWorkspace
            spills={spills}
            spillAnalyses={spillAnalyses}
          />
        )}

        {/* Feature 14: Underwater debris / sonar-anomaly detection */}
        {currentTab === 'debris' && (
          <UnderwaterSonarAnomaly
            debris={debris}
          />
        )}

        {/* Feature 11: Safe-route optimization */}
        {currentTab === 'routes' && (
          <SafeRouteOptimizer
            corridors={corridors}
            spills={spills}
            targetCoords={routeTargetCoords}
            targetName={routeTargetName}
          />
        )}

        {/* Feature 13: AIS vessel-correlation workflow */}
        {currentTab === 'vessels' && (
          <AISVesselCorrelation
            vessels={vessels}
            tracks={vesselTracks}
          />
        )}

        {/* Feature 10: Smart geofencing */}
        {currentTab === 'geofences' && (
          <SmartGeofencingView
            boundaries={boundaries}
            vessels={vessels}
          />
        )}

        {/* Feature 2: Multi-agent AI status/design view */}
        {currentTab === 'swarm' && (
          <MultiAgentDesignView
            agents={agents}
          />
        )}

        {/* Feature 16: Explainable AI confidence and evidence display */}
        {currentTab === 'evidence' && (
          <ExplainableAIEvidence
            evidence={evidence}
          />
        )}

        {/* Feature 5: Automated operational reports */}
        {currentTab === 'reports' && (
          <OperationalReportsView
            reports={reports}
            onReportGenerated={fetchAllData}
          />
        )}
      </main>

      {/* Feature 4: Automatic Geotagging Modal */}
      <ObservationLogger
        isOpen={geotagModalOpen}
        onClose={() => setGeotagModalOpen(false)}
        defaultCoords={geotagCoords}
        isOffline={isOffline}
        onObservationAdded={fetchAllData}
      />

      {/* Feature 1: Marine AI Chatbot Interface */}
      <MarineChatbot />
    </div>
  );
}

export default App;

/* Gradient backdrop for the tilted feature tiles (inline SVG data-URI) */
const tileBg = (c1: string, c2: string) =>
  `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='160'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs><rect width='240' height='160' fill='url(%23g)'/></svg>`;

/* Home Dashboard Component */
interface HomeScreenProps {
  stats: Stats | null;
  safety: Safety | null;
  weather: WeatherPoint[];
  alerts: Alert[];
  agents: Agent[];
  setTab: (t: ActiveTab) => void;
  onOpenGeotag: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ stats, safety, weather, alerts, agents, setTab, onOpenGeotag }) => {
  // Sea-state readout for the console (falls back to nominal values)
  const wx = weather && weather.length > 0 ? weather[0] : undefined;
  const sst = wx?.sst_c ?? 27.4;
  const waveHt = wx?.wave_height_m ?? 1.8;
  const windSpd = wx?.wind_speed_kmh ?? 24;
  const seaCondition = wx?.condition ?? 'MODERATE CAUTION';
  const conditionColor =
    seaCondition.includes('HIGH') ? 'var(--accent-red)'
    : seaCondition.includes('CAUTION') ? 'var(--accent-amber)'
    : 'var(--accent-teal)';

  // Combined live event feed: agents first, then alerts
  const feed: Array<{ key: string; title: string; sub: string; meta: string; color: string }> = [
    ...agents.map((a) => ({
      key: `agent-${a.id}`,
      title: a.name,
      sub: a.message,
      meta: `${a.status} · ${a.source} · ${a.latency_ms}ms`,
      color: a.status === 'VERIFIED' ? 'var(--accent-teal)'
        : a.status === 'ALERT' ? 'var(--accent-red)' : 'var(--accent-amber)',
    })),
    ...alerts.map((al) => ({
      key: `alert-${al.id}`,
      title: al.title,
      sub: al.message,
      meta: `${al.level} · ${al.source_type || 'field log'}`,
      color: al.level === 'HIGH' ? 'var(--accent-red)'
        : al.level === 'CAUTION' ? 'var(--accent-amber)' : 'var(--accent-teal)',
    })),
  ];

  const highThreats = alerts.filter((a) => a.level === 'HIGH').length;

  const kpis = [
    { label: 'Fleet Guided', value: stats?.vesselsGuided ?? 12, suffix: stats?.vesselsGuided ? '+' : 'K+', color: 'var(--accent-teal)', tab: 'vessels' as ActiveTab },
    { label: 'PFZ Zones', value: stats?.pfzZones ?? 4, suffix: '', color: 'var(--accent-blue)', tab: 'pfz' as ActiveTab },
    { label: 'Threat Logs', value: stats?.hazardLogs ?? 3, suffix: '', color: 'var(--accent-amber)', tab: 'alerts' as ActiveTab },
    { label: 'Risk Index', value: safety?.score ?? 38, suffix: '/100', color: safety && safety.score > 50 ? 'var(--accent-amber)' : 'var(--accent-teal)', tab: 'safety' as ActiveTab },
  ];

  return (
    <div className="anim-fade home-hero" style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', padding: '0 6px', gap: 14 }}>

        {/* ── Top strip: version tag + live status ── */}
        <div className="anim-fade anim-d1" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            v2.4 — INCOIS · Sentinel-1 · Bay of Bengal
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-teal)' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent-teal)', boxShadow: '0 0 8px rgba(0,212,170,0.4)' }} />
            <SplitFlapText words={['SYSTEMS ONLINE', 'SONAR ACTIVE', 'FEEDS LIVE']} loop cycleDelay={3000} fontSize={10} gap={2} tileRadius={3} tileColor="#0a1628" textColor="#00d4aa" flipDuration={0.14} stagger={35} />
          </span>
        </div>

        {/* ── Band 1: hero statement + sea-state console ── */}
        <div className="anim-fade anim-d2" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '26px', alignItems: 'stretch', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center', minWidth: 0, padding: '4px 0' }}>
            <h1 className="hero-h1" style={{ fontSize: '2.7rem', lineHeight: 1.04 }}>
              {'Autonomous Marine'.split(' ').map((w, i) => (
                <span className="split-word" key={i} style={{ animationDelay: `${0.1 + i * 0.08}s` }}>{w}</span>
              ))}
            </h1>
            <h1 className="hero-h1 gradient-text" style={{ fontSize: '2.7rem', lineHeight: 1.04 }}>
              {'Ocean Intelligence.'.split(' ').map((w, i) => (
                <span className="split-word" key={i} style={{ animationDelay: `${0.34 + i * 0.08}s` }}>{w}</span>
              ))}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, maxWidth: 440, marginTop: 2 }}>
              Multi-agent situational awareness fusing satellite SAR, bathymetric sonar, AIS fleet trajectories, and INCOIS fishery predictions.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: 4 }}>
              <MagneticButton>
                <button className="btn-primary" onClick={() => setTab('map')}><Compass size={15} /> Launch GIS Map</button>
              </MagneticButton>
              <MagneticButton>
                <button className="btn-secondary" onClick={onOpenGeotag}><Plus size={14} /> Geotag Observation</button>
              </MagneticButton>
            </div>
          </div>

          {/* Sea-state console */}
          <div className="surface-elevated" style={{ padding: '13px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span className="label-caps" style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--accent-teal)' }}><Activity size={10} style={{ verticalAlign: '-1px', marginRight: 3 }} /> Sea State — 18.4°N 84.2°E</span>
              <SplitFlapText words={[seaCondition, 'CONDITIONS NOMINAL', 'SIGNAL LIVE']} loop cycleDelay={2600} fontSize={10} gap={2} tileRadius={3} tileColor="#0a1628" textColor="#00d4aa" flipDuration={0.14} stagger={35} />
            </div>
            {[
              { label: 'Sea Temperature', value: `${sst.toFixed(1)}°C`, color: 'var(--accent-teal)' },
              { label: 'Wave Height', value: `${waveHt.toFixed(1)} m`, color: 'var(--accent-cyan)' },
              { label: 'Wind Speed', value: `${windSpd.toFixed(0)} km/h`, color: 'var(--accent-blue)' },
              { label: 'Conditions', value: seaCondition, color: conditionColor },
            ].map((row, i) => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 2px', borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)', fontSize: '0.72rem' }}>
                <span className="label-caps" style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: row.color, fontSize: '0.78rem' }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Band 2: KPI strip ── */}
        <div className="anim-fade anim-d3" style={{ display: 'flex', alignItems: 'center', flexShrink: 0, borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
          {kpis.map((k, i) => (
            <button
              key={k.label}
              onClick={() => setTab(k.tab)}
              style={{
                flex: 1, display: 'flex', alignItems: 'baseline', gap: 10, cursor: 'pointer',
                background: 'transparent', border: 'none', padding: '4px 16px',
                borderLeft: i === 0 ? 'none' : '1px solid var(--border-subtle)',
              }}
            >
              <span className="stat-number" style={{ fontSize: '1.3rem', color: k.color }}>
                <CountUp to={k.value} suffix={k.suffix} duration={1.4} separator />
              </span>
              <span className="label-caps" style={{ color: 'var(--text-secondary)' }}>{k.label}</span>
            </button>
          ))}
        </div>

        {/* ── Band 3: feature tiles + live feed ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '14px', flex: '1 1 auto', minHeight: 0 }}>

          {/* Left: asymmetric feature tiles (rich content + cursor-follow tilt) */}
          <div className="anim-fade anim-d4" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', minHeight: 0 }}>
            <TiltedCard
              imageSrc={tileBg('%230d2b4a', '%23043a2c')}
              altText="PFZ Fisheries"
              containerHeight="100%"
              containerWidth="100%"
              imageWidth="100%"
              imageHeight="100%"
              rotateAmplitude={14}
              scaleOnHover={1.04}
              showMobileWarning={false}
              showTooltip={false}
              displayOverlayContent
              overlayContent={
                <div style={{ padding: '16px', cursor: 'pointer', height: '100%', boxSizing: 'border-box', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }} onClick={() => setTab('pfz')}>
                  <div>
                    <div style={{ color: 'var(--accent-teal)', marginBottom: 8 }}><Fish size={18} /></div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>PFZ Fisheries</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.45 }}>
                      Satellite yield ranks scored against SST, chlorophyll and historical catch.
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--accent-teal)', lineHeight: 1 }}><CountUp to={stats?.pfzZones ?? 4} duration={1.4} /> <span style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.06em', color: 'var(--text-muted)' }}>ACTIVE ZONES</span></div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.56rem', color: 'var(--text-muted)', letterSpacing: '0.08em', marginTop: 10 }}>72H FORECAST · SENTINEL-3</div>
                  </div>
                </div>
              }
            />

            <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '12px' }}>
              <TiltedCard
                imageSrc={tileBg('%23230e16', '%2335080e')}
                altText="Oil Spill SAR"
                containerHeight="100%"
                containerWidth="100%"
                imageWidth="100%"
                imageHeight="100%"
                rotateAmplitude={14}
                scaleOnHover={1.04}
                showMobileWarning={false}
                showTooltip={false}
                displayOverlayContent
                overlayContent={
                  <div style={{ padding: '14px', cursor: 'pointer', height: '100%', boxSizing: 'border-box', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 0 }} onClick={() => setTab('spills')}>
                    <div>
                      <div style={{ color: 'var(--accent-red)', marginBottom: 6 }}><Droplets size={15} /></div>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>Oil Spill SAR</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: 3 }}>Drift dispersion + SAR imaging</div>
                    </div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: highThreats > 0 ? 'var(--accent-red)' : 'var(--accent-amber)', lineHeight: 1 }}>{highThreats}<span style={{ fontSize: '0.62rem', fontWeight: 500, marginLeft: 6, letterSpacing: '0.06em', color: 'var(--text-muted)' }}>THREATS</span></div>
                  </div>
                }
              />
              <TiltedCard
                imageSrc={tileBg('%231a1226', '%232b0f38')}
                altText="AI Swarm Engine"
                containerHeight="100%"
                containerWidth="100%"
                imageWidth="100%"
                imageHeight="100%"
                rotateAmplitude={14}
                scaleOnHover={1.04}
                showMobileWarning={false}
                showTooltip={false}
                displayOverlayContent
                overlayContent={
                  <div style={{ padding: '14px', cursor: 'pointer', height: '100%', boxSizing: 'border-box', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 0 }} onClick={() => setTab('swarm')}>
                    <div>
                      <div style={{ color: 'var(--accent-purple)', marginBottom: 6 }}><Cpu size={15} /></div>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>AI Swarm</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: 3 }}>Multi-agent consensus engine</div>
                    </div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-purple)', lineHeight: 1 }}>{agents.length}<span style={{ fontSize: '0.62rem', fontWeight: 500, marginLeft: 6, letterSpacing: '0.06em', color: 'var(--text-muted)' }}>AGENTS ONLINE</span></div>
                  </div>
                }
              />
            </div>
          </div>

          {/* Right: live event feed (scrollable — legally absorbs remaining height) */}
          <div className="anim-fade anim-d5 surface-elevated" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
              <span className="label-caps" style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--accent-teal)' }}><Activity size={10} style={{ verticalAlign: '-1px', marginRight: 3 }} /> Live Event Feed</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>{feed.length} EVENTS</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1, minHeight: 0 }}>
              {feed.length === 0 && (
                <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Awaiting telemetry…</div>
              )}
              {feed.map((item) => (
                <div key={item.key} style={{ display: 'flex', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: item.color, marginTop: 5, flexShrink: 0, boxShadow: `0 0 6px ${item.color}` }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.title}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: 2 }}>{item.sub}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.56rem', color: 'var(--text-muted)', letterSpacing: '0.04em', marginTop: 4 }}>{item.meta}</div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setTab('reports')}
              className="surface-card"
              style={{ margin: 8, padding: '7px', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', flexShrink: 0 }}
            >
              Open mission reports →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
