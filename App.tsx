
import React, { useState, createContext, useContext } from 'react';
import { Language, Translation } from './types';
import { translations } from './translations';
import Experience from './components/Experience';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translation;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within a LanguageProvider");
  return context;
};

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('tr');
  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <Experience />
    </LanguageContext.Provider>
  );
};

export default App;
