import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { languageSelfLabel, uiLabels } from '../i18n/translations';
import { useTripPlanner } from '../context/TripPlannerContext';
import type { AppLanguage } from '../types/culture';
import type { SavedCourseRecord } from '../utils/courseStorage';
import { deleteSavedCourse, getSavedCourses } from '../utils/courseStorage';
import { formatLocalizedDate, localizeDistrictName } from '../utils/localizeEvent';

function formatEventCount(lang: AppLanguage, n: number): string {
  switch (lang) {
    case 'ko':
      return `${n}개`;
    case 'ja':
      return `${n}件`;
    case 'zh':
      return `${n}场`;
    default:
      return `${n} events`;
  }
}

export function MyCoursesPage() {
  const { prefs } = useTripPlanner();
  const viewerLang = prefs?.language ?? 'en';
  const L = uiLabels(viewerLang);

  const [records, setRecords] = useState<SavedCourseRecord[]>(() => getSavedCourses());

  useEffect(() => {
    const sync = () => setRecords(getSavedCourses());
    window.addEventListener('saved-courses-changed', sync);
    return () => window.removeEventListener('saved-courses-changed', sync);
  }, []);

  return (
    <div className="px-5 pb-8 pt-6">
      <h1 className="text-xl font-bold text-seoul-navy">{L.savedCoursesTitle}</h1>
      <p className="mt-1 text-xs text-slate-500">
        {viewerLang === 'ko'
          ? '이 기기에만 저장됩니다. 브라우저 데이터를 지우면 목록이 사라질 수 있어요.'
          : viewerLang === 'ja'
            ? 'この端末にのみ保存されます。ブラウザのデータ削除で消える場合があります。'
            : viewerLang === 'zh'
              ? '仅保存在本设备；清除浏览器数据可能会丢失列表。'
              : 'Stored only on this device. Clearing browser data may remove your list.'}
      </p>

      {records.length === 0 ? (
        <div className="mt-10 rounded-2xl bg-slate-50 px-5 py-10 text-center ring-1 ring-slate-200">
          <p className="text-base font-semibold text-seoul-navy">{L.savedEmptyTitle}</p>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{L.savedEmptyBody}</p>
          <Link
            to="/search"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-seoul-blue px-6 text-sm font-bold text-white"
          >
            {L.browseRecommendations}
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {records.map((rec) => {
            const districtLine =
              rec.district.trim().length > 0
                ? localizeDistrictName(rec.district.trim(), viewerLang)
                : L.districtAny;
            const visitLine = formatLocalizedDate(rec.visitDate, viewerLang);
            const langLine = languageSelfLabel(rec.language, viewerLang);
            const count = rec.course.items.length;
            const eventsLine = formatEventCount(viewerLang, count);

            return (
              <li
                key={rec.courseId}
                className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 shadow-card"
              >
                <div className="border-b border-slate-100 px-4 py-3">
                  <h2 className="text-base font-bold text-seoul-navy line-clamp-2">{rec.course.title}</h2>
                  <dl className="mt-3 grid gap-1.5 text-xs text-slate-600">
                    <div className="flex justify-between gap-2">
                      <dt className="shrink-0 font-semibold text-slate-500">{L.savedVisitDate}</dt>
                      <dd className="text-right">{visitLine}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="shrink-0 font-semibold text-slate-500">{L.savedDistrict}</dt>
                      <dd className="text-right">{districtLine}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="shrink-0 font-semibold text-slate-500">{L.savedLanguage}</dt>
                      <dd className="text-right">{langLine}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="shrink-0 font-semibold text-slate-500">{L.savedEvents}</dt>
                      <dd className="text-right">{eventsLine}</dd>
                    </div>
                  </dl>
                </div>
                <div className="grid grid-cols-2 gap-2 px-3 py-3">
                  <Link
                    to={`/course/${encodeURIComponent(rec.courseId)}`}
                    state={{ from: 'saved' }}
                    className="flex h-10 items-center justify-center rounded-xl bg-seoul-navy text-xs font-bold text-white active:bg-seoul-navy/90"
                  >
                    {L.viewDetail}
                  </Link>
                  <button
                    type="button"
                    className="flex h-10 items-center justify-center rounded-xl border border-red-200 bg-white text-xs font-bold text-red-700 active:bg-red-50"
                    onClick={() => deleteSavedCourse(rec.courseId)}
                  >
                    {L.deleteCourse}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
