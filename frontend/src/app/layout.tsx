"use client";

import { I18nProvider } from "../lib/i18n/I18nContext";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>SehatAI — AI Clinical Decision Support for Indian PHCs</title>
        <meta name="description" content="ABHA-integrated clinical decision support assistant for Indian Primary Health Centres. Chart review, differential diagnosis, doctor override, and training." />
      </head>
      <body className="antialiased">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
