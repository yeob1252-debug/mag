(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('[data-sr-hero]');
  const heroCopy = hero && hero.querySelector('[data-hero-copy]');
  const heroPhone = hero && hero.querySelector('[data-hero-phone]');
  const heroEmphasis = hero && hero.querySelector('.sr-hero-emphasis');
  const narrative = document.querySelector('[data-sr-narrative]');
  const narrativeStage = narrative && narrative.querySelector('[data-narrative-stage]');
  const courseStory = document.querySelector('[data-course-story]');
  const courseStage = courseStory && courseStory.querySelector('[data-course-stage]');
  const editorial = document.querySelector('[data-editorial]');
  const editorialStage = editorial && editorial.querySelector('[data-editorial-stage]');
  const narrativeOrder = ['shot', 'edit', 'upload', 'owner'];
  const courseOrder = ['theory', 'ai', 'shoot', 'edit', 'publish'];
  const editorialOrder = ['korean', 'meat', 'local', 'dessert', 'bakery'];
  let currentNarrative = '';
  let currentOwnerStep = -1;
  let currentCourse = '';
  let currentEditorial = '';
  let scheduled = false;

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const range = (start, end, value) => clamp((value - start) / Math.max(.001, end - start));
  const progress = (element) => {
    if (!element) return 0;
    const rect = element.getBoundingClientRect();
    return clamp(-rect.top / Math.max(1, rect.height - window.innerHeight));
  };

  function renderHero() {
    if (!hero || !heroCopy || !heroPhone || reducedMotion.matches) return;
    const value = progress(hero);
    const emphasis = range(.05, .2, value) * (1 - range(.27, .39, value));
    const copyExit = range(.24, .42, value);
    const phoneIn = range(.48, .66, value);
    const phoneOut = range(.92, 1, value);
    heroCopy.style.setProperty('--hero-copy-opacity', String(1 - copyExit));
    heroCopy.style.setProperty('--hero-copy-y', `${copyExit * -46}px`);
    if (heroEmphasis) {
      heroEmphasis.style.setProperty('--hero-emphasis-scale', String(1 + emphasis * .075));
      heroEmphasis.style.setProperty('--hero-emphasis-bg', String(emphasis));
      heroEmphasis.style.setProperty('--hero-emphasis-y', `${emphasis * -3}px`);
      heroEmphasis.style.setProperty('--hero-emphasis-color', emphasis > .52 ? '#fffaf2' : '#f3573f');
    }
    heroPhone.style.setProperty('--hero-phone-opacity', String(phoneIn * (1 - phoneOut)));
    heroPhone.style.setProperty('--hero-phone-y', `${72 - phoneIn * 72 + phoneOut * -36}px`);
    heroPhone.style.setProperty('--hero-phone-scale', String(.88 + phoneIn * .12 - phoneOut * .06));
    heroPhone.setAttribute('aria-hidden', phoneIn < .35 || phoneOut > .72 ? 'true' : 'false');
  }

  function setPlatformStep(step) {
    if (!narrativeStage) return;
    narrativeStage.dataset.platformStep = String(step);
    narrativeStage.querySelectorAll('.sr-platforms:not(.sr-platforms--static) span').forEach((node, index) => {
      node.classList.toggle('is-shown', index < step);
    });
  }

  function setNarrativeState(state) {
    if (!narrativeStage || currentNarrative === state) return;
    currentNarrative = state;
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
      const active = narrativeOrder[index] === state;
      node.classList.toggle('is-active', active);
      if (active) node.setAttribute('aria-current', 'step');
      else node.removeAttribute('aria-current');
    });
    if (state !== 'upload') setPlatformStep(0);
  }

  function setOwnerStep(step) {
    if (!narrativeStage || currentOwnerStep === step) return;
    currentOwnerStep = step;
    narrativeStage.dataset.ownerStep = String(step);
    narrativeStage.querySelectorAll('[data-owner-phone]').forEach((node, index) => {
      const active = index === step;
      node.classList.toggle('is-active', active);
      node.setAttribute('aria-hidden', String(!active));
    });
    narrativeStage.querySelectorAll('.sr-owner-mini-progress li').forEach((node, index) => node.classList.toggle('is-active', index === step));
  }

  function renderNarrative() {
    if (!narrative || !narrativeStage || reducedMotion.matches) return;
    const value = progress(narrative);
    const index = value < .2 ? 0 : value < .42 ? 1 : value < .78 ? 2 : 3;
    setNarrativeState(narrativeOrder[index]);
    if (narrativeOrder[index] === 'upload') {
      setPlatformStep(Math.max(1, Math.min(5, Math.floor(range(.42, .76, value) * 5) + 1)));
    } else if (narrativeOrder[index] === 'owner') {
      setOwnerStep(Math.min(3, Math.floor(range(.78, 1, value) * 4)));
    }
  }

  function setCourseState(state) {
    if (!courseStage || currentCourse === state) return;
    currentCourse = state;
    courseStage.dataset.courseState = state;
    courseStage.querySelectorAll('[data-course-copy]').forEach((node) => {
      const active = node.dataset.courseCopy === state;
      node.classList.toggle('is-active', active);
      node.setAttribute('aria-hidden', String(!active));
    });
    courseStage.querySelectorAll('[data-course-phone]').forEach((node) => {
      const active = node.dataset.coursePhone === state;
      node.classList.toggle('is-active', active);
      node.setAttribute('aria-hidden', String(!active));
    });
    courseStage.querySelectorAll('.sr-course-progress li').forEach((node, index) => {
      const active = courseOrder[index] === state;
      node.classList.toggle('is-active', active);
      if (active) node.setAttribute('aria-current', 'step');
      else node.removeAttribute('aria-current');
    });
  }

  function renderCourse() {
    if (!courseStory || !courseStage || reducedMotion.matches) return;
    const index = Math.min(courseOrder.length - 1, Math.floor(progress(courseStory) * courseOrder.length));
    setCourseState(courseOrder[index]);
  }

  const editorialData = {
    korean: { index: '01', title: '한식', copy: '김과 온기, 한 상의 밀도를 첫 장면에 담습니다.', src: 'assets/generated/matgamsa-category-korean.webp', alt: '연출 이미지: 자연광의 따뜻한 한식 상차림' },
    meat: { index: '02', title: '고깃집', copy: '불과 소리, 익어가는 결을 가까이 보여줍니다.', src: 'assets/generated/matgamsa-category-meat.webp', alt: '연출 이미지: 숯불 위에서 익어가는 고기' },
    local: { index: '03', title: '노포 음식점', copy: '오래된 공간의 온도와 한 그릇의 인상을 잇습니다.', src: 'assets/generated/matgamsa-category-local.webp', alt: '연출 이미지: 오래된 음식점의 따뜻한 국밥 한 상' },
    dessert: { index: '04', title: '디저트', copy: '색과 질감을 살려 저장하고 싶은 한 컷을 만듭니다.', src: 'assets/generated/matgamsa-category-dessert.webp', alt: '연출 이미지: 자연광 아래 놓인 과일 디저트' },
    bakery: { index: '05', title: '빵집', copy: '갓 나온 빵의 결을 방문하고 싶은 이유로 바꿉니다.', src: 'assets/generated/matgamsa-category-bakery.webp', alt: '연출 이미지: 따뜻한 빛의 갓 구운 빵 진열' },
  };

  function setEditorialState(state, immediate = false) {
    if (!editorial || !editorialStage || !editorialData[state] || currentEditorial === state) return;
    currentEditorial = state;
    editorialStage.dataset.categoryState = state;
    const image = editorial.querySelector('[data-editorial-image]');
    const index = editorial.querySelector('[data-editorial-index]');
    const title = editorial.querySelector('[data-editorial-title]');
    const copy = editorial.querySelector('[data-editorial-copy]');
    editorial.querySelectorAll('[data-category]').forEach((button) => {
      const active = button.dataset.category === state;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
    const item = editorialData[state];
    const apply = () => {
      image.src = item.src;
      image.alt = item.alt;
      index.textContent = item.index;
      title.textContent = item.title;
      copy.textContent = item.copy;
      image.style.opacity = '1';
    };
    if (!image) return;
    image.style.opacity = immediate ? '1' : '.18';
    if (image.getAttribute('src') === item.src) apply();
    else {
      const preload = new Image();
      preload.onload = apply;
      preload.onerror = apply;
      preload.src = item.src;
    }
  }

  function renderEditorial() {
    if (!editorial || !editorialStage || reducedMotion.matches) return;
    const index = Math.min(editorialOrder.length - 1, Math.floor(progress(editorial) * editorialOrder.length));
    setEditorialState(editorialOrder[index]);
  }

  if (editorial) {
    editorial.querySelectorAll('[data-category]').forEach((button, buttonIndex) => {
      button.addEventListener('click', () => {
        if (reducedMotion.matches) {
          currentEditorial = '';
          setEditorialState(button.dataset.category);
          return;
        }
        const maxScroll = Math.max(1, editorial.offsetHeight - window.innerHeight);
        const target = editorial.getBoundingClientRect().top + window.scrollY + maxScroll * ((buttonIndex + .5) / editorialOrder.length);
        window.scrollTo({ top: target, behavior: 'smooth' });
      });
    });
  }

  function render() {
    scheduled = false;
    renderHero();
    renderNarrative();
    renderCourse();
    renderEditorial();
  }

  function scheduleRender() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(render);
  }

  const header = document.querySelector('[data-header]');
  function scheduleAll() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 12);
    scheduleRender();
  }

  reducedMotion.addEventListener?.('change', scheduleAll);
  window.addEventListener('scroll', scheduleAll, { passive: true });
  window.addEventListener('resize', scheduleAll, { passive: true });
  window.addEventListener('pageshow', scheduleAll);
  window.addEventListener('hashchange', scheduleAll);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) scheduleAll(); });
  setNarrativeState('shot');
  setOwnerStep(0);
  setCourseState('theory');
  setEditorialState('korean', true);
  scheduleAll();
})();
