import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Velix - AI Code Generation",
  description: "Secure AI coding agent for plugins and bots",
};

import { NotificationProvider } from "@/components/Notification";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/lib/AuthContext";
import { SiteAccessGate } from "@/components/SiteAccessGate";

const noFlashScript = `(function(){try{var t=localStorage.getItem('velix-theme');if(!t){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.classList.toggle('dark',t!=='light');}catch(e){document.documentElement.classList.add('dark');}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <NotificationProvider>
            <AuthProvider>
              <SiteAccessGate>{children}</SiteAccessGate>
            </AuthProvider>
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
