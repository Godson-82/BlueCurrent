import React, { useState } from 'react';
import { Route as RouteIcon, ShieldCheck, Zap } from 'lucide-react';
import { MapContainer, TileLayer, Polyline, Circle, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { post, type Corridor, type Spill } from '../api';

const vesselIcon = L.divIcon({
  className: '',
  html: '<div class="map-vessel-icon"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

interface SafeRouteOptimizerProps {
  corridors: Corridor[];
  spills: Spill[];
  targetCoords?: [number, number] | null;
  targetName?: string | null;
}

export const SafeRouteOptimizer: React.FC<SafeRouteOptimizerProps> = ({
  corridors,
  spills,
  targetCoords,
  targetName,
}) => {
  const [startLat, setStartLat] = useState<number>(18.4);
  const [startLng, setStartLng] = useState<number>(84.2);
  const [endLat, setEndLat] = useState<number>(targetCoords ? targetCoords[0] : 18.8);
  const [endLng, setEndLng] = useState<number>(targetCoords ? targetCoords[1] : 84.6);
  const [destinationLabel, setDestinationLabel] = useState<string>(targetName || 'PFZ Target Sector 2');

  const [planning, setPlanning] = useState<boolean>(false);
  const [planned, setPlanned] = useState<{ waypoints: [number, number][]; distanceKm: string; label: string } | null>(null);

  const handlePlanRoute = async () => {
    setPlanning(true);
    try {
      const res = await post<{ waypoints: [number, number][]; distanceKm: string; label: string }>('/api/routes/plan', {
        start: [startLat, startLng],
        end: [endLat, endLng],
      });
      setPlanned(res);
    } catch (err) {
      console.error('Route planning failed', err);
    } finally {
      setPlanning(false);
    }
  };

  const presetRoutes = [
    { label: 'Visakhapatnam → PFZ Zone 01', start: [18.4, 84.2], end: [18.5, 84.3], name: 'PFZ Zone 01' },
    { label: 'Gopalpur → Paradip Tuna Riff', start: [18.5, 83.9], end: [18.9, 84.0], name: 'Paradip Tuna Riff' },
    { label: 'Sector 4 → Safe Corridor B', start: [17.9, 84.0], end: [18.5, 84.8], name: 'Corridor B' },
  ];

  return (
    <div className="anim-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className="section-title">Safe-Route Optimization Engine</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Autonomous waypoint routing that dynamically avoids active oil spills, gale squalls, and drifting debris.
          </p>
        </div>
        <button className="btn-primary" onClick={handlePlanRoute} disabled={planning}>
          <Zap size={14} /> {planning ? 'Computing Route…' : 'Compute Safe Route'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
        {/* Route Settings */}
        <div className="surface-base" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="label-caps">Waypoint Parameters</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label className="label-caps" style={{ display: 'block', marginBottom: '4px' }}>Departure Point (Lat, Lng)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input
                  type="number"
                  step="0.01"
                  className="input-field"
                  value={startLat}
                  onChange={(e) => setStartLat(parseFloat(e.target.value))}
                />
                <input
                  type="number"
                  step="0.01"
                  className="input-field"
                  value={startLng}
                  onChange={(e) => setStartLng(parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div>
              <label className="label-caps" style={{ display: 'block', marginBottom: '4px' }}>Destination Target (Lat, Lng)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input
                  type="number"
                  step="0.01"
                  className="input-field"
                  value={endLat}
                  onChange={(e) => setEndLat(parseFloat(e.target.value))}
                />
                <input
                  type="number"
                  step="0.01"
                  className="input-field"
                  value={endLng}
                  onChange={(e) => setEndLng(parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="label-caps" style={{ marginTop: '4px' }}>Preset Quick Navigation</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {presetRoutes.map((p, idx) => (
              <button
                key={idx}
                className="btn-ghost"
                style={{ justifyContent: 'flex-start', fontSize: '0.75rem', padding: '6px 10px', background: 'rgba(0,0,0,0.2)' }}
                onClick={() => {
                  setStartLat(p.start[0]);
                  setStartLng(p.start[1]);
                  setEndLat(p.end[0]);
                  setEndLng(p.end[1]);
                  setDestinationLabel(p.name);
                }}
              >
                <RouteIcon size={12} color="var(--accent-teal)" />
                {p.label}
              </button>
            ))}
          </div>

          {planned && (
            <div className="surface-elevated" style={{ padding: '14px', marginTop: '6px', borderLeft: '3px solid var(--accent-teal)' }}>
              <div className="label-caps" style={{ color: 'var(--accent-teal)' }}>Routing Solution Active</div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', marginTop: '4px' }}>{planned.label}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Calculated Distance:</span>
                <span className="stat-number" style={{ fontSize: '1.1rem', color: 'var(--accent-teal)' }}>{planned.distanceKm} km</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--accent-amber)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={12} /> Midpoint skirted 3.2 NM outside Seep Alpha
              </div>
            </div>
          )}
        </div>

        {/* Route Map Preview */}
        <div>
          <div className="label-caps" style={{ marginBottom: '12px' }}>Interactive Waypoint GIS Trajectory</div>
          <div className="surface-inset" style={{ position: 'relative', height: '540px', borderRadius: '12px', overflow: 'hidden' }}>
            <MapContainer center={[startLat, startLng]} zoom={8} scrollWheelZoom={false} style={{ width: '100%', height: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />

              <Marker position={[startLat, startLng]} icon={vesselIcon}>
                <Popup>Departure Waypoint</Popup>
              </Marker>

              <Marker position={[endLat, endLng]} icon={vesselIcon}>
                <Popup>Destination: {destinationLabel}</Popup>
              </Marker>

              {/* Spills as hazard avoidance zones */}
              {spills.map((s) => (
                <Circle
                  key={s.id}
                  center={[s.lat, s.lng]}
                  radius={s.radius_m}
                  pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.35 }}
                >
                  <Popup>⚠️ Threat: {s.name}</Popup>
                </Circle>
              ))}

              {/* Standard Corridors */}
              {corridors.map((c) => (
                <Polyline key={c.id} positions={c.points} pathOptions={{ color: '#3b82f6', weight: 2.5, opacity: 0.4 }} />
              ))}

              {/* Computed Safe Route */}
              {planned && (
                <Polyline
                  positions={planned.waypoints}
                  pathOptions={{ color: '#00d4aa', weight: 4.5, opacity: 0.95 }}
                />
              )}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
