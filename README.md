# Velix AI Frontend

Next.js frontend for the Velix AI code generation platform.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Getting Started

```bash
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`.

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | API base path (default: `/api`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `BACKEND_URL` | Backend server URL for API proxy |

## Project Structure

```
src/
  app/              # Next.js pages
    page.tsx        # Home page
    ide/[id]/       # IDE page (chat, files, editor, compile)
    settings/       # Settings page (sidebar nav)
    profile/        # User profile with heatmap
    credits/        # Credit history
    pricing/        # Pricing plans
    community/      # Community page
    images/         # Image generation
    models/         # Model/schematic generation
    terms/          # Terms of Service
    privacy/        # Privacy Policy
    cookies/        # Cookie Policy
    discord/        # Discord redirect
  components/       # Shared components
    AppShell.tsx    # TopHeader, IconRail, Footer, SharedModals
    ChatPanel.tsx   # Chat UI with skill loading
    AuthModal.tsx   # Dynamic OAuth provider modal
    ThemeProvider.tsx # Dark/light theme
    MatrixRain.tsx  # Background effect
    WikiModal.tsx   # Wiki editor
  lib/
    api.ts          # All API functions (auth, image, modelgen, wiki)
    AuthContext.tsx  # Auth state provider
```

## Pages

| Route | Description |
|---|---|
| `/` | Home page with greeting, hero, enterprise branding |
| `/ide/[id]` | Full IDE: chat panel, file explorer, code editor, compile output |
| `/settings` | Sidebar settings: Profile, Account, API Keys (upcoming), Affiliate, Preferences, Appearance, Danger Zone |
| `/profile` | User profile with activity heatmap and project list |
| `/images` | AI image generation (Gemini, NVIDIA, Pollinations.ai fallback) |
| `/models` | AI schematic generation (OpenRouter models, post-processing, procedural fallback) |
| `/pricing` | Pricing plans |
| `/community` | Community page |
| `/credits` | Credit history and transactions |

## Key Features
- Dark/light theme with planet-horizon background
- Live model fetching from NVIDIA (121 models) and OpenRouter (340+ models)
- Skills system for Hytale (5) and Minecraft (4) platforms
- Auto-fallback to free models on generation failure
- Auth via httpOnly cookies with Supabase OAuth
