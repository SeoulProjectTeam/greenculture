/**
 * 길찾기·이동시간 API 교체용 진입점 — MVP에서는 직선거리만 반환.
 * Google Maps / Kakao 등 연동 시 이 모듈만 수정하면 됩니다.
 */
import { haversineDistance } from '../utils/distance';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

/** 도보·대중교통 시간 없음 — 직선 거리만 */
export interface RouteInfo {
  straightLineKm: number;
  source: 'straight_line';
}

export function getStraightLineKm(origin: GeoPoint, destination: GeoPoint): number {
  return haversineDistance(origin.latitude, origin.longitude, destination.latitude, destination.longitude);
}

/**
 * 향후 Directions API 연동 시 동일 시그니처로 비동기 구현을 교체합니다.
 * 현재는 Haversine 직선거리만 반환합니다.
 */
export async function getRouteInfo(origin: GeoPoint, destination: GeoPoint): Promise<RouteInfo> {
  return {
    straightLineKm: getStraightLineKm(origin, destination),
    source: 'straight_line',
  };
}
