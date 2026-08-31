(() => {
  'use strict';

  const story = document.querySelector('[data-v5-story]');
  if (!story) return;

  const stage = story.querySelector('[data-v5-stage]');
  const staticStory = story.querySelector('[data-v5-static]');
  const copies = [...story.querySelectorAll('[data-v5-copy]')];
  const screens = [...story.querySelectorAll('[data-v5-screen]')];
  const progressBar = story.querySelector('[data-v5-progress]');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const stateThresholds = [0, .19, .38, .57, .76];
  const stateTargets = [.08, .285, .475, .665, .86];
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
  }

  function stateFor(progress) {
    let next = 0;
    for (let index = 1; index < stateThresholds.length; index += 1) {
      if (progress >= stateThresholds[index]) next = index;
    }
    return next;
  }

  function update() {
    scheduled = false;
    if (motion.matches) return;
    const rect = story.getBoundingClientRect();
    const distance = Math.max(1, rect.height - window.innerHeight);
    const progress = clamp(-rect.top / distance);
    if (progressBar) progressBar.style.transform = `scaleX(${progress.toFixed(4)})`;
    setState(stateFor(progress));
  }

  function requestUpdate() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(update);
  }

  function applyMotionMode() {
    const reduced = motion.matches;
    if (stage) stage.setAttribute('aria-hidden', String(reduced));
    if (staticStory) staticStory.setAttribute('aria-hidden', String(!reduced));
    if (reduced) {
      copies.forEach((item) => item.setAttribute('aria-hidden', 'true'));
      screens.forEach((item) => item.setAttribute('aria-hidden', 'true'));
    } else {
      setState(active < 0 ? 0 : active);
      update();
    }
  }

  document.querySelectorAll('[data-story-route]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (motion.matches) return;
      const state = Number(link.getAttribute('data-story-route'));
      if (!Number.isInteger(state) || state < 0 || state >= stateTargets.length) return;
      event.preventDefault();
      const distance = Math.max(1, story.offsetHeight - window.innerHeight);
      const top = story.offsetTop + (distance * stateTargets[state]);
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  addEventListener('scroll', requestUpdate, { passive: true });
  addEventListener('resize', requestUpdate, { passive: true });
  addEventListener('pageshow', requestUpdate, { passive: true });
  if (motion.addEventListener) motion.addEventListener('change', applyMotionMode);
  else if (motion.addListener) motion.addListener(applyMotionMode);
  applyMotionMode();
})();
