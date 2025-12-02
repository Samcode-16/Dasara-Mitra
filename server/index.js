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

app.listen(PORT, () => {
  console.log(`Dasara Mitra assistant proxy listening on port ${PORT}`);
});
