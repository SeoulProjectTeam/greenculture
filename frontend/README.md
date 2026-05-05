# Frontend (Vite + React)

문화행사 추천 웹 MVP입니다.

```bash
npm install
npm run dev
```

환경 변수는 이 폴더의 `.env.example` 참고.

AI 코스 생성 로직은 상위 폴더 `../ai/src/` 에 두고, `@ai/*` 별칭으로 가져옵니다.

## 백엔드 프록시 사용(권장)

프론트는 서울시 OpenAPI를 직접 호출하지 않고, **백엔드의 프록시 엔드포인트**를 호출합니다.

1) 백엔드 실행

```bash
cd ../backend
npm install
cp .env.example .env
# .env에 SEOUL_API_KEY 설정
npm run dev
```

2) 프론트 실행

```bash
cd ../frontend
cp .env.example .env
# 필요 시 VITE_BACKEND_BASE_URL=http://localhost:3001 설정
npm install
npm run dev
```

## 테스트 팁

- `VITE_USE_MOCK_DATA=true`면 네트워크 실패 여부와 무관하게 mock만 사용합니다.
- `VITE_USE_MOCK_DATA=false`면 `GET {VITE_BACKEND_BASE_URL}/api/events?start=1&end=50` 호출이 성공해야 라이브 데이터가 반영됩니다.

## LLM 코스 생성(서버 사이드)

기본은 규칙 기반 목업 코스 생성입니다. 아래를 켜면, 상위 후보 5~8개를 백엔드로 보내 LLM 생성을 먼저 시도합니다.

- `frontend/.env`: `VITE_USE_LLM=true`
- `backend/.env`: `LLM_PROVIDER=gemini`, `GEMINI_API_KEY=...` (필수)

LLM 실패/타임아웃/응답 파싱 실패 시에는 자동으로 기존 목업 코스로 폴백합니다.
