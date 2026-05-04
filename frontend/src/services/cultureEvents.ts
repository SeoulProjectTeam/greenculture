/**
 * 데이터 로드 진입점 — 구현은 `seoulCultureApi.ts` 단일 모듈에서 관리합니다.
 */
export {
  fetchCultureEvents,
  mapSeoulApiEventToCultureEvent,
  normalizeSeoulApiDate,
  shouldUseMockData,
} from './seoulCultureApi';
