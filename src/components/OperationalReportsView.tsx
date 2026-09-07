import React, { useState } from 'react';
import { FileText, Download, Printer, RefreshCw } from 'lucide-react';
import { post, type Report } from '../api';

interface OperationalReportsViewProps {
  reports: Report[];
  onReportGenerated: () => void;
}

export const OperationalReportsView: React.FC<OperationalReportsViewProps> = ({
  reports,
  onReportGenerated,
}) => {
  const [selectedReportId, setSelectedReportId] = useState<number | null>(reports[0]?.id || null);
  const [generating, setGenerating] = useState<boolean>(false);
  const [genType, setGenType] = useState<'daily' | 'weekly'>('daily');

  const activeReport = reports.find((r) => r.id === (selectedReportId ?? reports[0]?.id)) || reports[0];

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await post('/api/reports/generate', { type: genType });
      onReportGenerated();
    } catch (err) {
      console.error('Failed to generate report', err);
    } finally {
      setGenerating(false);
    }
  };

  const exportJSON = () => {
    if (!activeReport) return;
    const blob = new Blob([JSON.stringify(activeReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BlueCurrent_Report_${activeReport.type}_${new Date(activeReport.generated_at).toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexShrink: 0 }}>
        <div>
          <h2 className="section-title">Automated Operational Marine Reports</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Machine-compiled executive intelligence summaries, fleet safety metrics, and fishery yield logs.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            className="select-field"
            style={{ width: '130px', padding: '6px 10px', fontSize: '0.78rem' }}
            value={genType}
            onChange={(e) => setGenType(e.target.value as any)}
          >
            <option value="daily">Daily Ops</option>
            <option value="weekly">Weekly Ops</option>
          </select>
          <button className="btn-primary" onClick={handleGenerate} disabled={generating}>
            <RefreshCw size={14} className={generating ? 'anim-spin' : ''} />
            {generating ? 'Compiling…' : 'Generate New Report'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '18px', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* Report History List */}
        <div className="surface-base" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: 0, overflow: 'hidden' }}>
          <div className="label-caps" style={{ paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
            Generated Reports ({reports.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px', flex: 1, minHeight: 0, overflowY: 'auto' }}>
            {reports.map((rep) => {
              const isSelected = activeReport?.id === rep.id;
              return (
                <div
                  key={rep.id}
                  onClick={() => setSelectedReportId(rep.id)}
                  className="surface-card"
                  style={{
                    padding: '12px 14px',
                    cursor: 'pointer',
                    borderColor: isSelected ? 'var(--accent-teal)' : undefined,
                    background: isSelected ? 'rgba(0, 212, 170, 0.08)' : undefined,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className={`badge ${rep.type === 'weekly' ? 'badge-purple' : 'badge-blue'}`}>
                      {rep.type.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {new Date(rep.generated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '8px' }}>
                    {rep.title}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {rep.content.period}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Report Content Viewer */}
        {activeReport ? (
          <div className="surface-elevated anim-scale" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'auto', minHeight: 0 }}>
            {/* Header / Meta */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={20} color="var(--accent-teal)" />
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>{activeReport.title}</h3>
                  <span className="badge badge-teal">{activeReport.content.timeframe.toUpperCase()}</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '6px' }}>
                  Coverage Period: <strong>{activeReport.content.period}</strong> · Compiled: {new Date(activeReport.generated_at).toLocaleString()}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-secondary" onClick={exportJSON} style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                  <Download size={13} /> Export JSON
                </button>
                <button className="btn-ghost" onClick={handlePrint} style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                  <Printer size={13} /> Print
                </button>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="surface-inset" style={{ padding: '10px 12px', borderLeft: '4px solid var(--accent-teal)' }}>
              <div className="label-caps" style={{ color: 'var(--accent-teal)', marginBottom: '3px', fontSize: '0.6rem' }}>Executive Summary</div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                {activeReport.content.summary}
              </p>
            </div>

            {/* KPI Stats Grid */}
            <div>
              <div className="label-caps" style={{ marginBottom: '6px' }}>Key Performance Metrics</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {Object.entries(activeReport.content.stats).map(([k, v], idx) => (
                  <div key={idx} className="surface-inset" style={{ padding: '8px 10px' }}>
                    <div className="label-caps" style={{ fontSize: '0.58rem' }}>{k}</div>
                    <div className="stat-number" style={{ fontSize: '1.05rem', marginTop: '3px', color: 'var(--accent-teal)' }}>
                      {v}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Section Tables */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {activeReport.content.sections.map((sec, sIdx) => (
                <div key={sIdx} className="surface-card" style={{ padding: '12px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {sec.title}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {sec.rows.map((row, rIdx) => {
                      const color = row.severity === 'crit' ? 'var(--accent-red)' : row.severity === 'warn' ? 'var(--accent-amber)' : 'var(--text-primary)';
                      return (
                        <div
                          key={rIdx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '4px 8px',
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                          }}
                        >
                          <span style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
                          <span style={{ fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>{row.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="surface-base" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No report selected. Generate a new report to view analytics.
          </div>
        )}
      </div>
    </div>
  );
};
