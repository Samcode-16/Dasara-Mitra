import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "..", ".env"), override: true });

const app = express();
const PORT = process.env.PORT || 4000;

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

const normalizeOrigin = (origin = "") => origin.replace(/\/$/, "");

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  : [];

const originMatchers = allowedOrigins.map((origin) => {
  if (origin.endsWith(":*")) {
    return { type: "wildcard", value: normalizeOrigin(origin.slice(0, -2)) };
  }
  return { type: "exact", value: normalizeOrigin(origin) };
});

const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY || process.env.VITE_TOMTOM_API_KEY;
const VALID_TRAVEL_MODES = new Set([
  "pedestrian",
  "car",
  "bicycle",
  "truck",
  "bus",
]);

const normalizeCoordinates = (coordsParam = "") => {
  return coordsParam
    .split(";")
    .map((pair) => pair.trim())
    .map((pair) => {
      const [lng, lat] = pair.split(",").map((value) => Number(value.trim()));
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return null;
      }
      return { lat, lng };
    })
    .filter(Boolean);
};

const fetchTomTomRoute = async ({ coords, mode = "pedestrian" }) => {
  if (!TOMTOM_API_KEY) {
    throw new Error("missing-tomtom-key");
  }

  const travelMode = VALID_TRAVEL_MODES.has(mode) ? mode : "pedestrian";
  const coordinates = normalizeCoordinates(coords);
  if (!coordinates.length) {
    throw new Error("missing-coordinates");
  }

  const segment = coordinates.map(({ lat, lng }) => `${lat},${lng}`).join(":");
  const routingUrl = new URL(
    `https://api.tomtom.com/routing/1/calculateRoute/${segment}/json`,
  );
  routingUrl.searchParams.set("key", TOMTOM_API_KEY);
  routingUrl.searchParams.set("travelMode", travelMode);
  routingUrl.searchParams.set("instructionsType", "text");
  routingUrl.searchParams.set("avoid", "unpavedRoads");
  routingUrl.searchParams.set(
    "sectionType",
    travelMode === "pedestrian" ? "pedestrian" : "traffic",
  );
  routingUrl.searchParams.set("computeTravelTimeFor", "all");

  const upstream = await fetch(routingUrl.toString());
  if (!upstream.ok) {
    throw new Error(`status-${upstream.status}`);
  }

  const data = await upstream.json();
  const route = data?.routes?.[0];
  if (!route) {
    throw new Error("tomtom-empty");
  }

  const coordinatesLine = route.legs
    ?.flatMap((leg) => leg.points || [])
    .map((point) => [point.longitude, point.latitude]);

  if (!coordinatesLine?.length) {
    throw new Error("tomtom-no-points");
  }

  return {
    coordinates: coordinatesLine,
    summary: route.summary ?? null,
  };
};

const corsOptions = {
  origin: (requestOrigin, callback) => {
    if (!originMatchers.length || !requestOrigin) {
      return callback(null, true);
    }

    const normalizedRequest = normalizeOrigin(requestOrigin);
    const isAllowed = originMatchers.some((matcher) => {
      if (matcher.type === "exact") {
        return normalizedRequest === matcher.value;
      }
      if (matcher.type === "wildcard") {
        return (
          normalizedRequest === matcher.value ||
          normalizedRequest.startsWith(`${matcher.value}:`)
        );
      }
      return false;
    });

    return isAllowed
      ? callback(null, true)
      : callback(new Error("Not allowed by CORS"));
  },
  credentials: false,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

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
  new Set([GEMINI_MODEL, "gemini-3.5-flash", "gemini-2.0-flash", "gemini-2.5-flash"])
);

app.post("/api/assistant", async (req, res) => {
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: "missing-gemini-key" });
  }

  const payload = req.body;
  if (!payload || !payload.messages) {
    return res.status(400).json({ error: "missing-payload" });
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

      let data;
      try {
        data = await upstream.json();
      } catch (jsonError) {
        lastStatus = 502;
        lastErrorDetail = "Invalid JSON from API";
        continue;
      }

      if (upstream.ok) {
        const reply = extractGeminiReply(data);
        if (reply) {
          return res.status(200).json({ reply, raw: data });
        }
      }

      lastStatus = upstream.status;
      lastErrorDetail = extractGeminiErrorDetail(data);
      console.warn(`Model ${model} returned status ${upstream.status}: ${lastErrorDetail}`);
    } catch (error) {
      console.error(`Error trying model ${model}:`, error);
      lastErrorDetail = error?.message || "unknown-error";
    }
  }

  const isRateLimit =
    lastStatus === 429 ||
    /quota|rate limit|RESOURCE_EXHAUSTED/i.test(lastErrorDetail);

  res.status(isRateLimit ? 429 : lastStatus).json({
    error: isRateLimit ? "rate-limit-exceeded" : "upstream-error",
    detail: isRateLimit
      ? "The AI assistant is receiving high traffic right now. Please wait a few seconds and try again."
      : lastErrorDetail,
    upstreamStatus: lastStatus,
  });
});

app.get("/api/osrm-route", async (req, res) => {
  const coordsParam =
    typeof req.query.coords === "string" ? req.query.coords.trim() : null;
  if (!coordsParam) {
    return res.status(400).json({ error: "missing-coords" });
  }

  const mode =
    typeof req.query.mode === "string"
      ? req.query.mode.toLowerCase()
      : "pedestrian";

  try {
    const result = await fetchTomTomRoute({
      coords: coordsParam,
      mode,
    });
    res.json(result);
  } catch (error) {
    console.error("TomTom proxy error:", error);
    const detail = error?.message || "tomtom-unavailable";
    res.status(502).json({ error: "tomtom-unavailable", detail });
  }
});

app.listen(PORT, () => {
  console.log(`Dasara Mitra assistant proxy listening on port ${PORT}`);
});
