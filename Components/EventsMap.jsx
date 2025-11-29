import React, { useEffect, useState, useRef } from 'react';
import { Navigation, Calendar, Info, RefreshCw } from 'lucide-react';
import { useLanguage, EVENTS_DATA } from './DasaraContext';
import { Button, Card, CardContent, Badge } from './ui';
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

export default function EventsMap() {
  const { t, language } = useLanguage();
  const [userLocation, setUserLocation] = useState(null);
  const [nearestEvents, setNearestEvents] = useState([]);
  const [permissionStatus, setPermissionStatus] = useState('prompt');
  const [routePath, setRoutePath] = useState(null);
  const [routeSummary, setRouteSummary] = useState(null);
  const [routingStage, setRoutingStage] = useState('idle');
  const [routingError, setRoutingError] = useState(null);
  const [activeEvent, setActiveEvent] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    calculateDistances(EVENTS_DATA, null); // Initial load without user location
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
  };

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

    try {
      const url = `https://router.project-osrm.org/route/v1/walking/${userLocation.lng},${userLocation.lat};${event.lng},${event.lat}?alternatives=false&overview=full&geometries=geojson`;
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
        eventName: language === 'kn' ? event.name_kn : event.name,
        distanceKm: route.distance / 1000,
        durationMin: route.duration / 60,
      });
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

  return (
    <section id="events" className="py-12 md:py-20 bg-white">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-maroon-900 mb-4" style={{ color: '#800000' }}>
            {t('eventsTitle')}
          </h2>
          
          {!userLocation && permissionStatus !== 'denied' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 inline-flex flex-col md:flex-row items-center gap-4 mx-auto">
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
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
          {/* Event List */}
          <div className="lg:col-span-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar h-full">
            {nearestEvents.map((event) => (
              <Card key={event.id} className="hover:shadow-md transition-shadow border-l-4 border-l-[#800000]">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-gray-800">
                      {language === 'kn' ? event.name_kn : event.name}
                    </h3>
                    <Badge className="text-xs border-[#DAA520] text-[#B8860B] bg-transparent">
                      {event.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {language === 'kn' ? event.description_kn : event.description}
                  </p>
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
          <div className="lg:col-span-2 h-full rounded-xl overflow-hidden shadow-lg border border-gray-200 relative z-0">
            <MapContainer
              center={[12.3051, 76.6551]}
              zoom={13}
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
              {nearestEvents.map((event) => (
                <Marker 
                  key={event.id} 
                  position={[event.lat, event.lng]}
                  icon={goldIcon}
                >
                  <Popup>
                    <div className="text-center">
                      <h3 className="font-bold text-[#800000]">{language === 'kn' ? event.name_kn : event.name}</h3>
                      <p className="text-xs">{event.time}</p>
                    </div>
                  </Popup>
                </Marker>
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
              <div className="absolute left-4 right-4 bottom-4 bg-white/95 border border-[#DAA520] rounded-lg p-4 shadow-lg">
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold text-[#800000]">{routeSummary.eventName}</p>
                      <p className="text-sm text-gray-600">{t('routeReady')}</p>
                    </div>
                    <div className="text-sm text-gray-700 text-right">
                      <p>{t('distance')}: {routeSummary.distanceKm.toFixed(1)} km</p>
                      <p>{t('duration')}: {Math.round(routeSummary.durationMin)} min</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
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