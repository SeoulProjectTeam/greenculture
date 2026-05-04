import { NavLink, useLocation } from 'react-router-dom';
import { uiLabels } from '../../i18n/translations';
import { useTripPlanner } from '../../context/TripPlannerContext';

export function BottomNav() {
  const { prefs } = useTripPlanner();
  const { pathname } = useLocation();
  const L = uiLabels(prefs?.language ?? 'en');

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${
      isActive ? 'text-seoul-blue' : 'text-slate-500'
    }`;

  if (pathname === '/loading') return null;

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 flex w-full max-w-[430px] -translate-x-1/2 border-t border-slate-200 bg-white/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-md">
      <NavLink to="/" end className={linkCls}>
        <span className="text-lg leading-none">⌂</span>
        {L.navHome}
      </NavLink>
      <NavLink to="/search" className={linkCls}>
        <span className="text-lg leading-none">◎</span>
        {L.navExplore}
      </NavLink>
      <NavLink to="/my-courses" className={linkCls}>
        <span className="text-lg leading-none">★</span>
        {L.navMyCourses}
      </NavLink>
    </nav>
  );
}
