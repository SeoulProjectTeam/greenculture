import { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatResultsSubtitle, uiLabels } from '../i18n/translations';
import { useTripPlanner } from '../context/TripPlannerContext';
import { localizeDistrictName } from '../utils/localizeEvent';
import { EventImage } from '../components/EventImage';

export function ResultPage() {
  const { courses, prefs, ranked } = useTripPlanner();
  const navigate = useNavigate();

  useEffect(() => {
    if (!prefs) navigate('/search', { replace: true });
  }, [prefs, navigate]);

  const lang = prefs?.language ?? 'ko';
  const L = uiLabels(lang);

  const localizedDistrictsByCourse = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of courses) {
      const parts = c.mainDistrictsLabel.split(/\s*·\s*/).filter(Boolean);
      map.set(
        c.id,
        parts.map((d) => localizeDistrictName(d.trim(), lang)).join(lang === 'zh' ? '、' : ' · '),
      );
    }
    return map;
  }, [courses, lang]);

  if (!prefs) return null;

  return (
    <div className="px-5 pb-8 pt-6">
      <h1 className="text-xl font-bold text-seoul-navy">{L.yourCourses}</h1>
      <p className="mt-1 text-sm text-slate-600">
        {formatResultsSubtitle(lang, ranked.length, courses.length)}
      </p>

      {courses.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-amber-50 px-4 py-6 text-sm text-amber-950 ring-1 ring-amber-100">
          <p className="font-semibold">{L.noCoursesTitle}</p>
          <p className="mt-2 text-amber-900/90">{L.noCoursesBody}</p>
          <Link
            to="/search"
            className="mt-4 inline-flex rounded-xl bg-seoul-blue px-4 py-2 text-sm font-bold text-white"
          >
            {L.adjustPlan}
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {courses.map((course) => (
            <article
              key={course.id}
              className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 shadow-card"
            >
              <div className="px-4 pt-4">
                <EventImage
                  src={course.items[0]?.event.imageUrl}
                  alt={`${course.title} preview`}
                  className="aspect-[16/9] w-full rounded-2xl object-cover ring-1 ring-slate-200"
                />
                {!course.items[0]?.event.imageUrl ? (
                  <p className="mt-2 text-[11px] text-slate-500">{L.imageUnavailable}</p>
                ) : null}
              </div>
              <div className="bg-gradient-to-r from-seoul-sky/90 to-white px-4 py-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-seoul-blue">
                  {L.curatedRoute}
                </span>
                <h2 className="mt-1 text-lg font-bold text-seoul-navy">{course.title}</h2>
                <p className="mt-1 text-sm text-slate-700">{course.tagline}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 px-4 py-4 text-xs">
                <div className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
                  <p className="font-semibold text-slate-500">{L.estTime}</p>
                  <p className="mt-0.5 font-bold text-seoul-navy">{course.estimatedDurationLabel}</p>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
                  <p className="font-semibold text-slate-500">{L.score}</p>
                  <p className="mt-0.5 font-bold text-seoul-navy">{course.avgRecommendationScore}</p>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
                  <p className="font-semibold text-slate-500">{L.stops}</p>
                  <p className="mt-0.5 font-bold text-seoul-navy">{course.items.length}</p>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
                  <p className="font-semibold text-slate-500">{L.areas}</p>
                  <p className="mt-0.5 line-clamp-2 font-bold text-seoul-navy">
                    {localizedDistrictsByCourse.get(course.id) ?? course.mainDistrictsLabel}
                  </p>
                </div>
              </div>
              <div className="border-t border-slate-100 px-4 py-3">
                <Link
                  to={`/course/${encodeURIComponent(course.id)}`}
                  className="flex h-11 items-center justify-center rounded-xl bg-seoul-navy text-sm font-bold text-white active:bg-seoul-navy/90"
                >
                  {L.viewDetail}
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
