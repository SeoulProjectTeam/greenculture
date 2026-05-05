import { useMemo, useState } from 'react';

export function EventImage({
  src,
  alt,
  className,
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);

  const normalized = useMemo(() => {
    const s = (src ?? '').trim();
    if (!s) return '';
    if (s.startsWith('//')) return `https:${s}`;
    return s;
  }, [src]);

  if (!normalized || broken) {
    return (
      <div
        className={
          className ??
          'flex aspect-[16/9] w-full items-center justify-center rounded-xl bg-gradient-to-br from-seoul-sky to-white ring-1 ring-seoul-blue/15'
        }
        role="img"
        aria-label={alt}
      >
        <span className="text-xs font-semibold text-seoul-navy/80">Image unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={normalized}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setBroken(true)}
      className={className ?? 'aspect-[16/9] w-full rounded-xl object-cover ring-1 ring-slate-200'}
    />
  );
}

