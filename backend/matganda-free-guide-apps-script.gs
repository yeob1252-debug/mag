const FREE_GUIDE_SHEET_ID = "1KT79dBOkepdroHUwiYJ-81kkHcXPTXTGFWPLXqKg2ec";
const FREE_GUIDE_SHEET_NAME = "접수내역";

function freeGuideJson_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function freeGuideText_(value, maxLength) {
  return String(value || "").trim().replace(/[\u0000-\u001f\u007f]/g, "").slice(0, maxLength);
}

function doPost(e) {
  var lock;
  try {
    var body = JSON.parse(e && e.postData && e.postData.contents || "{}");
    var secret = PropertiesService.getScriptProperties().getProperty("FREE_GUIDE_WEBHOOK_SECRET");
    if (!secret || body.token !== secret || body.action !== "freeGuideRegistration") return freeGuideJson_({ ok: false, error: "unauthorized" });

    var data = body.data || {};
    var submissionId = freeGuideText_(data.submission_id, 64);
    var name = freeGuideText_(data.name, 40);
    var email = freeGuideText_(data.email, 120).toLowerCase();
    var interest = freeGuideText_(data.education_interest, 30);
    var interests = ["", "자료부터 살펴보기", "교육 일정 문의", "교육 신청 관심"];
    if (!/^(TEST-)?FG-[A-F0-9-]{36,59}$/.test(submissionId) || !name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || data.privacy_consent !== true || interests.indexOf(interest) < 0) return freeGuideJson_({ ok: false, error: "invalid_fields" });

    lock = LockService.getScriptLock();
    lock.waitLock(10000);
    var sheet = SpreadsheetApp.openById(FREE_GUIDE_SHEET_ID).getSheetByName(FREE_GUIDE_SHEET_NAME);
    if (!sheet) throw new Error("sheet_not_found");

    var lastRow = sheet.getLastRow();
    var properties = PropertiesService.getScriptProperties();
    var alertKey = "FREE_GUIDE_ALERT_" + submissionId;
    if (lastRow > 1) {
      var existing = sheet.getRange(2, 1, lastRow - 1, 1).createTextFinder(submissionId).matchEntireCell(true).findNext();
      if (existing) {
        var previousAlertSent = properties.getProperty(alertKey) === "sent";
        return freeGuideJson_({ ok: previousAlertSent, replay: true, stored: true, alertSent: previousAlertSent, submissionId: submissionId, rowNumber: existing.getRow(), error: previousAlertSent ? "" : "alert_failed" });
      }
    }

    var now = new Date();
    sheet.appendRow([
      submissionId, now, name, email, freeGuideText_(data.region, 50), interest,
      "동의", data.news_consent === true ? "동의" : "미동의", now, "무료 점검표",
      freeGuideText_(data.origin_page, 160), freeGuideText_(data.utm_source, 80), freeGuideText_(data.utm_medium, 80),
      freeGuideText_(data.utm_campaign, 80), freeGuideText_(data.utm_content, 80), "신규", "", ""
    ]);
    var rowNumber = sheet.getLastRow();
    sheet.getRange(rowNumber, 2).setNumberFormat("yyyy-mm-dd hh:mm:ss");
    sheet.getRange(rowNumber, 9).setNumberFormat("yyyy-mm-dd hh:mm:ss");
    SpreadsheetApp.flush();
    try {
      var subjectPrefix = submissionId.indexOf("TEST-") === 0 ? "[TEST] " : "";
      MailApp.sendEmail({
        to: "kimth7620@naver.com",
        subject: subjectPrefix + "[맛간다 무료 점검표] 신규 접수 " + submissionId,
        body: [
          "맛간다챌린지 무료 점검표 신청이 접수되었습니다.",
          "",
          "신청 ID: " + submissionId,
          "이름: " + name,
          "이메일: " + email,
          "활동 지역: " + (freeGuideText_(data.region, 50) || "미입력"),
          "교육 관심도: " + (interest || "미선택"),
          "교육 모집 소식 수신: " + (data.news_consent === true ? "동의" : "미동의"),
          "유입 페이지: " + (freeGuideText_(data.origin_page, 160) || "미확인"),
          "UTM: " + [freeGuideText_(data.utm_source, 80), freeGuideText_(data.utm_medium, 80), freeGuideText_(data.utm_campaign, 80), freeGuideText_(data.utm_content, 80)].join(" / "),
          "",
          "처리 상태는 신청관리 시트에서 변경해 주세요."
        ].join("\n"),
        name: "맛집감별사"
      });
      properties.setProperty(alertKey, "sent");
    } catch (mailError) {
      properties.setProperty(alertKey, "failed");
      return freeGuideJson_({ ok: false, replay: false, stored: true, alertSent: false, submissionId: submissionId, rowNumber: rowNumber, error: "alert_failed" });
    }
    return freeGuideJson_({ ok: true, replay: false, stored: true, alertSent: true, submissionId: submissionId, rowNumber: rowNumber });
  } catch (error) {
    return freeGuideJson_({ ok: false, error: "save_failed" });
  } finally {
    if (lock) lock.releaseLock();
  }
}
