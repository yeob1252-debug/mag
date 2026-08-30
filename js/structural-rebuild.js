(() => {
  'use strict';

  const story = document.querySelector('[data-v4-story]');
  if (!story) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const copies = [...story.querySelectorAll('[data-v4-copy]')];
  const screens = [...story.querySelectorAll('[data-v4-screen]')];
  const count = story.querySelector('[data-v4-count]');
  const bar = story.querySelector('[data-v4-progress]');
  const stateTotal = Math.min(copies.length, screens.length);
  let active = -1;
  let scheduled = false;

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

  function setState(next) {
    if (next === active) return;
    active = next;
    story.dataset.state = String(next);
    copies.forEach((item, index) => {
      const visible = index === next;
      item.classList.toggle('is-active', visible);
      item.setAttribute('aria-hidden', String(!visible));
    });
    screens.forEach((item, index) => {
      const visible = index === next;
      item.classList.toggle('is-active', visible);
      item.setAttribute('aria-hidden', String(!visible));
    });
    if (count) count.textContent = String(next + 1);
  }

  function update() {
    scheduled = false;
    if (reduced || !stateTotal) return;
    const rect = story.getBoundingClientRect();
    const distance = Math.max(1, rect.height - window.innerHeight);
    const progress = clamp(-rect.top / distance);
    const next = Math.min(stateTotal - 1, Math.floor(progress * stateTotal));
    story.style.setProperty('--v4-story-progress', progress.toFixed(4));
    if (bar) bar.style.transform = `scaleX(${progress.toFixed(4)})`;
    setState(next);
  }

  function requestUpdate() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(update);
  }

  if (reduced) {
    copies.forEach((item) => item.removeAttribute('aria-hidden'));
    screens.forEach((item) => item.setAttribute('aria-hidden', 'true'));
  } else {
    setState(0);
    addEventListener('scroll', requestUpdate, { passive: true });
    addEventListener('resize', requestUpdate, { passive: true });
    addEventListener('pageshow', requestUpdate, { passive: true });
    update();
  }
})();
