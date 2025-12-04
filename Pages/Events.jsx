import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import EventsMap from '../Components/EventsMap';
import { useLanguage } from '../Components/DasaraContext';

export default function Events() {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const focusTarget = location.state?.focus;

  useEffect(() => {
    if (focusTarget !== 'event-cards') {
      return undefined;
    }

    const handleScroll = () => {
      const el = document.getElementById('event-cards');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      navigate(location.pathname, { replace: true, state: null });
    };

    const timeout = setTimeout(handleScroll, 120);
    return () => clearTimeout(timeout);
  }, [focusTarget, location.pathname, navigate]);

  return (
    <div className="pb-12">
      <section className="bg-gradient-to-b from-[#800000]/10 to-transparent pt-12 pb-0 -mb-4">
        <div className="container mx-auto px-4 text-center space-y-4">
          <h1 className="text-4xl font-bold text-[#800000]">{t('eventsTitle')}</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t('eventsHeroDescription')}
          </p>
        </div>
      </section>

      <EventsMap />
    </div>
  );
}
