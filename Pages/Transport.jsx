import React from 'react';
import TransportPlanner from '../Components/TransportPlanner';
import { useLanguage } from '../Components/DasaraContext';

export default function Transport() {
  const { t } = useLanguage();

  return (
    <div className="pb-12">
      <section className="bg-gradient-to-b from-[#DAA520]/10 to-transparent py-12">
        <div className="container mx-auto px-4 text-center space-y-4">
          <h1 className="text-4xl font-bold text-[#800000]">{t('transportTitle')}</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Plan your way between venues with quick travel estimates across buses, taxis, and autos tuned for the festive rush.
          </p>
        </div>
      </section>

      <TransportPlanner />
    </div>
  );
}
