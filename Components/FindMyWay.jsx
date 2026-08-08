import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Home,
  Navigation,
  MapPin,
  AlertTriangle,
  Check,
  Loader2,
  X,
  Compass,
  Shield,
  Clock,
  Route,
  Volume2,
  VolumeX,
  ChevronRight,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  CornerUpLeft,
  CornerUpRight,
  RefreshCw,
  Play,
  Pause,
  History,
  Trash2,
  Eye,
  EyeOff,
  WifiOff,
  Radio,
} from "lucide-react";
import { useLanguage } from "./DasaraContext";
import { Button, Card, CardContent, Badge } from "./ui.jsx";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// TomTom API configuration
const browserTomTomKey = (import.meta.env.VITE_TOMTOM_API_KEY || "").trim();
const rawBackendBaseUrl = (
  import.meta.env.VITE_ASSISTANT_API_BASE_URL?.trim() || ""
).replace(/\/$/, "");
const ROUTING_PROXY_ENDPOINTS = Array.from(
  new Set(
    [
      "/api/osrm-route",
      rawBackendBaseUrl ? `${rawBackendBaseUrl}/api/osrm-route` : null,
    ].filter(Boolean),
  ),
);

// Preset safe locations
const PRESET_LOCATIONS = [
  {
    id: "palace-police",
    name: "Palace Police Outpost",
    name_kn: "ಅರಮನೆ ಪೊಲೀಸ್ ಕೇಂದ್ರ",
    lat: 12.3045,
    lng: 76.6555,
    type: "police",
    icon: Shield,
  },
  {
    id: "city-bus-stand",
    name: "City Bus Stand",
    name_kn: "ನಗರ ಬಸ್ ನಿಲ್ದಾಣ",
    lat: 12.3078,
    lng: 76.6556,
    type: "transport",
    icon: Navigation,
  },
  {
    id: "kr-hospital",
    name: "K.R. Hospital",
    name_kn: "ಕೆ.ಆರ್. ಆಸ್ಪತ್ರೆ",
    lat: 12.3104,
    lng: 76.6527,
    type: "medical",
    icon: AlertTriangle,
  },
  {
    id: "railway-station",
    name: "Railway Station",
    name_kn: "ರೈಲ್ವೇ ನಿಲ್ದಾಣ",
    lat: 12.3111,
    lng: 76.6498,
    type: "transport",
    icon: Navigation,
  },
  {
    id: "dasara-exhibition",
    name: "Dasara Exhibition Gate",
    name_kn: "ದಸರಾ ಪ್ರದರ್ಶನ ಗೇಟ್",
    lat: 12.302,
    lng: 76.66,
    type: "landmark",
    icon: MapPin,
  },
];

const HOME_BASE_STORAGE_KEY = "dasara-mitra-home-base";
const TRAIL_STORAGE_KEY = "dasara-mitra-trail-history";
const TRAIL_SAVE_INTERVAL = 60000; // Save every 60 seconds
const MIN_DISTANCE_FOR_TRAIL = 5; // Minimum 5 meters to add new point

// Maneuver to icon mapping
const MANEUVER_ICONS = {
  TURN_LEFT: ArrowLeft,
  TURN_RIGHT: ArrowRight,
  SHARP_LEFT: CornerUpLeft,
  SHARP_RIGHT: CornerUpRight,
  SLIGHT_LEFT: ArrowLeft,
  SLIGHT_RIGHT: ArrowRight,
  STRAIGHT: ArrowUp,
  UTURN_LEFT: CornerUpLeft,
  UTURN_RIGHT: CornerUpRight,
  DEPART: Play,
  ARRIVE: Check,
  KEEP_LEFT: ArrowLeft,
  KEEP_RIGHT: ArrowRight,
  ROUNDABOUT_LEFT: CornerUpLeft,
  ROUNDABOUT_RIGHT: CornerUpRight,
  DEFAULT: ChevronRight,
};

// Get maneuver icon component
const getManeuverIcon = (maneuver) => {
  const normalized = (maneuver || "").toUpperCase().replace(/-/g, "_");
  return MANEUVER_ICONS[normalized] || MANEUVER_ICONS.DEFAULT;
};

// Voice synthesis helper
const speakText = (text, language = "en") => {
  if (!("speechSynthesis" in window)) return false;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang =
    language === "kn" ? "kn-IN" : language === "hi" ? "hi-IN" : "en-US";
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;

  window.speechSynthesis.speak(utterance);
  return true;
};

// Fetch route from TomTom via proxy
const fetchPedestrianRoute = async (startLng, startLat, endLng, endLat) => {
  const waypointsStr = `${startLng},${startLat};${endLng},${endLat}`;
  const params = new URLSearchParams({
    coords: waypointsStr,
    mode: "pedestrian",
  });

  let lastError = null;

  for (const endpoint of ROUTING_PROXY_ENDPOINTS) {
    try {
      const response = await fetch(`${endpoint}?${params.toString()}`);
      if (!response.ok) {
        lastError = new Error(`Routing failed with status ${response.status}`);
        continue;
      }

      const data = await response.json();
      if (Array.isArray(data?.coordinates) && data.coordinates.length) {
        return {
          coordinates: data.coordinates,
          summary: data.summary || null,
          instructions: data.instructions || [],
        };
      }

      lastError = new Error("Routing returned no path");
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Routing failed");
};

// Build TomTom raster style for map
const buildTomTomRasterStyle = (apiKey) => ({
  version: 8,
  sources: {
    tomtom: {
      type: "raster",
      tiles: [
        `https://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?key=${apiKey}`,
      ],
      tileSize: 256,
      attribution: "© TomTom",
    },
  },
  layers: [
    {
      id: "tomtom-basemap",
      type: "raster",
      source: "tomtom",
      minzoom: 0,
      maxzoom: 22,
    },
  ],
});

// Fallback OSM style
const OSM_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm-layer", type: "raster", source: "osm" }],
};

// Distance calculation utility (returns km)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Calculate bearing between two points
const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;

  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
};

// Generate turn instructions from route coordinates
const generateTurnInstructions = (
  coordinates,
  homeBaseName,
  language = "en",
) => {
  if (!coordinates || coordinates.length < 2) return [];

  const instructions = [];
  const TURN_THRESHOLD = 30;

  // Start instruction
  instructions.push({
    id: 0,
    maneuver: "DEPART",
    message:
      language === "kn"
        ? "ನಿಮ್ಮ ಪ್ರಯಾಣ ಪ್ರಾರಂಭಿಸಿ"
        : language === "hi"
          ? "अपनी यात्रा शुरू करें"
          : "Start your journey",
    distanceToNext: 0,
    point: coordinates[0],
    cumulativeDistance: 0,
  });

  let cumulativeDistance = 0;

  for (let i = 1; i < coordinates.length - 1; i++) {
    const [lng1, lat1] = coordinates[i - 1];
    const [lng2, lat2] = coordinates[i];
    const [lng3, lat3] = coordinates[i + 1];

    const segmentDist = calculateDistance(lat1, lng1, lat2, lng2);
    cumulativeDistance += segmentDist;

    const bearing1 = calculateBearing(lat1, lng1, lat2, lng2);
    const bearing2 = calculateBearing(lat2, lng2, lat3, lng3);

    let turnAngle = bearing2 - bearing1;
    if (turnAngle > 180) turnAngle -= 360;
    if (turnAngle < -180) turnAngle += 360;

    if (Math.abs(turnAngle) > TURN_THRESHOLD) {
      let maneuver, messageEn, messageKn, messageHi;

      if (turnAngle < -120) {
        maneuver = "SHARP_LEFT";
        messageEn = "Take a sharp left";
        messageKn = "ತೀವ್ರ ಎಡಕ್ಕೆ ತಿರುಗಿ";
        messageHi = "तेज बाएं मुड़ें";
      } else if (turnAngle < -45) {
        maneuver = "TURN_LEFT";
        messageEn = "Turn left";
        messageKn = "ಎಡಕ್ಕೆ ತಿರುಗಿ";
        messageHi = "बाएं मुड़ें";
      } else if (turnAngle < -15) {
        maneuver = "SLIGHT_LEFT";
        messageEn = "Keep slightly left";
        messageKn = "ಸ್ವಲ್ಪ ಎಡಕ್ಕೆ ಹೋಗಿ";
        messageHi = "थोड़ा बाएं रहें";
      } else if (turnAngle > 120) {
        maneuver = "SHARP_RIGHT";
        messageEn = "Take a sharp right";
        messageKn = "ತೀವ್ರ ಬಲಕ್ಕೆ ತಿರುಗಿ";
        messageHi = "तेज दाएं मुड़ें";
      } else if (turnAngle > 45) {
        maneuver = "TURN_RIGHT";
        messageEn = "Turn right";
        messageKn = "ಬಲಕ್ಕೆ ತಿರುಗಿ";
        messageHi = "दाएं मुड़ें";
      } else if (turnAngle > 15) {
        maneuver = "SLIGHT_RIGHT";
        messageEn = "Keep slightly right";
        messageKn = "ಸ್ವಲ್ಪ ಬಲಕ್ಕೆ ಹೋಗಿ";
        messageHi = "थोड़ा दाएं रहें";
      } else {
        continue;
      }

      const message =
        language === "kn"
          ? messageKn
          : language === "hi"
            ? messageHi
            : messageEn;

      instructions.push({
        id: instructions.length,
        maneuver,
        message,
        distanceToNext: 0,
        point: coordinates[i],
        cumulativeDistance: Math.round(cumulativeDistance * 1000),
      });

      if (instructions.length > 1) {
        instructions[instructions.length - 2].distanceToNext =
          instructions[instructions.length - 1].cumulativeDistance -
          instructions[instructions.length - 2].cumulativeDistance;
      }
    }
  }

  // End instruction
  const totalDistance =
    cumulativeDistance +
    calculateDistance(
      coordinates[coordinates.length - 2][1],
      coordinates[coordinates.length - 2][0],
      coordinates[coordinates.length - 1][1],
      coordinates[coordinates.length - 1][0],
    );

  const arriveMsg =
    language === "kn"
      ? `${homeBaseName} ತಲುಪಿದ್ದೀರಿ`
      : language === "hi"
        ? `${homeBaseName} पहुंच गए`
        : `You have arrived at ${homeBaseName}`;

  instructions.push({
    id: instructions.length,
    maneuver: "ARRIVE",
    message: arriveMsg,
    distanceToNext: 0,
    point: coordinates[coordinates.length - 1],
    cumulativeDistance: Math.round(totalDistance * 1000),
  });

  if (instructions.length > 1) {
    instructions[instructions.length - 2].distanceToNext =
      instructions[instructions.length - 1].cumulativeDistance -
      instructions[instructions.length - 2].cumulativeDistance;
  }

  return instructions;
};

// Format duration from seconds
const formatDuration = (seconds) => {
  if (!seconds || seconds < 60) return "< 1 min";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
};

// Format distance
const formatDistance = (meters) => {
  if (!meters) return "";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
};

// Trail point structure: { lat, lng, timestamp, accuracy }
// Load trail from localStorage
const loadTrailFromStorage = () => {
  try {
    const saved = localStorage.getItem(TRAIL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn("Failed to load trail history:", err);
  }
  return [];
};

// Save trail to localStorage
const saveTrailToStorage = (trail) => {
  try {
    localStorage.setItem(TRAIL_STORAGE_KEY, JSON.stringify(trail));
  } catch (err) {
    console.warn("Failed to save trail history:", err);
  }
};

// Clear trail from localStorage
const clearTrailFromStorage = () => {
  try {
    localStorage.removeItem(TRAIL_STORAGE_KEY);
  } catch (err) {
    console.warn("Failed to clear trail history:", err);
  }
};

export default function FindMyWay() {
  const { t, language } = useLanguage();

  // State management
  const [homeBase, setHomeBase] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("idle");
  const [routeData, setRouteData] = useState(null);
  const [routeStatus, setRouteStatus] = useState("idle");
  const [showPresets, setShowPresets] = useState(false);
  const [customLocation, setCustomLocation] = useState({
    name: "",
    lat: "",
    lng: "",
  });
  const [activeTab, setActiveTab] = useState("set");

  // Navigation state
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentInstruction, setCurrentInstruction] = useState(null);
  const [nextInstruction, setNextInstruction] = useState(null);
  const [distanceToNextTurn, setDistanceToNextTurn] = useState(null);
  const [distanceToDestination, setDistanceToDestination] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [lastSpokenInstruction, setLastSpokenInstruction] = useState(null);

  // Trail tracking state (offline support)
  const [trailHistory, setTrailHistory] = useState([]);
  const [isTrackingTrail, setIsTrackingTrail] = useState(false);
  const [showTrailCanvas, setShowTrailCanvas] = useState(false);
  const [mapLoadFailed, setMapLoadFailed] = useState(false);
  const [showBacktrackMode, setShowBacktrackMode] = useState(false);

  // Map refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const homeMarkerRef = useRef(null);
  const watchIdRef = useRef(null);
  const instructionsRef = useRef([]);

  // Trail tracking refs
  const canvasRef = useRef(null);
  const trailWatchIdRef = useRef(null);
  const trailSaveIntervalRef = useRef(null);
  const lastTrailPointRef = useRef(null);

  // Load saved home base and trail from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HOME_BASE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.lat && parsed.lng && parsed.name) {
          setHomeBase(parsed);
          setActiveTab("navigate");
        }
      }
    } catch (err) {
      console.warn("Failed to load saved home base:", err);
    }

    // Load saved trail history
    const savedTrail = loadTrailFromStorage();
    if (savedTrail.length > 0) {
      setTrailHistory(savedTrail);
      lastTrailPointRef.current = savedTrail[savedTrail.length - 1];
    }
  }, []);

  // Stop navigation
  const stopNavigation = useCallback(() => {
    setIsNavigating(false);
    setCurrentInstruction(null);
    setNextInstruction(null);
    setDistanceToNextTurn(null);
    setDistanceToDestination(null);
    setLastSpokenInstruction(null);

    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    window.speechSynthesis?.cancel();
  }, []);

  // Save home base to localStorage
  const saveHomeBase = useCallback(
    (location) => {
      setHomeBase(location);
      localStorage.setItem(HOME_BASE_STORAGE_KEY, JSON.stringify(location));
      setActiveTab("navigate");
      setRouteData(null);
      setRouteStatus("idle");
      stopNavigation();
    },
    [stopNavigation],
  );

  // Clear home base
  const clearHomeBase = useCallback(() => {
    setHomeBase(null);
    localStorage.removeItem(HOME_BASE_STORAGE_KEY);
    setRouteData(null);
    setRouteStatus("idle");
    setActiveTab("set");
    stopNavigation();
  }, [stopNavigation]);

  // Get user's current location (one-time)
  const fetchUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      return;
    }

    setLocationStatus("fetching");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading,
        };
        setUserLocation(loc);
        setLocationStatus("success");
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocationStatus("error");
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      },
    );
  }, []);

  // Auto-fetch location on mount
  useEffect(() => {
    fetchUserLocation();
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (trailWatchIdRef.current) {
        navigator.geolocation.clearWatch(trailWatchIdRef.current);
      }
      if (trailSaveIntervalRef.current) {
        clearInterval(trailSaveIntervalRef.current);
      }
      window.speechSynthesis?.cancel();
    };
  }, [fetchUserLocation]);

  // Trail tracking: Add point to trail if moved enough distance
  const addTrailPoint = useCallback((lat, lng, accuracy) => {
    const newPoint = { lat, lng, accuracy, timestamp: Date.now() };

    // Check if we've moved enough from last point
    if (lastTrailPointRef.current) {
      const dist =
        calculateDistance(
          lastTrailPointRef.current.lat,
          lastTrailPointRef.current.lng,
          lat,
          lng,
        ) * 1000; // Convert to meters

      if (dist < MIN_DISTANCE_FOR_TRAIL) {
        return; // Haven't moved enough
      }
    }

    lastTrailPointRef.current = newPoint;
    setTrailHistory((prev) => {
      const updated = [...prev, newPoint];
      // Keep last 500 points max (about 8+ hours at 60s intervals)
      if (updated.length > 500) {
        return updated.slice(-500);
      }
      return updated;
    });
  }, []);

  // Start trail tracking
  const startTrailTracking = useCallback(() => {
    if (!navigator.geolocation) return;

    setIsTrackingTrail(true);

    // Watch position for real-time trail updates
    trailWatchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        addTrailPoint(
          position.coords.latitude,
          position.coords.longitude,
          position.coords.accuracy,
        );
      },
      (error) => {
        console.error("Trail tracking error:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 10000,
      },
    );

    // Save trail to localStorage every 60 seconds
    trailSaveIntervalRef.current = setInterval(() => {
      setTrailHistory((current) => {
        saveTrailToStorage(current);
        return current;
      });
    }, TRAIL_SAVE_INTERVAL);
  }, [addTrailPoint]);

  // Stop trail tracking
  const stopTrailTracking = useCallback(() => {
    setIsTrackingTrail(false);

    if (trailWatchIdRef.current) {
      navigator.geolocation.clearWatch(trailWatchIdRef.current);
      trailWatchIdRef.current = null;
    }

    if (trailSaveIntervalRef.current) {
      clearInterval(trailSaveIntervalRef.current);
      trailSaveIntervalRef.current = null;
    }

    // Save current trail state
    setTrailHistory((current) => {
      saveTrailToStorage(current);
      return current;
    });
  }, []);

  // Clear trail history
  const clearTrailHistory = useCallback(() => {
    setTrailHistory([]);
    lastTrailPointRef.current = null;
    clearTrailFromStorage();
  }, []);

  // Draw trail on canvas (offline fallback)
  const drawTrailOnCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || trailHistory.length < 2) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw grid background
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let i = 0; i < height; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }

    // Calculate bounds
    const lats = trailHistory.map((p) => p.lat);
    const lngs = trailHistory.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Add padding
    const latPadding = (maxLat - minLat) * 0.1 || 0.001;
    const lngPadding = (maxLng - minLng) * 0.1 || 0.001;

    const latRange = maxLat - minLat + latPadding * 2;
    const lngRange = maxLng - minLng + lngPadding * 2;

    // Convert geo to canvas coords
    const toCanvasX = (lng) =>
      ((lng - minLng + lngPadding) / lngRange) * (width - 40) + 20;
    const toCanvasY = (lat) =>
      height - ((lat - minLat + latPadding) / latRange) * (height - 40) - 20;

    // Draw trail line
    ctx.beginPath();
    ctx.strokeStyle = "#8B5CF6";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    trailHistory.forEach((point, i) => {
      const x = toCanvasX(point.lng);
      const y = toCanvasY(point.lat);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw start point (green)
    const startPoint = trailHistory[0];
    ctx.beginPath();
    ctx.fillStyle = "#10B981";
    ctx.arc(
      toCanvasX(startPoint.lng),
      toCanvasY(startPoint.lat),
      10,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("S", toCanvasX(startPoint.lng), toCanvasY(startPoint.lat));

    // Draw end point (current location - blue)
    const endPoint = trailHistory[trailHistory.length - 1];
    ctx.beginPath();
    ctx.fillStyle = "#3B82F6";
    ctx.arc(
      toCanvasX(endPoint.lng),
      toCanvasY(endPoint.lat),
      10,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.fillText("●", toCanvasX(endPoint.lng), toCanvasY(endPoint.lat));

    // Draw home base if set (red)
    if (homeBase) {
      const hx = toCanvasX(homeBase.lng);
      const hy = toCanvasY(homeBase.lat);
      // Check if home is within bounds
      if (hx >= 0 && hx <= width && hy >= 0 && hy <= height) {
        ctx.beginPath();
        ctx.fillStyle = "#DC2626";
        ctx.arc(hx, hy, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "white";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText("H", hx, hy);
      }
    }

    // Draw legend
    ctx.fillStyle = "#374151";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("S = Start  ● = You  H = Home", 10, height - 10);

    // Draw distance info
    if (trailHistory.length >= 2) {
      let totalDist = 0;
      for (let i = 1; i < trailHistory.length; i++) {
        totalDist += calculateDistance(
          trailHistory[i - 1].lat,
          trailHistory[i - 1].lng,
          trailHistory[i].lat,
          trailHistory[i].lng,
        );
      }
      ctx.textAlign = "right";
      ctx.fillText(
        `Trail: ${formatDistance(totalDist * 1000)}`,
        width - 10,
        height - 10,
      );
    }
  }, [trailHistory, homeBase]);

  // Redraw canvas when trail or visibility changes
  useEffect(() => {
    if (showTrailCanvas) {
      drawTrailOnCanvas();
    }
  }, [showTrailCanvas, trailHistory, drawTrailOnCanvas]);

  // Find closest instruction to current position
  const findCurrentInstruction = useCallback(
    (userLat, userLng, instructions) => {
      if (!instructions || instructions.length === 0)
        return { current: null, next: null, distanceToNext: null };

      let closestIdx = 0;
      let closestDist = Infinity;

      for (let i = 0; i < instructions.length; i++) {
        const inst = instructions[i];
        if (!inst.point) continue;

        const [instLng, instLat] = inst.point;
        const dist =
          calculateDistance(userLat, userLng, instLat, instLng) * 1000;

        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = i;
        }
      }

      if (closestDist < 20 && closestIdx < instructions.length - 1) {
        closestIdx++;
      }

      const current = instructions[closestIdx];
      const next =
        closestIdx < instructions.length - 1
          ? instructions[closestIdx + 1]
          : null;

      let distanceToNext = null;
      if (current?.point) {
        const [instLng, instLat] = current.point;
        distanceToNext = Math.round(
          calculateDistance(userLat, userLng, instLat, instLng) * 1000,
        );
      }

      return { current, next, distanceToNext };
    },
    [],
  );

  // Start continuous navigation with GPS tracking
  const startNavigation = useCallback(() => {
    if (!routeData || !homeBase) return;

    setIsNavigating(true);

    const instructions =
      routeData.instructions?.length > 0
        ? routeData.instructions
        : generateTurnInstructions(
            routeData.coordinates,
            homeBase.name,
            language,
          );

    instructionsRef.current = instructions;

    if (instructions.length > 0) {
      setCurrentInstruction(instructions[0]);
      setNextInstruction(instructions.length > 1 ? instructions[1] : null);

      if (voiceEnabled) {
        speakText(instructions[0].message, language);
        setLastSpokenInstruction(instructions[0].id);
      }
    }

    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading,
          };
          setUserLocation(loc);

          const { current, next, distanceToNext } = findCurrentInstruction(
            loc.lat,
            loc.lng,
            instructionsRef.current,
          );

          if (current) {
            setCurrentInstruction(current);
            setNextInstruction(next);
            setDistanceToNextTurn(distanceToNext);

            if (homeBase) {
              const distToDest =
                calculateDistance(
                  loc.lat,
                  loc.lng,
                  homeBase.lat,
                  homeBase.lng,
                ) * 1000;
              setDistanceToDestination(Math.round(distToDest));

              if (distToDest < 15) {
                const arriveMsg =
                  language === "kn"
                    ? "ನೀವು ತಲುಪಿದ್ದೀರಿ!"
                    : language === "hi"
                      ? "आप पहुंच गए!"
                      : "You have arrived!";
                if (voiceEnabled) speakText(arriveMsg, language);
                stopNavigation();
                return;
              }
            }

            if (voiceEnabled && current.id !== lastSpokenInstruction) {
              if (distanceToNext !== null && distanceToNext < 50) {
                const distancePhrase =
                  language === "kn"
                    ? `${distanceToNext} ಮೀಟರ್‌ನಲ್ಲಿ, `
                    : language === "hi"
                      ? `${distanceToNext} मीटर में, `
                      : `In ${distanceToNext} meters, `;
                speakText(distancePhrase + current.message, language);
                setLastSpokenInstruction(current.id);
              }
            }
          }
        },
        (error) => {
          console.error("Watch position error:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 2000,
        },
      );
    }
  }, [
    routeData,
    homeBase,
    language,
    voiceEnabled,
    findCurrentInstruction,
    lastSpokenInstruction,
    stopNavigation,
  ]);

  // Set current location as home base
  const setCurrentLocationAsHome = useCallback(() => {
    if (!userLocation) return;
    saveHomeBase({
      id: "custom-current",
      name: t("findMyWayCurrentLocation") || "My Current Location",
      name_kn: "ನನ್ನ ಪ್ರಸ್ತುತ ಸ್ಥಳ",
      lat: userLocation.lat,
      lng: userLocation.lng,
      type: "custom",
      icon: Home,
    });
  }, [userLocation, saveHomeBase, t]);

  // Set preset location as home base
  const setPresetAsHome = useCallback(
    (preset) => {
      saveHomeBase(preset);
      setShowPresets(false);
    },
    [saveHomeBase],
  );

  // Set custom location as home base
  const setCustomAsHome = useCallback(() => {
    const lat = parseFloat(customLocation.lat);
    const lng = parseFloat(customLocation.lng);
    if (!customLocation.name || isNaN(lat) || isNaN(lng)) return;

    saveHomeBase({
      id: "custom-manual",
      name: customLocation.name,
      name_kn: customLocation.name,
      lat,
      lng,
      type: "custom",
      icon: MapPin,
    });
    setCustomLocation({ name: "", lat: "", lng: "" });
  }, [customLocation, saveHomeBase]);

  // Fetch route to home base
  const navigateToHome = useCallback(async () => {
    if (!userLocation || !homeBase) return;

    setRouteStatus("fetching");
    setRouteData(null);
    stopNavigation();

    try {
      const result = await fetchPedestrianRoute(
        userLocation.lng,
        userLocation.lat,
        homeBase.lng,
        homeBase.lat,
      );

      const distance =
        result.summary?.lengthInMeters ||
        calculateDistance(
          userLocation.lat,
          userLocation.lng,
          homeBase.lat,
          homeBase.lng,
        ) * 1000;
      const duration =
        result.summary?.travelTimeInSeconds ||
        Math.round((distance / 1000) * 12 * 60);

      const instructions =
        result.instructions?.length > 0
          ? result.instructions
          : generateTurnInstructions(
              result.coordinates,
              homeBase.name,
              language,
            );

      setRouteData({
        coordinates: result.coordinates,
        distance,
        duration,
        instructions,
      });
      setRouteStatus("success");
    } catch (error) {
      console.error("Failed to fetch route:", error);
      setRouteStatus("error");
    }
  }, [userLocation, homeBase, language, stopNavigation]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const style = browserTomTomKey
      ? buildTomTomRasterStyle(browserTomTomKey)
      : OSM_STYLE;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style,
      center: [76.6551, 12.3051],
      zoom: 14,
      attributionControl: true,
    });

    // Track map load errors for offline fallback
    map.on("error", (e) => {
      console.warn("Map error:", e);
      if (
        e.error?.message?.includes("Failed to fetch") ||
        e.error?.message?.includes("NetworkError") ||
        e.sourceId
      ) {
        setMapLoadFailed(true);
      }
    });

    map.on("load", () => {
      setMapLoadFailed(false);
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map markers and route
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Update user marker
    if (userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat]);
      } else {
        const el = document.createElement("div");
        el.innerHTML = `
          <div style="width: 24px; height: 24px; background: #3B82F6; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
            <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
          </div>
        `;
        userMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([userLocation.lng, userLocation.lat])
          .addTo(map);
      }

      if (isNavigating) {
        map.easeTo({ center: [userLocation.lng, userLocation.lat], zoom: 17 });
      }
    }

    // Update home marker
    if (homeBase) {
      if (homeMarkerRef.current) {
        homeMarkerRef.current.setLngLat([homeBase.lng, homeBase.lat]);
      } else {
        const el = document.createElement("div");
        el.innerHTML = `
          <div style="width: 32px; height: 32px; background: #059669; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
        `;
        homeMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([homeBase.lng, homeBase.lat])
          .addTo(map);
      }
    } else if (homeMarkerRef.current) {
      homeMarkerRef.current.remove();
      homeMarkerRef.current = null;
    }

    // Update route line
    if (routeData?.coordinates?.length) {
      const routeSource = map.getSource("navigation-route");
      const geojson = {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: routeData.coordinates,
        },
      };

      if (routeSource) {
        routeSource.setData(geojson);
      } else {
        map.addSource("navigation-route", { type: "geojson", data: geojson });
        map.addLayer({
          id: "navigation-route-glow",
          type: "line",
          source: "navigation-route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#10B981",
            "line-width": 10,
            "line-opacity": 0.3,
            "line-blur": 3,
          },
        });
        map.addLayer({
          id: "navigation-route-line",
          type: "line",
          source: "navigation-route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#059669",
            "line-width": 5,
            "line-opacity": 0.9,
          },
        });
      }

      if (!isNavigating) {
        const bounds = routeData.coordinates.reduce(
          (bounds, coord) => bounds.extend(coord),
          new maplibregl.LngLatBounds(
            routeData.coordinates[0],
            routeData.coordinates[0],
          ),
        );
        map.fitBounds(bounds, { padding: 60, maxZoom: 16 });
      }
    } else {
      if (map.getSource("navigation-route")) {
        if (map.getLayer("navigation-route-glow"))
          map.removeLayer("navigation-route-glow");
        if (map.getLayer("navigation-route-line"))
          map.removeLayer("navigation-route-line");
        map.removeSource("navigation-route");
      }

      if (userLocation && homeBase && !isNavigating) {
        const bounds = new maplibregl.LngLatBounds()
          .extend([userLocation.lng, userLocation.lat])
          .extend([homeBase.lng, homeBase.lat]);
        map.fitBounds(bounds, { padding: 60, maxZoom: 15 });
      } else if (userLocation) {
        map.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 15 });
      }
    }
  }, [userLocation, homeBase, routeData, isNavigating]);

  // Get localized preset name
  const getPresetName = useCallback(
    (preset) => {
      return language === "kn" ? preset.name_kn : preset.name;
    },
    [language],
  );

  // Get home base display name
  const homeBaseName = useMemo(() => {
    if (!homeBase) return "";
    return language === "kn" && homeBase.name_kn
      ? homeBase.name_kn
      : homeBase.name;
  }, [homeBase, language]);

  const CurrentManeuverIcon = currentInstruction
    ? getManeuverIcon(currentInstruction.maneuver)
    : ArrowUp;

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-amber-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#800000] via-[#991b1b] to-[#B45309] text-white py-8 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-full">
              <Compass className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">
              {t("findMyWayTitle") || "Find My Way"}
            </h1>
          </div>
          <p className="text-white/90 max-w-2xl mx-auto">
            {t("findMyWaySubtitle") ||
              "Lost in the festival crowd? Set a safe meeting point and get guided back with one tap."}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-[400px_1fr] gap-6">
          {/* Control Panel */}
          <div className="space-y-4">
            {/* Active Navigation Panel */}
            {isNavigating && currentInstruction && (
              <Card className="border-t-4 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-4 bg-green-600 rounded-xl text-white">
                      <CurrentManeuverIcon className="w-10 h-10" />
                    </div>
                    <div className="flex-1">
                      <p className="text-2xl font-bold text-gray-900">
                        {distanceToNextTurn !== null
                          ? formatDistance(distanceToNextTurn)
                          : "—"}
                      </p>
                      <p className="text-lg font-medium text-gray-700">
                        {currentInstruction.message}
                      </p>
                    </div>
                  </div>

                  {nextInstruction && (
                    <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg mb-4">
                      <div className="p-2 bg-gray-200 rounded-lg">
                        {React.createElement(
                          getManeuverIcon(nextInstruction.maneuver),
                          { className: "w-5 h-5 text-gray-600" },
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                          {language === "kn"
                            ? "ನಂತರ"
                            : language === "hi"
                              ? "फिर"
                              : "Then"}
                        </p>
                        <p className="text-sm font-medium text-gray-700">
                          {nextInstruction.message}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm border-t pt-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-green-600" />
                      <span className="text-gray-600">
                        {language === "kn"
                          ? "ಗಮ್ಯಸ್ಥಾನಕ್ಕೆ"
                          : language === "hi"
                            ? "गंतव्य तक"
                            : "To destination"}
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {distanceToDestination !== null
                        ? formatDistance(distanceToDestination)
                        : "—"}
                    </span>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setVoiceEnabled(!voiceEnabled)}
                      className={`flex-1 ${voiceEnabled ? "bg-green-100 border-green-300" : "bg-gray-100"}`}
                    >
                      {voiceEnabled ? (
                        <Volume2 className="w-4 h-4 mr-2" />
                      ) : (
                        <VolumeX className="w-4 h-4 mr-2" />
                      )}
                      {voiceEnabled
                        ? language === "kn"
                          ? "ಧ್ವನಿ ಆನ್"
                          : language === "hi"
                            ? "आवाज़ चालू"
                            : "Voice On"
                        : language === "kn"
                          ? "ಧ್ವನಿ ಆಫ್"
                          : language === "hi"
                            ? "आवाज़ बंद"
                            : "Voice Off"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={stopNavigation}
                      className="flex-1 bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      {language === "kn"
                        ? "ನಿಲ್ಲಿಸಿ"
                        : language === "hi"
                          ? "रुकें"
                          : "Stop"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Location Status Card */}
            <Card className="border-t-4 border-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-500" />
                    {t("findMyWayYourLocation") || "Your Location"}
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={fetchUserLocation}
                    disabled={locationStatus === "fetching"}
                    className="text-xs"
                  >
                    {locationStatus === "fetching" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {locationStatus === "success" && userLocation && (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-2 rounded-lg">
                    <Check className="w-4 h-4" />
                    <span>
                      {t("findMyWayLocationFound") || "Location detected"}
                    </span>
                    <Badge className="ml-auto text-xs">
                      ±{Math.round(userLocation.accuracy || 10)}m
                    </Badge>
                  </div>
                )}

                {locationStatus === "fetching" && (
                  <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 p-2 rounded-lg">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>
                      {t("findMyWayFetchingLocation") ||
                        "Getting your location..."}
                    </span>
                  </div>
                )}

                {locationStatus === "error" && (
                  <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 p-2 rounded-lg">
                    <AlertTriangle className="w-4 h-4" />
                    <span>
                      {t("findMyWayLocationError") ||
                        "Unable to get location. Enable GPS and try again."}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabs */}
            {!isNavigating && (
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab("set")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "set"
                      ? "bg-white text-[#800000] shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {t("findMyWaySetHomeTab") || "Set Home Base"}
                </button>
                <button
                  onClick={() => setActiveTab("navigate")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "navigate"
                      ? "bg-white text-[#800000] shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {t("findMyWayNavigateTab") || "Navigate"}
                </button>
              </div>
            )}

            {/* Set Home Base Panel */}
            {activeTab === "set" && !isNavigating && (
              <Card className="border-t-4 border-[#DAA520]">
                <CardContent className="p-4 space-y-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Home className="w-5 h-5 text-[#DAA520]" />
                    {t("findMyWaySetHomeBase") || "Set Your Home Base"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t("findMyWaySetHomeDesc") ||
                      "Choose a safe meeting point like your hotel, parked vehicle, or a police outpost."}
                  </p>

                  <Button
                    className="w-full justify-start gap-3 bg-blue-600 hover:bg-blue-700"
                    onClick={setCurrentLocationAsHome}
                    disabled={!userLocation}
                  >
                    <MapPin className="w-5 h-5" />
                    {t("findMyWayUseCurrentLocation") ||
                      "Use My Current Location"}
                  </Button>

                  <div>
                    <button
                      onClick={() => setShowPresets(!showPresets)}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <span className="font-medium text-gray-700">
                        {t("findMyWayPresetLocations") ||
                          "Choose Preset Location"}
                      </span>
                      <span
                        className={`transform transition-transform ${showPresets ? "rotate-180" : ""}`}
                      >
                        ▼
                      </span>
                    </button>

                    {showPresets && (
                      <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                        {PRESET_LOCATIONS.map((preset) => (
                          <button
                            key={preset.id}
                            onClick={() => setPresetAsHome(preset)}
                            className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-[#DAA520] hover:bg-amber-50 transition-colors text-left"
                          >
                            <preset.icon className="w-5 h-5 text-[#800000]" />
                            <div>
                              <p className="font-medium text-gray-800">
                                {getPresetName(preset)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {preset.type}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <p className="text-sm font-medium text-gray-700">
                      {t("findMyWayCustomLocation") ||
                        "Or enter custom coordinates:"}
                    </p>
                    <input
                      type="text"
                      placeholder={
                        t("findMyWayCustomName") ||
                        "Location name (e.g., My Hotel)"
                      }
                      value={customLocation.name}
                      onChange={(e) =>
                        setCustomLocation({
                          ...customLocation,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#DAA520] focus:border-transparent"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        step="any"
                        placeholder={t("findMyWayLatitude") || "Latitude"}
                        value={customLocation.lat}
                        onChange={(e) =>
                          setCustomLocation({
                            ...customLocation,
                            lat: e.target.value,
                          })
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#DAA520] focus:border-transparent"
                      />
                      <input
                        type="number"
                        step="any"
                        placeholder={t("findMyWayLongitude") || "Longitude"}
                        value={customLocation.lng}
                        onChange={(e) =>
                          setCustomLocation({
                            ...customLocation,
                            lng: e.target.value,
                          })
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#DAA520] focus:border-transparent"
                      />
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={setCustomAsHome}
                      disabled={
                        !customLocation.name ||
                        !customLocation.lat ||
                        !customLocation.lng
                      }
                    >
                      {t("findMyWaySaveCustom") || "Save Custom Location"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigate Panel */}
            {activeTab === "navigate" && !isNavigating && (
              <Card className="border-t-4 border-green-500">
                <CardContent className="p-4 space-y-4">
                  {homeBase ? (
                    <>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-600 rounded-full">
                              <Home className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-xs text-green-600 font-medium uppercase tracking-wide">
                                {t("findMyWayHomeBaseLabel") || "Home Base"}
                              </p>
                              <p className="font-semibold text-gray-900">
                                {homeBaseName}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={clearHomeBase}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <Button
                        className="w-full py-6 text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
                        onClick={navigateToHome}
                        disabled={!userLocation || routeStatus === "fetching"}
                      >
                        {routeStatus === "fetching" ? (
                          <>
                            <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                            {t("findMyWayCalculating") ||
                              "Calculating route..."}
                          </>
                        ) : (
                          <>
                            <Navigation className="w-6 h-6 mr-2" />
                            {t("findMyWayTakeMeBack") || "Take Me Back"}
                          </>
                        )}
                      </Button>

                      {!userLocation && (
                        <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg text-center">
                          {t("findMyWayEnableLocation") ||
                            "Enable location to get directions"}
                        </p>
                      )}

                      {routeStatus === "success" && routeData && (
                        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                            <Route className="w-5 h-5 text-green-600" />
                            {t("findMyWayRouteReady") || "Walking Route Ready"}
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="text-xs text-gray-500">
                                  {t("distance") || "Distance"}
                                </p>
                                <p className="font-semibold text-gray-900">
                                  {formatDistance(routeData.distance)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="text-xs text-gray-500">
                                  {t("duration") || "Duration"}
                                </p>
                                <p className="font-semibold text-gray-900">
                                  {formatDuration(routeData.duration)}
                                </p>
                              </div>
                            </div>
                          </div>

                          <Button
                            className="w-full mt-3 bg-blue-600 hover:bg-blue-700"
                            onClick={startNavigation}
                          >
                            <Play className="w-5 h-5 mr-2" />
                            {language === "kn"
                              ? "ಮಾರ್ಗದರ್ಶನ ಪ್ರಾರಂಭಿಸಿ"
                              : language === "hi"
                                ? "नेविगेशन शुरू करें"
                                : "Start Turn-by-Turn"}
                          </Button>

                          <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-sm text-gray-600">
                              {language === "kn"
                                ? "ಧ್ವನಿ ಮಾರ್ಗದರ್ಶನ"
                                : language === "hi"
                                  ? "आवाज़ मार्गदर्शन"
                                  : "Voice Guidance"}
                            </span>
                            <button
                              onClick={() => setVoiceEnabled(!voiceEnabled)}
                              className={`p-2 rounded-full transition-colors ${voiceEnabled ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}
                            >
                              {voiceEnabled ? (
                                <Volume2 className="w-5 h-5" />
                              ) : (
                                <VolumeX className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {routeStatus === "error" && (
                        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 p-3 rounded-lg">
                          <AlertTriangle className="w-4 h-4" />
                          <span>
                            {t("findMyWayRouteError") ||
                              "Unable to calculate route. Please try again."}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Home className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-600 mb-4">
                        {t("findMyWayNoHomeSet") || "No home base set yet"}
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab("set")}
                      >
                        {t("findMyWaySetHomeNow") || "Set Home Base Now"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Trail Tracking Card (Offline Support) */}
            <Card
              className={`border-t-4 ${isTrackingTrail ? "border-purple-500 bg-purple-50" : "border-gray-300"}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <History className="w-5 h-5 text-purple-500" />
                    {language === "kn"
                      ? "ಪಥ ಟ್ರ್ಯಾಕರ್"
                      : language === "hi"
                        ? "पथ ट्रैकर"
                        : "Trail Tracker"}
                    {mapLoadFailed && (
                      <Badge className="bg-orange-100 text-orange-700 text-xs ml-2">
                        <WifiOff className="w-3 h-3 mr-1" />
                        {language === "kn"
                          ? "ಆಫ್‌ಲೈನ್"
                          : language === "hi"
                            ? "ऑफ़लाइन"
                            : "Offline"}
                      </Badge>
                    )}
                  </h3>
                </div>

                <p className="text-xs text-gray-500 mb-3">
                  {language === "kn"
                    ? "ನಿಮ್ಮ ಚಲನೆಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ. ಮ್ಯಾಪ್ ಲೋಡ್ ಆಗದಿದ್ದರೂ ಕೆಲಸ ಮಾಡುತ್ತದೆ!"
                    : language === "hi"
                      ? "अपनी चाल को ट्रैक करें। मैप लोड न होने पर भी काम करता है!"
                      : "Track your movement. Works even if map fails to load!"}
                </p>

                <div className="flex gap-2 mb-3">
                  {!isTrackingTrail ? (
                    <Button
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                      onClick={startTrailTracking}
                    >
                      <Radio className="w-4 h-4 mr-2" />
                      {language === "kn"
                        ? "ಟ್ರ್ಯಾಕಿಂಗ್ ಪ್ರಾರಂಭಿಸಿ"
                        : language === "hi"
                          ? "ट्रैकिंग शुरू करें"
                          : "Start Tracking"}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="flex-1 border-purple-300 text-purple-700"
                      onClick={stopTrailTracking}
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      {language === "kn"
                        ? "ಟ್ರ್ಯಾಕಿಂಗ್ ನಿಲ್ಲಿಸಿ"
                        : language === "hi"
                          ? "ट्रैकिंग रोकें"
                          : "Stop Tracking"}
                    </Button>
                  )}
                </div>

                {trailHistory.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {language === "kn"
                          ? "ದಾಖಲಾದ ಬಿಂದುಗಳು"
                          : language === "hi"
                            ? "रिकॉर्ड किए गए बिंदु"
                            : "Points recorded"}
                      </span>
                      <Badge className="bg-purple-100 text-purple-700">
                        {trailHistory.length}
                      </Badge>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowTrailCanvas(!showTrailCanvas)}
                      >
                        {showTrailCanvas ? (
                          <EyeOff className="w-4 h-4 mr-1" />
                        ) : (
                          <Eye className="w-4 h-4 mr-1" />
                        )}
                        {showTrailCanvas
                          ? language === "kn"
                            ? "ಮರೆಮಾಡಿ"
                            : language === "hi"
                              ? "छुपाएं"
                              : "Hide Trail"
                          : language === "kn"
                            ? "ಪಥ ತೋರಿಸಿ"
                            : language === "hi"
                              ? "पथ दिखाएं"
                              : "Show Trail"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={clearTrailHistory}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {trailHistory.length >= 2 && (
                      <Button
                        size="sm"
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                        onClick={() => setShowBacktrackMode(!showBacktrackMode)}
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        {language === "kn"
                          ? "ಹಿಂತಿರುಗಿ ಹೋಗಿ"
                          : language === "hi"
                            ? "वापस जाएं"
                            : "Backtrack My Path"}
                      </Button>
                    )}
                  </div>
                )}

                {isTrackingTrail && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-purple-600 bg-purple-100 p-2 rounded-lg">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                    {language === "kn"
                      ? "ಪ್ರತಿ 60 ಸೆಕೆಂಡಿಗೆ ಸೇವ್ ಆಗುತ್ತಿದೆ..."
                      : language === "hi"
                        ? "हर 60 सेकंड में सेव हो रहा है..."
                        : "Saving every 60 seconds..."}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Safety Tips */}
            {!isNavigating && (
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-amber-800 flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5" />
                    {t("findMyWaySafetyTips") || "Safety Tips"}
                  </h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>
                      •{" "}
                      {t("findMyWayTip1") ||
                        "Set your home base before entering crowded areas"}
                    </li>
                    <li>
                      •{" "}
                      {t("findMyWayTip2") ||
                        "Keep your phone charged and GPS enabled"}
                    </li>
                    <li>
                      •{" "}
                      {t("findMyWayTip3") ||
                        "Note nearby police booths along your route"}
                    </li>
                    <li>
                      • {t("findMyWayTip4") || "Travel in groups when possible"}
                    </li>
                    <li>
                      •{" "}
                      {language === "kn"
                        ? "ಆಫ್‌ಲೈನ್ ಬ್ಯಾಕ್‌ಟ್ರ್ಯಾಕ್‌ಗಾಗಿ ಟ್ರೇಲ್ ಟ್ರ್ಯಾಕಿಂಗ್ ಆನ್ ಮಾಡಿ"
                        : language === "hi"
                          ? "ऑफ़लाइन बैकट्रैक के लिए ट्रेल ट्रैकिंग चालू करें"
                          : "Turn on Trail Tracking for offline backtrack"}
                    </li>
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Map Container with Canvas Overlay */}
          <Card className="overflow-hidden relative">
            <div
              ref={mapContainerRef}
              className="w-full h-[500px] lg:h-[700px]"
            />

            {/* Canvas overlay for offline trail display */}
            {showTrailCanvas && trailHistory.length >= 2 && (
              <div className="absolute inset-0 bg-white/95 z-10 flex flex-col">
                <div className="bg-purple-600 text-white px-4 py-2 flex items-center justify-between">
                  <span className="font-semibold flex items-center gap-2">
                    <History className="w-5 h-5" />
                    {language === "kn"
                      ? "ನಿಮ್ಮ ಪಥ (ಆಫ್‌ಲೈನ್ ವೀಕ್ಷಣೆ)"
                      : language === "hi"
                        ? "आपका पथ (ऑफ़लाइन दृश्य)"
                        : "Your Trail (Offline View)"}
                  </span>
                  <button
                    onClick={() => setShowTrailCanvas(false)}
                    className="p-1 hover:bg-purple-700 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={500}
                  className="flex-1 w-full"
                  style={{ maxHeight: "calc(100% - 40px)" }}
                />
              </div>
            )}

            {/* Backtrack mode overlay */}
            {showBacktrackMode && trailHistory.length >= 2 && (
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur rounded-lg shadow-lg p-4 z-10">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-purple-800 flex items-center gap-2">
                    <Navigation className="w-5 h-5" />
                    {language === "kn"
                      ? "ಬ್ಯಾಕ್‌ಟ್ರ್ಯಾಕ್ ಮೋಡ್"
                      : language === "hi"
                        ? "बैकट्रैक मोड"
                        : "Backtrack Mode"}
                  </h4>
                  <button
                    onClick={() => setShowBacktrackMode(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div className="bg-green-50 p-2 rounded">
                    <p className="text-green-600 text-xs">
                      {language === "kn"
                        ? "ಆರಂಭ ಬಿಂದು"
                        : language === "hi"
                          ? "प्रारंभ बिंदु"
                          : "Start Point"}
                    </p>
                    <p className="font-mono text-xs">
                      {trailHistory[0].lat.toFixed(5)},{" "}
                      {trailHistory[0].lng.toFixed(5)}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-2 rounded">
                    <p className="text-blue-600 text-xs">
                      {language === "kn"
                        ? "ಪ್ರಸ್ತುತ"
                        : language === "hi"
                          ? "वर्तमान"
                          : "Current"}
                    </p>
                    <p className="font-mono text-xs">
                      {trailHistory[trailHistory.length - 1].lat.toFixed(5)},{" "}
                      {trailHistory[trailHistory.length - 1].lng.toFixed(5)}
                    </p>
                  </div>
                </div>

                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-purple-700 text-sm">
                    {language === "kn"
                      ? "↩️ ನಿಮ್ಮ ಆರಂಭ ಬಿಂದುವಿಗೆ ಹಿಂತಿರುಗಲು, ನೇರಳೆ ಮಾರ್ಗವನ್ನು ಹಿಮ್ಮುಖವಾಗಿ ಅನುಸರಿಸಿ"
                      : language === "hi"
                        ? "↩️ अपने शुरुआती बिंदु पर वापस जाने के लिए, बैंगनी पथ को उल्टा अनुसरण करें"
                        : "↩️ To return to your start point, follow the purple trail in reverse"}
                  </p>
                </div>

                <Button
                  className="w-full mt-3"
                  variant="outline"
                  onClick={() => setShowTrailCanvas(true)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {language === "kn"
                    ? "ಪೂರ್ಣ ಪಥ ವೀಕ್ಷಿಸಿ"
                    : language === "hi"
                      ? "पूर्ण पथ देखें"
                      : "View Full Trail Map"}
                </Button>
              </div>
            )}

            {/* Map load failed indicator */}
            {mapLoadFailed && !showTrailCanvas && (
              <div className="absolute top-4 left-4 bg-orange-100 text-orange-800 px-3 py-2 rounded-lg shadow flex items-center gap-2 text-sm z-10">
                <WifiOff className="w-4 h-4" />
                {language === "kn"
                  ? "ಮ್ಯಾಪ್ ಲೋಡ್ ವಿಫಲ - ಟ್ರೇಲ್ ವೀಕ್ಷಣೆ ಬಳಸಿ"
                  : language === "hi"
                    ? "मैप लोड विफल - ट्रेल व्यू का उपयोग करें"
                    : "Map failed - Use Trail View"}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
