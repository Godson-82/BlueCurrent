import React from 'react';
import { MapPin, Radio } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { Debris } from '../api';

const hazardIcon = L.divIcon({
  className: '',
  html: '<div class="map-hazard-icon"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

function SonarGraphic() {
  const dots = [
    { top: '28%', left: '62%' },
    { top: '58%', left: '78%' },
    { top: '70%', left: '32%', cls: 'alert' },
    { top: '38%', left: '25%', cls: 'warning' },
    { top: '22%', left: '45%' },
    { top: '78%', left: '55%', cls: 'warning' },
  ];
  return (
    <div className="sonar-container" style={{ width: '280px', height: '280px' }}>
      <div className="sonar-crosshair" />
      <div className="sonar-rings">
        <span className="sonar-ring" />
        <span className="sonar-ring" />
        <span className="sonar-ring" />
        <span className="sonar-ring-pulse" />
        <span className="sonar-ring-pulse" />
      </div>
      <div className="sonar-sweep" />
      {dots.map((d, i) => (
        <span key={i} className={`sonar-dot${d.cls ? ' ' + d.cls : ''}`} style={{ top: d.top, left: d.left }} />
      ))}
      <div className="sonar-center" />
      <span className="sonar-label" style={{ top: '10%', left: '10%' }}>18.4°N</span>
      <span className="sonar-label" style={{ top: '10%', right: '10%' }}>84.2°E</span>
      <span className="sonar-label" style={{ bottom: '8%', left: '50%', transform: 'translateX(-50%)' }}>PING 3.2s</span>
    </div>
  );
}

interface UnderwaterSonarAnomalyProps {
  debris: Debris[];
}

export const UnderwaterSonarAnomaly: React.FC<UnderwaterSonarAnomalyProps> = ({ debris }) => {
  return (
    <div className="anim-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className="section-title">Underwater Debris &amp; Acoustic Sonar-Anomaly Detection</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Multi-beam active bathymetric sonar sweep and surface flotsam drift tracking.
          </p>
        </div>
        <span className="badge badge-amber"><Radio size={11} /> 50kHz Bathymetric Sweep Active</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
        {/* Sonar Radar Card */}
        <div className="surface-elevated" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="label-caps">Active Sonar Scan</span>
            <span className="badge badge-teal">Acoustic Live</span>
          </div>

          <SonarGraphic />

          <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="surface-inset" style={{ padding: '10px', textAlign: 'center' }}>
              <div className="label-caps">Anomalies</div>
              <div className="stat-number" style={{ fontSize: '1.2rem', color: 'var(--accent-amber)' }}>{debris.length}</div>
            </div>
            <div className="surface-inset" style={{ padding: '10px', textAlign: 'center' }}>
              <div className="label-caps">Max Cluster</div>
              <div className="stat-number" style={{ fontSize: '1.2rem', color: 'var(--accent-red)' }}>Large</div>
            </div>
          </div>
        </div>

        {/* GIS Map & Anomaly Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="surface-inset" style={{ position: 'relative', height: '360px', borderRadius: '12px', overflow: 'hidden' }}>
            <MapContainer center={[18.3, 84.1]} zoom={9} scrollWheelZoom={false} style={{ width: '100%', height: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              {debris.map((d) => (
                <Marker key={d.id} position={[d.lat, d.lng]} icon={hazardIcon}>
                  <Popup>
                    <strong>{d.name}</strong><br />
                    Size: {d.size}<br />
                    Coords: {d.lat.toFixed(2)}°N, {d.lng.toFixed(2)}°E
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div className="label-caps">Detected Submerged &amp; Surface Flotsam Clusters</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {debris.map((d) => (
              <div key={d.id} className="surface-card anim-slide-l" style={{ padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <MapPin size={14} color="var(--accent-red)" />
                  <span style={{ fontWeight: 800, fontSize: '0.88rem' }}>{d.name}</span>
                </div>
                <div className="label-caps" style={{ color: d.size === 'Large' ? 'var(--accent-red)' : 'var(--accent-amber)' }}>
                  {d.size} Hazard Cluster
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {d.lat.toFixed(2)}°N · {d.lng.toFixed(2)}°E
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
