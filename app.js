const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1VqFrjrXuGtHOBU8Eym29aKhHqNTgLpVenNryhJ2nNC0/export?format=csv&gid=0";
const SHEET_EDIT_URL =
  "https://docs.google.com/spreadsheets/d/1VqFrjrXuGtHOBU8Eym29aKhHqNTgLpVenNryhJ2nNC0/edit?gid=0#gid=0";
const SHEET_QUERY_PARAM = "sheet";
const DRAFT_STORAGE_KEY = "lit-camp-canvas-links";
const shirtAssets = {
  red: "./shirt-red-sticker.svg",
  blue: "./shirt-sticker.svg",
  orange: "./shirt-orange-sticker.svg",
  pink: "./shirt-pink-sticker.svg",
};

const fallbackMembers = [
  {
    name: "すいば",
    color: "red",
    url: "https://example.com/suiba",
    comment: "",
  },
  {
    name: "聖成",
    color: "blue",
    url: "https://example.com/seisei",
    comment: "",
  },
  {
    name: "モナ",
    color: "orange",
    url: "https://example.com/mona",
    comment: "",
  },
  {
    name: "ゆうり",
    color: "blue",
    url: "https://example.com/yuuri",
    comment: "",
  },
  {
    name: "あずき",
    color: "pink",
    url: "https://example.com/azuki",
    comment: "",
  },
];

const colorMap = new Set(["red", "blue", "orange", "pink"]);
let currentMembers = [];

async function loadMembers() {
  const sheetUrl =
    new URLSearchParams(window.location.search).get(SHEET_QUERY_PARAM) || SHEET_CSV_URL;

  if (!sheetUrl) {
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

    return members;
  } catch (error) {
    console.error(error);
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
    comment: row.comment || "",
  };
}

function loadDrafts() {
  try {
    return JSON.parse(window.localStorage.getItem(DRAFT_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveDrafts(drafts) {
  window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
}

function applyDrafts(members) {
  const drafts = loadDrafts();
  return members.map((member) => ({
    ...member,
    url: drafts[member.name] || member.url,
  }));
}

function renderMembers(members) {
  const grid = document.querySelector("#members");
  const template = document.querySelector("#member-card-template");

  grid.innerHTML = "";

  members.forEach((member, index) => {
    const fragment = template.content.cloneNode(true);
    const card = fragment.querySelector(".member-card");
    const name = fragment.querySelector(".member-name");
    const link = fragment.querySelector(".member-link");
    const shirtImage = fragment.querySelector(".member-shirt-image");
    const asset = shirtAssets[member.color] || shirtAssets.blue;

    card.dataset.color = member.color;
    card.dataset.memberName = member.name;
    card.style.animationDelay = `${index * 90}ms`;
    name.textContent = member.name;
    shirtImage.src = asset;
    shirtImage.alt = `${member.name} のTシャツステッカー`;
    link.href = member.url;
    link.setAttribute("aria-label", `${member.name} の Gemini Canvas を開く`);

    grid.appendChild(fragment);
  });
}

function renderMemberOptions(members) {
  const select = document.querySelector("#member-name-select");
  select.innerHTML = "";

  members.forEach((member) => {
    const option = document.createElement("option");
    option.value = member.name;
    option.textContent = member.name;
    select.appendChild(option);
  });
}

function syncFormUrl() {
  const select = document.querySelector("#member-name-select");
  const input = document.querySelector("#member-url-input");
  const selected = currentMembers.find((member) => member.name === select.value);
  input.value = selected?.url || "";
}

function bindUpdateForm() {
  const form = document.querySelector("#member-update-form");
  const select = document.querySelector("#member-name-select");
  const input = document.querySelector("#member-url-input");
  const sheetLink = document.querySelector(".update-sheet-link");

  sheetLink.href = SHEET_EDIT_URL;
  select.addEventListener("change", syncFormUrl);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = select.value;
    const url = input.value.trim();
    if (!name || !url) {
      return;
    }

    const drafts = loadDrafts();
    drafts[name] = url;
    saveDrafts(drafts);

    currentMembers = currentMembers.map((member) =>
      member.name === name ? { ...member, url } : member,
    );
    renderMembers(currentMembers);
    syncFormUrl();

    const card = document.querySelector(`[data-member-name="${CSS.escape(name)}"]`);
    if (card) {
      card.classList.remove("is-updated");
      void card.offsetWidth;
      card.classList.add("is-updated");
    }
  });
}

loadMembers().then((members) => {
  currentMembers = applyDrafts(members);
  renderMemberOptions(currentMembers);
  renderMembers(currentMembers);
  bindUpdateForm();
  syncFormUrl();
});
