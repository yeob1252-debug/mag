const CREATOR_ALERT_RECIPIENT = "kimth7620@naver.com";

function creatorField_(namedValues, name) {
  var values = namedValues[name] || [];
  return String(values[0] || "").trim();
}

function onCreatorRegistrationSubmit(e) {
  if (!e || !e.range || !e.namedValues) throw new Error("missing_form_event");

  var sheet = e.range.getSheet();
  var rowNumber = e.range.getRow();
  var channelName = creatorField_(e.namedValues, "채널명");
  var properties = PropertiesService.getScriptProperties();
  var alertKey = "CREATOR_ALERT_" + sheet.getSheetId() + "_" + rowNumber;
  var lock = LockService.getScriptLock();

  lock.waitLock(10000);
  try {
    if (properties.getProperty(alertKey) === "sent") return;

    var isTest = /^\[TEST\]/i.test(channelName);
    MailApp.sendEmail({
      to: CREATOR_ALERT_RECIPIENT,
      subject: (isTest ? "[TEST] " : "") + "[맛집감별사 크리에이터 등록] 신규 접수 " + channelName,
      body: [
        "맛집감별사 크리에이터 무료 등록이 접수되었습니다.",
        "",
        "접수 행: " + rowNumber,
        "접수 시각: " + creatorField_(e.namedValues, "Timestamp"),
        "채널명: " + channelName,
        "활동 채널: " + creatorField_(e.namedValues, "활동 채널 (해당하는 것 모두 선택)"),
        "활동 지역: " + creatorField_(e.namedValues, "활동 지역"),
        "콘텐츠 스타일: " + creatorField_(e.namedValues, "콘텐츠 스타일"),
        "연락처: " + creatorField_(e.namedValues, "연락처(문자/카카오톡)"),
        "",
        isTest ? "테스트 접수입니다. 실제 고객 집계에서 제외해 주세요." : "응답 시트에서 등록 내용을 확인해 주세요."
      ].join("\n"),
      name: "맛집감별사"
    });
    properties.setProperty(alertKey, "sent");
  } finally {
    lock.releaseLock();
  }
}

function installCreatorRegistrationTrigger() {
  var exists = ScriptApp.getProjectTriggers().some(function (trigger) {
    return trigger.getHandlerFunction() === "onCreatorRegistrationSubmit";
  });
  if (!exists) {
    ScriptApp.newTrigger("onCreatorRegistrationSubmit")
      .forSpreadsheet(SpreadsheetApp.getActive())
      .onFormSubmit()
      .create();
  }
}
