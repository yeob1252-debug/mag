(function () {
  "use strict";

  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content"];
  const current = new URLSearchParams(window.location.search);
  const values = keys.reduce((result, key) => {
    const value = (current.get(key) || "").trim().slice(0, 80);
    if (value && !value.includes("@")) result[key] = value;
    return result;
  }, {});

  document.querySelectorAll("a[data-preserve-attribution]").forEach((link) => {
    const url = new URL(link.href, window.location.href);
    Object.entries(values).forEach(([key, value]) => url.searchParams.set(key, value));
    link.href = url.href;
  });
})();
