import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Seikh Imran — AI Product Manager",
  description: "AI Product Manager & HCM Implementation Specialist. 2+ years at ADP. Building live AI-native products.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
