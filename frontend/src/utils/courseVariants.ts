import { generateCourseWithAI } from '@ai/courseGenerator';
import type {
  AppLanguage,
  CourseListItem,
  GeneratedCourse,
  ScoredEvent,
  TravelDurationId,
  UserPreferences,
} from '../types/culture';

export function travelDurationEstimateLabel(d: TravelDurationId): string {
  switch (d) {
    case 'short':
      return '~3 hrs';
    case 'half-day':
      return '~5 hrs';
    case 'full-day':
      return '~8 hrs';
    default:
      return '~5 hrs';
  }
}

function variantSuffix(lang: AppLanguage, index: number): string {
  const table: Record<AppLanguage, [string, string, string]> = {
    en: [' · Signature', ' · Discovery', ' · Local blend'],
    ko: [' · 시그니처', ' · 발견 코스', ' · 동네 믹스'],
    ja: [' · おすすめ', ' · 発見', ' · エリアミックス'],
    zh: [' · 精选', ' · 探索', ' · 混合路线'],
  };
  const row = table[lang] ?? table.en;
  return row[index % row.length] ?? '';
}

function decorateTitle(base: string, index: number, lang: AppLanguage): string {
  if (index === 0) return base;
  return `${base}${variantSuffix(lang, index)}`;
}

export function toCourseListItem(course: GeneratedCourse, prefs: UserPreferences): CourseListItem {
  const scores = course.items.map((i) => i.recommendationScore);
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / Math.max(scores.length, 1));
  const districts = [...new Set(course.items.map((i) => i.event.district))].filter(Boolean);
  const mainDistrictsLabel = districts.slice(0, 3).join(' · ') || 'Seoul';
  return {
    ...course,
    avgRecommendationScore: avg,
    estimatedDurationLabel: travelDurationEstimateLabel(prefs.travelDuration),
    mainDistrictsLabel,
  };
}

/** 점수 상위 풀에서 겹치지 않게 2~3개 코스 변형 생성 */
export async function generateCourseVariants(
  ranked: ScoredEvent[],
  prefs: UserPreferences,
  maxVariants = 3,
): Promise<CourseListItem[]> {
  const used = new Set<string>();
  const bucket: GeneratedCourse[] = [];

  for (let i = 0; i < maxVariants; i++) {
    const subset = ranked.filter((s) => !used.has(s.event.id));
    if (subset.length === 0) break;

    const course = await generateCourseWithAI(subset, prefs);
    if (!course || course.items.length === 0) break;

    const titled = decorateTitle(course.title, i, prefs.language);
    bucket.push({
      ...course,
      id: `${course.id}-v${i}-${Date.now().toString(36)}`,
      title: titled,
    });

    course.items.forEach((it) => used.add(it.event.id));
  }

  if (bucket.length === 0 && ranked.length > 0) {
    const fallback = await generateCourseWithAI(ranked, prefs);
    if (fallback) bucket.push(fallback);
  }

  return bucket.slice(0, maxVariants).map((c) => toCourseListItem(c, prefs));
}
