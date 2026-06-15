import type { Metadata } from "next";
import "./globals.css";
import "@cueword/core/styles/prototype-base.css";
import "@cueword/core/styles/prototype-class.css";
// The complete student design system (tokens + every screen's styles), copied
// verbatim from the mockup. MUST be the last CSS import so its tokens win.
import "./student-design.css";

export const metadata: Metadata = {
  title: "Cueword — Student",
  description: "The Cueword student space — your stories, progress, and the live class.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Fraunces + Inter power the shared live-class CSS; DM Serif Display,
            DM Sans, Bitter, Hanken Grotesk and Nunito power the student design.
            One merged Google Fonts request loads every family the CSS names. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700;9..144,800&family=Inter:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=Bitter:wght@400;500;600;700;800&family=Hanken+Grotesk:wght@400;500;600;700;800&family=Nunito:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
