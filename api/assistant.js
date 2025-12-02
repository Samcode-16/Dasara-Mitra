const fetch = globalThis.fetch;

const normalizeOrigin = (origin = '') => origin.replace(/\/$/, '');

const buildOriginMatchers = () => {
  if (!process.env.ALLOWED_ORIGINS) {
    return [];
  }
  return process.env.ALLOWED_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => {
      if (origin.endsWith(':*')) {
        return { type: 'wildcard', value: normalizeOrigin(origin.slice(0, -2)) };
      }
      return { type: 'exact', value: normalizeOrigin(origin) };
    });
};

const originMatchers = buildOriginMatchers();

const isAllowedOrigin = (origin) => {
  if (!originMatchers.length || !origin) {
    return true;
  }
  const normalized = normalizeOrigin(origin);
  return originMatchers.some((matcher) => {
    if (matcher.type === 'exact') {
      return normalized === matcher.value;
    }
    if (matcher.type === 'wildcard') {
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
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.json(payload);
};

module.exports = async (req, res) => {
  const origin = req.headers.origin;

  if (req.method === 'OPTIONS') {
    respond(res, 200, { status: 'ok' }, origin);
    return;
  }

  if (!isAllowedOrigin(origin)) {
    respond(res, 403, { error: 'not-allowed' }, origin);
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    respond(res, 405, { error: 'method-not-allowed' }, origin);
    return;
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    respond(res, 500, { error: 'missing-server-key' }, origin);
    return;
  }

  const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

  const payload = req.body;
  if (!payload || !payload.contents) {
    respond(res, 400, { error: 'missing-payload' }, origin);
    return;
  }

  try {
    const upstream = await fetch(`${endpoint}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await upstream.json();
    res.status(upstream.status);
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.json(data);
  } catch (error) {
    console.error('Assistant function error:', error);
    respond(res, 502, { error: 'upstream-error' }, origin);
  }
};
