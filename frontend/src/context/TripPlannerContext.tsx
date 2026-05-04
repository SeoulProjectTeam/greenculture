import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { fetchCultureEvents } from '../services/cultureEvents';
import type { CourseListItem, CultureEvent, ScoredEvent, UserPreferences } from '../types/culture';
import { generateCourseVariants } from '../utils/courseVariants';
import {
  filterEventsByInterests,
  filterEventsByTimeSlots,
  filterEventsByVisitDate,
  rankEvents,
  travelDurationToSlots,
} from '../utils/recommend';

export type TripPlannerContextValue = {
  rawEvents: CultureEvent[];
  catalogLoading: boolean;
  catalogError: string | null;
  prefs: UserPreferences | null;
  ranked: ScoredEvent[];
  courses: CourseListItem[];
  setPrefs: (p: UserPreferences) => void;
  generateCourses: () => Promise<void>;
  clearResults: () => void;
};

const TripPlannerContext = createContext<TripPlannerContextValue | null>(null);

export function TripPlannerProvider({ children }: { children: ReactNode }) {
  const [rawEvents, setRawEvents] = useState<CultureEvent[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [prefs, setPrefsState] = useState<UserPreferences | null>(null);
  const [ranked, setRanked] = useState<ScoredEvent[]>([]);
  const [courses, setCourses] = useState<CourseListItem[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    setCatalogLoading(true);
    fetchCultureEvents(1, 50, { signal: controller.signal })
      .then((data) => setRawEvents(data))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setCatalogError('Could not load cultural events. Check connection or use mock mode.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setCatalogLoading(false);
      });
    return () => controller.abort();
  }, []);

  const setPrefs = useCallback((p: UserPreferences) => {
    setPrefsState(p);
  }, []);

  const generateCourses = useCallback(async () => {
    if (!prefs) return;
    const slots = travelDurationToSlots(prefs.travelDuration);
    let list = filterEventsByVisitDate(rawEvents, prefs.visitDate);
    list = filterEventsByTimeSlots(list, slots);
    list = filterEventsByInterests(list, prefs.interests);
    const scored = rankEvents(list, prefs);
    setRanked(scored);
    const variants = await generateCourseVariants(scored, prefs, 3);
    setCourses(variants);
  }, [prefs, rawEvents]);

  const clearResults = useCallback(() => {
    setRanked([]);
    setCourses([]);
  }, []);

  const value = useMemo(
    () => ({
      rawEvents,
      catalogLoading,
      catalogError,
      prefs,
      ranked,
      courses,
      setPrefs,
      generateCourses,
      clearResults,
    }),
    [rawEvents, catalogLoading, catalogError, prefs, ranked, courses, setPrefs, generateCourses, clearResults],
  );

  return <TripPlannerContext.Provider value={value}>{children}</TripPlannerContext.Provider>;
}

export function useTripPlanner(): TripPlannerContextValue {
  const ctx = useContext(TripPlannerContext);
  if (!ctx) throw new Error('useTripPlanner must be used within TripPlannerProvider');
  return ctx;
}
