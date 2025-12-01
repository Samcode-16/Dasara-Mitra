import React, { useState, useEffect } from 'react';
import { useLanguage, EVENTS_DATA } from './DasaraContext';
import { Card, CardContent, CardHeader, CardTitle, Button } from './ui.jsx';
import { Bus, Car, Truck, Clock, IndianRupee, MapPin, RefreshCw } from 'lucide-react';

const sanitizeStopName = (value = '') =>
  value
    .replace(/\s*-\s*PF.*$/i, '')
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeStopName = (value = '') => sanitizeStopName(value).toLowerCase();

const STOP_COORDINATES = {
  'palace bus stop': { lat: 12.3054, lng: 76.6552 },
  'city bus stand': { lat: 12.3078, lng: 76.6556 },
  'mysore rural bus stand': { lat: 12.3044, lng: 76.6546 },
  'hardinge circle': { lat: 12.3042, lng: 76.6549 },
  'kr hospital': { lat: 12.3104, lng: 76.6527 },
  'railway station': { lat: 12.3111, lng: 76.6498 },
  'mysore zoo': { lat: 12.3024, lng: 76.6655 },
  'chamundipuram': { lat: 12.2958, lng: 76.663 },
  'five light circle': { lat: 12.3027, lng: 76.6642 },
  'nanju malige': { lat: 12.3011, lng: 76.6626 },
  'bannimantap depot out gate': { lat: 12.329, lng: 76.6614 },
  'jss lay out': { lat: 12.3247, lng: 76.6635 },
  'maharani college': { lat: 12.311, lng: 76.6498 },
  'dasappa circle': { lat: 12.3099, lng: 76.6539 },
  'akashavani': { lat: 12.3107, lng: 76.6512 },
  'vonti koppal temple': { lat: 12.3134, lng: 76.6413 },
  'chamundi hill': { lat: 12.2728, lng: 76.6717 }
};

const EARTH_RADIUS_KM = 6371;

const toRad = (deg) => (deg * Math.PI) / 180;

const distanceInKm = (lat1, lon1, lat2, lon2) => {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
};

const getNearestStopsForEvent = (event, stopsMap, limit = 3) => {
  if (!event || !stopsMap || !Object.keys(stopsMap).length) {
    return [];
  }

  return Object.entries(STOP_COORDINATES)
    .filter(([key]) => stopsMap[key])
    .map(([key, coords]) => ({
      key,
      distanceKm: distanceInKm(event.lat, event.lng, coords.lat, coords.lng),
      name: stopsMap[key].name,
      buses: stopsMap[key].buses
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
};

export default function TransportPlanner() {
  const { t, language } = useLanguage();
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busStops, setBusStops] = useState({});
  const [busLoading, setBusLoading] = useState(true);
  const [busError, setBusError] = useState(null);

  const getLocalizedEventName = (event) => {
    if (!event) return '';
    if (language === 'kn') return event.name_kn || event.name;
    if (language === 'hi') return event.name_hi || event.name;
    return event.name;
  };

  const fromEventDetails = route ? EVENTS_DATA.find((event) => event.id === route.fromEventId) : null;
  const toEventDetails = route ? EVENTS_DATA.find((event) => event.id === route.toEventId) : null;
  const fromStops = getNearestStopsForEvent(fromEventDetails, busStops);
  const toStops = getNearestStopsForEvent(toEventDetails, busStops);

  const renderStopList = (stops) => {
    if (busLoading) {
      return (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Mapping city buses…</span>
        </div>
      );
    }

    if (busError) {
      return <p className="text-xs text-red-600">{busError}</p>;
    }

    if (!stops?.length) {
      return <p className="text-xs text-gray-500">No direct bus stops mapped yet.</p>;
    }

    return (
      <ul className="space-y-2">
        {stops.map((stop) => (
          <li key={stop.key} className="rounded-lg bg-gray-50 p-2">
            <p className="text-sm font-semibold text-gray-800">{stop.name}</p>
            <p className="text-xs text-gray-500">{stop.distanceKm.toFixed(2)} km away</p>
            <p className="text-xs text-gray-600 mt-1">
              {stop.buses.slice(0, 4).join(', ')}
              {stop.buses.length > 4 ? ` +${stop.buses.length - 4} more` : ''}
            </p>
          </li>
        ))}
      </ul>
    );
  };

  useEffect(() => {
    let isActive = true;

    const loadBusStops = async () => {
      try {
        setBusLoading(true);
        const response = await fetch('/db/bus_route.json');
        if (!response.ok) {
          throw new Error('Unable to load city buses');
        }
        const data = await response.json();
        if (!isActive) {
          return;
        }

        const compiled = {};
        data.forEach((routeEntry) => {
          if (!Array.isArray(routeEntry?.route)) {
            return;
          }
          routeEntry.route.forEach((stop) => {
            if (!stop) return;
            const cleanName = sanitizeStopName(stop);
            const key = normalizeStopName(stop);
            if (!key) return;
            if (!compiled[key]) {
              compiled[key] = {
                name: cleanName,
                buses: new Set()
              };
            }
            compiled[key].buses.add(routeEntry.bus_num);
          });
        });

        const normalized = Object.entries(compiled).reduce((acc, [key, value]) => {
          acc[key] = {
            name: value.name,
            buses: Array.from(value.buses).sort((a, b) => a.localeCompare(b))
          };
          return acc;
        }, {});

        setBusStops(normalized);
        setBusError(null);
      } catch (error) {
        if (!isActive) return;
        setBusError(error.message || 'Failed to load bus data');
      } finally {
        if (isActive) {
          setBusLoading(false);
        }
      }
    };

    loadBusStops();
    return () => {
      isActive = false;
    };
  }, []);

  const handleCalculate = () => {
    if (!fromId || !toId || fromId === toId) return;
    
    setLoading(true);
    // Simulate API calculation delay
    setTimeout(() => {
      const fromEvent = EVENTS_DATA.find(e => e.id.toString() === fromId);
      const toEvent = EVENTS_DATA.find(e => e.id.toString() === toId);
      
      // Mock distances roughly
      const dist = Math.floor(Math.random() * 5) + 2; // 2-7 km random
      
      setRoute({
        fromEventId: fromEvent.id,
        toEventId: toEvent.id,
        distance: dist,
        options: [
          { type: 'bus', duration: dist * 5 + 10, cost: 15, icon: Bus },
          { type: 'taxi', duration: dist * 2 + 5, cost: dist * 20, icon: Car },
          { type: 'auto', duration: dist * 3 + 5, cost: dist * 15, icon: Truck },
        ]
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <section id="transport" className="py-12 md:py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start max-w-5xl mx-auto">
          {/* Form */}
          <Card className="border-t-4 border-t-[#DAA520]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#800000]" />
                {t('findRoute')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">{t('fromEvent')}</label>
                <select
                  value={fromId}
                  onChange={(event) => setFromId(event.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#800000] focus:ring-2 focus:ring-[#DAA520]"
                >
                  <option value="">Select starting point</option>
                  {EVENTS_DATA.map((event) => (
                    <option key={event.id} value={event.id.toString()}>
                      {language === 'kn' ? event.name_kn : event.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">{t('toEvent')}</label>
                <select
                  value={toId}
                  onChange={(event) => setToId(event.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#800000] focus:ring-2 focus:ring-[#DAA520]"
                >
                  <option value="">Select destination</option>
                  {EVENTS_DATA.map((event) => (
                    <option key={event.id} value={event.id.toString()}>
                      {language === 'kn' ? event.name_kn : event.name}
                    </option>
                  ))}
                </select>
              </div>

              <Button 
                className="w-full bg-[#800000] hover:bg-[#600000] text-white"
                onClick={handleCalculate}
                disabled={loading || !fromId || !toId}
              >
                {loading ? t('calculating') : t('findRoute')}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-4">
            {!route && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 min-h-[300px] border-2 border-dashed rounded-xl p-8 bg-white/50">
                <Bus className="w-16 h-16 mb-4 opacity-20" />
                <p>Select locations to see transport options</p>
              </div>
            )}

            {loading && (
               <div className="space-y-4">
                 {[1,2,3].map(i => (
                   <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
                 ))}
               </div>
            )}

            {route && !loading && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="font-semibold text-lg text-gray-800 mb-4 flex items-center gap-2">
                  {t('routeDetails')}
                  <span className="text-xs font-normal text-gray-500 ml-auto">
                    Approx {route.distance} km
                  </span>
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  {[{
                    label: t('fromEvent'),
                    event: fromEventDetails,
                    stops: fromStops
                  }, {
                    label: t('toEvent'),
                    event: toEventDetails,
                    stops: toStops
                  }].map((section) => (
                    <Card key={section.label} className="border border-dashed border-gray-200">
                      <CardContent className="p-4 space-y-3">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500">{section.label}</p>
                          <p className="text-base font-semibold text-gray-900">
                            {section.event ? getLocalizedEventName(section.event) : 'Select an event'}
                          </p>
                          {section.event?.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {section.event.description}
                            </p>
                          )}
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                            Nearby bus stops
                          </p>
                          {renderStopList(section.stops)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {route.options.map((opt, idx) => (
                  <Card key={idx} className="hover:shadow-md transition-all cursor-pointer active:scale-[0.99]">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${
                          opt.type === 'bus' ? 'bg-blue-100 text-blue-600' : 
                          opt.type === 'taxi' ? 'bg-yellow-100 text-yellow-600' : 
                          'bg-green-100 text-green-600'
                        }`}>
                          <opt.icon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold capitalize text-gray-800">{opt.type}</p>
                          <p className="text-xs text-gray-500">Frequent service</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1 font-bold text-[#800000]">
                          <IndianRupee className="w-3 h-3" />
                          {opt.cost}
                        </div>
                        <div className="flex items-center justify-end gap-1 text-sm text-gray-600">
                          <Clock className="w-3 h-3" />
                          {opt.duration} min
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <div className="pt-4 flex gap-2">
                    <Button variant="outline" className="flex-1 border-yellow-600 text-yellow-700">
                        Book Ola
                    </Button>
                     <Button variant="outline" className="flex-1 border-black text-black">
                        Book Uber
                    </Button>
                </div>

                <div className="rounded-2xl border border-yellow-200 bg-yellow-50/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[#7a4a00]">{t('busSupportTitle')}</p>
                      <p className="text-xs text-[#7a4a00]/80">{t('busSupportSubtitle')}</p>
                    </div>
                    {busLoading && (
                      <span className="flex items-center gap-1 text-xs text-[#7a4a00]">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        {t('busLoadingStatus')}
                      </span>
                    )}
                  </div>

                  {busError && !busLoading && (
                    <p className="mt-3 rounded-lg border border-red-200 bg-white/70 p-3 text-xs text-red-700">
                      {t('busErrorStatus')}
                    </p>
                  )}

                  {!busLoading && !busError && (
                    <div className="mt-3 grid gap-4 md:grid-cols-2">
                      {[{ event: fromEventDetails, stops: fromStops }, { event: toEventDetails, stops: toStops }].map((segment, idx) => (
                        <div key={idx} className="rounded-xl border border-yellow-100 bg-white/80 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-[#a25400]">
                            {getLocalizedEventName(segment.event) || (idx === 0 ? t('fromEvent') : t('toEvent'))}
                          </p>
                          {segment.stops && segment.stops.length ? (
                            <ul className="mt-2 space-y-2">
                              {segment.stops.map((stop) => {
                                const maxToShow = 5;
                                const busesToShow = stop.buses.slice(0, maxToShow);
                                const remaining = stop.buses.length - busesToShow.length;
                                return (
                                  <li key={`${segment.event?.id || idx}-${stop.name}`} className="rounded-lg border border-yellow-100 bg-yellow-50/80 p-3">
                                    <div className="flex items-center justify-between text-sm font-semibold text-gray-900">
                                      <span>{stop.name}</span>
                                      <span className="text-xs font-medium text-gray-500">
                                        ≈ {stop.distanceKm.toFixed(1)} {t('kilometersUnit')}
                                      </span>
                                    </div>
                                    <p className="mt-1 text-xs text-gray-600">
                                      {t('busListLabel')}: {busesToShow.join(', ')}
                                      {remaining > 0 ? ` +${remaining}` : ''}
                                    </p>
                                  </li>
                                );
                              })}
                            </ul>
                          ) : (
                            <p className="mt-2 text-xs text-gray-500">{t('busNoStops')}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}