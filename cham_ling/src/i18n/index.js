import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en/translation.json";
import ru from "./locales/ru/translation.json";

const resources = {
  en: { translation: en },
  ru: { translation: ru },
};

// Получаем язык системы (например "en-US" → "en")
const systemLang = navigator.language.split("-")[0];

// Список поддерживаемых языков
const supportedLanguages = ["en", "ru"];

// Проверяем localStorage → потом системный язык → иначе en
const savedLang = localStorage.getItem("appLanguage");
const defaultLang =
  savedLang || (supportedLanguages.includes(systemLang) ? systemLang : "en");

i18n.use(initReactI18next).init({
  resources,
  lng: defaultLang,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // React сам экранирует
  },
});

// При изменении языка — сохраняем выбор
i18n.on("languageChanged", (lang) => {
  localStorage.setItem("appLanguage", lang);
});

export default i18n;
