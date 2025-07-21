import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

interface LanguageContextProps {
  language: string;
  setLanguage: (lang: string) => void;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState(() => localStorage.getItem('lang') || 'es');
  const [langKey, setLangKey] = useState(0);

  useEffect(() => {
    localStorage.setItem('lang', language);
    setLangKey(k => k + 1); // Forzar re-render global
  }, [language]);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('lang', lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      <React.Fragment key={langKey}>{children}</React.Fragment>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
}; 