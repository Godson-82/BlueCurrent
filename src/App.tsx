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
  Topography, SplitFlapText, TiltedCard, OceanRippleCursor,
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
  setTab: (t: ActiveTab) => void;
  onOpenGeotag: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ stats, safety, setTab, onOpenGeotag }) => {
  return (
    <div className="anim-fade home-hero" style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
      {/* Living bathymetry contour background (reactbits Topography) */}
      <Topography
        lowColor="#07263e"
        midColor="#00d4aa"
        highColor="#22d3ee"
        opacity={0.45}
        speed={0.8}
        morphSpeed={0.6}
        fillBands
        grain
        mouseInteraction={false}
        className="hero-topography"
      />
      <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'center', height: '100%' }}>
        <div>
          <div className="anim-fade anim-d1" style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(0, 212, 170, 0.07)', border: '1px solid rgba(0, 212, 170, 0.2)', padding: '5px 14px', borderRadius: 4, fontSize: '0.7rem', color: 'var(--accent-teal)', marginBottom: 12 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-teal)' }} />
              <span className="shiny-text">BlueCurrent Marine Intelligence Suite</span>
            </span>
          </div>

          <div className="anim-fade anim-d2">
            <h1 className="hero-h1">
              {'Autonomous Marine'.split(' ').map((w, i) => (
                <span className="split-word" key={i} style={{ animationDelay: `${0.1 + i * 0.1}s` }}>{w}</span>
              ))}
            </h1>
            <h1 className="hero-h1 gradient-text">
              {'Ocean Intelligence.'.split(' ').map((w, i) => (
                <span className="split-word" key={i} style={{ animationDelay: `${0.4 + i * 0.1}s` }}>{w}</span>
              ))}
            </h1>
          </div>

          <p className="anim-fade anim-d3" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, marginTop: 10, maxWidth: 460 }}>
            Real-time multi-agent situational awareness fusing satellite SAR, bathymetric sonar, AIS fleet trajectories, and INCOIS fishery predictions.
          </p>

          <div className="anim-fade anim-d4" style={{ display: 'flex', gap: '12px', marginTop: 16 }}>
            <MagneticButton>
              <button className="btn-primary" onClick={() => setTab('map')}>
                <Compass size={16} /> Launch Interactive GIS Map
              </button>
            </MagneticButton>
            <MagneticButton>
              <button className="btn-secondary" onClick={onOpenGeotag}>
                <Plus size={15} /> Auto-Geotag Observation
              </button>
            </MagneticButton>
          </div>

          {/* Feature quick tiles */}
          <div className="anim-fade anim-d6" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: 12 }}>
            <TiltedCard
              imageSrc={tileBg('%230d2b4a', '%23043a2c')}
              altText="PFZ Fisheries"
              containerHeight="150px"
              containerWidth="100%"
              imageWidth="100%"
              imageHeight="100%"
              rotateAmplitude={10}
              scaleOnHover={1.05}
              showMobileWarning={false}
              showTooltip={false}
              displayOverlayContent
              overlayContent={
                <div style={{ padding: '14px', cursor: 'pointer', height: '100%', boxSizing: 'border-box' }} onClick={() => setTab('pfz')}>
                  <div style={{ color: 'var(--accent-teal)', marginBottom: 6 }}><Fish size={18} /></div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>PFZ Fisheries</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>Satellite yield ranks</div>
                </div>
              }
            />
            <TiltedCard
              imageSrc={tileBg('%23230e16', '%2335080e')}
              altText="Oil Spill SAR"
              containerHeight="150px"
              containerWidth="100%"
              imageWidth="100%"
              imageHeight="100%"
              rotateAmplitude={10}
              scaleOnHover={1.05}
              showMobileWarning={false}
              showTooltip={false}
              displayOverlayContent
              overlayContent={
                <div style={{ padding: '14px', cursor: 'pointer', height: '100%', boxSizing: 'border-box' }} onClick={() => setTab('spills')}>
                  <div style={{ color: 'var(--accent-red)', marginBottom: 6 }}><Droplets size={18} /></div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Oil Spill SAR</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>Drift dispersion model</div>
                </div>
              }
            />
            <TiltedCard
              imageSrc={tileBg('%231a1226', '%232b0f38')}
              altText="AI Swarm Engine"
              containerHeight="150px"
              containerWidth="100%"
              imageWidth="100%"
              imageHeight="100%"
              rotateAmplitude={10}
              scaleOnHover={1.05}
              showMobileWarning={false}
              showTooltip={false}
              displayOverlayContent
              overlayContent={
                <div style={{ padding: '14px', cursor: 'pointer', height: '100%', boxSizing: 'border-box' }} onClick={() => setTab('swarm')}>
                  <div style={{ color: 'var(--accent-purple)', marginBottom: 6 }}><Cpu size={18} /></div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>AI Swarm Engine</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>Multi-agent consensus</div>
                </div>
              }
            />
          </div>
        </div>

        {/* Live Acoustic Sweep Radar HUD */}
        <div className="surface-elevated anim-fade anim-d3" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="label-caps"><Activity size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} /> Acoustic Bathymetric Sonar</span>
            <SplitFlapText words={['LIVE PING', 'ACOUSTIC LIVE', 'SIGNAL LIVE']} loop cycleDelay={2400} fontSize={15} gap={3} tileRadius={4} tileColor="#0a1628" textColor="#00d4aa" flipDuration={0.16} stagger={45} />
          </div>

          {/* Sonar Canvas */}
          <div className="sonar-container">
            <div className="sonar-crosshair" />
            <div className="sonar-rings">
              <span className="sonar-ring" />
              <span className="sonar-ring" />
              <span className="sonar-ring" />
              <span className="sonar-ring-pulse" />
              <span className="sonar-ring-pulse" />
            </div>
            <div className="sonar-sweep" />
            <span className="sonar-dot" style={{ top: '28%', left: '62%' }} />
            <span className="sonar-dot" style={{ top: '58%', left: '78%' }} />
            <span className="sonar-dot alert" style={{ top: '70%', left: '32%' }} />
            <span className="sonar-dot warning" style={{ top: '38%', left: '25%' }} />
            <div className="sonar-center" />
            <span className="sonar-label" style={{ top: '10%', left: '10%' }}>18.4°N</span>
            <span className="sonar-label" style={{ top: '10%', right: '10%' }}>84.2°E</span>
            <span className="sonar-label" style={{ bottom: '8%', left: '50%', transform: 'translateX(-50%)' }}>RADAR ACTIVE</span>
          </div>

          {/* Live Counters */}
          <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            <div className="surface-inset" style={{ padding: '10px', textAlign: 'center', cursor: 'pointer' }} onClick={() => setTab('vessels')}>
              <div className="label-caps">Fleet Guided</div>
              <div className="stat-number" style={{ fontSize: '1.2rem', color: 'var(--accent-teal)' }}>
                <CountUp to={stats?.vesselsGuided ?? 12} suffix={stats?.vesselsGuided ? '+' : 'K+'} duration={1.8} separator />
              </div>
            </div>
            <div className="surface-inset" style={{ padding: '10px', textAlign: 'center', cursor: 'pointer' }} onClick={() => setTab('pfz')}>
              <div className="label-caps">PFZ Zones</div>
              <div className="stat-number" style={{ fontSize: '1.2rem', color: 'var(--accent-blue)' }}>
                <CountUp to={stats?.pfzZones ?? 4} duration={1.4} />
              </div>
            </div>
            <div className="surface-inset" style={{ padding: '10px', textAlign: 'center', cursor: 'pointer' }} onClick={() => setTab('alerts')}>
              <div className="label-caps">Risk Level</div>
              <div className="stat-number" style={{ fontSize: '1.2rem', color: safety && safety.score > 50 ? 'var(--accent-amber)' : 'var(--accent-teal)' }}>
                <CountUp to={safety?.score ?? 38} suffix="/100" duration={1.6} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
