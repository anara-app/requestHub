import { i18n } from "@lingui/core";

// @ts-expect-error
import { messages as messagesRu } from "../../locales/ru/messages.po";
// @ts-expect-error
import { messages as messagesEn } from "../../locales/en/messages.po";

export type Locale = "ru" | "en";

export const locales: Record<Locale, string> = {
  ru: "Русский",
  en: "English",
};

export const defaultLocale: Locale = "ru";

// Load messages
i18n.load("ru", messagesRu);
i18n.load("en", messagesEn);

// Activate default locale
i18n.activate(defaultLocale);

export { i18n };

// Helper functions
export function switchLanguage(locale: Locale) {
  i18n.activate(locale);
  localStorage.setItem("language", locale);
}

export function getCurrentLanguage(): Locale {
  const stored = localStorage.getItem("language") as Locale;
  return stored && stored in locales ? stored : defaultLocale;
}

export function initializeLanguage() {
  const locale = getCurrentLanguage();
  i18n.activate(locale);
  return locale;
} 