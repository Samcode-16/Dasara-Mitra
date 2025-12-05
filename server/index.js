import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

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

const OSRM_BASE_URL = normalizeOrigin(process.env.OSRM_BASE_URL || 'https://router.project-osrm.org');
const DEFAULT_OSRM_PROFILES = (process.env.OSRM_PROFILES || 'foot,walking,driving')
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean);

const buildOsrmQuery = (steps = true) => {
  const params = new URLSearchParams({
    alternatives: 'false',
    overview: 'full',
    geometries: 'geojson',
    steps: steps ? 'true' : 'false'
  });
  return params.toString();
};

const fetchOsrmRoute = async ({ coords, steps = true, profiles = DEFAULT_OSRM_PROFILES }) => {
  const query = buildOsrmQuery(steps);
  let lastError = null;

  for (const profile of profiles) {
    try {
      const upstream = await fetch(`${OSRM_BASE_URL}/route/v1/${profile}/${coords}?${query}`);
      if (!upstream.ok) {
        lastError = new Error(`status-${upstream.status}`);
        continue;
      }

      const data = await upstream.json();
      if (data?.routes?.length) {
        return { profile, route: data.routes[0] };
      }

      lastError = new Error('no-routes');
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('osrm-unavailable');
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
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'missing-server-key' });
  }

  const payload = req.body;
  if (!payload || !payload.contents) {
    return res.status(400).json({ error: 'missing-payload' });
  }

  try {
    const upstream = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (error) {
    console.error('Assistant proxy error:', error);
    res.status(502).json({ error: 'upstream-error' });
  }
});

app.get('/api/osrm-route', async (req, res) => {
  const coordsParam = typeof req.query.coords === 'string' ? req.query.coords.trim() : null;
  if (!coordsParam) {
    return res.status(400).json({ error: 'missing-coords' });
  }

  const steps = req.query.steps !== 'false';
  const profileOverride = typeof req.query.profiles === 'string'
    ? req.query.profiles.split(',').map((entry) => entry.trim()).filter(Boolean)
    : null;

  try {
    const result = await fetchOsrmRoute({
      coords: coordsParam,
      steps,
      profiles: profileOverride?.length ? profileOverride : undefined
    });
    res.json(result);
  } catch (error) {
    console.error('OSRM proxy error:', error);
    res.status(502).json({ error: 'osrm-unavailable' });
  }
});

app.listen(PORT, () => {
  console.log(`Dasara Mitra assistant proxy listening on port ${PORT}`);
});
