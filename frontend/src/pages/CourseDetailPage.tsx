import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { uiLabels } from '../i18n/translations';
import type { AppLanguage, CultureEvent } from '../types/culture';
import { useTripPlanner } from '../context/TripPlannerContext';
import { getStraightLineKm } from '../services/routeService';
import { localizeEvent, localizeRecommendationParagraph } from '../utils/localizeEvent';
import { getSavedCourses, isCourseSaved, saveCourse } from '../utils/courseStorage';

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
      };
    }
    const savedHit = getSavedCourses().find((r) => r.courseId === decodedId);
    if (savedHit) {
      return {
        course: savedHit.course,
        displayLang: savedHit.language,
        fromSession: false as const,
      };
    }
    return {
      course: null as null,
      displayLang: prefs?.language ?? 'ko',
      fromSession: false as const,
    };
  }, [courses, decodedId, prefs?.language]);

  useEffect(() => {
    if (!resolved.course && !prefs) navigate('/search', { replace: true });
  }, [resolved.course, prefs, navigate]);

  const [saved, setSaved] = useState(() => isCourseSaved(decodedId));

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
    });
    if (ok) setSaved(true);
  };

  const backTo = fromSavedNav || !resolved.fromSession ? '/my-courses' : '/results';
  const backLabel = fromSavedNav || !resolved.fromSession ? L.navMyCourses : L.backToResults;

  return (
    <div className="px-5 pb-10 pt-6">
      <div className="rounded-2xl bg-gradient-to-br from-seoul-sky to-white p-4 ring-1 ring-seoul-blue/15">
        <p className="text-[10px] font-bold uppercase tracking-wider text-seoul-blue">{L.timeline}</p>
        <h1 className="mt-1 text-xl font-black text-seoul-navy">{course.title}</h1>
        <p className="mt-2 text-sm text-slate-700">{course.tagline}</p>
      </div>

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
                  {why}
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
          <button
            type="button"
            onClick={() => navigate('/loading')}
            className="flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-seoul-blue to-seoul-mint text-sm font-bold text-white shadow-md"
          >
            {L.regenerate}
          </button>
        ) : null}
      </div>
    </div>
  );
}
