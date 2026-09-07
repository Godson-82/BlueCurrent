import React, { useState } from 'react';
import { Globe2, CheckCircle2 } from 'lucide-react';
import { MapContainer, TileLayer, Polygon, Popup, Marker } from 'react-leaflet';
import L from 'leaflet';
import type { Boundary, Vessel } from '../api';

const vesselIcon = L.divIcon({
  className: '',
  html: '<div class="map-vessel-icon"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

interface SmartGeofencingViewProps {
  boundaries: Boundary[];
  vessels: Vessel[];
}

export const SmartGeofencingView: React.FC<SmartGeofencingViewProps> = ({ boundaries, vessels }) => {
  const [selectedBoundaryId, setSelectedBoundaryId] = useState<number | null>(boundaries[0]?.id || null);

  const activeBoundary = boundaries.find((b) => b.id === (selectedBoundaryId ?? boundaries[0]?.id)) || boundaries[0];

  return (
    <div className="anim-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className="section-title">Smart Geofencing &amp; Maritime Perimeter Management</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Real-time polygonal perimeter monitoring for Exclusive Economic Zones (EEZ), Territorial Waters, and Marine Protected Areas.
          </p>
        </div>
        <span className="badge badge-purple"><Globe2 size={11} /> 3 Active Geofences Enforced</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Geofence List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="label-caps">Monitored Perimeters</div>
          {boundaries.map((b, i) => {
            const isSelected = activeBoundary?.id === b.id;
            const isProtected = b.type === 'protected';
            return (
              <div
                key={b.id}
                className={`surface-card anim-slide-l anim-d${i + 1}`}
                style={{
                  padding: '16px',
                  cursor: 'pointer',
                  borderColor: isSelected ? 'var(--accent-purple)' : undefined,
                  background: isSelected ? 'rgba(139, 92, 246, 0.08)' : undefined,
                }}
                onClick={() => setSelectedBoundaryId(b.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Globe2 size={16} color="var(--accent-purple)" />
                    <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)' }}>{b.name}</span>
                  </div>
                  <span className={`badge ${isProtected ? 'badge-amber' : 'badge-purple'}`}>
                    {b.type.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Polygon Vertices: {b.coords.length} GPS Waypoints · Automated Transition Sensor: Active
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.72rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Status: <strong style={{ color: 'var(--accent-teal)' }}>Enforced</strong></span>
                  <span style={{ color: 'var(--text-muted)' }}>Breach Alert Rule: <strong style={{ color: 'var(--text-primary)' }}>Instant Alert</strong></span>
                </div>
              </div>
            );
          })}

          {/* Real-time breach audit log */}
          <div className="surface-inset" style={{ padding: '16px', marginTop: '10px' }}>
            <div className="label-caps" style={{ marginBottom: '10px' }}>Recent Geofence Transitions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-teal)' }}>
                <CheckCircle2 size={13} /> ORCA-01 entered Territorial Waters (18.40°N, 84.20°E) · Authorized
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-teal)' }}>
                <CheckCircle2 size={13} /> ORCA-02 patrolling Sector 2 perimeter · 0 unauthorized transits
              </div>
            </div>
          </div>
        </div>

        {/* GIS Map */}
        <div>
          <div className="label-caps" style={{ marginBottom: '12px' }}>Polygon Geofence GIS View</div>
          <div className="surface-inset" style={{ position: 'relative', height: '520px', borderRadius: '12px', overflow: 'hidden' }}>
            <MapContainer center={[18.4, 84.2]} zoom={8} scrollWheelZoom={false} style={{ width: '100%', height: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              {boundaries.map((b) => {
                const isSelected = b.id === activeBoundary?.id;
                return (
                  <Polygon
                    key={b.id}
                    positions={b.coords}
                    pathOptions={{
                      color: isSelected ? '#8b5cf6' : '#3b82f6',
                      fillColor: isSelected ? '#8b5cf6' : '#3b82f6',
                      fillOpacity: isSelected ? 0.25 : 0.08,
                      weight: isSelected ? 3 : 1.5,
                      dashArray: b.type === 'protected' ? '4, 4' : undefined,
                    }}
                  >
                    <Popup>
                      <strong>{b.name}</strong><br />
                      Type: {b.type}
                    </Popup>
                  </Polygon>
                );
              })}

              {vessels.map((v) => (
                <Marker key={v.id} position={[v.lat, v.lng]} icon={vesselIcon}>
                  <Popup>{v.name} (AIS Live)</Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
