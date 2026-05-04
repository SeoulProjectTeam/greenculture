/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SEOUL_API_KEY?: string;
  /** 'true' | '1' | 'yes' 이면 mock 데이터만 사용 */
  readonly VITE_USE_MOCK_DATA?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
