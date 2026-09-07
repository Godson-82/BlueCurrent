import React, { useState } from 'react';
import { Fish, Info, CheckCircle2, AlertOctagon } from 'lucide-react';
import { MapContainer, TileLayer, Polygon, Popup } from 'react-leaflet';
import type { HabitatZone } from '../api';

interface HabitatMappingViewProps {
  habitats: HabitatZone[];
}

export const HabitatMappingView: React.FC<HabitatMappingViewProps> = ({ habitats }) => {
  const [selectedHabitatId, setSelectedHabitatId] = useState<number | null>(habitats[0]?.id || null);

  const activeHabitat = habitats.find((h) => h.id === (selectedHabitatId ?? habitats[0]?.id)) || habitats[0];

  const statusMeta = (status: string) => {
    switch (status) {
      case 'breeding':
        return { badge: 'badge-red', label: 'Breeding Moratorium Active', color: 'var(--accent-red)', icon: <AlertOctagon size={13} /> };
      case 'active':
        return { badge: 'badge-teal', label: 'Active Feeding / Open', color: 'var(--accent-teal)', icon: <CheckCircle2 size={13} /> };
      default:
        return { badge: 'badge-amber', label: 'Seasonal Low Catch', color: 'var(--accent-amber)', icon: <Info size={13} /> };
    }
  };

  return (
    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexShrink: 0 }}>
        <div>
          <h2 className="section-title">Fish Reproductive-Habitat &amp; Spawning Grounds</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Ecological GIS mapping to protect critical nursery zones and track species thermal tolerance windows.
          </p>
        </div>
        <span className="badge badge-purple"><Fish size={11} /> 5 Monitored Spawning Sanctuaries</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* Habitats List */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          <div className="label-caps" style={{ flexShrink: 0 }}>Protected Marine Habitat Sanctuaries</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minHeight: 0, overflowY: 'auto', marginTop: '10px' }}>
          {habitats.map((h, i) => {
            const meta = statusMeta(h.status);
            const isSelected = activeHabitat?.id === h.id;
            return (
              <div
                key={h.id}
                className={`surface-card anim-slide-l anim-d${i + 1}`}
                style={{
                  padding: '16px',
                  cursor: 'pointer',
                  borderColor: isSelected ? 'var(--accent-cyan)' : undefined,
                  background: isSelected ? 'rgba(34, 211, 238, 0.08)' : undefined,
                }}
                onClick={() => setSelectedHabitatId(h.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Fish size={16} color="var(--accent-cyan)" />
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{h.name}</span>
                  </div>
                  <span className={`badge ${meta.badge}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {meta.icon} {meta.label}
                  </span>
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {h.description}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '12px', background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.72rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Species: </span>
                    <strong style={{ color: 'var(--text-primary)' }}>{h.species.split(' ')[0]}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Season: </span>
                    <strong style={{ color: 'var(--text-primary)' }}>{h.season}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Temp Window: </span>
                    <strong style={{ color: 'var(--accent-teal)' }}>{h.temp_min_c}–{h.temp_max_c}°C</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        </div>

        {/* Selected Habitat GIS & Biological Profile */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          <div className="label-caps" style={{ marginBottom: '8px', flexShrink: 0 }}>Sanctuary GIS Polygon &amp; SST Alignment</div>
          <div className="surface-inset" style={{ position: 'relative', flex: 1, minHeight: 0, borderRadius: '12px', overflow: 'hidden', marginBottom: '12px' }}>
            <MapContainer center={[18.4, 84.2]} zoom={8} scrollWheelZoom={false} style={{ width: '100%', height: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              {habitats.map((h) => {
                const isCurrent = h.id === activeHabitat?.id;
                return (
                  <Polygon
                    key={h.id}
                    positions={h.coords}
                    pathOptions={{
                      color: isCurrent ? '#22d3ee' : '#3b82f6',
                      fillColor: isCurrent ? '#22d3ee' : '#3b82f6',
                      fillOpacity: isCurrent ? 0.35 : 0.12,
                      weight: isCurrent ? 3 : 1.5,
                    }}
                  >
                    <Popup>
                      <strong>{h.name}</strong><br />
                      Species: {h.species}<br />
                      Status: {h.status}
                    </Popup>
                  </Polygon>
                );
              })}
            </MapContainer>
          </div>

          {activeHabitat && (
            <div className="surface-elevated" style={{ padding: '16px 20px' }}>
              <div className="label-caps" style={{ marginBottom: '8px' }}>Thermal Invariant &amp; Ecosystem Compliance</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{activeHabitat.species}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Current Sea Temperature: {activeHabitat.sst_c}°C</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="badge badge-teal">TOLERANCE OPTIMAL</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{activeHabitat.temp_min_c}°C to {activeHabitat.temp_max_c}°C Range</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
