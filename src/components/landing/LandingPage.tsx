"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowRight,
  Sparkles,
  Play,
  Check,
  ChevronRight,
  ChevronDown,
  Zap,
  History,
  Users,
  BookOpen,
  Globe,
  CreditCard,
  Puzzle,
  Terminal,
  Code2,
  FileCode,
  Braces,
  Package,
  Download,
  Search,
  FolderOpen,
  Image,
  Star,
  MessageCircle,
  Shield,
  Cpu,
  Wand2,
  Send,
  Bot,
  FileText,
  Layers,
  GitBranch,
  Rocket,
  Headphones,
} from "lucide-react";

/* ────────── constants ────────── */
const TYPING_WORDS = ["Fabric Mods", "Plugins", "Discord Bots", "Spigot Mods", "Data Packs", "Configs"];

const STATS = [
  { value: "35000+", label: "Projects Created", sub: "Leading results", key: "projects" as const },
  { value: "28000+", label: "Registered Users", sub: "Growing daily", key: "users" as const },
  { value: "9B+", label: "Tokens Generated", sub: "Processing power", key: "tokens" as const },
];

const FEATURES_ROW2 = [
  { title: "Community-Powered Docs", desc: "Plugin docs curated by the community, built into AI knowledge.", icon: BookOpen, color: "text-emerald-400", bg: "bg-emerald-400/10", badge: "DOCS" },
  { title: "Regional Model Pricing", desc: "Pay based on where you are. Fairer costs across all regions.", icon: Globe, color: "text-sky-400", bg: "bg-sky-400/10", badge: "COST SAVING" },
  { title: "Smart Input Pricing", desc: "With the smart context algorithm, you'll consume far fewer credits per request.", icon: CreditCard, color: "text-amber-400", bg: "bg-amber-400/10", badge: "ECO FRIENDLY" },
  { title: "Multi-Platform Support", desc: "Seamless support for multiple platforms. Build and run server plugins just as easily as client mods.", icon: Puzzle, color: "text-violet-400", bg: "bg-violet-400/10", badge: "MULTI-PLATFORM" },
];

const FEATURES_ROW3 = [
  { title: "Fabric Mods", desc: "Supports 1.16.X, 1.18.X, 1.20.X, and 1.21.X.", icon: Package, color: "text-sky-400", bg: "bg-sky-400/10", badge: "FREE" },
  { title: "Java & Kotlin Support", desc: "Java or Kotlin, JVM or client, Java has full mainstream language support.", icon: Code2, color: "text-orange-400", bg: "bg-orange-400/10", badge: "ALL JAVA VERSIONS" },
];

const BOTTOM_FEATURES = [
  { title: "Smart Dependencies", desc: "Intelligent dependency resolution with conflict detection.", icon: Search, color: "text-sky-400", bg: "bg-sky-400/10" },
  { title: "All Java Versions", desc: "Supports Java 8, 11, 16, 17, and 21. Switch between versions based on server needs.", icon: Terminal, color: "text-sky-400", bg: "bg-sky-400/10" },
  { title: "Smart Organization", desc: "Automatic file structuring for easy access.", icon: FolderOpen, color: "text-sky-400", bg: "bg-sky-400/10" },
  { title: "Rich Media Support", desc: "Generate images, sound files to your projects.", icon: Image, color: "text-sky-400", bg: "bg-sky-400/10" },
];

const USE_CASE_TABS = [
  { id: "plugins", label: "Plugins", icon: Puzzle },
  { id: "fabric", label: "Fabric Mods", icon: Package },
  { id: "spigot", label: "Spigots", icon: Terminal, badge: "EASY TO BUILD" },
  { id: "configs", label: "Configs", icon: FileCode },
  { id: "datapacks", label: "Data Packs", icon: Braces },
];

const USE_CASES: Record<string, { title: string; desc: string; features: string[] }> = {
  plugins: {
    title: "Java Plugins",
    desc: "Create server plugins with simple prompts for any Minecraft version.",
    features: ["Simple shop system with GUI", "Teleport commands with cooldowns", "Player homes & warps", "Economy system with vault", "Chat formatting & colors", "Welcome messages & MOTD"],
  },
  fabric: {
    title: "Fabric Mods",
    desc: "Build client-side and server-side mods with Fabric API.",
    features: ["Custom items and blocks", "Entity rendering and AI", "World generation", "Custom GUI screens", "Network packet handling", "Mixin-based modifications"],
  },
  spigot: {
    title: "Spigot Plugins",
    desc: "Build high-performance Spigot plugins with ease.",
    features: ["Optimized event handling", "SQL & file storage", "Scoreboard & tab list", "WorldGuard integration", "PlaceholderAPI support", "BungeeCord forwarding"],
  },
  configs: {
    title: "Plugin Configs",
    desc: "Generate configuration files for existing plugins.",
    features: ["EssentialsX config.yml", "WorldGuard flags", "LuckPerms permissions", "Vault economy setup", "PermissionsEx config", "Custom YAML configs"],
  },
  datapacks: {
    title: "Data Packs",
    desc: "Create vanilla data packs with custom functions and recipes.",
    features: ["Custom recipes & loot tables", "Function chains", "Scoreboard systems", "Custom advancements", "Mcfunction scripts", "Tick & load functions"],
  },
};

const TESTIMONIALS = [
  { name: "Alex M.", role: "Plugin Developer", text: "Built a full economy plugin in 10 minutes. Usually takes me a whole weekend. The AI understood exactly what I needed.", stars: 5 },
  { name: "Sarah K.", role: "Mod Creator", text: "The Fabric mod support is incredible. Generated a custom inventory mod that works perfectly on 1.21.", stars: 5 },
  { name: "Jake T.", role: "Server Owner", text: "Running a 200-player server and needed custom plugins fast. Velix delivered production-ready code in seconds.", stars: 5 },
  { name: "Mika L.", role: "Data Pack Artist", text: "Generated 15 custom recipes and loot tables for my adventure map. Saved me hours of tedious JSON work.", stars: 5 },
];

const FAQ = [
  { q: "What is Velix AI?", a: "Velix AI is an AI-powered code generation platform specifically built for Minecraft development. It generates production-ready plugins, Fabric mods, Spigot plugins, data packs, and more from natural language prompts." },
  { q: "Do I need to know how to code?", a: "Not at all. Simply describe what you want to build in plain English, and Velix generates the complete code. You can download and install the generated files directly on your server." },
  { q: "What Minecraft versions are supported?", a: "We support all major versions from 1.8 through 1.21+. This includes Fabric, Forge, Spigot, Paper, and BungeeCord." },
  { q: "Can I edit the generated code?", a: "Yes! Every generation comes with a built-in online IDE where you can edit, compile, and test your code before downloading. You can also rollback to any previous version." },
  { q: "Is there a free tier?", a: "Yes. You get 100 credits on signup plus 6-12 daily credits forever. All AI models are included, even on the free tier." },
  { q: "How does the version history work?", a: "Every generation is automatically versioned. You can rollback to any previous state with one click, compare differences between versions, and restore any point in time." },
];

const HOW_IT_WORKS = [
  { step: 1, icon: MessageCircle, title: "Describe Your Idea", desc: "Tell the AI what you want to build in plain English. Be as specific or general as you like.", color: "text-sky-400", bg: "bg-sky-400/10" },
  { step: 2, icon: Cpu, title: "AI Generates Code", desc: "Our AI analyzes your request, checks plugin docs, and generates production-ready code with proper dependencies.", color: "text-purple-400", bg: "bg-purple-400/10" },
  { step: 3, icon: Layers, title: "Review & Edit", desc: "Use the built-in IDE to review, edit, and test your code. Everything is versioned automatically.", color: "text-amber-400", bg: "bg-amber-400/10" },
  { step: 4, icon: Rocket, title: "Download & Deploy", desc: "Download the JAR file and drop it on your server. Or share it with the community instantly.", color: "text-emerald-400", bg: "bg-emerald-400/10" },
];

const PLATFORMS: { name: string; img: string | null; letter?: string; color?: string }[] = [
  { name: "Minecraft Java", img: "/platforms/minecraft.svg" },
  { name: "Hytale", img: "/platforms/hytale.png" },
  { name: "Discord", img: "/platforms/discord.png" },
  { name: "Chrome Extensions", img: "/platforms/chrome.png" },
  { name: "Plugins", img: "/platforms/papermc.png" },
  { name: "Spigot", img: "/platforms/spigot.png" },
  { name: "Paper", img: "/platforms/papermc.png" },
  { name: "Purpur", img: "/platforms/purpur.svg" },
  { name: "Velocity", img: "/platforms/velocity.svg" },
  { name: "Fabric Mods", img: "/platforms/fabric.png" },
  { name: "Forge Mods", img: "/platforms/java.png" },
  { name: "Java", img: "/platforms/java.png" },
  { name: "Kotlin", img: "/platforms/kotlin.png" },
  { name: "Python", img: "/platforms/python.png" },
  { name: "JavaScript", img: "/platforms/javascript.png" },
  { name: "TypeScript", img: "/platforms/typescript.png" },
  { name: "Ruby", img: "/platforms/ruby.png" },
  { name: "Configuration", img: null, letter: "C", color: "bg-amber-400/15 text-amber-400" },
  { name: "Scripting", img: null, letter: "S", color: "bg-violet-400/15 text-violet-400" },
  { name: "Data Packs", img: null, letter: "D", color: "bg-emerald-400/15 text-emerald-400" },
  { name: "Bots", img: "/platforms/discord.png" },
  { name: "Extension", img: "/platforms/chrome.png" },
];

/* ────────── hooks ────────── */
function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function useStats() {
  const [live, setLive] = useState<Record<string, number>>({});
  useEffect(() => {
    fetch("/api/auth/stats")
      .then((r) => r.json())
      .then((d) => setLive({ users: d.users || 0, projects: d.projects || 0, tokens: d.tokens || 0 }))
      .catch(() => {});
  }, []);
  return live;
}

function useCountUp(target: number, duration = 2000, start = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start || target === 0) return;
    let startTs: number | null = null;
    const step = (ts: number) => {
      if (!startTs) startTs = ts;
      const progress = Math.min((ts - startTs) / duration, 1);
      setVal(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return val;
}

/* ────────── sub-components ────────── */
function Particles() {
  const [dots, setDots] = useState<{ x: number; y: number; size: number; opacity: number; delay: number }[]>([]);
  useEffect(() => {
    setDots(Array.from({ length: 50 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.3 + 0.05,
      delay: Math.random() * 5,
    })));
  }, []);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((d, i) => (
        <div key={i} className="particle-dot absolute rounded-full bg-white" style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.size, height: d.size, opacity: d.opacity, animationDelay: `${d.delay}s` }} />
      ))}
    </div>
  );
}

function TypingHeadline() {
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const word = TYPING_WORDS[wordIdx];
    const timeout = setTimeout(() => {
      if (!deleting && charIdx < word.length) setCharIdx(charIdx + 1);
      else if (!deleting && charIdx === word.length) setTimeout(() => setDeleting(true), 2000);
      else if (deleting && charIdx > 0) setCharIdx(charIdx - 1);
      else if (deleting && charIdx === 0) { setDeleting(false); setWordIdx((wordIdx + 1) % TYPING_WORDS.length); }
    }, deleting ? 40 : 80);
    return () => clearTimeout(timeout);
  }, [charIdx, deleting, wordIdx]);
  return (
    <span className="text-[#22d3ee]">
      {TYPING_WORDS[wordIdx].slice(0, charIdx)}
      <span className="ml-0.5 inline-block h-[1.1em] w-[3px] translate-y-[2px] animate-pulse bg-[#22d3ee]" />
    </span>
  );
}

function AnimatedSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useScrollReveal(0.1);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className}`}
      style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(40px)", transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function CodeEditorCard() {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ["Main.java", "config.yml", "plugin.yml"];
  const codeLines = [
    ["public class Main extends JavaPlugin {", "  @Override", "  public void onEnable() {", '    getLogger().info("Plugin enabled!");', "  }", "}"],
    ["plugin:", "  name: MyPlugin", "  version: 1.0.0", "  main: com.example.Main"],
    ["name: MyPlugin", "version: 1.0.0", "main: com.example.Main", "api-version: '1.20'"],
  ];
  return (
    <div className="rounded-xl border border-white/[0.09] bg-[#0d1117] overflow-hidden">
      <div className="flex border-b border-white/[0.06]">
        {tabs.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)} className={`px-4 py-2.5 text-[11px] font-medium transition-colors ${activeTab === i ? "text-white border-b-2 border-sky-400 bg-white/[0.04]" : "text-white/40 hover:text-white/60"}`}>{tab}</button>
        ))}
      </div>
      <div className="p-4 font-mono text-[11px] leading-relaxed text-white/60">
        {codeLines[activeTab].map((line, i) => (
          <div key={i} className="flex"><span className="mr-4 w-4 text-right text-white/20">{i + 1}</span><span className="text-white/70">{line}</span></div>
        ))}
      </div>
    </div>
  );
}

function VersionHistoryCard() {
  const items = [
    { label: "1.0.0", desc: "Initial release", color: "text-emerald-400" },
    { label: "1.0.1", desc: "Bug fix", color: "text-sky-400" },
    { label: "1.1.0", desc: "Feature update", color: "text-amber-400" },
  ];
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[11px]">
          <div className={`h-1.5 w-1.5 rounded-full ${item.color.replace("text-", "bg-")}`} />
          <span className="font-mono font-semibold text-white/80">{item.label}</span>
          <span className="text-white/40">{item.desc}</span>
        </div>
      ))}
    </div>
  );
}

function StatBlock({ s, live }: { s: typeof STATS[number]; live: Record<string, number> }) {
  const val = live[s.key];
  const animatedVal = useCountUp(val || 0, 2000, val !== undefined);
  const { ref, visible } = useScrollReveal(0.2);
  const display = val !== undefined ? formatStat(s.key, animatedVal) : s.value;
  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl font-extrabold tracking-tight text-white md:text-5xl transition-all duration-700" style={{ opacity: visible ? 1 : 0, transform: visible ? "scale(1)" : "scale(0.8)" }}>
        {visible ? display : s.value}
      </div>
      <div className="mt-2 text-[13px] font-medium text-white/50">{s.label}</div>
      <div className="mt-1 text-[11px] text-emerald-400">{s.sub}</div>
    </div>
  );
}

function FAQItem({ item, isOpen, onToggle }: { item: typeof FAQ[number]; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-white/[0.06] last:border-0">
      <button onClick={onToggle} className="flex w-full items-center justify-between py-5 text-left">
        <span className="text-[15px] font-semibold text-white/90">{item.q}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-white/40 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-40 pb-5" : "max-h-0"}`}>
        <p className="text-[13px] leading-relaxed text-white/50">{item.a}</p>
      </div>
    </div>
  );
}

/* ────────── main ────────── */
function formatStat(key: string, value: number): string {
  if (key === "tokens") {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B+`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M+`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K+`;
    return `${value}+`;
  }
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M+`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K+`;
  return `${value}+`;
}

export default function LandingPage() {
  const [activeUseCase, setActiveUseCase] = useState("plugins");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const live = useStats();

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white antialiased">
      {/* ═══════ HERO ═══════ */}
      <section className="relative overflow-hidden pb-16 pt-8">
        {/* Background video */}
        <div className="absolute inset-0">
          <video
            src="/landing/snow.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Dark vignette edges only — video visible */}
          <div className="absolute inset-0 bg-[#0a0a0f]/40" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-transparent to-[#0a0a0f]" />
        </div>

        <Particles />

        {/* Nav */}
        <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <a href="/chat" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center">
              <svg viewBox="0 0 32 32" className="h-9 w-9" fill="none">
                <path d="M6 6L16 26L26 6" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 6L16 18L22 6" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
              </svg>
            </div>
          </a>
          <nav className="hidden items-center gap-8 md:flex">
            {["Features", "Use Cases", "Pricing"].map((link) => (
              <a key={link} href={`#${link.toLowerCase().replace(" ", "-")}`} className="text-[13px] font-medium text-white/60 transition-colors hover:text-white">
                {link}
              </a>
            ))}
            <a href="/chat" className="rounded-full bg-white px-5 py-2.5 text-[12px] font-bold text-[#0a0a0f] transition-transform hover:scale-105">
              Start Building
            </a>
          </nav>
        </header>

        {/* Hero content */}
        <div className="relative z-10 mx-auto max-w-4xl px-6 pt-20 text-center md:pt-28">
          <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/40">
            Click a voice link to switch platforms
          </p>

          <h1 className="text-4xl font-black leading-tight tracking-tight md:text-6xl lg:text-7xl">
            Build Minecraft <TypingHeadline />
          </h1>

          <p className="mt-5 text-xl font-semibold text-white/80 md:text-2xl">
            Without Writing Code
          </p>

          <p className="mx-auto mt-4 max-w-lg text-[14px] leading-relaxed text-white/45">
            AI understands your vision and writes code in seconds
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a href="/chat" className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-[13px] font-bold text-[#0a0a0f] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]">
              Start Building
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a href="#features" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-6 py-3.5 text-[13px] font-medium text-white/80 backdrop-blur-sm transition-colors hover:border-white/30 hover:text-white">
              <Sparkles className="h-3.5 w-3.5" />
              See Features
            </a>
          </div>

          {/* Hero stats */}
          <div className="mx-auto mt-16 grid max-w-lg grid-cols-3 gap-6">
            {STATS.map((s) => {
              const val = live[s.key];
              return (
                <div key={s.label}>
                  <div className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
                    {val !== undefined ? formatStat(s.key, val) : s.value}
                  </div>
                  <div className="mt-1 text-[11px] font-medium text-white/40">{s.label}</div>
                  <div className="mt-0.5 text-[10px] text-emerald-400">{s.sub}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="relative z-10 mx-auto mt-12 flex justify-center">
          <div className="flex h-8 w-5 items-start justify-center rounded-full border border-white/20 p-1">
            <div className="h-2 w-1 animate-bounce rounded-full bg-white/40" />
          </div>
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <AnimatedSection className="text-center">
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#22d3ee]">How It Works</span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight md:text-4xl">From idea to plugin in 4 steps</h2>
            <p className="mx-auto mt-3 max-w-md text-[14px] text-white/45">No setup. No configuration. Just describe and build.</p>
          </AnimatedSection>
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((step, i) => (
              <AnimatedSection key={step.step} delay={i * 120}>
                <div className="relative rounded-2xl border border-white/[0.09] bg-[#111118] p-6 text-center">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#22d3ee] px-2.5 py-0.5 text-[10px] font-bold text-[#0a0a0f]">
                    Step {step.step}
                  </div>
                  <div className={`mx-auto mt-3 flex h-12 w-12 items-center justify-center rounded-xl ${step.bg}`}>
                    <step.icon className={`h-5 w-5 ${step.color}`} />
                  </div>
                  <h3 className="mt-4 text-[15px] font-bold text-white">{step.title}</h3>
                  <p className="mt-2 text-[12px] leading-relaxed text-white/45">{step.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ PLATFORMS ═══════ */}
      <section className="border-y border-white/[0.06] bg-[#111118]/50 px-6 py-14">
        <div className="mx-auto max-w-4xl text-center">
          <AnimatedSection>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/30 mb-6">Supported Platforms</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {PLATFORMS.map((p) => (
                <div key={p.name} className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-[12px] font-semibold text-white/80">
                  {p.img ? (
                    <img src={p.img} alt={p.name} className="h-4 w-4 object-contain" />
                  ) : (
                    <span className={`flex h-4 w-4 items-center justify-center rounded text-[10px] font-black ${p.color}`}>{p.letter}</span>
                  )}
                  {p.name}
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════ FEATURES ═══════ */}
      <section id="features" className="relative px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <AnimatedSection className="text-center">
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#22d3ee]">Features</span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight md:text-4xl">Everything you need to succeed</h2>
            <p className="mx-auto mt-3 max-w-md text-[14px] text-white/45">Professional development tools without the complexity</p>
          </AnimatedSection>

          {/* Feature grid */}
          <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Core feature — large card */}
            <AnimatedSection className="rounded-2xl border border-white/[0.09] bg-[#111118] p-6 md:col-span-1 md:row-span-2">
              <span className="mb-3 inline-block rounded-full bg-sky-400/15 px-2.5 py-1 text-[10px] font-bold text-sky-400">CORE FEATURE</span>
              <h3 className="mt-3 text-lg font-bold text-white">Describe it. Build it. Ship it.</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-white/50">Prompt in, code out. Download, install, share. Repeat. No setup required.</p>
              <div className="mt-5 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
                <div className="flex items-center gap-2 text-[12px] text-white/40">
                  <span>Make an auction house plugin</span>
                  <ChevronRight className="h-3.5 w-3.5 text-[#22d3ee]" />
                </div>
              </div>
            </AnimatedSection>

            {/* Lightning Fast Builds */}
            <AnimatedSection delay={100} className="rounded-2xl border border-white/[0.09] bg-[#111118] p-5">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-sky-400/10">
                <Zap className="h-4 w-4 text-sky-400" />
              </div>
              <h3 className="text-[15px] font-bold text-white">Lightning Fast Builds</h3>
              <p className="mt-1.5 text-[12px] text-white/45">Edit, compile, test, and deploy in seconds, not hours.</p>
              <div className="mt-4 flex items-center gap-2 text-[11px] text-white/30">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                <span>Compiling...</span>
              </div>
            </AnimatedSection>

            {/* Never Lose Your Work */}
            <AnimatedSection delay={200} className="rounded-2xl border border-white/[0.09] bg-[#111118] p-5">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-purple-400/10">
                <History className="h-4 w-4 text-purple-400" />
              </div>
              <h3 className="text-[15px] font-bold text-white">Never Lose Your Work</h3>
              <p className="mt-1.5 text-[12px] text-white/45">Every generation is versioned. Rollback to any state, one click.</p>
              <div className="mt-4"><VersionHistoryCard /></div>
            </AnimatedSection>

            {/* Real-Time Collaboration — full width */}
            <AnimatedSection delay={300} className="rounded-2xl border border-white/[0.09] bg-[#111118] p-6 md:col-span-3">
              <div className="flex flex-col gap-6 md:flex-row md:items-center">
                <div className="flex-1">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-sky-400/10">
                    <Users className="h-4 w-4 text-sky-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Real-Time Collaboration</h3>
                  <p className="mt-2 max-w-md text-[13px] leading-relaxed text-white/50">
                    Invite teammates to your project and build together. Live cursors, shared file editing, integrated chat, and role-based access control.
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {["bg-sky-400", "bg-emerald-400", "bg-purple-400", "bg-amber-400"].map((c, i) => (
                        <div key={i} className={`h-6 w-6 rounded-full ${c} border-2 border-[#111118]`} />
                      ))}
                    </div>
                    <span className="text-[11px] text-white/40">4 collaborators online</span>
                  </div>
                </div>
                <div className="flex-1 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2 text-[11px] text-white/40">
                    <div className="h-2 w-2 rounded-full bg-red-400" />
                    <div className="h-2 w-2 rounded-full bg-amber-400" />
                    <div className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="ml-2">plugin.yml</span>
                  </div>
                  <div className="mt-3 space-y-1.5 font-mono text-[11px] text-white/50">
                    <div>name: <span className="text-sky-400">MyPlugin</span></div>
                    <div>version: <span className="text-emerald-400">1.0.0</span></div>
                    <div className="flex items-center gap-1">main: <span className="text-amber-400">com.example</span><span className="inline-block h-3.5 w-0.5 animate-pulse bg-sky-400" /></div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>

          {/* Row 2 — 4 cards */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES_ROW2.map((f, i) => (
              <AnimatedSection key={f.title} delay={i * 80}>
                <div className="h-full rounded-2xl border border-white/[0.09] bg-[#111118] p-5">
                  {f.badge && <span className={`mb-2 inline-block rounded-full ${f.bg} px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${f.color}`}>{f.badge}</span>}
                  <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${f.bg}`}><f.icon className={`h-4 w-4 ${f.color}`} /></div>
                  <h3 className="text-[14px] font-bold text-white">{f.title}</h3>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-white/45">{f.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>

          {/* Row 3 — 2 small badges */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FEATURES_ROW3.map((f) => (
              <AnimatedSection key={f.title}>
                <div className="flex items-center gap-4 rounded-2xl border border-white/[0.09] bg-[#111118] p-5">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${f.bg}`}><f.icon className={`h-5 w-5 ${f.color}`} /></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-bold text-white">{f.title}</h3>
                      {f.badge && <span className={`rounded-full ${f.bg} px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${f.color}`}>{f.badge}</span>}
                    </div>
                    <p className="mt-1 text-[12px] text-white/45">{f.desc}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>

          {/* Professional Online IDE — full width */}
          <AnimatedSection className="mt-4 rounded-2xl border border-white/[0.09] bg-[#111118] p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-400/10"><Terminal className="h-4 w-4 text-sky-400" /></div>
              <h3 className="text-lg font-bold text-white">Professional Online IDE</h3>
            </div>
            <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-white/50">
              Full-featured code editor with syntax highlighting, file tree navigation, and keyboard shortcuts. Resize your workspace to fit your layout. Everything saves automatically to the cloud.
            </p>
            <div className="mt-5"><CodeEditorCard /></div>
          </AnimatedSection>

          {/* Bottom 4 features */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {BOTTOM_FEATURES.map((f, i) => (
              <AnimatedSection key={f.title} delay={i * 80}>
                <div className="h-full rounded-2xl border border-white/[0.09] bg-[#111118] p-5">
                  <div className="flex items-center gap-2">
                    <f.icon className={`h-4 w-4 ${f.color}`} />
                    <h3 className="text-[13px] font-bold text-white">{f.title}</h3>
                  </div>
                  <p className="mt-2 text-[12px] leading-relaxed text-white/45">{f.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ STATS ═══════ */}
      <section className="border-y border-white/[0.06] bg-[#111118]/50 px-6 py-16">
        <div className="mx-auto grid max-w-4xl grid-cols-3 gap-8">
          {STATS.map((s) => <StatBlock key={s.label} s={s} live={live} />)}
        </div>
      </section>

      {/* ═══════ USE CASES ═══════ */}
      <section id="use-cases" className="px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <AnimatedSection className="text-center">
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#22d3ee]">Use Cases</span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight md:text-4xl">Build anything you imagine</h2>
          </AnimatedSection>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {USE_CASE_TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveUseCase(tab.id)} className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-[12px] font-semibold transition-all ${activeUseCase === tab.id ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"}`}>
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
                {tab.badge && <span className="rounded-full bg-sky-400/15 px-2 py-0.5 text-[8px] font-bold uppercase text-sky-400">{tab.badge}</span>}
              </button>
            ))}
          </div>
          <div className="mt-8 rounded-2xl border border-white/[0.09] bg-[#111118] p-8">
            <h3 className="text-xl font-bold text-white">{USE_CASES[activeUseCase].title}</h3>
            <p className="mt-2 text-[14px] text-white/50">{USE_CASES[activeUseCase].desc}</p>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {USE_CASES[activeUseCase].features.map((feat, i) => (
                <div key={i} className="flex items-center gap-2 text-[13px] text-white/60">
                  <Check className="h-3.5 w-3.5 shrink-0 text-[#22d3ee]" />
                  {feat}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ TESTIMONIALS ═══════ */}
      <section className="border-y border-white/[0.06] bg-[#111118]/50 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <AnimatedSection className="text-center">
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#22d3ee]">Testimonials</span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight md:text-4xl">Loved by creators</h2>
            <p className="mx-auto mt-3 max-w-md text-[14px] text-white/45">Join thousands of developers building with Velix AI</p>
          </AnimatedSection>
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TESTIMONIALS.map((t, i) => (
              <AnimatedSection key={t.name} delay={i * 100}>
                <div className="h-full rounded-2xl border border-white/[0.09] bg-[#111118] p-5">
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <Star key={j} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="mt-3 text-[13px] leading-relaxed text-white/60">&ldquo;{t.text}&rdquo;</p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-[#22d3ee]/15 flex items-center justify-center text-[11px] font-bold text-[#22d3ee]">
                      {t.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <div className="text-[12px] font-semibold text-white/80">{t.name}</div>
                      <div className="text-[11px] text-white/40">{t.role}</div>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ PRICING ═══════ */}
      <section id="pricing" className="px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <AnimatedSection>
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#22d3ee]">Pricing</span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight md:text-4xl">Free to use, no limits</h2>
            <p className="mx-auto mt-3 max-w-md text-[14px] text-white/45">We are currently free to use with no limitations. No recurring fees, no credit card required.</p>
          </AnimatedSection>
          <AnimatedSection delay={100} className="mt-10">
            <div className="rounded-2xl border border-emerald-400/25 bg-[#111118] p-8 shadow-[0_0_40px_rgba(52,211,153,0.08)]">
              <div className="flex items-center justify-center gap-2 text-emerald-400">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.25em]">Free to Use</span>
              </div>
              <h3 className="mt-4 text-2xl font-extrabold text-white">Currently $0 forever</h3>
              <p className="mx-auto mt-2 max-w-md text-[14px] text-white/55">
                Unlimited projects, all AI models, online IDE, version control and community docs — all included while we are free. No limitations.
              </p>
              <a href="/chat" className="group mt-6 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-[13px] font-bold text-[#0a0a0f] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                Start Building Now
                <Sparkles className="h-3.5 w-3.5" />
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════ FAQ ═══════ */}
      <section className="border-t border-white/[0.06] px-6 py-24">
        <div className="mx-auto max-w-2xl">
          <AnimatedSection className="text-center">
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#22d3ee]">FAQ</span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight md:text-4xl">Frequently asked questions</h2>
          </AnimatedSection>
          <div className="mt-10 rounded-2xl border border-white/[0.09] bg-[#111118] px-6">
            {FAQ.map((item, i) => (
              <FAQItem key={i} item={item} isOpen={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ CTA ═══════ */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <AnimatedSection>
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">Ready to build something amazing?</h2>
            <p className="mt-4 text-[14px] text-white/45">Join thousands of creators building plugins and mods without limits</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <a href="/chat" className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-[13px] font-bold text-[#0a0a0f] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                Start Building Now
                <Sparkles className="h-3.5 w-3.5" />
              </a>
              <a href="https://discord.gg/FD6QrzeATb" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-6 py-3.5 text-[13px] font-medium text-white/80 transition-colors hover:border-white/30 hover:text-white">
                <MessageCircle className="h-4 w-4" />
                Join Our Discord
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="border-t border-white/[0.06] px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-4 text-[12px] text-white/35">
            <a href="/terms" className="hover:text-white/60">Terms of Service</a>
            <a href="/privacy" className="hover:text-white/60">Privacy Policy</a>
          </div>
          <p className="text-[12px] text-white/30">&copy; 2026 Velix AI. Not affiliated with Mojang or Microsoft.</p>
        </div>
      </footer>
    </main>
  );
}
