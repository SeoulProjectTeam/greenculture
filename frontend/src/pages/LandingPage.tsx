import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col px-6 pt-10 pb-8">
      <p className="text-center text-xs font-bold uppercase tracking-[0.25em] text-seoul-blue">Seoul for travelers</p>
      <h1 className="mt-4 text-center text-3xl font-black leading-tight text-seoul-navy">
        Seoul Culture,
        <br />
        Curated for You
      </h1>
      <p className="mt-4 text-center text-base leading-relaxed text-slate-600">
        Discover cultural events and create your travel-friendly course in Seoul.
      </p>
      <div className="mt-8 rounded-2xl bg-gradient-to-br from-seoul-sky to-white p-5 ring-1 ring-seoul-blue/15">
        <p className="text-sm font-semibold text-seoul-navy">Made for international visitors</p>
        <p className="mt-2 text-sm text-slate-600">
          Pick your date, area, and interests — get multilingual summaries and a ready-made cultural route (demo /
          mock).
        </p>
      </div>
      <div className="mt-auto flex flex-col gap-3 pt-12">
        <Link
          to="/search"
          className="flex h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-seoul-blue to-seoul-mint text-base font-bold text-white shadow-lg shadow-seoul-blue/30 active:scale-[0.98]"
        >
          Start Planning
        </Link>
        <p className="text-center text-xs text-slate-400">No install · Works in your browser</p>
      </div>
    </div>
  );
}
