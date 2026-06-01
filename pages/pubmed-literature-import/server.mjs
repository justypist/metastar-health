import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT ?? 4175);
const defaultOpenAiBaseUrl = "https://api.openai.com/v1";
const defaultMetaStarBaseUrl = "https://search-alpha.metastar-health.com/prod-api";

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".md", "text/markdown; charset=utf-8"],
  [".svg", "image/svg+xml"],
]);

function normalizeBaseUrl(value, fallback) {
  const baseUrl = value?.trim() || fallback;

  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

function normalizeOpenAiBaseUrl(value) {
  return normalizeBaseUrl(value, defaultOpenAiBaseUrl);
}

function resolvePath(url) {
  const pathname = decodeURIComponent(new URL(url, `http://localhost:${port}`).pathname);
  const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const normalizedPath = resolve(root, relativePath);
  const escapedRoot = relative(root, normalizedPath);

  if (escapedRoot === ".." || escapedRoot.startsWith(`..${sep}`) || isAbsolute(escapedRoot)) {
    throw new Error("Path escapes static root.");
  }

  return normalizedPath;
}

function sendText(response, statusCode, text) {
  response.writeHead(statusCode, {
    "content-type": "text/plain; charset=utf-8",
  });
  response.end(text);
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

async function readJsonRequest(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const text = Buffer.concat(chunks).toString("utf8").trim();

  return text ? JSON.parse(text) : {};
}

function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function uniqueKeywords(values) {
  const seen = new Set();
  const result = [];

  for (const value of values) {
    const keyword = value.replace(/\s+/g, " ").trim();
    const key = keyword.toLowerCase();

    if (keyword && !seen.has(key)) {
      seen.add(key);
      result.push(keyword);
    }
  }

  return result.slice(0, 10);
}

function extractJsonContent(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);

  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  return trimmed;
}

function readKeywordsFromModelContent(content) {
  const parsed = JSON.parse(extractJsonContent(content));

  if (isStringArray(parsed)) {
    return uniqueKeywords(parsed);
  }

  if (typeof parsed === "object" && parsed !== null && isStringArray(parsed.keywords)) {
    return uniqueKeywords(parsed.keywords);
  }

  throw new Error("OpenAI 返回格式缺少 keywords 数组。");
}

function readMetaStarConfig() {
  const appKey = process.env.APP_KEY?.trim();
  const appSecret = process.env.APP_SECRET?.trim();

  if (!appKey || !appSecret) {
    throw new Error("缺少 APP_KEY 或 APP_SECRET。");
  }

  return {
    appKey,
    appSecret,
    baseUrl: normalizeBaseUrl(process.env.OPEN_API_BASE_URL, defaultMetaStarBaseUrl),
  };
}

async function requestMetaStarJson(path, body) {
  const config = readMetaStarConfig();
  const url = new URL(path.replace(/^\//, ""), `${config.baseUrl}/`);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-app-key": config.appKey,
      "x-app-secret": config.appSecret,
    },
    body: JSON.stringify(body),
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

async function proxyMetaStarRequest(request, response, path) {
  const config = readMetaStarConfig();
  const url = new URL(path.replace(/^\//, ""), `${config.baseUrl}/`);
  const headers = new Headers();
  const contentType = request.headers["content-type"];

  headers.set("x-app-key", config.appKey);
  headers.set("x-app-secret", config.appSecret);

  if (contentType) {
    headers.set("content-type", Array.isArray(contentType) ? contentType.join(", ") : contentType);
  }

  const hasBody = !["GET", "HEAD"].includes(request.method ?? "GET");
  const upstreamResponse = await fetch(url, {
    method: request.method,
    headers,
    body: hasBody ? request : undefined,
    duplex: hasBody ? "half" : undefined,
  });
  const text = await upstreamResponse.text();

  response.writeHead(upstreamResponse.status, {
    "cache-control": "no-store",
    "content-type": upstreamResponse.headers.get("content-type") ?? "application/json; charset=utf-8",
  });
  response.end(text);
}

async function extractKeywordsWithOpenAi(query) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;

  if (!apiKey || !model) {
    throw new Error("缺少 OPENAI_API_KEY 或 OPENAI_MODEL。");
  }

  const url = new URL(`${normalizeOpenAiBaseUrl(process.env.OPENAI_BASE_URL)}/chat/completions`);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "你是 PubMed 检索关键词提取器。把用户的中文或英文问题提取为 3 到 8 个适合 PubMed title/abstract 检索的关键词或短语。优先保留基因、靶点、疾病、药物、机制等生物医学实体；中文疾病或机制尽量转为常见英文医学表达；不要输出 Boolean 操作符、字段限定符、解释或多余文本。只输出 JSON，格式为 {\"keywords\":[\"...\"]}。",
        },
        {
          role: "user",
          content: query,
        },
      ],
      temperature: 0,
    }),
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const message = payload?.error?.message || payload?.message || response.statusText;
    throw new Error(message);
  }

  const content = payload?.choices?.[0]?.message?.content;

  if (typeof content !== "string" || !content.trim()) {
    throw new Error("OpenAI 未返回关键词内容。");
  }

  return readKeywordsFromModelContent(content);
}

async function handleExtractKeywords(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method Not Allowed" });
    return;
  }

  try {
    const body = await readJsonRequest(request);
    const query = typeof body.query === "string" ? body.query.trim() : "";

    if (!query) {
      sendJson(response, 400, { error: "Query 不能为空。" });
      return;
    }

    const keywords = await extractKeywordsWithOpenAi(query);
    sendJson(response, 200, { keywords });
  } catch (error) {
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : "关键词提取失败。",
    });
  }
}

async function handleLiteratureFulltextLookup(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method Not Allowed" });
    return;
  }

  try {
    const body = await readJsonRequest(request);
    const pmid = typeof body.pmid === "string" ? body.pmid.trim() : "";
    const doi = typeof body.doi === "string" ? body.doi.trim() : "";
    const limit = typeof body.limit === "number" ? body.limit : 1;

    if (!pmid && !doi) {
      sendJson(response, 400, { error: "PMID 或 DOI 不能为空。" });
      return;
    }

    const payload = await requestMetaStarJson("/api/literature-fulltext/lookup", {
      pmid: pmid || undefined,
      doi: doi || undefined,
      limit,
    });

    sendJson(response, 200, payload);
  } catch (error) {
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : "MetaStar 收录检测失败。",
    });
  }
}

async function handleLiteratureProcess(request, response, pathname) {
  try {
    if (pathname === "/api/literature-process/submit") {
      if (request.method !== "POST") {
        sendJson(response, 405, { error: "Method Not Allowed" });
        return;
      }

      await proxyMetaStarRequest(request, response, "/api/literature-process/submit");
      return;
    }

    if (pathname.startsWith("/api/literature-process/result/")) {
      if (request.method !== "GET") {
        sendJson(response, 405, { error: "Method Not Allowed" });
        return;
      }

      await proxyMetaStarRequest(request, response, pathname);
      return;
    }

    sendJson(response, 404, { error: "Not Found" });
  } catch (error) {
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : "MetaStar 文献解析代理失败。",
    });
  }
}

const server = createServer(async (request, response) => {
  const pathname = request.url ? new URL(request.url, `http://localhost:${port}`).pathname : "";

  if (pathname === "/api/extract-keywords") {
    await handleExtractKeywords(request, response);
    return;
  }

  if (pathname === "/api/literature-fulltext/lookup") {
    await handleLiteratureFulltextLookup(request, response);
    return;
  }

  if (pathname === "/api/literature-process/submit" || pathname.startsWith("/api/literature-process/result/")) {
    await handleLiteratureProcess(request, response, pathname);
    return;
  }

  if (!request.url || !["GET", "HEAD"].includes(request.method ?? "")) {
    sendText(response, 405, "Method Not Allowed");
    return;
  }

  try {
    const filePath = resolvePath(request.url);
    const fileStat = await stat(filePath);
    const resolvedFile = fileStat.isDirectory() ? join(filePath, "index.html") : filePath;
    const resolvedStat = await stat(resolvedFile);

    if (!resolvedStat.isFile()) {
      sendText(response, 404, "Not Found");
      return;
    }

    const type = contentTypes.get(extname(resolvedFile)) ?? "application/octet-stream";

    response.writeHead(200, {
      "cache-control": "no-store",
      "content-type": type,
    });
    if (request.method === "HEAD") {
      response.end();
      return;
    }

    const stream = createReadStream(resolvedFile);
    stream.on("error", () => {
      response.destroy();
    });
    stream.pipe(response);
  } catch {
    sendText(response, 404, "Not Found");
  }
});

server.listen(port, () => {
  console.log(`PubMed literature import page: http://localhost:${port}`);
});
