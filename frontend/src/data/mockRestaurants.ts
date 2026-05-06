/**
 * 데모용 식당 후보 풀 — 서울 공공데이터(관광·음식점 등) 연동 시 이 파일 대신 API 어댑터에서 동일 스키마로 매핑하면 됩니다.
 */
export interface MockRestaurantRecord {
  id: string;
  name: string;
  cuisineType: string;
  signatureMenu: string;
  address: string;
  district: string;
  detailUrl: string;
  latitude?: number;
  longitude?: number;
}

export const MOCK_RESTAURANT_POOL: MockRestaurantRecord[] = [
  {
    id: 'mock-r-yongsan-01',
    name: '용산 이태원 골목 한식',
    cuisineType: '한식',
    signatureMenu: '돌솥비빔밥 · 한우 불고기 정식',
    address: '서울 용산구 이태원로 123',
    district: '용산구',
    detailUrl: 'https://english.visitseoul.net/restaurants',
    latitude: 37.5345,
    longitude: 126.9942,
  },
  {
    id: 'mock-r-yongsan-02',
    name: '박물관 앞 브런치 카페',
    cuisineType: '브런치 · 카페',
    signatureMenu: '에그 베네딕트 · 아메리카노',
    address: '서울 용산구 서빙고로 137 인근',
    district: '용산구',
    detailUrl: 'https://english.visitseoul.net/restaurants',
    latitude: 37.5256,
    longitude: 126.9815,
  },
  {
    id: 'mock-r-jongno-01',
    name: '광화문 시저 샐러드 & 파스타',
    cuisineType: '이탈리안',
    signatureMenu: '트러플 크림 파스타 · 시저 샐러드',
    address: '서울 종로구 세종대로 175 인근',
    district: '종로구',
    detailUrl: 'https://english.visitseoul.net/restaurants',
    latitude: 37.5712,
    longitude: 126.9764,
  },
  {
    id: 'mock-r-seocho-01',
    name: '국악원 근처 한정식',
    cuisineType: '한정식',
    signatureMenu: '모둠 전 · 두부 요리 코스',
    address: '서울 서초구 남부순환로 2364 인근',
    district: '서초구',
    detailUrl: 'https://english.visitseoul.net/restaurants',
    latitude: 37.4795,
    longitude: 127.0115,
  },
  {
    id: 'mock-r-songpa-01',
    name: '잠실 랍스터 & 해산물',
    cuisineType: '해산물 · 양식',
    signatureMenu: '랍스터 파스타 · 모듬 회',
    address: '서울 송파구 올림픽로 424 인근',
    district: '송파구',
    detailUrl: 'https://english.visitseoul.net/restaurants',
    latitude: 37.5198,
    longitude: 127.125,
  },
  {
    id: 'mock-r-jung-01',
    name: '남산 한옥마을 전통차와 떡',
    cuisineType: '전통차 · 한과',
    signatureMenu: '수제 엿 · 계절 한과 세트',
    address: '서울 중구 퇴계로34길 28 인근',
    district: '중구',
    detailUrl: 'https://english.visitseoul.net/restaurants',
    latitude: 37.5594,
    longitude: 126.9855,
  },
  {
    id: 'mock-r-mapo-01',
    name: '홍대 입구 분식 골목',
    cuisineType: '분식',
    signatureMenu: '떡볶이 · 순대 모듬',
    address: '서울 마포구 양화로 162 인근',
    district: '마포구',
    detailUrl: 'https://english.visitseoul.net/restaurants',
    latitude: 37.5563,
    longitude: 126.9237,
  },
  {
    id: 'mock-r-gangnam-01',
    name: '강남 코리안 바비큐',
    cuisineType: '고기 · 구이',
    signatureMenu: '양념 갈비 · 된장찌개',
    address: '서울 강남구 테헤란로 152 인근',
    district: '강남구',
    detailUrl: 'https://english.visitseoul.net/restaurants',
    latitude: 37.5012,
    longitude: 127.0396,
  },
];
