/** ISO yyyy-mm-dd 형태 파싱 — 로컬 자정 기준 */
export function parseISODate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null;
  return dt;
}

export function isDateWithinInclusive(visitIso: string, startIso: string, endIso: string): boolean {
  const visit = parseISODate(visitIso);
  const start = parseISODate(startIso);
  const end = parseISODate(endIso);
  if (!visit || !start || !end) return false;
  return visit >= start && visit <= end;
}

/** 불러온 행사 목록의 시작·종료일 문자열 최소·최대 (정렬용 yyyy-mm-dd 가정) */
export function getLoadedEventDateBounds(events: { startDate: string; endDate: string }[]): {
  minStart: string | null;
  maxEnd: string | null;
} {
  let minStart: string | null = null;
  let maxEnd: string | null = null;
  for (const e of events) {
    const s = e.startDate?.trim();
    const ed = e.endDate?.trim();
    if (s && parseISODate(s)) {
      if (!minStart || s < minStart) minStart = s;
    }
    if (ed && parseISODate(ed)) {
      if (!maxEnd || ed > maxEnd) maxEnd = ed;
    }
  }
  return { minStart, maxEnd };
}
