import React, { useState } from 'react';
import {
  Waves, Fish, Droplets, MapPin, Globe2, Route as RouteIcon,
  Radio, Navigation, Plus, Eye, Layers, AlertTriangle, EyeOff,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, Polygon, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type {
  PfzZone, Spill, Debris, Boundary, Corridor,
  WeatherPoint, Vessel, HabitatZone, Alert,
} from '../api';

const vesselIcon = L.divIcon({
  className: '',
  html: '<div class="map-vessel-icon"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const hazardIcon = L.divIcon({
  className: '',
  html: '<div class="map-hazard-icon"></div>',
  iconSize: [11, 11],
  iconAnchor: [5, 5],
});

const observationIcon = L.divIcon({
  className: '',
  html: '<div class="map-observation-icon"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

interface MapClickHandlerProps {
  onMapClick: (coords: [number, number]) => void;
}

function MapClickHandler({ onMapClick }: MapClickHandlerProps) {
  useMapEvents({
    click(e) {
      onMapClick([Number(e.latlng.lat.toFixed(4)), Number(e.latlng.lng.toFixed(4))]);
    },
  });
  return null;
}

interface UnifiedMarineMapProps {
  pfz?: PfzZone[];
  weather?: WeatherPoint[];
  spills?: Spill[];
  debris?: Debris[];
  boundaries?: Boundary[];
  corridors?: Corridor[];
  vessels?: Vessel[];
  habitats?: HabitatZone[];
  alerts?: Alert[];
  onOpenGeotagModal: (coords?: [number, number]) => void;
}

export const UnifiedMarineMap: React.FC<UnifiedMarineMapProps> = ({
  pfz = [],
  weather = [],
  spills = [],
  debris = [],
  boundaries = [],
  corridors = [],
  vessels = [],
  habitats = [],
  alerts = [],
  onOpenGeotagModal,
}) => {
  const [layers, setLayers] = useState({
    weather: true,
    pfz: true,
    spills: true,
    debris: true,
    boundaries: true,
    corridors: true,
    vessels: true,
    habitats: true,
    alerts: true,
  });

  const [mouseCoords, setMouseCoords] = useState<[number, number]>([18.4, 84.2]);

  const toggleLayer = (key: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const layerItems = [
    { key: 'vessels' as const, label: 'AIS Live Vessels', count: vessels.length, icon: <Navigation size={14} />, color: 'var(--accent-teal)' },
    { key: 'pfz' as const, label: 'PFZ Fishing Zones', count: pfz.length, icon: <Fish size={14} />, color: '#00d4aa' },
    { key: 'weather' as const, label: 'Sea Weather & Waves', count: weather.length, icon: <Waves size={14} />, color: '#3b82f6' },
    { key: 'spills' as const, label: 'Oil Spill Hazards', count: spills.length, icon: <Droplets size={14} />, color: '#ef4444' },
    { key: 'debris' as const, label: 'Marine Debris Clusters', count: debris.length, icon: <MapPin size={14} />, color: '#f59e0b' },
    { key: 'boundaries' as const, label: 'Smart Geofences & EEZ', count: boundaries.length, icon: <Globe2 size={14} />, color: '#8b5cf6' },
    { key: 'habitats' as const, label: 'Fish Habitats & Spawning', count: habitats.length, icon: <Fish size={14} />, color: '#22d3ee' },
    { key: 'corridors' as const, label: 'Safe Corridors', count: corridors.length, icon: <RouteIcon size={14} />, color: '#60a5fa' },
    { key: 'alerts' as const, label: 'Geotagged Observations', count: alerts.length, icon: <AlertTriangle size={14} />, color: '#ec4899' },
  ];

  return (
    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexShrink: 0 }}>
        <div>
          <h2 className="section-title">Unified Interactive Marine GIS Map</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Multi-layer oceanographic situational map. Click anywhere to auto-geotag a field observation.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className="btn-primary" onClick={() => onOpenGeotagModal(mouseCoords)}>
            <Plus size={15} /> Log Geotagged Observation
          </button>
          <span className="badge badge-teal"><Radio size={11} /> 3s Telemetry Stream</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '18px', flex: 1, minHeight: 0 }}>
        {/* Layer Controls */}
        <div className="surface-base" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
            <span className="label-caps"><Layers size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} /> Active Layers</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{Object.values(layers).filter(Boolean).length} / {Object.keys(layers).length} ON</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
            {layerItems.map((item) => {
              const active = layers[item.key];
              return (
                <button
                  key={item.key}
                  onClick={() => toggleLayer(item.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: active ? 'rgba(0, 212, 170, 0.08)' : 'transparent',
                    border: `1px solid ${active ? 'rgba(0, 212, 170, 0.2)' : 'transparent'}`,
                    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: active ? item.color : 'var(--text-muted)' }}>{item.icon}</span>
                    <span style={{ fontWeight: active ? 600 : 400 }}>{item.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="badge" style={{ padding: '1px 5px', fontSize: '0.6rem', background: 'rgba(0,0,0,0.25)' }}>{item.count}</span>
                    {active ? <Eye size={12} color="var(--accent-teal)" /> : <EyeOff size={12} color="var(--text-muted)" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="surface-inset" style={{ padding: '10px 12px', marginTop: '12px' }}>
            <div className="label-caps">Map Center HUD</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--accent-teal)', marginTop: '4px' }}>
              18.4000°N · 84.2000°E
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Sector: Bay of Bengal (Visakhapatnam Corridor)
            </div>
          </div>
        </div>

        {/* Map Canvas */}
        <div className="surface-inset" style={{ position: 'relative', flex: 1, minHeight: 0, borderRadius: '12px', overflow: 'hidden' }}>
          <MapContainer
            center={[18.4, 84.2]}
            zoom={8}
            scrollWheelZoom={true}
            style={{ width: '100%', height: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            <MapClickHandler onMapClick={(coords) => {
              setMouseCoords(coords);
              onOpenGeotagModal(coords);
            }} />

            {/* 1. Vessels */}
            {layers.vessels &&
              vessels.map((v) => (
                <Marker key={v.id} position={[v.lat, v.lng]} icon={vesselIcon}>
                  <Popup>
                    <div style={{ fontWeight: 700, color: 'var(--accent-teal)' }}>{v.name} (AIS Live)</div>
                    <div>Status: {v.status}</div>
                    <div>Speed: {v.speed} knots · Heading: {v.heading}°</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Lat: {v.lat.toFixed(3)}N, Lng: {v.lng.toFixed(3)}E</div>
                  </Popup>
                </Marker>
              ))}

            {/* 2. PFZ Zones */}
            {layers.pfz &&
              pfz.map((z) => (
                <Circle
                  key={z.id}
                  center={[z.lat, z.lng]}
                  radius={z.radius_m}
                  pathOptions={{ color: '#00d4aa', fillColor: '#00d4aa', fillOpacity: 0.22, weight: 2 }}
                >
                  <Popup>
                    <div style={{ fontWeight: 700, color: '#00d4aa' }}>{z.name} (PFZ Zone)</div>
                    <div>Yield Rating: {z.yield_pct}%</div>
                    <div>SST: {z.sst_c}°C · Chlorophyll: {z.chlorophyll}</div>
                    <div>Biomass: {z.density} · Distance: {z.distance_km} km</div>
                  </Popup>
                </Circle>
              ))}

            {/* 3. Weather Cells */}
            {layers.weather &&
              weather.map((w) => (
                <Circle
                  key={w.id}
                  center={[w.lat, w.lng]}
                  radius={10000}
                  pathOptions={{
                    color: w.condition === 'HIGH WAVE' ? '#ef4444' : '#3b82f6',
                    fillColor: w.condition === 'HIGH WAVE' ? '#ef4444' : '#3b82f6',
                    fillOpacity: 0.15,
                    weight: 1.5,
                  }}
                >
                  <Popup>
                    <div style={{ fontWeight: 700 }}>{w.condition}</div>
                    <div>Wave Height: {w.wave_height_m}m · Wind: {w.wind_speed_kmh} km/h</div>
                    <div>Sea Temp: {w.sst_c}°C</div>
                  </Popup>
                </Circle>
              ))}

            {/* 4. Oil Spills */}
            {layers.spills &&
              spills.map((s) => (
                <Circle
                  key={s.id}
                  center={[s.lat, s.lng]}
                  radius={s.radius_m}
                  pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.35, weight: 2 }}
                >
                  <Popup>
                    <div style={{ fontWeight: 700, color: '#ef4444' }}>⚠️ {s.name} (Oil Spill)</div>
                    <div>Severity: {s.severity}</div>
                    <div>Radius: {(s.radius_m / 1000).toFixed(1)} km</div>
                  </Popup>
                </Circle>
              ))}

            {/* 5. Marine Debris */}
            {layers.debris &&
              debris.map((d) => (
                <Marker key={d.id} position={[d.lat, d.lng]} icon={hazardIcon}>
                  <Popup>
                    <div style={{ fontWeight: 700, color: '#f59e0b' }}>⚠️ {d.name}</div>
                    <div>Cluster Size: {d.size}</div>
                    <div>Position: {d.lat.toFixed(2)}°N, {d.lng.toFixed(2)}°E</div>
                  </Popup>
                </Marker>
              ))}

            {/* 6. Geofences & Boundaries */}
            {layers.boundaries &&
              boundaries.map((b) => (
                <Polygon
                  key={b.id}
                  positions={b.coords}
                  pathOptions={{
                    color: b.type === 'protected' ? '#f59e0b' : '#8b5cf6',
                    fillColor: b.type === 'protected' ? '#f59e0b' : '#8b5cf6',
                    fillOpacity: 0.08,
                    weight: 2,
                    dashArray: b.type === 'protected' ? '4, 4' : undefined,
                  }}
                >
                  <Popup>
                    <div style={{ fontWeight: 700 }}>{b.name}</div>
                    <div>Type: {b.type.replace('_', ' ').toUpperCase()}</div>
                    <div>Active Geofencing: Enabled</div>
                  </Popup>
                </Polygon>
              ))}

            {/* 7. Fish Reproductive Habitats */}
            {layers.habitats &&
              habitats.map((h) => (
                <Polygon
                  key={h.id}
                  positions={h.coords}
                  pathOptions={{
                    color: '#22d3ee',
                    fillColor: '#22d3ee',
                    fillOpacity: 0.12,
                    weight: 1.5,
                  }}
                >
                  <Popup>
                    <div style={{ fontWeight: 700, color: '#22d3ee' }}>🐟 {h.name}</div>
                    <div>Species: {h.species}</div>
                    <div>Status: {h.status.toUpperCase()} ({h.season})</div>
                    <div>Temp Tolerance: {h.temp_min_c}°C – {h.temp_max_c}°C (Live: {h.sst_c}°C)</div>
                    <p style={{ fontSize: '0.72rem', marginTop: 4 }}>{h.description}</p>
                  </Popup>
                </Polygon>
              ))}

            {/* 8. Safe Corridors */}
            {layers.corridors &&
              corridors.map((c) => (
                <Polyline key={c.id} positions={c.points} pathOptions={{ color: '#3b82f6', weight: 3, opacity: 0.7 }}>
                  <Popup>
                    <div style={{ fontWeight: 700, color: '#3b82f6' }}>🧭 {c.name}</div>
                    <div>Standard Navigation Corridor</div>
                  </Popup>
                </Polyline>
              ))}

            {/* 9. Alerts & Field Observations */}
            {layers.alerts &&
              alerts.filter((a) => a.lat && a.lng).map((a) => (
                <Marker key={a.id} position={[a.lat!, a.lng!]} icon={observationIcon}>
                  <Popup>
                    <div style={{ fontWeight: 700, color: a.level === 'HIGH' ? '#ef4444' : a.level === 'CAUTION' ? '#f59e0b' : '#3b82f6' }}>
                      {a.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', marginTop: 3 }}>{a.message}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      Source: {a.source_ref || a.source_type || 'Field Observation'}
                    </div>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};
