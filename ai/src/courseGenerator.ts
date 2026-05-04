import type {
  AppLanguage,
  GeneratedCourse,
  ScoredEvent,
  TravelDurationId,
  UserPreferences,
} from '../../frontend/src/types/culture';
import { localizeDistrictName, translateCategory } from '../../frontend/src/utils/localizeEvent';
import {
  calculateForeignerFriendlinessScore,
  calculateRecommendationScore,
  extractStartHour,
  isEffectivelyFree,
  pickCourseEventsSpatial,
  sortRankedForCourseConstruction,
} from '../../frontend/src/utils/recommend';

/**
 * 향후 OpenAI 등 LLM으로 교체하기 위한 진입점.
 * 현재는 규칙 기반으로 2~4개를 고르고 언어별 목업 문구를 붙입니다.
 */
export async function generateCourseWithAI(
  ranked: ScoredEvent[],
  prefs: UserPreferences,
): Promise<GeneratedCourse | null> {
  await new Promise((r) => setTimeout(r, 220));
  if (ranked.length === 0) return null;

  const maxSpots = maxSpotsForTravel(prefs.travelDuration);
  const rankedSpatial = sortRankedForCourseConstruction(ranked, prefs);
  const picked = pickCourseEventsSpatial(rankedSpatial, prefs, maxSpots);
  const items = picked.map((s) => ({
    ...s,
    foreignerFriendlinessScore: calculateForeignerFriendlinessScore(s.event),
    recommendationReason: buildEventRecommendationBlurb(s, prefs.language),
  }));

  const title = mockCourseTitle(prefs.language, items.length, items[0]!.event.district);
  const tagline = mockCourseTagline(prefs.language, items);

  const schedule = items.map((it, idx) => ({
    order: idx + 1,
    timeLabel: formatTimeLabel(it.event.eventTime, idx),
    place: it.event.place,
    district: it.event.district,
    eventTitle: it.event.title,
    priceLabel: isEffectivelyFree(it.event) ? '무료' : it.event.price?.trim() || '문의',
    isFree: isEffectivelyFree(it.event),
    homepageUrl: it.event.homepageUrl ?? '',
  }));

  return {
    id: `course-${prefs.visitDate}-${items.map((i) => i.event.title).join('|').slice(0, 24)}`,
    title,
    tagline,
    schedule,
    items,
  };
}

function maxSpotsForTravel(d: TravelDurationId): number {
  switch (d) {
    case 'short':
      return 2;
    case 'half-day':
      return 3;
    case 'full-day':
      return 4;
    default:
      return 3;
  }
}

function formatTimeLabel(eventTime: string | undefined, orderIndex: number): string {
  const label = eventTime?.trim() || '시간 미정';
  const h = extractStartHour(eventTime);
  if (h === null) return label;
  const shifted = Math.min(21, h + orderIndex);
  return `${String(shifted).padStart(2, '0')}:00 부근 · ${label}`;
}

function buildEventRecommendationBlurb(s: ScoredEvent, lang: AppLanguage): string {
  const top = s.recommendationReasons[0] ?? '추천 점수 상위';
  const templates: Record<AppLanguage, (t: string) => string> = {
    ko: (t) => `${t} — 코스 흐름과 방문 조건에 잘 맞습니다.`,
    en: (t) => `${t} — Fits your picks and keeps the day easy to follow.`,
    ja: (t) => `${t} — ご希望の条件と日程に合わせやすいプログラムです。`,
    zh: (t) => `${t} — 符合您的偏好且便于当日行程安排。`,
  };
  return templates[lang](top);
}

function mockCourseTitle(lang: AppLanguage, count: number, district: string): string {
  const dRaw = district.trim();
  const d =
    dRaw.length > 0 ? localizeDistrictName(dRaw, lang) : lang === 'ko' ? '서울' : 'Seoul';
  const map: Record<AppLanguage, string> = {
    ko: `${d} 중심 문화 코스 (${count}스팟)`,
    en: `${d} culture loop · ${count} highlights`,
    ja: `${d}エリア・文化ミニコース（${count}か所）`,
    zh: `${d}文化微路线 · ${count}个精选点`,
  };
  return map[lang];
}

function mockCourseTagline(lang: AppLanguage, items: ScoredEvent[]): string {
  const cats = [...new Set(items.map((i) => translateCategory(i.event.category, lang)))].join(' · ');
  const map: Record<AppLanguage, string> = {
    ko: `${cats}를 한 번에 즐기는 밝고 편한 동선입니다. 실제 연동 시에는 AI가 이동·혼잡도까지 고려합니다.`,
    en: `A bright, walkable mix of ${cats}. Later: AI can add transit tuning and crowd-aware swaps.`,
    ja: `${cats}を一度に楽しめるコンパクトな動線です（将来：交通・混雑も反映予定）。`,
    zh: `串联「${cats}」的轻松半日/一日游路线（后续可接入交通与客流优化）。`,
  };
  return map[lang];
}

/** 코스가 바뀌어도 점수 테이블을 재사용할 수 있도록 노출 */
export function rescoredCopy(items: ScoredEvent['event'][], prefs: UserPreferences): ScoredEvent[] {
  return items.map((e) => calculateRecommendationScore(e, prefs));
}
