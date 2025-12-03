import React from 'react';
import EventsMap from '../Components/EventsMap';
import { useLanguage } from '../Components/DasaraContext';

export default function Events() {
  const { t } = useLanguage();

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
