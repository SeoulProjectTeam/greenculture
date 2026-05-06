/**
 * 코스 주변 식사 후보 조회.
 *
 * 1순위: 백엔드 `/api/seoul/nearby-food-cert` → 서울시 식품 인증·지정 업소 OpenAPI(열린데이터광장).
 * 실패·미설정 시: 목 데이터 폴백.
 */
import type { CultureEvent, TravelDurationId } from '../types/culture';
import { MOCK_RESTAURANT_POOL } from '../data/mockRestaurants';
import { getFrontendEnv } from '../config/env';
import { haversineDistance } from '../utils/distance';

export interface RestaurantCandidate {
  id: string;
  name: string;
  cuisineType: string;
  signatureMenu: string;
  /** 식품인증업소 API의 CRTFC_SNO 등 */
  certificationNo?: string;
  address: string;
  district: string;
  detailUrl: string;
  /** 업스트림에 있을 때만 */
  phone?: string;
  latitude?: number;
  longitude?: number;
  /** 최근접 행사까지 직선 거리(m). 좌표 부족 시 null */
  distanceMeters: number | null;
}

export type FetchNearbyRestaurantsOptions = {
  travelDuration: TravelDurationId;
  signal?: AbortSignal;
};

function backendNearbyFoodUrl(): string {
  const base = getFrontendEnv().backendBaseUrl.trim();
  return base ? `${base}/api/seoul/nearby-food-cert` : '/api/seoul/nearby-food-cert';
}

function maxSlotsForDuration(travelDuration: TravelDurationId): number {
  switch (travelDuration) {
    case 'short':
      return 1;
    case 'half-day':
      return 1;
    case 'full-day':
      return 2;
    default:
      return 1;
  }
}

function normalizeDedupeText(s: string): string {
  return String(s ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function restaurantInfoRichness(r: RestaurantCandidate): number {
  let n = 0;
  if (r.phone?.trim()) n += 1;
  if (r.certificationNo?.trim()) n += 1;
  if (r.detailUrl?.trim()) n += 1;
  if (r.cuisineType?.trim()) n += 1;
  if (r.signatureMenu?.trim()) n += 1;
  if (r.name?.trim()) n += 1;
  if (r.address?.trim()) n += 1;
  if (r.district?.trim()) n += 1;
  if (
    typeof r.latitude === 'number' &&
    typeof r.longitude === 'number' &&
    Number.isFinite(r.latitude) &&
    Number.isFinite(r.longitude)
  ) {
    n += 1;
  }
  return n;
}

/** 거리 우선(가까울수록·좌표 없음은 뒤로), 동거리면 정보가 더 많은 항목 */
function pickBetterRestaurantCandidate(a: RestaurantCandidate, b: RestaurantCandidate): RestaurantCandidate {
  const da = a.distanceMeters;
  const db = b.distanceMeters;
  const aOk = da !== null && Number.isFinite(da);
  const bOk = db !== null && Number.isFinite(db);
  if (aOk !== bOk) return aOk ? a : b;
  if (aOk && bOk && da !== db) return da! <= db! ? a : b;

  const ra = restaurantInfoRichness(a);
  const rb = restaurantInfoRichness(b);
  if (ra !== rb) return ra > rb ? a : b;

  return a.id <= b.id ? a : b;
}

function restaurantCandidatesDuplicate(a: RestaurantCandidate, b: RestaurantCandidate): boolean {
  const na = normalizeDedupeText(a.name);
  const nb = normalizeDedupeText(b.name);
  const aa = normalizeDedupeText(a.address);
  const ab = normalizeDedupeText(b.address);
  const ma = normalizeDedupeText(a.signatureMenu);
  const mb = normalizeDedupeText(b.signatureMenu);

  if (!aa || !ab || aa !== ab) return false;

  const nameMatch = Boolean(na && nb && na === nb);
  const menuMatch = Boolean(ma && mb && ma === mb);
  return nameMatch || menuMatch;
}

/**
 * 정렬 전 동일 업소 병합.
 * 1) 이름+주소 동일 → 중복
 * 2) 주소+대표메뉴 동일(이름은 달라도 됨) → 중복
 * 대표: 더 가까운 항목, 동거리·무좌표면 정보 필드가 더 많은 항목
 */
function dedupeRestaurantCandidates(items: RestaurantCandidate[]): RestaurantCandidate[] {
  const n = items.length;
  if (n <= 1) return [...items];

  const parent = items.map((_, i) => i);
  const find = (i: number): number => {
    if (parent[i] !== i) parent[i] = find(parent[i]);
    return parent[i];
  };
  const union = (i: number, j: number) => {
    const ri = find(i);
    const rj = find(j);
    if (ri !== rj) parent[rj] = ri;
  };

  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      if (restaurantCandidatesDuplicate(items[i], items[j])) union(i, j);
    }
  }

  const roots = new Map<number, RestaurantCandidate>();
  for (let i = 0; i < n; i += 1) {
    const r = find(i);
    const cur = items[i];
    const prev = roots.get(r);
    roots.set(r, prev ? pickBetterRestaurantCandidate(prev, cur) : cur);
  }

  return [...roots.values()];
}

function sortCandidatesByApiDistance(a: RestaurantCandidate, b: RestaurantCandidate): number {
  const da = a.distanceMeters ?? Number.POSITIVE_INFINITY;
  const db = b.distanceMeters ?? Number.POSITIVE_INFINITY;
  if (da !== db) return da - db;
  return a.id.localeCompare(b.id);
}

function minDistanceMetersToEvents(
  lat: number,
  lng: number,
  events: CultureEvent[],
): number | null {
  let best: number | null = null;
  for (const ev of events) {
    if (
      typeof ev.latitude !== 'number' ||
      typeof ev.longitude !== 'number' ||
      !Number.isFinite(ev.latitude) ||
      !Number.isFinite(ev.longitude)
    ) {
      continue;
    }
    const km = haversineDistance(lat, lng, ev.latitude, ev.longitude);
    const m = km * 1000;
    if (best === null || m < best) best = m;
  }
  return best;
}

function mockCandidateSortScore(c: RestaurantCandidate, events: CultureEvent[]): number {
  const eventDistricts = new Set(events.map((e) => e.district).filter(Boolean));
  const districtMatch = eventDistricts.has(c.district) ? 0 : 1000;

  let distanceKm = 500;
  if (
    typeof c.latitude === 'number' &&
    typeof c.longitude === 'number' &&
    Number.isFinite(c.latitude) &&
    Number.isFinite(c.longitude)
  ) {
    const m = c.distanceMeters;
    distanceKm = m !== null ? m / 1000 : 500;
  }

  return districtMatch + distanceKm;
}

function pickFromMock(events: CultureEvent[], travelDuration: TravelDurationId): RestaurantCandidate[] {
  if (events.length === 0) return [];

  const max = maxSlotsForDuration(travelDuration);
  const eventDistricts = new Set(events.map((e) => e.district).filter(Boolean));

  let pool = MOCK_RESTAURANT_POOL.filter((r) => eventDistricts.has(r.district));
  if (pool.length === 0) pool = [...MOCK_RESTAURANT_POOL];

  const candidates: RestaurantCandidate[] = pool.map((row) => {
    let distanceMeters: number | null = null;
    if (
      typeof row.latitude === 'number' &&
      typeof row.longitude === 'number' &&
      Number.isFinite(row.latitude) &&
      Number.isFinite(row.longitude)
    ) {
      distanceMeters = minDistanceMetersToEvents(row.latitude, row.longitude, events);
    }
    return {
      id: row.id,
      name: row.name,
      cuisineType: row.cuisineType,
      signatureMenu: row.signatureMenu,
      address: row.address,
      district: row.district,
      detailUrl: row.detailUrl,
      latitude: row.latitude,
      longitude: row.longitude,
      distanceMeters,
    };
  });

  const deduped = dedupeRestaurantCandidates(candidates);
  deduped.sort((a, b) => mockCandidateSortScore(a, events) - mockCandidateSortScore(b, events));

  return deduped.slice(0, max);
}

function parseProxyItems(payload: unknown): RestaurantCandidate[] {
  if (!payload || typeof payload !== 'object') return [];
  const raw = (payload as { items?: unknown }).items;
  if (!Array.isArray(raw)) return [];

  const out: RestaurantCandidate[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const o = row as Record<string, unknown>;
    const id = String(o.id ?? '');
    const name = String(o.name ?? '');
    if (!id || !name) continue;

    const lat = typeof o.latitude === 'number' ? o.latitude : Number.NaN;
    const lng = typeof o.longitude === 'number' ? o.longitude : Number.NaN;

    const dmRaw = o.distanceMeters;
    let distanceMeters: number | null = null;
    if (dmRaw !== null && dmRaw !== undefined && Number.isFinite(Number(dmRaw))) {
      distanceMeters = Number(dmRaw);
    }

    const phoneRaw = o.phone;
    const phone = typeof phoneRaw === 'string' && phoneRaw.trim() ? phoneRaw.trim() : undefined;

    const certRaw = o.certificationNo;
    const certificationNo =
      typeof certRaw === 'string' && certRaw.trim() ? certRaw.trim() : undefined;

    out.push({
      id,
      name,
      cuisineType: String(o.cuisineType ?? ''),
      signatureMenu: String(o.signatureMenu ?? ''),
      certificationNo,
      address: String(o.address ?? ''),
      district: String(o.district ?? ''),
      detailUrl: String(o.detailUrl ?? ''),
      phone,
      latitude: Number.isFinite(lat) ? lat : undefined,
      longitude: Number.isFinite(lng) ? lng : undefined,
      distanceMeters,
    });
  }
  return out;
}

async function fetchFromSeoulFoodCertApi(
  events: CultureEvent[],
  options: FetchNearbyRestaurantsOptions,
): Promise<{ items: RestaurantCandidate[]; fallbackToMock: boolean }> {
  try {
    const res = await fetch(backendNearbyFoodUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        events: events.map((e) => ({
          district: e.district ?? '',
          latitude: e.latitude,
          longitude: e.longitude,
        })),
        travelDuration: options.travelDuration,
      }),
      signal: options.signal,
    });

    const json: unknown = await res.json().catch(() => null);
    const meta =
      json && typeof json === 'object' && 'meta' in json && json.meta && typeof json.meta === 'object'
        ? (json.meta as Record<string, unknown>)
        : null;

    if (!res.ok) {
      return { items: [], fallbackToMock: true };
    }

    if (meta?.reason === 'not_configured' || meta?.reason === 'upstream_error') {
      return { items: [], fallbackToMock: true };
    }

    return {
      items: parseProxyItems(json),
      fallbackToMock: false,
    };
  } catch {
    return { items: [], fallbackToMock: true };
  }
}

/**
 * 행사 목록을 기준으로 근처 식사 후보를 반환합니다.
 * 서울 OpenAPI 경로는 백엔드 환경변수 SEOUL_FOOD_CERT_SERVICE 로 설정합니다.
 */
export async function fetchNearbyRestaurants(
  events: CultureEvent[],
  options: FetchNearbyRestaurantsOptions,
): Promise<RestaurantCandidate[]> {
  if (options.signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const api = await fetchFromSeoulFoodCertApi(events, options);

  if (options.signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  if (!api.fallbackToMock) {
    const max = maxSlotsForDuration(options.travelDuration);
    const deduped = dedupeRestaurantCandidates(api.items);
    deduped.sort(sortCandidatesByApiDistance);
    return deduped.slice(0, max);
  }

  return pickFromMock(events, options.travelDuration);
}
