import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import es from "./locales/es.json";
import en from "./locales/en.json";
import fr from "./locales/fr.json";

export const SUPPORTED_LANGUAGES = [
  { code: "es", label: "Español", flag: "ES" },
  { code: "en", label: "English", flag: "EN" },
  { code: "fr", label: "Français", flag: "FR" },
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]["code"];

const savedLanguage = (typeof window !== "undefined" &&
  localStorage.getItem("amal_lang")) || "es";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
      fr: { translation: fr },
    },
    lng: savedLanguage,
    fallbackLng: "es",
    interpolation: {
      escapeValue: false,
    },
  });

// Synchronize document HTML lang attribute
if (typeof document !== "undefined") {
  document.documentElement.lang = i18n.language || "es";
}

i18n.on("languageChanged", (lng) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("amal_lang", lng);
    document.documentElement.lang = lng;
  }
});

export default i18n;
