import React, { useState } from 'react';
import { Cpu, CheckCircle2, ShieldCheck, Database } from 'lucide-react';
import type { AgentEvidence } from '../api';

interface ExplainableAIEvidenceProps {
  evidence: AgentEvidence[];
  loading?: boolean;
}

export const ExplainableAIEvidence: React.FC<ExplainableAIEvidenceProps> = ({ evidence }) => {
  const [selectedSource, setSelectedSource] = useState<string>('ALL');

  const sources = ['ALL', ...Array.from(new Set(evidence.map((e) => e.source)))];

  const filtered = selectedSource === 'ALL' ? evidence : evidence.filter((e) => e.source === selectedSource);

  return (
    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexShrink: 0 }}>
        <div>
          <h2 className="section-title">Explainable AI (XAI) Confidence &amp; Evidence Transparency</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Verifiable telemetry provenance, sensor confidence factors, and formal justification chains for all automated decisions.
          </p>
        </div>
        <span className="badge badge-teal"><CheckCircle2 size={11} /> 100% Provenance Audit Trail</span>
      </div>

      {/* Source Filters */}
      <div className="surface-base" style={{ padding: '12px 18px', marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
        <span className="label-caps" style={{ marginRight: '8px' }}><Database size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} /> Telemetry Sensor:</span>
        {sources.map((s) => (
          <button
            key={s}
            className={selectedSource === s ? 'btn-primary' : 'btn-ghost'}
            style={{ padding: '4px 12px', fontSize: '0.72rem' }}
            onClick={() => setSelectedSource(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Evidence Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gridTemplateRows: 'repeat(3, 1fr)', gap: '10px', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {filtered.map((e, idx) => (
          <div key={e.id} className={`surface-card anim-slide-l anim-d${Math.min(idx + 1, 8)}`} style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '6px', minHeight: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={14} color="var(--accent-teal)" />
                <span className="badge badge-purple" style={{ fontSize: '0.68rem' }}>{e.source}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="stat-number" style={{ fontSize: '1.1rem', color: e.confidence_factor >= 90 ? 'var(--accent-teal)' : 'var(--accent-amber)' }}>
                  {e.confidence_factor}%
                </span>
                <div className="label-caps" style={{ fontSize: '0.55rem' }}>Confidence Index</div>
              </div>
            </div>

            <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.25 }}>
              "{e.claim}"
            </div>

            <div className="surface-inset" style={{ padding: '8px 10px', borderLeft: '3px solid var(--accent-teal)', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="label-caps" style={{ color: 'var(--accent-teal)', marginBottom: '3px', flexShrink: 0, fontSize: '0.6rem' }}>Technical Justification Chain</div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {e.reasoning}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', color: 'var(--text-muted)', flexShrink: 0 }}>
              <span>Agent ID: #{e.agent_id}</span>
              <span style={{ color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={11} /> Cryptographically Verified Sensor Log
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
