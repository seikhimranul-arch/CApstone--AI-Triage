"use client";

import { I18nProvider } from "../lib/i18n/I18nContext";
import { LanguageSelector } from "../components/LanguageSelector";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <I18nProvider>
          <div className="fixed top-4 right-4 z-50">
            <LanguageSelector />
          </div>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}