import React, { useState } from 'react';
import { Waves, Wind, AlertTriangle, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import type { Safety, SafetyCategory } from '../api';
import { SplitFlapText } from './effects';

interface MarineSafetyScoreViewProps {
  safety: Safety | null;
}

const riskColorOf = (score: number) =>
  score >= 80 ? 'var(--accent-red)' : score >= 60 ? 'var(--accent-amber)' : score >= 40 ? 'var(--accent-blue)' : 'var(--accent-teal)';

const catIcon: Record<string, React.ReactNode> = {
  sea: <Waves size={18} color="var(--accent-blue)" />,
  wind: <Wind size={18} color="var(--accent-teal)" />,
  hazard: <AlertTriangle size={18} color="var(--accent-amber)" />,
  nav: <MapPin size={18} color="var(--accent-purple)" />,
};

const CategoryCard: React.FC<{ cat: SafetyCategory }> = ({ cat }) => {
  const [expanded, setExpanded] = useState(false);
  const color = riskColorOf(cat.score);
  const isContributing = cat.contributing;

  return (
    <div className="surface-inset anim-slide-l" style={{ overflow: 'hidden' }}>
    <div
      style={{
        padding: '14px 16px',
        borderLeft: `4px solid ${isContributing ? color : 'var(--border-subtle)'}`,
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '8px', background: `${color}14`, flexShrink: 0 }}>{catIcon[cat.key]}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="label-caps" style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>{cat.label}</span>
              <span className="badge" style={{ fontSize: '0.52rem', padding: '1px 6px', background: `${color}12`, color: 'var(--text-muted)', border: `1px solid ${color}33` }}>
                {cat.weight}% weight
              </span>
              {isContributing && <span className="badge" style={{ fontSize: '0.52rem', padding: '1px 6px', background: `${color}20`, color, fontWeight: 700 }}>▲ Factor</span>}
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-primary)', marginTop: '2px' }}>
              {cat.summary}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color, lineHeight: 1, fontFamily: 'var(--font-mono)' }}>{cat.score}</div>
            <div className="label-caps" style={{ fontSize: '0.48rem', color: 'var(--text-muted)' }}>/ 100</div>
          </div>
          {expanded ? <ChevronUp size={15} color="var(--text-secondary)" /> : <ChevronDown size={15} color="var(--text-secondary)" />}
        </div>
      </div>

      {/* Score bar */}
      <div style={{ marginTop: '10px', height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${cat.score}%`, background: `linear-gradient(90deg, ${color}66, ${color})`, borderRadius: '3px', transition: 'width 0.4s ease', boxShadow: `0 0 8px ${color}44` }} />
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ marginTop: '12px', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.65, borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
          {cat.detail}
        </div>
      )}
    </div>
    </div>
  );
};

export const MarineSafetyScoreView: React.FC<MarineSafetyScoreViewProps> = ({ safety }) => {
  const score = safety?.score ?? 38;
  const color = riskColorOf(score);
  const categories = safety?.categories ?? [];
  const contributing = categories.filter((c) => c.contributing);

  return (
    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,212,170,0.25) transparent', paddingRight: '2px', paddingBottom: '76px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap', flexShrink: 0 }}>
        <div>
          <h2 className="section-title">Composite Marine Safety Score</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Real-time hydro-meteorological and navigational threat evaluation engine.
          </p>
        </div>
        {safety && (
          <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
            {[
              { icon: '🌊', label: 'Wave peak', v: `${safety.wavePeakM}m` },
              { icon: '💨', label: 'Wind', v: `${safety.windSpeedKmh} km/h` },
              { icon: '📡', label: 'Condition', v: safety.conditions },
            ].map((c) => (
              <div key={c.label} className="surface-base" style={{ padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span className="label-caps" style={{ fontSize: '0.55rem' }}>{c.icon} {c.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>{c.v}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Two-panel grid: score gauge (left) + breakdown & advisory (right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px', alignItems: 'stretch', flex: 1, minHeight: 0 }}>
        {/* LEFT — Score dial */}
        <div className="surface-elevated anim-scale" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px', padding: '28px 24px', justifyContent: 'center' }}>
          <div className="label-caps" style={{ color: 'var(--text-muted)' }}>Overall Risk Index</div>

          {/* Risk Circular Gauge */}
          <div
            className="safety-gauge-outer"
            style={{
              width: '190px',
              height: '190px',
              borderRadius: '50%',
              background: '#0a1628',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Gauge arc overlay — donut ring with conic color */}
            <div
              className="safety-gauge-arc"
              style={{
                '--gauge-conic': `conic-gradient(color-mix(in srgb, ${color} 60%, transparent) ${score}%, rgba(100,160,200,0.08) ${score}%)`,
              } as React.CSSProperties}
            />
            {/* Ticks */}
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: 0, left: '50%',
                  width: 2, height: 8,
                  transformOrigin: '50% 95px',
                  transform: `translateX(-50%) rotate(${i * 30 - 90}deg) translateY(95px)`,
                  background: i * 30 <= score * 3.6 ? color : 'rgba(100,160,200,0.15)',
                  zIndex: 1,
                }}
              />
            ))}
            <div
              style={{
                width: '182px',
                height: '182px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 50% 35%, #132a4a 0%, #0a1628 100%)',
                border: '1px solid var(--border-accent)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'inset 0 0 24px rgba(0,0,0,0.5)',
                overflow: 'hidden',
                position: 'relative',
                zIndex: 2,
              }}
            >
              <div className="stat-number" style={{ color, lineHeight: 1 }}>
                <SplitFlapText text={String(score)} padTo={0} charset="numeric" fontSize={52} gap={4} tileRadius={6} tileColor="#0d1f38" textColor={color} flipDuration={0.15} stagger={80} />
              </div>
              <div className="label-caps" style={{ fontSize: '0.6rem', marginTop: '4px' }}>/ 100 Risk Index</div>
            </div>
          </div>

          <div
            className="badge"
            style={{
              background: `${color}18`,
              color,
              border: `1px solid ${color}`,
              fontSize: '0.8rem',
              padding: '5px 16px',
              borderRadius: '20px',
              fontWeight: 800,
              letterSpacing: '0.04em',
            }}
          >
            {safety?.level || 'MODERATE CAUTION'}
          </div>

          {/* Contributing factors */}
          <div style={{ width: '100%' }}>
            <div className="label-caps" style={{ fontSize: '0.58rem', textAlign: 'center', marginBottom: '10px' }}>Contributing Factors</div>
            {contributing.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {contributing.map((c) => (
                  <div key={c.key} className="surface-inset" style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `3px solid ${riskColorOf(c.score)}` }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{c.label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 800, color: riskColorOf(c.score) }}>{c.score}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>No adverse factors detected</div>
            )}
          </div>
        </div>

        {/* RIGHT — Breakdown + Advisory */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0 }}>
          {categories.length > 0 && (
            <div className="surface-elevated" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flex: 1, minHeight: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="label-caps" style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Risk Category Breakdown</div>
                <span className="label-caps" style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>{categories.length} categories</span>
              </div>
              {categories.map((cat) => (
                <CategoryCard key={cat.key} cat={cat} />
              ))}
            </div>
          )}

          {/* Advisory Bar */}
          <div className="surface-inset" style={{ padding: '14px 18px', borderLeft: `4px solid ${color}`, flexShrink: 0 }}>
            <div className="label-caps" style={{ color }}>⚠ Automated Fleet Advisory</div>
            <p style={{ margin: '6px 0 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {safety?.advisory || (score < 40
                ? 'Conditions optimal for standard cruising and fishing operations across all monitored sectors.'
                : score < 70
                ? 'Moderate sea states observed. Maintain minimum 2 NM clearance from hazard zones.'
                : 'Gale squall alert active. Small vessels advised to alter heading toward nearest shelter.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
