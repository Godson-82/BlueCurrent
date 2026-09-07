import React, { useState } from 'react';
import { AlertTriangle, AlertCircle, Info, Clock, Search, Plus, Check } from 'lucide-react';
import { ElectricBorder } from './effects';
import type { Alert } from '../api';

interface HazardAlertPanelProps {
  alerts: Alert[];
  onOpenGeotagModal: () => void;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.round(diff / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  return `${hrs}h ago`;
}

export const HazardAlertPanel: React.FC<HazardAlertPanelProps> = ({ alerts, onOpenGeotagModal }) => {
  const [filter, setFilter] = useState<'ALL' | 'HIGH' | 'CAUTION' | 'INFO'>('ALL');
  const [search, setSearch] = useState<string>('');
  const [acknowledged, setAcknowledged] = useState<Set<number>>(new Set());

  const toggleAcknowledge = (id: number) => {
    setAcknowledged((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = alerts.filter((a) => {
    if (filter !== 'ALL' && a.level !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return a.title.toLowerCase().includes(q) || a.message.toLowerCase().includes(q);
    }
    return true;
  });

  const levelMeta = (level: string) => {
    if (level === 'HIGH') return { color: 'var(--accent-red)', icon: <AlertTriangle size={16} />, badge: 'badge-red' };
    if (level === 'CAUTION') return { color: 'var(--accent-amber)', icon: <AlertCircle size={16} />, badge: 'badge-amber' };
    return { color: 'var(--accent-blue)', icon: <Info size={16} />, badge: 'badge-blue' };
  };

  return (
    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexShrink: 0 }}>
        <div>
          <h2 className="section-title">Real-Time Hazard Alert Panel</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Live maritime warnings, weather squalls, debris notices, and vessel observation logs.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-primary" onClick={onOpenGeotagModal}>
            <Plus size={14} /> Log Field Observation
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="surface-base" style={{ padding: '14px 18px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['ALL', 'HIGH', 'CAUTION', 'INFO'] as const).map((lvl) => (
            <button
              key={lvl}
              className={filter === lvl ? 'btn-primary' : 'btn-ghost'}
              style={{ padding: '6px 14px', fontSize: '0.75rem' }}
              onClick={() => setFilter(lvl)}
            >
              {lvl}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', maxWidth: '300px', width: '100%' }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search alerts by keyword…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '32px', height: '34px', fontSize: '0.78rem' }}
          />
        </div>
      </div>

      {/* Alert Feed — scrollable region */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flex: 1, minHeight: 0, paddingRight: '4px', paddingBottom: '76px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,212,170,0.25) transparent' }}>
        {filtered.length === 0 ? (
          <div className="surface-card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No hazard alerts matching current filter.
          </div>
        ) : (
          filtered.map((a, i) => {
            const meta = levelMeta(a.level);
            const isAck = acknowledged.has(a.id);
            const isHigh = a.level === 'HIGH';
            const baseClassName = `surface-card anim-slide-l anim-d${Math.min(i + 1, 8)}`;

            const cardBody = (
              <div style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ color: meta.color, marginTop: '2px', display: 'flex' }}>{meta.icon}</span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className={`badge ${meta.badge}`}>{a.level}</span>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                          {a.title}
                        </h3>
                        {isAck && <span className="badge badge-teal"><Check size={10} /> Acknowledged</span>}
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', marginTop: '6px', lineHeight: 1.5 }}>
                        {a.message}
                      </p>
                      {a.lat && a.lng && (
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-teal)', marginTop: '6px' }}>
                          Geotag: {a.lat.toFixed(2)}°N, {a.lng.toFixed(2)}°E · Source: {a.source_ref || a.source_type || 'Sensor Feed'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                      <Clock size={11} /> {timeAgo(a.created_at)}
                    </span>
                    <button
                      className="btn-ghost"
                      onClick={() => toggleAcknowledge(a.id)}
                      style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                    >
                      {isAck ? 'Un-acknowledge' : 'Acknowledge'}
                    </button>
                  </div>
                </div>
              </div>
            );

            // HIGH alerts get a jittery live-electric border (reactbits ElectricBorder)
            if (isHigh) {
              return (
                <ElectricBorder
                  key={a.id}
                  color="#ef4444"
                  borderRadius={12}
                  speed={1}
                  chaos={0.12}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div
                    className={baseClassName}
                    style={{ borderRadius: 12, borderLeft: `4px solid ${meta.color}`, opacity: isAck ? 0.6 : 1 }}
                  >
                    {cardBody}
                  </div>
                </ElectricBorder>
              );
            }

            return (
              <div
                key={a.id}
                className={baseClassName}
                style={{
                  borderLeft: `4px solid ${meta.color}`,
                  opacity: isAck ? 0.6 : 1,
                }}
              >
                {cardBody}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
