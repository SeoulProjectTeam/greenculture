import type { AppLanguage, CourseListItem, UserPreferences } from '../types/culture';
import { getKakaoTransitSegmentUrls } from './mapLinks';
import { getWalkingTravelEstimates } from './travelEstimate';

export type VisitDifficulty = 'easy' | 'moderate' | 'high';

export type CourseInsights = {
  reasons: string[];
  difficulty: VisitDifficulty;
  stats: {
    coordEventCount: number;
    walkingTotalMinutes: number;
    transitSegmentCount: number;
    includeRestaurants: boolean;
  };
};

export type GenerateCourseInsightsOptions = {
  lang?: AppLanguage;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function uniqueLimit(items: string[], min: number, max: number): string[] {
  const uniq = [...new Set(items.map((s) => s.trim()).filter(Boolean))];
  return uniq.slice(0, clamp(uniq.length, min, max));
}

function reasonTemplates(lang: AppLanguage) {
  const ko = {
    dateInterests: '선택한 날짜와 관심사에 맞는 문화행사로 구성했습니다.',
    clustered: '가까운 위치의 행사들을 우선 묶었습니다.',
    walking: '구간별 예상 이동 시간을 제공해 코스 간 거리감을 미리 확인할 수 있습니다.',
    transitLinks: '구간별 대중교통 길찾기 링크를 제공해 이동 계획을 쉽게 확인할 수 있습니다.',
    restaurants: '식당 추천 옵션에 따라 코스 주변 식사 후보를 함께 제공합니다.',
  };
  const en = {
    dateInterests: 'This course reflects your selected date and interests.',
    clustered: 'We prioritized events that are closer together.',
    walking: 'Estimated segment travel times help you gauge distances between stops in advance.',
    transitLinks: 'Transit route links are available by segment for easier planning.',
    restaurants: 'If restaurant suggestions are enabled, nearby dining options are included.',
  };
  const ja = {
    dateInterests: '選択した日付と関心カテゴリに合うイベントで構成しています。',
    clustered: '近い場所のイベントを優先してまとめました。',
    walking: '区間ごとの移動時間の目安で、スポット間の距離感を事前に確認できます。',
    transitLinks: '区間ごとの公共交通ルートリンクで移動計画を確認できます。',
    restaurants: '飲食店の表示を含める設定の場合、周辺の食事候補も表示します。',
  };
  const zh = {
    dateInterests: '该路线结合了您选择的日期与兴趣偏好。',
    clustered: '优先将位置更近的活动组合在一起。',
    walking: '提供分段移动时间预估，便于提前把握各站点之间的距离感。',
    transitLinks: '提供分段公共交通路线链接，便于规划移动。',
    restaurants: '开启餐饮参考时，会同时提供路线周边用餐候选。',
  };
  return lang === 'en' ? en : lang === 'ja' ? ja : lang === 'zh' ? zh : ko;
}

function computeDifficulty({
  coordEventCount,
  walkingTotalMinutes,
  transitSegmentCount,
}: {
  coordEventCount: number;
  walkingTotalMinutes: number;
  transitSegmentCount: number;
}): VisitDifficulty {
  const hasCoordEnough = coordEventCount >= 2;
  const hasTransit = transitSegmentCount > 0;

  // easy: 좌표 있는 행사 2개 이상, 예상 도보 이동 총합 40분 이하, 교통(링크) 정보 있음
  if (hasCoordEnough && walkingTotalMinutes > 0 && walkingTotalMinutes <= 40 && hasTransit) return 'easy';

  // moderate: 예상 도보 이동 총합 90분 이하 또는 대중교통 길찾기 연결 가능
  if ((walkingTotalMinutes > 0 && walkingTotalMinutes <= 90) || hasTransit) return 'moderate';

  return 'high';
}

/**
 * 코스/설정/지도 기능에서 추정 가능한 근거만으로
 * - 추천 이유(3~5개)
 * - 방문 난이도(easy/moderate/high)
 */
export function generateCourseInsights(
  course: CourseListItem,
  prefs: Pick<
    UserPreferences,
    'visitDate' | 'travelDuration' | 'interests' | 'includeRestaurantSuggestions'
  >,
  options: GenerateCourseInsightsOptions = {},
): CourseInsights {
  const lang: AppLanguage = options.lang ?? 'ko';
  const T = reasonTemplates(lang);

  const events = course.items.map((it) => it.event);
  const walkingSegs = getWalkingTravelEstimates(events);
  const walkingTotalMinutes = walkingSegs.reduce((sum, s) => sum + (s.walkingMinutes ?? 0), 0);

  const transitSegs = getKakaoTransitSegmentUrls(events);
  const transitSegmentCount = transitSegs.length;

  const coordEventCount = events.reduce((n, e) => {
    const ok =
      typeof e.latitude === 'number' &&
      typeof e.longitude === 'number' &&
      Number.isFinite(e.latitude) &&
      Number.isFinite(e.longitude);
    return n + (ok ? 1 : 0);
  }, 0);

  const includeRestaurants = prefs.includeRestaurantSuggestions === true;

  const reasons: string[] = [];
  reasons.push(T.dateInterests);
  if (coordEventCount >= 2) reasons.push(T.clustered);
  if (walkingTotalMinutes > 0) reasons.push(T.walking);
  if (transitSegmentCount > 0) reasons.push(T.transitLinks);
  if (includeRestaurants) reasons.push(T.restaurants);

  const difficulty = computeDifficulty({ coordEventCount, walkingTotalMinutes, transitSegmentCount });

  return {
    reasons: uniqueLimit(reasons, 3, 5),
    difficulty,
    stats: {
      coordEventCount,
      walkingTotalMinutes,
      transitSegmentCount,
      includeRestaurants,
    },
  };
}

