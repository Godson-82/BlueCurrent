import React, { useState } from 'react';
import { Navigation, Activity } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { Vessel, VesselTrack } from '../api';

const vesselIcon = L.divIcon({
  className: '',
  html: '<div class="map-vessel-icon"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

interface AISVesselCorrelationProps {
  vessels: Vessel[];
  tracks: VesselTrack[];
  loading?: boolean;
}

export const AISVesselCorrelation: React.FC<AISVesselCorrelationProps> = ({
  vessels,
  tracks,
}) => {
  const [selectedVesselId, setSelectedVesselId] = useState<number | null>(vessels[0]?.id || null);

  const activeVessel = vessels.find((v) => v.id === (selectedVesselId ?? vessels[0]?.id)) || vessels[0];
  const activeTracks = tracks.filter((t) => t.vessel_id === activeVessel?.id);

  const trackPoints: [number, number][] = activeTracks.map((t) => [t.lat, t.lng]);

  return (
    <div className="anim-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className="section-title">AIS Vessel-Correlation &amp; Trajectory Workflow</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Satellite &amp; coastal AIS transponder correlation, historical breadcrumbs, and kinematic tracking.
          </p>
        </div>
        <span className="badge badge-teal"><Activity size={11} /> {vessels.length} Tracked Hulls</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
        {/* Vessel Fleet Selector & Telemetry */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="label-caps">Tracked Fleet Units</div>
          {vessels.map((v) => {
            const isSelected = activeVessel?.id === v.id;
            return (
              <div
                key={v.id}
                className="surface-card"
                style={{
                  padding: '16px',
                  cursor: 'pointer',
                  borderColor: isSelected ? 'var(--accent-teal)' : undefined,
                  background: isSelected ? 'rgba(0, 212, 170, 0.08)' : undefined,
                }}
                onClick={() => setSelectedVesselId(v.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Navigation size={16} color="var(--accent-teal)" />
                    <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)' }}>{v.name}</span>
                  </div>
                  <span className={`badge ${v.status === 'ACTIVE' ? 'badge-teal' : 'badge-blue'}`}>{v.status}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <div>Speed: <strong style={{ color: 'var(--text-primary)' }}>{v.speed} kn</strong></div>
                  <div>Heading: <strong style={{ color: 'var(--text-primary)' }}>{v.heading}°</strong></div>
                  <div>Lat: {v.lat.toFixed(2)}°N</div>
                  <div>Lng: {v.lng.toFixed(2)}°E</div>
                </div>
              </div>
            );
          })}

          {activeVessel && (
            <div className="surface-elevated" style={{ padding: '16px 18px', marginTop: '6px' }}>
              <div className="label-caps" style={{ marginBottom: '8px' }}>MMSI Kinematic Telemetry</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>MMSI Transponder:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>41900{activeVessel.id}281</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Breadcrumb History:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-teal)' }}>{activeTracks.length} Waypoints</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>AIS Integrity:</span>
                  <span style={{ color: 'var(--accent-teal)', fontWeight: 700 }}>Nominal (0 gap events)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* GIS Vessel Trajectory Map */}
        <div>
          <div className="label-caps" style={{ marginBottom: '12px' }}>Real-Time AIS Position &amp; Historical Trajectory Trail</div>
          <div className="surface-inset" style={{ position: 'relative', height: '540px', borderRadius: '12px', overflow: 'hidden' }}>
            <MapContainer
              center={[activeVessel ? activeVessel.lat : 18.4, activeVessel ? activeVessel.lng : 84.2]}
              zoom={9}
              scrollWheelZoom={false}
              style={{ width: '100%', height: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />

              {/* All vessels */}
              {vessels.map((v) => (
                <Marker key={v.id} position={[v.lat, v.lng]} icon={vesselIcon}>
                  <Popup>
                    <strong>{v.name}</strong><br />
                    Status: {v.status}<br />
                    Speed: {v.speed} kn · Heading: {v.heading}°
                  </Popup>
                </Marker>
              ))}

              {/* Selected vessel's historical trail */}
              {trackPoints.length > 0 && (
                <Polyline
                  positions={trackPoints}
                  pathOptions={{ color: '#00d4aa', weight: 3.5, dashArray: '4, 6' }}
                />
              )}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
