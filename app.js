const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1VqFrjrXuGtHOBU8Eym29aKhHqNTgLpVenNryhJ2nNC0/export?format=csv&gid=0";
const SHEET_QUERY_PARAM = "sheet";

const fallbackMembers = [
  {
    name: "すいば",
    color: "red",
    url: "https://example.com/suiba",
    comment: "赤Tシャツ担当。Gemini Canvas の共有リンクをここに入れる。",
  },
  {
    name: "聖成",
    color: "blue",
    url: "https://example.com/seisei",
    comment: "青Tシャツ担当。公開後は各自のリンク差し替えだけで運用可能。",
  },
  {
    name: "モナ",
    color: "orange",
    url: "https://example.com/mona",
    comment: "オレンジTシャツ担当。コメント欄はひとこと紹介に使える。",
  },
  {
    name: "ゆうり",
    color: "blue",
    url: "https://example.com/yuuri",
    comment: "青Tシャツ担当。カードの色はTシャツ色と連動。",
  },
  {
    name: "あずき",
    color: "pink",
    url: "https://example.com/azuki",
    comment: "ピンクTシャツ担当。CSVに name / color / url / comment を持たせる。",
  },
];

const colorMap = new Set(["red", "blue", "orange", "pink"]);

async function loadMembers() {
  const sheetUrl =
    new URLSearchParams(window.location.search).get(SHEET_QUERY_PARAM) || SHEET_CSV_URL;

  if (!sheetUrl) {
    setSourceLabel("ローカルのサンプルデータを表示中");
    return fallbackMembers;
  }

  try {
    const response = await fetch(sheetUrl, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status}`);
    }

    const csvText = await response.text();
    const parsed = parseCsv(csvText);
    const members = parsed
      .map(normalizeMember)
      .filter((member) => member.name && member.url);

    if (!members.length) {
      throw new Error("No valid rows in CSV");
    }

    setSourceLabel("公開Googleスプレッドシートのデータを表示中");
    return members;
  } catch (error) {
    console.error(error);
    setSourceLabel("CSVの読み込みに失敗したため、サンプルデータを表示中");
    return fallbackMembers;
  }
}

function parseCsv(text) {
  const rows = [];
  let current = "";
  let row = [];
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (insideQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === "," && !insideQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(current);
      if (row.some((cell) => cell.trim() !== "")) {
        rows.push(row);
      }
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  if (current || row.length) {
    row.push(current);
    rows.push(row);
  }

  const [header = [], ...body] = rows;
  return body.map((cells) =>
    Object.fromEntries(
      header.map((key, index) => [key.trim().replace(/^\uFEFF/, ""), (cells[index] || "").trim()]),
    ),
  );
}

function normalizeMember(row) {
  const color = colorMap.has(row.color) ? row.color : "blue";
  return {
    name: row.name || "",
    color,
    url: row.url || "",
    comment: row.comment || "Gemini Canvas の共有リンクをチェック。",
  };
}

function renderMembers(members) {
  const grid = document.querySelector("#members");
  const template = document.querySelector("#member-card-template");

  grid.innerHTML = "";

  members.forEach((member, index) => {
    const fragment = template.content.cloneNode(true);
    const card = fragment.querySelector(".member-card");
    const name = fragment.querySelector(".member-name");
    const comment = fragment.querySelector(".member-comment");
    const link = fragment.querySelector(".member-link");

    card.dataset.color = member.color;
    card.style.animationDelay = `${index * 90}ms`;
    name.textContent = member.name;
    comment.textContent = member.comment;
    link.href = member.url;
    link.setAttribute("aria-label", `${member.name} の Gemini Canvas を開く`);

    grid.appendChild(fragment);
  });
}

function setSourceLabel(text) {
  const label = document.querySelector("#data-source-label");
  label.textContent = text;
}

loadMembers().then(renderMembers);
