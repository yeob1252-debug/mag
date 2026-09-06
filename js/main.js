(() => {
  'use strict';

  const CONTACT_WEBAPP = 'https://script.google.com/macros/s/AKfycbzz3dd4gFiqCDpjo9R5sph6uczf_NcLEwtEwYgbNwuio6L_4K1K4Lyj8F17FLPOyMdi1A/exec';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n));
  const smooth = (a, b, n) => {
    const t = clamp((n - a) / (b - a));
    return t * t * (3 - 2 * t);
  };
  const progress = (section) => {
    const rect = section.getBoundingClientRect();
    return clamp(-rect.top / Math.max(1, rect.height - innerHeight));
  };
  const token = (prefix) => {
    const id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return `${prefix}-${id}`;
  };

  /* Navigation */
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-nav');
  if (toggle && nav) {
    const close = () => { toggle.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open'); document.body.classList.remove('menu-open'); };
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      document.body.classList.toggle('menu-open', open);
    });
    nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
    addEventListener('resize', () => { if (innerWidth > 768) close(); }, { passive: true });
  }

  /* Oryzo-inspired measured state logic: one sequential viewport, no canvas/WebGL. */
  const hero = document.querySelector('.hero-story');
  const heroEls = hero ? {
    eyebrow: hero.querySelector('.hero-eyebrow'),
    copy: hero.querySelector('.hero-copy'),
    a: hero.querySelector('.hero-copy-a'),
    b: hero.querySelector('.hero-copy-b'),
    phone: hero.querySelector('.hero-phone'),
    sub: hero.querySelector('.hero-sub'),
    paths: hero.querySelector('.hero-paths'),
  } : null;
  const category = document.querySelector('.category-story');
  const rail = document.querySelector('[data-category-rail]');
  const railBar = document.querySelector('[data-rail-progress]');
  const cards = rail ? [...rail.querySelectorAll('.food-card')] : [];
  const device = document.querySelector('.device-story');
  const deviceStage = device && device.querySelector('.device-stage');
  const creatorCopy = device && device.querySelector('[data-device-copy="creator"]');
  const ownerCopy = device && device.querySelector('[data-device-copy="owner"]');
  const header = document.querySelector('[data-header]');
  let ticking = false;

  function updateHero() {
    if (!hero || !heroEls || reduced) return;
    const p = progress(hero);
    const a = smooth(.035, .16, p) * (1 - smooth(.58, .72, p));
    const b = smooth(.13, .29, p) * (1 - smooth(.58, .72, p));
    const phoneIn = smooth(.26, .45, p);
    const phoneOut = smooth(.62, .75, p);
    const sub = smooth(.42, .53, p) * (1 - smooth(.61, .7, p));
    const paths = smooth(.7, .81, p) * (1 - smooth(.92, .99, p));
    heroEls.eyebrow.style.opacity = String(smooth(.02, .08, p) * (1 - smooth(.84, .96, p)));
    heroEls.a.style.opacity = String(a);
    heroEls.b.style.opacity = String(b);
    heroEls.a.style.transform = `translateY(${(1 - smooth(.035,.16,p)) * 42}px)`;
    heroEls.b.style.transform = `translateY(${(1 - smooth(.13,.29,p)) * 42}px)`;
    heroEls.copy.style.transform = `translateY(${-smooth(.55,.9,p) * 12}vh) scale(${1 - smooth(.62,.9,p) * .18})`;
    heroEls.phone.style.opacity = String(phoneIn * (1 - phoneOut));
    heroEls.phone.style.transform = `translate(-50%,-42%) translateY(${(1-phoneIn)*20 + phoneOut*24}vh) scale(${.84 + phoneIn*.16 - phoneOut*.12})`;
    heroEls.sub.style.opacity = String(sub);
    heroEls.sub.style.transform = `translateY(${(1-smooth(.4,.56,p))*24}px)`;
    heroEls.paths.style.opacity = String(paths);
    heroEls.paths.style.transform = `translateY(${(1-smooth(.7,.81,p))*28}px)`;
  }

  function updateRail() {
    if (!category || !rail || reduced) return;
    const p = progress(category);
    const max = Math.max(0, rail.scrollWidth - innerWidth + Math.max(32, innerWidth * .08));
    rail.style.transform = `translate3d(${-p * max}px,0,0)`;
    if (railBar) railBar.style.transform = `scaleX(${p})`;
    const idx = Math.min(cards.length - 1, Math.max(0, Math.round(p * (cards.length - 1))));
    cards.forEach((card, i) => card.classList.toggle('is-active', i === idx));
  }

  function updateDevice() {
    if (!device || !deviceStage || reduced) return;
    const p = progress(device);
    const owner = p >= .52;
    deviceStage.classList.toggle('owner-mode', owner);
    if (creatorCopy) creatorCopy.classList.toggle('is-active', !owner);
    if (ownerCopy) ownerCopy.classList.toggle('is-active', owner);
    deviceStage.querySelectorAll('.platform-chip').forEach((chip, i) => {
      const wave = Math.sin((p * 4 + i) * .9) * 7;
      chip.style.transform = `translateY(${wave}px) rotate(${(i - 2) * 1.5}deg)`;
    });
  }

  function updateHeader() {
    if (!header || header.classList.contains('site-header--dark')) return;
    const dark = category && category.getBoundingClientRect().top < 90 && category.getBoundingClientRect().bottom > 90;
    header.classList.toggle('is-dark', !!dark);
  }

  function update() {
    ticking = false;
    updateHero(); updateRail(); updateDevice(); updateHeader();
  }
  function requestUpdate() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  if (hero || category || device) {
    addEventListener('scroll', requestUpdate, { passive: true });
    addEventListener('resize', requestUpdate, { passive: true });
    update();
  }

  /* Enter animations */
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    if (reduced || !('IntersectionObserver' in window)) reveals.forEach((el) => el.classList.add('is-visible'));
    else {
      const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
      }), { threshold: .12, rootMargin: '0px 0px -5% 0px' });
      reveals.forEach((el) => observer.observe(el));
    }
  }

  /* Common submission with explicit type, honeypot, double-submit lock and readable status. */
  async function submitPayload(form, status, payload, type) {
    if (form.elements.website && form.elements.website.value) return;
    const key = `matgamsa-submit:${type}`;
    if (sessionStorage.getItem(key)) {
      status.textContent = '이 화면에서 이미 접수했습니다. 중복 접수는 보내지 않았습니다.';
      status.className = 'form-status is-success';
      return;
    }
    const button = form.querySelector('button[type="submit"]');
    const label = button.textContent;
    button.disabled = true;
    button.textContent = '접수 중...';
    status.textContent = '';
    status.className = 'form-status';
    try {
      await fetch(CONTACT_WEBAPP, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
      sessionStorage.setItem(key, payload['참고 요청사항'] || type);
      status.textContent = type === 'owner_promotion' ? '홍보 문의가 접수되었습니다. 확인 후 연락드리겠습니다.' : '무료 진단 결과가 별도 유형으로 저장되었습니다.';
      status.className = 'form-status is-success';
      form.reset();
    } catch (_) {
      status.textContent = '접수 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';
      status.className = 'form-status is-error';
    } finally {
      button.disabled = false;
      button.textContent = label;
    }
  }

  const ownerForm = document.getElementById('ownerForm');
  if (ownerForm) ownerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const status = document.getElementById('ownerStatus');
    if (!ownerForm.checkValidity()) {
      ownerForm.reportValidity();
      status.textContent = '필수 항목과 개인정보 동의를 확인해 주세요.';
      status.className = 'form-status is-error';
      return;
    }
    const data = new FormData(ownerForm);
    const id = token('owner');
    submitPayload(ownerForm, status, {
      '문의 유형': 'owner_promotion',
      '관심 채널명(있다면 자동 입력됨, 없으면 비워두셔도 됩니다)': '',
      '매장명': String(data.get('storeName') || '').trim(),
      '연락처(문자/카카오톡)': String(data.get('phone') || '').trim(),
      '희망 지역': `대구 ${String(data.get('area') || '').trim()}`,
      '희망 가격대': String(data.get('budget') || '').trim(),
      '메뉴 소개': String(data.get('menu') || '').trim(),
      '매장 스토리(창업 계기 등)': '',
      '참고 요청사항': `[form_type=owner_promotion][submission_id=${id}] ${String(data.get('notes') || '').trim()}`,
      '촬영 콘텐츠 재사용 희망 여부': '미선택',
      '개인정보 수집·이용 동의': data.get('agree') ? '동의합니다' : '',
    }, 'owner_promotion');
  });

  /* Free result first; optional contact capture is a separate form_type from the paid Google Form. */
  const quiz = document.getElementById('channelQuiz');
  const result = document.getElementById('quizResult');
  const savedResult = document.getElementById('savedResultType');
  const RESULT = {
    visual: {
      code: 'TYPE 01', word: 'VISUAL', title: '장면 포착형', image: 'assets/generated/matgamsa-category-meat.webp', alt: '고깃집 촬영 예시',
      summary: '말보다 음식의 움직임과 질감을 먼저 보는 유형입니다. 첫 2초에 가장 맛있는 장면을 배치하면 강점이 살아납니다.',
      checks: ['창가나 매장 조명 중 음식이 가장 선명한 방향 찾기', '김·육즙·절단처럼 움직임이 있는 장면 3개 찍기', '첫 화면에는 가장 가까운 음식 장면 한 개만 쓰기'],
    },
    review: {
      code: 'TYPE 02', word: 'VOICE', title: '경험 리뷰형', image: 'assets/generated/matgamsa-category-local.webp', alt: '노포 음식 리뷰 예시',
      summary: '다녀온 사람만 할 수 있는 말과 분위기를 잘 포착하는 유형입니다. 한 문장의 솔직한 경험이 채널의 목소리가 됩니다.',
      checks: ['먹기 전 기대와 먹은 뒤 느낌을 각각 한 문장으로 메모하기', '메뉴보다 먼저 기억난 공간의 특징 한 가지 찍기', '과장된 칭찬 대신 다시 올 이유 한 가지 말하기'],
    },
    info: {
      code: 'TYPE 03', word: 'GUIDE', title: '실용 정보형', image: 'assets/generated/matgamsa-category-korean.webp', alt: '한식 정보 콘텐츠 예시',
      summary: '가격·주문법·메뉴 조합처럼 저장할 정보를 빠르게 정리하는 유형입니다. 보기 좋은 화면 안에 한 가지 쓸모를 남기면 강합니다.',
      checks: ['대표 메뉴와 주문 기준을 촬영 전에 확인하기', '메뉴판 전체 대신 필요한 가격 한 장면만 기록하기', '누구에게 유용한지 첫 문장에 분명히 쓰기'],
    },
  };
  let activeResult = '';
  if (quiz && result) quiz.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = new FormData(quiz);
    const answers = ['q1','q2','q3'].map((key) => form.get(key));
    const status = document.getElementById('quizStatus');
    if (answers.some((answer) => !answer)) {
      status.textContent = '세 질문을 모두 선택해 주세요.';
      quiz.querySelector('input:not(:checked)')?.closest('.quiz-step')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      return;
    }
    const score = { visual: 0, review: 0, info: 0 };
    answers.forEach((answer) => { score[answer] += 1; });
    const order = ['visual','review','info'];
    activeResult = order.sort((a,b) => score[b] - score[a])[0];
    const value = RESULT[activeResult];
    document.getElementById('resultCode').textContent = value.code;
    document.getElementById('resultWord').textContent = value.word;
    document.getElementById('resultTitle').textContent = value.title;
    document.getElementById('resultSummary').textContent = value.summary;
    const image = document.getElementById('resultImage'); image.src = value.image; image.alt = value.alt;
    const list = document.getElementById('resultChecklist'); list.replaceChildren(...value.checks.map((item) => { const li = document.createElement('li'); li.textContent = item; return li; }));
    if (savedResult) savedResult.value = activeResult;
    status.textContent = '';
    result.hidden = false;
    result.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  });

  document.querySelector('[data-scroll-save]')?.addEventListener('click', () => document.getElementById('saveResult')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }));

  const freeForm = document.getElementById('freeCheckForm');
  if (freeForm) freeForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const status = document.getElementById('freeCheckStatus');
    if (!activeResult) {
      status.textContent = '먼저 위의 3문항 진단 결과를 확인해 주세요.';
      status.className = 'form-status is-error';
      return;
    }
    if (!freeForm.checkValidity()) {
      freeForm.reportValidity();
      status.textContent = '이름·연락처·개인정보 동의를 확인해 주세요.';
      status.className = 'form-status is-error';
      return;
    }
    const data = new FormData(freeForm);
    const id = token('freecheck');
    submitPayload(freeForm, status, {
      '문의 유형': 'creator_free_diagnosis',
      '관심 채널명(있다면 자동 입력됨, 없으면 비워두셔도 됩니다)': activeResult,
      '매장명': String(data.get('name') || '').trim(),
      '연락처(문자/카카오톡)': String(data.get('phone') || '').trim(),
      '희망 지역': String(data.get('area') || '').trim(),
      '희망 가격대': '',
      '메뉴 소개': '',
      '매장 스토리(창업 계기 등)': '',
      '참고 요청사항': `[form_type=creator_free_diagnosis][submission_id=${id}][result_type=${activeResult}]`,
      '촬영 콘텐츠 재사용 희망 여부': '해당 없음',
      '개인정보 수집·이용 동의': data.get('agree') ? '동의합니다' : '',
    }, 'creator_free_diagnosis');
  });
})();
