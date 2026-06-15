import type { Metadata } from "next";
import "./globals.css";
import "@cueword/core/styles/prototype-base.css";
import "@cueword/core/styles/prototype-class.css";
// Coach design system — LAST so its tokens win on the ported coach screens.
import "./coach-design.css";

export const metadata: Metadata = {
  title: "Cueword — Coach",
  description: "The Cueword coach console — roster, marking, schedule, and the live class.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Fraunces + Inter power the shared live-class CSS; Figtree + Bricolage are the coach design. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=Figtree:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700;9..144,800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
