/** 앱 내부 표준 타입 — 서울시 culturalEventInfo JSON 매핑 결과 */
export interface CultureEvent {
  id: string;
  title: string;
  category: string;
  district: string;
  place: string;
  startDate: string;
  endDate: string;
  eventTime?: string;
  target?: string;
  price?: string;
  isFree: boolean;
  description?: string;
  performer?: string;
  homepageUrl?: string;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  organization?: string;
  inquiry?: string;
  raw?: unknown;
  /** 목/API 확장용 다국어 필드 — 미입력 시 localizeEvent에서 규칙·목 번역으로 보강 */
  titleEn?: string;
  titleJa?: string;
  titleZh?: string;
  placeEn?: string;
  placeJa?: string;
  placeZh?: string;
  summaryKo?: string;
  summaryEn?: string;
  summaryJa?: string;
  summaryZh?: string;
}

export type InterestId =
  | 'exhibition'
  | 'performance'
  | 'festival'
  | 'traditional'
  | 'kpop'
  | 'experience'
  | 'free';

export type AppLanguage = 'en' | 'ja' | 'zh' | 'ko';

export type TimeSlotId = 'morning' | 'afternoon' | 'evening';

/** 여행 길이 → 시간대 필터로 매핑 */
export type TravelDurationId = 'short' | 'half-day' | 'full-day';

/** 향후 교통·혼잡도·상권 확장 시 검색 조건에 필드를 추가하기 위한 자리 */
export interface SearchPreferencesExtension {
  /** 예: 도보/대중교통 선호, 최대 이동반경(km) 등 — MVP에서는 미사용 */
  maxTravelMinutes?: number;
  avoidCrowded?: boolean;
  commercialRecommendations?: boolean;
}

export interface UserPreferences extends SearchPreferencesExtension {
  visitDate: string;
  /** 빈 문자열이면 자치구 가중치 없음 */
  district: string;
  travelDuration: TravelDurationId;
  interests: InterestId[];
  language: AppLanguage;
  /** 코스 상세에서 「근처 식사 추천」 섹션 표시 여부 (타임라인에는 삽입하지 않음) */
  includeRestaurantSuggestions: boolean;
}

export interface ScoredEvent {
  event: CultureEvent;
  recommendationScore: number;
  recommendationReasons: string[];
}

export interface CourseScheduleItem {
  order: number;
  timeLabel: string;
  place: string;
  district: string;
  eventTitle: string;
  priceLabel: string;
  isFree: boolean;
  homepageUrl: string;
}

export interface CourseEventDetail extends ScoredEvent {
  foreignerFriendlinessScore: number;
  recommendationReason: string;
}

export interface GeneratedCourse {
  id: string;
  title: string;
  tagline: string;
  schedule: CourseScheduleItem[];
  items: CourseEventDetail[];
}

/** 코스 결과 카드용 요약 지표 */
export interface CourseListItem extends GeneratedCourse {
  avgRecommendationScore: number;
  estimatedDurationLabel: string;
  mainDistrictsLabel: string;
}
