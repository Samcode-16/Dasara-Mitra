import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Support GROQ API as well as OpenAI
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

const normalizeOrigin = (origin = '') => origin.replace(/\/$/, '');

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
  : [];

const originMatchers = allowedOrigins.map((origin) => {
  if (origin.endsWith(':*')) {
    return { type: 'wildcard', value: normalizeOrigin(origin.slice(0, -2)) };
  }
  return { type: 'exact', value: normalizeOrigin(origin) };
});

const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY;
const VALID_TRAVEL_MODES = new Set(['pedestrian', 'car', 'bicycle', 'truck', 'bus']);

const normalizeCoordinates = (coordsParam = '') => {
  return coordsParam
    .split(';')
    .map((pair) => pair.trim())
    .map((pair) => {
      const [lng, lat] = pair.split(',').map((value) => Number(value.trim()));
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return null;
      }
      return { lat, lng };
    })
    .filter(Boolean);
};

const fetchTomTomRoute = async ({ coords, mode = 'pedestrian' }) => {
  if (!TOMTOM_API_KEY) {
    throw new Error('missing-tomtom-key');
  }

  const travelMode = VALID_TRAVEL_MODES.has(mode) ? mode : 'pedestrian';
  const coordinates = normalizeCoordinates(coords);
  if (!coordinates.length) {
    throw new Error('missing-coordinates');
  }

  const segment = coordinates.map(({ lat, lng }) => `${lat},${lng}`).join(':');
  const routingUrl = new URL(`https://api.tomtom.com/routing/1/calculateRoute/${segment}/json`);
  routingUrl.searchParams.set('key', TOMTOM_API_KEY);
  routingUrl.searchParams.set('travelMode', travelMode);
  routingUrl.searchParams.set('instructionsType', 'text');
  routingUrl.searchParams.set('avoid', 'unpavedRoads');
  routingUrl.searchParams.set('sectionType', travelMode === 'pedestrian' ? 'pedestrian' : 'traffic');
  routingUrl.searchParams.set('computeTravelTimeFor', 'all');

  const upstream = await fetch(routingUrl.toString());
  if (!upstream.ok) {
    throw new Error(`status-${upstream.status}`);
  }

  const data = await upstream.json();
  const route = data?.routes?.[0];
  if (!route) {
    throw new Error('tomtom-empty');
  }

  const coordinatesLine = route.legs
    ?.flatMap((leg) => leg.points || [])
    .map((point) => [point.longitude, point.latitude]);

  if (!coordinatesLine?.length) {
    throw new Error('tomtom-no-points');
  }

  return {
    coordinates: coordinatesLine,
    summary: route.summary ?? null
  };
};

const corsOptions = {
  origin: (requestOrigin, callback) => {
    if (!originMatchers.length || !requestOrigin) {
      return callback(null, true);
    }

    const normalizedRequest = normalizeOrigin(requestOrigin);
    const isAllowed = originMatchers.some((matcher) => {
      if (matcher.type === 'exact') {
        return normalizedRequest === matcher.value;
      }
      if (matcher.type === 'wildcard') {
        return (
          normalizedRequest === matcher.value ||
          normalizedRequest.startsWith(`${matcher.value}:`)
        );
      }
      return false;
    });

    return isAllowed ? callback(null, true) : callback(new Error('Not allowed by CORS'));
  },
  credentials: false
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});


app.post('/api/assistant', async (req, res) => {
  // Prefer GROQ if key is present, else fallback to OpenAI
  const useGroq = !!GROQ_API_KEY;
  const apiKey = useGroq ? GROQ_API_KEY : OPENAI_API_KEY;
  const endpoint = useGroq ? GROQ_ENDPOINT : OPENAI_ENDPOINT;
  const model = useGroq ? GROQ_MODEL : OPENAI_MODEL;

  if (!apiKey) {
    return res.status(500).json({ error: 'missing-server-key' });
  }

  const payload = req.body;
  if (!payload || !payload.messages) {
    return res.status(400).json({ error: 'missing-payload' });
  }

  try {
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: payload.messages
      })
    });

    let data;
    try {
      data = await upstream.json();
    } catch (jsonError) {
      console.error('API response not JSON:', await upstream.text());
      return res.status(502).json({ error: 'upstream-error', detail: 'Invalid JSON from API' });
    }

    if (!upstream.ok) {
      console.error('API error:', data);
      return res.status(upstream.status).json({ error: 'upstream-error', detail: data });
    }

    res.status(upstream.status).json(data);
  } catch (error) {
    console.error('Assistant proxy error:', error);
    res.status(502).json({ error: 'upstream-error', detail: error?.message || error });
  }
});

app.get('/api/osrm-route', async (req, res) => {
  const coordsParam = typeof req.query.coords === 'string' ? req.query.coords.trim() : null;
  if (!coordsParam) {
    return res.status(400).json({ error: 'missing-coords' });
  }

  const mode = typeof req.query.mode === 'string' ? req.query.mode.toLowerCase() : 'pedestrian';

  try {
    const result = await fetchTomTomRoute({
      coords: coordsParam,
      mode
    });
    res.json(result);
  } catch (error) {
    console.error('TomTom proxy error:', error);
    const detail = error?.message || 'tomtom-unavailable';
    res.status(502).json({ error: 'tomtom-unavailable', detail });
  }
});

app.listen(PORT, () => {
  console.log(`Dasara Mitra assistant proxy listening on port ${PORT}`);
});
