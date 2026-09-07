import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Database, CloudOff, CheckCircle2 } from 'lucide-react';
import { getOfflineQueue, flushOfflineQueue, type OfflineObservation } from '../api';

interface OfflineModeStatusProps {
  isOffline: boolean;
  setIsOffline: (val: boolean) => void;
  onSyncComplete?: () => void;
}

export const OfflineModeStatus: React.FC<OfflineModeStatusProps> = ({
  isOffline,
  setIsOffline,
  onSyncComplete,
}) => {
  const [queue, setQueue] = useState<OfflineObservation[]>([]);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [lastSyncResult, setLastSyncResult] = useState<string | null>(null);

  const refreshQueue = () => {
    setQueue(getOfflineQueue());
  };

  useEffect(() => {
    refreshQueue();
    const interval = setInterval(refreshQueue, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleFlush = async () => {
    setSyncing(true);
    try {
      const res = await flushOfflineQueue();
      setLastSyncResult(`Synced ${res.syncedCount} queued observations`);
      refreshQueue();
      if (onSyncComplete) onSyncComplete();
    } catch {
      setLastSyncResult('Sync failed. Retrying when connection restores.');
    } finally {
      setSyncing(false);
      setTimeout(() => setLastSyncResult(null), 3500);
    }
  };

  return (
    <div className="connectivity-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isOffline ? (
            <span className="badge badge-amber" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <WifiOff size={11} /> Offline Simulation
            </span>
          ) : (
            <span className="badge badge-teal" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Wifi size={11} /> Sat-Link Online
            </span>
          )}
        </div>

        <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem' }}>
          <span><Database size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} /> Indexed Local Storage Cached</span>
          {queue.length > 0 && (
            <span className="badge badge-purple" style={{ padding: '2px 6px', fontSize: '0.62rem' }}>
              {queue.length} Pending Sync
            </span>
          )}
        </div>

        {lastSyncResult && (
          <span style={{ color: 'var(--accent-teal)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={12} /> {lastSyncResult}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {queue.length > 0 && !isOffline && (
          <button
            className="btn-ghost"
            onClick={handleFlush}
            disabled={syncing}
            style={{ padding: '4px 8px', fontSize: '0.7rem', color: 'var(--accent-teal)' }}
          >
            <RefreshCw size={11} className={syncing ? 'anim-spin' : ''} />
            {syncing ? 'Syncing…' : `Sync ${queue.length} items`}
          </button>
        )}

        <button
          className={isOffline ? 'btn-secondary' : 'btn-ghost'}
          onClick={() => setIsOffline(!isOffline)}
          style={{ padding: '3px 8px', fontSize: '0.68rem', height: '24px' }}
          title="Toggle offline/low-connectivity mode simulation"
        >
          {isOffline ? <CloudOff size={11} /> : <WifiOff size={11} />}
          {isOffline ? 'Go Online' : 'Simulate Offline'}
        </button>
      </div>
    </div>
  );
};
