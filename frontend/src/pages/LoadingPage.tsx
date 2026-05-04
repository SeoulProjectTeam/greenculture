import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTripPlanner } from '../context/TripPlannerContext';

const STEPS = [
  'Finding cultural events',
  'Matching your interests',
  'Organizing your route',
  'Preparing multilingual guide',
] as const;

export function LoadingPage() {
  const navigate = useNavigate();
  const { prefs, generateCourses } = useTripPlanner();

  useEffect(() => {
    if (!prefs) {
      navigate('/search', { replace: true });
      return;
    }
    let cancelled = false;
    const minUi = new Promise<void>((r) => setTimeout(r, 1600));

    (async () => {
      await Promise.all([minUi, generateCourses()]);
      if (!cancelled) navigate('/results', { replace: true });
    })();

    return () => {
      cancelled = true;
    };
  }, [prefs, generateCourses, navigate]);

  return (
    <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center px-8 py-12">
      <div className="h-14 w-14 animate-spin rounded-full border-4 border-seoul-sky border-t-seoul-blue" aria-hidden />
      <p className="mt-8 text-center text-lg font-semibold text-seoul-navy">Creating your Seoul culture course...</p>
      <ul className="mt-8 w-full max-w-xs space-y-3 text-sm text-slate-600">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-seoul-blue/15 text-xs font-bold text-seoul-blue">
              {i + 1}
            </span>
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
