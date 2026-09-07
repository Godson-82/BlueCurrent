import React, { useState } from 'react';
import { Droplets, Fish } from 'lucide-react';
import { MapContainer, TileLayer, Circle, Polyline, Popup } from 'react-leaflet';
import type { Spill, SpillAnalysis } from '../api';

interface OilSpillWorkspaceProps {
  spills: Spill[];
  spillAnalyses: SpillAnalysis[];
}

export const OilSpillWorkspace: React.FC<OilSpillWorkspaceProps> = ({
  spills,
  spillAnalyses,
}) => {
  const [selectedSpillId, setSelectedSpillId] = useState<number | null>(spills[0]?.id || null);

  const activeSpill = spills.find((s) => s.id === (selectedSpillId ?? spills[0]?.id)) || spills[0];
  const activeAnalysis = spillAnalyses.find((a) => a.spill_id === activeSpill?.id) || spillAnalyses[0];

  return (
    <div className="anim-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className="section-title">Synthetic Aperture Radar (SAR) Oil-Spill Workspace</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Satellite SAR slick detection, hydrodynamic drift vector modeling, and containment boom deployment planning.
          </p>
        </div>
        <span className="badge badge-red"><Droplets size={11} /> Sentinel-1 SAR Live</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Spill Analytics & Tactical Plan */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="label-caps">Detected Marine Slicks</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {spills.map((s) => {
              const isSelected = activeSpill?.id === s.id;
              return (
                <div
                  key={s.id}
                  className="surface-card"
                  style={{
                    padding: '16px',
                    cursor: 'pointer',
                    borderColor: isSelected ? 'var(--accent-red)' : undefined,
                    background: isSelected ? 'rgba(239, 68, 68, 0.08)' : undefined,
                  }}
                  onClick={() => setSelectedSpillId(s.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)' }}>{s.name}</span>
                    <span className="badge badge-red">{s.severity}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Radius: {(s.radius_m / 1000).toFixed(1)} km · {s.lat.toFixed(2)}°N, {s.lng.toFixed(2)}°E
                  </div>
                </div>
              );
            })}
          </div>

          {activeAnalysis && (
            <div className="surface-elevated anim-scale" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="label-caps" style={{ color: 'var(--accent-red)' }}>SAR Dispersion Assessment</div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div className="surface-inset" style={{ padding: '10px 12px' }}>
                  <div className="label-caps" style={{ fontSize: '0.6rem' }}>Affected Area</div>
                  <div className="stat-number" style={{ fontSize: '1.2rem', color: 'var(--accent-red)' }}>
                    {activeAnalysis.affected_area_km2} km²
                  </div>
                </div>
                <div className="surface-inset" style={{ padding: '10px 12px' }}>
                  <div className="label-caps" style={{ fontSize: '0.6rem' }}>Response State</div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--accent-amber)', marginTop: 4 }}>
                    {activeAnalysis.response_status}
                  </div>
                </div>
                <div className="surface-inset" style={{ padding: '10px 12px' }}>
                  <div className="label-caps" style={{ fontSize: '0.6rem' }}>Drift Direction</div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--accent-teal)', marginTop: 4 }}>
                    East-Northeast
                  </div>
                </div>
              </div>

              <div>
                <div className="label-caps" style={{ marginBottom: '6px' }}>Threatened Coastal Marine Fauna</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {activeAnalysis.affected_species.map((sp, idx) => (
                    <span key={idx} className="badge badge-amber" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Fish size={11} /> {sp}
                    </span>
                  ))}
                </div>
              </div>

              <div className="surface-inset" style={{ padding: '12px 14px', borderLeft: '3px solid var(--accent-teal)' }}>
                <div className="label-caps" style={{ color: 'var(--accent-teal)', marginBottom: '4px' }}>Containment Action Directive</div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {activeAnalysis.recommendations}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Spill Spread & Boom GIS View */}
        <div>
          <div className="label-caps" style={{ marginBottom: '12px' }}>SAR Slick Epicenter &amp; Simulated Drift Trajectory</div>
          <div className="surface-inset" style={{ position: 'relative', height: '520px', borderRadius: '12px', overflow: 'hidden' }}>
            <MapContainer
              center={activeSpill ? [activeSpill.lat, activeSpill.lng] : [18.6, 84.8]}
              zoom={9}
              scrollWheelZoom={false}
              style={{ width: '100%', height: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />

              {spills.map((s) => (
                <Circle
                  key={s.id}
                  center={[s.lat, s.lng]}
                  radius={s.radius_m}
                  pathOptions={{
                    color: '#ef4444',
                    fillColor: '#ef4444',
                    fillOpacity: 0.4,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <strong>{s.name}</strong><br />
                    Severity: {s.severity}<br />
                    Radius: {(s.radius_m / 1000).toFixed(1)} km
                  </Popup>
                </Circle>
              ))}

              {/* Drift trajectory polyline */}
              {activeAnalysis && activeAnalysis.spread_points.length > 0 && (
                <Polyline
                  positions={activeAnalysis.spread_points}
                  pathOptions={{ color: '#f59e0b', weight: 3, dashArray: '6, 6' }}
                />
              )}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
