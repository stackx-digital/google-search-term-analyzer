"use strict";

const columns = {
  term: ["search term", "query", "search query", "search keyword"],
  campaign: ["campaign", "campaign name"],
  adGroup: ["ad group", "ad group name"],
  matchType: ["match type", "search term match type"],
  cost: ["cost", "total cost", "spend"],
  clicks: ["clicks", "interactions"],
  impressions: ["impressions", "impr.", "imp.", "imps."],
  ctr: ["ctr", "click-through rate", "interaction rate"],
  conversions: ["conversions", "conv.", "all conv.", "conversion", "all conversions"],
  value: ["conversion value", "total conv. value", "total conversion value", "conv. value", "revenue", "value"],
  impressionShare: ["impr. share", "search impr. share", "search impression share", "impression share"],
  device: ["device", "platform", "device type"]
};

const junkWords = [
  "job", "jobs", "resume", "pdf", "sex", "porn", "vacancy", "kerja", "percuma",
  "free", "download", "login", "portal", "career", "education", "course",
  "training", "wiki", "meaning", "example", "sample", "template", "software",
  "app", "android", "ios", "iphone", "youtube", "facebook", "tiktok", "shopee",
  "lazada", "grab", "gojek", "peluang", "gaji", "kakitangan", "intern", "magang"
];

const locationWords = [
  "near", "near me", "within", "me", "hampir", "dekat", "berdekatan", "kawasan",
  "area", "address", "alamat", "waze", "map", "peta", "jalan", "street", "city",
  "town", "location", "cawangan", "outlet", "branch", "terdekat", "berhampiran",
  "di mana", "gps", "lokasi"
];

const stopWords = new Set([
  "the", "and", "for", "in", "to", "of", "a", "is", "at", "on", "with", "by",
  "an", "this", "that", "from", "it", "are", "was", "were", "or", "be", "as",
  "your", "my", "we", "you", "i", "how", "what", "why", "who", "where", "when",
  "about", "do", "does", "did", "then", "than", "dan", "di", "yang", "ke",
  "ini", "untuk", "dengan", "itu", "dari", "pada", "adalah", "ada", "ia",
  "kami", "saya", "anda", "mereka", "oleh", "bagi", "atau", "tapi", "tetapi",
  "jika", "kalau", "akan", "telah", "sudah", "dalam", "sebagai", "cara",
  "apa", "bagaimana", "siapa", "mengapa", "berapa", "mana", "bila"
]);

const state = {
  rows: [],
  enriched: [],
  compareRows: [],
  compareEnriched: [],
  buckets: {},
  breakdowns: {},
  selected: new Set(),
  visibleDetail: [],
  gramSize: 2,
  sort: { key: "cost", direction: "desc" },
  filters: {
    category: "all",
    intent: "all",
    questionsOnly: false,
    search: ""
  }
};

let chartResizeFrame = 0;

const storageKey = "searchTermAnalyzerSessionV2";

const copy = {
  brand: "Brand name",
  targetCpa: "Target CPA",
  currency: "Currency",
  upload: "Upload CSV",
  compare: "Compare",
  sample: "Load Sample",
  save: "Save",
  restore: "Restore",
  pdf: "PDF",
  clear: "Clear",
  dropTitle: "Drop Google Ads CSV or TSV here",
  noReport: "No report loaded",
  noCompare: "No comparison report loaded",
  priority: "Priority Actions",
  campaignSignals: "Campaign Signals",
  aiBrief: "AI Strategy Brief",
  copyPrompt: "Copy Prompt",
  breakdown: "Campaign and Ad Group Performance",
  negativeBuilder: "Build Google Ads Negatives",
  inspector: "Search Terms Detail"
};

const els = {
  brandInput: document.getElementById("brandInput"),
  targetCpaInput: document.getElementById("targetCpaInput"),
  currencyInput: document.getElementById("currencyInput"),
  minWasteInput: document.getElementById("minWasteInput"),
  minRoasInput: document.getElementById("minRoasInput"),
  highCtrInput: document.getElementById("highCtrInput"),
  lowCtrInput: document.getElementById("lowCtrInput"),
  lowShareInput: document.getElementById("lowShareInput"),
  minClicksInput: document.getElementById("minClicksInput"),
  highImpressionsInput: document.getElementById("highImpressionsInput"),
  competitorInput: document.getElementById("competitorInput"),
  customJunkInput: document.getElementById("customJunkInput"),
  uploadButton: document.getElementById("uploadButton"),
  compareUploadButton: document.getElementById("compareUploadButton"),
  sampleButton: document.getElementById("sampleButton"),
  saveSessionButton: document.getElementById("saveSessionButton"),
  restoreSessionButton: document.getElementById("restoreSessionButton"),
  printReportButton: document.getElementById("printReportButton"),
  clearButton: document.getElementById("clearButton"),
  fileInput: document.getElementById("fileInput"),
  compareFileInput: document.getElementById("compareFileInput"),
  fileStatus: document.getElementById("fileStatus"),
  compareStatus: document.getElementById("compareStatus"),
  dropzone: document.getElementById("dropzone"),
  report: document.getElementById("report"),
  categoryFilter: document.getElementById("categoryFilter"),
  intentFilter: document.getElementById("intentFilter"),
  questionFilter: document.getElementById("questionFilter"),
  searchFilter: document.getElementById("searchFilter"),
  selectAllBox: document.getElementById("selectAllBox"),
  negativeMatchSelect: document.getElementById("negativeMatchSelect"),
  negativeLevelSelect: document.getElementById("negativeLevelSelect")
};

document.addEventListener("DOMContentLoaded", bindEvents);

function showLoading() {
  document.getElementById("loadingOverlay").classList.remove("is-hidden");
}

function hideLoading() {
  document.getElementById("loadingOverlay").classList.add("is-hidden");
}

function showToast(message, icon = "✓") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 2900);
}

function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle("dark");
  document.getElementById("darkModeToggle").textContent = isDark ? "☀️" : "🌙";
  try { localStorage.setItem("sta_dark_mode", isDark ? "1" : "0"); } catch {}
}

function applyPersistedTheme() {
  try {
    if (localStorage.getItem("sta_dark_mode") === "1") {
      document.documentElement.classList.add("dark");
      const btn = document.getElementById("darkModeToggle");
      if (btn) btn.textContent = "☀️";
    }
  } catch {}
}

function openHelp(tab) {
  const modal = document.getElementById("helpModal");
  modal.classList.remove("is-hidden");
  document.body.style.overflow = "hidden";
  if (tab) switchHelpTab(tab);
}

function closeHelp() {
  document.getElementById("helpModal").classList.add("is-hidden");
  document.body.style.overflow = "";
}

function switchHelpTab(name) {
  document.querySelectorAll(".help-tab").forEach((btn) => {
    const isActive = btn.dataset.tab === name;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", isActive ? "true" : "false");
  });
  document.querySelectorAll(".help-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === name);
  });
}

function bindEvents() {
  applyPersistedTheme();
  restoreSettingsOnly();
  applyCopyText();
  document.getElementById("darkModeToggle").addEventListener("click", toggleDarkMode);
  document.getElementById("helpButton").addEventListener("click", () => openHelp("download"));
  document.getElementById("helpClose").addEventListener("click", closeHelp);
  document.querySelector(".help-backdrop").addEventListener("click", closeHelp);
  document.querySelectorAll(".help-tab").forEach((btn) => {
    btn.addEventListener("click", () => switchHelpTab(btn.dataset.tab));
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (!document.getElementById("helpModal").classList.contains("is-hidden")) {
        closeHelp();
        return;
      }
    }
  });
  els.uploadButton.addEventListener("click", () => els.fileInput.click());
  els.compareUploadButton.addEventListener("click", () => els.compareFileInput.click());
  els.fileInput.addEventListener("change", handleFileInput);
  els.compareFileInput.addEventListener("change", handleCompareFileInput);
  els.sampleButton.addEventListener("click", loadSample);
  els.clearButton.addEventListener("click", clearReport);
  els.saveSessionButton.addEventListener("click", saveSession);
  els.restoreSessionButton.addEventListener("click", restoreSession);
  els.printReportButton.addEventListener("click", () => window.print());

  [
    els.brandInput,
    els.targetCpaInput,
    els.currencyInput,
    els.minWasteInput,
    els.minRoasInput,
    els.highCtrInput,
    els.lowCtrInput,
    els.lowShareInput,
    els.minClicksInput,
    els.highImpressionsInput,
    els.competitorInput,
    els.customJunkInput
  ].forEach((input) => {
    input.addEventListener("input", rerender);
    input.addEventListener("change", rerender);
  });

  els.categoryFilter.addEventListener("change", () => {
    state.filters.category = els.categoryFilter.value;
    renderDetail();
  });
  els.intentFilter.addEventListener("change", () => {
    state.filters.intent = els.intentFilter.value;
    renderDetail();
  });
  els.questionFilter.addEventListener("change", () => {
    state.filters.questionsOnly = els.questionFilter.checked;
    renderDetail();
  });
  els.searchFilter.addEventListener("input", () => {
    state.filters.search = els.searchFilter.value.trim().toLowerCase();
    renderDetail();
  });

  document.querySelectorAll(".sort-button").forEach((button) => {
    button.addEventListener("click", () => setSort(button.dataset.sort));
  });

  document.querySelectorAll(".gram-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.gramSize = Number(button.dataset.gram);
      document.querySelectorAll(".gram-button").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      renderSegments();
    });
  });

  document.querySelectorAll(".export-bucket").forEach((button) => {
    button.addEventListener("click", () => exportBucket(button.dataset.bucket));
  });

  document.getElementById("exportAllButton").addEventListener("click", exportDetail);
  document.getElementById("copyExactButton").addEventListener("click", () => copySelected("exact"));
  document.getElementById("copyPhraseButton").addEventListener("click", () => copySelected("phrase"));
  document.getElementById("clearCompareButton").addEventListener("click", clearCompare);
  document.getElementById("copyAiPromptButton").addEventListener("click", copyAiPrompt);
  document.getElementById("autoSelectNegativesButton").addEventListener("click", autoSelectNegatives);
  document.getElementById("googleAdsEditorButton").addEventListener("click", exportGoogleAdsEditorNegatives);
  document.getElementById("exportKeywordGapButton").addEventListener("click", exportKeywordGap);

  [els.negativeMatchSelect, els.negativeLevelSelect].forEach((input) => {
    input.addEventListener("change", renderNegativeBuilder);
  });

  els.selectAllBox.addEventListener("change", toggleVisibleSelection);

  els.dropzone.addEventListener("dragover", (event) => {
    event.preventDefault();
    els.dropzone.classList.add("dragging");
  });
  els.dropzone.addEventListener("dragleave", () => els.dropzone.classList.remove("dragging"));
  els.dropzone.addEventListener("drop", (event) => {
    event.preventDefault();
    els.dropzone.classList.remove("dragging");
    const file = event.dataTransfer.files[0];
    if (file) readFile(file);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !document.getElementById("helpModal").classList.contains("is-hidden")) {
      return;
    }
    if (event.key === "Escape" && els.searchFilter.value) {
      els.searchFilter.value = "";
      state.filters.search = "";
      renderDetail();
    }
  });

  window.addEventListener("resize", scheduleChartRerender);
  if (document.fonts?.ready) {
    document.fonts.ready.then(scheduleChartRerender);
  }
}

function handleFileInput(event) {
  const file = event.target.files[0];
  if (file) readFile(file);
}

function handleCompareFileInput(event) {
  const file = event.target.files[0];
  if (file) readFile(file, "compare");
}

function readFile(file, mode = "primary") {
  showLoading();
  const reader = new FileReader();
  reader.onload = () => {
    setTimeout(() => {
      const text = decodeFile(reader.result);
      loadText(text, file.name, mode);
      hideLoading();
    }, 0);
  };
  reader.onerror = () => hideLoading();
  reader.readAsArrayBuffer(file);
}

function decodeFile(buffer) {
  const bytes = new Uint8Array(buffer);
  if (bytes.length >= 2 && bytes[0] === 255 && bytes[1] === 254) {
    return new TextDecoder("utf-16le").decode(bytes);
  }
  if (bytes.length >= 2 && bytes[0] === 254 && bytes[1] === 255) {
    return new TextDecoder("utf-16be").decode(bytes);
  }
  return new TextDecoder("utf-8").decode(bytes);
}

function loadText(text, label, mode = "primary") {
  const parsed = parseSearchTermReport(text);
  if (!parsed.length) {
    if (mode === "compare") {
      els.compareStatus.textContent = "No valid comparison terms found";
    } else {
      els.fileStatus.textContent = "No valid search terms found";
      clearReport(false);
    }
    return;
  }

  if (mode === "compare") {
    state.compareRows = parsed;
    els.compareStatus.textContent = `${label}: ${parsed.length} comparison terms loaded`;
    rerender();
    return;
  }

  state.rows = parsed;
  state.selected = new Set();
  els.fileStatus.textContent = `${label}: ${parsed.length} search terms loaded`;
  els.report.classList.remove("is-hidden");
  rerender();
}

function loadSample() {
  showLoading();
  fetch("./sample/google-ads-search-terms.csv")
    .then((response) => response.text())
    .then((text) => { loadText(text, "Sample report"); hideLoading(); })
    .catch(() => {
      hideLoading();
      const text = [
        "Search term,Campaign,Ad group,Cost,Clicks,Impressions,CTR,Conversions,Conversion value,Search impression share,Device",
        "rose gold necklace,Brand Search,Brand Exact,28.40,18,210,8.57%,3,450,34%,Mobile",
        "rose gold necklace near me,Local Search,Near Me,21.90,11,190,5.79%,1,120,44%,Mobile",
        "free rose gold necklace template,Generic Search,Free/Junk,17.50,7,480,1.46%,0,0,22%,Desktop",
        "rose gold jewellery price,Generic Search,Price Terms,45.20,23,610,3.77%,1,180,36%,Mobile",
        "cheap rose gold chain,Generic Search,Price Terms,31.10,14,430,3.26%,0,0,29%,Mobile"
      ].join("\n");
      loadText(text, "Inline sample");
    });
}

function clearReport(updateStatus = true) {
  state.rows = [];
  state.enriched = [];
  state.compareRows = [];
  state.compareEnriched = [];
  state.buckets = {};
  state.breakdowns = {};
  state.selected = new Set();
  els.fileInput.value = "";
  els.compareFileInput.value = "";
  els.report.classList.add("is-hidden");
  if (updateStatus) els.fileStatus.textContent = "No report loaded";
  els.compareStatus.textContent = "No comparison report loaded";
}

function clearCompare() {
  state.compareRows = [];
  state.compareEnriched = [];
  els.compareFileInput.value = "";
  els.compareStatus.textContent = "No comparison report loaded";
  renderComparison();
}

function parseSearchTermReport(text) {
  const normalizedText = text.replace(/^\uFEFF/, "");
  const physicalLines = normalizedText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const headerIndex = physicalLines.findIndex(looksLikeHeader);
  if (headerIndex === -1) return [];

  const dataText = physicalLines.slice(headerIndex).join("\n");
  const delimiter = detectDelimiter(physicalLines[headerIndex]);
  const rows = parseDelimited(dataText, delimiter);
  if (rows.length < 2) return [];

  const header = rows[0].map(cleanHeader);
  return rows.slice(1)
    .map((row) => mapRow(header, row))
    .filter((row) => row.term && !row.term.toLowerCase().startsWith("total:"));
}

function looksLikeHeader(line) {
  const lower = line.toLowerCase();
  if (
    lower.trim() === "search terms report" ||
    lower.trim() === "search query report" ||
    lower.trim() === "search term report"
  ) {
    return false;
  }
  const cells = line.split(/[,\t;|]/).map(cleanHeader);
  const hasTermCell = cells.some((cell) => columns.term.includes(cell));
  const recognizedCells = cells.filter((cell) => Object.values(columns).some((aliases) => aliases.includes(cell)));
  const hasMetric = recognizedCells.length >= 2 || lower.includes("campaign") || lower.includes("click") || lower.includes("impr") || lower.includes("cost") || lower.includes("ctr");
  return hasTermCell && hasMetric;
}

function detectDelimiter(line) {
  const candidates = [",", "\t", ";", "|"];
  return candidates
    .map((delimiter) => ({ delimiter, count: splitSimple(line, delimiter).length }))
    .sort((a, b) => b.count - a.count)[0].delimiter;
}

function splitSimple(line, delimiter) {
  return line.split(delimiter);
}

function parseDelimited(text, delimiter) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (quoted && next === '"') {
        cell += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === delimiter && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  return rows;
}

function cleanHeader(value) {
  return String(value || "").trim().replace(/^["']|["']$/g, "").toLowerCase();
}

function mapRow(header, row) {
  const raw = {};
  header.forEach((name, index) => {
    raw[name] = row[index] ?? "";
  });

  return {
    term: stringValue(raw, "term"),
    campaign: stringValue(raw, "campaign") || "Unknown Campaign",
    adGroup: stringValue(raw, "adGroup"),
    matchType: stringValue(raw, "matchType"),
    cost: numberValue(raw, "cost"),
    clicks: numberValue(raw, "clicks"),
    impressions: numberValue(raw, "impressions"),
    ctr: percentValue(raw, "ctr"),
    conversions: numberValue(raw, "conversions"),
    value: numberValue(raw, "value"),
    impressionShare: percentValue(raw, "impressionShare"),
    device: stringValue(raw, "device") || "Unknown"
  };
}

function stringValue(raw, key) {
  const found = findRawValue(raw, key);
  return String(found || "").trim();
}

function numberValue(raw, key) {
  const found = findRawValue(raw, key);
  if (typeof found === "number") return found;
  const cleaned = String(found || "")
    .replace(/[()]/g, "")
    .replace(/[^0-9.-]/g, "");
  return Number.parseFloat(cleaned) || 0;
}

function percentValue(raw, key) {
  const found = findRawValue(raw, key);
  const value = numberValue({ value: found }, "value");
  return value;
}

function findRawValue(raw, key) {
  const names = columns[key] || [key];
  const rawKey = Object.keys(raw).find((name) => names.includes(cleanHeader(name)));
  return rawKey ? raw[rawKey] : "";
}

function rerender() {
  persistSettings();
  applyCopyText();
  if (!state.rows.length) return;
  const rules = getRules();
  const hasConversionData = state.rows.some((row) => row.conversions > 0 || row.value > 0);

  state.enriched = state.rows.map((row) => {
    const strategy = classify(row, rules, hasConversionData);
    const metrics = derivedMetrics(row);
    return {
      ...row,
      category: strategy.category,
      reason: strategy.reason,
      issueType: strategy.issueType,
      intent: detectIntent(row.term),
      question: isQuestion(row.term),
      ...metrics,
      length: termLength(row.term),
      priority: priorityScore(row, strategy, rules)
    };
  });

  state.buckets = buildBuckets(state.enriched);
  state.breakdowns = buildBreakdowns(state.enriched);
  state.compareEnriched = state.compareRows.map((row) => {
    const strategy = classify(row, rules, hasConversionData);
    return {
      ...row,
      category: strategy.category,
      reason: strategy.reason,
      issueType: strategy.issueType,
      intent: detectIntent(row.term),
      question: isQuestion(row.term),
      ...derivedMetrics(row),
      length: termLength(row.term),
      priority: priorityScore(row, strategy, rules)
    };
  });
  renderKpis();
  renderInsights();
  renderAiBrief();
  renderComparison();
  renderCharts();
  renderScatterPlot();
  renderBreakdowns();
  renderBuckets();
  renderSegments();
  renderKeywordGap();
  renderNegativeBuilder();
  renderDetail();
}

function applyCopyText() {
  setOptionalText("label[for='brandInput']", copy.brand);
  setOptionalText("label[for='targetCpaInput']", copy.targetCpa);
  setOptionalText("label[for='currencyInput']", copy.currency);
  setElementText(els.uploadButton, copy.upload);
  setElementText(els.compareUploadButton, copy.compare);
  setElementText(els.sampleButton, copy.sample);
  setElementText(els.saveSessionButton, copy.save);
  setElementText(els.restoreSessionButton, copy.restore);
  setElementText(els.printReportButton, copy.pdf);
  setElementText(els.clearButton, copy.clear);
  setOptionalText("#dropzone h2", copy.dropTitle);
  if (!state.rows.length) els.fileStatus.textContent = copy.noReport;
  if (!state.compareRows.length) els.compareStatus.textContent = copy.noCompare;
  setOptionalText(".insight-panel .panel-heading h2", copy.priority);
  const headings = Array.from(document.querySelectorAll?.(".panel-heading h2, .section-heading h2") || []);
  setHeadingText(headings, "Campaign Signals", copy.campaignSignals);
  setHeadingText(headings, "AI Strategy Brief", copy.aiBrief);
  setHeadingText(headings, "Campaign and Ad Group Performance", copy.breakdown);
  setHeadingText(headings, "Build Google Ads Negatives", copy.negativeBuilder);
  setHeadingText(headings, "Search Terms Detail", copy.inspector);
  setElementText(document.getElementById("copyAiPromptButton"), copy.copyPrompt);
}

function setOptionalText(selector, text) {
  const element = document.querySelector?.(selector);
  if (element) element.textContent = text;
}

function setElementText(element, text) {
  if (element) element.textContent = text;
}

function setHeadingText(headings, current, next) {
  const match = headings.find((heading) => heading.textContent.trim() === current);
  if (match) match.textContent = next;
}

function getTargetCpa() {
  return Number.parseFloat(els.targetCpaInput.value) || 50;
}

function getCurrency() {
  return els.currencyInput.value.trim() || "RM";
}

function getRules() {
  return {
    targetCpa: getTargetCpa(),
    minWaste: numberInput(els.minWasteInput, 25),
    minRoas: numberInput(els.minRoasInput, 3),
    highCtr: numberInput(els.highCtrInput, 8),
    lowCtr: numberInput(els.lowCtrInput, 1.5),
    lowShare: numberInput(els.lowShareInput, 50),
    minClicks: numberInput(els.minClicksInput, 3),
    highImpressions: numberInput(els.highImpressionsInput, 500),
    competitorWords: listInput(els.competitorInput.value),
    junkWords: [...junkWords, ...listInput(els.customJunkInput.value)]
  };
}

function numberInput(input, fallback) {
  return Number.parseFloat(input.value) || fallback;
}

function listInput(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function derivedMetrics(row) {
  return {
    roas: row.cost > 0 ? row.value / row.cost : 0,
    cpa: row.conversions > 0 ? row.cost / row.conversions : row.cost
  };
}

function classify(row, rules, hasConversionData) {
  const term = row.term.toLowerCase();
  if (containsPhrase(term, rules.competitorWords)) {
    return { category: "Threat", reason: "Competitor traffic detected", issueType: "competitor" };
  }
  if (containsWord(term, rules.junkWords)) {
    return { category: "Threat", reason: "Junk traffic or irrelevant intent", issueType: "junk" };
  }

  if (hasConversionData) {
    if (row.conversions === 0 && row.cost >= Math.max(rules.minWaste, rules.targetCpa)) {
      return { category: "Problem", reason: "Spent over target CPA with zero conversions", issueType: "zero-conversion" };
    }
    if (row.value > 0 && row.cost > 0 && row.value / row.cost < 1 && row.cost >= rules.minWaste) {
      return { category: "Problem", reason: "ROAS below 1.00x while spend is high", issueType: "low-roas" };
    }
    if (row.value > 0 && row.cost > 0 && row.value / row.cost >= rules.minRoas) {
      return { category: "Opportunity", reason: "High ROAS keyword", issueType: "scale-roas" };
    }
    if (row.conversions > 0 && row.impressionShare < rules.lowShare) {
      return { category: "Opportunity", reason: "Converts with low impression share", issueType: "low-share-winner" };
    }
    if (row.impressions >= rules.highImpressions && row.ctr < rules.lowCtr) {
      return { category: "Weakness", reason: "High impressions with low CTR", issueType: "ad-copy" };
    }
    if (row.conversions > 0 && row.cost / row.conversions > rules.targetCpa * 1.5) {
      return { category: "Weakness", reason: "CPA is above target", issueType: "high-cpa" };
    }
  } else {
    if (row.cost >= rules.minWaste && row.ctr < rules.lowCtr) {
      return { category: "Problem", reason: "High spend with low CTR", issueType: "spend-low-ctr" };
    }
    if (row.clicks > 12 && row.ctr < rules.lowCtr) {
      return { category: "Problem", reason: "Many clicks but weak engagement", issueType: "poor-engagement" };
    }
    if (row.ctr >= rules.highCtr && row.clicks >= rules.minClicks) {
      return { category: "Opportunity", reason: "Strong CTR and click volume", issueType: "scale-ctr" };
    }
    if (row.ctr >= Math.max(5, rules.highCtr * 0.65) && row.impressionShare < rules.lowShare && row.clicks >= rules.minClicks) {
      return { category: "Opportunity", reason: "Strong CTR with low impression share", issueType: "low-share-winner" };
    }
    if (row.impressions >= rules.highImpressions && row.ctr < rules.lowCtr) {
      return { category: "Weakness", reason: "High impressions with low click engagement", issueType: "ad-copy" };
    }
  }

  return { category: "Neutral", reason: "Stable performance", issueType: "monitor" };
}

function priorityScore(row, strategy, rules) {
  const base = {
    Threat: 78,
    Problem: 72,
    Opportunity: 66,
    Weakness: 48,
    Neutral: 18
  }[strategy.category] || 18;
  const spendScore = Math.min(18, Math.round((row.cost / Math.max(rules.minWaste, 1)) * 6));
  const conversionScore = strategy.category === "Opportunity" ? Math.min(12, Math.round(row.conversions * 3 + (row.value > 0 ? 4 : 0))) : 0;
  const impressionScore = row.impressions >= rules.highImpressions ? 6 : 0;
  return Math.min(100, base + spendScore + conversionScore + impressionScore);
}

function containsWord(term, words) {
  return words.some((word) => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|\\s)${escaped}(\\s|$)`, "i").test(term);
  });
}

function detectIntent(term) {
  const value = term.toLowerCase();
  const tests = [
    ["Informational", /(apa|bagaimana|cara|tips|tutorial|maksud|apa itu|kenapa|mengapa|siapa|di mana|how|what|why|guide|info|details|instruction)/i],
    ["Navigational", /(login|contact|lokasi|alamat|hubungi|no tel|phone|office|branch|cawangan|website|hq|peta|map|waze)/i],
    ["Commercial", /(terbaik|vs|review|murah|harga|pilihan|compare|best|cheap|price|top|banding|ulasan|rating|fee|yuran)/i],
    ["Transactional", /(beli|tempah|order|discount|daftar|promo|voucher|coupon|shop|get|buy|book|register|sewa|hire|subscribe|checkout)/i]
  ];
  const match = tests.find(([, pattern]) => pattern.test(value));
  return match ? match[0] : "General";
}

function isQuestion(term) {
  const value = term.toLowerCase();
  return ["apa", "bagaimana", "siapa", "mana", "kenapa", "mengapa", "berapa", "maksud", "how", "what", "why", "where", "when", "who", "which", "is", "are", "do", "does", "can"]
    .some((word) => value === word || value.startsWith(`${word} `) || value.includes(` ${word} `));
}

function termLength(term) {
  const count = term.trim().split(/\s+/).filter(Boolean).length;
  if (count <= 2) return "Short Tail";
  if (count <= 4) return "Medium Tail";
  return "Long Tail";
}

function buildBuckets(rows) {
  const averageCost = rows.reduce((sum, row) => sum + row.cost, 0) / Math.max(rows.length, 1);
  const brand = els.brandInput.value.trim().toLowerCase();

  return {
    scale: rows
      .filter((row) => row.category === "Opportunity")
      .sort((a, b) => b.priority - a.priority || b.conversions - a.conversions || b.roas - a.roas || b.clicks - a.clicks)
      .slice(0, 12),
    negative: rows
      .filter((row) => row.category === "Threat")
      .sort((a, b) => b.priority - a.priority || b.cost - a.cost || b.clicks - a.clicks)
      .slice(0, 12),
    problem: rows
      .filter((row) => row.category === "Problem" || (row.cost > averageCost && row.conversions === 0))
      .sort((a, b) => b.priority - a.priority || b.cost - a.cost)
      .slice(0, 12),
    gem: rows
      .filter((row) => row.category === "Opportunity" || (row.cost < averageCost && row.conversions >= 1))
      .sort((a, b) => b.priority - a.priority || b.roas - a.roas || b.conversions - a.conversions)
      .slice(0, 12),
    brand: brand
      ? rows
        .filter((row) => row.term.toLowerCase().includes(brand))
        .sort((a, b) => b.conversions - a.conversions || b.cost - a.cost)
        .slice(0, 12)
      : [],
    location: rows
      .filter((row) => containsPhrase(row.term.toLowerCase(), locationWords))
      .sort((a, b) => b.conversions - a.conversions || b.cost - a.cost)
      .slice(0, 12)
  };
}

function buildBreakdowns(rows) {
  return {
    campaigns: aggregateBy(rows, (row) => row.campaign || "Unknown Campaign"),
    adgroups: aggregateBy(rows, (row) => row.adGroup || "Unknown Ad Group")
  };
}

function aggregateBy(rows, keyFn) {
  const map = new Map();
  rows.forEach((row) => {
    const key = keyFn(row);
    const item = map.get(key) || {
      name: key,
      cost: 0,
      clicks: 0,
      impressions: 0,
      conversions: 0,
      value: 0,
      threats: 0,
      problems: 0,
      opportunities: 0,
      terms: 0
    };
    item.cost += row.cost;
    item.clicks += row.clicks;
    item.impressions += row.impressions;
    item.conversions += row.conversions;
    item.value += row.value;
    item.terms += 1;
    if (row.category === "Threat") item.threats += 1;
    if (row.category === "Problem") item.problems += 1;
    if (row.category === "Opportunity") item.opportunities += 1;
    map.set(key, item);
  });

  return Array.from(map.values())
    .map((item) => ({
      ...item,
      roas: item.cost > 0 ? item.value / item.cost : 0,
      cpa: item.conversions > 0 ? item.cost / item.conversions : item.cost,
      ctr: item.impressions > 0 ? (item.clicks / item.impressions) * 100 : 0
    }))
    .sort((a, b) => b.threats - a.threats || b.problems - a.problems || b.cost - a.cost)
    .slice(0, 20);
}

function containsPhrase(term, phrases) {
  return phrases.some((phrase) => term.includes(phrase));
}

function renderKpis() {
  const totalSpend = sum(state.enriched, "cost");
  const totalConversions = sum(state.enriched, "conversions");
  const totalValue = sum(state.enriched, "value");
  const problemRows = state.enriched.filter((row) => row.category === "Problem");
  const threats = state.enriched.filter((row) => row.category === "Threat").length;
  const wastedSpend = sum(problemRows, "cost");

  setText("kpiTerms", state.enriched.length.toLocaleString());
  setText("kpiSpend", money(totalSpend));
  setText("kpiConversions", formatNumber(totalConversions));
  setText("kpiRoas", totalSpend > 0 ? `${(totalValue / totalSpend).toFixed(2)}x` : "0.00x");
  setText("kpiWaste", money(wastedSpend));
  setText("kpiProblems", `${problemRows.length} problem term${problemRows.length !== 1 ? "s" : ""}`);
  setText("kpiThreats", threats.toLocaleString());
}

function renderCharts() {
  const promptLines = (state.aiPrompt || "").split("\n").filter(Boolean).length;
  const comparisonEnabled = Boolean(state.compareRows.length && state.enriched.length);
  const negativeCandidates = state.buckets.negative?.length || 0;

  setText("featureNegativeCount", negativeCandidates.toLocaleString());
  setText("featureBriefCount", promptLines.toLocaleString());
  setText("featureSessionState", state.rows.length ? "Saved" : "Local");
  setText("featureCompareState", comparisonEnabled ? "On" : "Off");
}

function scheduleChartRerender() {
  if (!state.enriched.length || els.report.classList.contains("is-hidden")) return;
  if (chartResizeFrame) cancelAnimationFrame(chartResizeFrame);
  chartResizeFrame = requestAnimationFrame(() => {
    chartResizeFrame = 0;
    renderCharts();
    renderScatterPlot();
  });
}

function renderScatterPlot() {
  const svg = document.getElementById("scatterPlot");
  const wrap = document.getElementById("scatterWrap");
  if (!svg || !wrap || !state.enriched.length) {
    if (svg) svg.innerHTML = "";
    return;
  }

  const rules = getRules();
  const hasConv = state.enriched.some((r) => r.conversions > 0);
  const yKey = hasConv ? "cpa" : "cost";
  const yLabel = hasConv ? "CPA" : "Spend";
  const refY = hasConv ? rules.targetCpa : rules.minWaste;

  const data = state.enriched.filter((r) => r.clicks >= 1);
  if (!data.length) { svg.innerHTML = ""; return; }

  const W = wrap.clientWidth || 580;
  const H = 360;
  const PL = 68, PR = 20, PT = 28, PB = 48;
  const plotW = W - PL - PR;
  const plotH = H - PT - PB;

  const maxCtr = Math.max(Math.max(...data.map((r) => r.ctr)) * 1.1, rules.highCtr * 1.5, 5);
  const maxY = Math.max(Math.max(...data.map((r) => r[yKey])) * 1.1, refY * 2, 1);

  const sx = (v) => PL + (Math.min(v, maxCtr) / maxCtr) * plotW;
  const sy = (v) => PT + plotH - (Math.min(Math.max(v, 0), maxY) / maxY) * plotH;
  const qx = sx(rules.lowCtr);
  const qy = sy(refY);

  const colorMap = { Opportunity: "#16a34a", Problem: "#e11d48", Weakness: "#f59e0b", Threat: "#7c3aed", Neutral: "#64748b" };

  const quadShading = [
    { x: PL, y: PT, w: qx - PL, h: qy - PT, cls: "q-problem" },
    { x: qx, y: PT, w: PL + plotW - qx, h: qy - PT, cls: "q-weakness" },
    { x: PL, y: qy, w: qx - PL, h: PT + plotH - qy, cls: "q-gem" },
    { x: qx, y: qy, w: PL + plotW - qx, h: PT + plotH - qy, cls: "q-opportunity" }
  ].map((q) => `<rect x="${q.x}" y="${q.y}" width="${Math.max(q.w, 0)}" height="${Math.max(q.h, 0)}" class="q-shade ${q.cls}"/>`).join("");

  const qlabels = [
    { x: (PL + qx) / 2, y: PT + 14, text: "Problem", fill: "#be123c" },
    { x: (qx + PL + plotW) / 2, y: PT + 14, text: "Weakness", fill: "#92400e" },
    { x: (PL + qx) / 2, y: PT + plotH - 6, text: "Hidden Gem", fill: "#475569" },
    { x: (qx + PL + plotW) / 2, y: PT + plotH - 6, text: "Opportunity", fill: "#166534" }
  ].map((l) => `<text x="${l.x}" y="${l.y}" text-anchor="middle" class="scatter-qlabel" fill="${l.fill}">${escapeHtml(l.text)}</text>`).join("");

  const gridLines = [0.25, 0.5, 0.75].map((f) => {
    const x = PL + f * plotW;
    const y = PT + f * plotH;
    return `<line x1="${x}" y1="${PT}" x2="${x}" y2="${PT + plotH}" class="scatter-grid"/>
            <line x1="${PL}" y1="${y}" x2="${PL + plotW}" y2="${y}" class="scatter-grid"/>`;
  }).join("");

  const refLines = `
    <line x1="${qx}" y1="${PT}" x2="${qx}" y2="${PT + plotH}" class="scatter-ref" stroke-dasharray="5,3"/>
    <line x1="${PL}" y1="${qy}" x2="${PL + plotW}" y2="${qy}" class="scatter-ref" stroke-dasharray="5,3"/>`;

  const border = `<rect x="${PL}" y="${PT}" width="${plotW}" height="${plotH}" fill="none" stroke="var(--line)" stroke-width="1"/>`;

  const nTick = 5;
  const xTicks = Array.from({ length: nTick }, (_, i) => {
    const v = (maxCtr / (nTick - 1)) * i;
    return `<text x="${sx(v)}" y="${PT + plotH + 16}" text-anchor="middle" class="scatter-tick">${v.toFixed(1)}%</text>`;
  }).join("");

  const yTicks = Array.from({ length: nTick }, (_, i) => {
    const v = (maxY / (nTick - 1)) * i;
    return `<text x="${PL - 6}" y="${sy(v) + 4}" text-anchor="end" class="scatter-tick">${getCurrency()}${Math.round(v)}</text>`;
  }).join("");

  const axisLabels = `
    <text x="${PL + plotW / 2}" y="${H - 6}" text-anchor="middle" class="scatter-axis-label">CTR (%)</text>
    <text x="12" y="${PT + plotH / 2}" text-anchor="middle" class="scatter-axis-label" transform="rotate(-90,12,${PT + plotH / 2})">${escapeHtml(yLabel)}</text>`;

  const dots = data.map((row) => {
    const cx = sx(row.ctr);
    const cy = sy(row[yKey]);
    const col = colorMap[row.category] || "#64748b";
    const label = row.term.length > 32 ? `${row.term.slice(0, 30)}…` : row.term;
    return `<circle cx="${cx}" cy="${cy}" r="6" fill="${col}" fill-opacity="0.72" stroke="${col}" stroke-width="1.5"
      class="scatter-dot"
      data-term="${escapeHtml(label)}"
      data-ctr="${row.ctr.toFixed(2)}"
      data-val="${row[yKey].toFixed(2)}"
      data-ylabel="${escapeHtml(yLabel)}"
      data-cat="${row.category}"
    />`;
  }).join("");

  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("height", H);
  svg.innerHTML = quadShading + gridLines + refLines + border + qlabels + dots + xTicks + yTicks + axisLabels;

  const subtitle = document.getElementById("scatterSubtitle");
  if (subtitle) subtitle.textContent = `${data.length} terms · rujukan: CTR ${rules.lowCtr}% | ${yLabel} ${getCurrency()}${Math.round(refY)}`;

  const tooltip = document.getElementById("scatterTooltip");
  svg.querySelectorAll(".scatter-dot").forEach((dot) => {
    dot.addEventListener("mouseenter", () => {
      tooltip.innerHTML = `
        <strong>${escapeHtml(dot.dataset.term)}</strong>
        <div class="stt-row"><span>CTR</span><span>${dot.dataset.ctr}%</span></div>
        <div class="stt-row"><span>${escapeHtml(dot.dataset.ylabel)}</span><span>${getCurrency()} ${dot.dataset.val}</span></div>
        <div style="margin-top:6px"><span class="label-pill label-${dot.dataset.cat}">${dot.dataset.cat}</span></div>`;
      tooltip.classList.remove("is-hidden");
    });
    dot.addEventListener("mousemove", (e) => {
      const rect = wrap.getBoundingClientRect();
      let x = e.clientX - rect.left + 14;
      let y = e.clientY - rect.top - 10;
      if (x + 180 > rect.width) x -= 196;
      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${y}px`;
    });
    dot.addEventListener("mouseleave", () => tooltip.classList.add("is-hidden"));
  });
}

function renderKeywordGap() {
  const tbody = document.getElementById("keywordGapTable");
  if (!tbody) return;

  const gaps = state.enriched
    .filter((row) => row.category === "Opportunity")
    .sort((a, b) => b.priority - a.priority || b.conversions - a.conversions || b.roas - a.roas)
    .slice(0, 15);

  tbody.innerHTML = gaps.length
    ? gaps.map((row) => `
      <tr>
        ${termCell(row.term)}
        <td><span class="label-pill label-${row.category}">${row.category}</span></td>
        <td class="right">${row.ctr.toFixed(2)}%</td>
        ${right(formatNumber(row.conversions))}
        ${right(`${row.roas.toFixed(2)}x`)}
        <td><code class="keyword-exact">[${escapeHtml(row.term)}]</code></td>
      </tr>`).join("")
    : `<tr class="empty-row"><td colspan="6">Tiada term Opportunity untuk dicadangkan</td></tr>`;
}

function exportKeywordGap() {
  const gaps = state.enriched
    .filter((row) => row.category === "Opportunity")
    .sort((a, b) => b.priority - a.priority);
  downloadCsv(`keyword_gap_${today()}.csv`,
    ["Search Term", "Exact Match Keyword", "CTR", "Conversions", "ROAS", "Cost", "Rationale"],
    gaps.map((row) => [row.term, `[${row.term}]`, row.ctr.toFixed(2), row.conversions, row.roas.toFixed(2), row.cost.toFixed(2), row.reason])
  );
}

function shortLabel(value, maxLength) {
  const text = String(value);
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}...` : text;
}

function compactMoney(value) {
  if (value >= 1000000) return `${getCurrency()}${(value / 1000000).toFixed(1)}m`;
  if (value >= 1000) return `${getCurrency()}${(value / 1000).toFixed(1)}k`;
  return `${getCurrency()}${Math.round(value)}`;
}

function renderInsights() {
  const actions = [];
  const targetCpa = getRules().targetCpa;
  const topOpportunity = state.buckets.scale[0];
  const topProblem = state.buckets.problem[0];
  const topThreat = state.buckets.negative[0];

  if (topOpportunity) {
    actions.push({
      kind: "opportunity",
      title: `Scale: ${topOpportunity.term}`,
      meta: `${topOpportunity.campaign} | ${formatNumber(topOpportunity.conversions)} conv. | ${money(topOpportunity.cost)} spend`
    });
  }
  if (topProblem) {
    actions.push({
      kind: "problem",
      title: `Audit spend: ${topProblem.term}`,
      meta: `${money(topProblem.cost)} spend | ${formatNumber(topProblem.conversions)} conv. | target CPA ${money(targetCpa)}`
    });
  }
  if (topThreat) {
    actions.push({
      kind: "threat",
      title: `Negative candidate: ${topThreat.term}`,
      meta: `${money(topThreat.cost)} spend | ${formatNumber(topThreat.clicks)} clicks | junk intent`
    });
  }

  document.getElementById("priorityActions").innerHTML = actions.length
    ? actions.map((item) => `
      <div class="action-item ${item.kind}">
        <strong>${escapeHtml(item.title)}</strong>
        <span>${escapeHtml(item.meta)}</span>
      </div>
    `).join("")
    : emptyBlock("No priority actions found");

  renderCampaignSignals();
}

function renderAiBrief() {
  const spend = sum(state.enriched, "cost");
  const conversions = sum(state.enriched, "conversions");
  const threats = state.enriched.filter((row) => row.category === "Threat");
  const problems = state.enriched.filter((row) => row.category === "Problem");
  const opportunities = state.enriched.filter((row) => row.category === "Opportunity");
  const topCampaign = (state.breakdowns.campaigns || [])[0];
  const topProblem = state.buckets.problem?.[0];
  const topScale = state.buckets.scale?.[0];
  const lines = [
    `Summary: ${state.enriched.length} search terms analyzed with ${money(spend)} spend and ${formatNumber(conversions)} conversions.`,
    `Priority: review ${problems.length} budget bleeders and ${threats.length} junk or competitor terms.`,
    topScale ? `Top scale candidate: "${topScale.term}" because ${topScale.reason.toLowerCase()}.` : "No clear scale candidate found.",
    topProblem ? `Immediate audit: "${topProblem.term}" spent ${money(topProblem.cost)} and triggered ${topProblem.reason.toLowerCase()}.` : "No major budget bleeding term found.",
    topCampaign ? `Riskiest campaign: ${topCampaign.name} (${topCampaign.threats} junk terms, ${money(topCampaign.cost)} spend).` : "No campaign risk signal found.",
    "Recommended next step: add negatives, split high-quality terms into tighter ad groups, and fix ad copy or landing pages for low-CTR terms."
  ];

  const prompt = buildAiPrompt(lines);
  state.aiPrompt = prompt;
  document.getElementById("aiBrief").innerHTML = `
    ${lines.map((line, index) => `
      <div class="brief-item brief-summary">
        <span class="brief-index">${String(index + 1).padStart(2, "0")}</span>
        <strong>${escapeHtml(line)}</strong>
      </div>
    `).join("")}
    <div class="brief-item prompt-card">
      <span>AI-ready prompt</span>
      <textarea readonly>${escapeHtml(prompt)}</textarea>
    </div>
  `;
}

function buildAiPrompt(lines) {
  const topTerms = state.enriched
    .slice()
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 12)
    .map((row) => `${row.category}: ${row.term} | ${money(row.cost)} | ${formatNumber(row.conversions)} conv | ${row.reason}`)
    .join("\n");
  return [
    "Act as a senior Google Ads strategist. Use this search terms audit and produce a concise action plan.",
    "",
    ...lines,
    "",
    "Top terms:",
    topTerms
  ].join("\n");
}

function copyAiPrompt() {
  if (!state.aiPrompt) return;
  navigator.clipboard.writeText(state.aiPrompt).then(() => {
    showToast("AI strategy prompt copied", "🤖");
  });
}

function renderCampaignSignals() {
  const campaigns = {};
  state.enriched.forEach((row) => {
    campaigns[row.campaign] ||= { cost: 0, conversions: 0, value: 0, threats: 0, terms: 0 };
    campaigns[row.campaign].cost += row.cost;
    campaigns[row.campaign].conversions += row.conversions;
    campaigns[row.campaign].value += row.value;
    campaigns[row.campaign].terms += 1;
    if (row.category === "Threat") campaigns[row.campaign].threats += 1;
  });

  const rows = Object.entries(campaigns)
    .map(([name, data]) => {
      const cpa = data.conversions > 0 ? data.cost / data.conversions : data.cost;
      const roas = data.cost > 0 ? data.value / data.cost : 0;
      return { name, ...data, cpa, roas };
    })
    .sort((a, b) => b.threats - a.threats || b.cost - a.cost)
    .slice(0, 5);

  document.getElementById("campaignSignals").innerHTML = rows.length
    ? rows.map((row) => `
      <div class="campaign-item">
        <strong>${escapeHtml(row.name)}</strong>
        <span>${row.threats} junk terms | ${money(row.cost)} spend | CPA ${money(row.cpa)} | ROAS ${row.roas.toFixed(2)}x</span>
      </div>
    `).join("")
    : emptyBlock("No campaign data found");
}

function renderComparison() {
  const panel = document.getElementById("comparisonPanel");
  const grid = panel.closest(".comparison-grid");
  const tableSection = document.getElementById("comparisonTableSection");
  if (!state.compareRows.length || !state.enriched.length) {
    panel.classList.add("is-hidden");
    grid?.classList.add("is-single");
    tableSection.classList.add("is-hidden");
    return;
  }

  panel.classList.remove("is-hidden");
  grid?.classList.remove("is-single");
  tableSection.classList.remove("is-hidden");
  const previous = indexByTerm(state.compareEnriched);
  const current = indexByTerm(state.enriched);
  const repeated = [];
  const newTerms = [];
  const fixedTerms = [];

  current.forEach((row, term) => {
    if (previous.has(term)) repeated.push({ current: row, previous: previous.get(term) });
    else newTerms.push(row);
  });
  previous.forEach((row, term) => {
    if (!current.has(term)) fixedTerms.push(row);
  });

  const currentSpend = sum(state.enriched, "cost");
  const previousSpend = sum(state.compareEnriched, "cost");
  const currentConv = sum(state.enriched, "conversions");
  const previousConv = sum(state.compareEnriched, "conversions");
  const recurringWaste = repeated
    .filter(({ current: now, previous: before }) => now.category === "Threat" || before.category === "Threat" || now.category === "Problem")
    .length;

  document.getElementById("comparisonSummary").innerHTML = [
    { label: "Spend change", value: signedMoney(currentSpend - previousSpend) },
    { label: "Conversion change", value: signedNumber(currentConv - previousConv) },
    { label: "Repeated risky terms", value: recurringWaste },
    { label: "New terms", value: newTerms.length },
    { label: "Disappeared terms", value: fixedTerms.length }
  ].map((item) => `
    <div class="campaign-item">
      <strong>${escapeHtml(item.label)}</strong>
      <span>${escapeHtml(item.value)}</span>
    </div>
  `).join("");

  document.getElementById("comparisonTable").innerHTML = repeated
    .sort((a, b) => Math.abs((b.current.cost - b.previous.cost)) - Math.abs((a.current.cost - a.previous.cost)))
    .slice(0, 40)
    .map(({ current: now, previous: before }) => `
      <tr>
        ${termCell(now.term)}
        ${right(signedMoney(now.cost - before.cost))}
        ${right(signedNumber(now.conversions - before.conversions))}
        <td><span class="label-pill label-${now.category}">${escapeHtml(now.category)}</span></td>
      </tr>
    `).join("") || `<tr class="empty-row"><td colspan="4">No repeated terms found</td></tr>`;
}

function indexByTerm(rows) {
  const map = new Map();
  rows.forEach((row) => {
    const key = row.term.toLowerCase();
    if (!map.has(key)) {
      map.set(key, { ...row });
    } else {
      const existing = map.get(key);
      existing.cost += row.cost;
      existing.clicks += row.clicks;
      existing.impressions += row.impressions;
      existing.conversions += row.conversions;
      existing.value += row.value;
    }
  });
  return map;
}

function renderBreakdowns() {
  renderBucketTable("campaignBreakdownTable", state.breakdowns.campaigns || [], (row) => [
    termCell(row.name),
    right(money(row.cost)),
    right(formatNumber(row.conversions)),
    right(formatNumber(row.threats)),
    right(`${row.roas.toFixed(2)}x`)
  ]);
  renderBucketTable("adGroupBreakdownTable", state.breakdowns.adgroups || [], (row) => [
    termCell(row.name),
    right(money(row.cost)),
    right(formatNumber(row.conversions)),
    right(formatNumber(row.threats)),
    right(`${row.roas.toFixed(2)}x`)
  ]);
}

function renderNegativeBuilder() {
  const selectedRows = getSelectedRows();
  const fallbackRows = selectedRows.length ? selectedRows : state.buckets.negative || [];
  const rows = fallbackRows.slice(0, 80);
  document.getElementById("negativeBuilderTable").innerHTML = rows.length
    ? rows.map((row) => `
      <tr>
        ${termCell(formatNegativeKeyword(row.term, els.negativeMatchSelect.value))}
        <td>${els.negativeLevelSelect.value === "Account" ? "Account level" : escapeHtml(row.campaign || "")}</td>
        <td>${els.negativeLevelSelect.value === "Ad group" ? escapeHtml(row.adGroup || "") : ""}</td>
        <td class="muted-cell">${escapeHtml(row.reason)}</td>
      </tr>
    `).join("")
    : `<tr class="empty-row"><td colspan="4">Select terms or auto select negative candidates</td></tr>`;
}

function getSelectedRows() {
  if (!state.selected.size) return [];
  const terms = new Set(Array.from(state.selected).map((term) => term.toLowerCase()));
  return state.enriched.filter((row) => terms.has(row.term.toLowerCase()));
}

function formatNegativeKeyword(term, matchType) {
  if (matchType === "Exact") return `[${term}]`;
  if (matchType === "Phrase") return `"${term}"`;
  return term;
}

function autoSelectNegatives() {
  state.selected = new Set((state.buckets.negative || []).map((row) => row.term));
  renderNegativeBuilder();
  renderDetail();
}

function renderBuckets() {
  renderBucketTable("scaleTable", state.buckets.scale, (row) => [
    termCell(row.term),
    right(formatNumber(row.conversions)),
    right(money(row.cost)),
    right(`${row.roas.toFixed(2)}x`)
  ]);
  renderBucketTable("negativeTable", state.buckets.negative, (row) => [
    termCell(row.term),
    right(money(row.cost)),
    right(formatNumber(row.clicks)),
    `<td><span class="label-pill label-Threat">Junk</span></td>`
  ]);
  renderBucketTable("problemTable", state.buckets.problem, (row) => [
    termCell(row.term),
    right(money(row.cost)),
    right(formatNumber(row.conversions)),
    right(money(row.cpa))
  ]);
  renderBucketTable("gemTable", state.buckets.gem, (row) => [
    termCell(row.term),
    right(money(row.cost)),
    right(formatNumber(row.conversions)),
    right(`${row.roas.toFixed(2)}x`)
  ]);
}

function renderSegments() {
  const brand = els.brandInput.value.trim();
  document.getElementById("brandHeading").textContent = brand ? `Brand Terms: ${brand}` : "Brand Terms";

  renderBucketTable("brandTable", state.buckets.brand || [], (row) => [
    termCell(row.term),
    right(money(row.cost)),
    right(formatNumber(row.conversions))
  ]);
  renderBucketTable("locationTable", state.buckets.location || [], (row) => [
    termCell(row.term),
    right(money(row.cost)),
    right(formatNumber(row.conversions))
  ]);

  const ngrams = buildNgrams(state.enriched, state.gramSize);
  state.buckets.ngram = ngrams;
  renderBucketTable("ngramTable", ngrams, (row) => [
    termCell(`"${row.phrase}"`),
    right(formatNumber(row.frequency)),
    right(money(row.cost)),
    right(formatNumber(row.conversions))
  ]);
}

function buildNgrams(rows, size) {
  const map = new Map();
  rows.forEach((row) => {
    const words = row.term
      .toLowerCase()
      .split(/\s+/)
      .map((word) => word.replace(/[^a-z0-9]/g, ""))
      .filter((word) => word.length > 1 && !stopWords.has(word));

    for (let index = 0; index <= words.length - size; index += 1) {
      const phrase = words.slice(index, index + size).join(" ");
      if (!phrase || phrase.length < 3) continue;
      const current = map.get(phrase) || { phrase, frequency: 0, cost: 0, conversions: 0 };
      current.frequency += 1;
      current.cost += row.cost;
      current.conversions += row.conversions;
      map.set(phrase, current);
    }
  });

  return Array.from(map.values())
    .sort((a, b) => b.frequency - a.frequency || b.cost - a.cost)
    .slice(0, 20);
}

function renderDetail() {
  const visible = filteredRows().sort(compareRows);
  const limited = visible.slice(0, 250);
  state.visibleDetail = limited;

  const countEl = document.getElementById("detailRowCount");
  if (countEl) {
    const total = state.enriched.length;
    if (visible.length < total) {
      countEl.textContent = `${visible.length.toLocaleString()} of ${total.toLocaleString()}`;
      countEl.style.display = "";
    } else if (total > 0) {
      countEl.textContent = `${total.toLocaleString()} terms`;
      countEl.style.display = "";
    } else {
      countEl.style.display = "none";
    }
  }

  document.getElementById("detailTable").innerHTML = limited.length
    ? limited.map((row) => `
      <tr>
        <td class="check-cell">
          <input class="negative-check" type="checkbox" data-term="${escapeHtml(row.term)}" ${state.selected.has(row.term) ? "checked" : ""}>
        </td>
        ${termCell(row.term)}
        <td><span class="label-pill label-${row.category}">${row.category}</span></td>
        <td class="muted-cell">${row.intent}</td>
        <td class="right"><span class="priority-pill">${row.priority}</span></td>
        <td class="muted-cell">${escapeHtml(row.reason)}</td>
        ${right(money(row.cost))}
        ${right(formatNumber(row.conversions))}
        ${right(`${row.roas.toFixed(2)}x`)}
      </tr>
    `).join("")
    : `<tr class="empty-row"><td colspan="9">No matching search terms</td></tr>`;

  document.querySelectorAll(".negative-check").forEach((input) => {
    input.addEventListener("change", () => {
      if (input.checked) state.selected.add(input.dataset.term);
      else state.selected.delete(input.dataset.term);
      updateSelectAll(visible);
      renderNegativeBuilder();
    });
  });

  updateSelectAll(visible);
}

function filteredRows() {
  return state.enriched.filter((row) => {
    const categoryMatch = state.filters.category === "all" || row.category === state.filters.category;
    const intentMatch = state.filters.intent === "all" || row.intent === state.filters.intent;
    const questionMatch = !state.filters.questionsOnly || row.question;
    const searchMatch = !state.filters.search || row.term.toLowerCase().includes(state.filters.search);
    return categoryMatch && intentMatch && questionMatch && searchMatch;
  });
}

function compareRows(a, b) {
  const key = state.sort.key;
  const direction = state.sort.direction === "asc" ? 1 : -1;
  const aValue = key === "term" ? a.term : a[key];
  const bValue = key === "term" ? b.term : b[key];
  if (typeof aValue === "string") {
    return aValue.localeCompare(bValue) * direction;
  }
  return ((aValue || 0) - (bValue || 0)) * direction;
}

function setSort(key) {
  if (state.sort.key === key) {
    state.sort.direction = state.sort.direction === "asc" ? "desc" : "asc";
  } else {
    state.sort = { key, direction: "desc" };
  }
  renderDetail();
}

function toggleVisibleSelection() {
  const visible = filteredRows().sort(compareRows).slice(0, 250);
  visible.forEach((row) => {
    if (els.selectAllBox.checked) state.selected.add(row.term);
    else state.selected.delete(row.term);
  });
  renderNegativeBuilder();
  renderDetail();
}

function updateSelectAll(visibleRows) {
  const visible = visibleRows.slice(0, 250);
  els.selectAllBox.checked = visible.length > 0 && visible.every((row) => state.selected.has(row.term));
}

function renderBucketTable(id, rows, cells) {
  const body = document.getElementById(id);
  body.innerHTML = rows.length
    ? rows.map((row) => `<tr>${cells(row).join("")}</tr>`).join("")
    : `<tr class="empty-row"><td colspan="4">No data</td></tr>`;
}

function termCell(value) {
  return `<td class="term-cell">${escapeHtml(value)}</td>`;
}

function right(value) {
  return `<td class="right">${escapeHtml(String(value))}</td>`;
}

function emptyBlock(text) {
  return `<div class="action-item"><span>${escapeHtml(text)}</span></div>`;
}

function sum(rows, key) {
  return rows.reduce((total, row) => total + (Number(row[key]) || 0), 0);
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: value % 1 ? 1 : 0
  });
}

function signedNumber(value) {
  const number = Number(value || 0);
  const prefix = number > 0 ? "+" : "";
  return `${prefix}${formatNumber(number)}`;
}

function money(value) {
  return `${getCurrency()} ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function signedMoney(value) {
  const number = Number(value || 0);
  const prefix = number > 0 ? "+" : number < 0 ? "-" : "";
  return `${prefix}${money(Math.abs(number))}`;
}

function setText(id, value) {
  document.getElementById(id).textContent = value;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function downloadCsv(filename, headers, rows) {
  const csv = [headers, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function exportBucket(name) {
  const rows = state.buckets[name] || [];
  const filename = `${name}_search_terms_${today()}.csv`;

  if (name === "ngram") {
    downloadCsv(filename, ["Phrase", "Frequency", "Cost", "Conversions"], rows.map((row) => [
      row.phrase, row.frequency, row.cost.toFixed(2), row.conversions
    ]));
    return;
  }

  if (name === "campaigns" || name === "adgroups") {
    const breakdownRows = state.breakdowns[name] || [];
    downloadCsv(`${name}_breakdown_${today()}.csv`, ["Name", "Cost", "Clicks", "Impressions", "CTR", "Conversions", "Revenue", "CPA", "ROAS", "Threats", "Problems", "Opportunities"], breakdownRows.map((row) => [
      row.name,
      row.cost.toFixed(2),
      row.clicks,
      row.impressions,
      row.ctr.toFixed(2),
      row.conversions,
      row.value.toFixed(2),
      row.cpa.toFixed(2),
      row.roas.toFixed(2),
      row.threats,
      row.problems,
      row.opportunities
    ]));
    return;
  }

  downloadCsv(filename, ["Search Term", "Campaign", "Ad Group", "Label", "Intent", "Priority", "Cost", "Clicks", "Conversions", "Revenue", "ROAS", "Rationale"], rows.map(csvRow));
}

function exportDetail() {
  downloadCsv(`search_terms_detail_${today()}.csv`, ["Search Term", "Campaign", "Ad Group", "Label", "Intent", "Priority", "Cost", "Clicks", "Conversions", "Revenue", "ROAS", "Rationale"], filteredRows().map(csvRow));
}

function csvRow(row) {
  return [
    row.term,
    row.campaign,
    row.adGroup,
    row.category,
    row.intent,
    row.priority,
    row.cost.toFixed(2),
    row.clicks,
    row.conversions,
    row.value.toFixed(2),
    row.roas.toFixed(2),
    row.reason
  ];
}

function exportGoogleAdsEditorNegatives() {
  const rows = getSelectedRows().length ? getSelectedRows() : state.buckets.negative || [];
  const matchType = els.negativeMatchSelect.value;
  const level = els.negativeLevelSelect.value;
  const headers = level === "Account"
    ? ["Keyword", "Match type", "Status"]
    : level === "Ad group"
      ? ["Campaign", "Ad group", "Keyword", "Match type", "Status"]
      : ["Campaign", "Keyword", "Match type", "Status"];

  const body = rows.map((row) => {
    if (level === "Account") return [row.term, matchType, "Enabled"];
    if (level === "Ad group") return [row.campaign, row.adGroup, row.term, matchType, "Enabled"];
    return [row.campaign, row.term, matchType, "Enabled"];
  });
  downloadCsv(`google_ads_editor_negatives_${today()}.csv`, headers, body);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function settingsSnapshot() {
  return {
    brand: els.brandInput.value,
    targetCpa: els.targetCpaInput.value,
    currency: els.currencyInput.value,
    minWaste: els.minWasteInput.value,
    minRoas: els.minRoasInput.value,
    highCtr: els.highCtrInput.value,
    lowCtr: els.lowCtrInput.value,
    lowShare: els.lowShareInput.value,
    minClicks: els.minClicksInput.value,
    highImpressions: els.highImpressionsInput.value,
    competitors: els.competitorInput.value,
    customJunk: els.customJunkInput.value,
    negativeMatch: els.negativeMatchSelect.value,
    negativeLevel: els.negativeLevelSelect.value
  };
}

function applySettings(settings = {}) {
  if (settings.brand !== undefined) els.brandInput.value = settings.brand;
  if (settings.targetCpa !== undefined) els.targetCpaInput.value = settings.targetCpa;
  if (settings.currency !== undefined) els.currencyInput.value = settings.currency;
  if (settings.minWaste !== undefined) els.minWasteInput.value = settings.minWaste;
  if (settings.minRoas !== undefined) els.minRoasInput.value = settings.minRoas;
  if (settings.highCtr !== undefined) els.highCtrInput.value = settings.highCtr;
  if (settings.lowCtr !== undefined) els.lowCtrInput.value = settings.lowCtr;
  if (settings.lowShare !== undefined) els.lowShareInput.value = settings.lowShare;
  if (settings.minClicks !== undefined) els.minClicksInput.value = settings.minClicks;
  if (settings.highImpressions !== undefined) els.highImpressionsInput.value = settings.highImpressions;
  if (settings.competitors !== undefined) els.competitorInput.value = settings.competitors;
  if (settings.customJunk !== undefined) els.customJunkInput.value = settings.customJunk;
  if (settings.negativeMatch !== undefined) els.negativeMatchSelect.value = settings.negativeMatch;
  if (settings.negativeLevel !== undefined) els.negativeLevelSelect.value = settings.negativeLevel;
}

function persistSettings() {
  if (typeof localStorage === "undefined") return;
  const existing = safeReadSession();
  localStorage.setItem(storageKey, JSON.stringify({
    ...existing,
    settings: settingsSnapshot()
  }));
}

function restoreSettingsOnly() {
  const session = safeReadSession();
  if (session.settings) applySettings(session.settings);
}

function saveSession() {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(storageKey, JSON.stringify({
    settings: settingsSnapshot(),
    rows: state.rows,
    compareRows: state.compareRows,
    selected: Array.from(state.selected)
  }));
  showToast("Session saved locally", "💾");
}

function restoreSession() {
  const session = safeReadSession();
  if (!session.rows?.length) {
    showToast("No saved session found", "⚠️");
    return;
  }
  applySettings(session.settings || {});
  state.rows = session.rows || [];
  state.compareRows = session.compareRows || [];
  state.selected = new Set(session.selected || []);
  showToast(`Restored ${state.rows.length} search terms`, "♻️");
  els.compareStatus.textContent = state.compareRows.length ? `Restored ${state.compareRows.length} comparison terms` : "No comparison report loaded";
  els.report.classList.remove("is-hidden");
  rerender();
}

function safeReadSession() {
  if (typeof localStorage === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "{}");
  } catch {
    return {};
  }
}

function copySelected(mode) {
  const terms = Array.from(state.selected);
  if (!terms.length) return;
  const formatted = terms.map((term) => mode === "exact" ? `[${term}]` : `"${term}"`).join("\n");
  navigator.clipboard.writeText(formatted).then(() => {
    showToast(`${terms.length} ${mode} negatives copied`, "📋");
  });
}
