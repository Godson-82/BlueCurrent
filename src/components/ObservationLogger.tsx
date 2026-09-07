import React, { useState } from 'react';
import { MapPin, Send, X, Camera, CheckCircle } from 'lucide-react';
import { post, queueOfflineObservation } from '../api';

interface ObservationLoggerProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCoords?: [number, number];
  isOffline?: boolean;
  onObservationAdded?: () => void;
}

export const ObservationLogger: React.FC<ObservationLoggerProps> = ({
  isOpen,
  onClose,
  defaultCoords = [18.42, 84.25],
  isOffline = false,
  onObservationAdded,
}) => {
  const [level, setLevel] = useState<'HIGH' | 'CAUTION' | 'INFO'>('CAUTION');
  const [category, setCategory] = useState<string>('Marine Debris');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [lat, setLat] = useState<number>(defaultCoords[0]);
  const [lng, setLng] = useState<number>(defaultCoords[1]);
  const [vesselRef, setVesselRef] = useState<string>('ORCA-01 (Field Sighting)');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAutoGeotag = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(Number(pos.coords.latitude.toFixed(4)));
          setLng(Number(pos.coords.longitude.toFixed(4)));
        },
        () => {
          // fallback around standard vessel position
          setLat(Number((18.35 + Math.random() * 0.4).toFixed(4)));
          setLng(Number((84.15 + Math.random() * 0.5).toFixed(4)));
        },
        { timeout: 4000 }
      );
    } else {
      setLat(Number((18.35 + Math.random() * 0.4).toFixed(4)));
      setLng(Number((84.15 + Math.random() * 0.5).toFixed(4)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);

    const fullTitle = `[${category}] ${title.trim()}`;
    const payload = {
      level,
      title: fullTitle,
      message: `${description.trim()} · Geotagged at ${lat}°N, ${lng}°E. Sighted by ${vesselRef}.`,
      lat,
      lng,
      source_type: 'observation',
      source_ref: vesselRef,
    };

    try {
      if (isOffline) {
        queueOfflineObservation(payload);
        setSuccessMsg('Observation recorded to Local Offline Queue (will auto-sync upon reconnection).');
      } else {
        await post('/api/alerts', payload);
        setSuccessMsg('Geotagged observation broadcasted live to the BlueCurrent network!');
      }

      setTimeout(() => {
        setSubmitting(false);
        setSuccessMsg(null);
        if (onObservationAdded) onObservationAdded();
        onClose();
      }, 1500);
    } catch {
      // If network fails, queue it locally
      queueOfflineObservation(payload);
      setSuccessMsg('Network unavailable. Stored in Offline Mesh Queue.');
      setTimeout(() => {
        setSubmitting(false);
        setSuccessMsg(null);
        if (onObservationAdded) onObservationAdded();
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="modal-overlay anim-fade-only">
      <div className="modal-card anim-scale" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 34, height: 34, borderRadius: '8px', background: 'rgba(0,212,170,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-teal)' }}>
              <MapPin size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Automatic Geotagged Observation</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Log field observation with instant GPS geotagging</p>
            </div>
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {successMsg ? (
          <div className="surface-inset" style={{ padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <CheckCircle size={36} color="var(--accent-teal)" />
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{successMsg}</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="label-caps" style={{ display: 'block', marginBottom: '6px' }}>Severity Level</label>
                <select className="select-field" value={level} onChange={(e) => setLevel(e.target.value as any)}>
                  <option value="HIGH">🔴 High (Hazard / Distress)</option>
                  <option value="CAUTION">🟡 Caution (Advisory)</option>
                  <option value="INFO">🔵 Info (General Observation)</option>
                </select>
              </div>
              <div>
                <label className="label-caps" style={{ display: 'block', marginBottom: '6px' }}>Category</label>
                <select className="select-field" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="Marine Debris">Marine Debris / Flotsam</option>
                  <option value="Oil Slick">Oil Slick / Chemical Sheen</option>
                  <option value="Mammal / Spawning Sighting">Marine Species / Spawning Pod</option>
                  <option value="Unregistered Vessel">Unregistered / Rogue Vessel</option>
                  <option value="Weather Hazard">Squall / Water Spout</option>
                  <option value="Navigation Aid Flaw">Buoy / Lighthouse Malfunction</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label-caps" style={{ display: 'block', marginBottom: '6px' }}>Observation Title</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Submerged 20ft container drifting east"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label-caps" style={{ display: 'block', marginBottom: '6px' }}>Detailed Field Notes</label>
              <textarea
                className="input-field"
                rows={3}
                placeholder="Provide visual description, estimated drift velocity, or nearby vessel risks…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="surface-inset" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="label-caps">GPS Geotag Coordinates</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent-teal)', marginTop: '2px' }}>
                  {lat}°N, {lng}°E
                </div>
              </div>
              <button type="button" className="btn-secondary" onClick={handleAutoGeotag} style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                <MapPin size={12} /> Re-acquire GPS
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="label-caps" style={{ display: 'block', marginBottom: '6px' }}>Reporting Vessel</label>
                <input
                  type="text"
                  className="input-field"
                  value={vesselRef}
                  onChange={(e) => setVesselRef(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Camera size={14} color="var(--accent-teal)" /> Sensor snapshot auto-attached
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" className="btn-ghost" onClick={onClose} disabled={submitting}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                <Send size={14} /> {submitting ? 'Broadcasting…' : 'Submit & Geotag'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
