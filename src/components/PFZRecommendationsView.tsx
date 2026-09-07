import React, { useMemo } from 'react';
import { Fish, MapPin, Thermometer, Leaf, ArrowRight, TrendingUp } from 'lucide-react';
import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { PfzZone } from '../api';
import { SpotlightCard } from './effects';

const vesselIcon = L.divIcon({
  className: '',
  html: '<div class="map-vessel-icon"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

interface PFZRecommendationsViewProps {
  zones: PfzZone[] | null;
  onPlanRouteToZone: (lat: number, lng: number, name: string) => void;
}

export const PFZRecommendationsView: React.FC<PFZRecommendationsViewProps> = ({
  zones,
  onPlanRouteToZone,
}) => {
  const sorted = useMemo(() => [...(zones ?? [])].sort((a, b) => b.yield_pct - a.yield_pct), [zones]);
  const rankColor = (i: number) => (i === 0 ? 'var(--accent-teal)' : i === 1 ? 'var(--accent-blue)' : 'var(--text-muted)');

  return (
    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexShrink: 0 }}>
        <div>
          <h2 className="section-title">Potential Fishing Zone (PFZ) Recommendations</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Satellite-derived thermal front &amp; chlorophyll-a convergence zones for pelagic &amp; demersal catch optimization.
          </p>
        </div>
        <span className="badge badge-teal"><TrendingUp size={11} /> INCOIS &amp; Sentinel-3 Synced</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* Ranked Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          <div style={{ flexShrink: 0 }}>
          <div className="label-caps" style={{ marginBottom: '12px' }}>Ranked Fishery Grounds ({sorted.length} Zones)</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, minHeight: 0, overflowY: 'auto' }}>
            {sorted.map((z, i) => (
              <SpotlightCard
                key={z.id}
                className={`surface-card anim-slide-l anim-d${Math.min(i + 1, 8)} ${i === 0 ? 'surface-elevated' : ''}`}
                spotlightColor={i === 0 ? 'rgba(0,212,170,0.16)' : 'rgba(59,130,246,0.12)'}
              >
                <div style={{ padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '6px', background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: rankColor(i), fontWeight: 800, fontSize: '0.8rem' }}>
                      #{i + 1}
                    </div>
                    <div>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: rankColor(i) }}>
                        {z.name.toUpperCase()}
                      </span>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Target Species: {z.density} Biomass</div>
                    </div>
                  </div>
                  <span className={`badge ${i === 0 ? 'badge-teal' : i === 1 ? 'badge-blue' : ''}`} style={{ fontSize: '0.75rem' }}>
                    {z.yield_pct}% Projected Yield
                  </span>
                </div>

                <div className="progress-track" style={{ marginBottom: '14px' }}>
                  <div className="progress-fill" style={{ width: `${z.yield_pct}%`, background: `linear-gradient(90deg, ${rankColor(i)}, transparent)` }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.78rem', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px' }}>
                  <div><MapPin size={11} style={{ verticalAlign: '-1px', marginRight: 4, color: 'var(--accent-teal)' }} />{z.distance_km} km</div>
                  <div><Thermometer size={11} style={{ verticalAlign: '-1px', marginRight: 4, color: 'var(--accent-teal)' }} />{z.sst_c}°C SST</div>
                  <div><Leaf size={11} style={{ verticalAlign: '-1px', marginRight: 4, color: 'var(--accent-teal)' }} />{z.chlorophyll} Chl</div>
                  <div><Fish size={11} style={{ verticalAlign: '-1px', marginRight: 4, color: 'var(--accent-teal)' }} />{z.density}</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
                  <button
                    className={i === 0 ? 'btn-primary' : 'btn-secondary'}
                    style={{ padding: '8px 14px', fontSize: '0.78rem' }}
                    onClick={() => onPlanRouteToZone(z.lat, z.lng, z.name)}
                  >
                    Optimize Safe Route to Zone <ArrowRight size={14} />
                  </button>
                </div>
                </div>
              </SpotlightCard>
            ))}
          </div>
        </div>

        {/* Live Satellite Map Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          <div className="label-caps" style={{ marginBottom: '12px', flexShrink: 0 }}>Thermal Gradient &amp; SST GIS Preview</div>
          <div className="surface-inset" style={{ position: 'relative', flex: 1, minHeight: 0, borderRadius: '12px', overflow: 'hidden' }}>
            <MapContainer center={[18.4, 84.2]} zoom={8} scrollWheelZoom={false} style={{ width: '100%', height: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <Marker position={[18.4, 84.2]} icon={vesselIcon}><Popup>Your Vessel (ORCA-01)</Popup></Marker>
              {(zones ?? []).map((z, i) => (
                <Circle
                  key={z.id}
                  center={[z.lat, z.lng]}
                  radius={z.radius_m}
                  pathOptions={{
                    color: i === 0 ? '#00d4aa' : '#3b82f6',
                    fillColor: i === 0 ? '#00d4aa' : '#3b82f6',
                    fillOpacity: i === 0 ? 0.28 : 0.16,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <strong>{z.name}</strong><br />
                    Yield: {z.yield_pct}%<br />
                    SST: {z.sst_c}°C · Chl: {z.chlorophyll}
                  </Popup>
                </Circle>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
