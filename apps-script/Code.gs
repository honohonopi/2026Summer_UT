const SPREADSHEET_ID = "1VqFrjrXuGtHOBU8Eym29aKhHqNTgLpVenNryhJ2nNC0";
const SHEET_NAME = "シート1";
const MEMBERS = [
  ["すいば", "red", "", ""],
  ["聖成", "blue", "", ""],
  ["モナ", "orange", "", ""],
  ["ゆうり", "blue", "", ""],
  ["あずき", "pink", "", ""],
];

function setupSheet() {
  const sheet = getSheet();
  sheet.clear();
  sheet.getRange(1, 1, 1, 4).setValues([["name", "color", "url", "comment"]]);
  sheet.getRange(2, 1, MEMBERS.length, 4).setValues(MEMBERS);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, 4);
}

function doPost(event) {
  const name = String(event.parameter.name || "").trim();
  const url = String(event.parameter.url || "").trim();
  const member = MEMBERS.find((item) => item[0] === name);

  if (!member || !/^https?:\/\/\S+$/i.test(url)) {
    return jsonResponse({ ok: false, error: "invalid_request" });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = getSheet();
    ensureSheetData(sheet);
    const names = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 1), 1).getValues();
    const rowIndex = names.findIndex((row) => row[0] === name);

    if (rowIndex === -1) {
      sheet.appendRow([name, member[1], url, ""]);
    } else {
      sheet.getRange(rowIndex + 2, 3).setValue(url);
    }

    SpreadsheetApp.flush();
    return jsonResponse({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return jsonResponse({ ok: true });
}

function getSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  return spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
}

function ensureSheetData(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 4).setValues([["name", "color", "url", "comment"]]);
    sheet.getRange(2, 1, MEMBERS.length, 4).setValues(MEMBERS);
  }
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
