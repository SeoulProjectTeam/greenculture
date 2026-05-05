/**
 * 행사 카드용 현지화 — 추후 실제 번역/LLM API는 이 모듈만 교체하면 됩니다.
 */
import { uiLabels } from '../i18n/translations';
import type { AppLanguage, CultureEvent, CourseEventDetail } from '../types/culture';
import { extractStartHour, isEffectivelyFree } from './recommend';

export type LocalizedEventCard = {
  category: string;
  title: string;
  place: string;
  feeLine: string;
  summary: string;
  periodLine: string;
  scheduleTimeLine: string;
};

const CATEGORY_MAP: Record<string, Record<AppLanguage, string>> = {
  축제: { ko: '축제', en: 'Festival', ja: 'フェスティバル', zh: '节庆活动' },
  전시: { ko: '전시', en: 'Exhibition', ja: '展示', zh: '展览' },
  공연: { ko: '공연', en: 'Performance', ja: '公演', zh: '演出' },
  전통문화: { ko: '전통문화', en: 'Traditional Culture', ja: '伝統文化', zh: '传统文化' },
  체험: { ko: '체험', en: 'Experience', ja: '体験', zh: '体验' },
  무료행사: { ko: '무료행사', en: 'Free Event', ja: '無料イベント', zh: '免费活动' },
};

/** 알려진 장소명 목 번역 (API 한글만 올 때 폴백) */
const PLACE_FALLBACK: Record<string, Record<AppLanguage, string>> = {
  '광화문광장 일대': {
    ko: '광화문광장 일대',
    en: 'Gwanghwamun Square area',
    ja: '光化門広場周辺',
    zh: '光化门广场一带',
  },
  '서울시립미술관': {
    ko: '서울시립미술관',
    en: 'Seoul Museum of Art',
    ja: 'ソウル市立美術館',
    zh: '首尔市立美术馆',
  },
  경복궁: {
    ko: '경복궁',
    en: 'Gyeongbokgung Palace',
    ja: '景福宮',
    zh: '景福宫',
  },
};

const DISTRICT_MAP: Record<string, Record<AppLanguage, string>> = {
  종로구: { ko: '종로구', en: 'Jongno-gu', ja: '鐘路区', zh: '钟路区' },
  중구: { ko: '중구', en: 'Jung-gu', ja: '中区', zh: '中区' },
  용산구: { ko: '용산구', en: 'Yongsan-gu', ja: '龍山区', zh: '龙山区' },
  성동구: { ko: '성동구', en: 'Seongdong-gu', ja: '城東区', zh: '城东区' },
  마포구: { ko: '마포구', en: 'Mapo-gu', ja: '麻浦区', zh: '麻浦区' },
  서초구: { ko: '서초구', en: 'Seocho-gu', ja: '瑞草区', zh: '瑞草区' },
  강남구: { ko: '강남구', en: 'Gangnam-gu', ja: '江南区', zh: '江南区' },
  송파구: { ko: '송파구', en: 'Songpa-gu', ja: '松坡区', zh: '松坡区' },
  은평구: { ko: '은평구', en: 'Eunpyeong-gu', ja: '恩平区', zh: '恩平区' },
};

/** recommend.ts 에서 생성되는 한글 추천 사유 → 표시용 문장 */
const REASON_MAP: Record<string, Record<AppLanguage, string>> = {
  '관심사 미선택 — 다양한 후보를 폭넓게 고려': {
    ko: '관심사 미선택 — 다양한 후보를 폭넓게 고려',
    en: 'No interests selected — we looked broadly across good matches.',
    ja: '関心カテゴリ未選択のため、幅広い候補から提案しています。',
    zh: '未选择兴趣偏好，因此在较广范围内为您筛选。',
  },
  '전시·미술 키워드와 맞음': {
    ko: '전시·미술 키워드와 맞음',
    en: 'Matches your interest in exhibitions and art.',
    ja: '展示・美術に関心がある方向けです。',
    zh: '与您选择的展览与艺术兴趣相符。',
  },
  '공연·음악 성격과 맞음': {
    ko: '공연·음악 성격과 맞음',
    en: 'Matches your interest in performances and music.',
    ja: '公演・音楽がお好きな方向けです。',
    zh: '与您选择的演出与音乐兴趣相符。',
  },
  '축제·페스티벌 성격과 맞음': {
    ko: '축제·페스티벌 성격과 맞음',
    en: 'Has a festival vibe that fits your picks.',
    ja: 'フェスティバル・お祭り気分を楽しみたい方向けです。',
    zh: '与您选择的节庆氛围相符。',
  },
  '전통문화 요소가 있음': {
    ko: '전통문화 요소가 있음',
    en: 'Includes traditional culture elements.',
    ja: '伝統文化の要素があります。',
    zh: '包含传统文化元素。',
  },
  'K-pop·대중음악 성격과 맞음': {
    ko: 'K-pop·대중음악 성격과 맞음',
    en: 'Matches K-pop and popular music interests.',
    ja: 'K-POP・ポピュラー音楽がお好きな方向けです。',
    zh: '与您选择的K-pop与流行音乐兴趣相符。',
  },
  '체험·참여형 프로그램': {
    ko: '체험·참여형 프로그램',
    en: 'Hands-on or participatory program.',
    ja: '体験・参加型のプログラムです。',
    zh: '体验式或参与型活动。',
  },
  '무료 또는 무료 구간 안내': {
    ko: '무료 또는 무료 구간 안내',
    en: 'Free admission or clearly marked free sections.',
    ja: '無料または無料エリアの案内があります。',
    zh: '免费或设有免费开放区间。',
  },
  '방문일이 행사 기간 안에 포함됨': {
    ko: '방문일이 행사 기간 안에 포함됨',
    en: 'Your visit date falls within the official event period.',
    ja: 'ご訪問日が開催期間に含まれています。',
    zh: '您的到访日在官方活动期内。',
  },
  '자치구 조건 없음 — 동등 배점': {
    ko: '자치구 조건 없음 — 동등 배점',
    en: 'No district filter — districts weighted evenly.',
    ja: '区の指定なし — 公平にスコアしています。',
    zh: '未限定行政区 — 各区权重相同。',
  },
  '다른 자치구지만 일정·관심사와 궁합 가능': {
    ko: '다른 자치구지만 일정·관심사와 궁합 가능',
    en: 'Different district, but still workable with your date and interests.',
    ja: '区は異なりますが、日程・関心とは相性があります。',
    zh: '行政区不同，但与日期和兴趣仍较契合。',
  },
  '무료 행사 선호에 부합': {
    ko: '무료 행사 선호에 부합',
    en: 'Aligns with your preference for free events.',
    ja: '無料イベントをご希望の条件に合います。',
    zh: '符合您对免费活动的偏好。',
  },
  '소개 글이 길어 외국인 안내에 유리': {
    ko: '소개 글이 길어 외국인 안내에 유리',
    en: 'Longer description — usually easier for visitors to plan.',
    ja: '紹介文が充実しており、事前情報が取りやすいです。',
    zh: '介绍文字较完整，便于行前了解。',
  },
  '소개 정보가 비교적 충실함': {
    ko: '소개 정보가 비교적 충실함',
    en: 'Fair amount of program info available.',
    ja: '情報量はそこそこあります。',
    zh: '有一定的官方介绍信息。',
  },
  '간단한 안내 수준': {
    ko: '간단한 안내 수준',
    en: 'Only brief official notes — check the website for details.',
    ja: '案内は簡素です。詳細は公式サイトをご確認ください。',
    zh: '简介较少，详情请查看官网。',
  },
  '추천 점수 상위': {
    ko: '추천 점수 상위',
    en: 'High recommendation score among candidates.',
    ja: '候補の中でスコアが高いプログラムです。',
    zh: '在候选活动中得分较高。',
  },
};

const FALLBACK_SUMMARY: Record<AppLanguage, string> = {
  ko: '공식 안내는 한국어일 수 있습니다. 자세한 내용은 공식 홈페이지를 확인해 주세요.',
  en: 'Full details may be in Korean on the official site. Please check the official website before visiting.',
  ja: '詳細は公式サイトが韓国語の場合があります。事前に公式サイトをご確認ください。',
  zh: '详细信息可能在韩语官网。建议在行前查阅官方网站。',
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function translateCategory(categoryKo: string, lang: AppLanguage): string {
  const row = CATEGORY_MAP[categoryKo.trim()];
  if (row) return row[lang];
  return categoryKo;
}

export function localizeDistrictName(districtKo: string, lang: AppLanguage): string {
  const key = districtKo.trim();
  if (!key) return lang === 'ko' ? '' : 'Seoul';
  const row = DISTRICT_MAP[key];
  if (row) return row[lang];
  return districtKo;
}

/** 향후 번역 API 연결 시 이 함수 본문만 교체 */
export function translatePlaceName(placeKo: string, lang: AppLanguage, event?: CultureEvent): string {
  const key = placeKo.trim();
  if (!key) {
    const empty: Record<AppLanguage, string> = {
      ko: '(장소 정보 없음)',
      en: '(Location unavailable)',
      ja: '(場所情報なし)',
      zh: '(地点信息缺失)',
    };
    return empty[lang];
  }
  if (lang === 'ko') return key;
  if (event) {
    if (lang === 'en' && event.placeEn?.trim()) return event.placeEn.trim();
    if (lang === 'ja' && event.placeJa?.trim()) return event.placeJa.trim();
    if (lang === 'zh' && event.placeZh?.trim()) return event.placeZh.trim();
  }
  const fb = PLACE_FALLBACK[key];
  if (fb) return fb[lang];
  return placeKo;
}

function parseIso(iso: string): Date | null {
  const [y, m, d] = iso.split('-').map((x) => Number.parseInt(x, 10));
  if (!y || !m || !d) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export function formatLocalizedDate(isoDate: string, lang: AppLanguage): string {
  const dt = parseIso(isoDate);
  if (!dt) return isoDate;
  if (lang === 'en') {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(dt);
  }
  if (lang === 'ja') {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(dt);
  }
  if (lang === 'zh') {
    return `${dt.getUTCFullYear()}年${dt.getUTCMonth() + 1}月${dt.getUTCDate()}日`;
  }
  return `${dt.getUTCFullYear()}년 ${dt.getUTCMonth() + 1}월 ${dt.getUTCDate()}일`;
}

export function formatLocalizedPeriod(startIso: string, endIso: string, lang: AppLanguage): string {
  const u = uiLabels(lang);
  const s = startIso.trim();
  const e = endIso.trim();
  if (!s && !e) {
    const empty: Record<AppLanguage, string> = {
      ko: '(기간 정보 없음)',
      en: '(Dates unavailable)',
      ja: '(期間情報なし)',
      zh: '(日期信息缺失)',
    };
    return empty[lang];
  }
  // unknownTime은 "시간"용 라벨이라 기간에 재사용하면 어색할 수 있어 간단한 텍스트로 처리
  if (s && !e) return `${formatLocalizedDate(s, lang)} ${u.periodSeparator} …`;
  if (!s && e) return `… ${u.periodSeparator} ${formatLocalizedDate(e, lang)}`;
  const a = formatLocalizedDate(s, lang);
  const b = formatLocalizedDate(e, lang);
  return `${a} ${u.periodSeparator} ${b}`;
}

/** 향후 LLM 요약으로 교체 — 지금은 명시 필드 또는 안전한 스텁 */
export function summarizeEventByLanguage(event: CultureEvent, lang: AppLanguage): string {
  const explicit =
    lang === 'ko'
      ? event.summaryKo
      : lang === 'en'
        ? event.summaryEn
        : lang === 'ja'
          ? event.summaryJa
          : event.summaryZh;
  if (explicit?.trim()) return explicit.trim();
  if (lang === 'ko') {
    const base = (event.description ?? '').trim();
    if (!base) return FALLBACK_SUMMARY.ko;
    return base.length <= 220 ? base : `${base.slice(0, 219)}…`;
  }
  return FALLBACK_SUMMARY[lang];
}

function localizeWonAmounts(text: string, lang: AppLanguage): string {
  return text.replace(/(\d[\d,]*)\s*원/g, (_, num: string) => {
    const n = num.replace(/,/g, '');
    if (lang === 'en') return `KRW ${n}`;
    if (lang === 'ja') return `${n}KRW`;
    if (lang === 'zh') return `${n}韩元`;
    return `${n}원`;
  });
}

/** 향후 번역 API 연결 시 본문 교체 */
export function localizePriceDisplay(priceRaw: string | undefined, isFree: boolean, lang: AppLanguage): string {
  const u = uiLabels(lang);
  const raw = (priceRaw ?? '').trim();
  if (!raw && !isFree) return u.checkWebsite;
  if (
    !isFree &&
    (/^문의$|^티켓\s*가격\s*상이$|^가격\s*문의$/u.test(raw) || /^상이$/u.test(raw))
  ) {
    return u.checkWebsite;
  }
  if (raw.includes('무료 구간') && raw.includes('유료')) {
    const mix: Record<AppLanguage, string> = {
      ko: raw,
      en: 'Mix of free areas and paid zones — check the official website.',
      ja: '無料エリアと有料エリアが混在します。公式サイトでご確認ください。',
      zh: '含免费与收费区域，请在官网确认。',
    };
    return mix[lang];
  }
  if (isFree || raw.includes('무료')) {
    if (lang === 'ko') return raw || u.free;
    let s = raw;
    s = s.replace(/무료/g, u.free);
    s = localizeWonAmounts(s, lang);
    if (!s.trim()) return u.free;
    return s;
  }
  if (/유료/.test(raw)) {
    let s = raw.replace(/유료/g, u.paid);
    s = localizeWonAmounts(s, lang);
    return s;
  }
  let out = localizeWonAmounts(raw, lang);
  if (!out.trim()) return u.checkWebsite;
  return out;
}

function matchCategoryReason(ko: string): string | null {
  const m = ko.match(/^(.+?) 분야 선택과 일치$/);
  return m?.[1]?.trim() ?? null;
}

function matchSameDistrict(ko: string): string | null {
  const m = ko.match(/^선택한 자치구\(([^)]+)\)와 동일$/);
  return m?.[1]?.trim() ?? null;
}

function matchAdjacentDistrict(ko: string): string | null {
  const m = ko.match(/^선택 구역과 인접 자치구\(([^)]+)\)$/);
  return m?.[1]?.trim() ?? null;
}

export function translateReasonPhrase(koReason: string, lang: AppLanguage): string {
  const trimmed = koReason.trim();
  const direct = REASON_MAP[trimmed];
  if (direct) return direct[lang];

  const cat = matchCategoryReason(trimmed);
  if (cat) {
    const catLoc = translateCategory(cat, lang);
    const templates: Record<AppLanguage, string> = {
      ko: `${cat} 분야 선택과 일치`,
      en: `Aligns with your selected category: ${catLoc}.`,
      ja: `選択した分野（${catLoc}）と一致します。`,
      zh: `与您选择的类别一致：${catLoc}。`,
    };
    return templates[lang];
  }

  const same = matchSameDistrict(trimmed);
  if (same) {
    const d = localizeDistrictName(same, lang);
    const templates: Record<AppLanguage, string> = {
      ko: `선택한 자치구(${same})와 동일`,
      en: `Located in your selected district (${d}).`,
      ja: `ご指定の区（${d}）と同じエリアです。`,
      zh: `位于您选择的行政区（${d}）。`,
    };
    return templates[lang];
  }

  const adj = matchAdjacentDistrict(trimmed);
  if (adj) {
    const d = localizeDistrictName(adj, lang);
    const templates: Record<AppLanguage, string> = {
      ko: `선택 구역과 인접 자치구(${adj})`,
      en: `In a district next to your selection (${d}).`,
      ja: `ご指定エリアに隣接する区（${d}）です。`,
      zh: `与您所选区域相邻的行政区（${d}）。`,
    };
    return templates[lang];
  }

  const unknown: Record<AppLanguage, string> = {
    ko: trimmed,
    en: 'Matches your preferences based on date, location, and interests.',
    ja: '日程・エリア・関心に基づいて適合しています。',
    zh: '根据日期、区域与兴趣与您较为匹配。',
  };
  return unknown[lang];
}

export function localizeRecommendationParagraph(detail: CourseEventDetail, lang: AppLanguage): string {
  const reasons = detail.recommendationReasons ?? [];
  const parts = reasons.map((r) => translateReasonPhrase(r, lang));
  const unique = [...new Set(parts)];
  if (lang === 'en') {
    const body =
      unique.join(' ') ||
      'It fits your plan and is straightforward to follow without Korean language skills.';
    return `${body} It is easy to enjoy even if you do not read Korean.`;
  }
  if (lang === 'ja') {
    return unique.join(' ') || 'ご希望の条件に合わせやすいプログラムです。';
  }
  if (lang === 'zh') {
    return unique.join(' ') || '符合您的行程与偏好，便于当日安排。';
  }
  return unique.join(' ') || '코스 흐름과 방문 조건에 잘 맞습니다.';
}

export function localizeScheduleSlotTime(
  eventTime: string | undefined,
  orderIndex: number,
  lang: AppLanguage,
): string {
  const u = uiLabels(lang);
  const label = eventTime?.trim() ?? '';
  const h = extractStartHour(eventTime);
  if (h === null) {
    if (!label) return u.unknownTime;
    if (lang === 'ko') return label;
    return u.unknownTime;
  }
  const shifted = Math.min(21, h + orderIndex);
  const clock = `${pad(shifted)}:00`;
  if (lang === 'ko') return `${clock} 부근 · ${label || '시간 미정'}`;
  if (lang === 'en')
    return `${u.approxTime} ${clock}. See the official website for daily hours and closures.`;
  if (lang === 'ja')
    return `${u.approxTime}${clock}。開館・公演時間は公式サイトでご確認ください。`;
  return `${u.approxTime} ${clock}。具体时间请查阅官方网站。`;
}

/** API 한글 행사를 카드용으로 변환 (목 필드가 있으면 우선) */
export function translateEventForDisplay(event: CultureEvent, lang: AppLanguage): Omit<LocalizedEventCard, 'periodLine' | 'scheduleTimeLine'> {
  const category = translateCategory(event.category, lang);
  let title = event.title;
  if (lang === 'en' && event.titleEn?.trim()) title = event.titleEn.trim();
  else if (lang === 'ja' && event.titleJa?.trim()) title = event.titleJa.trim();
  else if (lang === 'zh' && event.titleZh?.trim()) title = event.titleZh.trim();
  const place = translatePlaceName(event.place, lang, event);
  const feeLine = localizePriceDisplay(event.price, isEffectivelyFree(event), lang);
  const summary = summarizeEventByLanguage(event, lang);
  return { category, title, place, feeLine, summary };
}

export function localizeEvent(event: CultureEvent, lang: AppLanguage, scheduleOrderIndex = 0): LocalizedEventCard {
  const base = translateEventForDisplay(event, lang);
  return {
    ...base,
    periodLine: formatLocalizedPeriod(event.startDate, event.endDate, lang),
    scheduleTimeLine: localizeScheduleSlotTime(event.eventTime, scheduleOrderIndex, lang),
  };
}
