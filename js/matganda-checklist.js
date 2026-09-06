(function () {
  "use strict";

  const form = document.querySelector("#checklist-form");
  const result = document.querySelector("[data-checklist-result]");
  const status = document.querySelector("[data-form-status]");
  if (!form || !result || !status) return;

  const demo = document.querySelector("[data-checklist-demo]");
  const demoItems = [...(demo?.querySelectorAll("[data-checklist-demo-item]") || [])];
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let demoPlayed = false;
  let demoTimers = [];

  const setDemoStep = (step) => {
    const completed = Math.min(step, demoItems.length);
    demoItems.forEach((item, index) => {
      const checked = index < completed;
      const current = index === completed && completed < demoItems.length;
      item.classList.toggle("is-checked", checked);
      item.classList.toggle("is-current", current);
      if (current) item.setAttribute("aria-current", "step");
      else item.removeAttribute("aria-current");
    });
  };

  const playDemo = () => {
    if (!demo || demoPlayed) return;
    demoPlayed = true;
    demo.classList.add("is-demo-active");
    if (reducedMotion.matches) {
      setDemoStep(demoItems.length);
      return;
    }
    setDemoStep(0);
    demoTimers = demoItems.map((_, index) => setTimeout(() => setDemoStep(index + 1), 420 + index * 480));
  };

  if (demo) {
    document.documentElement.classList.add("checklist-motion-ready");
    if (reducedMotion.matches || !("IntersectionObserver" in window)) playDemo();
    else {
      const demoObserver = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        playDemo();
        demoObserver.disconnect();
      }, { threshold: 0.35 });
      demoObserver.observe(demo);
    }
    reducedMotion.addEventListener?.("change", () => {
      if (!reducedMotion.matches) return;
      demoTimers.forEach(clearTimeout);
      demoTimers = [];
      demo.classList.add("is-demo-active");
      setDemoStep(demoItems.length);
    });
  }

  const params = new URLSearchParams(window.location.search);
  const attributionKey = "matganda_free_guide_attribution_v1";
  const submissionKey = "matganda_free_guide_submission_v1";
  const attributionFields = ["utm_source", "utm_medium", "utm_campaign", "utm_content"];

  const clean = (value, max) => {
    const normalized = String(value || "").trim().replace(/[\u0000-\u001f\u007f]/g, "");
    return normalized.includes("@") ? "" : normalized.slice(0, max);
  };

  let attribution;
  try {
    attribution = JSON.parse(sessionStorage.getItem(attributionKey) || "null");
  } catch (_) {
    attribution = null;
  }
  if (!attribution) {
    attribution = attributionFields.reduce((data, key) => {
      data[key] = clean(params.get(key), 80);
      return data;
    }, {});
    attribution.origin_page = clean(params.get("origin") || window.location.pathname, 160);
    sessionStorage.setItem(attributionKey, JSON.stringify(attribution));
  }

  let submissionId = sessionStorage.getItem(submissionKey);
  if (!submissionId) {
    const isLocalTest = /^(127\.0\.0\.1|localhost)$/.test(window.location.hostname) && params.get("test") === "1";
    submissionId = `${isLocalTest ? "TEST-" : ""}FG-${crypto.randomUUID().toUpperCase()}`;
    sessionStorage.setItem(submissionKey, submissionId);
  }

  form.elements.submission_id.value = submissionId;
  form.elements.origin_page.value = attribution.origin_page || window.location.pathname;
  attributionFields.forEach((key) => {
    form.elements[key].value = attribution[key] || "";
  });

  let nonce = "";
  const getNonce = async () => {
    const response = await fetch("/api/free-guide/nonce", { credentials: "same-origin" });
    const data = await response.json();
    if (!response.ok || !data.ok || !data.nonce) throw new Error("nonce_unavailable");
    nonce = data.nonce;
    return nonce;
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const submitButton = form.querySelector("button[type=submit]");
    submitButton.disabled = true;
    status.dataset.kind = "pending";
    status.textContent = "접수 내용을 확인하고 있습니다.";

    const payload = Object.fromEntries(new FormData(form).entries());
    payload.privacy_consent = form.elements.privacy_consent.checked;
    payload.news_consent = form.elements.news_consent.checked;

    try {
      if (!nonce) await getNonce();
      let response = await fetch("/api/free-guide", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "X-Request-Nonce": nonce },
        body: JSON.stringify(payload),
      });
      if (response.status === 403) {
        await getNonce();
        response = await fetch("/api/free-guide", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json", "X-Request-Nonce": nonce },
          body: JSON.stringify(payload),
        });
      }
      const data = await response.json();
      if (!response.ok || !data.ok || data.submissionId !== submissionId) throw new Error(data.error || "save_failed");

      status.dataset.kind = "success";
      status.textContent = "접수가 확인되었습니다. 아래에서 점검표를 바로 확인하세요.";
      result.hidden = false;
      result.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (_) {
      status.dataset.kind = "error";
      status.textContent = "저장 확인이 완료되지 않았습니다. 입력 내용은 그대로 두었습니다. 다시 시도해 주세요.";
    } finally {
      submitButton.disabled = false;
    }
  });

  getNonce().catch(() => {
    status.dataset.kind = "error";
    status.textContent = "현재 접수 연결을 준비 중입니다. 잠시 후 다시 시도해 주세요.";
  });
})();
