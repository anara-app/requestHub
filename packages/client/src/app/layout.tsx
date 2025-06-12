import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { ENV_KEYS } from "@/common/constants";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { getLocale } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";

const montserratFont = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "Site.com",
  description: "Site.com",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <head>
        <link rel="icon" href="/logos/logo.svg" sizes="any" />

        <script
          async
          src="https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/js/splide.min.js"
        ></script>
      </head>
      <GoogleAnalytics gaId={ENV_KEYS.GOOGLE_TAG} />
      <body className={`${montserratFont.variable} antialiased`}>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
