import { useLocation } from 'react-router-dom';

const STEPS = ['Welcome', 'Plan', 'AI', 'Courses', 'Detail'] as const;

const pathToStepIndex: Record<string, number> = {
  '/': 0,
  '/search': 1,
  '/loading': 2,
  '/results': 3,
};

export function ProgressSteps() {
  const { pathname } = useLocation();
  if (pathname === '/my-courses') return null;

  let active = pathToStepIndex[pathname] ?? 0;
  if (pathname.startsWith('/course/')) active = 4;
  active = Math.min(active, STEPS.length - 1);

  return (
    <div className="border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-1">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                i <= active ? 'bg-seoul-blue text-white' : 'bg-slate-100 text-slate-400'
              }`}
            >
              {i + 1}
            </div>
            <span className={`text-[10px] font-medium ${i === active ? 'text-seoul-navy' : 'text-slate-400'}`}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
