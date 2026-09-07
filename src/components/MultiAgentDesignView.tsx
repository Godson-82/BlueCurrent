import React, { useState } from 'react';
import { Cpu, Waves, CloudLightning, Shield, Droplets, Fish, CheckCircle2, Activity, Database, Server } from 'lucide-react';
import { type Agent } from '../api';
import { SpotlightCard, CountUp } from './effects';

interface MultiAgentDesignViewProps {
  agents: Agent[] | null;
}

export const MultiAgentDesignView: React.FC<MultiAgentDesignViewProps> = ({ agents: _agents }) => {
  const [selectedAgent, setSelectedAgent] = useState<string>('Oceanography Agent');

  const swarmAgents = [
    {
      name: 'Master Swarm Orchestrator',
      role: 'Consensus & Multi-Modal Fusion',
      status: 'ONLINE',
      model: 'BlueCurrent-Swarm-v2.4 (Claude / Llama-3.3)',
      latency_ms: 15,
      source: 'Global Fusion Bus',
      desc: 'Orchestrates real-time weighting, dispute resolution between oceanographic and meteorological inputs, and outputs verified vessel directives.',
      icon: <Cpu size={20} color="var(--accent-teal)" />,
      badge: 'badge-teal',
    },
    {
      name: 'Oceanography Agent',
      role: 'SST & Plankton Biomass Analysis',
      status: 'VERIFIED',
      model: 'Sentinel-3 SLSTR + OLCI L2P',
      latency_ms: 12,
      source: 'Copernicus Sentinel-3 Feed',
      desc: 'Monitors sea surface temperature gradients, thermal fronts, and chlorophyll blooms to pinpoint Pelagic and Demersal fishing aggregations.',
      icon: <Waves size={20} color="var(--accent-teal)" />,
      badge: 'badge-teal',
    },
    {
      name: 'Weather & Ocean State Agent',
      role: 'Wave Dynamics & Gale Warnings',
      status: 'MONITORING',
      model: 'NOAA GFS + WaveWatch III',
      latency_ms: 18,
      source: 'NOAA NCEP 00Z Model Run',
      desc: 'Continuously models significant wave height (Hs), wind shear, squall trajectories, and calculates composite risk indices for vessel navigation.',
      icon: <CloudLightning size={20} color="var(--accent-blue)" />,
      badge: 'badge-blue',
    },
    {
      name: 'Security & Border Agent',
      role: 'EEZ Geofencing & AIS Verification',
      status: 'VERIFIED',
      model: 'AIS Stream + Geofence Polygons',
      latency_ms: 8,
      source: 'Coastal Radar & Satellite AIS',
      desc: 'Enforces territorial waters and exclusive economic zone boundaries, detects AIS dark vessel anomalies, and alerts on unauthorized transits.',
      icon: <Shield size={20} color="var(--accent-purple)" />,
      badge: 'badge-purple',
    },
    {
      name: 'Spill & Hazard Response Agent',
      role: 'Synthetic Aperture Radar Slick Detection',
      status: 'ACTIVE',
      model: 'Sentinel-1 SAR Slick Classifier',
      latency_ms: 22,
      source: 'SAR Radar Imagery',
      desc: 'Identifies oil sheens and chemical spills, calculates drift spread vectors based on ocean currents, and models coastal impact zones.',
      icon: <Droplets size={20} color="var(--accent-red)" />,
      badge: 'badge-red',
    },
    {
      name: 'Fisheries & Habitat Agent',
      role: 'Reproductive Grounds & Moratorium Compliance',
      status: 'STANDBY',
      model: 'Marine Biology Spawning Index',
      latency_ms: 14,
      source: 'Fishery Survey Data & CMFRI',
      desc: 'Assesses seasonal spawning windows, protects nursery estuaries, and recommends high-yield harvesting zones outside protected breeding seasons.',
      icon: <Fish size={20} color="var(--accent-amber)" />,
      badge: 'badge-amber',
    },
  ];

  const activeAgent = swarmAgents.find((a) => a.name === selectedAgent) || swarmAgents[0];

  return (
    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexShrink: 0 }}>
        <div>
          <h2 className="section-title">Multi-Agent AI Swarm Architecture</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Autonomous distributed agents continuously observing, verifying, and cross-validating maritime telemetry.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="badge badge-teal"><Activity size={11} /> 6 Active Micro-Agents</span>
          <span className="badge badge-purple"><Server size={11} /> Swarm Consensus 99.2%</span>
        </div>
      </div>

      {/* Swarm Topology Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '18px', flex: 1, minHeight: 0, overflow: 'auto' }}>
        <div>
          <div className="label-caps" style={{ marginBottom: '12px' }}>Swarm Node Grid</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
            {swarmAgents.map((ag, i) => {
              const isSelected = ag.name === selectedAgent;
              return (
                <SpotlightCard key={i} spotlightColor={isSelected ? 'rgba(0,212,170,0.16)' : 'rgba(0,212,170,0.08)'}>
                <div
                  className={`agent-node-card anim-slide-l anim-d${i + 1}`}
                  style={{
                    borderColor: isSelected ? 'var(--accent-teal)' : undefined,
                    boxShadow: isSelected ? '0 0 20px rgba(0,212,170,0.15)' : undefined,
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelectedAgent(ag.name)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {ag.icon}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{ag.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{ag.role}</div>
                      </div>
                    </div>
                    <span className={`badge ${ag.badge}`}>{ag.status}</span>
                  </div>

                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '10px 0' }}>
                    {ag.desc}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span><Database size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />{ag.source}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-teal)' }}>{ag.latency_ms}ms</span>
                  </div>
                </div>
                </SpotlightCard>
              );
            })}
          </div>

          {/* Real-time agent decision log */}
          <div className="terminal anim-fade anim-d4" style={{ marginTop: '12px' }}>
            <div className="terminal-header">
              <span className="terminal-dot" style={{ background: 'var(--accent-red)' }} />
              <span className="terminal-dot" style={{ background: 'var(--accent-amber)' }} />
              <span className="terminal-dot" style={{ background: 'var(--accent-teal)' }} />
              <span className="label-caps" style={{ marginLeft: 8 }}>swarm-orchestrator-telemetry.stream</span>
            </div>
            <div className="terminal-body">
              <div style={{ color: 'var(--accent-teal)' }}>
                [T-00:02] [Master Orchestrator] Polling 6 micro-agents. Heartbeat OK (14ms aggregate latency).
              </div>
              <div style={{ color: 'var(--accent-blue)' }}>
                [T-00:01] [Oceanography] Sentinel-3 OLCI product ingested. Chlorophyll patch 4.2mg/m³ verified at 18.5°N, 84.3°E.
              </div>
              <div style={{ color: 'var(--accent-amber)' }}>
                [T-00:01] [Weather] GFS 180°/18kt wind shear alert dispatched to Safety Engine.
              </div>
              <div style={{ color: 'var(--accent-purple)' }}>
                [T-00:00] [Security] Geofence polygon 18.9°N, 84.9°E scanned. 0 unauthorized AIS transponders.
              </div>
              <div style={{ color: 'var(--text-secondary)' }} className="terminal-cursor">
                [T-NOW] [Consensus Bus] All safety invariants satisfied. Fleet routing broadcast active.
              </div>
            </div>
          </div>
        </div>

        {/* Selected Agent Inspector Drawer */}
        <div>
          <div className="label-caps" style={{ marginBottom: '12px' }}>Agent Telemetry Inspector</div>
          <div className="surface-elevated" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: 44, height: 44, borderRadius: '10px', background: 'rgba(0,212,170,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {activeAgent.icon}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>{activeAgent.name}</h3>
                <span className={`badge ${activeAgent.badge}`} style={{ marginTop: '4px' }}>{activeAgent.status}</span>
              </div>
            </div>

            <div className="surface-inset" style={{ padding: '12px 14px' }}>
              <div className="label-caps">Inference Engine / Architecture</div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--accent-teal)', marginTop: '4px' }}>
                {activeAgent.model}
              </div>
            </div>

            <div className="surface-inset" style={{ padding: '12px 14px' }}>
              <div className="label-caps">Primary Data Pipeline</div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '4px' }}>
                {activeAgent.source}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="surface-inset" style={{ padding: '10px 12px' }}>
                <div className="label-caps">Response Latency</div>
                <div className="stat-number" style={{ fontSize: '1.2rem', color: 'var(--accent-teal)' }}><CountUp to={activeAgent.latency_ms} suffix=" ms" duration={1.2} /></div>
              </div>
              <div className="surface-inset" style={{ padding: '10px 12px' }}>
                <div className="label-caps">Confidence Factor</div>
                <div className="stat-number" style={{ fontSize: '1.2rem', color: 'var(--accent-blue)' }}><CountUp to={97.8} suffix="%" decimals={1} duration={1.4} /></div>
              </div>
            </div>

            <div>
              <div className="label-caps" style={{ marginBottom: '6px' }}>Functional Responsibility</div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {activeAgent.desc}
              </p>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
              <div className="label-caps" style={{ marginBottom: '8px' }}>Security &amp; Health Invariant</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--accent-teal)' }}>
                <CheckCircle2 size={14} /> Autonomous fault-tolerant failover active
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
