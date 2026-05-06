import type { CultureEvent } from '../types/culture';

const ROUTE_FACTOR = 1.3;
const WALK_KMH = 4;
const EARTH_RADIUS_KM = 6371;

export type WalkingTravelEstimate = {
  fromIndex: number;
  toIndex: number;
  fromTitle: string;
  toTitle: string;
  estimatedDistanceKm: number;
  walkingMinutes: number;
};

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

/** latitude/longitude 우선, lat/lng(/lon) fallback */
export function extractEventCoords(event: CultureEvent): { lat: number; lng: number } | null {
  const lat = event.latitude ?? (event as CultureEvent & { lat?: unknown }).lat;
  const lng =
    event.longitude ??
    (event as CultureEvent & { lng?: unknown }).lng ??
    (event as CultureEvent & { lon?: unknown }).lon;

  if (isFiniteNumber(lat) && isFiniteNumber(lng)) return { lat, lng };
  return null;
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * 코스 순서대로 좌표가 있는 행사만 골라 인접 구간마다 도보 이동을 추정합니다.
 * 지도 Polyline이 잇는 구간과 동일합니다(중간에 좌표 없는 행사가 있어도 건너뜁).
 */
export function getWalkingTravelEstimates(events: CultureEvent[]): WalkingTravelEstimate[] {
  type IndexedCoord = {
    index: number;
    event: CultureEvent;
    coords: { lat: number; lng: number };
  };

  const coordStops: IndexedCoord[] = [];
  events.forEach((event, index) => {
    const coords = extractEventCoords(event);
    if (!coords) return;
    coordStops.push({ index, event, coords });
  });

  const out: WalkingTravelEstimate[] = [];
  for (let i = 0; i < coordStops.length - 1; i++) {
    const from = coordStops[i]!;
    const to = coordStops[i + 1]!;

    const straightKm = haversineKm(from.coords, to.coords);
    const estimatedDistanceKm = straightKm * ROUTE_FACTOR;
    const hours = estimatedDistanceKm / WALK_KMH;
    const walkingMinutes = Math.max(1, Math.round(hours * 60));

    out.push({
      fromIndex: from.index,
      toIndex: to.index,
      fromTitle: from.event.title ?? '',
      toTitle: to.event.title ?? '',
      estimatedDistanceKm,
      walkingMinutes,
    });
  }
  return out;
}
