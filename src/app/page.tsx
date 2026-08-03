import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Velix — Build Minecraft Mods & Plugins with AI",
  description: "AI code generation platform for Minecraft plugins, Fabric mods, Discord bots, and more. No coding experience required.",
};

export default function HomePage() {
  return <LandingPage />;
}

import LandingPage from "@/components/landing/LandingPage";
