const fetch = globalThis.fetch;

const normalizeOrigin = (origin = "") => origin.replace(/\/$/, "");

const buildOriginMatchers = () => {
  if (!process.env.ALLOWED_ORIGINS) {
    return [];
  }
  return process.env.ALLOWED_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => {
      if (origin.endsWith(":*")) {
        return {
          type: "wildcard",
          value: normalizeOrigin(origin.slice(0, -2)),
        };
      }
      return { type: "exact", value: normalizeOrigin(origin) };
    });
};

const originMatchers = buildOriginMatchers();

const isAllowedOrigin = (origin) => {
  if (!originMatchers.length || !origin) {
    return true;
  }
  const normalized = normalizeOrigin(origin);
  return originMatchers.some((matcher) => {
    if (matcher.type === "exact") {
      return normalized === matcher.value;
    }
    if (matcher.type === "wildcard") {
      return (
        normalized === matcher.value ||
        normalized.startsWith(`${matcher.value}:`)
      );
    }
    return false;
  });
};

const respond = (res, statusCode, payload, origin) => {
  res.status(statusCode);
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.json(payload);
};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const GEMINI_ENDPOINT = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${GEMINI_API_KEY}`;

const toGeminiContents = (messages = []) => {
  const contents = [];

  for (const message of messages) {
    const role = message?.role;
    const text =
      typeof message?.content === "string"
        ? message.content.trim()
        : Array.isArray(message?.parts)
          ? message.parts
              .map((part) => part?.text || "")
              .join("\n")
              .trim()
          : "";

    if (!text) {
      continue;
    }

    if (role === "system") {
      continue;
    }

    contents.push({
      role: role === "assistant" ? "model" : "user",
      parts: [{ text }],
    });
  }

  return contents;
};

const extractGeminiReply = (data) => {
  const candidates = data?.candidates || [];
  const firstCandidate = candidates[0];
  const parts = firstCandidate?.content?.parts || [];
  return parts
    .map((part) => part?.text || "")
    .join("")
    .trim();
};

module.exports = async (req, res) => {
  const origin = req.headers.origin;

  if (req.method === "OPTIONS") {
    respond(res, 200, { status: "ok" }, origin);
    return;
  }

  if (!isAllowedOrigin(origin)) {
    respond(res, 403, { error: "not-allowed" }, origin);
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    respond(res, 405, { error: "method-not-allowed" }, origin);
    return;
  }

  if (!GEMINI_API_KEY) {
    respond(res, 500, { error: "missing-gemini-key" }, origin);
    return;
  }

  const payload = req.body;
  if (!payload || !payload.messages) {
    respond(res, 400, { error: "missing-payload" }, origin);
    return;
  }

  try {
    const upstream = await fetch(GEMINI_ENDPOINT(GEMINI_MODEL), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: "You are Dasara Mitra, a warm cultural guide for Mysuru Dasara.",
            },
          ],
        },
        contents: toGeminiContents(payload.messages),
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 256,
        },
      }),
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      respond(
        res,
        upstream.status,
        { error: "upstream-error", detail: data },
        origin,
      );
      return;
    }

    const reply = extractGeminiReply(data);
    if (!reply) {
      respond(res, 502, { error: "empty-response" }, origin);
      return;
    }

    respond(res, 200, { reply, raw: data }, origin);
  } catch (error) {
    console.error("Assistant function error:", error);
    respond(res, 502, { error: "upstream-error" }, origin);
  }
};
