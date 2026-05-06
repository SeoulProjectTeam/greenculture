import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { uiLabels } from '../i18n/translations';
import type { AppLanguage, CultureEvent } from '../types/culture';
import { useTripPlanner } from '../context/TripPlannerContext';
import { getStraightLineKm } from '../services/routeService';
import { localizeEvent, localizeRecommendationParagraph } from '../utils/localizeEvent';
import type { SavedCourseRecord } from '../utils/courseStorage';
import { getSavedCourses, isCourseSaved, saveCourse } from '../utils/courseStorage';
import { EventImage } from '../components/EventImage';
import { CourseNearbyDining } from '../components/CourseNearbyDining';
import { KakaoCourseMap } from '../components/KakaoCourseMap';
import { fetchNearbyRestaurants, type RestaurantCandidate } from '../services/restaurantService';
import { generateCourseSummary } from '../utils/courseSummary';
import { createShareUrl } from '../utils/shareCourse';
import { generateCourseInsights } from '../utils/courseInsights';

function StraightLineBetweenVenues({
  prev,
  curr,
  lang,
}: {
  prev: CultureEvent;
  curr: CultureEvent;
  lang: AppLanguage;
}) {
  const L = uiLabels(lang);
  const okPrev =
    typeof prev.latitude === 'number' &&
    typeof prev.longitude === 'number' &&
    Number.isFinite(prev.latitude) &&
    Number.isFinite(prev.longitude);
  const okCurr =
    typeof curr.latitude === 'number' &&
    typeof curr.longitude === 'number' &&
    Number.isFinite(curr.latitude) &&
    Number.isFinite(curr.longitude);

  if (!okPrev || !okCurr) {
    return (
      <p className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] leading-snug text-slate-600 ring-1 ring-slate-100">
        {L.nearbyByLocationNoCoords}
      </p>
    );
  }

  const km = getStraightLineKm(
    { latitude: prev.latitude!, longitude: prev.longitude! },
    { latitude: curr.latitude!, longitude: curr.longitude! },
  );

  return (
    <p className="rounded-lg bg-seoul-sky/50 px-3 py-2 text-[11px] leading-snug text-seoul-navy ring-1 ring-seoul-blue/15">
      <span className="font-semibold">{L.approxDistance}</span>: ~{km.toFixed(1)} km · {L.straightLineOnly}
    </p>
  );
}

export function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { courses, prefs } = useTripPlanner();
  const fromSavedNav = (location.state as { from?: string } | null)?.from === 'saved';
  const decodedId = useMemo(() => decodeURIComponent(courseId ?? ''), [courseId]);

  const resolved = useMemo(() => {
    const sessionHit = courses.find((c) => c.id === decodedId);
    if (sessionHit) {
      return {
        course: sessionHit,
        displayLang: prefs?.language ?? 'ko',
        fromSession: true as const,
        savedRecord: null as SavedCourseRecord | null,
      };
    }
    const savedHit = getSavedCourses().find((r) => r.courseId === decodedId);
    if (savedHit) {
      return {
        course: savedHit.course,
        displayLang: savedHit.language,
        fromSession: false as const,
        savedRecord: savedHit,
      };
    }
    return {
      course: null as null,
      displayLang: prefs?.language ?? 'ko',
      fromSession: false as const,
      savedRecord: null as SavedCourseRecord | null,
    };
  }, [courses, decodedId, prefs?.language]);

  const showDiningSection =
    (resolved.fromSession && prefs?.includeRestaurantSuggestions === true) ||
    (!resolved.fromSession && resolved.savedRecord?.includeRestaurantSuggestions === true);

  const travelDurationForDining =
    (resolved.fromSession ? prefs?.travelDuration : resolved.savedRecord?.travelDuration) ?? 'half-day';

  useEffect(() => {
    if (!resolved.course && !prefs) navigate('/search', { replace: true });
  }, [resolved.course, prefs, navigate]);

  const [saved, setSaved] = useState(() => isCourseSaved(decodedId));
  const [shareNotice, setShareNotice] = useState('');

  useEffect(() => {
    setSaved(isCourseSaved(decodedId));
  }, [decodedId]);

  useEffect(() => {
    const onStorage = () => setSaved(isCourseSaved(decodedId));
    window.addEventListener('saved-courses-changed', onStorage);
    return () => window.removeEventListener('saved-courses-changed', onStorage);
  }, [decodedId]);

  const lang = resolved.displayLang;
  const L = uiLabels(lang);
  const course = resolved.course;

  const courseSummaryText = useMemo(() => {
    if (!course) return '';
    const events = course.items.map((it) => it.event);
    const interests =
      resolved.fromSession && prefs?.interests?.length ? prefs.interests : undefined;
    return generateCourseSummary(lang, events, interests);
  }, [course, lang, prefs?.interests, resolved.fromSession]);

  const courseInsights = useMemo(() => {
    if (!course) return null;
    const snapshot = resolved.fromSession
      ? {
          visitDate: prefs?.visitDate ?? '',
          travelDuration: prefs?.travelDuration ?? 'half-day',
          interests: prefs?.interests ?? [],
          includeRestaurantSuggestions: prefs?.includeRestaurantSuggestions ?? false,
        }
      : {
          visitDate: resolved.savedRecord?.visitDate ?? '',
          travelDuration: resolved.savedRecord?.travelDuration ?? 'half-day',
          interests: [],
          includeRestaurantSuggestions: resolved.savedRecord?.includeRestaurantSuggestions ?? false,
        };
    return generateCourseInsights(course, snapshot, { lang });
  }, [
    course,
    lang,
    prefs?.includeRestaurantSuggestions,
    prefs?.interests,
    prefs?.travelDuration,
    prefs?.visitDate,
    resolved.fromSession,
    resolved.savedRecord?.includeRestaurantSuggestions,
    resolved.savedRecord?.travelDuration,
    resolved.savedRecord?.visitDate,
  ]);

  const diningFetchKey = useMemo(() => {
    if (!course) return '';
    return `${travelDurationForDining}|${course.items.map((it) => it.event.id).join(',')}`;
  }, [course, travelDurationForDining]);

  const [diningRows, setDiningRows] = useState<RestaurantCandidate[]>([]);
  const [diningLoading, setDiningLoading] = useState(false);

  useEffect(() => {
    if (!showDiningSection || !course) {
      setDiningRows([]);
      setDiningLoading(false);
      return;
    }

    const ac = new AbortController();
    setDiningLoading(true);

    fetchNearbyRestaurants(course.items.map((it) => it.event), {
      travelDuration: travelDurationForDining,
      signal: ac.signal,
    })
      .then((rows) => {
        if (!ac.signal.aborted) setDiningRows(rows);
      })
      .catch(() => {
        if (!ac.signal.aborted) setDiningRows([]);
      })
      .finally(() => {
        if (!ac.signal.aborted) setDiningLoading(false);
      });

    return () => ac.abort();
  }, [showDiningSection, course, diningFetchKey, travelDurationForDining]);

  const diningMapMarkers = useMemo(() => {
    if (!showDiningSection || diningLoading) return undefined;
    const markers = diningRows
      .filter(
        (r) =>
          typeof r.latitude === 'number' &&
          typeof r.longitude === 'number' &&
          Number.isFinite(r.latitude) &&
          Number.isFinite(r.longitude),
      )
      .map((r) => ({
        lat: r.latitude as number,
        lng: r.longitude as number,
        title: r.name,
      }));
    return markers.length > 0 ? markers : undefined;
  }, [showDiningSection, diningLoading, diningRows]);

  if (!course) {
    return (
      <div className="px-5 py-10">
        <p className="text-sm text-slate-600">{L.courseNotFound}</p>
        <Link
          to={prefs ? '/results' : '/my-courses'}
          className="mt-4 inline-block font-semibold text-seoul-blue"
        >
          {prefs ? L.backToResultsLink : L.navMyCourses}
        </Link>
      </div>
    );
  }

  const handleSave = () => {
    if (!prefs || !resolved.fromSession) return;
    const ok = saveCourse(course, {
      visitDate: prefs.visitDate,
      district: prefs.district,
      language: prefs.language,
      travelDuration: prefs.travelDuration,
      includeRestaurantSuggestions: prefs.includeRestaurantSuggestions,
    });
    if (ok) setSaved(true);
  };

  const handleShare = async () => {
    if (!course) return;
    const snapshot = resolved.fromSession
      ? {
          visitDate: prefs?.visitDate ?? '',
          district: prefs?.district ?? '',
          travelDuration: prefs?.travelDuration ?? 'half-day',
          interests: prefs?.interests ?? [],
          includeRestaurantSuggestions: prefs?.includeRestaurantSuggestions ?? false,
        }
      : {
          visitDate: resolved.savedRecord?.visitDate ?? '',
          district: resolved.savedRecord?.district ?? '',
          travelDuration: resolved.savedRecord?.travelDuration ?? 'half-day',
          interests: [],
          includeRestaurantSuggestions: resolved.savedRecord?.includeRestaurantSuggestions ?? false,
        };

    const url = createShareUrl(course, snapshot, { summary: courseSummaryText });

    try {
      if (navigator.share) {
        await navigator.share({ title: course.title, url });
        return;
      }
    } catch {
      // 사용자가 공유 UI를 취소하면 여기로 올 수 있음 → 클립보드 폴백으로 진행
    }

    try {
      await navigator.clipboard.writeText(url);
      setShareNotice(L.shareLinkCopied);
      window.setTimeout(() => setShareNotice(''), 2500);
    } catch {
      setShareNotice(url);
    }
  };

  const backTo = fromSavedNav || !resolved.fromSession ? '/my-courses' : '/results';
  const backLabel = fromSavedNav || !resolved.fromSession ? L.navMyCourses : L.backToResults;

  return (
    <div className="px-5 pb-10 pt-6">
      <div className="rounded-2xl bg-gradient-to-br from-seoul-sky to-white p-4 ring-1 ring-seoul-blue/15">
        <p className="text-[10px] font-bold uppercase tracking-wider text-seoul-blue">{L.timeline}</p>
        <h1 className="mt-1 text-xl font-black text-seoul-navy">{course.title}</h1>
        <p className="mt-2 text-sm text-slate-700">{courseSummaryText}</p>

        {courseInsights ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {courseInsights.stats.coordEventCount >= 2 ? (
              <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-bold text-seoul-navy ring-1 ring-seoul-blue/15">
                {L.badgeLocationBased}
              </span>
            ) : null}

            {courseInsights.stats.transitSegmentCount > 0 ? (
              <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-bold text-seoul-navy ring-1 ring-seoul-blue/15">
                {L.badgeTransitLinked}
              </span>
            ) : null}

            {(resolved.fromSession ? (prefs?.interests?.length ?? 0) : 0) > 0 ? (
              <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-bold text-seoul-navy ring-1 ring-seoul-blue/15">
                {L.badgeInterestBased}
              </span>
            ) : null}

            <span className="ml-auto text-[11px] font-semibold text-slate-700">
              {L.visitDifficulty}:&nbsp;
              <span className="font-black text-seoul-navy">
                {courseInsights.difficulty === 'easy'
                  ? L.difficultyEasy
                  : courseInsights.difficulty === 'moderate'
                    ? L.difficultyModerate
                    : L.difficultyHigh}
              </span>
            </span>
          </div>
        ) : null}
      </div>

      <KakaoCourseMap
        lang={lang}
        events={course.items.map((it) => it.event)}
        heightPx={290}
        restaurantMarkers={diningMapMarkers}
      />

      {showDiningSection ? (
        <CourseNearbyDining lang={lang} loading={diningLoading} restaurants={diningRows} />
      ) : null}

      <div className="relative mt-8 space-y-0 pl-3">
        <div className="absolute bottom-2 left-[11px] top-2 w-0.5 bg-seoul-sky" aria-hidden />
        {course.items.map((it, idx) => {
          const loc = localizeEvent(it.event, lang, idx);
          const why = localizeRecommendationParagraph(it, lang);
          const prevEvent = idx > 0 ? course.items[idx - 1]!.event : null;
          return (
            <div key={it.event.id} className="relative pb-8 pl-8">
              <div className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-seoul-blue text-xs font-bold text-white ring-4 ring-white">
                {idx + 1}
              </div>
              {prevEvent ? (
                <div className="mb-3 mt-1">
                  <StraightLineBetweenVenues prev={prevEvent} curr={it.event} lang={lang} />
                </div>
              ) : null}
              <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 shadow-sm">
                <EventImage
                  src={it.event.imageUrl}
                  alt={loc.title}
                  className="aspect-[16/9] w-full rounded-xl object-cover ring-1 ring-slate-200"
                />
                {!it.event.imageUrl ? (
                  <p className="mt-2 text-[11px] text-slate-500">{L.imageUnavailable}</p>
                ) : null}
                <p className="text-xs font-semibold text-seoul-blue">{loc.category}</p>
                <h2 className="mt-1 text-base font-bold text-seoul-navy">{loc.title}</h2>
                <p className="mt-1 text-xs text-slate-500">{loc.scheduleTimeLine}</p>
                <dl className="mt-3 space-y-1 text-xs text-slate-600">
                  <div>
                    <dt className="inline font-semibold text-slate-500">{L.place} · </dt>
                    <dd className="inline">{loc.place}</dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-slate-500">{L.period} · </dt>
                    <dd className="inline">{loc.periodLine}</dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-slate-500">{L.fee} · </dt>
                    <dd className="inline">{loc.feeLine}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-sm leading-relaxed text-slate-700">
                  <span className="font-semibold text-slate-600">{L.summary}: </span>
                  {loc.summary}
                </p>
                <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-950 ring-1 ring-amber-100">
                  <span className="font-bold">{L.whyRecommended} · </span>
                  <span className="whitespace-pre-line">{why}</span>
                </div>
                {(it.event.homepageUrl ?? '').trim() ? (
                  <a
                    href={(it.event.homepageUrl ?? '').trim()}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-sm font-semibold text-seoul-blue underline-offset-4 hover:underline"
                  >
                    {L.officialWebsite} →
                  </a>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <button
          type="button"
          onClick={handleShare}
          className="flex h-12 items-center justify-center rounded-2xl border-2 border-slate-200 bg-white text-sm font-bold text-seoul-navy"
        >
          {L.share}
        </button>

        {shareNotice ? (
          <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700 ring-1 ring-slate-200">
            {shareNotice}
          </p>
        ) : null}

        <Link
          to={backTo}
          className="flex h-12 items-center justify-center rounded-2xl border-2 border-seoul-navy text-sm font-bold text-seoul-navy"
        >
          {backLabel}
        </Link>

        {prefs && resolved.fromSession ? (
          saved ? (
            <div className="flex h-12 items-center justify-center rounded-2xl bg-slate-100 text-sm font-bold text-slate-600 ring-1 ring-slate-200">
              {L.courseSaved}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              className="flex h-12 items-center justify-center rounded-2xl border-2 border-seoul-blue bg-white text-sm font-bold text-seoul-blue shadow-sm"
            >
              {L.saveCourse}
            </button>
          )
        ) : null}

        {prefs ? (
          <Link
            to="/search"
            className="flex h-12 items-center justify-center rounded-2xl border-2 border-slate-200 bg-white text-sm font-bold text-seoul-navy"
          >
            {L.adjustPlan}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
