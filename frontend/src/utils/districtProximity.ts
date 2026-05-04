/**
 * 자치구 인접 관계 (단순화) — 향후 교통 최적화·동선 추천 시 그래프 확장 가능.
 * MVP에서는 코스 묶기 시 같은 구 / 인접 구 우선순위에만 사용합니다.
 */
export const ADJACENT_DISTRICTS: Record<string, string[]> = {
  종로구: ['중구', '서대문구', '성북구', '동대문구', '용산구'],
  중구: ['종로구', '용산구', '성동구', '동대문구', '마포구'],
  용산구: ['중구', '마포구', '동작구', '서초구', '종로구'],
  성동구: ['중구', '광진구', '동대문구', '성북구'],
  마포구: ['중구', '용산구', '서대문구', '은평구'],
  서대문구: ['종로구', '마포구', '은평구'],
  은평구: ['서대문구', '마포구', '서대문구'],
  서초구: ['용산구', '강남구', '동작구'],
  강남구: ['서초구', '송파구', '성동구'],
  송파구: ['강남구', '광진구'],
  동대문구: ['종로구', '중구', '성동구', '광진구'],
  성북구: ['종로구', '동대문구'],
  광진구: ['성동구', '송파구', '동대문구'],
};

export function areDistrictsClose(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  const neighbors = ADJACENT_DISTRICTS[a];
  return neighbors?.includes(b) ?? false;
}

/** 향후 GeoJSON·격자 혼잡도 등과 결합할 때 사용할 위치 컨텍스트 자리 */
export interface LocationContext {
  /** 선택 자치구 또는 역지오코딩 결과 */
  district?: string;
  latitude?: number;
  longitude?: number;
}
