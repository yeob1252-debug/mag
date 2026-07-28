/* =========================================================
   맛집감별사 — 데이터 레이어
   ---------------------------------------------------------
   [운영 방식] 모든 노출 데이터는 구글시트에서 온다.
   - 인플루언서 탭: 등록 구글폼 응답이 자동 적재된 시트. `승인여부`가 'O'인
     행만 사이트에 노출한다. 필터 항목(지역/성별/연령대/가격대/콘텐츠스타일)은
     구글폼 항목과 1:1로 매칭된다.
   - 이벤트 탭: 인플루언서명/정가/할인가/정원/현재신청건수/혜택/시작일/종료일/
     노출여부. `노출여부`가 'ON'인 행만 배너에 반영한다.
   - 지표: 승인된 인플루언서 행 기준으로 자동 집계 + 진행중 업체 수(운영 입력).

   [연동 방법] Google Apps Script 웹앱 JSON 엔드포인트를 fetch 한다.
   엔드포인트/폼 URL 은 .env → js/config.js(window.MAG_ENV) 로 주입된다
   (tools/gen-config.py 로 .env 에서 생성). ENV 값이 없으면 이 파일의 MOCK
   데이터로 폴백한다(로컬 개발용). fetch 실패 시에는 빈 배열을 반환해
   화면이 자연스럽게 빈 상태(empty state)로 전환된다.

   연락처는 어떤 경우에도 사이트에 노출하지 않는다(모든 소통은 운영자 경유).
   ========================================================= */
(function () {
  'use strict';

  /* ---- 외부 설정(.env → config.js) ---- */
  const ENV = window.MAG_ENV || {};

  /* ---- 필터 옵션 정의 (구글폼 항목과 1:1) ---- */
  const FILTERS = {
    regions: [
      { id: 'seoul', label: '서울' },
      { id: 'gyeonggi', label: '경기·인천' },
      { id: 'gangwon', label: '강원' },
      { id: 'chungcheong', label: '충청·대전' },
      { id: 'jeolla', label: '전라·광주' },
      { id: 'gyeongbuk', label: '대구·경북' },
      { id: 'gyeongnam', label: '부산·울산·경남' },
      { id: 'jeju', label: '제주' },
    ],
    genders: [
      { id: 'male', label: '남자' },
      { id: 'female', label: '여자' },
    ],
    ages: [
      { id: '20', label: '20대' },
      { id: '30', label: '30대' },
      { id: '40', label: '40대 이상' },
    ],
    prices: [
      { id: 'p5', label: '~5만원', max: 5 },
      { id: 'p10', label: '~10만원', max: 10 },
      { id: 'p15', label: '~15만원', max: 15 },
      { id: 'p20', label: '~20만원', max: 20 },
      { id: 'p20plus', label: '20만원 이상', max: 999 },
    ],
    contentStyles: [
      { id: 'mukbang', label: '먹방형' },
      { id: 'emotional', label: '감성리뷰형' },
      { id: 'info', label: '정보전달형' },
      { id: 'vlog', label: '브이로그형' },
    ],
    // 얼굴 노출 여부 (단일 선택). 등록 구글폼에도 동일 항목 추가 필요.
    faces: [
      { id: 'shown', label: '노출' },
      { id: 'hidden', label: '비노출' },
    ],
  };

  const REGION_LABEL = Object.fromEntries(FILTERS.regions.map((r) => [r.id, r.label]));
  const PRICE_LABEL = Object.fromEntries(FILTERS.prices.map((p) => [p.id, p.label]));
  const CONTENT_LABEL = Object.fromEntries(FILTERS.contentStyles.map((c) => [c.id, c.label]));

  /* ---- 프로필 사진: 실제 사진이 없을 때 채널 이니셜 아바타(SVG data URI) ----
     시트에 photo URL 이 있으면 그걸 쓰고, 없으면 이 아바타로 자동 대체한다. */
  const AVATAR_GRADIENTS = [
    ['#F58529', '#DD2A7B'], ['#DD2A7B', '#8134AF'], ['#25F4EE', '#FE2C55'],
    ['#FF0000', '#FF7A45'], ['#8134AF', '#25F4EE'], ['#FE2C55', '#F58529'],
  ];
  function initialAvatar(name, i) {
    const [c1, c2] = AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length];
    const ch = (name || '?').trim().charAt(0);
    const svg =
      `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>` +
      `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
      `<stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/>` +
      `</linearGradient></defs>` +
      `<rect width='200' height='200' fill='url(#g)'/>` +
      `<text x='100' y='100' font-family='Pretendard, sans-serif' font-size='96' ` +
      `font-weight='800' fill='#fff' text-anchor='middle' dominant-baseline='central'>${ch}</text>` +
      `</svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  /* ---- MOCK 인플루언서 (시트 준비 전 폴백/데모용) ----
     연락처는 데이터에도 담지 않는다. avgViews/subscribers 단위: 명/회.
     youtube/tiktok 링크가 '' 이면 "없음"으로 간주해 카드에서 아이콘 미노출. */
  const MOCK_INFLUENCERS = [
    { name: '서울먹깨비', handle: '@seoul_mukkebi', region: 'seoul', gender: 'female', age: '20', price: 'p10', style: 'mukbang', face: 'shown',
      followers: 82000, avgViews: 45000, lastUpload: '2026-07-21',
      instagram: 'https://instagram.com/', youtube: 'https://youtube.com/', tiktok: '' },
    { name: '한입감성_리나', handle: '@hanip_rina', region: 'seoul', gender: 'female', age: '30', price: 'p15', style: 'emotional', face: 'hidden',
      followers: 51000, avgViews: 22000, lastUpload: '2026-07-18',
      instagram: 'https://instagram.com/', youtube: '', tiktok: 'https://tiktok.com/' },
    { name: '경기맛집대장', handle: '@gg_matjip', region: 'gyeonggi', gender: 'male', age: '30', price: 'p5', style: 'info', face: 'shown',
      followers: 34000, avgViews: 12000, lastUpload: '2026-07-24',
      instagram: 'https://instagram.com/', youtube: 'https://youtube.com/', tiktok: 'https://tiktok.com/' },
    { name: '부산돼지국밥러', handle: '@busan_gukbap', region: 'gyeongnam', gender: 'male', age: '40', price: 'p10', style: 'mukbang', face: 'shown',
      followers: 120000, avgViews: 68000, lastUpload: '2026-07-15',
      instagram: 'https://instagram.com/', youtube: 'https://youtube.com/', tiktok: '' },
    { name: '대구노맛여지', handle: '@daegu_nomat', region: 'gyeongbuk', gender: 'female', age: '20', price: 'p5', style: 'vlog', face: 'hidden',
      followers: 27000, avgViews: 9000, lastUpload: '2026-07-22',
      instagram: 'https://instagram.com/', youtube: '', tiktok: 'https://tiktok.com/' },
    { name: '제주풍미기록', handle: '@jeju_pungmi', region: 'jeju', gender: 'female', age: '30', price: 'p20', style: 'emotional', face: 'hidden',
      followers: 96000, avgViews: 41000, lastUpload: '2026-07-19',
      instagram: 'https://instagram.com/', youtube: 'https://youtube.com/', tiktok: '' },
    { name: '충청맛도리', handle: '@cc_matdori', region: 'chungcheong', gender: 'male', age: '20', price: 'p10', style: 'mukbang', face: 'shown',
      followers: 61000, avgViews: 33000, lastUpload: '2026-07-23',
      instagram: 'https://instagram.com/', youtube: 'https://youtube.com/', tiktok: 'https://tiktok.com/' },
    { name: '전라진미록', handle: '@jl_jinmi', region: 'jeolla', gender: 'male', age: '40', price: 'p15', style: 'info', face: 'shown',
      followers: 45000, avgViews: 19000, lastUpload: '2026-07-12',
      instagram: 'https://instagram.com/', youtube: '', tiktok: '' },
    { name: '강원산골밥상', handle: '@gw_sangol', region: 'gangwon', gender: 'female', age: '40', price: 'p20plus', style: 'vlog', face: 'hidden',
      followers: 210000, avgViews: 95000, lastUpload: '2026-07-20',
      instagram: 'https://instagram.com/', youtube: 'https://youtube.com/', tiktok: '' },
    { name: '서울밤식탐', handle: '@seoul_bam_taste', region: 'seoul', gender: 'male', age: '20', price: 'p20', style: 'mukbang', face: 'shown',
      followers: 138000, avgViews: 72000, lastUpload: '2026-07-25',
      instagram: 'https://instagram.com/', youtube: 'https://youtube.com/', tiktok: 'https://tiktok.com/' },
    { name: '경기감성한상', handle: '@gg_gamsung', region: 'gyeonggi', gender: 'female', age: '30', price: 'p10', style: 'emotional', face: 'hidden',
      followers: 58000, avgViews: 26000, lastUpload: '2026-07-17',
      instagram: 'https://instagram.com/', youtube: '', tiktok: 'https://tiktok.com/' },
    { name: '부산갈맷길미식', handle: '@busan_galmat', region: 'gyeongnam', gender: 'female', age: '30', price: 'p15', style: 'info', face: 'shown',
      followers: 73000, avgViews: 31000, lastUpload: '2026-07-16',
      instagram: 'https://instagram.com/', youtube: 'https://youtube.com/', tiktok: '' },
  ];

  /* ---- MOCK 이벤트 (노출여부 ON 인 행만) ---- */
  // TODO: 실제 구글시트 연동 후 이 더미 데이터 삭제 (SHEET_CONFIG 채우면 시트 데이터로 자동 대체)
  const MOCK_EVENTS = [
    {
      name: '서울밤식탐', handle: '@seoul_bam_taste', region: '서울',
      platforms: ['instagram', 'youtube', 'tiktok'],
      listPrice: 200000, salePrice: 140000, capacity: 5, applied: 2,
      benefits: ['촬영 1회', '우선 노출 2주', '후기 인증'],
      options: [],
      startDate: '2026-07-01', endDate: '2026-07-31', visible: true,
    },
    {
      name: '대구맛집헌터', handle: '@daegu_matjip', region: '대구',
      platforms: ['instagram'],
      listPrice: 150000, salePrice: 100000, capacity: 3, applied: 1,
      benefits: ['촬영 1회', '우선 노출 2주'],
      options: [],
      startDate: '2026-07-01', endDate: '2026-07-31', visible: true,
    },
  ];

  // 이달의 무료광고 크리에이터 (교육 수료·촬영 준비 완료 신규 크리에이터) — 더미
  // TODO: 실제 데이터 소스 연동 시 교체
  const MOCK_FREEAD = [
    { name: '대구감성밥상', handle: '@daegu_gamsung', region: '대구', course: true,
      followers: 320, avgViews: 600, lastUpload: '2026-07-27',
      instagram: 'https://instagram.com/', youtube: '', tiktok: 'https://tiktok.com/' },
    { name: '수성구먹킷', handle: '@suseong_meokkit', region: '대구', course: true,
      followers: 540, avgViews: 900, lastUpload: '2026-07-28',
      instagram: 'https://instagram.com/', youtube: 'https://youtube.com/', tiktok: '' },
  ];

  // 신규 크리에이터 프로그램 카드 (이벤트 카드와 동일 컴포넌트로 렌더) — 더미
  const MOCK_NEWCREATORS = [
    { name: '이달의 탄생 크리에이터', handle: '@맛간다_수료생', region: '대구',
      platforms: ['instagram', 'tiktok'], priceLabel: '0원',
      badges: ['신입', '교육 수료'], note: '“맛간다 챌린지” 수료생 · 대구 한정 · 9월 오픈 예정',
      capacity: 5, applied: 1, photo: '' },
    { name: '신규 성장 계정', handle: '@신규_성장계정', region: '전국',
      platforms: ['instagram', 'youtube', 'tiktok'], priceLabel: '3만원',
      badges: ['신입'], note: '업로드 10개 미만 · 우리 지역 매칭 시',
      capacity: 10, applied: 4, photo: '' },
  ];

  // TODO: 실제 구글시트 연동 후 이 더미 데이터 삭제
  const MOCK_GROWING = [
    { name: '부산먹부림일기', handle: '@busan_meokburim', region: 'gyeongnam', gender: 'male', age: '20', price: 'p5', style: 'mukbang', face: 'shown',
      followers: 800, avgViews: 1500, lastUpload: '2026-07-24',
      instagram: 'https://instagram.com/', youtube: '', tiktok: 'https://tiktok.com/' },
    { name: '인천맛집스타그램', handle: '@incheon_matjip', region: 'gyeonggi', gender: 'female', age: '20', price: 'p5', style: 'emotional', face: 'hidden',
      followers: 1200, avgViews: 2000, lastUpload: '2026-07-26',
      instagram: 'https://instagram.com/', youtube: '', tiktok: '' },
    { name: '광주먹킷리스트', handle: '@gwangju_meok', region: 'jeolla', gender: 'female', age: '30', price: 'p5', style: 'vlog', face: 'shown',
      followers: 500, avgViews: 900, lastUpload: '2026-07-22',
      instagram: 'https://instagram.com/', youtube: 'https://youtube.com/', tiktok: '' },
  ];

  /* ---- MOCK 지표(운영이 입력하는 진행중 업체 수 등) ---- */
  const MOCK_METRICS_EXTRA = {
    activeStores: 18,      // 진행중인 업체 수 (운영 입력)
    cumulativeMatches: 264, // 누적 매칭 건수 (운영 입력/집계)
  };

  /* ---- 한글 지역명 → 필터 region id (인플루언서 카드 필터 매칭용) ---- */
  const REGION_FROM_KO = {
    '서울': 'seoul',
    '인천': 'gyeonggi', '경기': 'gyeonggi',
    '강원': 'gangwon',
    '대전': 'chungcheong', '세종': 'chungcheong', '충북': 'chungcheong', '충남': 'chungcheong', '충청': 'chungcheong',
    '대구': 'gyeongbuk', '경북': 'gyeongbuk',
    '부산': 'gyeongnam', '울산': 'gyeongnam', '경남': 'gyeongnam',
    '광주': 'jeolla', '전북': 'jeolla', '전남': 'jeolla', '전라': 'jeolla',
    '제주': 'jeju',
  };
  function toRegionId(v) {
    const s = String(v || '').trim();
    if (!s) return '';
    if (REGION_LABEL[s]) return s;                        // 이미 id
    if (REGION_FROM_KO[s]) return REGION_FROM_KO[s];      // 정확 일치
    const hit = Object.keys(REGION_FROM_KO).find((k) => s.includes(k)); // 부분 포함
    return hit ? REGION_FROM_KO[hit] : s;
  }

  /* ---- 값 정규화 (시트의 한글/변형 값 → 내부 id) ---- */
  function normGender(v) { const s = String(v || ''); if (/남/.test(s) || /male/i.test(s)) return 'male'; if (/여/.test(s) || /female/i.test(s)) return 'female'; return ''; }
  function normAge(v) { const s = String(v || ''); if (s.includes('40')) return '40'; if (s.includes('30')) return '30'; if (s.includes('20')) return '20'; return ''; }
  function normStyle(v) { const s = String(v || ''); if (/먹방|mukbang/i.test(s)) return 'mukbang'; if (/감성|emotion/i.test(s)) return 'emotional'; if (/정보|info/i.test(s)) return 'info'; if (/브이로그|vlog/i.test(s)) return 'vlog'; return s; }
  function normFace(v) { const s = String(v || ''); if (/비노출|비공개|hidden|no/i.test(s)) return 'hidden'; if (/노출|공개|shown|yes/i.test(s)) return 'shown'; return ''; }
  function normPrice(v) {
    const s = String(v || '');
    if (/^p\d/.test(s)) return s;                 // 이미 id
    if (/이상|20\s*만.*이상/.test(s)) return 'p20plus';
    if (s.includes('20')) return 'p20';
    if (s.includes('15')) return 'p15';
    if (s.includes('10')) return 'p10';
    if (s.includes('5')) return 'p5';
    return '';
  }

  /* ---- 프로필 이미지: http면 그대로, 구글드라이브 파일ID면 표시용 URL, 없으면 아바타 ---- */
  function resolveImage(val, name, i) {
    const s = String(val || '').trim();
    if (!s) return initialAvatar(name, i);
    if (/^https?:\/\//i.test(s)) return s;
    return 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(s) + '&sz=w600';
  }

  function pick(r, keys) { for (const k of keys) { if (r[k] !== undefined && String(r[k]).trim() !== '') return r[k]; } return ''; }
  function toInt(v) { return Number(String(v == null ? '' : v).replace(/[^0-9]/g, '') || 0); }
  function fmtDate(v) {
    const s = String(v || '').trim();
    if (!s) return '';
    const d = new Date(s);
    if (isNaN(d.getTime())) return s.slice(0, 10);
    // KST 기준 YYYY.MM.DD
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d).replace(/-/g, '.');
  }
  function detectPlatforms(tokens) {
    const s = tokens.join(' ');
    const out = [];
    if (/인스타|instagram|릴스|reels/i.test(s)) out.push('instagram');
    if (/유튜브|youtube|쇼츠|shorts/i.test(s)) out.push('youtube');
    if (/틱톡|tiktok/i.test(s)) out.push('tiktok');
    return out;
  }

  /* ---- API fetch (Apps Script 웹앱 JSON) ---- */
  async function fetchJson(url) {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('배열 응답이 아님');
    return data;
  }

  /* ---- 공개 API ---- */
  async function loadInfluencers() {
    let rows;
    if (ENV.influencersApi) {
      try { rows = (await fetchJson(ENV.influencersApi)).map(mapApiInfluencer); }
      catch (e) { console.warn('[mag] 인플루언서 API 실패 → 빈 상태', e); return []; }
    } else {
      rows = MOCK_INFLUENCERS; // ENV 없음(로컬) 전용 폴백
    }
    rows = rows.filter((r) => r._approved !== false); // 승인여부 컬럼 있을 때만 O 필터
    return rows.map((r, i) => ({
      ...r,
      photo: resolveImage(r.photo, r.name, i),
      hasYoutube: !!(r.youtube && r.youtube !== '없음'),
      hasTiktok: !!(r.tiktok && r.tiktok !== '없음'),
    }));
  }

  function mapApiInfluencer(r) {
    const approvedRaw = pick(r, ['승인여부', '승인']);
    return {
      name: pick(r, ['채널명', '인플루언서명', '이름']),
      handle: pick(r, ['아이디', '계정아이디', '핸들']),
      region: toRegionId(pick(r, ['지역'])),
      gender: normGender(pick(r, ['성별', '스타일'])),
      age: normAge(pick(r, ['연령대', '나이'])),
      price: normPrice(pick(r, ['희망가격대', '희망 가격대', '가격대'])),
      style: normStyle(pick(r, ['콘텐츠스타일', '콘텐츠 스타일', '스타일'])),
      face: normFace(pick(r, ['얼굴노출여부', '얼굴 노출 여부', '얼굴노출'])),
      followers: toInt(pick(r, ['팔로워수', '구독자수', '팔로워'])),
      avgViews: toInt(pick(r, ['평균조회수', '평균 조회수'])),
      lastUpload: pick(r, ['최근업로드일자', '최근 업로드', '최근업로드']),
      instagram: pick(r, ['인스타', '인스타그램', '인스타링크', '인스타 링크']),
      youtube: pick(r, ['유튜브', '유튜브링크', '유튜브 링크']),
      tiktok: pick(r, ['틱톡', '틱톡링크', '틱톡 링크']),
      photo: pick(r, ['프로필사진URL', '프로필사진', '프로필이미지URL']),
      _approved: approvedRaw === '' ? true : String(approvedRaw).trim().toUpperCase() === 'O',
    };
  }

  async function loadEvents() {
    let rows;
    if (ENV.eventsApi) {
      try {
        rows = (await fetchJson(ENV.eventsApi))
          .filter((r) => String(pick(r, ['노출여부'])).trim().toUpperCase() === 'ON')
          .map(mapApiEvent);
      } catch (e) { console.warn('[mag] 이벤트 API 실패 → 빈 상태', e); return []; }
    } else {
      rows = MOCK_EVENTS.filter((e) => e.visible);
    }
    return rows.map((e, i) => ({ ...e, platforms: e.platforms || [], photo: resolveImage(e.photo, e.name, i) }));
  }

  function mapApiEvent(r) {
    const benefits = String(pick(r, ['혜택목록', '혜택 목록', '혜택'])).split(/[,·\n/]/).map((s) => s.trim()).filter(Boolean);
    return {
      name: pick(r, ['인플루언서명', '채널명', '이름']),
      handle: pick(r, ['아이디', '계정아이디', '핸들']),
      region: String(pick(r, ['지역'])).trim(),
      platforms: detectPlatforms(benefits.concat([String(pick(r, ['활동채널']))])),
      listPrice: toInt(pick(r, ['정가'])),
      salePrice: toInt(pick(r, ['할인가'])),
      capacity: toInt(pick(r, ['정원'])),
      applied: toInt(pick(r, ['현재신청건수', '현재 신청건수'])),
      benefits: benefits,
      options: [],
      startDate: fmtDate(pick(r, ['시작일'])),
      endDate: fmtDate(pick(r, ['종료일'])),
      photo: pick(r, ['프로필이미지URL', '프로필사진URL', '프로필이미지']),
    };
  }

  async function loadGrowing() {
    // 신규 성장 계정도 인플루언서와 동일 구조 → 아바타/플랫폼 여부 데코레이션
    return MOCK_GROWING.map((r, i) => ({
      ...r,
      growing: true,
      photo: r.photo || initialAvatar(r.name, i + 3),
      hasYoutube: !!(r.youtube && r.youtube !== '없음'),
      hasTiktok: !!(r.tiktok && r.tiktok !== '없음'),
    }));
  }

  async function loadFreead() {
    return MOCK_FREEAD.map((r, i) => ({
      ...r,
      photo: resolveImage(r.photo, r.name, i + 7),
      hasYoutube: !!(r.youtube && r.youtube !== '없음'),
      hasTiktok: !!(r.tiktok && r.tiktok !== '없음'),
    }));
  }

  async function loadNewcreators() {
    return MOCK_NEWCREATORS.map((r, i) => ({ ...r, photo: resolveImage(r.photo, r.name, i + 9) }));
  }

  window.MAG_DATA = {
    FILTERS,
    REGION_LABEL,
    PRICE_LABEL,
    CONTENT_LABEL,
    MOCK_METRICS_EXTRA,
    loadInfluencers,
    loadEvents,
    loadGrowing,
    loadFreead,
    loadNewcreators,
    // 이미지 로드 실패 시 대체 아바타 생성 (예: 비공개 드라이브 이미지)
    avatar: (name) => initialAvatar(name || '?', 0),
  };
})();
