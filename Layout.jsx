import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Route, Camera, CalendarDays } from 'lucide-react';
import Header from './Components/Header.jsx';
import Chatbot from './Components/Chatbot.jsx';
import { Button } from './Components/ui';
import { useLanguage, LanguageProvider } from './Components/DasaraContext.jsx';

function LayoutContent({ children }) {
  const { t, language } = useLanguage();

  const discoverLinks = [
    { label: t('events'), href: '/events' },
    { label: t('transport'), href: '/transport' },
    { label: t('gallery'), href: '/gallery' }
  ];

  const visitLinks = [
    { label: t('ctaEvents'), href: '/events#events' },
    { label: t('ctaGallery'), href: '/gallery' },
    { label: t('findRoute'), href: '/transport' }
  ];

  const highlightCards = [
    {
      icon: MapPin,
      title: t('eventsTitle'),
      description:
        language === 'kn'
          ? 'ನಗರದಲ್ಲಿ ನಡೆಯುವ ದಸರಾ ಕಾರ್ಯಕ್ರಮಗಳನ್ನು ಸುಲಭವಾಗಿ ಪತ್ತೆ ಹಚ್ಚಿ.'
          : 'Pin every Mysuru celebration and dive into the royal schedule.',
      href: '/events'
    },
    {
      icon: Route,
      title: t('transportTitle'),
      description:
        language === 'kn'
          ? 'ಮೆರವಣಿಗೆ ದಾರಿಗಳ ಬದಲಾವಣೆ ಮತ್ತು ಶಟಲ್ ಆಯ್ಕೆಗಳನ್ನು ಯೋಜಿಸಿ.'
          : 'Plan diversions, shuttles, and festival commutes with confidence.',
      href: '/transport'
    },
    {
      icon: Camera,
      title: t('galleryTitle'),
      description:
        language === 'kn'
          ? 'ಅರಮನೆ ಬೆಳಕು ಮತ್ತು ಸಾಂಸ್ಕೃತಿಕ ಕ್ಷಣಗಳನ್ನು ಮರು ಅನುಭವಿಸಿ.'
          : 'Relive palace illuminations and cultural memories on demand.',
      href: '/gallery'
    },
    {
      icon: CalendarDays,
      title: language === 'kn' ? 'ದಿನವಾರ ಹಬ್ಬದ ಹೊಳೆ' : 'Daily Festival Flow',
      description:
        language === 'kn'
          ? 'ಪ್ರತಿ ದಿನದ ಸಂಭವಗಳನ್ನು ತಿಳಿದು ವಿಶೇಷ ಕ್ಷಣಗಳನ್ನು ತಪ್ಪಿಸಿಕೊಳ್ಳಬೇಡಿ.'
          : 'Stay ahead of the day-wise highlights and never miss a spectacle.',
      href: '/events#events'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <Header />
      <main className="flex-1">{children}</main>
      <Chatbot />

      <footer className="relative mt-12 border-t-4 border-[#800000] bg-gradient-to-br from-[#4C0519] via-[#7F1D1D] to-[#B45309] text-slate-100">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-[#FACC15]/12 blur-3xl" />
          <div className="absolute -bottom-28 -left-20 h-[24rem] w-[24rem] rounded-full bg-[#800000]/18 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#FACC15]/10" />
        </div>

        <div className="relative container mx-auto px-4 py-14">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {highlightCards.map((card) => (
              <Link
                key={card.title}
                to={card.href}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative flex items-start gap-4">
                  <span className="rounded-xl border border-[#FACC15]/40 bg-black/20 p-3 text-[#FACC15] shadow-inner shadow-black/30">
                    <card.icon className="h-5 w-5" />
                  </span>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold uppercase tracking-wide text-[#FACC15]/90">
                      {card.title}
                    </p>
                    <p className="text-xs leading-relaxed text-slate-100/80">
                      {card.description}
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#FDE68A]">
                      {language === 'kn' ? 'ಇನ್ನಷ್ಟು ಅನ್ವೇಷಿಸಿ' : 'Explore'}
                      <span aria-hidden="true">→</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="my-10 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

          <div className="grid gap-10 lg:grid-cols-[1.6fr,1fr,1fr]">
            <div className="space-y-6">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[#FACC15]/60 bg-[#7F1D1D]/80 text-lg font-semibold text-[#FACC15] shadow-lg shadow-[#0B1B3B]/40">
                DM
              </span>
              <p className="text-2xl font-semibold text-[#FDE68A]">{t('title')}</p>
              <p className="text-sm leading-relaxed text-slate-100/75">{t('footerAboutDescription')}</p>

              <div className="flex flex-wrap gap-3 text-xs">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#FACC15]/40 bg-[#4C0519]/50 px-4 py-2 font-semibold uppercase tracking-wide text-[#FACC15]/90">
                  <span className="h-2 w-2 rounded-full bg-[#FACC15]" />
                  {t('footerFestivalDates')}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-[#B45309]/50 px-4 py-2 font-semibold uppercase tracking-wide text-[#FDE68A]/90">
                  <span className="h-2 w-2 rounded-full bg-[#FDE68A]" />
                  {t('footerAddress')}
                </span>
              </div>

              <Link to="/events" className="inline-block">
                <Button
                  variant="outline"
                  className="border-[#FACC15]/70 bg-[#4C0519]/60 text-[#FDE68A] hover:bg-[#FACC15]/20 hover:text-white"
                >
                  {t('ctaEvents')}
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              <p className="text-lg font-semibold uppercase tracking-wide text-[#FACC15]">{t('footerDiscoverTitle')}</p>
              <div className="h-1 w-14 rounded-full bg-gradient-to-r from-[#FACC15] to-transparent" />
              <ul className="space-y-2 text-sm text-slate-100/75">
                {discoverLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="group inline-flex items-center gap-2 transition-colors duration-200 hover:text-[#FACC15]"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[#FACC15]/70 transition-colors duration-200 group-hover:bg-[#FACC15]" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <p className="text-lg font-semibold uppercase tracking-wide text-[#FACC15]">{t('footerVisitTitle')}</p>
              <div className="h-1 w-14 rounded-full bg-gradient-to-r from-[#FACC15] to-transparent" />
              <ul className="space-y-2 text-sm text-slate-100/75">
                {visitLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="group inline-flex items-center gap-2 transition-colors duration-200 hover:text-[#FACC15]"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[#FACC15]/70 transition-colors duration-200 group-hover:bg-[#FACC15]" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="rounded-lg border-l-2 border-[#FACC15]/60 bg-white/5 px-4 py-3 text-xs leading-relaxed text-slate-100/70">
                {t('footerPlanTip')}
              </p>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-slate-100/70 sm:flex-row sm:items-center sm:justify-between">
            <p className="uppercase tracking-[0.25em] text-[#FACC15]/80">{t('footerDisclaimer')}</p>
            <p className="text-[#FDE68A]">{t('footerText')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Layout({ children }) {
  return (
    <LanguageProvider>
      <LayoutContent>{children}</LayoutContent>
    </LanguageProvider>
  );
}
