import type {
  AppLanguage,
  GeneratedCourse,
  ScoredEvent,
  TravelDurationId,
  UserPreferences,
} from '../../frontend/src/types/culture';
import { getFrontendEnv } from '../../frontend/src/config/env';
import { localizeDistrictName, translateCategory } from '../../frontend/src/utils/localizeEvent';
import {
  calculateForeignerFriendlinessScore,
  calculateRecommendationScore,
  extractStartHour,
  isEffectivelyFree,
  pickCourseEventsSpatial,
  sortRankedForCourseConstruction,
  touristFitScore,
} from '../../frontend/src/utils/recommend';

/**
 * 향후 OpenAI 등 LLM으로 교체하기 위한 진입점.
 * 현재는 규칙 기반으로 2~4개를 고르고 언어별 목업 문구를 붙입니다.
 */
export async function generateCourseWithAI(
  ranked: ScoredEvent[],
  prefs: UserPreferences,
): Promise<GeneratedCourse | null> {
  if (ranked.length === 0) return null;

  const env = getFrontendEnv();

  const maxSpots = maxSpotsForTravel(prefs.travelDuration);
  const rankedSpatial = sortRankedForCourseConstruction(ranked, prefs);
  const picked = pickCourseEventsSpatial(rankedSpatial, prefs, maxSpots);

  // Gemini 후보: 관광객 적합도 기반으로 5~8개 선별
  const candidatePick = pickGeminiCandidates(rankedSpatial);
  const candidates = candidatePick.candidates;

  // 디버그 로그: LLM 호출 조건/여부를 명확히 남김
  const debugBase = {
    raw_VITE_USE_LLM: env.rawUseLlm,
    parsed_useLlm: env.useLlm,
    raw_VITE_USE_MOCK_DATA: env.rawUseMockData,
    parsed_useMockData: env.useMockData,
    backendBaseUrl: env.backendBaseUrl,
    rankedCount: ranked.length,
    candidateCount: candidates.length,
    pickedFallbackCount: picked.length,
    touristFitExcludedCount: candidatePick.excluded.length,
  };

  if (env.useMockData) {
    console.log('[courseGenerator] LLM skipped (mock mode).', debugBase);
  } else if (!env.useLlm) {
    console.log('[courseGenerator] LLM skipped (VITE_USE_LLM is false).', debugBase);
  } else if (candidates.length < 2) {
    console.log('[courseGenerator] LLM skipped (not enough candidates, need >=2).', debugBase);
  } else {
    if (candidatePick.excluded.length > 0) {
      console.log(
        '[courseGenerator] touristFit excluded (sample):',
        candidatePick.excluded.slice(0, 8).map((x) => x.title),
      );
    }
    if (candidatePick.penalized.length > 0) {
      console.log(
        '[courseGenerator] touristFit penalized (sample):',
        candidatePick.penalized.slice(0, 8).map((x) => `${x.title} [${x.penalized.join(', ')}]`),
      );
    }
    console.log('[courseGenerator] LLM attempt: POST /api/ai/course', debugBase);
    const llm = await tryGenerateWithServerLLM(rankedSpatial, prefs, env.backendBaseUrl, candidates);
    if (llm) return llm;
    console.log('[courseGenerator] LLM failed -> fallback to rule-based.', debugBase);
  }

  // 폴백(기존 규칙+목업)
  await new Promise((r) => setTimeout(r, 220));
  return generateRuleBasedCourse(prefs, picked);
}

async function tryGenerateWithServerLLM(
  rankedSpatial: ScoredEvent[],
  prefs: UserPreferences,
  backendBaseUrl: string,
  candidates: ScoredEvent['event'][],
): Promise<GeneratedCourse | null> {
  const base = backendBaseUrl;
  const url = `${base}/api/ai/course`;

  if (candidates.length < 2) return null;

  const payload = {
    language: prefs.language,
    date: prefs.visitDate,
    district: prefs.district,
    interests: prefs.interests,
    tripLength: prefs.travelDuration,
    events: candidates.map((e) => ({
      id: e.id,
      title: e.title,
      category: e.category,
      place: e.place,
      district: e.district,
      startDate: e.startDate,
      endDate: e.endDate,
      price: e.price ?? '',
      description: e.description ?? '',
      homepageUrl: e.homepageUrl ?? '',
    })),
  };

  const controller = new AbortController();
  const t = window.setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const json: any = await res.json();

    const title = typeof json?.title === 'string' ? json.title : '';
    const summary = typeof json?.summary === 'string' ? json.summary : '';
    const spots = Array.isArray(json?.spots) ? json.spots : [];
    if (!title || !summary || spots.length === 0) return null;

    const byId = new Map(rankedSpatial.map((s) => [s.event.id, s] as const));
    const ordered = spots
      .map((s: any) => ({
        eventId: String(s?.eventId ?? ''),
        localizedTitle: String(s?.localizedTitle ?? ''),
        shortDescription: String(s?.shortDescription ?? ''),
        visitTip: String(s?.visitTip ?? ''),
        visitOrder: Number.parseInt(String(s?.visitOrder ?? ''), 10),
      }))
      .filter((s: any) => byId.has(s.eventId) && Number.isFinite(s.visitOrder) && s.visitOrder > 0)
      .sort((a: any, b: any) => a.visitOrder - b.visitOrder);

    const itemsPicked = ordered
      .map((s: any) => {
        const base = byId.get(s.eventId)!;
        return {
          ...base,
          foreignerFriendlinessScore: calculateForeignerFriendlinessScore(base.event),
          recommendationReason:
            [s.shortDescription, s.visitTip].filter((x) => (x ?? '').trim().length > 0).join(' ')??
            buildEventRecommendationBlurb(base, prefs.language),
        };
      })
      .slice(0, maxSpotsForTravel(prefs.travelDuration));

    if (itemsPicked.length === 0) return null;

    const schedule = itemsPicked.map((it, idx) => ({
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
      id: `course-llm-${prefs.visitDate}-${itemsPicked.map((i) => i.event.id).join('|').slice(0, 24)}`,
      title,
      tagline: summary,
      schedule,
      items: itemsPicked,
    };
  } catch {
    // 실패 시 폴백
    return null;
  } finally {
    window.clearTimeout(t);
  }
}

function pickGeminiCandidates(rankedSpatial: ScoredEvent[]): {
  candidates: ScoredEvent['event'][];
  excluded: { id: string; title: string; score: number; penalized: string[] }[];
  penalized: { id: string; title: string; score: number; penalized: string[] }[];
} {
  // 비용 절감: 최초 풀은 24개까지만 보고 선별
  const pool = rankedSpatial.slice(0, 24);
  const scored = pool.map((s) => {
    const fit = touristFitScore(s.event);
    return { s, fit };
  });

  const excluded = scored
    .filter((x) => x.fit.excluded)
    .map((x) => ({ id: x.s.event.id, title: x.s.event.title, score: x.fit.score, penalized: x.fit.penalized }));

  const penalized = scored
    .filter((x) => !x.fit.excluded && x.fit.penalized.length > 0)
    .map((x) => ({ id: x.s.event.id, title: x.s.event.title, score: x.fit.score, penalized: x.fit.penalized }));

  // 1) excluded는 최대한 제거
  const nonExcluded = scored.filter((x) => !x.fit.excluded);

  // 2) touristFitScore 높은 순
  nonExcluded.sort((a, b) => b.fit.score - a.fit.score);

  // 3) 우선 8개까지 뽑되, 최소 5개 확보 시도
  const picked = nonExcluded.slice(0, 8).map((x) => x.s.event);

  // 4) 후보가 부족하면 감점된 행사도 포함(그래도 excluded는 최대한 뒤로)
  if (picked.length < 5) {
    const rest = scored
      .filter((x) => !picked.some((e) => e.id === x.s.event.id))
      .sort((a, b) => b.fit.score - a.fit.score)
      .map((x) => x.s.event);
    for (const e of rest) {
      if (picked.length >= 8) break;
      picked.push(e);
    }
  }

  return { candidates: picked, excluded, penalized };
}

function generateRuleBasedCourse(prefs: UserPreferences, picked: ScoredEvent[]): GeneratedCourse | null {
  if (picked.length === 0) return null;
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
