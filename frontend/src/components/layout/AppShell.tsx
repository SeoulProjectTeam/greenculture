import type { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { ProgressSteps } from './ProgressSteps';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#e8ecf3]">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-white shadow-2xl shadow-slate-900/15">
        <ProgressSteps />
        <div className="flex-1 pb-24">{children}</div>
        <BottomNav />
      </div>
    </div>
  );
}
