import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { formatUiTemplate, uiLabels } from '../i18n/translations';
import type { AppLanguage, CultureEvent } from '../types/culture';
import { getKakaoTransitSegmentUrls } from '../utils/mapLinks';
import { extractEventCoords, getWalkingTravelEstimates } from '../utils/travelEstimate';

declare global {
  interface Window {
    kakao?: any;
  }
}

let kakaoSdkLoadPromise: Promise<void> | null = null;

function ensureKakaoMapsSdk(appKey: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('window unavailable'));

  if (window.kakao?.maps) return Promise.resolve();

  if (kakaoSdkLoadPromise) return kakaoSdkLoadPromise;

  kakaoSdkLoadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-kakao-maps-sdk="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Kakao Maps SDK')), {
        once: true,
      });
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.dataset.kakaoMapsSdk = 'true';
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Kakao Maps SDK'));
    document.head.appendChild(script);
  });

  return kakaoSdkLoadPromise;
}

export function KakaoCourseMap({
  lang = 'ko',
  events,
  heightPx = 290,
  actionsSlot,
  restaurantMarkers,
}: {
  lang?: AppLanguage;
  events: CultureEvent[];
  /** 모바일 기준 260~320px 권장 */
  heightPx?: number;
  /** 추후 외부 지도 링크 버튼 등 확장용 */
  actionsSlot?: ReactNode;
  /** 근처 식사 후보 등 부가 마커 — 행사 번호 마커와 구분되는 스타일 */
  restaurantMarkers?: Array<{ lat: number; lng: number; title: string }>;
}) {
  const L = uiLabels(lang);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);

  const appKey = (import.meta as any).env?.VITE_KAKAO_MAP_JS_KEY as string | undefined;

  const points = useMemo(() => {
    const raw = events.map((ev, idx) => {
      const coords = extractEventCoords(ev);
      return {
        orderNo: idx + 1,
        title: ev.title ?? '',
        place: ev.place ?? '',
        coords,
      };
    });
    const withCoords = raw.filter((r) => r.coords);
    const missingCount = raw.length - withCoords.length;
    return {
      raw,
      withCoords: withCoords as Array<
        (typeof raw)[number] & { coords: { lat: number; lng: number } }
      >,
      missingCount,
    };
  }, [events]);

  const walkingEstimates = useMemo(() => getWalkingTravelEstimates(events), [events]);
  const transitSegments = useMemo(() => getKakaoTransitSegmentUrls(events), [events]);

  const restaurantMarkersKey = useMemo(
    () => JSON.stringify(restaurantMarkers ?? []),
    [restaurantMarkers],
  );

  useEffect(() => {
    if (!appKey?.trim()) {
      setSdkError('missing_key');
      setSdkReady(false);
      return;
    }

    let cancelled = false;
    ensureKakaoMapsSdk(appKey.trim())
      .then(() => {
        if (cancelled) return;
        const kakao = window.kakao;
        if (!kakao?.maps?.load) {
          setSdkError('sdk_invalid');
          setSdkReady(false);
          return;
        }
        kakao.maps.load(() => {
          if (cancelled) return;
          setSdkReady(true);
          setSdkError(null);
        });
      })
      .catch(() => {
        if (cancelled) return;
        setSdkError('sdk_load_failed');
        setSdkReady(false);
      });

    return () => {
      cancelled = true;
    };
  }, [appKey]);

  useEffect(() => {
    if (!sdkReady) return;
    if (!containerRef.current) return;
    if (points.withCoords.length === 0) return;

    const kakao = window.kakao;
    const first = points.withCoords[0]!;

    const map = new kakao.maps.Map(containerRef.current, {
      center: new kakao.maps.LatLng(first.coords.lat, first.coords.lng),
      level: 6,
    });

    const bounds = new kakao.maps.LatLngBounds();
    const positions = points.withCoords.map((p) => {
      const ll = new kakao.maps.LatLng(p.coords.lat, p.coords.lng);
      bounds.extend(ll);
      return { p, ll };
    });

    // 마커 + 번호(커스텀 오버레이)
    positions.forEach(({ p, ll }) => {
      const marker = new kakao.maps.Marker({ position: ll });
      marker.setMap(map);

      const content = `
        <div style="
          width: 26px;
          height: 26px;
          border-radius: 9999px;
          background: #0052cc;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 12px;
          box-shadow: 0 6px 16px rgba(0,0,0,.18);
          border: 2px solid rgba(255,255,255,.9);
        ">${p.orderNo}</div>
      `;

      const overlay = new kakao.maps.CustomOverlay({
        position: ll,
        content,
        yAnchor: 1,
      });
      overlay.setMap(map);
    });

    // 직선 가이드 라인(2개 이상일 때)
    if (positions.length >= 2) {
      const linePath = positions.map(({ ll }) => ll);
      const polyline = new kakao.maps.Polyline({
        path: linePath,
        strokeWeight: 4,
        strokeColor: '#00A3FF',
        strokeOpacity: 0.75,
        strokeStyle: 'solid',
      });
      polyline.setMap(map);
    }

    // 근처 식사 후보 마커(코스 경유지와 다른 색)
    for (const rm of restaurantMarkers ?? []) {
      const ll = new kakao.maps.LatLng(rm.lat, rm.lng);
      bounds.extend(ll);
      const marker = new kakao.maps.Marker({ position: ll });
      marker.setMap(map);

      const esc = (rm.title ?? '').replace(/</g, '&lt;').replace(/"/g, '&quot;');
      const content = `
        <div style="
          width: 26px;
          height: 26px;
          border-radius: 9999px;
          background: #ea580c;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 11px;
          box-shadow: 0 6px 16px rgba(0,0,0,.18);
          border: 2px solid rgba(255,255,255,.9);
        " title="${esc}">R</div>
      `;

      const overlay = new kakao.maps.CustomOverlay({
        position: ll,
        content,
        yAnchor: 1,
      });
      overlay.setMap(map);
    }

    // 모든 마커가 보이도록
    map.setBounds(bounds, 24, 24, 24, 24);
  }, [sdkReady, points.withCoords.length, points.withCoords, restaurantMarkersKey, restaurantMarkers]);

  const shouldShowMap = sdkReady && points.withCoords.length > 0 && !sdkError;

  return (
    <section className="mt-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-seoul-blue">
            {L.mapTitle ?? 'Map'}
          </p>
          <p className="mt-1 text-sm font-bold text-seoul-navy">{L.mapCourseStops ?? 'Course stops'}</p>
        </div>
        {actionsSlot ? <div className="shrink-0">{actionsSlot}</div> : null}
      </div>

      <div className="mt-3">
        {shouldShowMap ? (
          <div
            ref={containerRef}
            className="w-full overflow-hidden rounded-xl ring-1 ring-slate-200"
            style={{ height: `${Math.max(240, Math.min(360, heightPx))}px` }}
          />
        ) : (
          <div
            className="flex w-full items-center justify-center rounded-xl bg-slate-50 px-4 text-center text-sm text-slate-600 ring-1 ring-slate-200"
            style={{ height: `${Math.max(240, Math.min(360, heightPx))}px` }}
          >
            {sdkError === 'missing_key'
              ? (L.mapMissingApiKey ?? 'Map is unavailable (missing API key).')
              : points.withCoords.length === 0
                ? (L.mapNoCoordinates ?? 'No events have coordinates, so the map cannot be shown.')
                : (L.mapUnavailable ?? 'Map is temporarily unavailable.')}
          </div>
        )}
      </div>

      <div className="mt-3 space-y-2">
        {points.withCoords.length >= 2 ? (
          <p className="rounded-lg bg-seoul-sky/50 px-3 py-2 text-[11px] leading-snug text-seoul-navy ring-1 ring-seoul-blue/15">
            {L.mapStraightLineGuideNote ??
              'The line shown on the map is a straight-line guide for reference, not an actual route.'}
          </p>
        ) : null}

        {points.missingCount > 0 ? (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] leading-snug text-slate-600 ring-1 ring-slate-200">
            {L.mapSomeEventsMissingCoordinates ??
              'Some events do not have coordinates and are not shown on the map.'}
          </p>
        ) : null}

        {(restaurantMarkers?.length ?? 0) > 0 ? (
          <p className="rounded-lg bg-amber-50/90 px-3 py-2 text-[10px] leading-snug text-amber-950 ring-1 ring-amber-100">
            {L.mapRestaurantPinsLegend}
          </p>
        ) : null}
      </div>

      {points.withCoords.length >= 2 && walkingEstimates.length > 0 ? (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-xs font-bold text-seoul-navy">{L.mapEstimatedWalkingTitle}</p>
          <ul className="mt-2 space-y-1.5 text-[11px] leading-snug text-slate-700">
            {walkingEstimates.map((seg) => {
              const fromNo = seg.fromIndex + 1;
              const toNo = seg.toIndex + 1;
              const mins = formatUiTemplate(L.mapApproxMinutes, { minutes: seg.walkingMinutes });
              const dist = formatUiTemplate(L.mapApproxDistanceKm, {
                distance: seg.estimatedDistanceKm.toFixed(1),
              });
              return (
                <li key={`${seg.fromIndex}-${seg.toIndex}`}>
                  {fromNo} → {toNo} {mins} · {dist}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {points.withCoords.length >= 2 && transitSegments.length > 0 ? (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-xs font-bold text-seoul-navy">{L.mapTransitBySegmentTitle}</p>
          <div className="mt-2 flex flex-col gap-2">
            {transitSegments.map((seg) => (
              <a
                key={`${seg.fromIndex}-${seg.toIndex}`}
                href={seg.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 items-center justify-center rounded-xl border-2 border-seoul-navy bg-white px-3 text-center text-xs font-bold text-seoul-navy shadow-sm"
              >
                {formatUiTemplate(L.mapTransitSegmentButton, {
                  from: seg.fromIndex + 1,
                  to: seg.toIndex + 1,
                })}
              </a>
            ))}
          </div>
        </div>
      ) : null}

      {walkingEstimates.length > 0 || transitSegments.length > 0 ? (
        <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-[10px] leading-snug text-slate-600 ring-1 ring-slate-200">
          {L.mapWalkingTransitDisclaimer}
        </p>
      ) : null}
    </section>
  );
}

