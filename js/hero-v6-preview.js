(() => {
  'use strict';

  const story = document.querySelector('.v6-story');
  const root = document.documentElement;
  const counter = document.querySelector('.v6-scene-count b');
  if (!story || !counter) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let start = 0;
  let range = 1;
  let queued = false;

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const smooth = (value) => {
    const t = clamp(value);
    return t * t * (3 - 2 * t);
  };
  const between = (progress, from, to) => smooth((progress - from) / (to - from));
  const mix = (from, to, amount) => from + (to - from) * amount;
  const mixColor = (from, to, amount) => `rgb(${from.map((value, index) => Math.round(mix(value, to[index], amount))).join(' ')})`;
  const set = (name, value) => root.style.setProperty(name, value);

  function measure() {
    const rect = story.getBoundingClientRect();
    start = window.scrollY + rect.top;
    range = Math.max(1, story.offsetHeight - window.innerHeight);
    render();
  }

  function render() {
    queued = false;
    if (reduced.matches) {
      story.dataset.state = '5';
      story.dataset.screen = 'owner';
      counter.textContent = '6';
      return;
    }

    const p = clamp((window.scrollY - start) / range);
    set('--v6-progress', p.toFixed(4));

    let state = 0;
    if (p >= .10) state = 1;
    if (p >= .30) state = 2;
    if (p >= .50) state = 3;
    if (p >= .58) state = 4;
    if (p >= .85) state = 5;
    story.dataset.state = String(state);
    counter.textContent = String(state + 1);

    const isMobile = window.innerWidth <= 700;
    const isTablet = window.innerWidth > 700 && window.innerWidth <= 980;

    const creatorEnter = between(p, .105, .155);
    const creatorSettle = between(p, .295, .35);
    const creatorExit = between(p, .39, .455);
    const creatorOpacity = creatorEnter * mix(1, .48, creatorSettle) * (1 - creatorExit);
    const creatorAccentIn = between(p, .16, .195);
    const creatorAccentOut = between(p, .265, .30);
    const creatorAccent = creatorAccentIn * (1 - creatorAccentOut);
    set('--v6-creator-opacity', creatorOpacity.toFixed(4));
    set('--v6-creator-x', `${mix(isMobile ? -5 : -7, 0, creatorEnter).toFixed(3)}vw`);
    set('--v6-creator-y', `${mix(7, 0, creatorEnter).toFixed(3)}vh`);
    set('--v6-creator-scale', mix(.94, 1, creatorEnter).toFixed(4));
    set('--v6-creator-clip', `${mix(100, 0, creatorEnter).toFixed(2)}%`);
    set('--v6-creator-accent-color', mixColor([23, 19, 16], [157, 43, 29], creatorAccent));

    const ownerEnter = between(p, .305, .36);
    const ownerSupportMorph = between(p, .405, .455);
    const ownerExit = between(p, .475, .525);
    const ownerOpacity = ownerEnter * (1 - ownerExit);
    const ownerAccentIn = between(p, .36, .395);
    const ownerAccentOut = between(p, .445, .475);
    const ownerAccent = ownerAccentIn * (1 - ownerAccentOut);
    set('--v6-owner-opacity', ownerOpacity.toFixed(4));
    set('--v6-owner-x', `${mix(isMobile ? 5 : 7, 0, ownerEnter).toFixed(3)}vw`);
    set('--v6-owner-y', `${mix(7, 0, ownerEnter) + mix(0, isMobile ? -28 : -23, ownerSupportMorph)}vh`);
    set('--v6-owner-scale', mix(.94, mix(1, .78, ownerSupportMorph), ownerEnter).toFixed(4));
    set('--v6-owner-clip', `${mix(100, 0, ownerEnter).toFixed(2)}%`);
    set('--v6-owner-accent-color', mixColor([23, 19, 16], [91, 45, 114], ownerAccent));

    const supportEnter = between(p, .42, .46);
    const supportExit = between(p, .49, .52);
    const supportOpacity = supportEnter * (1 - supportExit);
    const supportX = 0;
    const supportY = mix(4, 0, supportEnter);
    set('--v6-support-opacity', supportOpacity.toFixed(4));
    set('--v6-support-x', `${supportX}vw`);
    set('--v6-support-y', `${supportY}vh`);

    const inkIn = between(p, .52, .60);
    const inkOut = between(p, .82, .94);
    const warmIn = between(p, .70, .77);
    const warmOut = between(p, .82, .92);
    set('--v6-ink-opacity', (inkIn * (1 - inkOut)).toFixed(4));
    set('--v6-warm-opacity', (warmIn * (1 - warmOut) * .94).toFixed(4));
    root.style.setProperty('--header-color', (p > .53 && p < .89) ? 'var(--v6-light)' : 'var(--v6-ink)');
    root.style.setProperty('--copy-color', p > .52 ? 'var(--v6-light)' : 'var(--v6-ink)');

    const creatorMask = creatorAccent * .08;
    const ownerMask = ownerEnter * (1 - ownerExit) * .10;
    const maskOwner = between(p, .70, .79);
    const maskResolve = between(p, .84, .95);
    const maskOpacity = creatorMask + ownerMask + mix(0, .31, maskOwner) - mix(0, .38, maskResolve);
    set('--v6-mask-opacity', clamp(maskOpacity, 0, .34).toFixed(4));
    set('--v6-mask-color', p >= .68 ? 'var(--v6-light)' : (p >= .30 && p < .50 ? 'var(--v6-owner-accent)' : 'var(--v6-warm-deep)'));
    const hookMaskMove = between(p, .295, .36);
    const phoneMaskMove = between(p, .52, .60);
    set('--v6-mask-x', `${mix(mix(24, 76, hookMaskMove), 50, phoneMaskMove).toFixed(2)}vw`);
    set('--v6-mask-y', `${mix(mix(32, 68, hookMaskMove), 52, phoneMaskMove).toFixed(2)}vh`);
    set('--v6-mask-scale', mix(mix(.32, .48, hookMaskMove), 1.18, between(p, .52, .78)).toFixed(4));
    set('--v6-mask-rotate', `${mix(-18, 7, between(p, .52, .78)).toFixed(2)}deg`);

    const phoneEnter = between(p, .54, .60);
    const phoneResolve = between(p, .835, .90);
    const phoneOpacity = phoneEnter;
    const dominantScale = mix(.72, isMobile ? 1 : 1.05, phoneEnter);
    const resolvedScale = isMobile ? .64 : .72;
    const phoneScale = mix(dominantScale, resolvedScale, phoneResolve);
    const entryY = isMobile ? 80 : 78;
    const dominantY = isMobile ? 54 : 52;
    const resolvedY = isMobile ? 28 : 35;
    const phoneY = mix(mix(entryY, dominantY, phoneEnter), resolvedY, phoneResolve);
    const phoneX = mix(50, isMobile ? 50 : 50, phoneResolve);
    const phoneRotate = mix(mix(4, -2, phoneEnter), 0, phoneResolve);
    set('--v6-phone-opacity', phoneOpacity.toFixed(4));
    set('--v6-phone-x', `${phoneX.toFixed(2)}vw`);
    set('--v6-phone-y', `${phoneY.toFixed(2)}vh`);
    set('--v6-phone-scale', phoneScale.toFixed(4));
    set('--v6-phone-rotate', `${phoneRotate.toFixed(2)}deg`);

    if (p >= .58 && p < .705) story.dataset.screen = 'creator';
    else if (p >= .735) story.dataset.screen = 'owner';
    else story.dataset.screen = 'none';

    const ownerPhoneEnter = between(p, .735, .765);
    const ownerProgress = between(p, .74, .825);
    const ownerMatch = between(p, .755, .79);
    const ownerAgree = between(p, .78, .825);
    set('--v6-owner-enter', ownerPhoneEnter.toFixed(4));
    set('--v6-owner-progress', ownerProgress.toFixed(4));
    set('--v6-owner-match', ownerMatch.toFixed(4));
    set('--v6-owner-agree', ownerAgree.toFixed(4));

    const routesIn = between(p, .91, .96);
    set('--v6-routes-opacity', routesIn.toFixed(4));
    set('--v6-routes-y', `${mix(22, 0, routesIn).toFixed(2)}px`);
  }

  function requestRender() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(render);
  }

  addEventListener('scroll', requestRender, { passive: true });
  addEventListener('resize', measure, { passive: true });
  addEventListener('load', measure, { once: true });
  reduced.addEventListener?.('change', measure);
  measure();
})();

(() => {
  'use strict';

  const story = document.querySelector('.v6-challenge-story');
  if (!story) return;
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const steps = [...story.querySelectorAll('.v6-challenge-step')];
  const screens = [...story.querySelectorAll('[data-challenge-screen-name]')];
  const reducedBlock = story.querySelector('.v6-challenge-reduced');
  const decision = story.querySelector('.v6-challenge-decision');
  let start = 0;
  let range = 1;
  let queued = false;

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
  const between = (progress, from, to) => smooth((progress - from) / (to - from));
  const mix = (from, to, amount) => from + (to - from) * amount;
  const mixColor = (from, to, amount) => `rgb(${from.map((value, index) => Math.round(mix(value, to[index], amount))).join(' ')})`;
  const set = (name, value) => story.style.setProperty(name, value);
  const screenNames = ['none','none','none','who','where','channel','ai','how','practice','after','none'];
  const thresholds = [0,.05,.145,.235,.325,.405,.485,.565,.645,.725,.805,1];
  const palette = [
    { bg:[243,238,228], fg:[23,19,16], accent:[157,43,29] },
    { bg:[243,238,228], fg:[23,19,16], accent:[157,43,29] },
    { bg:[239,128,99], fg:[23,19,16], accent:[111,29,19] },
    { bg:[242,222,192], fg:[23,19,16], accent:[157,43,29] },
    { bg:[229,239,233], fg:[23,19,16], accent:[19,80,73] },
    { bg:[245,189,152], fg:[23,19,16], accent:[123,39,24] },
    { bg:[255,246,236], fg:[23,19,16], accent:[157,43,29] },
    { bg:[18,59,58], fg:[255,250,242], accent:[255,186,168] },
    { bg:[47,31,67], fg:[255,250,242], accent:[255,186,168] },
    { bg:[239,128,99], fg:[23,19,16], accent:[111,29,19] },
    { bg:[243,238,228], fg:[23,19,16], accent:[157,43,29] },
  ];

  function measure() {
    const rect = story.getBoundingClientRect();
    start = scrollY + rect.top;
    range = Math.max(1, story.offsetHeight - innerHeight);
    render();
  }

  function render() {
    queued = false;
    if (reduced.matches) {
      story.dataset.challengeState = 'reduced';
      story.dataset.challengeScreen = 'none';
      reducedBlock?.setAttribute('aria-hidden','false');
      decision?.setAttribute('aria-hidden','false');
      steps.forEach(step => step.setAttribute('aria-hidden','true'));
      screens.forEach(screen => screen.setAttribute('aria-hidden','true'));
      return;
    }

    const p = clamp((scrollY - start) / range);
    reducedBlock?.setAttribute('aria-hidden','true');
    decision?.setAttribute('aria-hidden',String(story.dataset.challengeState !== '10'));
    set('--challenge-progress', p.toFixed(4));

    let state = 0;
    for (let index = 1; index < thresholds.length - 1; index += 1) {
      if (p >= thresholds[index]) state = index;
    }
    story.dataset.challengeState = String(state);
    story.dataset.challengeScreen = screenNames[state];

    const nextState = Math.min(palette.length - 1, state + 1);
    const span = thresholds[state + 1] - thresholds[state];
    const colorMorph = state < 10 ? between(p, thresholds[state] + span * .72, thresholds[state + 1]) : 0;
    const current = palette[state];
    const next = palette[nextState];
    set('--challenge-bg', mixColor(current.bg, next.bg, colorMorph));
    set('--challenge-fg', mixColor(current.fg, next.fg, colorMorph));
    set('--challenge-accent', mixColor(current.accent, next.accent, colorMorph));

    const introIn = between(p,.05,.08);
    const introOut = between(p,.115,.145);
    set('--challenge-intro-opacity',(introIn * (1 - introOut)).toFixed(4));
    set('--challenge-intro-y',`${mix(7,0,introIn).toFixed(3)}vh`);

    const benefitIn = between(p,.145,.175);
    const benefitOut = between(p,.205,.235);
    set('--challenge-benefit-opacity',(benefitIn * (1 - benefitOut)).toFixed(4));
    set('--challenge-benefit-y',`${mix(7,0,benefitIn).toFixed(3)}vh`);

    const phoneIn = between(p,.235,.272);
    const phoneOut = between(p,.775,.815);
    const isMobile = innerWidth <= 700;
    const isTablet = innerWidth > 700 && innerWidth <= 980;
    const phoneX = isMobile ? 50 : (isTablet ? 74 : 72);
    const phoneY = isMobile ? 33 : 53;
    set('--challenge-phone-opacity',(phoneIn * (1 - phoneOut)).toFixed(4));
    set('--challenge-phone-x',`${phoneX.toFixed(2)}vw`);
    set('--challenge-phone-y',`${mix(isMobile ? 72 : 76,phoneY,phoneIn).toFixed(2)}vh`);
    set('--challenge-phone-scale',mix(.78,1,phoneIn).toFixed(4));
    set('--challenge-phone-rotate',`${mix(4,0,phoneIn).toFixed(2)}deg`);

    const phoneStage = state >= 3 && state <= 9;
    let stageOpacity = 0;
    let stageY = 7;
    if (phoneStage) {
      const from = state === 3 ? .272 : thresholds[state];
      const to = thresholds[state + 1];
      const enter = between(p,from,from + .025);
      const exit = between(p,to - .025,to);
      stageOpacity = enter * (1 - exit);
      stageY = mix(7,0,enter);
    }
    set('--challenge-stage-opacity',stageOpacity.toFixed(4));
    set('--challenge-stage-y',`${stageY.toFixed(3)}vh`);

    const screenName = screenNames[state];
    steps.forEach((step,index) => step.setAttribute('aria-hidden',String(index !== state - 3 || stageOpacity < .05)));
    screens.forEach(screen => screen.setAttribute('aria-hidden',String(screen.dataset.challengeScreenName !== screenName)));

    const windowIn = between(p,.23,.30);
    const windowOut = between(p,.77,.83);
    set('--challenge-window-opacity',(windowIn * (1 - windowOut) * .16).toFixed(4));
    set('--challenge-window-scale',mix(.48,1.16,between(p,.23,.76)).toFixed(4));
    set('--challenge-window-x',`${mix(isMobile ? 50 : 76,isMobile ? 50 : 68,between(p,.23,.76)).toFixed(2)}vw`);
    set('--challenge-window-y',`${mix(45,53,between(p,.23,.76)).toFixed(2)}vh`);

    const decisionIn = between(p,.805,.84);
    set('--challenge-decision-opacity',decisionIn.toFixed(4));
    set('--challenge-decision-y',`${mix(7,0,decisionIn).toFixed(3)}vh`);
    decision?.setAttribute('aria-hidden',String(state !== 10 || decisionIn < .05));

    const within = scrollY >= start && scrollY < start + story.offsetHeight - 2;
    if (within) {
      const dark = state === 7 || state === 8;
      root.style.setProperty('--header-color', dark ? '#fffaf2' : '#171310');
      root.style.setProperty('--scene-count-opacity','0');
    } else if (scrollY < start) {
      root.style.setProperty('--scene-count-opacity','1');
    }
  }

  function requestRender() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(render);
  }

  addEventListener('scroll',requestRender,{ passive:true });
  addEventListener('resize',measure,{ passive:true });
  addEventListener('load',measure,{ once:true });
  reduced.addEventListener?.('change',measure);
  measure();
})();

(() => {
  'use strict';

  const calendar = document.querySelector('.v6-course-calendar');
  if (!calendar) return;
  const title = calendar.querySelector('[data-course-calendar-title]');
  const grid = calendar.querySelector('[data-course-calendar-grid]');
  const status = calendar.querySelector('[data-course-calendar-status]');
  const previous = calendar.querySelector('[data-course-calendar-prev]');
  const next = calendar.querySelector('[data-course-calendar-next]');
  const confirmedEvents = new Map([['2026-09-16','1기 진행 예정']]);
  let viewYear = 2026;
  let viewMonth = 8;

  const keyFor = (year, month, day) => `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;

  function renderCalendar() {
    const monthNumber = viewMonth + 1;
    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
    const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();
    const fragment = document.createDocumentFragment();
    let activeLabel = '';

    title.textContent = `${viewYear}년 ${monthNumber}월`;
    grid.setAttribute('aria-label',`${viewYear}년 ${monthNumber}월 달력`);
    grid.replaceChildren();

    for (let blank = 0; blank < firstWeekday; blank += 1) {
      const spacer = document.createElement('span');
      spacer.setAttribute('aria-hidden','true');
      fragment.append(spacer);
    }

    for (let day = 1; day <= totalDays; day += 1) {
      const eventName = confirmedEvents.get(keyFor(viewYear,viewMonth,day));
      const cell = document.createElement(eventName ? 'button' : 'span');
      cell.textContent = String(day);
      cell.setAttribute('role','gridcell');
      if (eventName) {
        cell.type = 'button';
        cell.className = 'is-event';
        cell.setAttribute('aria-label',`${viewYear}년 ${monthNumber}월 ${day}일, ${eventName}`);
        activeLabel = `${viewYear}년 ${monthNumber}월 ${day}일 · ${eventName}`;
      } else {
        cell.setAttribute('aria-label',`${viewYear}년 ${monthNumber}월 ${day}일`);
      }
      fragment.append(cell);
    }

    grid.append(fragment);
    status.textContent = activeLabel || '등록된 교육 일정이 없습니다.';
  }

  function moveMonth(offset) {
    const nextDate = new Date(viewYear, viewMonth + offset, 1);
    viewYear = nextDate.getFullYear();
    viewMonth = nextDate.getMonth();
    renderCalendar();
  }

  previous?.addEventListener('click',() => moveMonth(-1));
  next?.addEventListener('click',() => moveMonth(1));
  renderCalendar();
})();

(() => {
  'use strict';

  const story = document.querySelector('.v6-selection-story--retired');
  if (!story) return;
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const criteria = [...story.querySelectorAll('.v6-selection-criterion')];
  let start = 0;
  let range = 1;
  let queued = false;

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const smooth = value => {
    const t = clamp(value);
    return t * t * (3 - 2 * t);
  };
  const between = (progress, from, to) => smooth((progress - from) / (to - from));
  const mix = (from, to, amount) => from + (to - from) * amount;
  const set = (name, value) => story.style.setProperty(name, value);

  function measure() {
    const rect = story.getBoundingClientRect();
    start = window.scrollY + rect.top;
    range = Math.max(1, story.offsetHeight - window.innerHeight);
    render();
  }

  function render() {
    queued = false;
    if (reduced.matches) {
      story.dataset.selectionState = 'reduced';
      criteria.forEach(item => item.setAttribute('aria-hidden', 'true'));
      return;
    }

    const p = clamp((window.scrollY - start) / range);
    set('--selection-progress', p.toFixed(4));

    let state = 0;
    if (p >= .09) state = 1;
    if (p >= .32) state = 2;
    if (p >= .49) state = 3;
    if (p >= .64) state = 4;
    if (p >= .80) state = 5;
    story.dataset.selectionState = String(state);

    const introEnter = between(p, .08, .145);
    const introExit = between(p, .285, .35);
    const introOpacity = introEnter * (1 - introExit);
    const supportEnter = between(p, .17, .22);
    set('--selection-intro-opacity', introOpacity.toFixed(4));
    set('--selection-intro-y', `${mix(7, 0, introEnter).toFixed(3)}vh`);
    set('--selection-support-opacity', (supportEnter * (1 - introExit)).toFixed(4));

    const visualEnter = between(p, .35, .42);
    const visualExit = between(p, .78, .86);
    const visualMorph = between(p, .43, .71);
    const finalMorph = between(p, .68, .77);
    const isMobile = window.innerWidth <= 700;
    set('--selection-field-opacity', (visualEnter * (1 - visualExit)).toFixed(4));
    set('--selection-visual-opacity', (visualEnter * (1 - visualExit)).toFixed(4));
    set('--selection-visual-x', `${isMobile ? '50.00' : '72.00'}vw`);
    set('--selection-visual-y', `${mix(isMobile ? 44 : 55, isMobile ? 42 : 51, visualMorph).toFixed(2)}vh`);
    set('--selection-visual-width', `${mix(isMobile ? 42 : 24, isMobile ? 91 : 52, visualEnter).toFixed(2)}vw`);
    set('--selection-visual-height', `${mix(isMobile ? 42 : 24, isMobile ? 48 : 74, visualEnter).toFixed(2)}${isMobile ? 'vw' : 'vh'}`);
    set('--selection-visual-radius', `${mix(50, mix(10, 3, finalMorph), visualEnter).toFixed(2)}%`);
    set('--selection-image-scale', mix(1.16, .99, visualMorph).toFixed(4));
    set('--selection-image-x', `${mix(40, 64, visualMorph).toFixed(2)}%`);
    set('--selection-image-y', `${mix(52, 46, visualMorph).toFixed(2)}%`);

    const criterionOneIn = between(p, .38, .425);
    const criterionOneOut = between(p, .47, .51);
    const criterionTwoIn = between(p, .51, .555);
    const criterionTwoOut = between(p, .62, .66);
    const criterionThreeIn = between(p, .66, .705);
    const criterionThreeOut = between(p, .755, .79);
    const criterionValues = [
      criterionOneIn * (1 - criterionOneOut),
      criterionTwoIn * (1 - criterionTwoOut),
      criterionThreeIn * (1 - criterionThreeOut),
    ];
    set('--selection-criterion-one', criterionValues[0].toFixed(4));
    set('--selection-criterion-two', criterionValues[1].toFixed(4));
    set('--selection-criterion-three', criterionValues[2].toFixed(4));
    set('--selection-criteria-x', `${mix(isMobile ? 0 : -4, 0, visualEnter).toFixed(3)}vw`);
    criteria.forEach((item, index) => item.setAttribute('aria-hidden', criterionValues[index] > .03 ? 'false' : 'true'));

    const resolveEnter = between(p, .86, .92);
    set('--selection-resolve-opacity', resolveEnter.toFixed(4));
    set('--selection-resolve-y', `${mix(6, 0, resolveEnter).toFixed(3)}vh`);
  }

  function requestRender() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(render);
  }

  addEventListener('scroll', requestRender, { passive: true });
  addEventListener('resize', measure, { passive: true });
  addEventListener('load', measure, { once: true });
  reduced.addEventListener?.('change', measure);
  measure();
})();

(() => {
  'use strict';

  const story = document.querySelector('.v6-selection-story');
  if (!story) return;
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const stages = [...story.querySelectorAll('.v6-selection-stage')];
  let start = 0;
  let range = 1;
  let queued = false;

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
  const between = (progress, from, to) => smooth((progress - from) / (to - from));
  const mix = (from, to, amount) => from + (to - from) * amount;
  const mixColor = (from, to, amount) => `rgb(${from.map((value, index) => Math.round(mix(value, to[index], amount))).join(' ')})`;
  const set = (name, value) => story.style.setProperty(name, value);
  const palette = [
    { bg:[243,238,228], fg:[23,19,16], accent:[157,43,29] },
    { bg:[243,238,228], fg:[23,19,16], accent:[157,43,29] },
    { bg:[242,222,192], fg:[23,19,16], accent:[157,43,29] },
    { bg:[239,128,99], fg:[23,19,16], accent:[111,29,19] },
    { bg:[18,59,58], fg:[255,250,242], accent:[255,196,179] },
    { bg:[229,239,233], fg:[23,19,16], accent:[157,43,29] },
  ];

  function measure() {
    const rect = story.getBoundingClientRect();
    start = scrollY + rect.top;
    range = Math.max(1, story.offsetHeight - innerHeight);
    render();
  }

  function render() {
    queued = false;
    if (reduced.matches) {
      story.dataset.selectionState = 'reduced';
      stages.forEach(stage => stage.setAttribute('aria-hidden', 'true'));
      return;
    }

    const p = clamp((scrollY - start) / range);
    set('--selection-progress', p.toFixed(4));

    let state = 0;
    if (p >= .075) state = 1;
    if (p >= .335) state = 2;
    if (p >= .505) state = 3;
    if (p >= .67) state = 4;
    if (p >= .835) state = 5;
    story.dataset.selectionState = String(state);

    const thresholds = [0, .075, .335, .505, .67, .835, 1];
    const nextState = Math.min(5, state + 1);
    const local = state < 5 ? between(p, thresholds[state] + (thresholds[state + 1] - thresholds[state]) * .68, thresholds[state + 1]) : 0;
    const current = palette[state];
    const next = palette[nextState];
    set('--selection-bg', mixColor(current.bg, next.bg, local));
    set('--selection-fg', mixColor(current.fg, next.fg, local));
    set('--selection-accent', mixColor(current.accent, next.accent, local));

    const introEnter = between(p, .075, .14);
    const introExit = between(p, .275, .335);
    const introOpacity = introEnter * (1 - introExit);
    const supportEnter = between(p, .16, .215);
    set('--selection-intro-opacity', introOpacity.toFixed(4));
    set('--selection-intro-y', `${mix(7, 0, introEnter).toFixed(3)}vh`);
    set('--selection-support-opacity', (supportEnter * (1 - introExit)).toFixed(4));

    const phoneEnter = between(p, .32, .37);
    const isMobile = innerWidth <= 700;
    const isTablet = innerWidth > 700 && innerWidth <= 980;
    const phoneX = isMobile ? 50 : (isTablet ? 70 : 68);
    const phoneY = isMobile ? 39 : 53;
    set('--selection-phone-opacity', phoneEnter.toFixed(4));
    set('--selection-phone-x', `${phoneX}vw`);
    set('--selection-phone-y', `${phoneY}vh`);
    set('--selection-phone-scale', mix(.83, 1, phoneEnter).toFixed(4));
    set('--selection-phone-rotate', `${mix(3, 0, phoneEnter).toFixed(3)}deg`);

    const stageBoundaries = [[.335,.505],[.505,.67],[.67,.835],[.835,1]];
    let stageOpacity = 0;
    let stageY = 7;
    if (state >= 2) {
      const bounds = stageBoundaries[state - 2];
      const enter = between(p, bounds[0], bounds[0] + .035);
      const exit = state === 5 ? 0 : between(p, bounds[1] - .035, bounds[1]);
      stageOpacity = enter * (1 - exit);
      stageY = mix(7, 0, enter);
    }
    set('--selection-stage-opacity', stageOpacity.toFixed(4));
    set('--selection-stage-y', `${stageY.toFixed(3)}vh`);
    stages.forEach((stage, index) => stage.setAttribute('aria-hidden', String(index !== state - 2 || stageOpacity < .05)));

    const within = scrollY >= start && scrollY < start + story.offsetHeight;
    if (within) root.style.setProperty('--header-color', state === 4 ? '#fffaf2' : '#171310');
  }

  function requestRender() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(render);
  }

  addEventListener('scroll', requestRender, { passive:true });
  addEventListener('resize', measure, { passive:true });
  addEventListener('load', measure, { once:true });
  reduced.addEventListener?.('change', measure);
  measure();
})();

(() => {
  'use strict';

  const story = document.querySelector('.v6-budget-story');
  if (!story) return;
  const panels = [...story.querySelectorAll('[data-budget-panel]')];
  const track = story.querySelector('.v6-budget-track');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let start = 0;
  let range = 1;
  let queued = false;

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

  function setPanel(index) {
    story.dataset.budgetState = String(index);
    story.style.setProperty('--budget-index', String(index));
    panels.forEach((panel, panelIndex) => {
      const active = panelIndex === index;
      panel.classList.toggle('is-active', active);
      if (active) panel.setAttribute('aria-current', 'step');
      else panel.removeAttribute('aria-current');
    });
    if (!track || innerWidth > 980 || reduced.matches) {
      story.style.setProperty('--budget-track-x', '0px');
      return;
    }
    const active = panels[index];
    const scene = story.querySelector('.v6-budget-scene');
    const sceneWidth = scene?.clientWidth || innerWidth;
    const x = (sceneWidth / 2) - (active.offsetLeft + active.offsetWidth / 2);
    story.style.setProperty('--budget-track-x', `${x.toFixed(2)}px`);
  }

  function setAsset() {
    story.dataset.budgetState = 'asset';
    panels.forEach(panel => {
      panel.classList.remove('is-active');
      panel.removeAttribute('aria-current');
    });
  }

  function measure() {
    const rect = story.getBoundingClientRect();
    start = scrollY + rect.top;
    range = Math.max(1, story.offsetHeight - innerHeight);
    render();
  }

  function render() {
    queued = false;
    if (reduced.matches) {
      story.dataset.budgetState = 'reduced';
      story.style.setProperty('--budget-progress', '1');
      panels.forEach(panel => { panel.classList.add('is-active'); panel.removeAttribute('aria-current'); });
      story.style.setProperty('--budget-track-x', '0px');
      return;
    }
    const p = clamp((scrollY - start) / range);
    const storyEnd = start + story.offsetHeight - 2;
    const within = scrollY >= start && scrollY < storyEnd;
    if (within) document.documentElement.style.setProperty('--header-color', '#fffaf2');
    else if (scrollY >= storyEnd) document.documentElement.style.setProperty('--header-color', '#171310');
    story.style.setProperty('--budget-progress', p.toFixed(4));
    if (p >= .78) {
      setAsset();
      return;
    }
    const index = p < .26 ? 0 : (p < .52 ? 1 : 2);
    setPanel(index);
  }

  function requestRender() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(render);
  }

  addEventListener('scroll', requestRender, { passive:true });
  addEventListener('resize', measure, { passive:true });
  addEventListener('load', measure, { once:true });
  reduced.addEventListener?.('change', measure);
  measure();
})();
