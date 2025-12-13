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



  // Support GROQ API as well as OpenAI
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
  const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
  const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

  // Prefer GROQ if key is present, else fallback to OpenAI
  const useGroq = !!GROQ_API_KEY;
  const apiKey = useGroq ? GROQ_API_KEY : OPENAI_API_KEY;
  const endpoint = useGroq ? GROQ_ENDPOINT : OPENAI_ENDPOINT;
  const model = useGroq ? GROQ_MODEL : OPENAI_MODEL;

  if (!apiKey) {
    respond(res, 500, { error: 'missing-server-key' }, origin);
    return;
  }


  const payload = req.body;
  if (!payload || !payload.messages) {
    respond(res, 400, { error: 'missing-payload' }, origin);
    return;
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
