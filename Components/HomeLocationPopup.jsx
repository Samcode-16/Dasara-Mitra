import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, X, Navigation, Home, Shield } from 'lucide-react';
import { Button } from './ui.jsx';
import { useLanguage } from './DasaraContext.jsx';

const HOME_BASE_STORAGE_KEY = 'dasara-mitra-home-base';
const POPUP_DISMISSED_KEY = 'dasara-mitra-home-popup-dismissed';

export default function HomeLocationPopup() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Small delay to let the page render first
    const timer = setTimeout(() => {
      try {
        const homeBase = localStorage.getItem(HOME_BASE_STORAGE_KEY);
        const dismissed = sessionStorage.getItem(POPUP_DISMISSED_KEY);
        
        // Show popup if no home base is set and not dismissed this session
        if (!homeBase && !dismissed) {
          setIsVisible(true);
        }
      } catch (err) {
        // Storage might be blocked, show popup anyway
        setIsVisible(true);
      }
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      try {
        sessionStorage.setItem(POPUP_DISMISSED_KEY, 'true');
      } catch (err) {
        // Ignore storage errors
      }
    }, 300);
  };

  const handleSetHomeBase = () => {
    handleClose();
    setTimeout(() => {
      navigate('/find-my-way');
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] transition-opacity duration-300 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleClose}
      />
      
      {/* Popup */}
      <div 
        className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-[90%] max-w-md transition-all duration-300 ${
          isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        <div className="relative bg-gradient-to-br from-white to-amber-50 rounded-2xl shadow-2xl border border-amber-200 overflow-hidden">
          {/* Decorative top bar */}
          <div className="h-2 bg-gradient-to-r from-[#800000] via-[#DAA520] to-[#800000]" />
          
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="p-6 pt-8">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#800000] to-[#B45309] flex items-center justify-center shadow-lg">
                  <Home className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#DAA520] flex items-center justify-center shadow-md">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-center text-[#800000] mb-2">
              {t('homePopupTitle') || 'Set Your Home Base'}
            </h2>

            {/* Subtitle */}
            <p className="text-center text-gray-600 mb-6 leading-relaxed">
              {t('homePopupDescription') || 'Lost in the festival crowd? Set a safe meeting point now so you can always find your way back to your loved ones.'}
            </p>

            {/* Features */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Navigation className="w-4 h-4 text-green-600" />
                </div>
                <span>{t('homePopupFeature1') || 'One-tap navigation back to your safe spot'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-blue-600" />
                </div>
                <span>{t('homePopupFeature2') || 'Works offline with trail tracking'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-amber-600" />
                </div>
                <span>{t('homePopupFeature3') || 'Choose hotel, vehicle, or police booth'}</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleSetHomeBase}
                className="w-full bg-gradient-to-r from-[#800000] to-[#B45309] hover:from-[#600000] hover:to-[#8B3A00] text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                size="lg"
              >
                <Home className="w-5 h-5 mr-2" />
                {t('homePopupSetNow') || 'Set Home Base Now'}
              </Button>
              
              <button
                onClick={handleClose}
                className="w-full text-sm text-gray-500 hover:text-gray-700 py-2 transition-colors"
              >
                {t('homePopupLater') || "I'll do this later"}
              </button>
            </div>
          </div>

          {/* Bottom decorative element */}
          <div className="h-1 bg-gradient-to-r from-transparent via-[#DAA520]/50 to-transparent" />
        </div>
      </div>
    </>
  );
}
