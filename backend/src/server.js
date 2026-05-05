import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const app = express();

const PORT = Number.parseInt(process.env.PORT ?? '3001', 10);
const SEOUL_OPEN_API_HOST = 'http://openapi.seoul.go.kr:8088';
const LLM_PROVIDER = (process.env.LLM_PROVIDER ?? 'gemini').toLowerCase();
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
const GEMINI_FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL ?? '';

function str(v) {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  return s.length > 0 ? s : undefined;
}

function intParam(v, fallback) {
  const n = Number.parseInt(String(v ?? ''), 10);
  if (!Number.isFinite(n)) return fallback;
  return n;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

const corsOrigin = str(process.env.CORS_ORIGIN);
app.use(
  cors({
    origin: corsOrigin ?? true,
  }),
);

app.use(express.json({ limit: '256kb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

function pick(obj, keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
}

function asArray(v) {
  if (Array.isArray(v)) return v;
  if (v && typeof v === 'object') return [v];
  return [];
}

function safeJsonParse(text) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e) {
    return { ok: false, error: e };
  }
}

function extractJsonObject(text) {
  // LLM이 앞뒤에 설명을 붙이는 경우를 대비해, 첫 { ... 마지막 } 범위를 잘라 파싱 시도
  const a = text.indexOf('{');
  const b = text.lastIndexOf('}');
  if (a < 0 || b < 0 || b <= a) return null;
  const sliced = text.slice(a, b + 1);
  const parsed = safeJsonParse(sliced);
  return parsed.ok ? parsed.value : null;
}

function normalizeAiCourseRequest(body) {
  const language = str(body?.language) ?? 'en';
  const date = str(body?.date) ?? '';
  const district = str(body?.district) ?? '';
  const tripLength = str(body?.tripLength) ?? 'half-day';
  const interests = Array.isArray(body?.interests) ? body.interests.map((x) => String(x)) : [];
  const events = Array.isArray(body?.events) ? body.events : [];
  return { language, date, district, interests, tripLength, events };
}

function validateAiCourseResponse(parsed, allowedEventIds) {
  if (!parsed || typeof parsed !== 'object') return null;
  const title = str(parsed.title);
  const summary = str(parsed.summary);
  const reason = str(parsed.reason);
  const spots = Array.isArray(parsed.spots) ? parsed.spots : [];
  if (!title || !summary || !reason || spots.length === 0) return null;

  const normalizedSpots = [];
  const used = new Set();
  for (const s of spots) {
    const eventId = str(s?.eventId);
    const visitOrder = Number.parseInt(String(s?.visitOrder ?? ''), 10);
    const localizedTitle = str(s?.localizedTitle) ?? '';
    const shortDescription = str(s?.shortDescription) ?? '';
    const visitTip = str(s?.visitTip) ?? '';
    if (!eventId || !allowedEventIds.has(eventId)) continue; // 반드시 입력 events 중에서만
    if (!Number.isFinite(visitOrder) || visitOrder <= 0) continue;
    if (used.has(eventId)) continue;
    used.add(eventId);
    normalizedSpots.push({
      eventId,
      visitOrder,
      localizedTitle,
      shortDescription,
      visitTip,
    });
  }

  if (normalizedSpots.length === 0) return null;
  normalizedSpots.sort((a, b) => a.visitOrder - b.visitOrder);

  return { title, summary, reason, spots: normalizedSpots };
}

function buildCoursePrompt({ language, date, district, interests, tripLength, events }) {
  const safeEvents = events.slice(0, 8).map((e) => ({
    id: str(e?.id) ?? '',
    title: str(e?.title) ?? '',
    category: str(e?.category) ?? '',
    place: str(e?.place) ?? '',
    district: str(e?.district) ?? '',
    startDate: str(e?.startDate) ?? '',
    endDate: str(e?.endDate) ?? '',
    price: str(e?.price) ?? '',
    description: str(e?.description) ?? '',
    homepageUrl: str(e?.homepageUrl) ?? '',
  }));

  const schema = {
    title: 'string',
    summary: 'string',
    reason: 'string',
    spots: [
      {
        eventId: 'string (must be one of input events[].id)',
        visitOrder: 'number starting at 1',
        localizedTitle: 'string (in requested language)',
        shortDescription: 'string (in requested language, 1–2 sentences)',
        visitTip: 'string (in requested language, practical tip)',
      },
    ],
  };

  return [
    {
      role: 'system',
      content:
        [
          '너는 외국인 관광객을 위한 서울 문화행사 코스 추천 도우미다.',
          '반드시 제공된 events 배열 안에 있는 행사만 사용한다.',
          '없는 행사명, 없는 장소명, 없는 날짜, 없는 가격을 새로 만들지 않는다.',
          'spots[].eventId는 반드시 입력 events[].id 중 하나여야 한다.',
          'language 값에 맞춰 title, summary, reason, shortDescription, visitTip을 작성한다.',
          '응답은 설명 없이 JSON 객체 하나만 반환한다. 마크다운/코드펜스 금지.',
        ].join('\n'),
    },
    {
      role: 'user',
      content: JSON.stringify(
        {
          task: 'Create a short cultural course for a traveler in Seoul.',
          constraints: {
            language,
            date,
            district,
            interests,
            tripLength,
            mustUseOnlyProvidedEvents: true,
            doNotInventNewEvents: true,
            outputMustBeStrictJson: true,
          },
          inputEvents: safeEvents,
          outputSchema: schema,
          guidance: [
            'Pick 2-4 spots depending on tripLength (short=2, half-day=3, full-day=4) when possible.',
            'Prefer events close by district if possible.',
            'If some fields are missing, still write helpful descriptions without hallucinating facts.',
            'localizedTitle can be the original title if no safe translation is possible.',
          ],
        },
        null,
        2,
      ),
    },
  ];
}

function geminiModelPath(model) {
  const m = str(model) ?? DEFAULT_GEMINI_MODEL;
  if (m.includes('/')) return m; // e.g. "models/gemini-2.0-flash"
  return `models/${m}`;
}

async function callGemini({ apiKey, model, system, user, signal }) {
  const modelPath = geminiModelPath(model);
  const url = `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${encodeURIComponent(
    apiKey,
  )}`;

  const body = {
    // Gemini는 systemInstruction + contents 형태가 일반적
    systemInstruction: { role: 'system', parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: {
      temperature: 0.2,
      // 일부 모델은 JSON mimeType을 지원합니다. 미지원이어도 프롬프트 제약+파서로 커버.
      responseMimeType: 'application/json',
    },
  };

  const upstream = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!upstream.ok) {
    const t = await upstream.text().catch(() => '');
    return { ok: false, status: upstream.status, detail: t.slice(0, 600) };
  }

  const json = await upstream.json();
  const text =
    json?.candidates?.[0]?.content?.parts?.map((p) => p?.text).filter(Boolean).join('') ??
    json?.candidates?.[0]?.content?.parts?.[0]?.text ??
    '';
  return { ok: true, text: typeof text === 'string' ? text : '' };
}

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    if (signal?.aborted) return onAbort();
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

async function callGeminiWithRetry({ apiKey, model, system, user, signal }) {
  // 목표: 503/429이면 800ms -> 1600ms 백오프, 최대 2회 재시도(총 3번 시도)
  const retryStatuses = new Set([429, 503]);
  const backoffs = [0, 800, 1600];
  let last = null;

  for (let attempt = 0; attempt < backoffs.length; attempt += 1) {
    const waitMs = backoffs[attempt];
    if (waitMs > 0) {
      // eslint-disable-next-line no-console
      console.log(`[backend][gemini] retrying: model=${model} attempt=${attempt + 1}/${backoffs.length} wait=${waitMs}ms`);
      await sleep(waitMs, signal);
    } else {
      // eslint-disable-next-line no-console
      console.log(`[backend][gemini] request: model=${model} attempt=${attempt + 1}/${backoffs.length}`);
    }

    const res = await callGemini({ apiKey, model, system, user, signal });
    last = res;
    if (res.ok) return res;
    if (!retryStatuses.has(res.status)) return res; // 재시도 대상이 아니면 즉시 종료
  }

  return last ?? { ok: false, status: 502, detail: 'Unknown Gemini failure' };
}

/**
 * 서울시 문화행사 OpenAPI 프록시
 * - GET /api/events?start=1&end=50
 * - API 키는 백엔드 환경변수 SEOUL_API_KEY에서만 관리
 */
app.get('/api/events', async (req, res) => {
  const apiKey = str(process.env.SEOUL_API_KEY);
  if (!apiKey) {
    res.status(500).json({
      error: 'SEOUL_API_KEY is not set on the backend.',
    });
    return;
  }

  const start = clamp(intParam(req.query.start, 1), 1, 1000);
  const end = clamp(intParam(req.query.end, 50), start, 1000);

  const url = `${SEOUL_OPEN_API_HOST}/${encodeURIComponent(apiKey)}/json/culturalEventInfo/${start}/${end}/`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const upstream = await fetch(url, { signal: controller.signal });
    if (!upstream.ok) {
      res.status(502).json({
        error: `Upstream HTTP ${upstream.status}`,
      });
      return;
    }

    const json = await upstream.json();

    // 1차 정규화(안전): row가 객체로 올 때 배열로 감싸 프론트 매핑을 안정화
    const root = json?.culturalEventInfo;
    if (root && typeof root === 'object') {
      const row = root.row;
      if (row && !Array.isArray(row) && typeof row === 'object') {
        root.row = [row];
      }
    }

    res.json(json);
  } catch (err) {
    const msg =
      err instanceof DOMException && err.name === 'AbortError'
        ? 'Upstream request timed out.'
        : 'Upstream request failed.';
    res.status(502).json({ error: msg });
  } finally {
    clearTimeout(timeout);
  }
});

/**
 * LLM 기반 코스 생성
 * - POST /api/ai/course
 * - API 키는 백엔드 환경변수 GEMINI_API_KEY에서만 관리
 * - 실패 시 프론트에서 규칙 기반 목업으로 폴백
 */
app.post('/api/ai/course', async (req, res) => {
  if (LLM_PROVIDER !== 'gemini') {
    res.status(500).json({ error: `Unsupported LLM_PROVIDER=${LLM_PROVIDER}. Expected "gemini".` });
    return;
  }

  const apiKey = str(process.env.GEMINI_API_KEY);
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY is not set on the backend.' });
    return;
  }

  const normalized = normalizeAiCourseRequest(req.body);
  const events = normalized.events.slice(0, 8);
  const allowed = new Set(events.map((e) => str(e?.id)).filter(Boolean));
  if (events.length === 0 || allowed.size === 0) {
    res.status(400).json({ error: 'Request must include events[].' });
    return;
  }

  const messages = buildCoursePrompt({ ...normalized, events });
  const system = messages.find((m) => m.role === 'system')?.content ?? '';
  const user = messages.find((m) => m.role === 'user')?.content ?? '';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18_000);

  try {
    const primaryModel = str(process.env.GEMINI_MODEL) ?? DEFAULT_GEMINI_MODEL;
    const fallbackModel = str(GEMINI_FALLBACK_MODEL) ?? '';

    let gemini = await callGeminiWithRetry({
      apiKey,
      model: primaryModel,
      system,
      user,
      signal: controller.signal,
    });

    if (!gemini.ok && fallbackModel && fallbackModel !== primaryModel) {
      // eslint-disable-next-line no-console
      console.log(`[backend][gemini] primary failed -> fallback model=${fallbackModel} status=${gemini.status}`);
      // fallback 모델은 "한 번 더" 시도(재시도는 최소화)
      gemini = await callGeminiWithRetry({
        apiKey,
        model: fallbackModel,
        system,
        user,
        signal: controller.signal,
      });
    }

    if (!gemini.ok) {
      res.status(502).json({ error: `LLM upstream HTTP ${gemini.status}`, detail: gemini.detail });
      return;
    }

    const rawText = gemini.text;

    const parsed = safeJsonParse(rawText);
    const obj = parsed.ok ? parsed.value : extractJsonObject(rawText);
    const validated = validateAiCourseResponse(obj, allowed);
    if (!validated) {
      res.status(502).json({ error: 'LLM response could not be parsed/validated as course JSON.' });
      return;
    }

    res.json(validated);
  } catch (err) {
    const msg =
      err instanceof DOMException && err.name === 'AbortError' ? 'LLM request timed out.' : 'LLM request failed.';
    res.status(502).json({ error: msg });
  } finally {
    clearTimeout(timeout);
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[backend] listening on http://localhost:${PORT}`);
});

