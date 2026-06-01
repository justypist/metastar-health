"use strict";

const PUBMED_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/";
const SETTINGS_KEY = "pubmed-literature-import-settings";
const THEME_KEY = "pubmed-literature-import-theme";
const MAX_ABSTRACT_LENGTH = 560;
const UPLOAD_TIMEOUT_MS = 180000;
const POLL_INTERVAL_MS = 2000;

const state = {
  themeMode: "system",
  settings: {
    ncbiApiKey: "",
  },
  keywords: [],
  results: [],
  extracting: false,
  searching: false,
  checking: false,
};

const elements = {
  checkButton: document.querySelector("#checkButton"),
  closeDialogButton: document.querySelector("#closeDialogButton"),
  dialogBackdrop: document.querySelector("#dialogBackdrop"),
  keywordChips: document.querySelector("#keywordChips"),
  keywordInput: document.querySelector("#keywordInput"),
  maxResultsInput: document.querySelector("#maxResultsInput"),
  missingOnlyInput: document.querySelector("#missingOnlyInput"),
  ncbiApiKeyInput: document.querySelector("#ncbiApiKeyInput"),
  openDialogButton: document.querySelector("#openDialogButton"),
  parseButton: document.querySelector("#parseButton"),
  queryInput: document.querySelector("#queryInput"),
  resetButton: document.querySelector("#resetButton"),
  resultsList: document.querySelector("#resultsList"),
  searchButton: document.querySelector("#searchButton"),
  settingsButton: document.querySelector("#settingsButton"),
  settingsForm: document.querySelector("#settingsForm"),
  settingsPanel: document.querySelector("#settingsPanel"),
  sortInput: document.querySelector("#sortInput"),
  statusBanner: document.querySelector("#statusBanner"),
  themeMode: document.querySelector("#themeMode"),
};

function getRequiredElement(name) {
  const element = elements[name];

  if (!element) {
    throw new Error(`Missing required element: ${name}`);
  }

  return element;
}

function normalizeSpace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function uniq(values) {
  const seen = new Set();
  const result = [];

  for (const value of values) {
    const normalized = normalizeSpace(value);
    const key = normalized.toLowerCase();

    if (normalized && !seen.has(key)) {
      seen.add(key);
      result.push(normalized);
    }
  }

  return result;
}

function setStatus(message, kind = "idle") {
  const banner = getRequiredElement("statusBanner");

  banner.textContent = message;
  banner.dataset.kind = kind;
}

function setButtonLoading(button, loading) {
  button.classList.toggle("loading", loading);
  button.disabled = loading;
}

function readSavedSettings() {
  try {
    const raw = sessionStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) {
      return;
    }

    state.settings = {
      ncbiApiKey: typeof parsed.ncbiApiKey === "string" ? parsed.ncbiApiKey : "",
    };
  } catch (error) {
    console.warn("Failed to read saved settings", error);
  }
}

function saveSettings() {
  sessionStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
}

function syncSettingsForm() {
  getRequiredElement("ncbiApiKeyInput").value = state.settings.ncbiApiKey;
}

function readSettingsForm() {
  state.settings = {
    ncbiApiKey: getRequiredElement("ncbiApiKeyInput").value.trim(),
  };
}

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme() {
  const theme = state.themeMode === "system" ? getSystemTheme() : state.themeMode;

  document.documentElement.dataset.theme = theme;
  getRequiredElement("themeMode").value = state.themeMode;
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  state.themeMode = saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
  applyTheme();

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (state.themeMode === "system") {
      applyTheme();
    }
  });
}

function updateKeywordInput() {
  getRequiredElement("keywordInput").value = state.keywords.join(", ");
  renderKeywordChips();
}

function renderKeywordChips() {
  const container = getRequiredElement("keywordChips");
  container.replaceChildren();

  if (state.keywords.length === 0) {
    const empty = document.createElement("span");
    empty.className = "chip";
    empty.textContent = "未解析";
    container.append(empty);
    return;
  }

  state.keywords.forEach((keyword) => {
    const chip = document.createElement("span");
    const label = document.createElement("span");
    const remove = document.createElement("button");

    chip.className = "chip";
    label.textContent = keyword;
    remove.type = "button";
    remove.setAttribute("aria-label", `移除 ${keyword}`);
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      state.keywords = state.keywords.filter((item) => item !== keyword);
      updateKeywordInput();
    });

    chip.append(label, remove);
    container.append(chip);
  });
}

function parseKeywordInput() {
  state.keywords = uniq(
    getRequiredElement("keywordInput")
      .value.split(/[,，]/)
      .map((item) => item.trim()),
  );
  renderKeywordChips();
}

function buildPubMedTerm(keywords = state.keywords) {
  if (keywords.length === 0) {
    return "";
  }

  return keywords
    .map((keyword) => {
      const escaped = keyword.replace(/"/g, "");
      return /\s/.test(escaped) ? `"${escaped}"[Title/Abstract]` : `${escaped}[Title/Abstract]`;
    })
    .join(" AND ");
}

async function extractKeywordsFromOpenAi() {
  const query = getRequiredElement("queryInput").value.trim();

  if (!query) {
    throw new Error("请输入 query。");
  }

  const response = await fetch("./api/extract-keywords", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error || "OpenAI 关键词提取失败。");
  }

  if (!Array.isArray(payload.keywords)) {
    throw new Error("关键词提取结果格式错误。");
  }

  return uniq(payload.keywords.filter((item) => typeof item === "string")).slice(0, 10);
}

async function handleExtractKeywords() {
  if (state.extracting) {
    return;
  }

  state.extracting = true;
  setButtonLoading(getRequiredElement("parseButton"), true);
  setStatus("正在使用 OpenAI 提取关键词。", "loading");

  try {
    state.keywords = await extractKeywordsFromOpenAi();
    updateKeywordInput();
    setStatus(
      state.keywords.length > 0 ? `OpenAI 已提取 ${state.keywords.length} 个关键词。` : "OpenAI 未返回关键词。",
      state.keywords.length > 0 ? "success" : "error",
    );
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "OpenAI 关键词提取失败。", "error");
  } finally {
    state.extracting = false;
    setButtonLoading(getRequiredElement("parseButton"), false);
  }
}

function appendNcbiApiKey(url) {
  if (state.settings.ncbiApiKey) {
    url.searchParams.set("api_key", state.settings.ncbiApiKey);
  }
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(typeof payload === "string" ? payload : response.statusText);
  }

  return payload;
}

async function searchPubMed(term, maxResults, sort) {
  const searchUrl = new URL("esearch.fcgi", PUBMED_BASE_URL);
  searchUrl.searchParams.set("db", "pubmed");
  searchUrl.searchParams.set("term", term);
  searchUrl.searchParams.set("retmode", "json");
  searchUrl.searchParams.set("retmax", String(maxResults));
  searchUrl.searchParams.set("sort", sort);
  appendNcbiApiKey(searchUrl);

  const searchPayload = await fetchJson(searchUrl);
  const ids = searchPayload?.esearchresult?.idlist ?? [];

  if (!Array.isArray(ids) || ids.length === 0) {
    return [];
  }

  const [summaries, abstracts] = await Promise.all([fetchPubMedSummaries(ids), fetchPubMedAbstracts(ids)]);

  return ids.map((id) => normalizePubMedItem(id, summaries.get(id), abstracts.get(id)));
}

async function fetchPubMedSummaries(ids) {
  const summaryUrl = new URL("esummary.fcgi", PUBMED_BASE_URL);
  summaryUrl.searchParams.set("db", "pubmed");
  summaryUrl.searchParams.set("id", ids.join(","));
  summaryUrl.searchParams.set("retmode", "json");
  appendNcbiApiKey(summaryUrl);

  const payload = await fetchJson(summaryUrl);
  const result = payload?.result ?? {};
  const map = new Map();

  for (const id of ids) {
    if (result[id]) {
      map.set(id, result[id]);
    }
  }

  return map;
}

async function fetchPubMedAbstracts(ids) {
  const fetchUrl = new URL("efetch.fcgi", PUBMED_BASE_URL);
  fetchUrl.searchParams.set("db", "pubmed");
  fetchUrl.searchParams.set("id", ids.join(","));
  fetchUrl.searchParams.set("retmode", "xml");
  appendNcbiApiKey(fetchUrl);

  const response = await fetch(fetchUrl);
  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const xml = await response.text();
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const articles = Array.from(doc.getElementsByTagName("PubmedArticle"));
  const map = new Map();

  for (const article of articles) {
    const pmid = article.getElementsByTagName("PMID")[0]?.textContent?.trim();
    if (!pmid) {
      continue;
    }

    const abstractNodes = Array.from(article.getElementsByTagName("AbstractText"));
    const description = normalizeSpace(
      abstractNodes
        .map((node) => {
          const label = node.getAttribute("Label");
          const text = normalizeSpace(node.textContent ?? "");
          return label ? `${label}: ${text}` : text;
        })
        .filter(Boolean)
        .join(" "),
    );
    const articleIds = Array.from(article.getElementsByTagName("ArticleId"));
    const doi = articleIds.find((node) => node.getAttribute("IdType") === "doi")?.textContent?.trim() ?? "";

    map.set(pmid, { description, doi });
  }

  return map;
}

function normalizePubMedItem(id, summary = {}, abstractInfo = {}) {
  const articleIds = Array.isArray(summary.articleids) ? summary.articleids : [];
  const doiFromSummary = articleIds.find((item) => item?.idtype === "doi")?.value ?? "";
  const authors = Array.isArray(summary.authors)
    ? summary.authors.map((author) => author?.name).filter(Boolean).slice(0, 4)
    : [];
  const description = abstractInfo.description || summary.elocationid || "PubMed 未返回摘要。";

  return {
    id,
    pmid: id,
    doi: abstractInfo.doi || doiFromSummary,
    title: summary.title || `PMID ${id}`,
    journal: summary.fulljournalname || summary.source || "",
    pubdate: summary.pubdate || "",
    authors,
    description: truncateText(description, MAX_ABSTRACT_LENGTH),
    metaStatus: "unchecked",
    uploadStatus: "idle",
    uploadMessage: "",
    taskId: "",
    progress: 0,
    error: "",
  };
}

function truncateText(value, maxLength) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
}

async function requestMetaStar(path, options = {}) {
  const headers = new Headers(options.headers);

  let body = options.body;
  if (body !== undefined && !(body instanceof FormData)) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(body);
  }

  const response = await fetch(path, {
    ...options,
    headers,
    body,
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : undefined;
  const code = payload && typeof payload === "object" ? payload.error : undefined;

  if (!response.ok || (code !== undefined && code !== 0)) {
    const message = payload?.message || response.statusText || "MetaStar 请求失败。";
    throw new Error(message);
  }

  return payload;
}

async function checkAllResults() {
  if (state.results.length === 0 || state.checking) {
    return;
  }

  readSettingsForm();
  saveSettings();

  state.checking = true;
  getRequiredElement("checkButton").disabled = true;
  setStatus("正在检测 MetaStar 收录状态。", "loading");

  state.results = state.results.map((item) => ({
    ...item,
    metaStatus: item.metaStatus === "uploaded" ? "uploaded" : "checking",
    error: "",
  }));
  renderResults();

  const checks = state.results.map((item) => checkOneResult(item));
  await Promise.allSettled(checks);

  state.checking = false;
  getRequiredElement("checkButton").disabled = state.results.length === 0;

  const existsCount = state.results.filter((item) => item.metaStatus === "exists").length;
  const missingCount = state.results.filter((item) => item.metaStatus === "missing").length;
  const errorCount = state.results.filter((item) => item.metaStatus === "error").length;

  setStatus(`检测完成：已存在 ${existsCount}，缺失 ${missingCount}，错误 ${errorCount}。`, errorCount > 0 ? "error" : "success");
  renderResults();
}

async function checkOneResult(item) {
  try {
    const payload = await requestMetaStar("./api/literature-fulltext/lookup", {
      method: "POST",
      body: {
        pmid: item.pmid,
        doi: item.doi || undefined,
        limit: 1,
      },
    });
    const data = payload?.data ?? {};

    updateResult(item.id, {
      metaStatus: data.fulltextExists ? "exists" : "missing",
      chunksTotal: Number(data.total ?? 0),
      error: "",
    });
  } catch (error) {
    updateResult(item.id, {
      metaStatus: "error",
      error: error instanceof Error ? error.message : "检测失败。",
    });
  }

  renderResults();
}

function updateResult(id, patch) {
  state.results = state.results.map((item) => (item.id === id ? { ...item, ...patch } : item));
}

async function uploadForResult(id, file) {
  const item = state.results.find((result) => result.id === id);
  if (!item || !file) {
    return;
  }

  readSettingsForm();
  saveSettings();

  try {
    updateResult(id, {
      uploadStatus: "uploading",
      uploadMessage: `正在上传 ${file.name}`,
      error: "",
    });
    renderResults();

    const formData = new FormData();
    formData.append("file", file, file.name);

    const submission = await requestMetaStar("/api/literature-process/submit", {
      method: "POST",
      body: formData,
    });
    const taskId = submission?.data?.taskId;

    if (!taskId) {
      throw new Error("提交成功但未返回 taskId。");
    }

    updateResult(id, {
      taskId,
      uploadStatus: "processing",
      uploadMessage: "解析任务处理中",
      progress: 0,
    });
    renderResults();

    const task = await pollLiteratureProcessTask(id, taskId);
    console.log("MetaStar literature process result", {
      pmid: item.pmid,
      title: item.title,
      task,
    });

    updateResult(id, {
      metaStatus: "uploaded",
      uploadStatus: "completed",
      uploadMessage: "解析完成，结果已输出到控制台",
      progress: 100,
      error: "",
    });
    setStatus(`PMID ${item.pmid} 上传解析完成。`, "success");
  } catch (error) {
    updateResult(id, {
      uploadStatus: "error",
      uploadMessage: "",
      error: error instanceof Error ? error.message : "上传失败。",
    });
    setStatus(error instanceof Error ? error.message : "上传失败。", "error");
  }

  renderResults();
}

async function pollLiteratureProcessTask(resultId, taskId) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < UPLOAD_TIMEOUT_MS) {
    const payload = await requestMetaStar(`/api/literature-process/result/${encodeURIComponent(taskId)}`);
    const task = payload?.data ?? payload;
    const status = task?.status;
    const progress = Number(task?.progress ?? 0);

    updateResult(resultId, {
      progress: Number.isFinite(progress) ? progress : 0,
      uploadMessage: `解析任务处理中 ${Number.isFinite(progress) ? progress : 0}%`,
    });
    renderResults();

    if (status === "completed") {
      return task;
    }

    if (status === "failed") {
      throw new Error(task?.error || "文献解析任务失败。");
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error("文献解析任务超时。");
}

function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function renderResults() {
  const list = getRequiredElement("resultsList");
  const missingOnly = getRequiredElement("missingOnlyInput").checked;
  const visibleResults = missingOnly
    ? state.results.filter((item) => item.metaStatus === "missing" || item.metaStatus === "error")
    : state.results;

  list.replaceChildren();

  if (visibleResults.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = state.results.length === 0 ? "暂无结果。" : "当前筛选条件下没有缺失或检测失败的结果。";
    list.append(empty);
    return;
  }

  for (const item of visibleResults) {
    list.append(renderResultItem(item));
  }
}

function renderResultItem(item) {
  const article = document.createElement("article");
  const titleRow = document.createElement("div");
  const title = document.createElement("h4");
  const link = document.createElement("a");
  const tag = document.createElement("span");
  const description = document.createElement("p");
  const meta = document.createElement("div");
  const foot = document.createElement("footer");
  const status = document.createElement("div");
  const actions = document.createElement("div");

  article.className = "result-item";
  titleRow.className = "result-title-row";
  title.className = "result-title";
  tag.className = "tag";
  tag.dataset.kind = getTagKind(item);
  tag.textContent = getTagText(item);
  link.href = `https://pubmed.ncbi.nlm.nih.gov/${encodeURIComponent(item.pmid)}/`;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = item.title;
  title.append(link);
  titleRow.append(title, tag);

  description.className = "result-description";
  description.textContent = item.description;

  meta.className = "result-meta";
  appendMeta(meta, `PMID ${item.pmid}`);
  if (item.doi) {
    appendMeta(meta, `DOI ${item.doi}`);
  }
  if (item.journal) {
    appendMeta(meta, item.journal);
  }
  if (item.pubdate) {
    appendMeta(meta, item.pubdate);
  }
  if (item.authors.length > 0) {
    appendMeta(meta, item.authors.join(", "));
  }

  foot.className = "result-foot";
  status.className = "result-meta";
  status.textContent = getResultMessage(item);
  actions.className = "result-actions";
  appendActions(actions, item);
  foot.append(status, actions);

  article.append(titleRow, description, meta, foot);
  return article;
}

function appendMeta(container, text) {
  const token = document.createElement("span");
  token.className = "meta-token";
  token.textContent = text;
  container.append(token);
}

function getTagKind(item) {
  if (item.metaStatus === "exists") {
    return "exists";
  }
  if (item.metaStatus === "missing") {
    return "missing";
  }
  if (item.metaStatus === "uploaded") {
    return "uploaded";
  }
  if (item.metaStatus === "checking") {
    return "checking";
  }
  if (item.metaStatus === "error") {
    return "error";
  }
  return "unchecked";
}

function getTagText(item) {
  const textMap = {
    checking: "检测中",
    error: "检测失败",
    exists: "已存在",
    missing: "未收录",
    unchecked: "未检测",
    uploaded: "已上传",
  };

  return textMap[item.metaStatus] ?? "未检测";
}

function getResultMessage(item) {
  if (item.uploadStatus === "uploading" || item.uploadStatus === "processing") {
    return item.uploadMessage;
  }

  if (item.uploadStatus === "completed") {
    return item.uploadMessage;
  }

  if (item.error) {
    return item.error;
  }

  if (item.metaStatus === "exists") {
    return `MetaStar 已收录，全文块 ${item.chunksTotal ?? 0}。`;
  }

  if (item.metaStatus === "missing") {
    return "MetaStar 未收录，可上传 PDF。";
  }

  return "等待检测。";
}

function appendActions(container, item) {
  if (item.metaStatus === "exists") {
    const button = document.createElement("button");
    button.className = "button secondary";
    button.type = "button";
    button.disabled = true;
    button.textContent = "无需上传";
    container.append(button);
    return;
  }

  const input = document.createElement("input");
  const button = document.createElement("button");
  const inputId = `upload-${item.id}`;

  input.id = inputId;
  input.className = "file-input";
  input.type = "file";
  input.accept = ".pdf,application/pdf";
  input.tabIndex = -1;
  input.setAttribute("aria-hidden", "true");
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (file) {
      uploadForResult(item.id, file);
      input.value = "";
    }
  });

  button.className = "button secondary";
  button.type = "button";
  button.textContent = item.uploadStatus === "completed" ? "已上传" : "上传";
  button.disabled =
    item.metaStatus === "checking" ||
    item.metaStatus === "uploaded" ||
    item.uploadStatus === "uploading" ||
    item.uploadStatus === "processing";
  button.classList.toggle("loading", item.uploadStatus === "uploading" || item.uploadStatus === "processing");
  button.addEventListener("click", () => {
    input.click();
  });

  container.append(input, button);
}

async function handleSearch() {
  if (state.searching) {
    return;
  }

  parseKeywordInput();

  if (state.keywords.length === 0) {
    state.extracting = true;
    setButtonLoading(getRequiredElement("parseButton"), true);
    setStatus("正在使用 OpenAI 提取关键词。", "loading");

    try {
      state.keywords = await extractKeywordsFromOpenAi();
      updateKeywordInput();
    } catch (error) {
      state.extracting = false;
      setButtonLoading(getRequiredElement("parseButton"), false);
      setStatus(error instanceof Error ? error.message : "OpenAI 关键词提取失败。", "error");
      return;
    }

    state.extracting = false;
    setButtonLoading(getRequiredElement("parseButton"), false);
  }

  const term = buildPubMedTerm();

  if (!term) {
    setStatus("请输入 query 或关键词。", "error");
    getRequiredElement("queryInput").focus();
    return;
  }

  state.searching = true;
  setButtonLoading(getRequiredElement("searchButton"), true);
  getRequiredElement("checkButton").disabled = true;
  setStatus(`正在搜索：${term}`, "loading");
  state.results = [];
  renderResults();

  try {
    const maxResults = Number(getRequiredElement("maxResultsInput").value);
    const sort = getRequiredElement("sortInput").value;
    state.results = await searchPubMed(term, maxResults, sort);
    renderResults();
    getRequiredElement("checkButton").disabled = state.results.length === 0;

    if (state.results.length === 0) {
      setStatus("PubMed 未返回结果。", "success");
      return;
    }

    setStatus(`PubMed 返回 ${state.results.length} 条结果，准备检测 MetaStar 收录状态。`, "success");
    await checkAllResults();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "PubMed 搜索失败。", "error");
  } finally {
    state.searching = false;
    setButtonLoading(getRequiredElement("searchButton"), false);
    getRequiredElement("checkButton").disabled = state.results.length === 0 || state.checking;
  }
}

function bindEvents() {
  getRequiredElement("themeMode").addEventListener("change", (event) => {
    state.themeMode = event.target.value;
    localStorage.setItem(THEME_KEY, state.themeMode);
    applyTheme();
  });

  getRequiredElement("openDialogButton").addEventListener("click", () => {
    getRequiredElement("dialogBackdrop").dataset.open = "true";
  });

  getRequiredElement("closeDialogButton").addEventListener("click", () => {
    getRequiredElement("dialogBackdrop").dataset.open = "false";
  });

  getRequiredElement("settingsButton").addEventListener("click", () => {
    const panel = getRequiredElement("settingsPanel");
    const expanded = panel.hidden;
    panel.hidden = !expanded;
    getRequiredElement("settingsButton").setAttribute("aria-expanded", String(expanded));
  });

  getRequiredElement("settingsForm").addEventListener("submit", (event) => {
    event.preventDefault();
    readSettingsForm();
    saveSettings();
    setStatus("接口设置已保存。", "success");
  });

  getRequiredElement("parseButton").addEventListener("click", handleExtractKeywords);

  getRequiredElement("keywordInput").addEventListener("change", parseKeywordInput);
  getRequiredElement("searchButton").addEventListener("click", handleSearch);
  getRequiredElement("checkButton").addEventListener("click", checkAllResults);
  getRequiredElement("missingOnlyInput").addEventListener("change", renderResults);

  getRequiredElement("resetButton").addEventListener("click", () => {
    getRequiredElement("queryInput").value = "";
    state.keywords = [];
    state.results = [];
    updateKeywordInput();
    renderResults();
    setStatus("输入 query 后解析关键词并搜索 PubMed。");
  });

  getRequiredElement("queryInput").addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      handleSearch();
    }
  });
}

function init() {
  initTheme();
  readSavedSettings();
  syncSettingsForm();
  bindEvents();
  renderKeywordChips();
  renderResults();
}

init();
