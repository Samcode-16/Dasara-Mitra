import React, { useState } from 'react';
// import { Link } from 'react-router-dom';
import { useLanguage } from './DasaraContext';
import { Menu, Globe, X } from 'lucide-react';
import { Button } from './ui';

export default function Header() {
  const { language, toggleLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: t('home'), href: "#home" },
    { label: t('events'), href: "#events" },
    { label: t('transport'), href: "#transport" },
    { label: t('gallery'), href: "#gallery" },
  ];

  const handleNavigate = (href) => {
    const element = document.getElementById(href.replace('#', ''));
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-maroon-900 text-white shadow-md border-b border-gold-500/30" style={{ backgroundColor: '#800000' }}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
            <div className="flex items-center gap-2">
              <img src="/images/branding/logo.png" alt="Dasara Mitra" className="w-8 h-8 rounded-full border border-gold-500 object-cover bg-white" />
            <span className="text-xl font-bold" style={{ color: '#DAA520' }}>{t('title')}</span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => handleNavigate(item.href)}
              className="text-sm font-medium hover:text-[#DAA520] transition-colors"
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="text-white hover:text-[#DAA520] hover:bg-white/10 gap-2"
          >
            <Globe className="w-4 h-4" />
            <span className="uppercase font-bold">{language}</span>
          </Button>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="ml-auto h-full w-64 bg-white text-gray-900 shadow-xl p-6 flex flex-col gap-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold" style={{ color: '#800000' }}>{t('title')}</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col gap-2 mt-6">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => handleNavigate(item.href)}
                  className="text-left text-base font-medium rounded-md px-3 py-2 hover:bg-gray-100"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}