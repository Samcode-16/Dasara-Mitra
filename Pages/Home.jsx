import React from 'react';
import { useLanguage } from '../Components/DasaraContext';
import { Button } from '../Components/ui';
import { MapPin, Bus, Camera, ArrowRight } from 'lucide-react';
import EventsMap from '../Components/EventsMap';
import TransportPlanner from '../Components/TransportPlanner';
import Gallery from '../Components/Gallery';
import Chatbot from '../Components/Chatbot';
// LanguageProvider handled in Layout

function DasaraApp() {
  const { t } = useLanguage();

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section id="home" className="relative h-[80vh] md:h-[90vh] flex items-center justify-center text-center text-white overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1582555682861-a8a7d36f8e3e?q=80&w=2000&auto=format&fit=crop" 
            alt="Mysore Palace" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#800000]/90"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 space-y-6 animate-in fade-in zoom-in duration-1000">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
            {t('heroTitle')}
          </h1>
          <p className="text-lg md:text-2xl text-gray-200 max-w-3xl mx-auto font-light">
            {t('heroSubtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button 
              size="lg" 
              className="bg-[#DAA520] hover:bg-[#B8860B] text-white font-bold text-lg px-8 py-6 h-auto shadow-lg shadow-yellow-900/20 transition-all hover:scale-105"
              onClick={() => scrollToSection('events')}
            >
              {t('ctaEvents')}
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-[#800000] font-bold text-lg px-8 py-6 h-auto backdrop-blur-sm transition-all hover:scale-105"
              onClick={() => scrollToSection('gallery')}
            >
              {t('ctaGallery')}
            </Button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center p-1">
            <div className="w-1 h-2 bg-white rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Feature Teasers (Mobile Stacked, Desktop Grid) */}
      <section className="relative z-20 -mt-16 md:-mt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: MapPin, label: t('events'), id: 'events', desc: "Find events near you" },
              { icon: Bus, label: t('transport'), id: 'transport', desc: "Get routes & fares" },
              { icon: Camera, label: t('gallery'), id: 'gallery', desc: "Relive the magic" },
            ].map((item, idx) => (
              <div 
                key={idx}
                onClick={() => scrollToSection(item.id)}
                className="bg-white p-6 rounded-xl shadow-xl cursor-pointer hover:-translate-y-2 transition-all duration-300 border-t-4 border-[#DAA520] group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-red-50 rounded-full group-hover:bg-[#800000] transition-colors">
                    <item.icon className="w-6 h-6 text-[#800000] group-hover:text-white transition-colors" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-[#DAA520]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{item.label}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <EventsMap />
      <TransportPlanner />
      <Gallery />
      <Chatbot />
    </div>
  );
}

export default function Home() {
  return (
    <DasaraApp />
  );
}