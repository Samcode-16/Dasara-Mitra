const fetch = globalThis.fetch;

const normalizeBaseUrl = (value = '') => value.replace(/\/$/, '');
const DEFAULT_OSRM_BASE = normalizeBaseUrl(process.env.OSRM_BASE_URL || 'https://router.project-osrm.org');
const DEFAULT_PROFILE_LIST = (process.env.OSRM_PROFILES || 'foot,walking,driving')
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean);

const buildQuery = (steps = true) => {
  const params = new URLSearchParams({
    alternatives: 'false',
    overview: 'full',
    geometries: 'geojson',
    steps: steps ? 'true' : 'false'
  });
  return params.toString();
};

const respond = (res, statusCode, payload, origin) => {
  res.status(statusCode);
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.json(payload);
};

module.exports = async (req, res) => {
  const origin = req.headers.origin;

  if (req.method === 'OPTIONS') {
    respond(res, 200, { status: 'ok' }, origin);
    return;
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    respond(res, 405, { error: 'method-not-allowed' }, origin);
    return;
  }

  const coordsParam = typeof req.query?.coords === 'string' ? req.query.coords.trim() : null;
  if (!coordsParam) {
    respond(res, 400, { error: 'missing-coords' }, origin);
    return;
  }

  const steps = req.query?.steps !== 'false';
  const manualProfiles = typeof req.query?.profiles === 'string'
    ? req.query.profiles.split(',').map((entry) => entry.trim()).filter(Boolean)
    : null;
  const profiles = manualProfiles?.length ? manualProfiles : DEFAULT_PROFILE_LIST;

  const search = buildQuery(steps);
  let lastError = null;

  for (const profile of profiles) {
    try {
      const upstream = await fetch(`${DEFAULT_OSRM_BASE}/route/v1/${profile}/${coordsParam}?${search}`);
      if (!upstream.ok) {
        lastError = new Error(`status-${upstream.status}`);
        continue;
      }
      const data = await upstream.json();
      if (data?.routes?.length) {
        respond(res, 200, { profile, route: data.routes[0] }, origin);
        return;
      }
      lastError = new Error('no-routes');
    } catch (error) {
      lastError = error;
    }
  }

  respond(res, 502, { error: 'osrm-unavailable', detail: lastError?.message || 'unknown' }, origin);
};
const fetch = globalThis.fetch;

const normalizeBaseUrl = (value = '') => value.replace(/\/$/, '');
const DEFAULT_OSRM_BASE = normalizeBaseUrl(process.env.OSRM_BASE_URL || 'https://router.project-osrm.org');
const DEFAULT_PROFILE_LIST = (process.env.OSRM_PROFILES || 'foot,walking,driving')
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean);

const buildQuery = (steps = true) => {
  const params = new URLSearchParams({
    alternatives: 'false',
    overview: 'full',
    geometries: 'geojson',
    steps: steps ? 'true' : 'false'
  });
  return params.toString();
};

const respond = (res, statusCode, payload, origin) => {
  res.status(statusCode);
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.json(payload);
};

module.exports = async (req, res) => {
  const origin = req.headers.origin;

  if (req.method === 'OPTIONS') {
    respond(res, 200, { status: 'ok' }, origin);
    return;
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    respond(res, 405, { error: 'method-not-allowed' }, origin);
    return;
  }

  const coordsParam = typeof req.query?.coords === 'string' ? req.query.coords.trim() : null;
  if (!coordsParam) {
    respond(res, 400, { error: 'missing-coords' }, origin);
    return;
  }

  const steps = req.query?.steps !== 'false';
  const manualProfiles = typeof req.query?.profiles === 'string'
    ? req.query.profiles.split(',').map((entry) => entry.trim()).filter(Boolean)
    : null;
  const profiles = manualProfiles?.length ? manualProfiles : DEFAULT_PROFILE_LIST;

  const search = buildQuery(steps);
  let lastError = null;

  for (const profile of profiles) {
    try {
      const upstream = await fetch(`${DEFAULT_OSRM_BASE}/route/v1/${profile}/${coordsParam}?${search}`);
      if (!upstream.ok) {
        lastError = new Error(`status-${upstream.status}`);
        continue;
      }
      const data = await upstream.json();
      if (data?.routes?.length) {
        respond(res, 200, { profile, route: data.routes[0] }, origin);
        return;
      }
      lastError = new Error('no-routes');
    } catch (error) {
      lastError = error;
    }
  }

  respond(res, 502, { error: 'osrm-unavailable', detail: lastError?.message || 'unknown' }, origin);
};
