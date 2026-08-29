(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const journey = document.querySelector('[data-journey]');
  const stage = journey && journey.querySelector('[data-journey-stage]');
  const phone = journey && journey.querySelector('[data-persistent-phone]');
  const progressBar = journey && journey.querySelector('.sr-journey-progress span');
  const platformChips = journey ? [...journey.querySelectorAll('.sr-journey-platforms span')] : [];
  const segments = [
    ['hero', 1.4], ['creator-cta', 1.4], ['owner-cta', 1.4],
    ['shot', 1], ['edit', 1], ['upload', 2.5],
    ['owner-store', .8], ['owner-creator', .8], ['owner-connect', .9], ['owner-dm', 1.1],
    ['course-intro', 1.3], ['course-theory', 1], ['course-ai', 1], ['course-shoot', 1], ['course-edit', 1], ['course-publish', 1.1],
    ['category-intro', 1.2], ['cat-korean', 1], ['cat-meat', 1], ['cat-local', 1], ['cat-dessert', 1], ['cat-bakery', 1.2],
  ];
  const totalWeight = segments.reduce((sum, item) => sum + item[1], 0);
  const phoneStartIndex = 0;
  let currentState = '';
  let currentPlatformStep = -1;
  let scheduled = false;

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const progress = (element) => {
    if (!element) return 0;
    const rect = element.getBoundingClientRect();
    return clamp(-rect.top / Math.max(1, rect.height - window.innerHeight));
  };

  function resolveSegment(value) {
    const point = clamp(value, 0, .999999) * totalWeight;
    let cursor = 0;
    for (let index = 0; index < segments.length; index += 1) {
      const [name, weight] = segments[index];
      if (point < cursor + weight) return { name, index, local: clamp((point - cursor) / weight) };
      cursor += weight;
    }
    return { name: segments.at(-1)[0], index: segments.length - 1, local: 1 };
  }

  function setPlatformStep(step) {
    if (!stage || currentPlatformStep === step) return;
    currentPlatformStep = step;
    stage.dataset.platformStep = String(step);
    platformChips.forEach((chip, index) => chip.classList.toggle('is-shown', index < step));
  }

  function setState(name, index) {
    if (!stage || currentState === name) return;
    currentState = name;
    stage.dataset.state = name;
    stage.dataset.stateIndex = String(index + 1);
    journey.dataset.state = name;
    document.body.dataset.journeyState = name;
    journey.querySelectorAll('[data-journey-copy]').forEach((node) => {
      const active = node.dataset.journeyCopy === name;
      node.classList.toggle('is-active', active);
      node.setAttribute('aria-hidden', String(!active));
    });
    journey.querySelectorAll('[data-journey-screen]').forEach((node) => {
      const active = node.dataset.journeyScreen === name;
      node.classList.toggle('is-active', active);
      node.setAttribute('aria-hidden', String(!active));
    });
    const phoneVisible = index >= phoneStartIndex;
    phone.classList.toggle('is-visible', phoneVisible);
    phone.setAttribute('aria-hidden', String(!phoneVisible));
    if (name !== 'upload') setPlatformStep(0);
  }

  function renderJourney() {
    if (!journey || !stage || reducedMotion.matches) return;
    const value = progress(journey);
    const state = resolveSegment(value);
    setState(state.name, state.index);
    stage.style.setProperty('--sr-progress', value.toFixed(5));
    stage.style.setProperty('--sr-local', state.local.toFixed(5));
    document.body.dataset.inJourney = String(value < .9995);
    if (state.name === 'upload') setPlatformStep(Math.min(5, Math.max(1, Math.floor(state.local * 5) + 1)));
    if (progressBar) progressBar.style.transform = `scaleX(${value})`;
  }

  function render() {
    scheduled = false;
    renderJourney();
  }

  function schedule() {
    const header = document.querySelector('[data-header]');
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 12);
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(render);
  }

  reducedMotion.addEventListener?.('change', schedule);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('pageshow', schedule);
  window.addEventListener('hashchange', schedule);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) schedule(); });
  if (journey && stage && phone) setState('hero', 0);
  schedule();
})();
