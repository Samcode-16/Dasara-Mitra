import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Phone, Mail, Clock } from 'lucide-react';
import Header from './Header.jsx';
import Chatbot from './Chatbot.jsx';
import VoiceAssistant from './VoiceAssistant.jsx';
import ContactForm from './ContactForm.jsx';
import { Button } from './ui.jsx';
import { useLanguage, LanguageProvider } from './DasaraContext.jsx';

function LayoutContent({ children }) {
  const { t } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.focus === 'event-cards') {
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  const contactDetails = [
    {
      icon: Phone,
      label: t('footerContactPhoneLabel'),
      value: t('footerContactPhoneValue'),
      href: 'tel:+9178931XXXXX'
    },
    {
      icon: Mail,
      label: t('footerContactEmailLabel'),
      value: t('footerContactEmailValue'),
      href: 'mailto:support@dasaramitra.in'
    },
    {
      icon: Clock,
      label: t('footerContactHoursLabel'),
      value: t('footerContactHoursValue')
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <Header />
      <main className="flex-1">{children}</main>
      <Chatbot />
      <VoiceAssistant />

      <footer className="relative mt-12 border-t-4 border-[#800000] bg-gradient-to-br from-[#4C0519] via-[#7F1D1D] to-[#B45309] text-slate-100">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-[#FACC15]/12 blur-3xl" />
          <div className="absolute -bottom-28 -left-20 h-[24rem] w-[24rem] rounded-full bg-[#800000]/18 blur-3xl" />
        </div>

        <div className="relative container mx-auto px-4 py-14">
          <div className="mb-10 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

          <div className="grid gap-10 lg:grid-cols-[1.6fr,1fr,1fr]">
            <div className="space-y-6">
              <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-[#FACC15]/50 bg-white/10 p-2 shadow-lg shadow-[#0B1B3B]/50">
                <img
                  src="/images/branding/logo.png"
                  alt="Dasara Mitra logo"
                  className="h-full w-full object-contain"
                  loading="lazy"
                />
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
              <p className="text-lg font-semibold uppercase tracking-wide text-[#FACC15]">{t('footerContactTitle')}</p>
              <div className="h-1 w-14 rounded-full bg-gradient-to-r from-[#FACC15] to-transparent" />
              <ul className="space-y-3 text-sm text-slate-100/85">
                {contactDetails.map((detail) => (
                  <li
                    key={detail.label}
                    className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <span className="mt-1 rounded-lg bg-black/30 p-2 text-[#FACC15]">
                      <detail.icon className="h-4 w-4" />
                    </span>
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#FDE68A]/80">{detail.label}</p>
                      {detail.href ? (
                        <a
                          href={detail.href}
                          className="text-sm font-semibold text-white transition-colors duration-200 hover:text-[#FACC15]"
                        >
                          {detail.value}
                        </a>
                      ) : (
                        <p className="text-sm font-semibold text-white">{detail.value}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <ContactForm />
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
