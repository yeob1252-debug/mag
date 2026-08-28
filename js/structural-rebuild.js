(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('[data-sr-hero]');
  const heroCopy = hero && hero.querySelector('[data-hero-copy]');
  const heroPhone = hero && hero.querySelector('[data-hero-phone]');
  const narrative = document.querySelector('[data-sr-narrative]');
  const narrativeStage = narrative && narrative.querySelector('[data-narrative-stage]');
  const stateOrder = ['shot', 'edit', 'upload', 'owner'];
  let currentState = '';
  let scheduled = false;

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const progress = (element) => {
    if (!element) return 0;
    const rect = element.getBoundingClientRect();
    return clamp(-rect.top / Math.max(1, rect.height - window.innerHeight));
  };
  const range = (start, end, value) => clamp((value - start) / (end - start));

  function renderHero() {
    if (!hero || !heroCopy || !heroPhone || reducedMotion.matches) return;
    const value = progress(hero);
    const copyExit = range(.12, .34, value);
    const phoneIn = range(.43, .61, value);
    const phoneOut = range(.91, 1, value);
    heroCopy.style.setProperty('--hero-copy-opacity', String(1 - copyExit));
    heroCopy.style.setProperty('--hero-copy-y', `${copyExit * -42}px`);
    heroPhone.style.setProperty('--hero-phone-opacity', String(phoneIn * (1 - phoneOut)));
    heroPhone.style.setProperty('--hero-phone-y', `${70 - phoneIn * 70 + phoneOut * -34}px`);
    heroPhone.style.setProperty('--hero-phone-scale', String(.88 + phoneIn * .12 - phoneOut * .06));
    heroPhone.setAttribute('aria-hidden', phoneIn < .4 || phoneOut > .7 ? 'true' : 'false');
  }

  function setNarrativeState(state) {
    if (!narrativeStage || currentState === state) return;
    currentState = state;
    narrativeStage.dataset.state = state;
    narrativeStage.querySelectorAll('[data-copy-state]').forEach((node) => {
      const active = node.dataset.copyState === state;
      node.classList.toggle('is-active', active);
      node.setAttribute('aria-hidden', String(!active));
    });
    narrativeStage.querySelectorAll('[data-phone-state]').forEach((node) => {
      const active = node.dataset.phoneState === state;
      node.classList.toggle('is-active', active);
      node.setAttribute('aria-hidden', String(!active));
    });
    narrativeStage.querySelectorAll('.sr-state-dots li').forEach((node, index) => {
      const active = stateOrder[index] === state;
      node.classList.toggle('is-active', active);
      if (active) node.setAttribute('aria-current', 'step');
      else node.removeAttribute('aria-current');
    });
  }

  function renderNarrative() {
    if (!narrative || !narrativeStage || reducedMotion.matches) return;
    const value = progress(narrative);
    const index = value < .24 ? 0 : value < .5 ? 1 : value < .75 ? 2 : 3;
    setNarrativeState(stateOrder[index]);
  }

  function render() {
    scheduled = false;
    renderHero();
    renderNarrative();
  }

  function scheduleRender() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(render);
  }

  const editorialData = {
    korean: { index: '01', title: '한식', copy: '김과 온기, 한 상의 밀도를 첫 장면에 담습니다.', src: 'assets/generated/matgamsa-category-korean.webp', alt: '연출 이미지: 자연광의 따뜻한 한식 상차림' },
    meat: { index: '02', title: '고깃집', copy: '불과 소리, 익어가는 결을 가까이 보여줍니다.', src: 'assets/generated/matgamsa-category-meat.webp', alt: '연출 이미지: 숯불 위에서 익어가는 고기' },
    local: { index: '03', title: '노포 음식점', copy: '오래된 공간의 온도와 한 그릇의 인상을 잇습니다.', src: 'assets/generated/matgamsa-category-local.webp', alt: '연출 이미지: 오래된 음식점의 따뜻한 국밥 한 상' },
    dessert: { index: '04', title: '디저트', copy: '색과 질감을 살려 저장하고 싶은 한 컷을 만듭니다.', src: 'assets/generated/matgamsa-category-dessert.webp', alt: '연출 이미지: 자연광 아래 놓인 과일 디저트' },
    bakery: { index: '05', title: '빵집', copy: '갓 나온 빵의 결을 방문하고 싶은 이유로 바꿉니다.', src: 'assets/generated/matgamsa-category-bakery.webp', alt: '연출 이미지: 따뜻한 빛의 갓 구운 빵 진열' },
  };
  const editorial = document.querySelector('[data-editorial]');
  if (editorial) {
    const image = editorial.querySelector('[data-editorial-image]');
    const index = editorial.querySelector('[data-editorial-index]');
    const title = editorial.querySelector('[data-editorial-title]');
    const copy = editorial.querySelector('[data-editorial-copy]');
    editorial.querySelectorAll('[data-category]').forEach((button) => {
      button.addEventListener('click', () => {
        const item = editorialData[button.dataset.category];
        if (!item) return;
        editorial.querySelectorAll('[data-category]').forEach((candidate) => {
          const active = candidate === button;
          candidate.classList.toggle('is-active', active);
          candidate.setAttribute('aria-selected', String(active));
        });
        image.style.opacity = '.2';
        const apply = () => {
          image.src = item.src;
          image.alt = item.alt;
          index.textContent = item.index;
          title.textContent = item.title;
          copy.textContent = item.copy;
          image.style.opacity = '1';
        };
        if (image.src.endsWith(item.src)) apply();
        else {
          const preload = new Image();
          preload.onload = apply;
          preload.onerror = apply;
          preload.src = item.src;
        }
      });
    });
  }

  const header = document.querySelector('[data-header]');
  function renderHeader() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 12);
  }
  function scheduleAll() {
    renderHeader();
    scheduleRender();
  }

  reducedMotion.addEventListener?.('change', scheduleAll);
  window.addEventListener('scroll', scheduleAll, { passive: true });
  window.addEventListener('resize', scheduleAll, { passive: true });
  window.addEventListener('pageshow', scheduleAll);
  window.addEventListener('hashchange', scheduleAll);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) scheduleAll(); });
  setNarrativeState('shot');
  scheduleAll();
})();
