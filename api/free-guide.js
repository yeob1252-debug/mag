import crypto from "node:crypto";

const INTERESTS = new Set(["", "자료부터 살펴보기", "교육 일정 문의", "교육 신청 관심"]);
const COOKIE_NAME = "matganda_fg_session";
const MAX_BODY_BYTES = 20 * 1024;

function json(res, status, body, headers = {}) {
  res.statusCode = status;
  Object.entries({ "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers }).forEach(([key, value]) => res.setHeader(key, value));
  res.end(JSON.stringify(body));
}

function parseCookies(value = "") {
  return value.split(";").reduce((result, part) => {
    const index = part.indexOf("=");
    if (index > 0) result[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
    return result;
  }, {});
}

function sign(secret, value) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function createNonce(secret, session) {
  const expires = Date.now() + 15 * 60 * 1000;
  return `${expires}.${sign(secret, `${session}.${expires}`)}`;
}

function validNonce(secret, session, token) {
  const [expiresText, signature] = String(token || "").split(".");
  const expires = Number(expiresText);
  if (!session || !expires || expires < Date.now() || expires > Date.now() + 16 * 60 * 1000 || !signature) return false;
  const expected = sign(secret, `${session}.${expires}`);
  return signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

function text(value, max) {
  return String(value || "").trim().replace(/[\u0000-\u001f\u007f]/g, "").slice(0, max);
}

function attribution(value, max) {
  const cleaned = text(value, max);
  return cleaned.includes("@") ? "" : cleaned;
}

function readBody(req) {
  if (req.body && typeof req.body === "object") return Promise.resolve(req.body);
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("body_too_large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}")); }
      catch (_) { reject(new Error("invalid_json")); }
    });
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  const webhookUrl = process.env.MATGANDA_FREE_GUIDE_WEBHOOK_URL;
  const webhookSecret = process.env.MATGANDA_FREE_GUIDE_WEBHOOK_SECRET;
  const nonceSecret = process.env.MATGANDA_FREE_GUIDE_NONCE_SECRET || webhookSecret;
  if (!webhookUrl || !webhookSecret || !nonceSecret) return json(res, 503, { ok: false, error: "integration_not_configured" });

  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
  const origin = req.headers.origin;
  if (origin) {
    try { if (new URL(origin).host !== host) return json(res, 403, { ok: false, error: "origin_rejected" }); }
    catch (_) { return json(res, 403, { ok: false, error: "origin_rejected" }); }
  }

  if (req.method === "GET") {
    const session = crypto.randomBytes(18).toString("base64url");
    const nonce = createNonce(nonceSecret, session);
    return json(res, 200, { ok: true, nonce }, { "Set-Cookie": `${COOKIE_NAME}=${encodeURIComponent(session)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=900` });
  }
  if (req.method !== "POST") return json(res, 405, { ok: false, error: "method_not_allowed" }, { Allow: "GET, POST" });

  const session = parseCookies(req.headers.cookie)[COOKIE_NAME];
  if (!validNonce(nonceSecret, session, req.headers["x-request-nonce"])) return json(res, 403, { ok: false, error: "invalid_nonce" });

  let body;
  try { body = await readBody(req); }
  catch (error) { return json(res, 400, { ok: false, error: error.message }); }

  const data = {
    submission_id: text(body.submission_id, 64),
    name: text(body.name, 40),
    email: text(body.email, 120).toLowerCase(),
    region: text(body.region, 50),
    education_interest: text(body.education_interest, 30),
    privacy_consent: body.privacy_consent === true,
    news_consent: body.news_consent === true,
    origin_page: attribution(body.origin_page, 160),
    utm_source: attribution(body.utm_source, 80),
    utm_medium: attribution(body.utm_medium, 80),
    utm_campaign: attribution(body.utm_campaign, 80),
    utm_content: attribution(body.utm_content, 80),
  };

  if (!/^(TEST-)?FG-[A-F0-9-]{36,59}$/.test(data.submission_id)) return json(res, 400, { ok: false, error: "invalid_submission_id" });
  if (!data.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || !data.privacy_consent || !INTERESTS.has(data.education_interest)) return json(res, 400, { ok: false, error: "invalid_fields" });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "freeGuideRegistration", token: webhookSecret, data }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const result = await response.json();
    if (!response.ok || !result.ok || !result.stored || !result.alertSent || result.submissionId !== data.submission_id || !result.rowNumber) throw new Error("sheet_or_alert_ack_failed");
    return json(res, 200, { ok: true, stored: true, alertSent: true, submissionId: result.submissionId, replay: Boolean(result.replay), rowNumber: result.rowNumber });
  } catch (_) {
    return json(res, 502, { ok: false, error: "sheet_unavailable" });
  }
};
