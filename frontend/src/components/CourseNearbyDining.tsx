import { formatUiTemplate, uiLabels } from '../i18n/translations';
import type { AppLanguage } from '../types/culture';
import type { RestaurantCandidate } from '../services/restaurantService';

export function CourseNearbyDining({
  lang,
  loading,
  restaurants,
}: {
  lang: AppLanguage;
  loading: boolean;
  restaurants: RestaurantCandidate[];
}) {
  const L = uiLabels(lang);

  return (
    <section className="mt-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-xs font-bold text-seoul-navy">{L.diningSectionTitle}</h2>
      <p className="mt-1 text-[11px] leading-snug text-slate-600">{L.diningSectionLead}</p>

      {loading ? (
        <p className="mt-3 text-[11px] text-slate-500">{L.diningLoading}</p>
      ) : restaurants.length === 0 ? (
        <p className="mt-3 text-[11px] text-slate-600">{L.diningNoSuggestions}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {restaurants.map((r) => (
            <li
              key={r.id}
              className="rounded-xl bg-slate-50/90 px-3 py-2 ring-1 ring-slate-100"
            >
              <p className="text-[12px] font-bold text-seoul-navy">{r.name}</p>
              {r.cuisineType ? (
                <p className="mt-0.5 text-[11px] text-slate-700">{r.cuisineType}</p>
              ) : null}
              {r.signatureMenu ? (
                <p className="mt-0.5 text-[11px] text-slate-700">
                  <span className="font-semibold text-slate-600">{L.diningSignatureMenu}: </span>
                  {r.signatureMenu}
                </p>
              ) : null}
              {r.certificationNo ? (
                <p className="mt-0.5 text-[11px] text-slate-700">
                  <span className="font-semibold text-slate-600">{L.diningCertificationNo}: </span>
                  {r.certificationNo}
                </p>
              ) : null}
              <p className="mt-1 text-[11px] text-slate-600">{r.address}</p>
              {r.phone ? (
                <p className="mt-1 text-[11px] text-slate-600">
                  <span className="font-semibold text-slate-500">{L.diningPhone}: </span>
                  {r.phone}
                </p>
              ) : null}
              <p className="mt-1 text-[10px] text-slate-500">
                {r.distanceMeters !== null && Number.isFinite(r.distanceMeters)
                  ? formatUiTemplate(L.diningAboutMeters, { distance: Math.round(r.distanceMeters) })
                  : formatUiTemplate(L.diningNearDistrict, { district: r.district })}
              </p>
              {(r.detailUrl ?? '').trim() ? (
                <a
                  href={(r.detailUrl ?? '').trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-[11px] font-semibold text-seoul-blue underline-offset-2 hover:underline"
                >
                  {L.diningViewDetails}
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
