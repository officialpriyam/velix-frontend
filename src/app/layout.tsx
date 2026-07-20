import type { Metadata, Viewport } from "next";
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

const SITE_URL = "https://velix.snapgrids.store";
const SITE_NAME = "Velix";
const TITLE = "Velix — AI Code Generation Platform | Plugins, Bots & Mods";
const DESCRIPTION = "Generate production-ready Minecraft plugins, Discord bots, Hytale mods, and more with AI. Free, open-source code generation with IDE, team collaboration, and instant deployment.";
const OG_IMAGE = `${SITE_URL}/logo.png`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  keywords: [
    "AI code generation",
    "Minecraft plugin maker",
    "Discord bot generator",
    "Hytale mod builder",
    "Java code AI",
    "Python bot creator",
    "code generator online",
    "free AI coding assistant",
    "plugin development tool",
    "open source code generator",
    "Velix",
    "Paper plugin",
    "Spigot plugin",
    "discord.js bot",
    "discord.py bot",
    "Neoforge mod",
    "Fabric mod",
    "datapack generator",
    "Minecraft config generator",
  ],
  authors: [{ name: "Velix", url: SITE_URL }],
  creator: "Velix",
  publisher: "Velix",
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Velix — AI Code Generation Platform",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
    creator: "@velix",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/logo.png",
  },
  verification: {},
  category: "technology",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
  width: "device-width",
  initialScale: 1,
};

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

import { NotificationProvider } from "@/components/Notification";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/lib/AuthContext";
import { SiteAccessGate } from "@/components/SiteAccessGate";
