(() => {
  'use strict';

  const D = window.MAG_DATA;

  /* =======================================================
     외부 링크 / 폼 설정 — 확정되면 여기만 바꾸면 됨
     ======================================================= */
  const ENV = window.MAG_ENV || {}; // .env → js/config.js
  const LINKS = {
    hub: '',                              // 와이비 허브 URL (신뢰섹션·푸터 '맛집감별사 더 알아보기')
    tcl: 'https://www.tigercommercelab.com/', // 타이거커머스랩 URL
    kakao: '',                            // 카카오톡 오픈채팅 URL
    influencerForm: ENV.influencerForm || '', // 인플루언서 등록(입점 신청) 폼 — .env
    instagram: '',
    youtube: '',
    tiktok: '',
  };
  // 문의 폼 → 구글폼 연동 (준비되면 채우기). 비어 있으면 로컬 확인 메시지로 폴백.
  const CONTACT_FORM = {
    action: '', // 예: https://docs.google.com/forms/d/e/XXXX/formResponse
    fields: {
      inquiryType: '', storeName: '', phone: '', area: '', channelWanted: '',
      budget: '', menu: '', story: '', notes: '', reuse: '',
    },
  };

  /* 광고/이벤트 문의 프리필 구조 (11번 요구사항)
     - 지금: 온페이지 문의폼으로 이동 + 문의유형/희망 채널명 자동 입력하고,
       주소창에 ?channel=..&type=.. 를 반영(공유·딥링크 대비 더미 구조).
     - 나중: 실제 구글폼 완성 시 INQUIRY_PREFILL.googleForm + entries 를 채우면
       자동으로 구글폼 사전입력 URL(새 탭)로 전환된다. */
  const INQUIRY_PREFILL = {
    googleForm: ENV.contactForm || '',      // 매장 문의폼 base — .env
    entries: {
      channel: ENV.contactEntryChannel ? 'entry.' + ENV.contactEntryChannel : '', // 관심채널명
      type: ENV.contactEntryType ? 'entry.' + ENV.contactEntryType : '',          // 문의유형
    },
  };
  function buildInquiryUrl(channel, type) {
    const p = new URLSearchParams();
    if (channel) p.set('channel', channel);
    if (type) p.set('type', type);
    return '/inquiry?' + p.toString(); // 실제 문의 엔드포인트가 생기면 이 형태로 연결
  }
  function prefillContact(channel, type) {
    if (type) { const r = document.querySelector(`input[name="inquiryType"][value="${type}"]`); if (r) r.checked = true; }
    const ch = document.getElementById('channelWanted');
    if (ch && channel) ch.value = channel;
  }
  function openInquiry(channel, type) {
    // 상세 패널이 열려 있으면 닫는다(외부 폼 새 탭/온페이지 이동 공통)
    const rep = document.getElementById('report');
    if (rep && rep.classList.contains('is-open') && typeof closeReport === 'function') closeReport();

    if (INQUIRY_PREFILL.googleForm && INQUIRY_PREFILL.entries.channel) {
      // 구글폼 사전입력 URL: [viewform]?usp=pp_url&entry.<유형>=..&entry.<채널>=..
      const p = new URLSearchParams();
      p.set('usp', 'pp_url');
      if (INQUIRY_PREFILL.entries.type && type) p.set(INQUIRY_PREFILL.entries.type, type);
      if (channel) p.set(INQUIRY_PREFILL.entries.channel, channel);
      window.open(INQUIRY_PREFILL.googleForm + '?' + p.toString(), '_blank', 'noopener');
      return;
    }
    prefillContact(channel, type);
    // 주소창에 더미 쿼리 반영(현재 경로 유지 → 새로고침 안전). buildInquiryUrl 은 실제 폼용.
    try {
      const p = new URLSearchParams();
      if (channel) p.set('channel', channel);
      if (type) p.set('type', type);
      history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p.toString() : ''));
    } catch (_) {}
    scrollToId('contact');
  }

  /* ---------- 플랫폼 아이콘(SVG) ---------- */
  const ICONS = {
    instagram: `<svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="igG" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#F58529"/><stop offset=".5" stop-color="#DD2A7B"/><stop offset="1" stop-color="#8134AF"/></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="6" fill="url(#igG)"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" stroke-width="1.7"/><circle cx="17.2" cy="6.8" r="1.2" fill="#fff"/></svg>`,
    youtube: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="4.5" fill="#FF0000"/><path d="M10 8.8v6.4l5.4-3.2z" fill="#fff"/></svg>`,
    tiktok: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.2 3h2.5c.2 1.6 1.1 3 2.9 3.4v2.5c-1.1 0-2.1-.3-3-.9v5.7a5.2 5.2 0 1 1-5.2-5.2c.3 0 .5 0 .8.1v2.6a2.6 2.6 0 1 0 1.8 2.5V3z" fill="#111"/><path d="M14.8 3h2.5c.2 1.6 1.1 3 2.9 3.4v2.5c-1.1 0-2.1-.3-3-.9v5.7a5.2 5.2 0 1 1-5.2-5.2c.3 0 .5 0 .8.1v2.6a2.6 2.6 0 1 0 1.8 2.5V3z" fill="#25F4EE" opacity=".6" transform="translate(-.6 .5)"/></svg>`,
  };

  /* ---------- 연도 ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- 외부 링크 적용 ---------- */
  function applyLink(id, url) {
    const el = document.getElementById(id);
    if (el && url) el.href = url;
  }
  applyLink('founderHubLink', LINKS.hub);
  applyLink('footerHub', LINKS.hub);
  applyLink('tclLink', LINKS.tcl);
  applyLink('footerTcl', LINKS.tcl);
  applyLink('kakaoLink', LINKS.kakao);
  applyLink('joinFormLink', LINKS.influencerForm);
  // 동의 체크박스 라벨 안의 '개인정보처리방침' 링크 클릭이 체크박스를 토글하지 않도록
  document.querySelectorAll('.form-privacy a').forEach((a) => a.addEventListener('click', (e) => e.stopPropagation()));

  /* ---------- 문의 유형 프리셋 버튼 ([data-inquiry] → 문의폼으로 이동 + 유형 선택) ---------- */
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-inquiry]');
    if (!t) return;
    e.preventDefault();
    openInquiry(t.getAttribute('data-channel') || '', t.getAttribute('data-inquiry'));
  });

  /* 딥링크: ?channel=..&type=.. 로 들어오면 문의폼 자동 프리필 */
  (function initFromQuery() {
    const q = new URLSearchParams(location.search);
    const ch = q.get('channel'); const ty = q.get('type');
    if (ch || ty) window.addEventListener('load', () => prefillContact(ch, ty));
  })();

  /* ---------- Footer SNS ---------- */
  const footerSns = document.getElementById('footerSns');
  if (footerSns) {
    [['instagram', LINKS.instagram], ['youtube', LINKS.youtube], ['tiktok', LINKS.tiktok]].forEach(([k, url]) => {
      const a = document.createElement('a');
      a.href = url || '#';
      a.target = '_blank'; a.rel = 'noopener';
      a.setAttribute('aria-label', k);
      a.innerHTML = ICONS[k];
      footerSns.appendChild(a);
    });
  }

  /* ---------- 헤더 스크롤 + 진행바 ---------- */
  const header = document.getElementById('siteHeader');
  const progress = document.getElementById('scrollProgress');
  function vh() { return document.documentElement.clientHeight || window.innerHeight; }
  function onScroll() {
    const st = window.scrollY || document.documentElement.scrollTop;
    if (header) header.classList.toggle('is-scrolled', st > 20);
    if (progress) {
      const docH = document.documentElement.scrollHeight - vh();
      progress.style.width = (docH > 0 ? (st / docH) * 100 : 0) + '%';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 스크롤 이동 ---------- */
  function scrollToId(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-scroll-to]');
    if (t) { e.preventDefault(); scrollToId(t.getAttribute('data-scroll-to')); }
  });

  /* ---------- 사이드 내비 활성점 ---------- */
  const dots = document.querySelectorAll('.side-nav-dot');
  const navSections = [...dots].map((d) => document.getElementById(d.getAttribute('data-target'))).filter(Boolean);
  if (dots.length && navSections.length) {
    const nav = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) dots.forEach((d) => d.classList.toggle('is-active', d.getAttribute('data-target') === en.target.id));
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    navSections.forEach((s) => nav.observe(s));
  }

  /* ---------- 스크롤 리빌 ---------- */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function revealAll() { document.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => el.classList.add('is-visible')); }
  let revealObs = null;
  if ('IntersectionObserver' in window && !prefersReduced) {
    revealObs = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); revealObs.unobserve(en.target); }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
  }
  function observeReveals(root = document) {
    if (!revealObs) { revealAll(); return; }
    root.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => revealObs.observe(el));
  }
  observeReveals();
  // 안전장치: 어떤 이유로든 관찰자가 동작하지 않아도 콘텐츠가 영구히 숨지 않도록,
  // 페이지 로드 후에도 여전히 숨겨진 요소가 화면 안(또는 위)에 있으면 강제로 노출한다.
  window.addEventListener('load', () => {
    window.setTimeout(() => {
      document.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight * 1.1) el.classList.add('is-visible');
      });
      document.querySelectorAll('.reveal-card:not(.is-in)').forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight * 1.1) el.classList.add('is-in');
      });
    }, 400);
  });

  /* ---------- 카운트업 ---------- */
  function countUp(el, target, { duration = 1400, delay = 0 } = {}) {
    window.setTimeout(() => {
      const start = performance.now();
      (function tick(now) {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * target).toLocaleString('ko-KR');
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = target.toLocaleString('ko-KR');
      })(start);
    }, delay);
  }

  /* ---------- 카드 숫자 카운트업 (.count-num[data-count-to], data-format="comma", data-suffix) ---------- */
  function setNumFinal(el) {
    const to = parseFloat(el.getAttribute('data-count-to')) || 0;
    const fmt = el.getAttribute('data-format');
    const suffix = el.getAttribute('data-suffix') || '';
    el.textContent = (fmt === 'comma' ? to.toLocaleString('ko-KR') : String(to)) + suffix;
  }
  function animateNum(el) {
    const to = parseFloat(el.getAttribute('data-count-to')) || 0;
    const fmt = el.getAttribute('data-format');
    const suffix = el.getAttribute('data-suffix') || '';
    const dur = 1100; const start = performance.now();
    (function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      const v = Math.round(to * e);
      el.textContent = (fmt === 'comma' ? v.toLocaleString('ko-KR') : String(v)) + suffix;
      if (p < 1) requestAnimationFrame(tick); else setNumFinal(el);
    })(start);
  }
  function observeCardCountUp(root) {
    const nums = root.querySelectorAll('.count-num');
    if (!nums.length) return;
    // 안전: 먼저 최종값을 넣어 관찰자가 동작하지 않아도 숫자가 0으로 남지 않게 한다.
    nums.forEach(setNumFinal);
    if (!('IntersectionObserver' in window) || prefersReduced) return;
    const obs = new IntersectionObserver((ents) => {
      ents.forEach((en) => { if (en.isIntersecting) { obs.unobserve(en.target); animateNum(en.target); } });
    }, { threshold: 0.6 });
    nums.forEach((n) => obs.observe(n));
  }

  /* ---------- 카드 순차 페이드인 (.reveal-card) ---------- */
  function revealCards(root) {
    const cards = [...root.querySelectorAll('.reveal-card')];
    if (!cards.length) return;
    if (!('IntersectionObserver' in window) || prefersReduced) { cards.forEach((c) => c.classList.add('is-in')); return; }
    const obs = new IntersectionObserver((ents) => {
      ents.forEach((en) => {
        if (!en.isIntersecting) return;
        const i = Math.max(0, cards.indexOf(en.target));
        window.setTimeout(() => en.target.classList.add('is-in'), (i % 6) * 80);
        obs.unobserve(en.target);
      });
    }, { threshold: 0.12 });
    cards.forEach((c) => obs.observe(c));
    // 안전장치: 관찰자가 어떤 이유로든 동작하지 않아도 카드가 영구히 숨지 않도록 보장
    window.setTimeout(() => cards.forEach((c) => c.classList.add('is-in')), 1600);
  }

  /* =======================================================
     필터 칩 렌더 + 상태
     ======================================================= */
  const state = { region: new Set(), gender: new Set(), age: new Set(), price: new Set(), style: new Set(), face: new Set() };

  function renderChips(containerId, items, key, single) {
    const box = document.getElementById(containerId);
    if (!box) return;
    items.forEach((it) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'fchip';
      b.textContent = it.label;
      b.dataset.value = it.id;
      b.addEventListener('click', () => {
        const on = state[key].has(it.id);
        if (single) {
          state[key].clear();
          box.querySelectorAll('.fchip.is-on').forEach((c) => c.classList.remove('is-on'));
          if (!on) { state[key].add(it.id); b.classList.add('is-on'); } // 같은 칩 재클릭 시 해제
        } else {
          if (on) state[key].delete(it.id); else state[key].add(it.id);
          b.classList.toggle('is-on', !on);
        }
        if (key === 'region') syncMapFromState();
      });
      box.appendChild(b);
    });
  }
  renderChips('regionChips', D.FILTERS.regions, 'region');
  renderChips('genderChips', D.FILTERS.genders, 'gender');
  renderChips('ageChips', D.FILTERS.ages, 'age');
  renderChips('priceChips', D.FILTERS.prices, 'price');
  renderChips('styleChips', D.FILTERS.contentStyles, 'style');
  renderChips('faceChips', D.FILTERS.faces, 'face', true);

  /* ---------- 지도 ↔ 지역칩 동기화 ---------- */
  const mapRegions = document.querySelectorAll('.korea-map [data-region]');
  // 같은 region(그룹)에 속한 여러 시/도 path 를 함께 다루기 위한 헬퍼
  function groupEls(id) { return [...mapRegions].filter((el) => el.getAttribute('data-region') === id); }
  mapRegions.forEach((r) => {
    const id = r.getAttribute('data-region');
    r.addEventListener('click', () => {
      const on = state.region.has(id);
      if (on) state.region.delete(id); else state.region.add(id);
      syncChipsFromState();
      syncMapFromState();
    });
    // 한 시/도에 호버하면 같은 지역 그룹 전체가 함께 강조된다
    r.addEventListener('mouseenter', () => groupEls(id).forEach((el) => el.classList.add('is-hover')));
    r.addEventListener('mouseleave', () => groupEls(id).forEach((el) => el.classList.remove('is-hover')));
  });
  function syncMapFromState() {
    mapRegions.forEach((r) => r.classList.toggle('is-active', state.region.has(r.getAttribute('data-region'))));
  }
  function syncChipsFromState() {
    document.querySelectorAll('#regionChips .fchip').forEach((c) => c.classList.toggle('is-on', state.region.has(c.dataset.value)));
  }

  /* ---------- 초기화 ---------- */
  document.getElementById('filterReset').addEventListener('click', () => {
    Object.values(state).forEach((s) => s.clear());
    document.querySelectorAll('.fchip.is-on').forEach((c) => c.classList.remove('is-on'));
    syncMapFromState();
    const results = document.getElementById('results');
    if (results) results.hidden = true;
  });

  /* =======================================================
     인플루언서 로드 + 조회
     ======================================================= */
  let INFLUENCERS = [];
  const priceMaxById = Object.fromEntries(D.FILTERS.prices.map((p) => [p.id, p.max]));

  function matches(inf) {
    if (state.region.size && !state.region.has(inf.region)) return false;
    if (state.gender.size && !state.gender.has(inf.gender)) return false;
    if (state.age.size && !state.age.has(inf.age)) return false;
    if (state.style.size && !state.style.has(inf.style)) return false;
    if (state.face.size && !state.face.has(inf.face)) return false;
    if (state.price.size) {
      // 선택한 예산 상한 중 가장 큰 값 이내면 통과 ("~10만원" = 10만원까지 예산)
      const budgetMax = Math.max(...[...state.price].map((id) => priceMaxById[id] || 0));
      if ((priceMaxById[inf.price] || 999) > budgetMax) return false;
    }
    return true;
  }

  function fmtNum(n) {
    if (n >= 10000) return (n / 10000).toFixed(n % 10000 === 0 ? 0 : 1) + '만';
    return Number(n).toLocaleString('ko-KR'); // 1만 미만은 정확한 숫자로(예: 1,200 / 800)
  }
  function daysAgo(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (diff <= 0) return '오늘';
    if (diff < 7) return diff + '일 전';
    if (diff < 30) return Math.floor(diff / 7) + '주 전';
    return Math.floor(diff / 30) + '개월 전';
  }

  function platformIconsHtml(inf) {
    let html = '';
    if (inf.hasInstagram !== false && inf.instagram) html += `<span class="rc-plat" title="인스타그램">${ICONS.instagram}</span>`;
    if (inf.hasYoutube) html += `<span class="rc-plat" title="유튜브">${ICONS.youtube}</span>`;
    if (inf.hasTiktok) html += `<span class="rc-plat" title="틱톡">${ICONS.tiktok}</span>`;
    return html;
  }

  // 결과/성장 공용 프로필 카드 (클릭 시 상세 리포트)
  function makeProfileCard(inf, opts = {}) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'result-card' + (opts.growing ? ' growing-card' : '');
    const badge = opts.growing
      ? '<span class="rc-new">NEW · 신입 · 성장중</span>'
      : '<span class="rc-verified">✔ 실제 활동 확인된 채널</span>';
    card.innerHTML = `
      <div class="rc-top">
        <img class="rc-avatar" src="${inf.photo}" alt="${inf.name} 프로필" loading="lazy" onerror="this.onerror=null;this.src=window.MAG_DATA.avatar(this.alt)">
        <div>
          <div class="rc-name">${inf.name}</div>
          <div class="rc-handle">${inf.handle || ''}</div>
          <div class="rc-meta">${D.REGION_LABEL[inf.region] || inf.region} · ${inf.age}대 · 팔로워 ${fmtNum(inf.followers)}</div>
        </div>
      </div>
      ${badge}
      <div class="rc-stats">
        <div class="rc-stat"><b>${fmtNum(inf.avgViews)}</b><span>평균 조회수</span></div>
        <div class="rc-stat"><b>${daysAgo(inf.lastUpload)}</b><span>최근 업로드</span></div>
        <div class="rc-platforms">${platformIconsHtml(inf)}</div>
        <span class="rc-open">리포트 ›</span>
      </div>`;
    card.addEventListener('click', () => openReport(inf));
    return card;
  }

  const resultsEl = document.getElementById('results');
  const gridEl = document.getElementById('resultGrid');
  const countEl = document.getElementById('resultsCount');
  const emptyEl = document.getElementById('resultsEmpty');

  function runSearch() {
    const list = INFLUENCERS.filter(matches);
    resultsEl.hidden = false;
    gridEl.innerHTML = '';
    countEl.textContent = `조건에 맞는 채널 ${list.length}곳을 찾았어요`;
    emptyEl.hidden = list.length > 0;

    list.forEach((inf, i) => {
      const card = makeProfileCard(inf);
      gridEl.appendChild(card);
      // 구름 위로 떠오르듯 순차 페이드인
      window.setTimeout(() => card.classList.add('is-floated'), 80 + i * 90);
    });

    // 결과로 부드럽게 스크롤
    window.setTimeout(() => resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
  }

  document.getElementById('filterForm').addEventListener('submit', (e) => { e.preventDefault(); runSearch(); });

  /* =======================================================
     사이드 리포트
     ======================================================= */
  const report = document.getElementById('report');
  const reportOverlay = document.getElementById('reportOverlay');
  const reportBody = document.getElementById('reportBody');

  function reportLink(kind, url, label, cls) {
    if (!url || url === '없음') return '';
    return `<a class="report-link ${cls}" href="${url}" target="_blank" rel="noopener">${ICONS[kind]}<span>${label}</span><span class="rl-arrow" aria-hidden="true">→</span></a>`;
  }

  function openReport(inf) {
    const platformLinks = [
      reportLink('youtube', inf.hasYoutube ? inf.youtube : '', '유튜브 채널 보기', 'report-link-yt'),
      reportLink('tiktok', inf.hasTiktok ? inf.tiktok : '', '틱톡 채널 보기', 'report-link-tk'),
    ].filter(Boolean).join('');

    reportBody.innerHTML = `
      <div class="report-hero">
        <img class="report-avatar" src="${inf.photo}" alt="${inf.name} 프로필" onerror="this.onerror=null;this.src=window.MAG_DATA.avatar(this.alt)">
        <div class="report-name" id="reportName">${inf.name}</div>
        <div class="report-tags">
          <span class="report-tag">${D.REGION_LABEL[inf.region] || inf.region}</span>
          <span class="report-tag">${inf.gender === 'male' ? '남자' : '여자'} · ${inf.age}대</span>
          <span class="report-tag">${D.CONTENT_LABEL[inf.style] || ''}</span>
          <span class="report-tag">${D.PRICE_LABEL[inf.price] || ''}</span>
        </div>
      </div>
      <div class="report-stats">
        <div class="report-stat"><b>${fmtNum(inf.followers)}</b><span>구독자수</span></div>
        <div class="report-stat"><b>${fmtNum(inf.avgViews)}</b><span>평균 조회수</span></div>
        <div class="report-stat"><b>${daysAgo(inf.lastUpload)}</b><span>최근 업로드</span></div>
      </div>
      ${platformLinks ? `<p class="report-section-title">함께 운영하는 채널</p><div class="report-links">${platformLinks}</div>` : ''}
      <button class="report-inquiry" data-inquiry="채널 매칭 문의" data-channel="${inf.name}">이 채널로 광고 문의하기</button>
      <a class="report-browse" href="${inf.instagram || '#'}" target="_blank" rel="noopener">둘러보기 (인스타그램) →</a>
      <p class="report-note">연락처는 공개되지 않아요. 매칭은 맛집감별사가 대신 연결해 드립니다.</p>`;

    report.classList.add('is-open');
    report.setAttribute('aria-hidden', 'false');
    reportOverlay.hidden = false;
    requestAnimationFrame(() => reportOverlay.classList.add('is-open'));
    document.body.style.overflow = 'hidden';
  }
  function closeReport() {
    report.classList.remove('is-open');
    report.setAttribute('aria-hidden', 'true');
    reportOverlay.classList.remove('is-open');
    window.setTimeout(() => { reportOverlay.hidden = true; }, 300);
    document.body.style.overflow = '';
  }
  document.getElementById('reportClose').addEventListener('click', closeReport);
  reportOverlay.addEventListener('click', closeReport);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && report.classList.contains('is-open')) closeReport(); });

  /* =======================================================
     지표 카운트업
     ======================================================= */
  function initMetrics() {
    const ex = D.MOCK_METRICS_EXTRA;
    const values = {
      mMatches: ex.cumulativeMatches,
      mInfluencers: INFLUENCERS.length,
      mStores: ex.activeStores,
    };
    const grid = document.getElementById('metricGrid');
    if (!grid) return;
    if (!('IntersectionObserver' in window) || prefersReduced) {
      Object.entries(values).forEach(([id, v]) => { const el = document.getElementById(id); if (el) el.textContent = v.toLocaleString('ko-KR'); });
      return;
    }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        obs.disconnect();
        Object.entries(values).forEach(([id, v], i) => {
          const el = document.getElementById(id);
          if (el) countUp(el, v, { delay: i * 120 });
        });
      });
    }, { threshold: 0.4 });
    obs.observe(grid);
  }

  /* =======================================================
     이벤트 배너
     ======================================================= */
  async function initEvents() {
    const grid = document.getElementById('eventGrid');
    const section = document.getElementById('event');
    if (!grid) return;
    let events = [];
    try { events = await D.loadEvents(); } catch (_) {}
    if (!events.length) {
      // 빈 상태: 섹션을 숨기지 않고 안내 + 캐릭터로 채운다
      grid.innerHTML = `
        <div class="event-empty">
          <img class="event-empty-char" src="assets/images/hero-tiger-cutout.png" alt="">
          <p class="event-empty-title">곧 새로운 이벤트가 공개됩니다</p>
          <p class="event-empty-desc">맛집감별사가 직접 검증한 이달의 핫한 계정을 준비 중이에요.</p>
        </div>`;
      return;
    }

    grid.innerHTML = events.map((ev) => {
      const off = ev.listPrice ? Math.round((1 - ev.salePrice / ev.listPrice) * 100) : 0;
      const pct = ev.capacity ? Math.min(100, Math.round((ev.applied / ev.capacity) * 100)) : 0;
      const plats = (ev.platforms || []).filter((p) => ICONS[p])
        .map((p) => `<span class="event-plat" title="${p}">${ICONS[p]}</span>`).join('');
      const benefits = (ev.benefits || []).map((b) => `<span class="event-badge">✔ ${b}</span>`).join('');
      const options = (ev.options || []).map((b) => `<span class="event-badge event-badge-opt">＋ ${b}</span>`).join('');
      return `
        <div class="event-card reveal-card" role="button" tabindex="0" data-inquiry="이달의 이벤트 문의" data-channel="${ev.name}">
          <div class="event-card-top">
            <img class="event-card-avatar" src="${ev.photo}" alt="${ev.name} 프로필" onerror="this.onerror=null;this.src=window.MAG_DATA.avatar(this.alt)">
            <div class="event-card-id">
              <div class="event-card-name">${ev.name}</div>
              ${ev.handle || ev.region ? `<div class="event-card-handle">${ev.handle || ''}${ev.handle && ev.region ? ' · ' : ''}${ev.region ? `<span class="event-card-region">${ev.region}</span>` : ''}</div>` : ''}
            </div>
          </div>
          ${plats ? `<div class="event-card-platforms">${plats}</div>` : ''}
          <div class="event-card-price">
            ${ev.listPrice ? `<span class="event-price-old">${ev.listPrice.toLocaleString('ko-KR')}원</span>` : ''}
            <span class="event-price-new"><span class="count-num" data-count-to="${ev.salePrice}" data-format="comma" data-suffix="원">0</span></span>
            ${off ? `<span class="event-price-off">${off}%</span>` : ''}
          </div>
          <div class="event-card-badges">${benefits}${options}</div>
          <div class="event-card-foot">
            <div class="event-counter"><b class="count-num" data-count-to="${ev.applied}">0</b> / ${ev.capacity}팀 진행</div>
            <div class="event-progress"><span style="width:${pct}%"></span></div>
            <div class="event-period">${ev.startDate} ~ ${ev.endDate}</div>
          </div>
          <span class="event-cta">이벤트 문의하기 <span aria-hidden="true">→</span></span>
        </div>`;
    }).join('');

    revealCards(grid);
    observeCardCountUp(grid);
    grid.querySelectorAll('.event-card').forEach((card) => {
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openInquiry(card.getAttribute('data-channel'), '이달의 이벤트 문의'); }
      });
    });
  }

  /* =======================================================
     이달의 무료광고 크리에이터 (이벤트 카드 셸 재사용, 카드=문의 버튼)
     ======================================================= */
  async function initFreead() {
    const grid = document.getElementById('freeadGrid');
    if (!grid) return;
    let list = [];
    try { list = await D.loadFreead(); } catch (e) { console.warn('[mag] 무료광고 크리에이터 로드 실패', e); }
    grid.innerHTML = '';
    if (!list.length) {
      grid.innerHTML = `
        <div class="event-empty">
          <img class="event-empty-char" src="assets/images/hero-tiger-cutout.png" alt="맛집감별사 인플루언서 매칭 캐릭터">
          <p class="event-empty-title">이번 달 무료광고 크리에이터를 준비 중이에요</p>
        </div>`;
      return;
    }
    grid.innerHTML = list.map((c) => {
      const platList = [];
      if (c.instagram) platList.push('instagram');
      if (c.hasYoutube) platList.push('youtube');
      if (c.hasTiktok) platList.push('tiktok');
      const plats = platList.map((p) => `<span class="event-plat">${ICONS[p]}</span>`).join('');
      const region = D.REGION_LABEL[c.region] || c.region || '';
      return `
        <div class="event-card freead-card reveal-card" role="button" tabindex="0" data-inquiry="이달의 이벤트 문의" data-channel="${c.name}">
          <div class="event-card-top">
            <img class="event-card-avatar" src="${c.photo}" alt="${c.name} 프로필" onerror="this.onerror=null;this.src=window.MAG_DATA.avatar(this.alt)">
            <div class="event-card-id">
              <div class="event-card-name">${c.name}</div>
              <div class="event-card-handle">${c.handle || ''}${c.handle && region ? ' · ' : ''}${region ? `<span class="event-card-region">${region}</span>` : ''}</div>
            </div>
          </div>
          ${plats ? `<div class="event-card-platforms">${plats}</div>` : ''}
          <div class="event-card-badges">
            <span class="event-badge badge-new">신입</span>
            <span class="event-badge badge-course">교육 수료</span>
          </div>
          <div class="growing-adcost">광고비 <b>0원</b> <span>(매장 식사 제공만)</span></div>
          <div class="event-card-foot">
            <div class="event-counter">팔로워 <b class="count-num" data-count-to="${c.followers}" data-format="comma">0</b> · 최근 ${daysAgo(c.lastUpload)}</div>
          </div>
          <span class="event-cta">이벤트 문의하기 <span aria-hidden="true">→</span></span>
        </div>`;
    }).join('');
    revealCards(grid);
    observeCardCountUp(grid);
    grid.querySelectorAll('.event-card').forEach((card) => {
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openInquiry(card.getAttribute('data-channel'), '이달의 이벤트 문의'); } });
    });
  }

  /* =======================================================
     GROWING — 신규 성장 계정 (클릭 시 상세 리포트 → 광고 문의)
     ======================================================= */
  // 신규 성장 계정 카드 — 이달의 이벤트 카드와 동일한 셸(.event-card) 재사용
  function makeGrowingCard(acc) {
    const card = document.createElement('div');
    card.className = 'event-card growing-event-card reveal-card';
    card.setAttribute('role', 'button');
    card.tabIndex = 0;
    const region = D.REGION_LABEL[acc.region] || acc.region || '';
    const platList = [];
    if (acc.instagram) platList.push('instagram');
    if (acc.hasYoutube) platList.push('youtube');
    if (acc.hasTiktok) platList.push('tiktok');
    const plats = platList.map((p) => `<span class="event-plat">${ICONS[p]}</span>`).join('');
    card.innerHTML = `
      <div class="event-card-top">
        <img class="event-card-avatar" src="${acc.photo}" alt="${acc.name} 프로필" onerror="this.onerror=null;this.src=window.MAG_DATA.avatar(this.alt)">
        <div class="event-card-id">
          <div class="event-card-name">${acc.name}</div>
          <div class="event-card-handle">${acc.handle || ''}${acc.handle && region ? ' · ' : ''}${region ? `<span class="event-card-region">${region}</span>` : ''}</div>
        </div>
      </div>
      ${plats ? `<div class="event-card-platforms">${plats}</div>` : ''}
      <div class="event-card-badges">
        <span class="event-badge badge-new">신입</span>
        <span class="event-badge badge-uploads">업로드 10개 미만</span>
      </div>
      <div class="growing-adcost">광고비 <b>1만원~</b> <span>(지역 매칭 시)</span></div>
      <div class="event-card-foot">
        <div class="event-counter">팔로워 <b class="count-num" data-count-to="${acc.followers}" data-format="comma">0</b> · 최근 ${daysAgo(acc.lastUpload)}</div>
      </div>
      <span class="event-cta">광고 문의하기 <span aria-hidden="true">→</span></span>`;
    card.addEventListener('click', () => openReport(acc));
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openReport(acc); } });
    return card;
  }

  async function initGrowing() {
    const grid = document.getElementById('growingGrid');
    if (!grid) return;
    let list = [];
    try { list = await D.loadGrowing(); } catch (e) { console.warn('[mag] 성장계정 로드 실패', e); }
    grid.innerHTML = '';
    if (!list.length) {
      // 섹션을 숨기지 않고 빈 상태로 (데이터 미연결 시 원인 파악도 쉬움)
      grid.innerHTML = `
        <div class="event-empty">
          <img class="event-empty-char" src="assets/images/hero-tiger-cutout.png" alt="">
          <p class="event-empty-title">신규 성장 계정을 준비 중이에요</p>
          <p class="event-empty-desc">곧 이제 막 시작한 채널들을 소개해 드릴게요.</p>
        </div>`;
      return;
    }
    list.forEach((acc) => grid.appendChild(makeGrowingCard(acc)));
    revealCards(grid);
    observeCardCountUp(grid);
  }

  /* =======================================================
     문의 폼 제출
     ======================================================= */
  const contactForm = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');
  const hiddenIframe = document.getElementById('hiddenFormTarget');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(contactForm);
      const req = ['storeName', 'phone', 'area'];
      const missing = req.some((k) => !String(data.get(k) || '').trim());
      if (missing || !data.get('agree')) {
        formStatus.textContent = '필수 항목(*)과 개인정보 동의를 확인해주세요.';
        formStatus.className = 'form-status is-error';
        return;
      }
      const btn = contactForm.querySelector('.form-submit');
      btn.disabled = true;
      formStatus.textContent = '전송 중입니다...';
      formStatus.className = 'form-status';

      const finish = () => {
        formStatus.textContent = '매칭 신청이 접수되었어요. 맛집감별사가 곧 연락드릴게요!';
        formStatus.className = 'form-status is-success';
        btn.disabled = false;
        contactForm.reset();
      };

      if (CONTACT_FORM.action) {
        // 실제 구글폼으로 POST (히든 iframe 타깃)
        const gForm = document.createElement('form');
        gForm.action = CONTACT_FORM.action; gForm.method = 'POST'; gForm.target = 'hiddenFormTarget'; gForm.style.display = 'none';
        Object.entries(CONTACT_FORM.fields).forEach(([key, entry]) => {
          if (!entry) return;
          const input = document.createElement('input');
          input.type = 'hidden'; input.name = entry;
          input.value = String(data.get(key) || '');
          gForm.appendChild(input);
        });
        hiddenIframe.addEventListener('load', finish, { once: true });
        document.body.appendChild(gForm); gForm.submit(); document.body.removeChild(gForm);
        window.setTimeout(() => { if (btn.disabled) finish(); }, 3000);
      } else {
        // 구글폼 미설정 시 로컬 확인
        window.setTimeout(finish, 500);
      }
    });
  }

  /* =======================================================
     부트스트랩
     ======================================================= */
  (async function init() {
    try {
      INFLUENCERS = await D.loadInfluencers();
    } catch (e) {
      console.warn('[mag] 인플루언서 로드 실패', e);
      INFLUENCERS = [];
    }
    initMetrics();
    initFreead();
    initGrowing();
    initEvents();
  })();
})();
