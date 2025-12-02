import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Navigation, Calendar, Info, RefreshCw, Search, Map as MapIcon, Sparkles } from 'lucide-react';
import { useLanguage, EVENTS_DATA, ROAD_CLOSURES } from './DasaraContext';
import { Button, Card, CardContent, Badge } from './ui.jsx';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
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

const closureIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
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

const routeCheckpointIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

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
    const jambbooRouteClosure = ROAD_CLOSURES.find((closure) => closure.id === 'closure-jamboo-route');
    return (jambbooRouteClosure?.path || []).map((point) => [point.lat, point.lng]);
  }
};

// Initialize with fallback route
const jambbooRouteClosure = ROAD_CLOSURES.find((closure) => closure.id === 'closure-jamboo-route');
let PROCESSION_ROUTE_POINTS = (jambbooRouteClosure?.path || []).map((point) => [point.lat, point.lng]);

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
  const [userLocation, setUserLocation] = useState(null);
  const [nearestEvents, setNearestEvents] = useState([]);
  const [permissionStatus, setPermissionStatus] = useState('prompt');
  const [routePath, setRoutePath] = useState(null);
  const [processionRoutePoints, setProcessionRoutePoints] = useState(PROCESSION_ROUTE_POINTS);
  const [routeSummary, setRouteSummary] = useState(null);
  const [routingStage, setRoutingStage] = useState('idle');
  const [routingError, setRoutingError] = useState(null);
  const [activeEvent, setActiveEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDay, setSelectedDay] = useState('all');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('all');
  const [routeInstructions, setRouteInstructions] = useState([]);
  const [routeClosures, setRouteClosures] = useState([]);
  const [showClosures, setShowClosures] = useState(true);
  const [processionCardPinned, setProcessionCardPinned] = useState(true);
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);

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
        mapContainerRef.current.style.minHeight = '320px';
      } else if (width < 640) {
        mapContainerRef.current.style.minHeight = '380px';
      } else if (width < 768) {
        mapContainerRef.current.style.minHeight = '420px';
      } else if (width < 1024) {
        mapContainerRef.current.style.minHeight = '480px';
      } else {
        mapContainerRef.current.style.minHeight = '540px';
      }
    });

    if (mapContainerRef.current) {
      mapContainerRef.current.style.minHeight = '540px';
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const userLoc = { lat: latitude, lng: longitude };
          setUserLocation(userLoc);
          setPermissionStatus('granted');
          calculateDistances(EVENTS_DATA, userLoc);
          setRoutePath(null);
          setRouteSummary(null);
          setRoutingStage('idle');
          setRoutingError(null);
          setActiveEvent(null);
          
          // Fly to user location
          if (mapRef.current) {
            mapRef.current.flyTo([latitude, longitude], 14);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          setPermissionStatus('denied');
        }
      );
    } else {
      setPermissionStatus('denied');
    }
  };

  const calculateDistances = (events, userLoc) => {
    if (!userLoc) {
      setNearestEvents(events);
      return;
    }

    const eventsWithDist = events.map(event => {
      const dist = getDistanceFromLatLonInKm(userLoc.lat, userLoc.lng, event.lat, event.lng);
      return { ...event, distance: dist };
    });

    // Sort by distance
    const sorted = eventsWithDist.sort((a, b) => a.distance - b.distance);
    setNearestEvents(sorted);
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

  const resetRoute = () => {
    setRoutePath(null);
    setRouteSummary(null);
    setRoutingStage('idle');
    setRoutingError(null);
    setActiveEvent(null);
    setRouteInstructions([]);
    setRouteClosures([]);
  };

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

  const filteredEvents = useMemo(() => {
    let list = nearestEvents;

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
      const dayText = String(event.day || '');
      return (
        name.toLowerCase().includes(term) ||
        category.toLowerCase().includes(term) ||
        ageGroup.toLowerCase().includes(term) ||
        dayText.includes(term)
      );
    });
  }, [nearestEvents, searchTerm, language, selectedCategory, selectedDay, selectedAgeGroup]);

  const hasActiveFilters = selectedCategory !== 'all' || selectedDay !== 'all' || selectedAgeGroup !== 'all';

  const closuresToDisplay = useMemo(() => {
    if (!showClosures) {
      return [];
    }
    if (selectedDay === 'all') {
      return ROAD_CLOSURES;
    }
    const dayValue = Number(selectedDay);
    return ROAD_CLOSURES.filter((closure) => closure.days.includes(dayValue));
  }, [showClosures, selectedDay]);

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

  useEffect(() => {
    if (routeSummary && activeEvent) {
      const localizedName = getLocalizedEventText(activeEvent, 'name');
      if (routeSummary.eventName !== localizedName) {
        setRouteSummary((prev) => ({
          ...prev,
          eventName: localizedName,
        }));
      }
    }
  }, [language, routeSummary, activeEvent]);

  const handleDirections = async (event) => {
    if (!userLocation) {
      setRoutingError(t('routeNeedLocation'));
      setRoutingStage('error');
      handleGetLocation();
      return;
    }

    setActiveEvent(event);
    setRoutingStage('loading');
    setRoutingError(null);
    setRoutePath(null);
    setRouteSummary(null);
    setRouteInstructions([]);
    setRouteClosures([]);

    try {
      const url = `https://router.project-osrm.org/route/v1/walking/${userLocation.lng},${userLocation.lat};${event.lng},${event.lat}?alternatives=false&overview=full&geometries=geojson&steps=true`;
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
      setRouteSummary({
        eventName: getLocalizedEventText(event, 'name'),
        distanceKm: route.distance / 1000,
        durationMin: route.duration / 60,
      });
      const leg = route.legs && route.legs[0];
      if (leg && Array.isArray(leg.steps)) {
        const instructions = leg.steps.map((step, index) => ({
          id: `${index}-${step.maneuver?.location?.join(',') || index}`,
          text: formatInstruction(step),
          distance: step.distance,
          duration: step.duration,
        }));
        setRouteInstructions(instructions);
      } else {
        setRouteInstructions([]);
      }

      const closuresOnRoute = ROAD_CLOSURES.filter((closure) => {
        if (!closure.days.includes(event.day)) {
          return false;
        }
        return coordinates.some(([lat, lng]) => isWithinClosure(lat, lng, closure));
      });
      setRouteClosures(closuresOnRoute);
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
      setRouteSummary(null);
    }
  };

  function deg2rad(deg) {
    return deg * (Math.PI/180)
  }

  const formatInstruction = (step) => {
    if (step?.maneuver?.instruction) {
      return step.maneuver.instruction;
    }

    const type = step?.maneuver?.type || 'continue';
    const modifier = step?.maneuver?.modifier || '';
    const streetName = step?.name || '';

    const typeMap = {
      depart: 'Start',
      arrive: 'Arrive at destination',
      merge: 'Merge',
      turn: 'Turn',
      continue: 'Continue',
      newName: 'Continue',
      onRamp: 'Take ramp',
      offRamp: 'Exit',
      roundabout: 'Enter roundabout',
      fork: 'Keep',
      endOfRoad: 'Turn',
    };

    const modifierMap = {
      left: 'left',
      right: 'right',
      straight: 'straight',
      'slight left': 'slight left',
      slight_left: 'slight left',
      'slight right': 'slight right',
      slight_right: 'slight right',
      'sharp left': 'sharp left',
      sharp_left: 'sharp left',
      'sharp right': 'sharp right',
      sharp_right: 'sharp right',
      uturn: 'a U-turn',
    };

    const verb = typeMap[type] || 'Continue';
    const direction = modifier && modifierMap[modifier]
      ? ` ${modifierMap[modifier]}`
      : '';
    const road = streetName ? ` onto ${streetName}` : '';

    return `${verb}${direction}${road}`.trim();
  };

  const formatStepDistance = (meters) => {
    if (!meters && meters !== 0) {
      return '';
    }
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} ${t('kilometersUnit')}`;
    }
    return `${Math.max(1, Math.round(meters))} ${t('metersUnit')}`;
  };

  const formatStepDuration = (seconds) => {
    if (!seconds && seconds !== 0) {
      return '';
    }
    if (seconds < 60) {
      return `${Math.max(5, Math.round(seconds))} ${t('secondsUnitShort')}`;
    }
    return `${Math.round(seconds / 60)} ${t('minutesUnitShort')}`;
  };

  const isWithinClosure = (lat, lng, closure) => {
    const radiusMeters = closure.radius || 0;
    if (radiusMeters > 0) {
      const distanceKm = getDistanceFromLatLonInKm(lat, lng, closure.lat, closure.lng);
      if (distanceKm * 1000 <= radiusMeters) {
        return true;
      }
    }

    if (closure.path && closure.path.length) {
      const bufferMeters = closure.pathBuffer || Math.max(radiusMeters, 120);
      const bufferKm = bufferMeters / 1000;
      return closure.path.some((point) => {
        const pathDistanceKm = getDistanceFromLatLonInKm(lat, lng, point.lat, point.lng);
        return pathDistanceKm <= bufferKm;
      });
    }

    return false;
  };

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
          {/* Event List */}
          <div className="lg:col-span-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar h-full">
            {filteredEvents.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm border-2 border-dashed rounded-xl p-6">
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
            )}
            {filteredEvents.map((event) => (
              <Card key={event.id} className="hover:shadow-md transition-shadow border-l-4 border-l-[#800000]">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                    <h3 className="font-bold text-lg text-gray-800">
                      {getLocalizedEventText(event, 'name')}
                    </h3>
                    <div className="flex items-center gap-2 text-xs">
                      <Badge className="border border-[#DAA520] text-[#B8860B] bg-transparent">
                        {event.category}
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
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {getLocalizedEventText(event, 'description')}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
                    <Badge className="bg-[#800000]/10 text-[#800000] border-transparent">
                      {`${t('dayLabel')} ${event.day}`}
                    </Badge>
                    <Badge className="bg-[#DAA520]/10 text-[#8B7500] border-transparent">
                      {getLocalizedAgeGroup(event)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
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
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Map */}
          <div
            className="lg:col-span-2 h-full rounded-xl overflow-hidden shadow-lg border border-gray-200 relative z-0"
            ref={mapContainerRef}
          >
            <div className="absolute top-4 left-4 z-[1000] flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/90 text-[#800000] border-[#DAA520] hover:bg-[#DAA520]/20"
                onClick={() => setShowClosures((prev) => !prev)}
              >
                {showClosures ? t('hideClosures') : t('showClosures')}
              </Button>
            </div>
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
                    ? 'z-[1000] opacity-100 pointer-events-auto'
                    : 'z-[10] opacity-60 pointer-events-none'
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
              className="!h-full !w-full min-h-[320px]"
              style={{ height: '100%', width: '100%' }}
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
                  {PROCESSION_LANDMARKS.map((landmark) => {
                    const icon = landmark.type === 'start'
                      ? palaceIcon
                      : landmark.type === 'end'
                        ? finaleIcon
                        : routeCheckpointIcon;
                    return (
                      <Marker key={landmark.id} position={[landmark.lat, landmark.lng]} icon={icon}>
                        <Popup>
                          <div className="text-sm text-center space-y-1">
                            <p className="font-semibold text-[#B45309]">{landmark.name}</p>
                            <p className="text-[11px] text-gray-600">
                              {landmark.type === 'start'
                                ? t('processionStartingPoint')
                                : landmark.type === 'end'
                                  ? t('processionEndingPoint')
                                  : t('jambooRouteLabel')}
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </>
              )}

              {closuresToDisplay.map((closure) => (
                <React.Fragment key={closure.id}>
                  <Circle
                    center={[closure.lat, closure.lng]}
                    radius={closure.radius}
                    pathOptions={{ color: '#DC2626', weight: 2, fillOpacity: 0.1 }}
                  />
                  {closure.path && closure.path.length > 1 && closure.id !== 'closure-jamboo-route' && (
                    <Polyline
                      positions={closure.path.map((point) => [point.lat, point.lng])}
                      pathOptions={{ color: '#B91C1C', weight: 4, dashArray: '10 6', opacity: 0.9 }}
                    />
                  )}
                  <Marker position={[closure.lat, closure.lng]} icon={closureIcon}>
                    <Popup>
                      <div className="text-sm space-y-1 text-center">
                        <p className="font-semibold text-[#B91C1C]">
                          {language === 'kn' ? closure.name_kn : closure.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {language === 'kn' ? closure.description_kn : closure.description}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {t('activeOnDays')}: {closure.days.map((day) => `${t('dayLabel')} ${day}`).join(', ')}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {t('restrictionRadius')}: {closure.radius} {t('metersUnit')}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                </React.Fragment>
              ))}

              {routePath && (
                <Polyline positions={routePath} pathOptions={{ color: '#DAA520', weight: 6, opacity: 0.85 }} />
              )}
            </MapContainer>

            {routingStage === 'loading' && (
              <div className="absolute left-4 right-4 bottom-4 bg-white/90 backdrop-blur-sm border border-yellow-200 rounded-lg p-4 shadow-lg flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-[#800000] animate-spin" />
                <p className="text-sm text-[#800000] font-medium">{t('routeFetching')}</p>
              </div>
            )}

            {routingStage === 'error' && routingError && (
              <div className="absolute left-4 right-4 bottom-4 bg-white/95 border border-red-200 text-red-700 rounded-lg p-4 shadow-lg text-sm">
                {routingError}
              </div>
            )}

            {routingStage === 'success' && routeSummary && (
              <div className="absolute left-4 right-4 bottom-4 bg-white/95 border border-[#DAA520] rounded-lg p-4 shadow-lg max-h-[65%] overflow-y-auto">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold text-[#800000]">{routeSummary.eventName}</p>
                      <p className="text-sm text-gray-600">{t('routeReady')}</p>
                    </div>
                    <div className="text-sm text-gray-700 text-right">
                      <p>{t('distance')}: {routeSummary.distanceKm.toFixed(1)} {t('kilometersUnit')}</p>
                      <p>{t('duration')}: {Math.round(routeSummary.durationMin)} {t('minutesUnitShort')}</p>
                    </div>
                  </div>

                  <div className="border-t border-[#DAA520]/30 pt-3">
                    <p className="text-sm font-semibold text-[#800000]">{t('routeInstructionsTitle')}</p>
                    {routeInstructions.length > 0 ? (
                      <ol className="mt-2 space-y-2 max-h-40 overflow-y-auto pr-1">
                        {routeInstructions.map((step, index) => (
                          <li key={step.id} className="flex gap-2 text-xs text-gray-700">
                            <span className="font-semibold text-[#800000]">{index + 1}.</span>
                            <span className="flex-1">
                              {step.text}
                              <span className="block text-[11px] text-gray-500 mt-0.5">
                                {formatStepDistance(step.distance)} • {formatStepDuration(step.duration)}
                              </span>
                            </span>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="mt-2 text-xs text-gray-500">{t('noInstructions')}</p>
                    )}
                  </div>

                  <div className="border-t border-[#DAA520]/30 pt-3">
                    <p className="text-sm font-semibold text-[#800000]">{t('routeRestrictionsTitle')}</p>
                    {routeClosures.length > 0 ? (
                      <ul className="mt-2 space-y-2 text-xs text-gray-700">
                        {routeClosures.map((closure) => (
                          <li key={closure.id} className="bg-red-50/80 border border-red-200 rounded-md p-2">
                            <p className="font-semibold text-[#B91C1C]">
                              {language === 'kn' ? closure.name_kn : closure.name}
                            </p>
                            <p className="text-[11px] text-red-700 mt-0.5">
                              {language === 'kn' ? closure.description_kn : closure.description}
                            </p>
                            <p className="text-[11px] text-gray-600 mt-1">
                              {t('activeOnDays')}: {closure.days.map((day) => `${t('dayLabel')} ${day}`).join(', ')}
                            </p>
                            {(() => {
                              const radiusDisplay = closure.pathBuffer || closure.radius;
                              if (!radiusDisplay) {
                                return null;
                              }
                              return (
                                <p className="text-[11px] text-gray-600">
                                  {t('restrictionRadius')}: {radiusDisplay} {t('metersUnit')}
                                </p>
                              );
                            })()}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-xs text-gray-500">{t('noRestrictions')}</p>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <Button variant="ghost" size="sm" onClick={resetRoute}>
                      {t('clearRoute')}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}