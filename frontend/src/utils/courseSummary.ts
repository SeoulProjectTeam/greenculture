import type { AppLanguage, CultureEvent, InterestId } from '../types/culture';
import { formatUiTemplate, uiLabels } from '../i18n/translations';
import { translateCategory } from './localizeEvent';
import { extractEventCoords } from './travelEstimate';

function joinPhrase(lang: AppLanguage, parts: string[]): string {
  if (parts.length === 0) return '';
  if (lang === 'zh') return parts.join('、');
  if (lang === 'ja') return parts.join('・');
  return parts.join(' · ');
}

/** 검색 칩·코스 요약 등 UI에서 관심사 ID → 현재 언어 라벨 */
export function interestUiLabel(lang: AppLanguage, id: InterestId): string {
  const L = uiLabels(lang);
  switch (id) {
    case 'exhibition':
      return L.prefInterestExhibition;
    case 'performance':
      return L.prefInterestPerformance;
    case 'festival':
      return L.prefInterestFestival;
    case 'traditional':
      return L.prefInterestTraditional;
    case 'kpop':
      return L.prefInterestKpop;
    case 'experience':
      return L.prefInterestExperience;
    case 'free':
      return L.prefInterestFree;
    default:
      return id;
  }
}

/**
 * 현재 구현(검색 조건·카테고리·관심사·지도/도보 추정) 기준 코스 설명 문구.
 */
export function generateCourseSummary(
  lang: AppLanguage,
  events: CultureEvent[],
  interests?: InterestId[] | undefined,
): string {
  const L = uiLabels(lang);

  const uniqCategories = [...new Set(events.map((e) => e.category?.trim()).filter(Boolean))] as string[];
  const categoryPhrase = joinPhrase(
    lang,
    uniqCategories.map((c) => translateCategory(c, lang)),
  );

  const parts: string[] = [];

  if (categoryPhrase.length > 0) {
    parts.push(formatUiTemplate(L.courseSummaryWithCategories, { categories: categoryPhrase }));
  } else {
    parts.push(L.courseSummaryDefault);
  }

  const uniqInterests = [...new Set(interests ?? [])];
  if (uniqInterests.length > 0) {
    const interestPhrase = joinPhrase(lang, uniqInterests.map((id) => interestUiLabel(lang, id)));
    parts.push(formatUiTemplate(L.courseSummaryInterestsClause, { interests: interestPhrase }));
  }

  const coordCount = events.reduce((n, e) => (extractEventCoords(e) ? n + 1 : n), 0);
  if (coordCount >= 2) {
    parts.push(L.courseSummaryMapFlowNote);
  }

  return parts.join(' ');
}
