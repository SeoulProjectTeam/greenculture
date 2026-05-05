export type FrontendEnv = {
  rawUseLlm: string;
  rawUseMockData: string;
  rawBackendBaseUrl: string;
  useLlm: boolean;
  useMockData: boolean;
  backendBaseUrl: string;
};

function toBool(raw: string): boolean {
  return String(raw).trim().toLowerCase() === 'true';
}

function normalizeBaseUrl(raw: string): string {
  return String(raw ?? '')
    .trim()
    .replace(/\/+$/, '');
}

/**
 * Vite env는 "직접 import.meta.env.VITE_* 접근"을 해야 빌드 시 주입이 안정적입니다.
 * (optional chaining / 동적 접근은 값이 비는 케이스가 있어 이 파일로 단일화)
 */
export function getFrontendEnv(): FrontendEnv {
  const rawUseLlm = String(import.meta.env.VITE_USE_LLM ?? '');
  const rawUseMockData = String(import.meta.env.VITE_USE_MOCK_DATA ?? '');
  const rawBackendBaseUrl = String(import.meta.env.VITE_BACKEND_BASE_URL ?? '');

  return {
    rawUseLlm,
    rawUseMockData,
    rawBackendBaseUrl,
    useLlm: toBool(rawUseLlm),
    useMockData: toBool(rawUseMockData),
    backendBaseUrl: normalizeBaseUrl(rawBackendBaseUrl),
  };
}

