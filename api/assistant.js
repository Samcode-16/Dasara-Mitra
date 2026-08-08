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
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
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

const extractGeminiErrorDetail = (data) => {
  if (!data) {
    return "unknown-gemini-error";
  }

  if (typeof data.error === "string") {
    return data.error;
  }

  if (data.error?.message) {
    return data.error.message;
  }

  if (data.error?.status) {
    return `${data.error.status}${data.error?.code ? `:${data.error.code}` : ""}`;
  }

  if (data.message) {
    return data.message;
  }

  return JSON.stringify(data);
};

const CANDIDATE_MODELS = Array.from(
  new Set([
    GEMINI_MODEL,
    "gemini-3.5-flash",
    "gemini-2.0-flash",
    "gemini-2.5-flash",
  ]),
);

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

  let lastStatus = 502;
  let lastErrorDetail = "unknown-error";

  for (const model of CANDIDATE_MODELS) {
    try {
      const upstream = await fetch(GEMINI_ENDPOINT(model), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text:
                  "You are Dasara Mitra, an exclusive, warm cultural guide dedicated to Mysuru Dasara, Mysuru tourism, culture, festival events, venues, history, local food, and travel in Mysuru.\n\n" +
                  "STRICT FORMATTING RULE:\n" +
                  "Do NOT use any asterisks (*) or double asterisks (**) or markdown bolding anywhere in your response. Write clean plain text using standard sentences or simple dashes (-) for lists, ensuring it sounds completely natural when read out loud.\n\n" +
                  "STRICT SCOPE RULE:\n" +
                  "You MUST ONLY answer questions related to Mysuru, Mysuru Dasara, festival events, venues, local transport, culture, history, and tourism in Mysuru.\n" +
                  "If a user asks about completely unrelated topics (e.g. programming, mathematics, general science, finance, world politics, or non-Mysuru topics), politely decline and warmly redirect them to ask about Mysuru Dasara or visiting Mysuru.",
              },
            ],
          },
          contents: toGeminiContents(payload.messages),
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      });

      const data = await upstream.json().catch(() => null);
      if (upstream.ok && data) {
        const reply = extractGeminiReply(data);
        if (reply) {
          respond(res, 200, { reply, raw: data }, origin);
          return;
        }
      }

      lastStatus = upstream.status;
      lastErrorDetail = extractGeminiErrorDetail(data);
    } catch (error) {
      lastErrorDetail = error?.message || "unknown-error";
    }
  }

  const isRateLimit =
    lastStatus === 429 ||
    /quota|rate limit|RESOURCE_EXHAUSTED/i.test(lastErrorDetail);

  respond(
    res,
    isRateLimit ? 429 : lastStatus,
    {
      error: isRateLimit ? "rate-limit-exceeded" : "upstream-error",
      detail: isRateLimit
        ? "The AI assistant is receiving high traffic right now. Please wait a few seconds and try again."
        : lastErrorDetail,
      upstreamStatus: lastStatus,
    },
    origin,
  );
};
