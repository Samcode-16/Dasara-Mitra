import React from 'react';
import { Link } from 'react-router-dom';
import Header from './Components/Header.jsx';
import Chatbot from './Components/Chatbot.jsx';
import { Button } from './Components/ui';
import { useLanguage, LanguageProvider } from './Components/DasaraContext.jsx';

function LayoutContent({ children }) {
  const { t } = useLanguage();

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
