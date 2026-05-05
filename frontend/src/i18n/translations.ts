import type { AppLanguage } from '../types/culture';

/** 코스 상세·결과 화면 등 UI 라벨 — 선택 언어 */
export const detailUi = {
  en: {
    timeline: 'Timeline',
    place: 'Place',
    period: 'Period',
    fee: 'Fee',
    summary: 'Summary',
    whyRecommended: 'Why recommended',
    officialWebsite: 'Official website',
    backToResults: 'Back to Results',
    regenerate: 'Regenerate',
    courseNotFound: 'Course not found.',
    backToResultsLink: 'Back to results',
    yourCourses: 'Your courses',
    eventsMatched: 'events matched',
    curatedRoutes: 'curated routes',
    curatedRoute: 'Curated route',
    estTime: 'Est. time',
    score: 'Score',
    stops: 'Stops',
    areas: 'Areas',
    viewDetail: 'View Detail',
    approxTime: 'Around',
    periodSeparator: '–',
    checkWebsite: 'Check official website',
    free: 'Free',
    paid: 'Paid',
    unknownTime: 'Time TBA — see official site.',
    noCoursesTitle: 'No matching courses yet.',
    noCoursesBody:
      'Try another date (mock data often fits spring–summer 2026), widen trip length, or pick more interests.',
    adjustPlan: 'Adjust plan',
    navHome: 'Home',
    navExplore: 'Explore',
    navMyCourses: 'My Courses',
    saveCourse: 'Save course',
    courseSaved: 'Saved',
    deleteCourse: 'Delete',
    savedCoursesTitle: 'My Courses',
    savedEmptyTitle: 'No saved courses yet.',
    savedEmptyBody:
      'Open any recommended course and tap Save course. Your list stays on this device only — no sign-up needed.',
    savedVisitDate: 'Visit date',
    savedDistrict: 'Area',
    savedLanguage: 'Language',
    savedEvents: 'Events',
    savedEventsUnit: 'spots',
    districtAny: 'Any area',
    languageEnglish: 'English',
    languageKorean: 'Korean',
    languageJapanese: 'Japanese',
    languageChinese: 'Chinese',
    browseRecommendations: 'Browse recommendations',
    approxDistance: 'Approx. distance',
    straightLineOnly: 'Straight line only — not walking or transit time',
    nearbyByLocationNoCoords:
      'Nearby by location — straight-line distance not shown (coordinates missing for one or both venues).',
    imageUnavailable: 'No image available for this event.',
  },
  ko: {
    timeline: '타임라인',
    place: '장소',
    period: '기간',
    fee: '요금',
    summary: '요약',
    whyRecommended: '추천 이유',
    officialWebsite: '공식 웹사이트',
    backToResults: '목록으로',
    regenerate: '다시 생성',
    courseNotFound: '코스를 찾을 수 없습니다.',
    backToResultsLink: '목록으로 돌아가기',
    yourCourses: '추천 코스',
    eventsMatched: '개 행사 매칭',
    curatedRoutes: '개 코스',
    curatedRoute: '추천 루트',
    estTime: '예상 시간',
    score: '점수',
    stops: '방문 수',
    areas: '주요 지역',
    viewDetail: '상세 보기',
    approxTime: '약',
    periodSeparator: '~',
    checkWebsite: '공식 사이트에서 확인',
    free: '무료',
    paid: '유료',
    unknownTime: '시간 미정 — 공식 안내 참고',
    noCoursesTitle: '아직 매칭된 코스가 없습니다.',
    noCoursesBody:
      '다른 날짜(목 데이터는 2026년 봄~여름 일정에 맞춰져 있음)를 선택하거나, 여행 길이를 넓히거나, 관심사를 더 고르세요.',
    adjustPlan: '조건 바꾸기',
    navHome: '홈',
    navExplore: '탐색',
    navMyCourses: '내 코스',
    saveCourse: '코스 저장',
    courseSaved: '저장됨',
    deleteCourse: '삭제',
    savedCoursesTitle: '저장한 코스',
    savedEmptyTitle: '저장된 코스가 없습니다.',
    savedEmptyBody:
      '추천 코스 상세에서 「코스 저장」을 누르면 여기에 모입니다. 이 기기에만 저장되며 회원가입은 필요 없습니다.',
    savedVisitDate: '방문 날짜',
    savedDistrict: '관심 지역',
    savedLanguage: '언어',
    savedEvents: '포함 행사',
    savedEventsUnit: '개',
    districtAny: '지역 제한 없음',
    languageEnglish: 'English',
    languageKorean: '한국어',
    languageJapanese: '日本語',
    languageChinese: '中文',
    browseRecommendations: '추천 둘러보기',
    approxDistance: '직선 거리(참고)',
    straightLineOnly: '직선 거리만 표시 · 도보·대중교통 시간 아님',
    nearbyByLocationNoCoords:
      '위치상 가까운 후보입니다. 한쪽 또는 양쪽 행사에 좌표가 없어 직선 거리는 표시하지 않습니다.',
    imageUnavailable: '이미지 정보가 없습니다.',
  },
  ja: {
    timeline: 'タイムライン',
    place: '場所',
    period: '期間',
    fee: '料金',
    summary: '概要',
    whyRecommended: 'おすすめ理由',
    officialWebsite: '公式サイト',
    backToResults: '一覧へ',
    regenerate: '再生成',
    courseNotFound: 'コースが見つかりません。',
    backToResultsLink: '一覧に戻る',
    yourCourses: 'おすすめコース',
    eventsMatched: '件のイベントが該当',
    curatedRoutes: '件のコース',
    curatedRoute: 'おすすめルート',
    estTime: '所要時間の目安',
    score: 'スコア',
    stops: 'スポット数',
    areas: 'エリア',
    viewDetail: '詳細を見る',
    approxTime: '約',
    periodSeparator: '～',
    checkWebsite: '公式サイトでご確認ください',
    free: '無料',
    paid: '有料',
    unknownTime: '時間未定 — 公式サイトをご確認ください',
    noCoursesTitle: '該当するコースがありません。',
    noCoursesBody:
      '別の日付（モックデータは2026年春〜夏向け）、滞在時間の設定、関心カテゴリを変えてお試しください。',
    adjustPlan: '条件を変える',
    navHome: 'ホーム',
    navExplore: '探索',
    navMyCourses: 'マイコース',
    saveCourse: 'コースを保存',
    courseSaved: '保存済み',
    deleteCourse: '削除',
    savedCoursesTitle: '保存したコース',
    savedEmptyTitle: '保存されたコースはありません。',
    savedEmptyBody:
      'おすすめコースの詳細で「コースを保存」を押すとここに表示されます。この端末のみに保存され、会員登録は不要です。',
    savedVisitDate: '訪問日',
    savedDistrict: 'エリア',
    savedLanguage: '表示言語',
    savedEvents: 'イベント数',
    savedEventsUnit: '件',
    districtAny: 'エリア指定なし',
    languageEnglish: 'English',
    languageKorean: '韓国語',
    languageJapanese: '日本語',
    languageChinese: '中国語',
    browseRecommendations: 'おすすめを見る',
    approxDistance: '直線距離（目安）',
    straightLineOnly: '直線距離のみ・徒歩・交通の所要時間ではありません',
    nearbyByLocationNoCoords:
      'エリア上は近い組み合わせです。座標がないため直線距離は表示しません。',
    imageUnavailable: '画像がありません。',
  },
  zh: {
    timeline: '行程',
    place: '地点',
    period: '日期',
    fee: '费用',
    summary: '摘要',
    whyRecommended: '推荐理由',
    officialWebsite: '官方网站',
    backToResults: '返回列表',
    regenerate: '重新生成',
    courseNotFound: '未找到该路线。',
    backToResultsLink: '返回列表',
    yourCourses: '推荐路线',
    eventsMatched: '场活动匹配',
    curatedRoutes: '条路线',
    curatedRoute: '精选路线',
    estTime: '预计时长',
    score: '评分',
    stops: '站点数',
    areas: '主要区域',
    viewDetail: '查看详情',
    approxTime: '约',
    periodSeparator: '至',
    checkWebsite: '请在官网确认',
    free: '免费',
    paid: '收费',
    unknownTime: '时间未定 — 请查看官网',
    noCoursesTitle: '暂时没有匹配的路线。',
    noCoursesBody: '可尝试更换日期（演示数据多对应2026年春夏季）、调整停留时长或增加兴趣标签。',
    adjustPlan: '修改条件',
    navHome: '首页',
    navExplore: '探索',
    navMyCourses: '我的路线',
    saveCourse: '保存路线',
    courseSaved: '已保存',
    deleteCourse: '删除',
    savedCoursesTitle: '我的路线',
    savedEmptyTitle: '还没有保存的路线。',
    savedEmptyBody:
      '在任意推荐路线详情页点击「保存路线」即可收藏。数据仅保存在本设备，无需注册账号。',
    savedVisitDate: '游览日期',
    savedDistrict: '区域偏好',
    savedLanguage: '界面语言',
    savedEvents: '包含活动',
    savedEventsUnit: '场',
    districtAny: '不限区域',
    languageEnglish: 'English',
    languageKorean: '韩语',
    languageJapanese: '日语',
    languageChinese: '中文',
    browseRecommendations: '去发现推荐',
    approxDistance: '直线距离（参考）',
    straightLineOnly: '仅为直线距离 — 非步行或公共交通耗时',
    nearbyByLocationNoCoords:
      '按区域相近组合。缺少坐标，无法显示直线距离。',
    imageUnavailable: '暂无图片。',
  },
} as const satisfies Record<AppLanguage, Record<string, string>>;

export function uiLabels(lang: AppLanguage) {
  return detailUi[lang];
}

/** 결과 목록 상단 부제 — 언어별 자연스러운 순서 */
export function languageSelfLabel(code: AppLanguage, viewerLang: AppLanguage): string {
  const L = uiLabels(viewerLang);
  switch (code) {
    case 'en':
      return L.languageEnglish;
    case 'ko':
      return L.languageKorean;
    case 'ja':
      return L.languageJapanese;
    case 'zh':
      return L.languageChinese;
    default:
      return L.languageEnglish;
  }
}

export function formatResultsSubtitle(lang: AppLanguage, matched: number, routes: number): string {
  switch (lang) {
    case 'ko':
      return `${matched}개 행사 매칭 · ${routes}개 코스`;
    case 'ja':
      return `${matched}件のイベント該当 · ${routes}件のコース`;
    case 'zh':
      return `${matched}场活动匹配 · ${routes}条路线`;
    default:
      return `${matched} events matched · ${routes} curated routes`;
  }
}
