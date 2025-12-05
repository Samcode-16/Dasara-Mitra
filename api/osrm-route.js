const fetch = globalThis.fetch;

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

  const apiKey = process.env.TOMTOM_API_KEY;
  if (!apiKey) {
    respond(res, 500, { error: 'missing-tomtom-key' }, origin);
    return;
  }

  const coordsParam = typeof req.query?.coords === 'string' ? req.query.coords.trim() : null;
  if (!coordsParam) {
    respond(res, 400, { error: 'missing-coords' }, origin);
    return;
  }

  const coordinates = normalizeCoordinates(coordsParam);
  if (coordinates.length < 2) {
    respond(res, 400, { error: 'insufficient-coords' }, origin);
    return;
  }

  const requestedMode = typeof req.query?.mode === 'string' ? req.query.mode.toLowerCase() : 'pedestrian';
  const travelMode = VALID_TRAVEL_MODES.has(requestedMode) ? requestedMode : 'pedestrian';

  const pathSegment = coordinates.map(({ lat, lng }) => `${lat},${lng}`).join(':');
  const routingUrl = new URL(`https://api.tomtom.com/routing/1/calculateRoute/${pathSegment}/json`);
  routingUrl.searchParams.set('key', apiKey);
  routingUrl.searchParams.set('travelMode', travelMode);
  routingUrl.searchParams.set('instructionsType', 'text');
  routingUrl.searchParams.set('avoid', 'unpavedRoads');
  routingUrl.searchParams.set('sectionType', travelMode === 'pedestrian' ? 'pedestrian' : 'traffic');
  routingUrl.searchParams.set('computeTravelTimeFor', 'all');

  try {
    const upstream = await fetch(routingUrl.toString());
    if (!upstream.ok) {
      respond(res, upstream.status, { error: 'tomtom-error', detail: `status-${upstream.status}` }, origin);
      return;
    }

    const data = await upstream.json();
    const route = data?.routes?.[0];
    if (!route) {
      respond(res, 502, { error: 'tomtom-empty' }, origin);
      return;
    }

    const lineCoordinates = route.legs
      ?.flatMap((leg) => leg.points || [])
      .map((point) => [point.longitude, point.latitude]);

    if (!lineCoordinates?.length) {
      respond(res, 502, { error: 'tomtom-no-points' }, origin);
      return;
    }

    respond(res, 200, {
      coordinates: lineCoordinates,
      summary: route.summary ?? null
    }, origin);
  } catch (error) {
    respond(res, 502, { error: 'tomtom-unavailable', detail: error?.message || 'unknown' }, origin);
  }
};
