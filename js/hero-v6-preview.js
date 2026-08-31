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
    if (p >= .27) state = 2;
    if (p >= .43) state = 3;
    if (p >= .58) state = 4;
    if (p >= .85) state = 5;
    story.dataset.state = String(state);
    counter.textContent = String(state + 1);

    const isMobile = window.innerWidth <= 700;
    const isTablet = window.innerWidth > 700 && window.innerWidth <= 980;

    const hookEnter = between(p, .105, .155);
    const hookMorph = between(p, .285, .37);
    const hookExit = between(p, .405, .465);
    const hookOpacity = hookEnter * (1 - hookExit);
    const hookX = mix(0, isMobile ? -1 : -18, hookMorph);
    const hookY = mix(0, isMobile ? -21 : -16, hookMorph);
    const hookScale = mix(.88, 1, hookEnter) * mix(1, isMobile ? .7 : .72, hookMorph);
    set('--v6-hook-opacity', hookOpacity.toFixed(4));
    set('--v6-hook-x', `${hookX.toFixed(3)}vw`);
    set('--v6-hook-y', `${hookY.toFixed(3)}vh`);
    set('--v6-hook-scale', hookScale.toFixed(4));

    const supportEnter = between(p, .315, .37);
    const supportExit = between(p, .405, .465);
    const supportOpacity = supportEnter * (1 - supportExit);
    const supportX = isMobile ? 0 : (isTablet ? 20 : 23);
    const supportY = isMobile ? 22 : 18;
    set('--v6-support-opacity', supportOpacity.toFixed(4));
    set('--v6-support-x', `${supportX}vw`);
    set('--v6-support-y', `${supportY}vh`);

    const inkIn = between(p, .44, .555);
    const inkOut = between(p, .82, .94);
    const warmIn = between(p, .70, .77);
    const warmOut = between(p, .82, .92);
    set('--v6-ink-opacity', (inkIn * (1 - inkOut)).toFixed(4));
    set('--v6-warm-opacity', (warmIn * (1 - warmOut) * .94).toFixed(4));
    root.style.setProperty('--header-color', (p > .50 && p < .89) ? 'var(--v6-light)' : 'var(--v6-ink)');
    root.style.setProperty('--copy-color', p > .49 ? 'var(--v6-light)' : 'var(--v6-ink)');

    const maskIn = between(p, .285, .43);
    const maskOwner = between(p, .70, .79);
    const maskResolve = between(p, .84, .95);
    const maskOpacity = mix(0, .15, maskIn) + mix(0, .31, maskOwner) - mix(0, .38, maskResolve);
    set('--v6-mask-opacity', clamp(maskOpacity, 0, .34).toFixed(4));
    set('--v6-mask-color', p >= .68 ? 'var(--v6-light)' : 'var(--v6-warm)');
    set('--v6-mask-x', `${mix(26, 50, between(p, .43, .56)).toFixed(2)}vw`);
    set('--v6-mask-y', `${mix(30, 52, between(p, .43, .56)).toFixed(2)}vh`);
    set('--v6-mask-scale', mix(.32, 1.18, between(p, .43, .78)).toFixed(4));
    set('--v6-mask-rotate', `${mix(-18, 7, between(p, .43, .78)).toFixed(2)}deg`);

    const phoneEnter = between(p, .47, .545);
    const phoneResolve = between(p, .855, .93);
    const phoneOpacity = phoneEnter;
    const dominantScale = mix(.72, isMobile ? 1 : 1.05, phoneEnter);
    const resolvedScale = isMobile ? .81 : .95;
    const phoneScale = mix(dominantScale, resolvedScale, phoneResolve);
    const entryY = isMobile ? 80 : 78;
    const dominantY = isMobile ? 54 : 52;
    const resolvedY = isMobile ? 43 : 45;
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

    const routesIn = between(p, .90, .955);
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
