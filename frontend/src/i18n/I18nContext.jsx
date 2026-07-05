import { useEffect, useMemo, useState } from "react";
import { I18nContext } from "./i18nCore";
import { STORAGE_KEY, SUPPORTED_LANGUAGES, translations } from "./i18nConfig";

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (SUPPORTED_LANGUAGES.includes(stored)) return stored;
    return navigator.language?.toLowerCase().startsWith("en") ? "en" : "es";
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage: (nextLanguage) => {
        if (SUPPORTED_LANGUAGES.includes(nextLanguage)) setLanguageState(nextLanguage);
      },
      t: translations[language],
    }),
    [language]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
