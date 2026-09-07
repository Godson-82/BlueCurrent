// Tiny typed API client with Offline-first caching & Mesh sync support.
// Requests go to the same origin (the Vite dev server proxies /api and /socket.io).
// Override with VITE_API_URL when the backend is hosted separately.

const BASE = import.meta.env.VITE_API_URL || '';

// In-memory / LocalStorage cache for low-connectivity & offline readiness
const CACHE_PREFIX = 'bc_cache_';
const QUEUE_KEY = 'bc_offline_queue';

export function getCached<T>(path: string): T | null {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${path}`);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    // ignore
  }
  return null;
}

export function setCached<T>(path: string, data: T): void {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${path}`, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

export async function get<T>(path: string, useCache = true): Promise<T> {
  try {
    const res = await fetch(`${BASE}${path}`);
    if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
    const data = (await res.json()) as T;
    if (useCache) setCached(path, data);
    return data;
  } catch (err) {
    if (useCache) {
      const cached = getCached<T>(path);
      if (cached !== null) return cached;
    }
    throw err;
  }
}

export async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json();
}

// Queue observation/report for offline sync
export interface OfflineObservation {
  id: string;
  level: 'HIGH' | 'CAUTION' | 'INFO';
  title: string;
  message: string;
  lat: number;
  lng: number;
  source_type: string;
  source_ref: string;
  timestamp: string;
  synced?: boolean;
}

export function getOfflineQueue(): OfflineObservation[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function queueOfflineObservation(obs: Omit<OfflineObservation, 'id' | 'timestamp' | 'synced'>): OfflineObservation {
  const item: OfflineObservation = {
    ...obs,
    id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    synced: false,
  };
  const list = getOfflineQueue();
  list.unshift(item);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(list));
  return item;
}

export async function flushOfflineQueue(): Promise<{ syncedCount: number; remaining: number }> {
  const list = getOfflineQueue();
  if (!list.length) return { syncedCount: 0, remaining: 0 };
  const unSynced = list.filter((i) => !i.synced);
  let count = 0;
  const remainingList: OfflineObservation[] = [];

  for (const item of unSynced) {
    try {
      await post('/api/alerts', {
        level: item.level,
        title: item.title,
        message: item.message,
        lat: item.lat,
        lng: item.lng,
        source_type: item.source_type,
        source_ref: item.source_ref,
      });
      count++;
    } catch {
      remainingList.push(item);
    }
  }

  localStorage.setItem(QUEUE_KEY, JSON.stringify(remainingList));
  return { syncedCount: count, remaining: remainingList.length };
}

// Shared data models (mirror the backend).
export interface Vessel {
  id: number;
  name: string;
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  status: string;
}

export interface PfzZone {
  id: number;
  name: string;
  lat: number;
  lng: number;
  radius_m: number;
  sst_c: number;
  chlorophyll: string;
  density: string;
  yield_pct: number;
  distance_km: number;
}

export interface Spill {
  id: number;
  name: string;
  lat: number;
  lng: number;
  radius_m: number;
  severity: string;
}

export interface Debris {
  id: number;
  name: string;
  lat: number;
  lng: number;
  size: string;
}

export interface Boundary {
  id: number;
  name: string;
  type: string;
  coords: [number, number][];
}

export interface Corridor {
  id: number;
  name: string;
  points: [number, number][];
}

export interface Alert {
  id: number;
  level: string;
  title: string;
  message: string;
  lat: number | null;
  lng: number | null;
  created_at: string;
  source_type?: string;
  source_ref?: string;
}

export interface WeatherPoint {
  id: number;
  lat: number;
  lng: number;
  wave_height_m: number;
  wind_speed_kmh: number;
  sst_c: number;
  condition: string;
}

export interface Agent {
  id: number;
  name: string;
  status: string;
  latency_ms: number;
  source: string;
  message: string;
}

export interface SafetyCategory {
  key: string;
  label: string;
  score: number;
  weight: number;
  contributing: boolean;
  summary: string;
  detail: string;
}

export interface Safety {
  score: number;
  level: string;
  emoji: string;
  wavePeakM: number;
  windSpeedKmh: number;
  conditions: string;
  categories: SafetyCategory[];
  advisory: string;
}

export interface Stats {
  vesselsGuided: number;
  pfzZones: number;
  hazardLogs: number;
}

export interface LiveSnapshot {
  vessels: Vessel[];
  debris: Debris[];
  alerts: Alert[];
  weather: WeatherPoint[];
}

export interface HabitatZone {
  id: number;
  name: string;
  species: string;
  season: string;
  status: string;
  temp_min_c: number;
  temp_max_c: number;
  sst_c: number;
  coords: [number, number][];
  description: string;
}

export interface SpillAnalysis {
  id: number;
  spill_id: number;
  affected_area_km2: number;
  spread_points: [number, number][];
  affected_species: string[];
  response_status: string;
  recommendations: string;
  spill?: Spill;
}

export interface AgentEvidence {
  id: number;
  agent_id: number;
  claim: string;
  source: string;
  confidence_factor: number;
  reasoning: string;
}

export interface VesselTrack {
  id: number;
  vessel_id: number;
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  recorded_at: string;
}

export interface VesselTracksResponse {
  vessels: Vessel[];
  tracks: VesselTrack[];
}

export interface ReportContent {
  timeframe: string;
  period: string;
  summary: string;
  stats: Record<string, string | number>;
  sections: Array<{
    title: string;
    rows: Array<{
      label: string;
      value: string;
      severity: string;
    }>;
  }>;
}

export interface Report {
  id: number;
  type: string;
  title: string;
  generated_at: string;
  content: ReportContent;
}

export function formatStat(n: number): string {
  if (n >= 1000) return `${Math.round(n / 1000)}K+`;
  return `${n}+`;
}
