# Backend

서울시 문화행사 OpenAPI 프록시(백엔드)입니다.

## 실행

```bash
cd backend
npm install
cp .env.example .env
# .env에 SEOUL_API_KEY 설정
npm run dev
```

기본 포트는 `3001`이며, 헬스 체크는 `GET /health` 입니다.

## API

### `GET /api/events?start=1&end=50`

- **역할**: 서울시 OpenAPI `culturalEventInfo`를 서버에서 호출해 그대로 반환합니다.
- **키 관리**: `SEOUL_API_KEY`는 **백엔드 환경변수**에서만 읽습니다.
- **정규화(최소)**: 응답의 `culturalEventInfo.row`가 객체로 올 경우 배열로 감싸 반환합니다(프론트 매핑 안정화 목적).

### `POST /api/seoul/nearby-food-cert`

- **역할**: 서울시 열린데이터 **식품인증업소 관리** OpenAPI(`FsaCrtfcUpsoMgtNew`)를 호출해 목록을 캐시한 뒤, 요청 본문의 행사 좌표 기준 **Haversine 직선 거리**로 가까운 순 후보를 고릅니다.
- **본문**: `{ "events": [{ "district", "latitude", "longitude" }], "travelDuration": "short" | "half-day" | "full-day" }`
- **설정**: **`SEOUL_API_KEY`** 필수 — 문화행사(`/api/events`)와 **동일한** 서울시 OpenAPI 인증키를 사용합니다(식품 전용 별도 키 변수 없음). 서비스명 기본값은 **`FsaCrtfcUpsoMgtNew`** (열린데이터광장 식품인증업소 관리 OpenAPI). 공식 샘플 URL은 `http://openapi.seoul.go.kr:8088/(인증키)/xml/FsaCrtfcUpsoMgtNew/1/5/` 형태이며, 이 서버는 동일 서비스를 **`http://openapi.seoul.go.kr:8088/(키)/json/FsaCrtfcUpsoMgtNew/start/end/`** 로 호출합니다. 다른 데이터셋으로 바꿀 때만 `SEOUL_FOOD_CERT_SERVICE`를 지정합니다.
- **좌표**: 위경도 필드가 있으면 우선 사용합니다. EPSG:5174(TM) 형식의 X/Y만 있는 행은 `proj4`로 WGS84로 변환해 거리 계산에 사용합니다. 둘 다 없으면 후보에서 제외하거나, 주소에서 추출한 자치구가 코스 행사 자치구와 같을 때만 보조 후보로 포함합니다.
- **실패 시**: 프론트는 목업 식당 데이터로 폴백합니다.

## 프론트 연결

프론트는 `VITE_BACKEND_BASE_URL`을 통해 백엔드 주소를 알며, 설정이 없으면 기본적으로 상대경로(`/api/events`)를 호출하도록 구성할 수 있습니다.

개발 환경에서 포트가 달라 CORS가 생기면 `.env`의 `CORS_ORIGIN=http://localhost:5173`를 사용하세요.

## AI 코스 생성 (LLM)

### `POST /api/ai/course`

- **역할**: 프론트가 추린 상위 후보(5~8개)를 받아 LLM이 코스 제목/요약/스팟 설명을 생성해 JSON으로 반환
- **Provider**: 기본 `LLM_PROVIDER=gemini`
- **키 관리**: `GEMINI_API_KEY`는 **백엔드 환경변수**에서만 읽습니다.
- **모델**: `GEMINI_MODEL`로 교체 가능 (예: `gemini-2.5-flash`)
- **안정성**: Gemini가 429/503을 반환하면 800ms→1600ms 백오프로 최대 2회 재시도합니다. 그래도 실패하면 `GEMINI_FALLBACK_MODEL`(옵션)로 한 번 더 시도합니다.
- **제약**: 입력으로 받은 `events[].id` 외의 행사 ID는 응답에 포함될 수 없도록 서버에서 검증합니다.
- **실패 처리**: LLM 호출/파싱 실패 시 502를 반환하며, 프론트는 규칙 기반 목업 코스로 폴백합니다.
