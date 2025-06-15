import { i18n } from '@lingui/core'

export const locales = {
  en: 'English',
  ru: 'Russian',
}

export const defaultLocale = 'en'

/**
 * We do a dynamic import of just the catalog that we need
 * @param locale any locale string
 */
export async function dynamicActivate(locale: string) {
  const { messages } = await import(`../locales/${locale}/messages.po`)
  i18n.load(locale, messages)
  i18n.activate(locale)
}

// Initialize with saved locale or default
const savedLocale = localStorage.getItem('preferred-locale') || defaultLocale
const initialLocale = Object.keys(locales).includes(savedLocale) ? savedLocale : defaultLocale
dynamicActivate(initialLocale) 