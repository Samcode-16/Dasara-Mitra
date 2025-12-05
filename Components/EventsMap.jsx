import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Navigation, Calendar, Info, RefreshCw, Search, Map as MapIcon, Sparkles } from 'lucide-react';
import { useLanguage, EVENTS_DATA } from './DasaraContext';
import { Button, Card, CardContent, Badge } from './ui.jsx';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';


const PROCESSION_BASELINE_ROUTE = [
  [12.305163, 76.6551749],
  [12.30568, 76.65594],
  [12.30664, 76.6569],
  [12.30775, 76.65793],
  [12.30894, 76.65848],
  [12.31012, 76.65841],
  [12.31193, 76.65766],
  [12.31375, 76.65705],
  [12.31568, 76.65647],
  [12.31752, 76.65602],
  [12.31913, 76.65566],
  [12.32074, 76.65545],
  [12.32247, 76.65531],
  [12.32428, 76.6552],
  [12.32606, 76.65512],
  [12.32782, 76.65504],
  [12.32959, 76.655],
  [12.33147, 76.65499],
  [12.33328, 76.65499],
  [12.3340167, 76.6549883]
];

const FALLBACK_EVENT_CLOUDINARY_TAGS = {
  1: 'dasara_jamboo_savari',
  2: 'dasara_torchlight',
  3: 'dasara_palace_illu',
  4: 'dasara_exhibition',
  5: 'dasara_flower_show',
  6: 'dasara_yuva',
  7: 'dasara_wrestling',
  8: 'dasara_kavi_goshti',
  9: 'dasara_ahara_mela',
 10: 'dasara_palace_cultural',
 11: 'dasara_drone_show',
 12: 'dasara_heritage_show',
 13: 'dasara_makkala',
 14: 'dasara_raitha',
 15: 'dasara_vintage_car',
 17: 'dasara_folk_dance',
 18: 'dasara_adv_zone'
};

const IMAGE_CACHE_STORAGE_KEY = 'dasara-events-image-cache';
const IMAGE_CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

const stripQuotes = (value = '') => value.replace(/^['"`]+|['"`]+$/g, '');

const parseEventImageTagConfig = () => {
  const raw = import.meta.env.VITE_EVENT_CLOUDINARY_TAGS;
  if (!raw || !raw.trim()) {
    return FALLBACK_EVENT_CLOUDINARY_TAGS;
  }

  const normalized = {};
  const assignPair = (key, value) => {
    if (!key || !value) {
      return;
    }
    const trimmedKey = stripQuotes(String(key).trim());
    const trimmedValue = stripQuotes(String(value).trim());
    if (!trimmedKey || !trimmedValue) {
      return;
    }
    normalized[trimmedKey] = trimmedValue;
  };

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      Object.entries(parsed).forEach(([key, value]) => assignPair(key, value));
    }
  } catch (error) {
    raw.split(',').forEach((entry) => {
      const [key, value] = entry.split(':');
      assignPair(key, value);
    });
  }

  if (!Object.keys(normalized).length) {
    return FALLBACK_EVENT_CLOUDINARY_TAGS;
  }

  return {
    ...FALLBACK_EVENT_CLOUDINARY_TAGS,
    ...normalized
  };
};

const browserTomTomKey = (import.meta.env.VITE_TOMTOM_API_KEY || '').trim();
const rawBackendBaseUrl = (import.meta.env.VITE_ASSISTANT_API_BASE_URL?.trim() || '').replace(/\/$/, '');
const PRODUCTION_ROUTING_ENDPOINT = 'https://dasaramitra.vercel.app/api/osrm-route';
const ROUTING_PROXY_ENDPOINTS = Array.from(
  new Set(
    [
      rawBackendBaseUrl ? `${rawBackendBaseUrl}/api/osrm-route` : null,
      '/api/osrm-route',
      PRODUCTION_ROUTING_ENDPOINT
    ].filter(Boolean)
  )
);

const fetchTomTomProxyRoute = async (waypointsStr, options = {}) => {
  const params = new URLSearchParams({ coords: waypointsStr });
  if (options.mode) {
    params.set('mode', options.mode);
  }

  let lastError = null;

  for (const endpoint of ROUTING_PROXY_ENDPOINTS) {
    try {
      const response = await fetch(`${endpoint}?${params.toString()}`);
      if (!response.ok) {
        lastError = new Error(`Proxy routing failed with status ${response.status}`);
        continue;
      }

      const data = await response.json();
      if (Array.isArray(data?.coordinates) && data.coordinates.length) {
        return data;
      }

      lastError = new Error('Proxy routing returned no path');
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Proxy routing failed');
};

// Function to get road-following route between waypoints
const getProcessionRoute = async () => {
  const palaceStart = {lat: 12.304109, lng: 76.655382};
  const palaceEnd = {lat: 12.307085, lng: 76.655606};
  
  const palaceRoute = [];
  for (let i = 0; i <= 4; i++) {
    const ratio = i / 4;
    const lat = palaceStart.lat + (palaceEnd.lat - palaceStart.lat) * ratio;
    const lng = palaceStart.lng + (palaceEnd.lng - palaceStart.lng) * ratio;
    palaceRoute.push([lat, lng]);
  }

  const roadWaypoints = [
    {lat: 12.307085, lng: 76.655606},
    {lat: 12.308720, lng: 76.653152},
    {lat: 12.314528, lng: 76.651248},
    {lat: 12.319132, lng: 76.648450},
    {lat: 12.324061, lng: 76.645220},
    {lat: 12.332126, lng: 76.649626},
    {lat: 12.332424, lng: 76.654509}
  ];

  try {
    const waypointsStr = roadWaypoints
      .map(point => `${point.lng},${point.lat}`)
      .join(';');

    const { coordinates } = await fetchTomTomProxyRoute(waypointsStr, { mode: 'pedestrian' });
    const roadCoordinates = coordinates.map(([lng, lat]) => [lat, lng]);
    const fullRoute = [...palaceRoute, ...roadCoordinates];
    return fullRoute;
  } catch (error) {
    console.error('Error fetching procession route:', error);
    // Fallback to original path if routing fails
    return PROCESSION_BASELINE_ROUTE;
  }
};

// Initialize with fallback route
let PROCESSION_ROUTE_POINTS = PROCESSION_BASELINE_ROUTE;

const PROCESSION_LANDMARKS = [
  { id: 'mysore-palace', name: 'Mysore Palace', lat: 12.3039, lng: 76.6547, type: 'start' },
  { id: 'albert-road', name: 'Albert Road', lat: 12.3066, lng: 76.6569, type: 'waypoint' },
  { id: 'kr-circle', name: 'K.R. Circle', lat: 12.30889934994733, lng: 76.6529538094943, type: 'waypoint' },
  { id: 'sayyaji-rao-road', name: 'Sayyaji Rao Road', lat: 12.3101, lng: 76.6584, type: 'waypoint' },
  { id: 'nelson-mandela-road', name: 'Nelson Mandela Road', lat: 12.3207, lng: 76.6555, type: 'waypoint' },
  { id: 'bannimantap-grounds', name: 'Bannimantap Grounds', lat: 12.334, lng: 76.655, type: 'end' }
];

const buildTomTomRasterStyle = (apiKey) => ({
  version: 8,
  sources: {
    tomtom: {
      type: 'raster',
      tiles: [`https://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?key=${apiKey}`],
      tileSize: 256,
      attribution: '© TomTom'
    }
  },
  layers: [
    {
      id: 'tomtom-basemap',
      type: 'raster',
      source: 'tomtom',
      minzoom: 0,
      maxzoom: 22
    }
  ]
});

const buildLineCollection = (coordinates = []) => ({
  type: 'FeatureCollection',
  features: coordinates.length
    ? [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates
          },
          properties: {}
        }
      ]
    : []
});

const toLngLatPath = (latLngPairs = []) =>
  latLngPairs
    .map(([lat, lng]) => [Number(lng), Number(lat)])
    .filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat));

const calculateBoundsFromLatLngPairs = (points = []) => {
  let minLat = Infinity;
  let minLng = Infinity;
  let maxLat = -Infinity;
  let maxLng = -Infinity;

  points.forEach(([lat, lng]) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return;
    }
    minLat = Math.min(minLat, lat);
    minLng = Math.min(minLng, lng);
    maxLat = Math.max(maxLat, lat);
    maxLng = Math.max(maxLng, lng);
  });

  if (!Number.isFinite(minLat) || !Number.isFinite(minLng) || !Number.isFinite(maxLat) || !Number.isFinite(maxLng)) {
    return null;
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat]
  ];
};

const calculateBoundsFromLngLatPairs = (points = []) => {
  let minLat = Infinity;
  let minLng = Infinity;
  let maxLat = -Infinity;
  let maxLng = -Infinity;

  points.forEach(([lng, lat]) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return;
    }
    minLat = Math.min(minLat, lat);
    minLng = Math.min(minLng, lng);
    maxLat = Math.max(maxLat, lat);
    maxLng = Math.max(maxLng, lng);
  });

  if (!Number.isFinite(minLat) || !Number.isFinite(minLng) || !Number.isFinite(maxLat) || !Number.isFinite(maxLng)) {
    return null;
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat]
  ];
};

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildEventPopupContent = ({ event, getLocalizedEventText, getLocalizedAgeGroup, t, statusStyles }) => {
  if (!event) {
    return '';
  }
  const statusInfo = statusStyles[event.status] || statusStyles.upcoming;
  return `
    <div class="text-left space-y-1">
      <p class="font-semibold text-[#800000]">${escapeHtml(getLocalizedEventText(event, 'name'))}</p>
      <p class="text-xs text-gray-600">${escapeHtml(event.time || '')}</p>
      <p class="text-[11px] text-gray-500">${escapeHtml(`${t('dayLabel')} ${event.day}`)} • ${escapeHtml(getLocalizedAgeGroup(event))}</p>
      <span class="inline-flex items-center rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold border">${escapeHtml(statusInfo.label)}</span>
    </div>
  `;
};

const fitMapToLatLngPairs = (mapInstance, points, options = {}) => {
  if (!mapInstance) {
    return;
  }
  const bounds = calculateBoundsFromLatLngPairs(points);
  if (bounds) {
    mapInstance.fitBounds(bounds, { padding: 32, ...options });
  }
};

const fitMapToLngLatPairs = (mapInstance, points, options = {}) => {
  if (!mapInstance) {
    return;
  }
  const bounds = calculateBoundsFromLngLatPairs(points);
  if (bounds) {
    mapInstance.fitBounds(bounds, { padding: 32, ...options });
  }
};

export default function EventsMap() {
  const { t, language } = useLanguage();
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const eventImageTags = useMemo(() => parseEventImageTagConfig(), []);
  const [userLocation, setUserLocation] = useState(null);
  const [nearestEvents, setNearestEvents] = useState([]);
  const [permissionStatus, setPermissionStatus] = useState('prompt');
  const [routePath, setRoutePath] = useState(null);
  const [processionRoutePoints, setProcessionRoutePoints] = useState(PROCESSION_ROUTE_POINTS);
  const [routingStage, setRoutingStage] = useState('idle');
  const [routingError, setRoutingError] = useState(null);
  const [activeEvent, setActiveEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDay, setSelectedDay] = useState('all');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('all');
  const [processionCardPinned, setProcessionCardPinned] = useState(false);
  const [eventCardImages, setEventCardImages] = useState({});
  const [mapReady, setMapReady] = useState(false);
  const [mapInitError, setMapInitError] = useState(null);
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapCanvasRef = useRef(null);
  const eventImageCacheRef = useRef(new Map());
  const eventCardsRef = useRef(null);
  const pendingRouteRef = useRef(null);
  const eventMarkersRef = useRef(new Map());
  const userMarkerRef = useRef(null);
  const processionMarkersRef = useRef(new Map());

  useEffect(() => {
    calculateDistances(EVENTS_DATA, null); // Initial load without user location
    
    // Fetch road-following procession route
    getProcessionRoute().then(roadPoints => {
      if (roadPoints && roadPoints.length > 0) {
        setProcessionRoutePoints(roadPoints);
      }
    }).catch(error => {
      console.error('Failed to load procession route:', error);
    });
  }, []);

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const width = entry.contentRect.width;
      const map = mapRef.current;
      if (map) {
        setTimeout(() => map.resize(), 100);
      }

      if (!mapContainerRef.current) return;

      if (width < 400) {
        mapContainerRef.current.style.minHeight = '280px';
      } else if (width < 640) {
        mapContainerRef.current.style.minHeight = '340px';
      } else if (width < 768) {
        mapContainerRef.current.style.minHeight = '380px';
      } else if (width < 1024) {
        mapContainerRef.current.style.minHeight = '420px';
      } else {
        mapContainerRef.current.style.minHeight = '480px';
      }
    });

    if (mapContainerRef.current) {
      mapContainerRef.current.style.minHeight = '480px';
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    if (!cloudName) {
      setEventCardImages({});
      return undefined;
    }

    const entries = Object.entries(eventImageTags).filter(([, tag]) => Boolean(tag));
    if (!entries.length) {
      setEventCardImages({});
      return undefined;
    }

    let cancelled = false;
    const cache = eventImageCacheRef.current;

    const persistCacheToStorage = () => {
      try {
        const serializable = Object.fromEntries(cache.entries());
        const payload = {
          timestamp: Date.now(),
          data: serializable,
        };
        localStorage.setItem(IMAGE_CACHE_STORAGE_KEY, JSON.stringify(payload));
      } catch (error) {
        console.warn('Unable to persist event image cache', error);
      }
    };

    const hydrateCacheFromStorage = () => {
      try {
        const raw = localStorage.getItem(IMAGE_CACHE_STORAGE_KEY);
        if (!raw) {
          return;
        }
        const parsed = JSON.parse(raw);
        if (!parsed?.data || typeof parsed.data !== 'object') {
          return;
        }
        if (parsed.timestamp && Date.now() - parsed.timestamp > IMAGE_CACHE_TTL_MS) {
          localStorage.removeItem(IMAGE_CACHE_STORAGE_KEY);
          return;
        }
        Object.entries(parsed.data).forEach(([tag, url]) => {
          if (typeof tag === 'string' && typeof url === 'string') {
            cache.set(tag, url);
          }
        });
      } catch (error) {
        console.warn('Unable to read event image cache', error);
      }
    };

    hydrateCacheFromStorage();

    const buildImageUrl = (publicId, format) => {
      if (!publicId) {
        return null;
      }
      const extension = format ? `.${format}` : '';
      return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_900,h_500,c_fill/${publicId}${extension}`;
    };

    const fetchByTag = async (tag) => {
      const normalizedTag = String(tag || '').trim();
      if (!normalizedTag) {
        return null;
      }

      if (cache.has(normalizedTag)) {
        return cache.get(normalizedTag);
      }

      if (/^https?:\/\//i.test(normalizedTag)) {
        cache.set(normalizedTag, normalizedTag);
        persistCacheToStorage();
        return normalizedTag;
      }

      const manifestUrl = `https://res.cloudinary.com/${cloudName}/image/list/${normalizedTag}.json`;
      try {
        const response = await fetch(manifestUrl);
        if (response.ok) {
          const data = await response.json();
          const resource = Array.isArray(data?.resources) ? data.resources[0] : null;
          if (resource?.public_id) {
            const url = buildImageUrl(resource.public_id, resource.format);
            cache.set(normalizedTag, url);
            persistCacheToStorage();
            return url;
          }
        }
      } catch (error) {
        console.warn('Unable to fetch Cloudinary tag manifest', normalizedTag, error);
      }

      const fallbackUrl = buildImageUrl(normalizedTag);
      cache.set(normalizedTag, fallbackUrl);
      persistCacheToStorage();
      return fallbackUrl;
    };

    const seedImagesFromCache = () => {
      const cached = {};
      entries.forEach(([eventId, tag]) => {
        const normalizedTag = String(tag || '').trim();
        if (!normalizedTag) {
          return;
        }
        const cachedUrl = cache.get(normalizedTag);
        if (cachedUrl) {
          cached[eventId] = cachedUrl;
        }
      });

      if (Object.keys(cached).length) {
        setEventCardImages((prev) => ({ ...cached, ...prev }));
      }
    };

    seedImagesFromCache();

    const resolveImages = async () => {
      const results = await Promise.all(entries.map(async ([eventId, tag]) => {
        const url = await fetchByTag(tag);
        return [eventId, url];
      }));

      if (cancelled) {
        return;
      }

      const imageMap = {};
      results.forEach(([eventId, url]) => {
        if (url) {
          imageMap[eventId] = url;
        }
      });
      setEventCardImages(imageMap);
    };

    resolveImages();

    return () => {
      cancelled = true;
    };
  }, [cloudName, eventImageTags]);

  useEffect(() => {
    if (!mapCanvasRef.current) {
      return undefined;
    }

    if (!browserTomTomKey) {
      setMapInitError('missing-key');
      return undefined;
    }

    if (mapRef.current) {
      return undefined;
    }

    setMapInitError(null);
    const map = new maplibregl.Map({
      container: mapCanvasRef.current,
      style: buildTomTomRasterStyle(browserTomTomKey),
      center: [76.6551, 12.3051],
      zoom: 13,
      attributionControl: false
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    const handleLoad = () => {
      if (!map.getSource('procession-route')) {
        map.addSource('procession-route', { type: 'geojson', data: buildLineCollection() });
      }
      if (!map.getLayer('procession-route')) {
        map.addLayer({
          id: 'procession-route',
          type: 'line',
          source: 'procession-route',
          paint: {
            'line-color': '#EA580C',
            'line-width': 6,
            'line-opacity': 0.9,
            'line-dasharray': [1.2, 1.2]
          }
        });
      }

      if (!map.getSource('user-route')) {
        map.addSource('user-route', { type: 'geojson', data: buildLineCollection() });
      }
      if (!map.getLayer('user-route')) {
        map.addLayer({
          id: 'user-route',
          type: 'line',
          source: 'user-route',
          paint: {
            'line-color': '#1D4ED8',
            'line-width': 4,
            'line-opacity': 0.95
          }
        });
      }

      setMapReady(true);
    };

    map.on('load', handleLoad);
    mapRef.current = map;

    return () => {
      map.off('load', handleLoad);
      eventMarkersRef.current.forEach((marker) => marker.remove());
      eventMarkersRef.current.clear();
      processionMarkersRef.current.forEach((marker) => marker.remove());
      processionMarkersRef.current.clear();
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [browserTomTomKey]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) {
      return;
    }
    const map = mapRef.current;
    const source = map.getSource('procession-route');
    if (!source) {
      return;
    }
    const coordinates = toLngLatPath(processionRoutePoints);
    source.setData(buildLineCollection(coordinates));
  }, [mapReady, processionRoutePoints]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) {
      return;
    }
    const map = mapRef.current;
    const source = map.getSource('user-route');
    if (!source) {
      return;
    }
    const coordinates = Array.isArray(routePath) ? routePath : [];
    source.setData(buildLineCollection(coordinates));
  }, [mapReady, routePath]);


  useEffect(() => {
    if (!mapReady || !mapRef.current) {
      return;
    }

    const map = mapRef.current;
    if (!userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      return;
    }

    if (!userMarkerRef.current) {
      userMarkerRef.current = new maplibregl.Marker({ color: '#2563EB' })
        .setPopup(new maplibregl.Popup({ offset: 10 }).setText(t('youAreHere') || 'You are here'));
    }

    userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat]).addTo(map);
  }, [mapReady, userLocation, t]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) {
      return;
    }

    const map = mapRef.current;
    const markers = processionMarkersRef.current;
    const trackedIds = new Set();

    PROCESSION_LANDMARKS.filter((landmark) => landmark.type === 'start' || landmark.type === 'end').forEach((landmark) => {
      trackedIds.add(landmark.id);
      const popupHtml = `
        <div class="text-sm text-center space-y-1">
          <p class="font-semibold text-[#B45309]">${escapeHtml(landmark.name)}</p>
          <p class="text-[11px] text-gray-600">${escapeHtml(
            landmark.type === 'start' ? t('processionStartingPoint') : t('processionEndingPoint')
          )}</p>
        </div>
      `;

      let marker = markers.get(landmark.id);
      if (!marker) {
        marker = new maplibregl.Marker({ color: landmark.type === 'start' ? '#1D4ED8' : '#7C3AED' })
          .setLngLat([landmark.lng, landmark.lat])
          .setPopup(new maplibregl.Popup({ offset: 10 }).setHTML(popupHtml))
          .addTo(map);
        markers.set(landmark.id, marker);
      } else {
        marker.setLngLat([landmark.lng, landmark.lat]);
        const popup = marker.getPopup() || new maplibregl.Popup({ offset: 10 });
        popup.setHTML(popupHtml);
        marker.setPopup(popup);
      }
    });

    markers.forEach((marker, markerId) => {
      if (!trackedIds.has(markerId)) {
        marker.remove();
        markers.delete(markerId);
      }
    });
  }, [mapReady, language, t]);

  const handleGetLocation = (onSuccess) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const userLoc = { lat: latitude, lng: longitude };
          setUserLocation(userLoc);
          setPermissionStatus('granted');
          calculateDistances(EVENTS_DATA, userLoc);
          setRoutePath(null);
          setRoutingStage('idle');
          setRoutingError(null);
          setActiveEvent(null);
          
          // Fly to user location
          if (mapRef.current) {
            mapRef.current.flyTo({
              center: [longitude, latitude],
              zoom: 14,
              essential: true
            });
          }

          if (typeof onSuccess === 'function') {
            onSuccess(userLoc);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          setPermissionStatus('denied');
          if (pendingRouteRef.current) {
            setRoutingStage('error');
            setRoutingError(t('routeNeedLocation'));
            pendingRouteRef.current = null;
          }
        }
      );
    } else {
      setPermissionStatus('denied');
      if (pendingRouteRef.current) {
        setRoutingStage('error');
        setRoutingError(t('routeNeedLocation'));
        pendingRouteRef.current = null;
      }
    }
  };

  const calculateDistances = (events, userLoc) => {
    const eventsWithDist = events.map((event) => {
      if (!userLoc) {
        return { ...event, distance: undefined };
      }
      const dist = getDistanceFromLatLonInKm(userLoc.lat, userLoc.lng, event.lat, event.lng);
      return { ...event, distance: dist };
    });

    setNearestEvents(eventsWithDist);
  };

  // Haversine formula
  function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ; 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c; // Distance in km
    return d;
  }

  const categories = useMemo(() => {
    const unique = Array.from(new Set(EVENTS_DATA.map((event) => event.category).filter(Boolean)));
    return unique.sort();
  }, []);

  const ageGroups = useMemo(() => {
    const unique = Array.from(new Set(EVENTS_DATA.map((event) => event.ageGroup).filter(Boolean)));
    return unique.sort();
  }, []);

  const ageGroupLabels = useMemo(() => {
    return EVENTS_DATA.reduce((acc, event) => {
      if (event.ageGroup) {
        acc[event.ageGroup] = {
          en: event.ageGroup,
          kn: event.ageGroup_kn || event.ageGroup,
          hi: event.ageGroup_hi || event.ageGroup,
        };
      }
      return acc;
    }, {});
  }, []);

  const dayOptions = useMemo(() => Array.from({ length: 10 }, (_, index) => index + 1), []);

  const getLocalizedEventText = useCallback((event, key) => {
    if (!event) {
      return '';
    }
    if (language === 'kn') {
      return event[`${key}_kn`] || event[key] || '';
    }
    if (language === 'hi') {
      return event[`${key}_hi`] || event[key] || '';
    }
    return event[key] || '';
  }, [language]);

  const getLocalizedAgeGroup = useCallback((event) => {
    if (!event) {
      return '';
    }
    if (language === 'kn') {
      return event.ageGroup_kn || event.ageGroup || '';
    }
    if (language === 'hi') {
      return event.ageGroup_hi || event.ageGroup || '';
    }
    return event.ageGroup || '';
  }, [language]);

  const toSearchableText = (value) => (typeof value === 'string' ? value.toLowerCase() : '');

  const filteredEvents = useMemo(() => {
    let list = Array.isArray(nearestEvents) ? nearestEvents : [];

    if (selectedCategory !== 'all') {
      list = list.filter((event) => event.category === selectedCategory);
    }

    if (selectedDay !== 'all') {
      const dayValue = Number(selectedDay);
      list = list.filter((event) => event.day === dayValue);
    }

    if (selectedAgeGroup !== 'all') {
      list = list.filter((event) => event.ageGroup === selectedAgeGroup);
    }

    if (!searchTerm.trim()) {
      return list;
    }

    const term = searchTerm.trim().toLowerCase();
    return list.filter((event) => {
      const name = getLocalizedEventText(event, 'name');
      const category = event.category || '';
      const ageGroup = getLocalizedAgeGroup(event);
      const dayText = String(event?.day ?? '');
      const normalizedName = toSearchableText(name);
      const normalizedCategory = toSearchableText(category);
      const normalizedAgeGroup = toSearchableText(ageGroup);
      return (
        normalizedName.includes(term) ||
        normalizedCategory.includes(term) ||
        normalizedAgeGroup.includes(term) ||
        dayText.includes(term)
      );
    });
  }, [nearestEvents, searchTerm, language, selectedCategory, selectedDay, selectedAgeGroup]);

  const hasActiveFilters = selectedCategory !== 'all' || selectedDay !== 'all' || selectedAgeGroup !== 'all';

  const statusStyles = useMemo(() => ({
    live: {
      label: t('statusLive'),
      className: 'bg-green-100 text-green-700 border-green-200'
    },
    upcoming: {
      label: t('statusUpcoming'),
      className: 'bg-blue-100 text-blue-700 border-blue-200'
    },
    completed: {
      label: t('statusCompleted'),
      className: 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }), [t, language]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) {
      return;
    }
    const map = mapRef.current;
    const markers = eventMarkersRef.current;
    const activeIds = new Set();

    filteredEvents.forEach((event) => {
      if (!event) return;
      const markerId = String(event.id);
      activeIds.add(markerId);
      const popupContent = buildEventPopupContent({
        event,
        getLocalizedEventText,
        getLocalizedAgeGroup,
        t,
        statusStyles
      });

      let marker = markers.get(markerId);
      if (!marker) {
        marker = new maplibregl.Marker({ color: '#B45309' })
          .setLngLat([event.lng, event.lat])
          .setPopup(new maplibregl.Popup({ offset: 12 }).setHTML(popupContent))
          .addTo(map);
        markers.set(markerId, marker);
      } else {
        marker.setLngLat([event.lng, event.lat]);
        const popup = marker.getPopup() || new maplibregl.Popup({ offset: 12 });
        popup.setHTML(popupContent);
        marker.setPopup(popup);
      }
    });

    markers.forEach((marker, markerId) => {
      if (!activeIds.has(markerId)) {
        marker.remove();
        markers.delete(markerId);
      }
    });
  }, [filteredEvents, mapReady, getLocalizedEventText, getLocalizedAgeGroup, statusStyles, t]);

  const handleDirections = async (event, overrideLocation = null) => {
    const currentLocation = overrideLocation || userLocation;
    if (!currentLocation) {
      setRoutingStage('loading');
      setRoutingError(null);
      setActiveEvent(event);
      pendingRouteRef.current = event;
      handleGetLocation((coords) => {
        const targetEvent = pendingRouteRef.current;
        pendingRouteRef.current = null;
        if (targetEvent) {
          handleDirections(targetEvent, coords);
        }
      });
      return;
    }

    setActiveEvent(event);
    setRoutingStage('loading');
    setRoutingError(null);
    setRoutePath(null);

    try {
      const waypointsStr = `${currentLocation.lng},${currentLocation.lat};${event.lng},${event.lat}`;
      const { coordinates } = await fetchTomTomProxyRoute(waypointsStr, { mode: 'pedestrian' });

      setRoutePath(coordinates);
      setRoutingStage('success');

      if (mapRef.current && coordinates.length) {
        fitMapToLngLatPairs(mapRef.current, coordinates, { padding: 48, maxZoom: 16 });
      }
    } catch (error) {
      console.error('Routing error:', error);
      setRoutingStage('error');
      setRoutingError(t('routeUnavailable'));
      setRoutePath(null);
    }
  };

  function deg2rad(deg) {
    return deg * (Math.PI/180)
  }

  return (
    <section id="events" className="py-12 md:py-20 bg-white">
      <div className="container mx-auto px-4">
        {!userLocation && permissionStatus !== 'denied' && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex flex-col gap-3 text-left shadow-sm md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-yellow-800 flex items-center gap-2">
                <Info className="w-4 h-4" />
                {t('enableLocation')}
              </p>
              <Button
                size="sm"
                onClick={handleGetLocation}
                className="bg-[#DAA520] hover:bg-[#B8860B] text-white"
              >
                Enable Location
              </Button>
            </div>
          </div>
        )}

        <div className="text-center mb-10">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 bg-white shadow-md rounded-full px-4 py-2 border border-[#DAA520]/50">
              <Search className="w-5 h-5 text-[#800000]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full border-none focus:outline-none focus:ring-0 text-sm md:text-base"
              />
              {searchTerm && (
                <Button variant="ghost" size="sm" className="text-[#800000]" onClick={() => setSearchTerm('')}>
                  {t('clearSearch')}
                </Button>
              )}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <label htmlFor="categoryFilter" className="font-medium text-[#800000]">
                  {t('categoryFilterLabel')}
                </label>
                <select
                  id="categoryFilter"
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                  className="border border-[#DAA520]/60 rounded-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#DAA520]/70 text-sm"
                >
                  <option value="all">{t('allCategories')}</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="dayFilter" className="font-medium text-[#800000]">
                  {t('dayFilterLabel')}
                </label>
                <select
                  id="dayFilter"
                  value={selectedDay}
                  onChange={(event) => setSelectedDay(event.target.value)}
                  className="border border-[#DAA520]/60 rounded-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#DAA520]/70 text-sm"
                >
                  <option value="all">{t('allDays')}</option>
                  {dayOptions.map((day) => (
                    <option key={day} value={String(day)}>
                      {`${t('dayLabel')} ${day}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="ageGroupFilter" className="font-medium text-[#800000]">
                  {t('ageFilterLabel')}
                </label>
                <select
                  id="ageGroupFilter"
                  value={selectedAgeGroup}
                  onChange={(event) => setSelectedAgeGroup(event.target.value)}
                  className="border border-[#DAA520]/60 rounded-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#DAA520]/70 text-sm"
                >
                  <option value="all">{t('allAgeGroups')}</option>
                  {ageGroups.map((group) => (
                    <option key={group} value={group}>
                      {language === 'kn'
                        ? ageGroupLabels[group]?.kn || group
                        : language === 'hi'
                          ? ageGroupLabels[group]?.hi || group
                          : ageGroupLabels[group]?.en || group}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="relative" id="event-cards">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-[#800000]">Plan Your Dasara Day</h2>
              <p className="text-sm text-gray-600">Swipe through the highlighted events and tap “Get Directions” to pin them on the map.</p>
            </div>
            {filteredEvents.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-gray-400 text-sm border-2 border-dashed rounded-xl p-6">
                {searchTerm ? (
                  <>
                    <p className="font-medium text-[#800000]">{t('noSearchResults')} “{searchTerm}”.</p>
                    <p className="mt-2 text-center text-gray-500">{t('searchHint')}</p>
                  </>
                ) : hasActiveFilters ? (
                  <>
                    <p className="font-medium text-[#800000]">{t('noFilterResults')}</p>
                    <p className="mt-2 text-center text-gray-500">{t('searchHint')}</p>
                  </>
                ) : (
                  <p className="font-medium text-[#800000]">{t('noEvents')}</p>
                )}
              </div>
            ) : (
              <>
                <div
                  ref={eventCardsRef}
                  className="flex gap-5 overflow-x-auto pb-8 horizontal-scroll snap-x snap-mandatory"
                >
                  {filteredEvents.map((event) => {
                    const imageUrl = eventCardImages[event.id] || eventCardImages[String(event.id)];
                    return (
                      <Card
                        key={event.id}
                        className="snap-center shrink-0 w-[280px] sm:w-[320px] md:w-[360px] rounded-[32px] overflow-hidden border-none shadow-xl flex flex-col"
                      >
                        <div
                          className="h-48 relative"
                          style={imageUrl ? {
                            backgroundImage: `url(${imageUrl})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          } : undefined}
                        >
                          <div className={`absolute inset-0 ${imageUrl ? 'bg-black/10' : 'bg-gradient-to-br from-[#4B1D14] via-[#8C3B16] to-[#D97706]'}`} />
                          <div className="absolute bottom-4 left-5 right-5 text-white">
                            <p className="text-xs uppercase tracking-widest opacity-80 mb-1">{event.category}</p>
                            <h3 className="text-2xl font-bold leading-tight drop-shadow-lg">
                              {getLocalizedEventText(event, 'name')}
                            </h3>
                          </div>
                        </div>
                        <CardContent className="p-5 bg-white flex flex-col flex-1">
                          <div className="space-y-4">
                            <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 min-h-[72px]">
                              {getLocalizedEventText(event, 'description')}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <Badge className="bg-[#800000]/10 text-[#800000] border-transparent">
                                {`${t('dayLabel')} ${event.day}`}
                              </Badge>
                              <Badge className="bg-[#DAA520]/10 text-[#8B7500] border-transparent">
                                {getLocalizedAgeGroup(event)}
                              </Badge>
                              {(() => {
                                const statusInfo = statusStyles[event.status] || statusStyles.upcoming;
                                return (
                                  <Badge className={`border ${statusInfo.className}`}>
                                    {statusInfo.label}
                                  </Badge>
                                );
                              })()}
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {event.time}
                              </span>
                              {event.distance && (
                                <span className="flex items-center gap-1 font-medium text-green-600">
                                  <Navigation className="w-3 h-3" />
                                  {event.distance.toFixed(1)} km
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="mt-auto pt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-[#800000] border-[#800000] hover:bg-[#800000] hover:text-white"
                              onClick={() => {
                                if (mapRef.current) {
                                  mapRef.current.flyTo({
                                    center: [event.lng, event.lat],
                                    zoom: 16,
                                    essential: true
                                  });
                                }
                                handleDirections(event);
                              }}
                              disabled={routingStage === 'loading'}
                            >
                              {routingStage === 'loading' && activeEvent?.id === event.id
                                ? t('routeFetching')
                                : t('directions')}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div
            className="h-[600px] max-w-6xl mx-auto rounded-xl overflow-hidden shadow-lg border border-gray-200 relative z-0"
            ref={mapContainerRef}
          >
            {processionRoutePoints.length > 0 && (
              <div className="absolute top-4 right-4 z-[1100] flex flex-col items-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={`flex items-center gap-2 border-[#F97316]/60 text-[#B45309] bg-white/90 ${processionCardPinned ? '' : 'shadow-lg'}`}
                  onClick={() => setProcessionCardPinned((prev) => !prev)}
                >
                  {processionCardPinned ? (
                    <>
                      <MapIcon className="w-4 h-4" />
                      {t('processionCardMapView')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      {t('processionCardShow')}
                    </>
                  )}
                </Button>
              </div>
            )}
            {processionRoutePoints.length > 0 && (
              <div
                className={`absolute right-4 top-20 w-72 bg-white/95 border border-orange-200 rounded-xl shadow-lg p-4 space-y-3 transition-all duration-200 ${
                  processionCardPinned
                    ? 'z-[1000] opacity-100 pointer-events-auto translate-y-0'
                    : 'z-[10] opacity-0 pointer-events-none translate-y-2'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#B45309]">{t('processionRouteTitle')}</p>
                    <p className="text-[11px] text-gray-600">{t('processionRouteSubtitle')}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="xs"
                    className="text-[#B45309] border-[#F97316]/70 hover:bg-[#F97316]/15"
                    onClick={() => {
                      if (mapRef.current && processionRoutePoints.length) {
                        fitMapToLatLngPairs(mapRef.current, processionRoutePoints, { padding: 36, maxZoom: 15 });
                      }
                    }}
                  >
                    {t('processionFocusCta')}
                  </Button>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">
                    {t('processionStopsHeading')}
                  </p>
                  <ol className="mt-2 space-y-2 text-xs text-gray-700 list-decimal pl-5">
                    {PROCESSION_LANDMARKS.map((landmark) => (
                      <li key={landmark.id} className="leading-tight">
                        <p className="font-semibold text-gray-800">{landmark.name}</p>
                        {landmark.type === 'start' && (
                          <p className="text-[11px] text-green-600">{t('processionStartingPoint')}</p>
                        )}
                        {landmark.type === 'end' && (
                          <p className="text-[11px] text-purple-600">{t('processionEndingPoint')}</p>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
                <p className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-[11px] font-semibold text-amber-900">
                  {t('footerPlanTip')}
                </p>
              </div>
            )}
            <div
              ref={mapCanvasRef}
              className="absolute inset-0 h-full w-full min-h-[320px] cursor-grab active:cursor-grabbing"
              role="presentation"
              aria-label="TomTom map"
            />

            {mapInitError && (
              <div className="absolute inset-0 z-[1200] flex flex-col items-center justify-center gap-2 bg-white/95 px-6 text-center">
                <p className="text-sm font-semibold text-[#800000]">
                  {t('mapKeyMissing') || 'TomTom map key missing'}
                </p>
                <p className="text-xs text-gray-500">
                  {t('mapKeyMissingHint') || 'Set VITE_TOMTOM_API_KEY to load the festival map.'}
                </p>
              </div>
            )}

            {routingStage === 'loading' && (
              <div className="absolute left-4 right-4 bottom-4 z-[1200] bg-white/90 backdrop-blur-sm border border-yellow-200 rounded-lg p-4 shadow-lg flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-[#800000] animate-spin" />
                <p className="text-sm text-[#800000] font-medium">{t('routeFetching')}</p>
              </div>
            )}

            {routingStage === 'error' && routingError && (
              <div className="absolute left-4 right-4 bottom-4 z-[1200] bg-white/95 border border-red-200 text-red-700 rounded-lg p-4 shadow-lg text-sm">
                {routingError}
              </div>
            )}

          </div>
        </div>
      </div>
    </section>
  );
}