import React, { createContext, useContext, useState } from 'react';

export const EVENTS_DATA = [
  {
    id: 1,
    name: "Jumboo Savari",
    name_kn: "ಜಂಬೂ ಸವಾರಿ",
    lat: 12.3051,
    lng: 76.6551,
    description: "The grand elephant procession marking the finale of Dasara.",
    description_kn: "ದಸರಾ ಹಬ್ಬದ ಅಂತ್ಯವನ್ನು ಗುರುತಿಸುವ ಪ್ರಮುಖ ಆನೆ ಮೆರವಣಿಗೆ.",
    time: "Oct 12, 2:30 PM",
    category: "Parade"
  },
  {
    id: 2,
    name: "Torchlight Parade",
    name_kn: "ಪಂಜಿನ ಕವಾಯತು",
    lat: 12.3225,
    lng: 76.6589,
    description: "A spectacular display of lights and military drills at Bannimantap.",
    description_kn: "ಬನ್ನಿಮಂಟಪದಲ್ಲಿ ದೀಪಗಳು ಮತ್ತು ಸೇನಾ ಕವಾಯತಿನ ಅದ್ಭುತ ಪ್ರದರ್ಶನ.",
    time: "Oct 12, 7:00 PM",
    category: "Parade"
  },
  {
    id: 3,
    name: "Mysore Palace Illumination",
    name_kn: "ಮೈಸೂರು ಅರಮನೆ ದೀಪಾಲಂಕಾರ",
    lat: 12.3052,
    lng: 76.6552,
    description: "The palace lit up with nearly 100,000 bulbs.",
    description_kn: "ಸುಮಾರು ೧ ಲಕ್ಷ ದೀಪಗಳಿಂದ ಬೆಳಗುವ ಅರಮನೆ.",
    time: "Daily, 7:00 PM",
    category: "Sightseeing"
  },
  {
    id: 4,
    name: "Dasara Exhibition",
    name_kn: "ದಸರಾ ವಸ್ತುಪ್ರದರ್ಶನ",
    lat: 12.3020,
    lng: 76.6600,
    description: "Shopping, food, and entertainment stalls opposite the palace.",
    description_kn: "ಅರಮನೆಯ ಎದುರು ಶಾಪಿಂಗ್, ಊಟ ಮತ್ತು ಮನರಂಜನೆ ಮಳಿಗೆಗಳು.",
    time: "Daily, 10:00 AM - 9:00 PM",
    category: "Fair"
  },
  {
    id: 5,
    name: "Flower Show",
    name_kn: "ಫಲಪುಷ್ಪ ಪ್ರದರ್ಶನ",
    lat: 12.3000,
    lng: 76.6700,
    description: "Exotic floral arrangements at Kuppanna Park.",
    description_kn: "ಕುಪ್ಪಣ್ಣ ಪಾರ್ಕ್‌ನಲ್ಲಿ ವಿಲಕ್ಷಣ ಹೂವಿನ ಅಲಂಕಾರಗಳು.",
    time: "Daily, 9:00 AM - 9:00 PM",
    category: "Nature"
  },
  {
    id: 6,
    name: "Yuva Dasara",
    name_kn: "ಯುವ ದಸರಾ",
    lat: 12.3100,
    lng: 76.6300,
    description: "Concerts and youth cultural programs at Maharaja's College Grounds.",
    description_kn: "ಮಹಾರಾಜ ಕಾಲೇಜು ಮೈದಾನದಲ್ಲಿ ಸಂಗೀತ ಮತ್ತು ಯುವ ಸಾಂಸ್ಕೃತಿಕ ಕಾರ್ಯಕ್ರಮಗಳು.",
    time: "Oct 6-10, 6:00 PM",
    category: "Music"
  },
  {
    id: 7,
    name: "Wrestling Tournament",
    name_kn: "ಕುಸ್ತಿ ಪಂದ್ಯಾವಳಿ",
    lat: 12.3080,
    lng: 76.6500,
    description: "Traditional Nada Kusti wrestling matches.",
    description_kn: "ಸಾಂಪ್ರದಾಯಿಕ ನಾಡ ಕುಸ್ತಿ ಪಂದ್ಯಗಳು.",
    time: "Oct 5-9, 4:00 PM",
    category: "Sports"
  },
  {
    id: 8,
    name: "Poets' Conference (Kavi Goshti)",
    name_kn: "ಕವಿ ಗೋಷ್ಠಿ",
    lat: 12.3040,
    lng: 76.6530,
    description: "Gathering of renowned poets and literature lovers.",
    description_kn: "ಪ್ರಖ್ಯಾತ ಕವಿಗಳು ಮತ್ತು ಸಾಹಿತ್ಯ ಪ್ರೇಮಿಗಳ ಸಭೆ.",
    time: "Oct 7, 10:00 AM",
    category: "Culture"
  },
  {
    id: 9,
    name: "Food Mela (Ahaara Mela)",
    name_kn: "ಆಹಾರ ಮೇಳ",
    lat: 12.2990,
    lng: 76.6450,
    description: "Traditional delicacies from across Karnataka.",
    description_kn: "ಕರ್ನಾಟದಾದ್ಯಂತದ ಸಾಂಪ್ರದಾಯಿಕ ಖಾದ್ಯಗಳು.",
    time: "Daily, 11:00 AM - 10:00 PM",
    category: "Food"
  },
  {
    id: 10,
    name: "Cultural Programs at Palace",
    name_kn: "ಅರಮನೆಯಲ್ಲಿ ಸಾಂಸ್ಕೃತಿಕ ಕಾರ್ಯಕ್ರಮಗಳು",
    lat: 12.3051,
    lng: 76.6551,
    description: "Classical music and dance performances in front of the illuminated palace.",
    description_kn: "ದೀಪಾಲಂಕೃತ ಅರಮನೆಯ ಮುಂಭಾಗದಲ್ಲಿ ಶಾಸ್ತ್ರೀಯ ಸಂಗೀತ ಮತ್ತು ನೃತ್ಯ ಪ್ರದರ್ಶನಗಳು.",
    time: "Daily, 6:00 PM",
    category: "Culture"
  }
];

export const TRANSLATIONS = {
  en: {
    title: "Dasara Mitra",
    heroTitle: "Welcome to Mysore Dasara 2025",
    heroSubtitle: "Your Festival Companion – Navigate events, transport, and memories effortlessly.",
    ctaEvents: "Find Nearest Events",
    ctaGallery: "Explore Gallery",
    eventsTitle: "Festival Events Map",
    transportTitle: "Transport Route Planner",
    galleryTitle: "Photo Gallery",
    home: "Home",
    events: "Events",
    transport: "Transport",
    gallery: "Gallery",
    findRoute: "Find Route",
    fromEvent: "From Event",
    toEvent: "To Event",
    calculating: "Calculating...",
    routeDetails: "Route Details",
    footerText: "© 2025 Dasara Mitra. Celebrating the spirit of Mysore.",
    nearest: "Nearest to you",
    chatTitle: "Dasara Helper",
    chatPlaceholder: "Ask about events, routes, or history...",
    send: "Send",
    loading: "Loading...",
    error: "Something went wrong.",
    enableLocation: "Enable location to find events near you!",
    locationDenied: "Location access denied. Showing all events.",
    category: "Category",
    time: "Time",
    directions: "Get Directions",
    distance: "Distance",
    duration: "Duration",
    routeNeedLocation: "Enable location to get directions.",
    routeFetching: "Fetching the best route...",
    routeUnavailable: "Route unavailable right now. Please try again in a moment.",
    routeReady: "Walking route ready",
    clearRoute: "Clear Route"
  },
  kn: {
    title: "ದಸರಾ ಮಿತ್ರ",
    heroTitle: "ಮೈಸೂರು ದಸರಾ ೨೦೨೫ಗೆ ಸ್ವಾಗತ",
    heroSubtitle: "ನಿಮ್ಮ ಹಬ್ಬದ ಸಂಗಾತಿ - ಕಾರ್ಯಕ್ರಮಗಳು, ಸಾರಿಗೆ ಮತ್ತು ನೆನಪುಗಳನ್ನು ಸುಲಭವಾಗಿ ಅನ್ವೇಷಿಸಿ.",
    ctaEvents: "ಹತ್ತಿರದ ಕಾರ್ಯಕ್ರಮಗಳು",
    ctaGallery: "ಗ್ಯಾಲರಿ ವೀಕ್ಷಿಸಿ",
    eventsTitle: "ದಸರಾ ಕಾರ್ಯಕ್ರಮಗಳ ನಕ್ಷೆ",
    transportTitle: "ಸಾರಿಗೆ ಮಾರ್ಗಗಳು",
    galleryTitle: "ಛಾಯಾಚಿತ್ರ ಗ್ಯಾಲರಿ",
    home: "ಮುಖಪುಟ",
    events: "ಕಾರ್ಯಕ್ರಮಗಳು",
    transport: "ಸಾರಿಗೆ",
    gallery: "ಗ್ಯಾಲರಿ",
    findRoute: "ಮಾರ್ಗ ಹುಡುಕಿ",
    fromEvent: "ಇಲ್ಲಿಂದ",
    toEvent: "ಇಲ್ಲಿಗೆ",
    calculating: "ಲೆಕ್ಕಹಾಕಲಾಗುತ್ತಿದೆ...",
    routeDetails: "ಮಾರ್ಗದ ವಿವರಗಳು",
    footerText: "© ೨೦೨೫ ದಸರಾ ಮಿತ್ರ. ಮೈಸೂರಿನ ಸಂಭ್ರಮವನ್ನು ಆಚರಿಸೋಣ.",
    nearest: "ನಿಮ್ಮ ಹತ್ತಿರ",
    chatTitle: "ದಸರಾ ಸಹಾಯಕ",
    chatPlaceholder: "ಕಾರ್ಯಕ್ರಮಗಳು, ಮಾರ್ಗಗಳು ಅಥವಾ ಇತಿಹಾಸದ ಬಗ್ಗೆ ಕೇಳಿ...",
    send: "ಕಳುಹಿಸಿ",
    loading: "ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
    error: "ಏನೋ ತಪ್ಪಾಗಿದೆ.",
    enableLocation: "ನಿಮ್ಮ ಹತ್ತಿರದ ಕಾರ್ಯಕ್ರಮಗಳನ್ನು ಹುಡುಕಲು ಸ್ಥಳ ಹಂಚಿಕೆಯನ್ನು ಸಕ್ರಿಯಗೊಳಿಸಿ!",
    locationDenied: "ಸ್ಥಳ ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ. ಎಲ್ಲಾ ಕಾರ್ಯಕ್ರಮಗಳನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ.",
    category: "ವರ್ಗ",
    time: "ಸಮಯ",
    directions: "ಮಾರ್ಗಗಳು",
    distance: "ದೂರ",
    duration: "ಅವಧಿ",
    routeNeedLocation: "ದಿಕ್ಕುಗಳನ್ನು ಪಡೆಯಲು ಸ್ಥಳ ಹಂಚಿಕೆಯನ್ನು ಸಕ್ರಿಯಗೊಳಿಸಿ.",
    routeFetching: "ಉತ್ತಮ ಮಾರ್ಗವನ್ನು ಹುಡುಕಲಾಗುತ್ತಿದೆ...",
    routeUnavailable: "ಈ ಕ್ಷಣ ಮಾರ್ಗ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ನಂತರ ಪ್ರಯತ್ನಿಸಿ.",
    routeReady: "ನಡೆದಾಡಲು ಸೂಕ್ತ ಮಾರ್ಗ ಸಿದ್ಧವಾಗಿದೆ",
    clearRoute: "ಮಾರ್ಗವನ್ನು ಅಳಿಸಿ"
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');

  const t = (key) => {
    return TRANSLATIONS[language][key] || key;
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'kn' : 'en');
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);