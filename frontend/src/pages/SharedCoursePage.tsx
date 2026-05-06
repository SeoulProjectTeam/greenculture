import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { uiLabels } from '../i18n/translations';
import { useTripPlanner } from '../context/TripPlannerContext';
import type { AppLanguage, CultureEvent, CourseEventDetail } from '../types/culture';
import { localizeEvent, localizeRecommendationParagraph } from '../utils/localizeEvent';
import { KakaoCourseMap } from '../components/KakaoCourseMap';
import { CourseNearbyDining } from '../components/CourseNearbyDining';
import { fetchNearbyRestaurants, type RestaurantCandidate } from '../services/restaurantService';
import { EventImage } from '../components/EventImage';
import { parseSharedCourseFromUrl } from '../utils/shareCourse';

function toCourseEventDetail(ev: CultureEvent): CourseEventDetail {
  return {
    event: ev,
    recommendationScore: 0,
    recommendationReasons: [],
    foreignerFriendlinessScore: 0,
    recommendationReason: '',
  };
}

export function SharedCoursePage() {
  const location = useLocation();
  const { prefs } = useTripPlanner();
  const lang: AppLanguage = prefs?.language ?? 'ko';
  const L = uiLabels(lang);

  const shared = useMemo(() => parseSharedCourseFromUrl(window.location.href), [location.key]);
  const courseEvents: CultureEvent[] = useMemo(() => {
    if (!shared) return [];
    return shared.events.map((e) => ({
      id: e.id,
      title: e.title,
      category: e.category,
      district: shared.district || '',
      place: e.place,
      startDate: e.startDate,
      endDate: e.endDate,
      isFree: false,
      latitude: e.latitude,
      longitude: e.longitude,
    }));
  }, [shared]);

  const showDiningSection = shared?.includeRestaurants === true;
  const travelDurationForDining = shared?.tripLength ?? 'half-day';

  const [diningRows, setDiningRows] = useState<RestaurantCandidate[]>([]);
  const [diningLoading, setDiningLoading] = useState(false);

  useEffect(() => {
    if (!shared || !showDiningSection || courseEvents.length === 0) {
      setDiningRows([]);
      setDiningLoading(false);
      return;
    }

    const ac = new AbortController();
    setDiningLoading(true);

    fetchNearbyRestaurants(courseEvents, {
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
  }, [shared, showDiningSection, courseEvents, travelDurationForDining]);

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

  if (!shared) {
    return (
      <div className="px-5 py-10">
        <p className="text-sm text-slate-700">{L.sharedCourseLoadFailed}</p>
        <Link to="/" className="mt-4 inline-block font-semibold text-seoul-blue">
          {L.navHome}
        </Link>
      </div>
    );
  }

  const items = courseEvents.map(toCourseEventDetail);

  return (
    <div className="px-5 pb-10 pt-6">
      <div className="rounded-2xl bg-gradient-to-br from-seoul-sky to-white p-4 ring-1 ring-seoul-blue/15">
        <p className="text-[10px] font-bold uppercase tracking-wider text-seoul-blue">{L.timeline}</p>
        <h1 className="mt-1 text-xl font-black text-seoul-navy">{shared.title}</h1>
        <p className="mt-2 text-sm text-slate-700">{shared.summary}</p>
      </div>

      <KakaoCourseMap
        lang={lang}
        events={courseEvents}
        heightPx={290}
        restaurantMarkers={diningMapMarkers}
      />

      {showDiningSection ? (
        <CourseNearbyDining lang={lang} loading={diningLoading} restaurants={diningRows} />
      ) : null}

      <div className="relative mt-8 space-y-0 pl-3">
        <div className="absolute bottom-2 left-[11px] top-2 w-0.5 bg-seoul-sky" aria-hidden />
        {items.map((it, idx) => {
          const loc = localizeEvent(it.event, lang, idx);
          const why = localizeRecommendationParagraph(it, lang);
          return (
            <div key={it.event.id} className="relative pb-8 pl-8">
              <div className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-seoul-blue text-xs font-bold text-white ring-4 ring-white">
                {idx + 1}
              </div>
              <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 shadow-sm">
                <EventImage
                  src={undefined}
                  alt={loc.title}
                  className="aspect-[16/9] w-full rounded-xl object-cover ring-1 ring-slate-200"
                />
                <p className="mt-2 text-[11px] text-slate-500">{L.imageUnavailable}</p>
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
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <Link
          to="/"
          className="flex h-12 items-center justify-center rounded-2xl border-2 border-seoul-navy text-sm font-bold text-seoul-navy"
        >
          {L.navHome}
        </Link>
      </div>
    </div>
  );
}

