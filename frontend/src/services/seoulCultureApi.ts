import { mockCultureEvents } from '../data/mockCultureEvents';
import type { CultureEvent } from '../types/culture';

const SEOUL_OPEN_API_HOST = 'http://openapi.seoul.go.kr:8088';

function envFlag(name: string): boolean {
  const v = import.meta.env[name];
  return v === 'true' || v === '1' || v === 'yes';
}

/** 개발 중 CORS 회피용 — `VITE_USE_MOCK_DATA=true` 이면 실제 호출 없이 mock 반환 */
export function shouldUseMockData(): boolean {
  return envFlag('VITE_USE_MOCK_DATA');
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      window.clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    if (signal?.aborted) {
      window.clearTimeout(timer);
      onAbort();
      return;
    }
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function str(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  return s.length > 0 ? s : undefined;
}

/** 서울시 API 날짜 문자열을 yyyy-mm-dd 로 최대한 안전하게 정규화 — 실패 시 빈 문자열 */
export function normalizeSeoulApiDate(input: unknown): string {
  const raw = str(input);
  if (!raw) return '';

  const isoLike = /^(\d{4})[-.](\d{2})[-.](\d{2})/.exec(raw);
  if (isoLike) return `${isoLike[1]}-${isoLike[2]}-${isoLike[3]}`;

  const digitsOnly = raw.replace(/\s/g, '');
  const compact = /^(\d{8})$/.exec(digitsOnly);
  if (compact) {
    const y = digitsOnly.slice(0, 4);
    const m = digitsOnly.slice(4, 6);
    const d = digitsOnly.slice(6, 8);
    return `${y}-${m}-${d}`;
  }

  const slash = /^(\d{4})\/(\d{2})\/(\d{2})/.exec(raw);
  if (slash) return `${slash[1]}-${slash[2]}-${slash[3]}`;

  const ko = /^(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/.exec(raw);
  if (ko) {
    const mm = ko[2]!.padStart(2, '0');
    const dd = ko[3]!.padStart(2, '0');
    return `${ko[1]}-${mm}-${dd}`;
  }

  const t = Date.parse(raw);
  if (!Number.isNaN(t)) {
    const dt = new Date(t);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    if (y > 1900 && y < 2100) return `${y}-${m}-${d}`;
  }

  return '';
}

function splitDateRange(dateField: unknown): { start: string; end: string } {
  const s = str(dateField);
  if (!s) return { start: '', end: '' };
  const parts = s.split(/~|～|－|–|-/).map((x) => x.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return {
      start: normalizeSeoulApiDate(parts[0]),
      end: normalizeSeoulApiDate(parts[1]),
    };
  }
  const one = normalizeSeoulApiDate(parts[0]);
  return { start: one, end: one };
}

function parseCoordinate(v: unknown): number | undefined {
  const s = str(v);
  if (!s) return undefined;
  const n = Number.parseFloat(s.replace(/,/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

function pickHomepage(raw: Record<string, unknown>): string | undefined {
  const keys = ['ORG_LINK', 'HMPG_ADDR', 'LINK_URL', 'URL', 'DETAIL_URL', 'INFO_URL'];
  for (const k of keys) {
    const v = str(raw[k]);
    if (v) return v;
  }
  return undefined;
}

function inferIsFree(priceText: string | undefined, raw: Record<string, unknown>): boolean {
  const flagSources = [
    raw.IS_FREE,
    raw.FREE_YN,
    raw.FEE_FREE,
    raw.CHARGE_FREE,
    raw.PAY_FLAG,
    raw.PAY_YN,
    raw.FEE_FLAG,
  ];

  for (const src of flagSources) {
    const t = str(src);
    if (!t) continue;
    const norm = t.replace(/\s/g, '').toUpperCase();
    if (['Y', 'YES', '1', 'TRUE', 'FREE'].includes(norm) || t.includes('무료')) return true;
    if (['N', 'NO', '0', 'FALSE', 'PAID', 'CHRG'].includes(norm) || t.includes('유료')) return false;
  }

  const p = priceText ?? '';
  const compact = p.replace(/\s/g, '');
  if (!compact) return false;
  if (compact.includes('유료')) return false;
  if (compact.includes('무료')) return true;
  return false;
}

function normalizeRows(row: unknown): Record<string, unknown>[] {
  if (row === null || row === undefined) return [];
  if (Array.isArray(row)) return row.filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null);
  if (typeof row === 'object') return [row as Record<string, unknown>];
  return [];
}

function stableFallbackId(parts: string[], index: number): string {
  const base = parts.join('|').slice(0, 120);
  let h = 0;
  for (let i = 0; i < base.length; i += 1) h = (h * 31 + base.charCodeAt(i)) >>> 0;
  return `seoul-${h.toString(16)}-${index}`;
}

export function mapSeoulApiEventToCultureEvent(raw: Record<string, unknown>, index = 0): CultureEvent {
  const title = str(raw.TITLE) ?? str(raw.SUBJECT) ?? '(제목 없음)';
  const category = str(raw.CODENAME) ?? str(raw.CATEGORY) ?? '';
  const district = str(raw.GUNAME) ?? str(raw.AREA) ?? '';
  const place = str(raw.PLACE) ?? str(raw.ADDR) ?? '';

  let startDate = normalizeSeoulApiDate(raw.STRTDATE ?? raw.START_DATE ?? raw.BEGIN_DATE);
  let endDate = normalizeSeoulApiDate(raw.END_DATE ?? raw.ENDDATE ?? raw.FINISH_DATE);
  if (!startDate || !endDate) {
    const dr = splitDateRange(raw.DATE ?? raw.PERIOD);
    if (!startDate) startDate = dr.start;
    if (!endDate) endDate = dr.end || dr.start;
  }

  const price = str(raw.USE_FEE) ?? str(raw.FEE) ?? str(raw.PRICE);
  const isFree = inferIsFree(price, raw);

  const description =
    str(raw.PROGRAM) ??
    str(raw.ETC_DESC) ??
    str(raw.CONTENT) ??
    str(raw.SUMMARY) ??
    str(raw.DESCRIPTION);

  const performer = str(raw.PLAYER) ?? str(raw.CAST) ?? str(raw.ACTOR);
  const organization = str(raw.ORG_NAME) ?? str(raw.ORGANIZATION);
  const target = str(raw.USE_TRGT) ?? str(raw.AGE) ?? str(raw.TARGET);
  const inquiry = str(raw.INQUIRY) ?? str(raw.RCEPT_TEL) ?? str(raw.TEL) ?? str(raw.TEL_NO);

  const eventTime =
    str(raw.EVENT_TIME) ??
    str(raw.FRQR_SCN) ??
    str(raw.TIME) ??
    str(raw.PLAY_TIME) ??
    str(raw.OPTIME);

  const homepageUrl = pickHomepage(raw);
  const imageUrl = str(raw.MAIN_IMG) ?? str(raw.IMG_URL) ?? str(raw.FILE_URL);

  const latitude = parseCoordinate(raw.LAT ?? raw.GPSY ?? raw.Y_COORD ?? raw.WGSY);
  const longitude = parseCoordinate(raw.LOT ?? raw.LNG ?? raw.GPSX ?? raw.X_COORD ?? raw.WGSX);

  const serial =
    str(raw.LIST_SERIAL_NO) ??
    str(raw.SERIAL_NUM) ??
    str(raw.RNUM) ??
    str(raw.SEQ) ??
    str(raw.uid);

  const id = serial ?? stableFallbackId([title, startDate, place], index);

  return {
    id,
    title,
    category,
    district,
    place,
    startDate,
    endDate,
    eventTime,
    target,
    price,
    isFree,
    description,
    performer,
    homepageUrl,
    imageUrl,
    latitude,
    longitude,
    organization,
    inquiry,
    raw,
  };
}

function buildRequestUrl(key: string, startIndex: number, endIndex: number): string {
  const safeKey = encodeURIComponent(key);
  return `${SEOUL_OPEN_API_HOST}/${safeKey}/json/culturalEventInfo/${startIndex}/${endIndex}/`;
}

async function fetchLiveCultureEvents(
  startIndex: number,
  endIndex: number,
  signal?: AbortSignal,
): Promise<CultureEvent[]> {
  const key = str(import.meta.env.VITE_SEOUL_API_KEY);
  if (!key) throw new Error('VITE_SEOUL_API_KEY 가 설정되지 않았습니다.');

  const url = buildRequestUrl(key, startIndex, endIndex);
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const json: unknown = await res.json();
  const root = (json as { culturalEventInfo?: Record<string, unknown> }).culturalEventInfo;
  const rows = normalizeRows(root?.row);
  const code = str((root?.RESULT as Record<string, unknown> | undefined)?.CODE);

  if (rows.length === 0) {
    throw new Error(code ? `API 응답에 데이터가 없음 (${code})` : 'API 응답에 row 가 없습니다.');
  }

  if (code && code !== 'INFO-000') {
    // 비정상 코드지만 row 가 있으면 사용 (현장 데이터 우선). 완전 실패는 빈 배열·네트워크에서 처리.
    console.warn('[seoulCultureApi] RESULT.CODE=', code, (root?.RESULT as { MESSAGE?: unknown })?.MESSAGE);
  }

  return rows.map((row, idx) => mapSeoulApiEventToCultureEvent(row, idx));
}

function cloneMock(): CultureEvent[] {
  return mockCultureEvents.map((e) => ({ ...e }));
}

export type FetchCultureEventsOptions = {
  signal?: AbortSignal;
};

/**
 * 서울시 Open API `culturalEventInfo` JSON 호출.
 * - `VITE_USE_MOCK_DATA=true` 이면 mock 만 반환 (CORS·키 없이 개발 가능).
 * - 네트워크/CORS/파싱 실패 시 mock 으로 폴백.
 */
export async function fetchCultureEvents(
  startIndex = 1,
  endIndex = 50,
  options?: FetchCultureEventsOptions,
): Promise<CultureEvent[]> {
  const signal = options?.signal;

  if (shouldUseMockData()) {
    await delay(220, signal);
    return cloneMock();
  }

  try {
    return await fetchLiveCultureEvents(startIndex, endIndex, signal);
  } catch (err) {
    console.warn('[seoulCultureApi] live fetch failed, using mockCultureEvents.', err);
    await delay(120, signal);
    return cloneMock();
  }
}
