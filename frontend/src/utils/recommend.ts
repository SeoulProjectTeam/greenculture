import type {
  AppLanguage,
  CultureEvent,
  InterestId,
  ScoredEvent,
  TimeSlotId,
  TravelDurationId,
  UserPreferences,
} from '../types/culture';
import { haversineDistance } from './distance';
import { areDistrictsClose } from './districtProximity';
import { isDateWithinInclusive } from './dateUtils';

export function travelDurationToSlots(d: TravelDurationId): TimeSlotId[] {
  switch (d) {
    case 'short':
      return ['morning'];
    case 'half-day':
      return ['morning', 'afternoon'];
    case 'full-day':
      return ['morning', 'afternoon', 'evening'];
    default:
      return ['morning', 'afternoon'];
  }
}

/** 요금 문자열에 무료가 포함되거나 API 가 무료로 표시한 경우 */
export function isEffectivelyFree(event: CultureEvent): boolean {
  if (event.isFree) return true;
  return (event.price ?? '').includes('무료');
}

const INTEREST_KEYWORDS: Record<Exclude<InterestId, 'free'>, string[]> = {
  exhibition: ['전시', '미술', '갤러리', '아트'],
  performance: ['공연', '연극', '뮤지컬', '음악회', '음악', '클래식', '재즈', '버스킹', '콘서트', '라이브'],
  festival: ['축제', '페스티벌', '영화제'],
  traditional: ['전통', '국악', '궁', '궁중', '무형', '한복', '야간 관람'],
  kpop: ['K-pop', '케이팝', '아이돌', 'k팝'],
  experience: ['체험', '클래스', '워크숍', '참여', '원데이'],
};

const CATEGORY_INTEREST_HINT: Partial<Record<string, InterestId[]>> = {
  전시: ['exhibition'],
  공연: ['performance'],
  축제: ['festival'],
  전통문화: ['traditional'],
  체험: ['experience'],
};

export function filterEventsByVisitDate(events: CultureEvent[], visitIso: string): CultureEvent[] {
  return events.filter((e) => isDateWithinInclusive(visitIso, e.startDate, e.endDate));
}

/** 시간 문자열에서 시작 시각(시) 추출 실패 시 null — 필터에서 제외하지 않음 */
export function extractStartHour(eventTime: string | undefined): number | null {
  if (!eventTime) return null;
  const m = eventTime.match(/(\d{1,2})\s*:\s*\d{2}/);
  if (!m) return null;
  const h = Number.parseInt(m[1]!, 10);
  if (Number.isNaN(h) || h < 0 || h > 23) return null;
  return h;
}

export function eventMatchesTimeSlots(eventTime: string, slots: TimeSlotId[]): boolean {
  if (slots.length === 0) return true;
  const h = extractStartHour(eventTime);
  if (h === null) return true;
  const morning = h >= 9 && h < 12;
  const afternoon = h >= 12 && h < 18;
  const evening = h >= 18 && h <= 22;
  return slots.some((s) => {
    if (s === 'morning') return morning;
    if (s === 'afternoon') return afternoon;
    return evening;
  });
}

export function filterEventsByTimeSlots(events: CultureEvent[], slots: TimeSlotId[]): CultureEvent[] {
  return events.filter((e) => eventMatchesTimeSlots(e.eventTime ?? '', slots));
}

/** 관심사 키워드·분류 기반 일치 점수 — 필터링 전용 */
export function getInterestMatchScore(event: CultureEvent, interests: InterestId[]): number {
  if (interests.length === 0) return 0;
  let score = 0;
  const blob = `${event.category} ${event.title} ${event.description ?? ''}`;
  for (const id of interests) {
    if (id === 'free') {
      if (isEffectivelyFree(event)) score += 18;
      continue;
    }
    const hints = CATEGORY_INTEREST_HINT[event.category];
    if (hints?.includes(id)) score += 22;
    const kws = INTEREST_KEYWORDS[id];
    if (kws.some((kw) => blob.includes(kw))) score += 16;
  }
  return score;
}

/** 관심사를 하나 이상 선택한 경우, 최소 한 가지 관점에서라도 맞는 행사만 남깁니다. */
export function filterEventsByInterests(events: CultureEvent[], interests: InterestId[]): CultureEvent[] {
  if (interests.length === 0) return events;
  return events.filter((e) => getInterestMatchScore(e, interests) > 0);
}

function describeInterestMatches(event: CultureEvent, interests: InterestId[]): string[] {
  if (interests.length === 0) return [];
  const reasons: string[] = [];
  const blob = `${event.category} ${event.title} ${event.description ?? ''}`;
  const labels: Record<InterestId, string> = {
    exhibition: '전시·미술 키워드와 맞음',
    performance: '공연·음악 성격과 맞음',
    festival: '축제·페스티벌 성격과 맞음',
    traditional: '전통문화 요소가 있음',
    kpop: 'K-pop·대중음악 성격과 맞음',
    experience: '체험·참여형 프로그램',
    free: '무료 또는 무료 구간 안내',
  };
  for (const id of interests) {
    if (id === 'free') {
      if (isEffectivelyFree(event)) reasons.push(labels.free);
      continue;
    }
    const hints = CATEGORY_INTEREST_HINT[event.category];
    if (hints?.includes(id)) reasons.push(`${event.category} 분야 선택과 일치`);
    const kws = INTEREST_KEYWORDS[id];
    if (kws.some((kw) => blob.includes(kw))) reasons.push(labels[id]);
  }
  return reasons.slice(0, 4);
}

function scoreDistrictProximity(event: CultureEvent, userDistrict: string): { score: number; reason?: string } {
  if (!userDistrict) return { score: 6, reason: '자치구 조건 없음 — 동등 배점' };
  if (event.district === userDistrict) return { score: 28, reason: `선택한 자치구(${userDistrict})와 동일` };
  if (areDistrictsClose(userDistrict, event.district))
    return { score: 16, reason: `선택 구역과 인접 자치구(${event.district})` };
  return { score: 4, reason: '다른 자치구지만 일정·관심사와 궁합 가능' };
}

function scoreDescriptionRichness(description: string): { score: number; reason?: string } {
  const len = description.trim().length;
  if (len >= 120) return { score: 18, reason: '소개 글이 길어 외국인 안내에 유리' };
  if (len >= 60) return { score: 12, reason: '소개 정보가 비교적 충실함' };
  if (len >= 30) return { score: 6, reason: '간단한 안내 수준' };
  return { score: 0 };
}

export function calculateRecommendationScore(event: CultureEvent, prefs: UserPreferences): ScoredEvent {
  const reasons: string[] = [];

  let interestPoints = getInterestMatchScore(event, prefs.interests);
  if (prefs.interests.length === 0) {
    interestPoints = 12;
    reasons.push('관심사 미선택 — 다양한 후보를 폭넓게 고려');
  } else {
    reasons.push(...describeInterestMatches(event, prefs.interests));
  }

  let score = interestPoints;

  if (isDateWithinInclusive(prefs.visitDate, event.startDate, event.endDate)) {
    score += 20;
    reasons.push('방문일이 행사 기간 안에 포함됨');
  }

  const dist = scoreDistrictProximity(event, prefs.district);
  score += dist.score;
  if (dist.reason) reasons.push(dist.reason);

  if (prefs.interests.includes('free') && isEffectivelyFree(event)) {
    score += 14;
    reasons.push('무료 행사 선호에 부합');
  }

  const rich = scoreDescriptionRichness(event.description ?? '');
  score += rich.score;
  if (rich.reason) reasons.push(rich.reason);

  const uniqueReasons = [...new Set(reasons)];
  return {
    event,
    recommendationScore: Math.round(score),
    recommendationReasons: uniqueReasons,
  };
}

function extractWonAmount(price: string): number | null {
  const normalized = price.replace(/,/g, '');
  const m = normalized.match(/(\d+)\s*원/);
  if (!m) return null;
  return Number.parseInt(m[1]!, 10);
}

const LOW_BARRIER_CATEGORIES = new Set(['전시', '축제', '전통문화', '체험']);

/** 0–100 임시 외국인 친화도 */
export function calculateForeignerFriendlinessScore(event: CultureEvent): number {
  let raw = 0;
  if (isEffectivelyFree(event)) raw += 22;
  else {
    const amt = extractWonAmount(event.price ?? '');
    if (amt !== null && amt <= 12000) raw += 14;
  }
  if (typeof event.latitude === 'number' && typeof event.longitude === 'number') raw += 18;
  if ((event.homepageUrl ?? '').trim().length > 0) raw += 16;
  const desc = (event.description ?? '').trim();
  if (desc.length >= 90) raw += 18;
  else if (desc.length >= 45) raw += 10;
  if (LOW_BARRIER_CATEGORIES.has(event.category)) raw += 22;
  return Math.min(100, Math.round(raw));
}

export function summarizeDescription(event: CultureEvent, lang: AppLanguage, maxLen = 120): string {
  const base = (event.description ?? '').trim();
  if (!base) {
    const empty: Record<AppLanguage, string> = {
      ko: '요약: 프로그램 소개 텍스트가 없습니다.',
      en: 'Summary: No program description was provided.',
      ja: '概要: プログラム説明がありません。',
      zh: '摘要：暂无节目说明文本。',
    };
    return empty[lang];
  }
  const snippet = base.length <= maxLen ? base : `${base.slice(0, maxLen - 1)}…`;
  const prefixes: Record<AppLanguage, string> = {
    ko: '요약: ',
    en: 'Summary: ',
    ja: '概要: ',
    zh: '摘要：',
  };
  return `${prefixes[lang]}${snippet}`;
}

export function rankEvents(events: CultureEvent[], prefs: UserPreferences): ScoredEvent[] {
  return events
    .map((e) => calculateRecommendationScore(e, prefs))
    .sort((a, b) => b.recommendationScore - a.recommendationScore);
}

function hasLatLon(e: CultureEvent): boolean {
  return (
    typeof e.latitude === 'number' &&
    typeof e.longitude === 'number' &&
    Number.isFinite(e.latitude) &&
    Number.isFinite(e.longitude)
  );
}

/** 연속 행사 간 허용 직선거리(km) — 코스 길이별 */
export function maxStraightLineSegmentKm(travelDuration: TravelDurationId): number {
  switch (travelDuration) {
    case 'short':
      return 2;
    case 'half-day':
      return 4;
    case 'full-day':
      return 7;
    default:
      return 4;
  }
}

function pairStraightLineKm(a: CultureEvent, b: CultureEvent): number | null {
  if (!hasLatLon(a) || !hasLatLon(b)) return null;
  return haversineDistance(a.latitude!, a.longitude!, b.latitude!, b.longitude!);
}

function districtTier(evDistrict: string, userDistrict: string): number {
  if (!userDistrict.trim()) return 0;
  if (evDistrict === userDistrict) return 0;
  if (areDistrictsClose(userDistrict, evDistrict)) return 1;
  return 2;
}

/**
 * 코스 후보 정렬: 선택 자치구 동일 → 인접 구역 → (좌표 있으면) 허브 기준 가까운 순 → 추천 점수
 */
export function sortRankedForCourseConstruction(ranked: ScoredEvent[], prefs: UserPreferences): ScoredEvent[] {
  const ud = prefs.district.trim();
  const hub =
    ranked.find(
      (r) =>
        hasLatLon(r.event) &&
        (!ud || r.event.district === ud || areDistrictsClose(ud, r.event.district)),
    )?.event ??
    ranked.find((r) => hasLatLon(r.event))?.event ??
    null;

  return [...ranked].sort((a, b) => {
    const ta = districtTier(a.event.district, ud);
    const tb = districtTier(b.event.district, ud);
    if (ta !== tb) return ta - tb;

    if (hub && hasLatLon(a.event) && hasLatLon(b.event)) {
      const da = haversineDistance(hub.latitude!, hub.longitude!, a.event.latitude!, a.event.longitude!);
      const db = haversineDistance(hub.latitude!, hub.longitude!, b.event.latitude!, b.event.longitude!);
      if (Math.abs(da - db) > 1e-6) return da - db;
    }

    return b.recommendationScore - a.recommendationScore;
  });
}

function fitsDistrictCluster(selected: ScoredEvent[], cand: ScoredEvent): boolean {
  return selected.some((s) => areDistrictsClose(s.event.district, cand.event.district));
}

function canAppendByStraightLine(last: ScoredEvent, cand: ScoredEvent, maxKm: number): boolean {
  const km = pairStraightLineKm(last.event, cand.event);
  if (km === null) return true;
  return km <= maxKm;
}

/**
 * 같은 자치구·인접 구역을 우선 클러스터링하고, 위경도가 모두 있을 때 연속 구간 직선거리가
 * `maxStraightLineSegmentKm` 을 넘는 행사는 코스에 넣지 않습니다.
 */
export function pickCourseEventsSpatial(
  rankedSorted: ScoredEvent[],
  prefs: UserPreferences,
  maxSpots: number,
): ScoredEvent[] {
  if (rankedSorted.length === 0) return [];

  const maxKm = maxStraightLineSegmentKm(prefs.travelDuration);
  const seed = rankedSorted[0]!;
  const selected: ScoredEvent[] = [seed];
  let pool = rankedSorted.filter((r) => r.event.id !== seed.event.id);

  while (selected.length < maxSpots && pool.length > 0) {
    const last = selected[selected.length - 1]!;
    const eligible = pool.filter(
      (c) => fitsDistrictCluster(selected, c) && canAppendByStraightLine(last, c, maxKm),
    );
    if (eligible.length === 0) break;

    eligible.sort((a, b) => {
      const sameA = a.event.district === last.event.district ? 1 : 0;
      const sameB = b.event.district === last.event.district ? 1 : 0;
      if (sameA !== sameB) return sameB - sameA;

      const da = pairStraightLineKm(last.event, a.event);
      const db = pairStraightLineKm(last.event, b.event);
      if (da !== null && db !== null && Math.abs(da - db) > 1e-6) return da - db;
      if (da !== null && db === null) return -1;
      if (da === null && db !== null) return 1;

      return b.recommendationScore - a.recommendationScore;
    });

    const next = eligible[0]!;
    selected.push(next);
    pool = pool.filter((r) => r.event.id !== next.event.id);
  }

  return selected.slice(0, maxSpots);
}
