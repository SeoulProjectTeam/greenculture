/**
 * 서울시 열린데이터 OpenAPI — 식품인증업소 관리 `FsaCrtfcUpsoMgtNew`
 * 샘플: http://openapi.seoul.go.kr:8088/(인증키)/xml/FsaCrtfcUpsoMgtNew/1/5/
 * 본 모듈은 동일 서비스를 `/json/...` 으로 호출합니다.
 *
 * 서비스명 변경 시 SEOUL_FOOD_CERT_SERVICE 환경변수로 재정의합니다.
 * 인증키는 문화행사와 같은 SEOUL_API_KEY 입니다(openapi.seoul.go.kr 공통).
 */
import crypto from 'node:crypto';
import proj4 from 'proj4';

const SEOUL_OPEN_API_HOST = 'http://openapi.seoul.go.kr:8088';

/** Korea 2000 / Central Belt (EPSG:5174) — 서울 공공데이터 좌표 안내에 흔히 사용 */
const CRS_EPSG5174 =
  '+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +units=m +no_defs';

/** 메모리 캐시 — 업스트림 장애 시 과도한 재호출 방지 */
let foodCertCache = {
  key: '',
  expiresAt: 0,
  rows: [],
};

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const PAGE_SIZE = 1000;
const MAX_PAGES = 50;

function str(v) {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

function pick(row, keys) {
  if (!row || typeof row !== 'object') return '';
  const lowerKeyToVal = new Map();
  for (const rk of Object.keys(row)) {
    lowerKeyToVal.set(String(rk).toLowerCase(), row[rk]);
  }
  for (const k of keys) {
    const candidates = [k, String(k).toUpperCase(), String(k).toLowerCase()];
    for (const ck of candidates) {
      const direct = row[ck];
      if (direct !== undefined && direct !== null && String(direct).trim() !== '') return direct;
    }
    const lowered = lowerKeyToVal.get(String(k).toLowerCase());
    if (lowered !== undefined && lowered !== null && String(lowered).trim() !== '') return lowered;
  }
  return '';
}

function num(v) {
  const n = Number(String(v ?? '').replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : NaN;
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/** 직선 거리 km — 행사 좌표와 동일한 Haversine */
export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function parseLatLotPair(row) {
  const latRaw = pick(row, [
    'LAT',
    'LATITUDE',
    'WGS84_LAT',
    'GIS_LAT_COOR',
    'Y_DNTS',
    'YDNTS',
    'LAT_VAL',
    'LATITUDE_VAL',
  ]);
  const lngRaw = pick(row, [
    'LOT',
    'LNG',
    'LON',
    'LONGITUDE',
    'WGS84_LNG',
    'WGS84_LON',
    'GIS_LNG_COOR',
    'X_CNTS',
    'XDNTS',
    'LNG_VAL',
    'LONGITUDE_VAL',
  ]);
  const lat = num(latRaw);
  const lng = num(lngRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < 33 || lat > 39 || lng < 124 || lng > 132) return null;
  return { lat, lng };
}

function parseTm5174Pair(row) {
  const xRaw = pick(row, [
    'COORD_X',
    'X_CRDNT_VALU',
    'GIS_X_COOR',
    'XCORD',
    'X_COORD',
    'TM_X',
    'POS_X',
  ]);
  const yRaw = pick(row, [
    'COORD_Y',
    'Y_CRDNT_VALU',
    'GIS_Y_COOR',
    'YCORD',
    'Y_COORD',
    'TM_Y',
    'POS_Y',
  ]);
  const x = num(xRaw);
  const y = num(yRaw);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  try {
    const [lng, lat] = proj4(CRS_EPSG5174, 'WGS84', [x, y]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

function parseCoordinates(row) {
  const ll = parseLatLotPair(row);
  if (ll) return ll;
  return parseTm5174Pair(row);
}

/** 공식 홈페이지가 없을 때 장소 검색용 (외부 서비스) */
function fallbackPlaceDetailUrl(name, address) {
  const q = [name, address].filter(Boolean).join(' ').trim();
  if (!q) return '';
  return `https://map.kakao.com/link/search/${encodeURIComponent(q)}`;
}

/**
 * 업스트림 row → 내부 표준 레코드 (좌표 없으면 lat/lng 생략)
 */
export function normalizeFoodCertRow(row, index) {
  const name = str(
    pick(row, [
      'UPSO_NM',
      'BZMN_CONM',
      'CGG_RESTNM',
      'RESTNM',
      'CMPNM_NM',
      'OPNSVC_NM',
      'NM',
      'NAME',
      'STORE_NM',
      'BSSH_NM',
    ]),
  );
  if (!name) return null;

  const roadAddr = str(
    pick(row, [
      'RDN_DETAIL_ADDR',
      'SITE_ADDR',
      'RDNWH_ADDR',
      'RDN_ADDR',
      'RDNMK_ADDR',
      'ADDR',
      'ADDRESS',
      'LOCPLC_AR',
      'FACIL_LOCPLC_ADDR',
    ]),
  );
  const roadNm = str(pick(row, ['RDN_CODE_NM']));
  const address =
    roadAddr && roadNm ? `${roadAddr} ${roadNm}`.trim() : roadAddr || roadNm;

  const phone = str(pick(row, ['TEL_NO', 'TELNO', 'CSTMR_TELNO', 'CTGG_CNADR', 'PHONE', 'TEL']));

  const cuisineType = str(
    pick(row, [
      'CRTFC_CLASS',
      'CLSFN_DESC',
      'CRTFC_ITEMS_DESC',
      'CRTFC_DIV_DESC',
      'CRTIFICATION_AREA',
      'SANITTN_INDUTY_CODE_SE_NAME',
      'INDUTY_NM',
      'UPS_SOJU_DESC',
      'CTGRY_NM',
      'CATEGORY_NM',
    ]),
  );

  const foodMenu = str(pick(row, ['FOOD_MENU']));
  const crtfcSno = str(pick(row, ['CRTFC_SNO']));
  /** 대표메뉴는 FOOD_MENU만 — CRTFC_SNO는 인증번호로 분리 (메뉴로 노출하면 안 됨) */
  const signatureMenu = foodMenu;

  let detailUrl = str(
    pick(row, ['HOMEPAGE', 'HMPG_ADDR', 'WEBSITE_URL', 'DOMAIN_ADDR', 'ORG_LINK', 'LINK_URL']),
  );
  if (!detailUrl) {
    detailUrl = fallbackPlaceDetailUrl(name, address);
  }

  const districtToken = str(pick(row, ['CGG_CODE_NM', 'SIGUNGU_NM', 'CTPV_SE_CODE_NM', 'GU_NAME']));

  const coords = parseCoordinates(row);

  const upstreamId = str(
    pick(row, [
      'CRTFC_UPSO_MGT_SNO',
      'OPEN_LCENS_NO',
      'MGT_NO',
      'MGNO',
      'SAFE_FRHF_NO',
      'BUSINESS_NO',
      'RCPERMNO',
    ]),
  );

  const idSrc = upstreamId || `${name}|${address}|${index}`;
  const id = crypto.createHash('sha256').update(idSrc).digest('hex').slice(0, 28);

  const districtFromAddr = guessDistrictFromAddress(address || districtToken);

  return {
    id,
    name,
    cuisineType,
    signatureMenu,
    certificationNo: crtfcSno || '',
    address,
    phone,
    detailUrl,
    district: districtFromAddr || districtToken || '',
    latitude: coords?.lat,
    longitude: coords?.lng,
    rawRef: upstreamId,
  };
}

const SEOUL_DISTRICT_SUFFIXES = [
  '종로구',
  '중구',
  '용산구',
  '성동구',
  '광진구',
  '동대문구',
  '중랑구',
  '성북구',
  '강북구',
  '도봉구',
  '노원구',
  '은평구',
  '서대문구',
  '마포구',
  '양천구',
  '강서구',
  '구로구',
  '금천구',
  '영등포구',
  '동작구',
  '관악구',
  '서초구',
  '강남구',
  '송파구',
  '강동구',
];

export function guessDistrictFromAddress(text) {
  const t = str(text);
  if (!t) return '';
  for (const d of SEOUL_DISTRICT_SUFFIXES) {
    if (t.includes(d)) return d;
  }
  return '';
}

/** 서울 OpenAPI는 최상위 또는 서비스 블록 안에 RESULT를 둘 수 있음 */
export function findSeoulApiResultCode(json) {
  if (!json || typeof json !== 'object') return '';
  const top = str(json.RESULT?.CODE);
  if (top) return top;
  for (const k of Object.keys(json)) {
    const block = json[k];
    if (block && typeof block === 'object') {
      const c = str(block.RESULT?.CODE);
      if (c) return c;
    }
  }
  return '';
}

export function extractSeoulFoodCertBlock(json) {
  if (!json || typeof json !== 'object') return { rows: [], total: 0, rootKey: '' };
  const keys = Object.keys(json).filter((k) => k !== 'RESULT');
  for (const k of keys) {
    const block = json[k];
    if (block && typeof block === 'object' && 'row' in block) {
      let row = block.row;
      const total = Number(block.list_total_count);
      if (row === null || row === undefined) return { rows: [], total: Number.isFinite(total) ? total : 0, rootKey: k };
      const arr = Array.isArray(row) ? row : [row];
      return { rows: arr, total: Number.isFinite(total) ? total : arr.length, rootKey: k };
    }
  }
  return { rows: [], total: 0, rootKey: '' };
}

async function fetchFoodCertRange(apiKey, serviceName, start, end, outerSignal) {
  const url = `${SEOUL_OPEN_API_HOST}/${encodeURIComponent(apiKey)}/json/${encodeURIComponent(serviceName)}/${start}/${end}/`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const upstream = await fetch(url, { signal: outerSignal ?? controller.signal });
    if (!upstream.ok) return { ok: false, json: null };
    const json = await upstream.json();
    return { ok: true, json };
  } catch {
    return { ok: false, json: null };
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchAllFoodCertRows(apiKey, serviceName, signal) {
  const normalized = [];
  let start = 1;
  let total = Infinity;
  let pages = 0;

  while (start <= total && pages < MAX_PAGES) {
    const rangeEnd = start + PAGE_SIZE - 1;
    const res = await fetchFoodCertRange(apiKey, serviceName, start, rangeEnd, signal);
    if (!res.ok || !res.json) break;

    const code = findSeoulApiResultCode(res.json);
    if (code && code !== 'INFO-000') break;

    const { rows, total: declaredTotal, rootKey } = extractSeoulFoodCertBlock(res.json);
    if (!rootKey) break;

    if (Number.isFinite(declaredTotal)) total = declaredTotal;

    for (let i = 0; i < rows.length; i += 1) {
      const n = normalizeFoodCertRow(rows[i], normalized.length + i);
      if (n) normalized.push(n);
    }

    pages += 1;
    start += PAGE_SIZE;

    if (rows.length === 0) break;
    if (normalized.length >= total) break;
  }

  return normalized;
}

export async function getFoodCertRowsCached({ apiKey, serviceName, signal }) {
  const cacheKey = `${serviceName}:${apiKey.slice(0, 8)}`;
  const now = Date.now();
  if (foodCertCache.key === cacheKey && now < foodCertCache.expiresAt) {
    return foodCertCache.rows;
  }

  const rows = await fetchAllFoodCertRows(apiKey, serviceName, signal);
  const ttl = rows.length > 0 ? CACHE_TTL_MS : 5 * 60 * 1000;
  foodCertCache = {
    key: cacheKey,
    expiresAt: now + ttl,
    rows,
  };
  return rows;
}

export function maxSlotsForTravelDuration(travelDuration) {
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

function minDistanceMetersToEvents(lat, lng, eventPoints) {
  let best = null;
  for (const p of eventPoints) {
    const km = haversineKm(lat, lng, p.lat, p.lng);
    const m = km * 1000;
    if (best === null || m < best) best = m;
  }
  return best;
}

/**
 * events: { district?, latitude?, longitude? }[]
 */
export function pickNearbyFoodEstablishments(rows, events, travelDuration) {
  const max = maxSlotsForTravelDuration(travelDuration);
  const eventDistricts = new Set(events.map((e) => str(e.district)).filter(Boolean));

  const eventPoints = [];
  for (const e of events) {
    const lat = num(e.latitude);
    const lng = num(e.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) eventPoints.push({ lat, lng });
  }

  const withCoords = [];
  const districtOnly = [];

  for (const r of rows) {
    if (typeof r.latitude === 'number' && typeof r.longitude === 'number') {
      const distM =
        eventPoints.length > 0 ? minDistanceMetersToEvents(r.latitude, r.longitude, eventPoints) : null;
      withCoords.push({ r, distM });
    } else {
      const distName = r.district && eventDistricts.has(r.district) ? r.district : '';
      const fallbackDist = !distName ? guessDistrictFromAddress(r.address) : '';
      const matched = distName || (fallbackDist && eventDistricts.has(fallbackDist) ? fallbackDist : '');
      if (matched) {
        districtOnly.push({ r, matched });
      }
    }
  }

  withCoords.sort((a, b) => {
    const da = a.distM ?? 1e15;
    const db = b.distM ?? 1e15;
    return da - db;
  });

  /** 같은 업소 중복 방지 — 이름+주소 */
  const seen = new Set();
  const out = [];

  const pushOut = (r, distMeters, districtLabel) => {
    const dedupe = `${r.name}|${r.address}`;
    if (seen.has(dedupe)) return;
    seen.add(dedupe);
    out.push({
      id: r.id,
      name: r.name,
      cuisineType: r.cuisineType || '',
      signatureMenu: r.signatureMenu || '',
      certificationNo: r.certificationNo || '',
      address: r.address || '',
      phone: r.phone || '',
      district: districtLabel || r.district || '',
      detailUrl: r.detailUrl || '',
      latitude: r.latitude,
      longitude: r.longitude,
      distanceMeters: distMeters,
    });
  };

  for (const x of withCoords) {
    if (out.length >= max) break;
    pushOut(x.r, x.distM, x.r.district || guessDistrictFromAddress(x.r.address));
  }

  if (out.length < max && districtOnly.length > 0) {
    districtOnly.sort((a, b) => a.r.name.localeCompare(b.r.name, 'ko'));
    for (const x of districtOnly) {
      if (out.length >= max) break;
      pushOut(x.r, null, x.matched);
    }
  }

  return out;
}
