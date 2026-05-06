/**
 * 비회원 코스 저장 — localStorage 단일 진입점 (향후 API/DB로 교체 시 이 파일만 갈아끼우면 됨).
 */
import type { AppLanguage, CourseListItem, TravelDurationId } from '../types/culture';

const STORAGE_KEY = 'seoul-culture-saved-courses-v1';

/** 저장 스냅샷 — 재방문 시 카드·상세에 필요한 메타 */
export interface SavedCourseRecord {
  courseId: string;
  savedAt: string;
  visitDate: string;
  district: string;
  language: AppLanguage;
  course: CourseListItem;
  /** 저장 시점 여행 길이 — 식사 후보 개수 등 재표시용 */
  travelDuration?: TravelDurationId;
  /** 저장 시점 식당 섹션 표시 설정 */
  includeRestaurantSuggestions?: boolean;
}

function stripEventRaw(course: CourseListItem): CourseListItem {
  return {
    ...course,
    items: course.items.map((it) => ({
      ...it,
      event: { ...it.event, raw: undefined },
    })),
  };
}

function readRaw(): unknown {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function normalizeRecords(data: unknown): SavedCourseRecord[] {
  if (!Array.isArray(data)) return [];
  return data.filter(
    (row): row is SavedCourseRecord =>
      typeof row === 'object' &&
      row !== null &&
      typeof (row as SavedCourseRecord).courseId === 'string' &&
      typeof (row as SavedCourseRecord).savedAt === 'string' &&
      typeof (row as SavedCourseRecord).visitDate === 'string' &&
      typeof (row as SavedCourseRecord).district === 'string' &&
      typeof (row as SavedCourseRecord).language === 'string' &&
      typeof (row as SavedCourseRecord).course === 'object' &&
      (row as SavedCourseRecord).course !== null,
  );
}

function writeRecords(records: SavedCourseRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function getSavedCourses(): SavedCourseRecord[] {
  return normalizeRecords(readRaw()).sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
  );
}

export function isCourseSaved(courseId: string): boolean {
  return getSavedCourses().some((r) => r.courseId === courseId);
}

/**
 * 코스 저장. 이미 같은 courseId 가 있으면 아무 것도 하지 않고 false 반환.
 */
export function saveCourse(
  course: CourseListItem,
  snapshot: {
    visitDate: string;
    district: string;
    language: AppLanguage;
    travelDuration: TravelDurationId;
    includeRestaurantSuggestions: boolean;
  },
): boolean {
  const courseId = course.id;
  if (!courseId) return false;
  const existing = normalizeRecords(readRaw());
  if (existing.some((r) => r.courseId === courseId)) return false;

  const record: SavedCourseRecord = {
    courseId,
    savedAt: new Date().toISOString(),
    visitDate: snapshot.visitDate,
    district: snapshot.district,
    language: snapshot.language,
    travelDuration: snapshot.travelDuration,
    includeRestaurantSuggestions: snapshot.includeRestaurantSuggestions,
    course: stripEventRaw(course),
  };

  writeRecords([record, ...existing]);
  window.dispatchEvent(new CustomEvent('saved-courses-changed'));
  return true;
}

export function deleteSavedCourse(courseId: string): void {
  const next = normalizeRecords(readRaw()).filter((r) => r.courseId !== courseId);
  writeRecords(next);
  window.dispatchEvent(new CustomEvent('saved-courses-changed'));
}
