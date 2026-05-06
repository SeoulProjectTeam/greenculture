import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { CourseListItem, InterestId, TravelDurationId, UserPreferences } from '../types/culture';

const SHARE_VERSION = 1 as const;

export type SharedCourseEventV1 = {
  id: string;
  title: string;
  place: string;
  category: string;
  startDate: string;
  endDate: string;
  latitude?: number;
  longitude?: number;
};

export type SharedCoursePayloadV1 = {
  version: typeof SHARE_VERSION;
  title: string;
  summary: string;
  date: string;
  district: string;
  tripLength: TravelDurationId;
  interests: InterestId[];
  includeRestaurants: boolean;
  events: SharedCourseEventV1[];
};

export type CreateShareUrlOptions = {
  /** 미지정 시 window.location.origin */
  baseUrl?: string;
  /** 미지정 시 course.tagline → 없으면 빈 문자열 */
  summary?: string;
};

function safeString(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function safeBool(v: unknown): boolean {
  return v === true;
}

function safeNumberOrUndef(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

function safeInterestArray(v: unknown): InterestId[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is InterestId =>
    x === 'exhibition' ||
    x === 'performance' ||
    x === 'festival' ||
    x === 'traditional' ||
    x === 'kpop' ||
    x === 'experience' ||
    x === 'free',
  );
}

function safeTripLength(v: unknown): TravelDurationId | null {
  if (v === 'short' || v === 'half-day' || v === 'full-day') return v;
  return null;
}

function safeEvents(v: unknown): SharedCourseEventV1[] {
  if (!Array.isArray(v)) return [];
  const out: SharedCourseEventV1[] = [];
  for (const row of v) {
    if (!row || typeof row !== 'object') continue;
    const o = row as Record<string, unknown>;
    const id = safeString(o.id).trim();
    const title = safeString(o.title).trim();
    const place = safeString(o.place).trim();
    const category = safeString(o.category).trim();
    const startDate = safeString(o.startDate).trim();
    const endDate = safeString(o.endDate).trim();
    if (!id || !title || !place || !category) continue;
    if (!startDate || !endDate) continue;
    out.push({
      id,
      title,
      place,
      category,
      startDate,
      endDate,
      latitude: safeNumberOrUndef(o.latitude),
      longitude: safeNumberOrUndef(o.longitude),
    });
  }
  return out;
}

export function createShareUrl(
  course: CourseListItem,
  prefs: Pick<
    UserPreferences,
    'visitDate' | 'district' | 'travelDuration' | 'interests' | 'includeRestaurantSuggestions'
  >,
  options: CreateShareUrlOptions = {},
): string {
  const payload: SharedCoursePayloadV1 = {
    version: SHARE_VERSION,
    title: course.title ?? '',
    summary: options.summary ?? course.tagline ?? '',
    date: prefs.visitDate,
    district: prefs.district ?? '',
    tripLength: prefs.travelDuration,
    interests: prefs.interests ?? [],
    includeRestaurants: prefs.includeRestaurantSuggestions === true,
    events: course.items.map((it) => ({
      id: it.event.id,
      title: it.event.title,
      place: it.event.place,
      category: it.event.category,
      startDate: it.event.startDate,
      endDate: it.event.endDate,
      latitude: it.event.latitude,
      longitude: it.event.longitude,
    })),
  };

  const json = JSON.stringify(payload);
  const compressed = compressToEncodedURIComponent(json);
  const origin = options.baseUrl?.trim() || window.location.origin;
  return `${origin}/shared-course?c=${compressed}`;
}

export function parseSharedCourseFromUrl(url?: string): SharedCoursePayloadV1 | null {
  try {
    const u = url ? new URL(url, window.location.origin) : new URL(window.location.href);
    const c = u.searchParams.get('c') ?? '';
    if (!c.trim()) return null;
    const json = decompressFromEncodedURIComponent(c);
    if (!json) return null;
    const raw: unknown = JSON.parse(json);
    if (!raw || typeof raw !== 'object') return null;
    const o = raw as Record<string, unknown>;
    if (Number(o.version) !== SHARE_VERSION) return null;
    const tripLength = safeTripLength(o.tripLength);
    if (!tripLength) return null;

    const payload: SharedCoursePayloadV1 = {
      version: SHARE_VERSION,
      title: safeString(o.title).trim(),
      summary: safeString(o.summary).trim(),
      date: safeString(o.date).trim(),
      district: safeString(o.district).trim(),
      tripLength,
      interests: safeInterestArray(o.interests),
      includeRestaurants: safeBool(o.includeRestaurants),
      events: safeEvents(o.events),
    };

    if (!payload.title || !payload.date) return null;
    if (payload.events.length === 0) return null;
    return payload;
  } catch {
    return null;
  }
}

