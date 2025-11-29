import React from 'react';
import Header from './Components/Header.jsx';
import { useLanguage, LanguageProvider } from './Components/DasaraContext.jsx';

function LayoutContent({ children }) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <footer className="bg-[#333333] text-white py-8 border-t-4 border-[#800000]">
        <div className="container mx-auto px-4 text-center">
          <p className="text-[#DAA520] font-medium mb-2">{t('title')}</p>
          <p className="text-sm text-gray-400">{t('footerText')}</p>
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
