(() => {
  'use strict';

  const roots = [...document.querySelectorAll('[data-scroll-story]')];
  if (!roots.length) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 700px)');
  const courseNames = ['setup', 'ai', 'shoot', 'edit', 'upload'];
  const heroNames = ['intro', 'plan', 'shoot', 'fan', 'merge', 'statement', 'final'];
  const courseHeroNames = ['phones', 'focus', 'merge', 'copy', 'final'];
  const priceOrder = [0, 1, 2, 1];
  const clamp = value => Math.min(1, Math.max(0, value));
  const smooth = value => value * value * (3 - 2 * value);
  let frame = 0;

  const stories = roots.map(root => {
    const kind = root.dataset.storyKind || '';
    const steps = kind === 'course' ? [...root.querySelectorAll('[data-lesson]')] : [];
    const count = Number(root.dataset.storyCount) || steps.length || 1;
    return {
      root,
      kind,
      count,
      steps,
      jumps: [...root.querySelectorAll('[data-story-jump]')],
      viewportHeight: innerHeight,
      viewportWidth: innerWidth,
      index: -1
    };
  });

  function selectJumps(story, selectedIndex) {
    story.jumps.forEach(button => {
      const active = Number(button.dataset.storyJump) === selectedIndex;
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
  }

  function setHomeHero(story, index) {
    const stage = heroNames[index];
    const phoneName = index === 1 ? 'plan' : index === 2 ? 'shoot' : index >= 3 ? 'share' : 'plan';
    story.root.dataset.heroStage = stage;
    window.matgamsaMotionV3?.setPhone(phoneName);
    selectJumps(story, index);
    story.root.dispatchEvent(new CustomEvent('matgamsa:storychange', {detail: {kind: story.kind, index, stage}}));
  }

  function setBenefits(story, index) {
    story.root.querySelectorAll('[data-benefit-step]').forEach((step, stepIndex) => {
      if (stepIndex === index) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    });
    story.root.querySelectorAll('[data-benefit-screen]').forEach(screen => {
      screen.setAttribute('aria-hidden', String(Number(screen.dataset.benefitScreen) !== index));
    });
    const finalAction = story.root.querySelector('.benefit-final-action');
    if (finalAction) {
      const hidden = !reduced.matches && index !== 2;
      finalAction.setAttribute('aria-hidden', String(hidden));
      finalAction.inert = hidden;
    }
    selectJumps(story, index);
    story.root.dispatchEvent(new CustomEvent('matgamsa:storychange', {detail: {kind: story.kind, index}}));
  }

  function setOwner(story, index) {
    story.root.querySelectorAll('.owner-steps li').forEach((step, stepIndex) => {
      if (stepIndex === index) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    });
  }

  function setPriceAccess(story, active) {
    const collapse = mobile.matches && !reduced.matches;
    story.root.querySelectorAll('[data-price-card]').forEach((card, cardIndex) => {
      const hidden = collapse && cardIndex !== active;
      card.setAttribute('aria-hidden', String(hidden));
      card.inert = hidden;
    });
  }

  function setPricing(story, index) {
    const active = priceOrder[index];
    story.root.dataset.priceActive = String(active);
    story.root.querySelectorAll('[data-price-card]').forEach((card, cardIndex) => {
      card.dataset.active = String(cardIndex === active);
    });
    selectJumps(story, active);
    setPriceAccess(story, active);
  }

  function setCourseHero(story, index) {
    const stage = courseHeroNames[index];
    story.root.dataset.courseHeroStage = stage;
    story.root.querySelectorAll('.course-phone').forEach((phone, phoneIndex) => {
      if (index === 1 && phoneIndex === 1) phone.setAttribute('aria-current', 'step');
      else phone.removeAttribute('aria-current');
    });
    selectJumps(story, index);
  }

  function setCreatorRegistration(story, index) {
    story.root.querySelectorAll('[data-creator-step]').forEach((step, stepIndex) => {
      if (stepIndex === index) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    });
    story.root.querySelectorAll('[data-creator-screen]').forEach(screen => {
      screen.setAttribute('aria-hidden', String(Number(screen.dataset.creatorScreen) !== index));
    });
    const action = story.root.querySelector('.creator-registration-action');
    if (action) {
      const hidden = !reduced.matches && index !== story.count - 1;
      action.setAttribute('aria-hidden', String(hidden));
      action.inert = hidden;
    }
    selectJumps(story, index);
  }

  function setVars(root, values) {
    Object.entries(values).forEach(([name, value]) => root.style.setProperty(name, String(value)));
  }

  function updateContinuous(story, index, localProgress) {
    const t = smooth(localProgress);
    if (story.kind === 'home-hero' && index === 4) {
      const inverse = 1 - t;
      const offset = mobile.matches ? 86 : innerWidth <= 1000 ? 210 : 235;
      setVars(story.root, {
        '--merge-plan-x': `${-offset * inverse}px`,
        '--merge-shoot-x': `${offset * inverse}px`,
        '--merge-plan-rotate': `${-8 * inverse}deg`,
        '--merge-shoot-rotate': `${8 * inverse}deg`,
        '--merge-plan-scale': .92 - .16 * t,
        '--merge-shoot-scale': .92 - .16 * t,
        '--merge-share-scale': 1.06 - .28 * t,
        '--merge-side-opacity': Math.max(0, .72 - t * .88),
        '--merge-front-opacity': Math.max(0, 1 - t * 1.18),
        '--merge-y': `${12 * t}px`
      });
    }
    if (story.kind === 'course-hero' && index === 2) {
      const inverse = 1 - t;
      const offset = mobile.matches ? 88 : innerWidth <= 1000 ? 205 : 245;
      setVars(story.root, {
        '--course-plan-x': `${-offset * inverse}px`,
        '--course-upload-x': `${offset * inverse}px`,
        '--course-plan-rotate': `${-8 * inverse}deg`,
        '--course-upload-rotate': `${8 * inverse}deg`,
        '--course-side-scale': .92 - .14 * t,
        '--course-front-scale': 1.04 - .24 * t,
        '--course-side-opacity': Math.max(0, .78 - t * .94),
        '--course-front-opacity': Math.max(0, 1 - t * 1.18),
        '--course-merge-y': `${12 * t}px`
      });
    }
  }

  function setCourseStory(story, index, progress) {
    const name = courseNames[index];
    story.root.dataset.courseLesson = name;
    story.root.style.setProperty('--lesson-progress', String(Math.max(.025, progress)));
    story.steps.forEach((step, stepIndex) => {
      if (stepIndex === index) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
      step.tabIndex = stepIndex === index ? 0 : -1;
    });
    story.root.querySelectorAll('[data-lesson-screen]').forEach(screen => {
      screen.setAttribute('aria-hidden', String(screen.dataset.lessonScreen !== name));
    });
    selectJumps(story, index);
  }

  function applyStage(story, index, progress) {
    if (story.kind === 'home-hero') setHomeHero(story, index);
    else if (story.kind === 'benefits') setBenefits(story, index);
    else if (story.kind === 'owner') setOwner(story, index);
    else if (story.kind === 'pricing') setPricing(story, index);
    else if (story.kind === 'course-hero') setCourseHero(story, index);
    else if (story.kind === 'course') setCourseStory(story, index, progress);
    else if (story.kind === 'creator-registration') setCreatorRegistration(story, index);
  }

  function setStory(story, index, progress, localProgress, force = false) {
    story.root.style.setProperty('--story-progress', String(progress));
    story.root.style.setProperty('--story-local', String(localProgress));
    updateContinuous(story, index, localProgress);
    if (!force && story.index === index) return;
    story.index = index;
    story.root.dataset.storyIndex = String(index);
    applyStage(story, index, progress);
  }

  function geometry(story) {
    const top = scrollY + story.root.getBoundingClientRect().top;
    const range = Math.max(1, story.root.offsetHeight - story.viewportHeight);
    return {top, range};
  }

  function update() {
    frame = 0;
    if (reduced.matches) return;
    stories.forEach(story => {
      const {top, range} = geometry(story);
      const progress = clamp((scrollY - top) / range);
      const scaled = progress * story.count;
      const index = Math.min(story.count - 1, Math.floor(scaled));
      setStory(story, index, progress, Math.min(1, scaled - index));
    });
  }

  function requestUpdate() {
    if (!frame) frame = requestAnimationFrame(update);
  }

  function goTo(storyOrRoot, requestedIndex, focusTarget) {
    const story = storyOrRoot.root ? storyOrRoot : stories.find(item => item.root === storyOrRoot);
    if (!story) return;
    const index = Math.min(story.count - 1, Math.max(0, Number(requestedIndex) || 0));
    const {top, range} = geometry(story);
    const progress = (index + .5) / story.count;
    scrollTo({top: top + range * progress, behavior: reduced.matches ? 'auto' : 'smooth'});
    focusTarget?.focus({preventScroll: true});
  }

  stories.forEach(story => {
    story.steps.forEach((step, index) => {
      step.addEventListener('click', () => goTo(story, index, step));
      step.addEventListener('keydown', event => {
        if (['Enter', ' '].includes(event.key)) {
          event.preventDefault();
          goTo(story, index, step);
          return;
        }
        const delta = ['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : ['ArrowUp', 'ArrowLeft'].includes(event.key) ? -1 : 0;
        if (!delta && !['Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? story.steps.length - 1 : Math.min(story.steps.length - 1, Math.max(0, index + delta));
        goTo(story, next, story.steps[next]);
      });
    });

    story.jumps.forEach((button, buttonIndex) => {
      const targetIndex = Number(button.dataset.storyJump);
      button.addEventListener('click', () => goTo(story, targetIndex, button));
      button.addEventListener('keydown', event => {
        const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
        if (!delta) return;
        event.preventDefault();
        const nextButtonIndex = Math.min(story.jumps.length - 1, Math.max(0, buttonIndex + delta));
        const nextButton = story.jumps[nextButtonIndex];
        goTo(story, Number(nextButton.dataset.storyJump), nextButton);
      });
    });
  });

  function handleResize() {
    stories.forEach(story => {
      if (story.viewportWidth !== innerWidth) {
        story.viewportWidth = innerWidth;
        story.viewportHeight = innerHeight;
      }
      if (story.kind === 'pricing') setPriceAccess(story, priceOrder[Math.max(0, story.index)]);
    });
    requestUpdate();
  }

  function syncReduced() {
    document.documentElement.classList.toggle('story-reduced', reduced.matches);
    if (reduced.matches) {
      stories.forEach(story => {
        const staticIndex = story.kind === 'home-hero' || story.kind === 'course-hero' || story.kind === 'creator-registration' ? story.count - 1 : story.kind === 'owner' ? 2 : story.kind === 'pricing' ? 1 : 0;
        setStory(story, staticIndex, 1, 1, true);
      });
      return;
    }
    stories.forEach(story => {
      if (story.kind === 'pricing') setPriceAccess(story, priceOrder[Math.max(0, story.index)]);
    });
    requestUpdate();
  }

  addEventListener('scroll', requestUpdate, {passive: true});
  addEventListener('resize', handleResize, {passive: true});
  reduced.addEventListener?.('change', syncReduced);
  mobile.addEventListener?.('change', handleResize);
  window.matgamsaScrollStories = {goTo};
  syncReduced();
})();
