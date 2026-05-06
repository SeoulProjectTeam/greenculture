import type { CultureEvent } from '../types/culture';

import { extractEventCoords } from './travelEstimate';

export type KakaoTransitSegmentLink = {
  fromIndex: number;
  toIndex: number;
  url: string;
};

function buildKakaoTransitUrl(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
): string {
  const sp = `${start.lat},${start.lng}`;
  const ep = `${end.lat},${end.lng}`;
  return `https://m.map.kakao.com/scheme/route?sp=${sp}&ep=${ep}&by=publictransit`;
}

/**
 * 좌표가 있는 행사만 코스 순으로 모아, 인접 구간마다 카카오맵 대중교통 길찾기 URL 생성.
 * (지도 Polyline·도보 예상 구간과 동일한 순서)
 */
export function getKakaoTransitSegmentUrls(events: CultureEvent[]): KakaoTransitSegmentLink[] {
  type IndexedCoord = { index: number; coords: { lat: number; lng: number } };
  const stops: IndexedCoord[] = [];
  events.forEach((event, index) => {
    const coords = extractEventCoords(event);
    if (!coords) return;
    stops.push({ index, coords });
  });

  const out: KakaoTransitSegmentLink[] = [];
  for (let i = 0; i < stops.length - 1; i++) {
    const from = stops[i]!;
    const to = stops[i + 1]!;
    if (from.coords.lat === to.coords.lat && from.coords.lng === to.coords.lng) continue;
    out.push({
      fromIndex: from.index,
      toIndex: to.index,
      url: buildKakaoTransitUrl(from.coords, to.coords),
    });
  }
  return out;
}

/**
 * 코스 순서상 좌표가 있는 첫 행사 → 마지막 행사 기준 카카오맵 대중교통 길찾기(모바일 웹 스킴).
 * 중간 경유지 미지원이므로 출발/도착만 연결합니다.
 *
 * @see Kakao Maps Android URL Scheme — route, by=publictransit
 */
export function getKakaoTransitRouteUrl(events: CultureEvent[]): string | null {
  let first: { lat: number; lng: number } | null = null;
  let last: { lat: number; lng: number } | null = null;

  for (const e of events) {
    const c = extractEventCoords(e);
    if (!c) continue;
    if (!first) first = c;
    last = c;
  }

  if (!first || !last) return null;
  if (first.lat === last.lat && first.lng === last.lng) return null;

  return buildKakaoTransitUrl(first, last);
}
