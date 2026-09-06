(() => {
  'use strict';

  const gallery = document.querySelector('[data-phone-scene]');
  const hero = document.querySelector('.m-hero');
  const phoneTabs = [...document.querySelectorAll('[data-phone-tab]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const motionToggle = document.querySelector('[data-motion-toggle]');
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function selectTabs(selected) {
    phoneTabs.forEach(tab => {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
  }

  function setPhone(name) {
    if (!gallery) return;
    const tab = phoneTabs.find(item => item.dataset.phoneTab === name);
    gallery.dataset.active = name;
    if (tab) selectTabs(tab);
  }

  if (gallery && hero) {
    let swipeStart = null;
    gallery.addEventListener('dragstart', event => event.preventDefault());
    gallery.addEventListener('pointerdown', event => {
      swipeStart = {x: event.clientX, y: event.clientY};
      gallery.setPointerCapture?.(event.pointerId);
    }, {passive: true});
    gallery.addEventListener('pointerup', event => {
      if (!swipeStart) return;
      const dx = event.clientX - swipeStart.x;
      const dy = event.clientY - swipeStart.y;
      swipeStart = null;
      const current = Number(hero.dataset.storyIndex);
      if (current < 1 || current > 3 || Math.abs(dx) < 42 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
      const next = clamp(current + (dx < 0 ? 1 : -1), 1, 3);
      window.matgamsaScrollStories?.goTo(hero, next);
    }, {passive: true});
    gallery.addEventListener('pointercancel', () => { swipeStart = null; }, {passive: true});
  }

  const fullPrompt = '이 메뉴의 매력을 20초 영상으로 담는 순서를 짜줘.';
  const promptNode = document.querySelector('[data-demo-prompt]');
  const demoRows = [...document.querySelectorAll('[data-demo-row]')];
  const recordTime = document.querySelector('[data-record-time]');
  let demoFrame = 0;
  let heroInView = false;
  let demoPaused = false;
  let demoOrigin = performance.now();
  let pausedAt = 0;
  let lastPromptLength = -1;

  function stageIsVisible() {
    return hero && ['plan', 'shoot', 'fan', 'merge'].includes(hero.dataset.heroStage);
  }

  function setStaticDemo() {
    if (!gallery || !promptNode || !recordTime) return;
    gallery.dataset.demoPhase = '5';
    gallery.dataset.shareState = 'feed';
    gallery.classList.remove('demo-running');
    promptNode.textContent = fullPrompt;
    demoRows.forEach(row => row.classList.add('is-revealed'));
    recordTime.textContent = '00:08';
  }

  function renderDemo(now) {
    demoFrame = 0;
    if (!gallery || !promptNode || !recordTime || reduced.matches || demoPaused || !heroInView || !stageIsVisible() || document.hidden) return;
    const elapsed = (now - demoOrigin) % 9000;
    const promptLength = Math.min(fullPrompt.length, Math.floor(elapsed / 58));
    if (promptLength !== lastPromptLength) {
      promptNode.textContent = fullPrompt.slice(0, promptLength);
      lastPromptLength = promptLength;
    }
    demoRows.forEach((row, index) => row.classList.toggle('is-revealed', elapsed > 2350 + index * 620));
    gallery.dataset.demoPhase = String(Math.min(5, Math.floor(elapsed / 1500)));
    gallery.dataset.shareState = elapsed < 2700 ? 'edit' : elapsed < 5000 ? 'caption' : elapsed < 6900 ? 'upload' : 'feed';
    recordTime.textContent = `00:${String(Math.min(8, Math.floor(elapsed / 1000))).padStart(2, '0')}`;
    gallery.classList.add('demo-running');
    demoFrame = requestAnimationFrame(renderDemo);
  }

  function syncDemo() {
    if (demoFrame) cancelAnimationFrame(demoFrame);
    demoFrame = 0;
    if (reduced.matches) {
      setStaticDemo();
      motionToggle?.setAttribute('hidden', '');
      return;
    }
    motionToggle?.removeAttribute('hidden');
    const running = !demoPaused && heroInView && stageIsVisible() && !document.hidden;
    gallery?.classList.toggle('demo-running', running);
    if (running) demoFrame = requestAnimationFrame(renderDemo);
  }

  if (hero && gallery) {
    const heroObserver = new IntersectionObserver(entries => {
      heroInView = entries[0]?.isIntersecting ?? false;
      syncDemo();
    }, {threshold: 0.04});
    heroObserver.observe(hero);
    hero.addEventListener('matgamsa:storychange', syncDemo);
    document.addEventListener('visibilitychange', syncDemo);
    reduced.addEventListener?.('change', syncDemo);
    motionToggle?.addEventListener('click', () => {
      demoPaused = !demoPaused;
      if (demoPaused) pausedAt = performance.now();
      else demoOrigin += performance.now() - pausedAt;
      motionToggle.setAttribute('aria-pressed', String(demoPaused));
      motionToggle.setAttribute('aria-label', demoPaused ? '화면 모션 재생' : '화면 모션 일시정지');
      motionToggle.title = demoPaused ? '화면 모션 재생' : '화면 모션 일시정지';
      motionToggle.querySelector('[data-pause-icon]').hidden = demoPaused;
      motionToggle.querySelector('[data-play-icon]').hidden = !demoPaused;
      syncDemo();
    });
  }

  if ('IntersectionObserver' in window && !reduced.matches) {
    document.documentElement.classList.add('motion-ready');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {threshold: 0.08});
    document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
  }

  const assetStory = document.querySelector('[data-asset-story]');
  const saveDemo = assetStory?.querySelector('[data-save-demo]');
  const saveLabel = assetStory?.querySelector('[data-save-label]');
  let assetFrame = 0;
  let lastAssetStage = -1;

  function setSaveState(saved) {
    if (!saveDemo || !saveLabel) return;
    saveDemo.setAttribute('aria-pressed', String(saved));
    saveDemo.setAttribute('aria-label', saved ? '책갈피 저장됨' : '책갈피 저장');
    saveDemo.title = saved ? '책갈피 저장됨' : '책갈피 저장';
    saveLabel.textContent = saved ? '저장됨' : '책갈피 저장';
  }

  function updateAssetStory() {
    assetFrame = 0;
    if (!assetStory) return;
    if (reduced.matches) {
      assetStory.style.setProperty('--asset-progress', '1');
      assetStory.dataset.assetStage = '2';
      setSaveState(true);
      lastAssetStage = 2;
      return;
    }
    const rect = assetStory.getBoundingClientRect();
    const progress = clamp((innerHeight * .88 - rect.top) / (innerHeight * .58 + rect.height), 0, 1);
    assetStory.style.setProperty('--asset-progress', String(progress));
    const stage = Math.min(2, Math.floor(progress * 3));
    assetStory.dataset.assetStage = String(stage);
    if (stage !== lastAssetStage) {
      setSaveState(stage >= 1);
      lastAssetStage = stage;
    }
  }
  function requestAssetUpdate() {
    if (!assetFrame) assetFrame = requestAnimationFrame(updateAssetStory);
  }
  if (assetStory) {
    addEventListener('scroll', requestAssetUpdate, {passive: true});
    addEventListener('resize', requestAssetUpdate, {passive: true});
    reduced.addEventListener?.('change', requestAssetUpdate);
    saveDemo?.addEventListener('click', () => setSaveState(saveDemo.getAttribute('aria-pressed') !== 'true'));
    updateAssetStory();
  }

  const freeGuideDemo = document.querySelector('[data-free-guide-demo]');
  const freeGuideItems = [...(freeGuideDemo?.querySelectorAll('[data-guide-check]') || [])];
  const freeGuideCount = freeGuideDemo?.querySelector('[data-guide-count]');
  let freeGuidePlayed = false;
  let freeGuideTimers = [];

  function setFreeGuideStep(step) {
    const completed = Math.min(step, freeGuideItems.length);
    freeGuideItems.forEach((item, index) => {
      const checked = index < completed;
      const current = index === completed && completed < freeGuideItems.length;
      item.classList.toggle('is-checked', checked);
      item.classList.toggle('is-current', current);
      if (current) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
    if (freeGuideCount) freeGuideCount.textContent = `${completed} / ${freeGuideItems.length}`;
  }

  function playFreeGuide() {
    if (!freeGuideDemo || freeGuidePlayed) return;
    freeGuidePlayed = true;
    freeGuideDemo.classList.add('is-demo-active');
    if (reduced.matches) {
      setFreeGuideStep(freeGuideItems.length);
      return;
    }
    setFreeGuideStep(0);
    freeGuideTimers = freeGuideItems.map((_, index) => setTimeout(() => {
      setFreeGuideStep(index + 1);
    }, 520 + index * 520));
  }

  if (freeGuideDemo) {
    if (reduced.matches || !('IntersectionObserver' in window)) playFreeGuide();
    else {
      const freeGuideObserver = new IntersectionObserver(entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        playFreeGuide();
        freeGuideObserver.disconnect();
      }, {threshold: 0.3});
      freeGuideObserver.observe(freeGuideDemo);
    }
    reduced.addEventListener?.('change', () => {
      if (!reduced.matches) return;
      freeGuideTimers.forEach(clearTimeout);
      freeGuideTimers = [];
      freeGuideDemo.classList.add('is-demo-active');
      setFreeGuideStep(freeGuideItems.length);
    });
  }

  window.matgamsaMotionV3 = {setPhone};
})();
