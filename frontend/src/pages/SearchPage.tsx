import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AppLanguage, InterestId, TravelDurationId, UserPreferences } from '../types/culture';
import { useTripPlanner } from '../context/TripPlannerContext';
import { uiLabels } from '../i18n/translations';
import { interestUiLabel } from '../utils/courseSummary';

const DISTRICTS = [
  '',
  '종로구',
  '중구',
  '용산구',
  '성동구',
  '광진구',
  '동대문구',
  '마포구',
  '서초구',
  '강남구',
  '송파구',
] as const;

const INTEREST_IDS: InterestId[] = [
  'exhibition',
  'performance',
  'festival',
  'traditional',
  'kpop',
  'experience',
  'free',
];

const DURATION: { id: TravelDurationId; label: string; hint: string }[] = [
  { id: 'short', label: 'Short', hint: '~3h · morning focus' },
  { id: 'half-day', label: 'Half-day', hint: '~5h · AM + PM' },
  { id: 'full-day', label: 'Full-day', hint: '~8h · full span' },
];

const LANGS: { id: AppLanguage; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'ja', label: 'Japanese' },
  { id: 'zh', label: 'Chinese' },
  { id: 'ko', label: 'Korean' },
];

export function SearchPage() {
  const navigate = useNavigate();
  const { setPrefs, prefs, catalogLoading, catalogError } = useTripPlanner();

  const defaultDate = useMemo(() => prefs?.visitDate ?? '2026-05-11', [prefs?.visitDate]);
  const [visitDate, setVisitDate] = useState(defaultDate);
  const [district, setDistrict] = useState(prefs?.district ?? '');
  const [travelDuration, setTravelDuration] = useState<TravelDurationId>(prefs?.travelDuration ?? 'half-day');
  const [interests, setInterests] = useState<InterestId[]>(prefs?.interests ?? ['exhibition', 'festival']);
  const [language, setLanguage] = useState<AppLanguage>(prefs?.language ?? 'en');
  const [includeRestaurantSuggestions, setIncludeRestaurantSuggestions] = useState(
    prefs?.includeRestaurantSuggestions ?? false,
  );

  const SL = uiLabels(language);

  const toggleInterest = (id: InterestId) => {
    setInterests((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  /** 빈 배열 = 관심 전체(필터 비적용, recommend.ts와 동일) */
  const interestsAllMode = interests.length === 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: UserPreferences = {
      visitDate,
      district,
      travelDuration,
      interests,
      language,
      includeRestaurantSuggestions,
    };
    setPrefs(next);
    navigate('/loading');
  };

  return (
    <div className="px-5 pb-8 pt-6">
      <h1 className="text-xl font-bold text-seoul-navy">Plan your day</h1>
      <p className="mt-1 text-sm text-slate-600">Tell us when and what you like — we&apos;ll shape a course.</p>

      {catalogError ? (
        <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-800 ring-1 ring-red-100">{catalogError}</p>
      ) : null}

      <form onSubmit={submit} className="mt-6 space-y-6">
        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-800">
          Visit date
          <input
            type="date"
            required
            value={visitDate}
            onChange={(ev) => setVisitDate(ev.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-3 text-base outline-none ring-seoul-blue/25 focus:ring-4"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-800">
          Area (district)
          <select
            value={district}
            onChange={(ev) => setDistrict(ev.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-3 text-base outline-none ring-seoul-blue/25 focus:ring-4"
          >
            <option value="">Anywhere in Seoul</option>
            {DISTRICTS.filter(Boolean).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>

        <div>
          <p className="text-sm font-semibold text-slate-800">Trip length</p>
          <div className="mt-2 grid gap-2">
            {DURATION.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setTravelDuration(d.id)}
                className={`flex flex-col rounded-xl border px-4 py-3 text-left transition ${
                  travelDuration === d.id
                    ? 'border-seoul-blue bg-seoul-sky/80 ring-2 ring-seoul-blue/30'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <span className="font-bold text-seoul-navy">{d.label}</span>
                <span className="text-xs text-slate-500">{d.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-800">Interests</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setInterests([])}
              className={`rounded-full px-3 py-2 text-xs font-semibold ring-1 transition ${
                interestsAllMode
                  ? 'bg-seoul-mint text-white ring-seoul-mint'
                  : 'bg-slate-50 text-slate-700 ring-slate-200'
              }`}
            >
              {SL.prefInterestAll}
            </button>
            {INTEREST_IDS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => toggleInterest(id)}
                className={`rounded-full px-3 py-2 text-xs font-semibold ring-1 transition ${
                  !interestsAllMode && interests.includes(id)
                    ? 'bg-seoul-mint text-white ring-seoul-mint'
                    : 'bg-slate-50 text-slate-700 ring-slate-200'
                }`}
              >
                {interestUiLabel(language, id)}
              </button>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-800">
          Guide language
          <select
            value={language}
            onChange={(ev) => setLanguage(ev.target.value as AppLanguage)}
            className="rounded-xl border border-slate-200 px-3 py-3 text-base outline-none ring-seoul-blue/25 focus:ring-4"
          >
            {LANGS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 ring-seoul-blue/10 hover:bg-slate-50/80">
          <input
            type="checkbox"
            checked={includeRestaurantSuggestions}
            onChange={(ev) => setIncludeRestaurantSuggestions(ev.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-seoul-blue focus:ring-seoul-blue"
          />
          <span className="text-sm font-semibold leading-snug text-slate-800">{SL.prefIncludeRestaurants}</span>
        </label>

        <button
          type="submit"
          disabled={catalogLoading}
          className="flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-seoul-blue to-seoul-mint text-base font-bold text-white shadow-lg shadow-seoul-blue/25 disabled:opacity-50"
        >
          {catalogLoading ? 'Loading event catalog…' : 'Generate My Course'}
        </button>
      </form>
    </div>
  );
}
