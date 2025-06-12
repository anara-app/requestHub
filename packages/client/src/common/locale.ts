"use server";

import { cookies } from "next/headers";

const LANG_COOKIE_NAME = "NEXT_LOCALE";

export async function getUserLocale() {
  return (await cookies()).get(LANG_COOKIE_NAME)?.value || "en";
}

export async function setUserLocale(locale: string) {
  (await cookies()).set(LANG_COOKIE_NAME, locale);
}
