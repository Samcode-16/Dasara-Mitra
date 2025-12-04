import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage, EVENTS_DATA } from './DasaraContext';
import { Card, CardContent, CardHeader, CardTitle, Button } from './ui.jsx';
import { Bus, MapPin, RefreshCw } from 'lucide-react';

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
  'chamundi hill': { lat: 12.2728, lng: 76.6717 },
  'vani vilas water works': { lat: 12.3094, lng: 76.6535 },
  'dodda gadiyara': { lat: 12.3048, lng: 76.6556 },
  'ramaswamy circle': { lat: 12.3049, lng: 76.6603 },
  'ashoka circle': { lat: 12.3027, lng: 76.6606 },
  'rto': { lat: 12.3034, lng: 76.6608 }
};

const STOP_NAME_TRANSLATIONS = {
  'palace bus stop': {
    en: 'Palace Bus Stop',
    kn: 'ಪ್ಯಾಲೆಸ್ ಬಸ್ ನಿಲ್ದಾಣ',
    hi: 'पैलेस बस स्टॉप'
  },
  'city bus stand': {
    en: 'City Bus Stand',
    kn: 'ನಗರ ಬಸ್ ಸ್ಟ್ಯಾಂಡ್',
    hi: 'सिटी बस स्टैंड'
  },
  'mysore rural bus stand': {
    en: 'Mysuru Rural Bus Stand',
    kn: 'ಮೈಸೂರು ಗ್ರಾಮೀಣ ಬಸ್ ಸ್ಟ್ಯಾಂಡ್',
    hi: 'मैसूरु ग्रामीण बस स्टेशन'
  },
  'hardinge circle': {
    en: 'Hardinge Circle',
    kn: 'ಹಾರ್ಡಿಂಜ್ ವೃತ್ತ',
    hi: 'हार्डिंगे सर्कल'
  },
  'kr hospital': {
    en: 'KR Hospital',
    kn: 'ಕೆ.ಆರ್. ಆಸ್ಪತ್ರೆ',
    hi: 'केआर अस्पताल'
  },
  'railway station': {
    en: 'Railway Station',
    kn: 'ರೈಲ್ವೇ ನಿಲ್ದಾಣ',
    hi: 'रेलवे स्टेशन'
  },
  'mysore zoo': {
    en: 'Mysuru Zoo',
    kn: 'ಮೈಸೂರು ಮೃಗಾಲಯ',
    hi: 'मैसूरु चिड़ियाघर'
  },
  'chamundipuram': {
    en: 'Chamundipuram',
    kn: 'ಚಾಮುಂಡೀಪುರಂ',
    hi: 'चामुंडीपुरम'
  },
  'five light circle': {
    en: 'Five Light Circle',
    kn: 'ಐದು ದೀಪ ವೃತ್ತ',
    hi: 'फाइव लाइट सर्कल'
  },
  'nanju malige': {
    en: 'Nanju Malige',
    kn: 'ನಂಜು ಮಳಿಗೆ',
    hi: 'नंजु मलिगे'
  },
  'bannimantap depot out gate': {
    en: 'Bannimantap Depot Out Gate',
    kn: 'ಬನ್ನಿಮಂಟಪ ಡೆಪೋ ಹೊರ ಗೇಟ್',
    hi: 'बन्नीमंतप डिपो बाहरी गेट'
  },
  'jss lay out': {
    en: 'JSS Layout',
    kn: 'ಜೆಎಸ್ಸೆಸ್ ಲೇಔಟ್',
    hi: 'जेएसएस लेआउट'
  },
  'maharani college': {
    en: 'Maharani College',
    kn: 'ಮಹಾರಾಣಿ ಕಾಲೇಜು',
    hi: 'महारानी कॉलेज'
  },
  'dasappa circle': {
    en: 'Dasappa Circle',
    kn: 'ದಾಸಪ್ಪ ವೃತ್ತ',
    hi: 'दासप्पा सर्कल'
  },
  'akashavani': {
    en: 'Akashavani',
    kn: 'ಆಕಾಶವಾಣಿ',
    hi: 'आकाशवाणी'
  },
  'vonti koppal temple': {
    en: 'Vontikoppal Temple',
    kn: 'ವಂಟಿಕೊಪ್ಪಲ್ ದೇವಾಲಯ',
    hi: 'वंटीकोप्पल मंदिर'
  },
  'chamundi hill': {
    en: 'Chamundi Hill',
    kn: 'ಚಾಮುಂಡಿ ಬೆಟ್ಟ',
    hi: 'चामुंडी पहाड़ी'
  },
  'vani vilas water works': {
    en: 'Vani Vilas Water Works',
    kn: 'ವಾಣಿ ವಿಲಾಸ್ ನೀರು ಕಾರ್ಯಾಗಾರ',
    hi: 'वाणी विलास जल कार्यशाला'
  },
  'dodda gadiyara': {
    en: 'Dodda Gadiyara',
    kn: 'ದೊಡ್ಡ ಗಡಿಯಾರ',
    hi: 'डोड्डा गडियारा'
  },
  'ramaswamy circle': {
    en: 'Ramaswamy Circle',
    kn: 'ರಾಮಸ್ವಾಮಿ ವೃತ್ತ',
    hi: 'रामस्वामी सर्कल'
  },
  'ashoka circle': {
    en: 'Ashoka Circle',
    kn: 'ಅಶೋಕ ವೃತ್ತ',
    hi: 'अशोक सर्कल'
  },
  'rto': {
    en: 'RTO Office',
    kn: 'ಆರ್‌ಟಿಒ ಕಚೇರಿ',
    hi: 'आरटीओ कार्यालय'
  }
};

const getStopNameVariants = (stop, language) => {
  const baseName = stop?.name || '';
  const normalizedKey = stop?.key || normalizeStopName(baseName);
  const dictionary = STOP_NAME_TRANSLATIONS[normalizedKey];
  const english = dictionary?.en || baseName;

  if (language === 'kn') {
    const localized = dictionary?.kn || english;
    return {
      primary: localized,
      secondary: localized === english ? null : english
    };
  }

  if (language === 'hi') {
    const localized = dictionary?.hi || english;
    return {
      primary: localized,
      secondary: localized === english ? null : english
    };
  }

  return {
    primary: english,
    secondary: null
  };
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

  const preferredStops = (event.nearbyStops || [])
    .map((rawKey) => {
      const normalizedKey = normalizeStopName(rawKey);
      const stopData = stopsMap[normalizedKey];
      if (!stopData) {
        return null;
      }
      const coords = STOP_COORDINATES[normalizedKey];
      const distanceKm = coords ? distanceInKm(event.lat, event.lng, coords.lat, coords.lng) : null;
      return {
        key: normalizedKey,
        distanceKm,
        name: stopData.name,
        buses: stopData.buses
      };
    })
    .filter(Boolean);

  if (preferredStops.length) {
    return preferredStops.slice(0, limit);
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
  const [olaError, setOlaError] = useState(null);

  const getLocalizedEventName = (event) => {
    if (!event) return '';
    if (language === 'kn') return event.name_kn || event.name;
    if (language === 'hi') return event.name_hi || event.name;
    return event.name;
  };

  const getLocalizedVenue = (event) => {
    if (!event) return '';
    if (language === 'kn') return event.venue_kn || event.venue || '';
    if (language === 'hi') return event.venue_hi || event.venue || '';
    return event.venue || '';
  };

  const selectedFromEvent = useMemo(() => {
    if (!fromId) return null;
    return EVENTS_DATA.find((event) => event.id.toString() === fromId) || null;
  }, [fromId]);

  const selectedToEvent = useMemo(() => {
    if (!toId) return null;
    return EVENTS_DATA.find((event) => event.id.toString() === toId) || null;
  }, [toId]);

  const fromEventDetails = route ? EVENTS_DATA.find((event) => event.id === route.fromEventId) : null;
  const toEventDetails = route ? EVENTS_DATA.find((event) => event.id === route.toEventId) : null;
  const fromStops = getNearestStopsForEvent(fromEventDetails, busStops);
  const toStops = getNearestStopsForEvent(toEventDetails, busStops);

  const directBusMatches = useMemo(() => {
    if (!route || !fromStops.length || !toStops.length) {
      return [];
    }

    const matches = [];
    fromStops.forEach((origin) => {
      toStops.forEach((destination) => {
        const shared = origin.buses.filter((bus) => destination.buses.includes(bus));
        if (shared.length) {
          matches.push({
            origin,
            destination,
            buses: shared.slice(0, 5),
            total: shared.length
          });
        }
      });
    });

    return matches;
  }, [route, fromStops, toStops]);

  const primaryFromStop = fromStops[0];
  const primaryToStop = toStops[0];

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

  useEffect(() => {
    setOlaError(null);
  }, [selectedFromEvent, selectedToEvent]);

  const handleCalculate = () => {
    if (!fromId || !toId || fromId === toId) return;
    
    setLoading(true);
    // Simulate API calculation delay
    setTimeout(() => {
      const fromEvent = EVENTS_DATA.find(e => e.id.toString() === fromId);
      const toEvent = EVENTS_DATA.find(e => e.id.toString() === toId);
      if (!fromEvent || !toEvent) {
        setLoading(false);
        return;
      }
      const preciseDistance = distanceInKm(fromEvent.lat, fromEvent.lng, toEvent.lat, toEvent.lng);
      const distance = Number.isFinite(preciseDistance) ? Math.max(0.5, parseFloat(preciseDistance.toFixed(1))) : 2;
      setRoute({
        fromEventId: fromEvent.id,
        toEventId: toEvent.id,
        distance,
        // Bus is the only supported mode right now, but we no longer render per-mode cards.
        options: []
      });
      setLoading(false);
    }, 1500);
  };

  const buildRideCoordinates = (event) => {
    if (!event) return null;
    return {
      name: getLocalizedEventName(event) || event.name,
      latitude: event.lat,
      longitude: event.lng
    };
  };

  const pickup = buildRideCoordinates(selectedFromEvent);
  const drop = buildRideCoordinates(selectedToEvent);

  const WALKING_SPEED_KMPH = 4.8;
  const WALKABLE_DISTANCE_KM = 1.5;

  const isWalkable = route && route.distance <= WALKABLE_DISTANCE_KM;
  const walkingTimeMinutes = isWalkable
    ? Math.max(5, Math.round((route.distance / WALKING_SPEED_KMPH) * 60))
    : null;

  const uberUrl = useMemo(() => {
    if (!pickup || !drop) return null;
    try {
      // Use official Uber deep link format from developer.uber.com
      const url = new URL('https://m.uber.com/looking');
      
      // Create pickup location object
      const pickupObj = {
        latitude: pickup.latitude,
        longitude: pickup.longitude,
        addressLine1: pickup.name
      };
      
      // Create dropoff location object
      const dropoffObj = {
        latitude: drop.latitude,
        longitude: drop.longitude,
        addressLine1: drop.name
      };
      
      // Encode as JSON and set parameters
      url.searchParams.set('pickup', JSON.stringify(pickupObj));
      url.searchParams.set('drop[0]', JSON.stringify(dropoffObj));
      
      return url.toString();
    } catch (error) {
      return null;
    }
  }, [pickup, drop]);

  const uberAppUrl = useMemo(() => {
    if (!pickup || !drop) return null;
    try {
      // Use official uber:// scheme format
      const params = new URLSearchParams();
      params.set('pickup[latitude]', pickup.latitude);
      params.set('pickup[longitude]', pickup.longitude);
      params.set('pickup[nickname]', pickup.name);
      params.set('dropoff[latitude]', drop.latitude);
      params.set('dropoff[longitude]', drop.longitude);
      params.set('dropoff[nickname]', drop.name);
      return `uber://riderequest?${params.toString()}`;
    } catch (error) {
      return null;
    }
  }, [pickup, drop]);

  const handleOlaBooking = () => {
    const pickupPoint = buildRideCoordinates(selectedFromEvent);
    const dropPoint = buildRideCoordinates(selectedToEvent);
    if (!pickupPoint || !dropPoint) {
      setOlaError('cabHelperInfoMissing');
      return;
    }
    setOlaError(null);
    try {
      const url = new URL('https://book.olacabs.com/');
      url.searchParams.set('lat', pickupPoint.latitude);
      url.searchParams.set('lng', pickupPoint.longitude);
      url.searchParams.set('category', 'mini');
      url.searchParams.set('drop_lat', dropPoint.latitude);
      url.searchParams.set('drop_lng', dropPoint.longitude);
      url.searchParams.set('dsw', 'yes');
      url.searchParams.set('pickup_name', pickupPoint.name);
      url.searchParams.set('drop_name', dropPoint.name);
      window.open(url.toString(), '_blank', 'noopener,noreferrer');
    } catch (error) {
      setOlaError('cabHelperOlaUnavailable');
    }
  };

  const handleUberRedirect = (webUrl, appUrl) => {
    if (!webUrl) return;
    try {
      const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile && appUrl) {
        // Try opening the native app first. If that fails (app not installed),
        // fallback to the web URL after a short delay.
        const fallbackTimer = setTimeout(() => {
          window.open(webUrl, '_blank', 'noopener,noreferrer');
        }, 900);

        // Attempt to open the native app. This may navigate away if the app is installed.
        window.location.href = appUrl;

        // Note: we can't reliably detect success in browsers, so the timeout provides
        // a reasonable fallback to the web flow.
        return;
      }
    } catch (err) {
      // ignore and fallback to web link
    }

    window.open(webUrl, '_blank', 'noopener,noreferrer');
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
                  <option value="">{t('selectStartingPlaceholder')}</option>
                  {EVENTS_DATA.map((event) => (
                    <option key={event.id} value={event.id.toString()}>
                      {getLocalizedEventName(event)}
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
                  <option value="">{t('selectDestinationPlaceholder')}</option>
                  {EVENTS_DATA.map((event) => (
                    <option key={event.id} value={event.id.toString()}>
                      {getLocalizedEventName(event)}
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

              <div className="rounded-xl border border-gray-200 bg-white/70 p-3 space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>{t('cabHelperTitle')}</span>
                  <span className="text-[11px]">{t('cabHelperHint')}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-yellow-600 text-yellow-700"
                    onClick={handleOlaBooking}
                    disabled={!selectedFromEvent || !selectedToEvent}
                  >
                    {t('cabHelperOla')}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-black text-black"
                    onClick={() => handleUberRedirect(uberUrl, uberAppUrl)}
                    disabled={!uberUrl}
                  >
                    {t('cabHelperUber')}
                  </Button>
                </div>
                {olaError ? (
                  <p className="text-[11px] text-red-600">{t(olaError)}</p>
                ) : (
                  <p className="text-[11px] text-gray-500">
                    {selectedFromEvent && selectedToEvent
                      ? t('cabHelperInfoReady')
                      : t('cabHelperInfoMissing')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-4">
            {!route && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 min-h-[300px] border-2 border-dashed rounded-xl p-8 bg-white/50">
                <Bus className="w-16 h-16 mb-4 opacity-20" />
                <p>{t('noRoutePrompt')}</p>
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
                    <>
                      <div className="mt-3 rounded-xl border border-yellow-200 bg-white/90 p-3 text-sm text-[#7a4a00]">
                        {t('busSupportSubtitle')}
                      </div>
                      <div className="mt-3 grid gap-4 md:grid-cols-2">
                        {[{ event: fromEventDetails, stops: fromStops }, { event: toEventDetails, stops: toStops }].map((segment, idx) => (
                          <div key={idx} className="rounded-xl border border-yellow-100 bg-white/80 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-[#a25400]">
                              {getLocalizedEventName(segment.event) || (idx === 0 ? t('fromEvent') : t('toEvent'))}
                            </p>
                            {segment.event?.venue && (
                              <p className="text-[11px] text-gray-500 mt-0.5">
                                {t('eventVenueLabel')}: {getLocalizedVenue(segment.event)}
                              </p>
                            )}
                            {segment.stops && segment.stops.length ? (
                              <ul className="mt-2 space-y-2">
                                {segment.stops.map((stop) => {
                                  const stopLabel = getStopNameVariants(stop, language);
                                  const maxToShow = 5;
                                  const busesToShow = stop.buses.slice(0, maxToShow);
                                  const remaining = stop.buses.length - busesToShow.length;
                                  return (
                                    <li key={`${segment.event?.id || idx}-${stop.name}`} className="rounded-lg border border-yellow-100 bg-yellow-50/80 p-3">
                                      <div className="flex items-center justify-between text-sm font-semibold text-gray-900">
                                        <div className="flex flex-col leading-tight">
                                          <span>{stopLabel.primary}</span>
                                          {stopLabel.secondary ? (
                                            <span className="text-[11px] font-normal text-gray-500">{stopLabel.secondary}</span>
                                          ) : null}
                                        </div>
                                        {typeof stop.distanceKm === 'number' ? (
                                          <span className="text-xs font-medium text-gray-500">
                                            ≈ {stop.distanceKm.toFixed(1)} {t('kilometersUnit')}
                                          </span>
                                        ) : null}
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

                      {route && (
                        <div className="mt-4 space-y-3">
                          {directBusMatches.length ? (
                            <div className="rounded-xl border border-green-200 bg-green-50/80 p-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-green-800">{t('directBusHeading')}</p>
                              <ul className="mt-2 space-y-2 text-sm text-green-900">
                                {directBusMatches.slice(0, 3).map((match, idx) => {
                                  const originLabel = getStopNameVariants(match.origin, language);
                                  const destinationLabel = getStopNameVariants(match.destination, language);
                                  return (
                                    <li key={`direct-${idx}`} className="rounded-lg bg-white/70 p-3">
                                      <p className="font-semibold">
                                        {match.buses.join(', ')}
                                        {match.total > match.buses.length ? ` +${match.total - match.buses.length}` : ''}
                                      </p>
                                      <div className="mt-1 space-y-0.5">
                                        <p className="text-xs text-green-700">
                                          {originLabel.primary} → {destinationLabel.primary}
                                        </p>
                                        {language !== 'en' && (originLabel.secondary || destinationLabel.secondary) ? (
                                          <p className="text-[11px] text-green-700/80">
                                            {originLabel.secondary || originLabel.primary} → {destinationLabel.secondary || destinationLabel.primary}
                                          </p>
                                        ) : null}
                                      </div>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          ) : (
                            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-900">
                              <p className="font-semibold text-amber-900">{t('transferRequiredHeading')}</p>
                              <p className="text-xs text-amber-700 mt-1">
                                {t('transferLead')} {primaryFromStop
                                  ? t('transferOriginAdvice', {
                                      stop: getStopNameVariants(primaryFromStop, language).primary,
                                      buses: primaryFromStop.buses.slice(0, 4).join(', ')
                                    })
                                  : t('transferOriginFallback')} {primaryToStop
                                  ? t('transferDestinationAdvice', {
                                      stop: getStopNameVariants(primaryToStop, language).primary,
                                      buses: primaryToStop.buses.slice(0, 4).join(', ')
                                    })
                                  : t('transferDestinationFallback')}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                <h3 className="font-semibold text-lg text-gray-800 mb-4 flex items-center gap-2">
                  {t('routeDetails')}
                  <span className="text-xs font-normal text-gray-500 ml-auto">
                    ≈ {route.distance.toFixed(1)} {t('kilometersUnit')}
                  </span>
                </h3>

                {isWalkable && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 flex gap-3 items-center">
                    <div className="p-3 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                      🚶
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-900">{t('walkFriendlyTitle')}</p>
                      <p className="text-xs text-emerald-800">
                        {t('walkFriendlyDescription', {
                          distance: route.distance.toFixed(1),
                          minutes: walkingTimeMinutes
                        })}
                      </p>
                    </div>
                  </div>
                )}
                
                {route.options.length === 0 && (
                  <div className="rounded-xl border border-gray-200 bg-white/80 p-4 text-center text-sm text-gray-500">
                    {t('busSupportSubtitle')}
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}