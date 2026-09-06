(() => {
  'use strict';

  const lessonFlow = document.querySelector('.course-flow');
  if (lessonFlow && !lessonFlow.matches('[data-scroll-story]')) {
    const lessonSteps = [...lessonFlow.querySelectorAll('[data-lesson]')];
    const lessonScreens = [...lessonFlow.querySelectorAll('[data-lesson-screen]')];
    const setLesson = (name) => {
      const index = Math.max(0,lessonSteps.findIndex(step => step.dataset.lesson === name));
      lessonFlow.dataset.courseLesson = name;
      lessonFlow.style.setProperty('--lesson-progress',String((index + 1) / lessonSteps.length));
      lessonSteps.forEach(step => {
        if (step.dataset.lesson === name) step.setAttribute('aria-current','step');
        else step.removeAttribute('aria-current');
      });
      lessonScreens.forEach(screen => screen.setAttribute('aria-hidden',String(screen.dataset.lessonScreen !== name)));
    };

    let lessonFrame = 0;
    const updateLesson = () => {
      lessonFrame = 0;
      const targetY = innerHeight * (innerWidth <= 700 ? .68 : .52);
      const closest = lessonSteps.map(step => {
        const rect = step.getBoundingClientRect();
        return { step, distance:Math.abs(rect.top + rect.height * .5 - targetY) };
      }).sort((a,b) => a.distance - b.distance)[0];
      if (closest) setLesson(closest.step.dataset.lesson);
    };
    const requestLessonUpdate = () => {
      if (lessonFrame) return;
      lessonFrame = requestAnimationFrame(updateLesson);
    };
    addEventListener('scroll',requestLessonUpdate,{ passive:true });
    addEventListener('resize',requestLessonUpdate,{ passive:true });
    updateLesson();
  }

  const calendar = document.querySelector('.course-calendar');
  if (calendar) {
    const title = calendar.querySelector('[data-calendar-title]');
    const grid = calendar.querySelector('[data-calendar-grid]');
    const status = calendar.querySelector('[data-calendar-status]');
    const previous = calendar.querySelector('[data-calendar-prev]');
    const next = calendar.querySelector('[data-calendar-next]');
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
  }

  const form = document.querySelector('#courseApplicationForm');
  if (!form) return;
  const button = form.querySelector('button[type="submit"]');
  const status = form.querySelector('[data-application-status]');
  const requiredControls = [...form.querySelectorAll('[required]')];

  const setStatus = (message, className) => {
    status.textContent = message;
    status.className = `application-status ${className}`.trim();
  };

  function clearInvalid(control) {
    control.removeAttribute('aria-invalid');
    const group = control.closest('[data-required-group]');
    group?.removeAttribute('aria-invalid');
  }

  function validate() {
    requiredControls.forEach(clearInvalid);
    const invalid = [];
    const radioGroups = new Set();

    requiredControls.forEach(control => {
      if (control.type === 'radio') {
        if (radioGroups.has(control.name)) return;
        radioGroups.add(control.name);
        if (!form.querySelector(`[name="${control.name}"]:checked`)) {
          const first = form.querySelector(`[name="${control.name}"]`);
          first.setAttribute('aria-invalid','true');
          first.closest('[data-required-group]')?.setAttribute('aria-invalid','true');
          invalid.push(first);
        }
        return;
      }
      if (!control.checkValidity()) {
        control.setAttribute('aria-invalid','true');
        invalid.push(control);
      }
    });

    if (invalid.length) {
      setStatus('필수 항목과 개인정보 동의를 확인해 주세요.','is-error');
      invalid[0].focus({ preventScroll:true });
      invalid[0].scrollIntoView({ behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'center' });
      return false;
    }

    return true;
  }

  form.addEventListener('submit',async event => {
    event.preventDefault();
    if (!validate() || button.disabled) return;
    const original = button.innerHTML;
    button.disabled = true;
    button.textContent = '접수 중...';
    setStatus('기존 맛간다챌린지 신청 DB로 접수 내용을 전송하고 있습니다.','');
    try {
      await fetch(form.action, {
        method:'POST',
        mode:'no-cors',
        headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},
        body:new URLSearchParams(new FormData(form)),
      });
      setStatus('신청이 접수되었습니다. 확인 후 안내드리겠습니다.','is-preview-valid');
      form.reset();
    } catch (_) {
      setStatus('접수 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.','is-error');
    } finally {
      button.disabled = false;
      button.innerHTML = original;
    }
  });
  requiredControls.forEach(control => {
    control.addEventListener('input',() => clearInvalid(control));
    control.addEventListener('change',() => clearInvalid(control));
  });
})();
