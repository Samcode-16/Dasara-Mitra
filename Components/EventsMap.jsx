import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Navigation, Calendar, Info, RefreshCw, Search, Map as MapIcon, Sparkles } from 'lucide-react';
import { useLanguage, EVENTS_DATA } from './DasaraContext';
import { Button, Card, CardContent, Badge } from './ui.jsx';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
// import 'leaflet/dist/leaflet.css';
import 'leaflet/dist/leaflet.css'; // Retry import, but relying on CDN fallback below if needed
import L from 'leaflet';

// Fix for Leaflet icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Gold Icon
const goldIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const palaceIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [30, 46],
  iconAnchor: [15, 46],
  popupAnchor: [1, -40],
  shadowSize: [41, 41]
});

const finaleIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [30, 46],
  iconAnchor: [15, 46],
  popupAnchor: [1, -40],
  shadowSize: [41, 41]
});

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
    // Use OSRM only for road section
    const waypointsStr = roadWaypoints
      .map(point => `${point.lng},${point.lat}`)
      .join(';');
    
    const url = `https://router.project-osrm.org/route/v1/walking/${waypointsStr}?overview=full&geometries=geojson&steps=false`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Routing service unavailable');
    }

    const data = await response.json();
    
    if (!data.routes || !data.routes.length) {
      throw new Error('No route found');
    }

    // Combine palace straight line + road route
    const roadCoordinates = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
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
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const eventImageCacheRef = useRef(new Map());
  const eventCardsRef = useRef(null);
  const pendingRouteRef = useRef(null);

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
        setTimeout(() => map.invalidateSize(), 100);
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
            mapRef.current.flyTo([latitude, longitude], 14);
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

  const getLocalizedEventText = (event, key) => {
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
  };

  const getLocalizedAgeGroup = (event) => {
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
  };

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
      const url = `https://router.project-osrm.org/route/v1/walking/${currentLocation.lng},${currentLocation.lat};${event.lng},${event.lat}?alternatives=false&overview=full&geometries=geojson&steps=true`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Route service unavailable');
      }

      const data = await response.json();

      if (!data.routes || !data.routes.length) {
        throw new Error('No routes found');
      }

      const route = data.routes[0];
      const coordinates = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);

      setRoutePath(coordinates);

      setRoutingStage('success');

      if (mapRef.current && coordinates.length) {
        const bounds = L.latLngBounds(coordinates);
        mapRef.current.fitBounds(bounds, { padding: [32, 32] });
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
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
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
                                  mapRef.current.flyTo([event.lat, event.lng], 16);
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
                        const bounds = L.latLngBounds(processionRoutePoints);
                        mapRef.current.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 });
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
            <MapContainer
              center={[12.3051, 76.6551]}
              zoom={13}
              className="!h-full !w-full min-h-[320px] cursor-grab active:cursor-grabbing"
              style={{ height: '100%', width: '100%', zIndex: 1 }}
              whenCreated={(mapInstance) => {
                mapRef.current = mapInstance;
              }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* User Location Marker */}
              {userLocation && (
                <Marker position={[userLocation.lat, userLocation.lng]}>
                  <Popup>You are here</Popup>
                </Marker>
              )}

              {/* Event Markers */}
              {filteredEvents.map((event) => (
                <Marker 
                  key={event.id} 
                  position={[event.lat, event.lng]}
                  icon={goldIcon}
                >
                  <Popup>
                    <div className="text-center space-y-1">
                      <h3 className="font-bold text-[#800000]">{getLocalizedEventText(event, 'name')}</h3>
                      <p className="text-xs text-gray-600">{event.time}</p>
                      <p className="text-[11px] text-gray-500">
                        {`${t('dayLabel')} ${event.day}`} • {getLocalizedAgeGroup(event)}
                      </p>
                      {(() => {
                        const statusInfo = statusStyles[event.status] || statusStyles.upcoming;
                        return (
                          <span className={`inline-flex items-center justify-center rounded-full px-2 py-1 text-[10px] font-semibold border ${statusInfo.className}`}>
                            {statusInfo.label}
                          </span>
                        );
                      })()}
                    </div>
                  </Popup>
                </Marker>
              ))}

              {processionRoutePoints.length > 0 && (
                <>
                  <Polyline
                    positions={processionRoutePoints}
                    pathOptions={{
                      color: '#EA580C',
                      weight: 8,
                      opacity: 0.9,
                      dashArray: '12 10',
                      lineCap: 'round'
                    }}
                  />
                  {PROCESSION_LANDMARKS.filter((landmark) => landmark.type === 'start' || landmark.type === 'end').map((landmark) => {
                    const icon = landmark.type === 'start' ? palaceIcon : finaleIcon;
                    return (
                      <Marker key={landmark.id} position={[landmark.lat, landmark.lng]} icon={icon}>
                        <Popup>
                          <div className="text-sm text-center space-y-1">
                            <p className="font-semibold text-[#B45309]">{landmark.name}</p>
                            <p className="text-[11px] text-gray-600">
                              {landmark.type === 'start' ? t('processionStartingPoint') : t('processionEndingPoint')}
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </>
              )}

              {routePath && (
                <Polyline positions={routePath} pathOptions={{ color: '#1D4ED8', weight: 6, opacity: 0.9 }} />
              )}
            </MapContainer>

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