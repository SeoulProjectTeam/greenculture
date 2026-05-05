# 서울시 빅데이터 공모전 팀 공유 문서

본 문서는 **지금 저장소에 구현된 기능(Phase 1)** 과 **팀이 지향하는 확장 비전(Phase 2+)** 을 한 파일 안에서 구분해 적습니다. 과거 기획안(이동·탄소·따릉이 중심)만 남아 있으면 §11과 내용이 충돌하므로, 위계를 명확히 했습니다.

---

## 1. 프로젝트 한 줄 소개

- **Phase 1 (현재):** 방문 날짜·관심사·자치구 등을 바탕으로 **서울시 문화행사**를 추천하고, **가까운 장소끼리 묶인 반일/종일 코스**를 모바일 웹에서 보여 줍니다. 외국인이 **회원가입 없이** 쓰도록 **다국어 UI·저장(로컬)** 까지 포함합니다.
- **Phase 2+ (비전):** 행사 장소까지의 **실제 이동 경로**를 여러 기준(시간·편의·탄소 등)으로 비교하고, 따릉이·대중교통 데이터와 연계해 **의사결정을 한 화면**에서 돕는 것을 목표로 합니다.

---

## 2. 해결하려는 문제

**Phase 1에서 다루는 문제**

- 외국인·단기 방문객이 **한국어 행사 정보**만 보고 일정을 짜기 어렵다.
- 행사가 많아도 **방문일·시간대·관심 주제**에 맞게 빠르게 좁히기 어렵다.
- 하루 안에서 **서로 멀지 않은 행사 조합**을 스스로 고르기 어렵다.

**Phase 2+에서 추가로 다루려는 문제**

- 행사 추천과 **길찾기·이동 수단 선택**이 앱마다 갈라져 있다.
- 최단시간만으로는 **환승·따릉이·탄소** 등 현실 조건을 반영하기 어렵다.

---

## 3. 우리 서비스의 핵심 가치

- **Phase 1:** 공공 **문화행사 데이터**를 활용해, **언어·지역·일정**에 맞는 코스를 데이터 기반으로 제안한다.
- **Phase 1:** 장소 간 거리는 아직 **직선거리·구역 묶음** 수준이며, **도보/대중교통 소요시간을 속이지 않는다**는 전제를 명시한다.
- **Phase 2+:** 문화 소비와 이동을 **한 경험**으로 잇고, 친환경·편의 지표를 함께 제시하는 방향을 유지한다.

---

## 4. 주요 기능

### 4-A. Phase 1 — 현재 코드베이스 기준 (구현됨)

| 영역 | 내용 |
|------|------|
| 입력 | 방문일, 자치구(선택), 관심 태그, 표시 언어, 여행 길이(short / half-day / full-day) |
| 데이터 | 서울시 OpenAPI `culturalEventInfo` JSON을 **백엔드 프록시로 호출**(키는 서버 env). 실패·미설정 시 **mock 폴백** |
| 추천·필터 | 날짜·시간대·관심사·점수 기반 랭킹 (`recommend.ts`) |
| 코스 구성 | 동일·인접 **자치구 우선** + 위경도가 있으면 **Haversine 직선거리**로 연속 구간 한도 (2km / 4km / 7km) (`pickCourseEventsSpatial` 등) + (옵션) **Gemini LLM 코스 생성 시도 후 폴백** |
| UI | 랜딩 → 검색 → 로딩 → 결과 카드 → **코스 상세 타임라인**; 하단 **Home / Explore / My Courses** |
| 다국어 | UI 라벨·행사 카드 현지화 (`translations.ts`, `localizeEvent.ts`) |
| 저장 | **localStorage** 코스 저장·삭제·중복 방지, 회원가입 없음 (`courseStorage.ts`) |
| 거리 표시 | 상세 화면에서 **직선거리 참고**만 표기 (`distance.ts`, `routeService.ts` 스텁 — 지도 API 미연동) |
| 안정성 | 실데이터 누락 대응(날짜/좌표/가격/이미지/URL/장소) + API 실패 시 mock 폴백 + Gemini 과부하(429/503) 재시도/모델 폴백 |

### 4-B. Phase 2+ — 로드맵 (아직 저장소에 없음)

아래는 **향후 확장 아이디어**입니다. §4-A와 혼동하지 말 것.

- **경로 3종 추천:** 빠름 / 친환경 / 균형 (이동 시간·탄소 등)
- **경로 비교:** 시간, 탄소, 환승, 따릉이 포함 여부 등
- **따릉이:** 대여소 추천, 반납 가능성 예측(AI)
- **탄소:** 절감량 시각화
- **설명:** 생성형 AI로 경로·행사 설명 보강

---

## 5. 사용 데이터

### 현재 Phase 1에서 쓰는 것

- 서울시 **문화행사** OpenAPI(실패 시 내부 mock 목록)
- 행사 레코드의 **위도·경도**(있을 때만 거리 규칙·표시에 사용)

### Phase 2+에서 추가 검토 중인 것

- 따릉이 대여/반납 이력·대여소 좌표
- 교통 경로 API(TMAP, 카카오 등)
- 교통수단별 탄소 배출 계수

---

## 6. 차별점 (기준을 나눠 이해)

- **Phase 1 기준:** 외국인용 **다국어 문화 코스** + **비회원 저장** + 공공 API와 **위치 기반 묶음**(직선거리 명시)까지 한 번에 보여 주는 **모바일 웹 MVP**.
- **확장 후 기준:** 행사 추천과 이동·친환경 지표를 통합하고, 따릉이 예측·생성형 설명까지 더하는 **스토리텔링**이 가능해짐.

---

## 7. 기대 효과

- 문화 접근성 향상(특히 **언어 장벽 완화·일정 맞춤**).
- 공공데이터 기반 **실제 동작 데모**로 심사·발표에서 설득력 확보.
- **Phase 2+** 연결 시 정책 키워드(탄소중립·대중교통)와도 자연스럽게 연결.

---

## 8. 발표/심사 포인트 (팀 공통 인지)

- **솔직한 범위:** 지금은 **문화 코스 추천·다국어·저장·직선거리 참고**까지를 보여 주고, 이동 API·탄소는 **로드맵**임을 슬라이드에서 한 장으로 고정.
- **공공성:** 서울시 문화행사 OpenAPI 활용, 외국인·시민 동시 타깃.
- **기술성:** 규칙+좌표 기반 클러스터링, 확장 가능한 `routeService`·번역/요약 교체 지점.
- **확장성:** 동일 패턴으로 관광·축제·생활동선으로 확장 가능하다는 메시지.

---

## 9. 팀 역할 제안

- 기획/발표: Phase 1 시나리오·데모 스크립트, Phase 2+ 한 장 로드맵.
- 데이터/AI: 행사 데이터 품질·좌표 커버리지, 향후 예측·LLM 연결.
- 백엔드: 현재는 최소 폴더만 — 필요 시 추천·로그 API 분리.
- 프론트: 검색~코스 UX, 다국어·저장·상세 거리 문구 유지보수.

---

## 10. 다음 액션 (단기)

- 발표용 **한 줄 메시지:** “문화행사를 언어와 위치 기준으로 묶어 준다” + “다음은 실제 길찾기·탄소”.
- Phase 1 **E2E 데모 시나리오** 확정(언어 전환·저장·mock/API 구별).
- OpenAPI 실데이터 비중↑ 시 **좌표 누락 행사**에 대한 거리 규칙 완화 여부 검토.
- (품질) 관광객에 부적합한 직업교육/취업성 프로그램 제거를 위한 **touristFitScore 필터** 적용(LLM 후보 선별 우선).
- (로드맵) 경로 API 키·정책 정리 후 Phase 2 스코프 합의.

---

## 11. 저장소·실행 (기술 부록)

### 11-1. 디렉터리

- `frontend/`: Vite + React + TypeScript + Tailwind, 모바일 폭 UI.
- `ai/`: `generateCourseWithAI` 등 코스 생성 진입점(규칙 기반·목업 + (옵션) 서버 LLM 호출).
- `backend/`: 서울시 OpenAPI 프록시 + (옵션) LLM 코스 생성 API.
- `docs/`: 본 문서 등.

### 11-2. 실행

- (권장) 백엔드 먼저 실행: `cd backend` → `npm install` → `copy .env.example .env` → `npm run dev`
- 프론트 실행: `cd frontend` → `npm install` → `copy .env.example .env` → `npm run dev`
- 환경 변수:
  - 프론트: `frontend/.env.example` 참고 (`VITE_USE_MOCK_DATA`, `VITE_BACKEND_BASE_URL`, `VITE_USE_LLM`)
  - 백엔드: `backend/.env.example` 참고 (`SEOUL_API_KEY`, `LLM_PROVIDER`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_FALLBACK_MODEL`)

### 11-3. mock vs 실API

- Network에 `GET /api/events?...` 요청이 성공하면 라이브 데이터 경향(개발에선 Vite 프록시로 `5173/api/* → 3001` 전달).
- 행사 `id`가 `mock-demo-*` 패턴이면 mock 목록.
- 콘솔 경고 `live fetch failed, using mockCultureEvents` 는 폴백 발생.

### 11-4. 라우트

- `/` → `/search` → `/loading` → `/results` → `/course/:courseId`
- `/my-courses` (저장 목록)

### 11-5. 핵심 파일

- `backend/src/server.js` — `GET /api/events`, `POST /api/ai/course`
- `frontend/src/services/seoulCultureApi.ts` — 데이터 로드(백엔드 프록시 호출 + 폴백)
- `frontend/src/utils/recommend.ts` — 랭킹·`pickCourseEventsSpatial`·`touristFitScore` 등
- `frontend/src/utils/distance.ts`, `frontend/src/services/routeService.ts`
- `frontend/src/utils/localizeEvent.ts`, `frontend/src/i18n/translations.ts`
- `frontend/src/utils/courseStorage.ts`
- `frontend/src/context/TripPlannerContext.tsx`
- `ai/src/courseGenerator.ts` — (옵션) Gemini LLM 코스 생성 시도 + 후보 선별 + 폴백
- `frontend/src/config/env.ts` — Vite env 주입 단일화(LLM 토글/백엔드 URL)

### 11-6. 예전 스택

- Spring Boot·Expo 등 구조는 제거됨. 위 경로가 현재 기준입니다.
