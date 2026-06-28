# Ardent — System Architecture

> **Version:** 1.0 · **Last Updated:** June 28, 2026 · **Author:** Divyansh, Founder & CEO

This document is the definitive technical reference for the Ardent Career Intelligence Platform. It is split across multiple files for readability:

| Document | Contents |
|---|---|
| **Architecture.md** (this file) | System overview, tech stack, high-level design, project structure |
| [Architecture-Features.md](./Architecture-Features.md) | Every user-facing feature explained in depth |
| [Architecture-Database.md](./Architecture-Database.md) | Full database schema, migrations, RLS policies, and data flow |
| [Architecture-API.md](./Architecture-API.md) | Every API route — request/response contracts, rate limiting, auth |

---

## 1. System Overview

Ardent is a **full-stack, AI-powered career intelligence platform** built on Next.js 16 (App Router). It combines three data layers — a **relational database** (Supabase/PostgreSQL), a **graph database** (Neo4j), and a **large language model** (Sarvam AI) — to deliver personalized career planning, skill gap analysis, AI mentorship, mock interviews, scenario simulations, daily challenges, and verifiable completion certificates.

### Core Philosophy

```
Resume Upload → AI Skill Extraction → Knowledge Graph Sync → Skill Gap Analysis
    → AI Roadmap Generation → Daily Tasks & Challenges → Mock Interviews
    → Scenario Simulations → Completion Certificate
```

Every feature feeds into the next. A user's resume populates their graph. The graph powers skill gap analysis. The gap drives roadmap generation. The roadmap fuels daily challenges. Completing a roadmap earns a certificate. The entire system is a self-reinforcing loop of career progression.

---

## 2. High-Level Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                             │
│  Next.js 16 App Router · React 19 · Framer Motion · D3.js · Zustand │
└──────────────────────┬───────────────────────────────────────────────┘
                       │ HTTPS (API Routes)
                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      SERVER (Next.js API Routes)                     │
│  /api/resume · /api/roadmap · /api/graph · /api/guide               │
│  /api/interviews · /api/challenges · /api/scenarios                  │
│  /api/certificates · /api/checkout · /api/auth                       │
└───────┬──────────────────┬──────────────────┬────────────────────────┘
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
│   Supabase   │  │    Neo4j     │  │    Sarvam AI     │
│  PostgreSQL  │  │  Aura Graph  │  │   LLM (105B)     │
│  Auth + RLS  │  │  Cypher Qry  │  │  Chat + Stream   │
│  Storage     │  │  Career Map  │  │  Reasoning Model │
└──────────────┘  └──────────────┘  └──────────────────┘
        │
        ▼
┌──────────────┐
│   Razorpay   │
│   Payments   │
└──────────────┘
```

---

## 3. Technology Stack — Detailed Breakdown

### 3.1 Frontend

| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 16.2.9 | App Router, SSR, API routes, middleware |
| **React** | 19.2.4 | Component rendering, hooks, concurrent features |
| **TypeScript** | 5.x | End-to-end type safety |
| **Tailwind CSS** | 4.x | Utility-first styling with custom design tokens |
| **Framer Motion** | 12.40.0 | Page transitions, micro-animations, stagger reveals |
| **D3.js** | 7.9.0 | Force-directed graph visualization (Career Knowledge Graph) |
| **Lucide React** | 1.18.0 | Icon system (400+ icons) |
| **shadcn/ui** | 4.11.0 | Accessible UI primitives (Button, Dialog, Sheet, Tabs, etc.) |
| **Zustand** | 5.0.14 | Lightweight global state management |
| **React Hook Form** | 7.79.0 | Performant form handling |
| **Zod** | 4.4.3 | Runtime schema validation |
| **next-themes** | 0.4.6 | Theme management (light/dark mode) |
| **Sonner** | 2.0.7 | Toast notification system |

### 3.2 Backend

| Technology | Purpose |
|---|---|
| **Next.js API Routes** | All server-side logic runs as serverless functions inside `/app/api/` |
| **Supabase SSR** | Server-side Supabase client with cookie-based auth |
| **Neo4j Driver** | 6.1.0 — Bolt protocol connection to Neo4j Aura with connection pooling |
| **Sarvam AI Client** | Custom HTTP client for the Sarvam `sarvam-105b` reasoning model |
| **html2canvas** | 1.4.1 — DOM-to-canvas rendering for certificate PDF generation |
| **jsPDF** | 4.2.1 — Canvas-to-PDF conversion |
| **pdfjs-dist** | 6.0.227 — Server-side PDF text extraction for resume parsing |
| **Razorpay SDK** | 2.9.6 — Payment order creation and verification |
| **crypto** | Node.js built-in — Certificate verification code generation |

### 3.3 Infrastructure

| Service | Role |
|---|---|
| **Supabase** | PostgreSQL database, Auth (email/password + OAuth), file storage (resumes), Row Level Security |
| **Neo4j Aura** | Cloud-hosted graph database for career path modeling (User → Skill → Role relationships) |
| **Sarvam AI** | Indian AI provider — powers roadmap generation, resume parsing, mentorship, interviews, scenarios, and challenges |
| **Razorpay** | Indian payment gateway for subscription billing |

---

## 4. Project Structure

```
D:\Ardent\
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth layout group
│   │   │   ├── login/                # Login page
│   │   │   ├── register/             # Registration page
│   │   │   ├── onboarding/           # Post-signup onboarding wizard
│   │   │   └── layout.tsx            # Auth-specific layout (split-screen)
│   │   ├── (dashboard)/              # Authenticated dashboard layout group
│   │   │   ├── home/                 # Main dashboard (roadmap cards, stats)
│   │   │   ├── graph/                # Career Knowledge Graph (D3 visualization)
│   │   │   ├── roadmap/              # Roadmap viewer (milestones, tasks)
│   │   │   ├── resume/               # Resume upload + parsed data viewer
│   │   │   ├── guide/                # AI Mentorship chat interface
│   │   │   ├── interviews/           # AI Mock Interview system
│   │   │   ├── scenarios/            # Day in the Life simulations
│   │   │   ├── challenges/           # Daily Micro-Challenges
│   │   │   ├── paths/                # Career path explorer
│   │   │   ├── progress/             # Progress tracking
│   │   │   ├── plans/                # Subscription & billing management
│   │   │   ├── jobs/                 # Job discovery
│   │   │   ├── settings/             # User preferences
│   │   │   ├── client-layout.tsx     # Dashboard shell (sidebar + header)
│   │   │   └── layout.tsx            # Server layout wrapper
│   │   ├── api/                      # Backend API routes
│   │   │   ├── auth/                 # Auth callback handlers
│   │   │   ├── resume/               # Resume upload + AI parsing
│   │   │   ├── roadmap/              # Roadmap CRUD + AI generation
│   │   │   ├── graph/                # Neo4j graph operations
│   │   │   ├── guide/                # AI mentorship chat
│   │   │   ├── interviews/           # Mock interview management
│   │   │   ├── scenarios/            # Scenario simulation management
│   │   │   ├── challenges/           # Daily challenge generation + scoring
│   │   │   ├── certificates/         # Certificate issuance + verification
│   │   │   ├── checkout/             # Razorpay payment flow
│   │   │   ├── account/              # Account deletion
│   │   │   ├── jobs/                 # Job listings
│   │   │   └── progress/             # Progress data
│   │   ├── verify/[code]/            # Public certificate verification page
│   │   ├── cert-preview/             # Dev-only certificate preview
│   │   ├── page.tsx                  # Landing page (marketing)
│   │   ├── layout.tsx                # Root layout (fonts, theme, metadata)
│   │   └── globals.css               # Design system (40K+ lines of tokens)
│   ├── components/
│   │   ├── ui/                       # 21 shadcn/ui primitives
│   │   ├── shared/                   # Certificate modal, readiness gauge
│   │   ├── graph/                    # D3 graph renderer component
│   │   ├── layout/                   # Sidebar, header, mobile nav
│   │   ├── guide/                    # Mentorship chat UI
│   │   ├── resume/                   # Resume parser UI components
│   │   ├── roadmap/                  # Roadmap viewer components
│   │   ├── paths/                    # Career path explorer UI
│   │   └── progress/                 # Progress tracking UI
│   ├── lib/
│   │   ├── neo4j/driver.ts           # Neo4j connection + read/write helpers
│   │   ├── sarvam/client.ts          # Sarvam AI chat + streaming client
│   │   ├── supabase/                 # Supabase clients (browser, server, middleware)
│   │   ├── parsers/                  # PDF text extraction (pdfjs-dist)
│   │   ├── tiers.ts                  # Central tier config (limits, resources)
│   │   ├── constants.ts              # App-wide constants
│   │   ├── motion.ts                 # Framer Motion animation presets
│   │   └── utils.ts                  # Utility functions (cn, etc.)
│   ├── services/
│   │   └── graph.service.ts          # All Neo4j Cypher operations
│   ├── stores/
│   │   ├── graph.store.ts            # Zustand store for graph state
│   │   └── user.store.ts             # Zustand store for user session
│   ├── types/
│   │   ├── graph.types.ts            # GraphNode, GraphEdge, CareerGraph
│   │   ├── database.types.ts         # Supabase-generated DB types
│   │   └── api.types.ts              # API request/response types
│   ├── styles/                       # Additional style modules
│   └── middleware.ts                 # Auth middleware (route protection)
├── supabase/
│   └── migrations/                   # 9 SQL migration files
├── neo4j/                            # Neo4j seed data / scripts
├── public/                           # Static assets
├── package.json                      # Dependencies
└── tsconfig.json                     # TypeScript configuration
```

---

## 5. Authentication & Middleware

### 5.1 Auth Flow

Ardent uses **Supabase Auth** with email/password and OAuth providers. The flow is:

1. User visits `/register` → creates account via Supabase Auth
2. Supabase trigger `handle_new_user()` auto-creates a `profiles` row
3. User is redirected to `/onboarding` (multi-step wizard)
4. After onboarding, `onboarding_completed` is set to `true`
5. All subsequent requests pass through the Next.js middleware

### 5.2 Middleware Logic (`src/middleware.ts`)

```
PUBLIC_ROUTES: ['/', '/login', '/register']
AUTH_ROUTES:   ['/login', '/register']

For every request:
  1. Call updateSession() → refresh Supabase auth cookies
  2. If user IS authenticated AND on an auth page → redirect to /home
  3. If user is NOT authenticated AND not on a public page → redirect to /login
```

The middleware matcher excludes static assets, images, and `/api/auth` callbacks.

### 5.3 Supabase Clients

Three separate Supabase client factories exist:

| Client | File | Used In |
|---|---|---|
| **Browser Client** | `lib/supabase/client.ts` | Client components (React) |
| **Server Client** | `lib/supabase/server.ts` | API routes, Server Components |
| **Middleware Client** | `lib/supabase/middleware.ts` | Next.js middleware only |

Each uses cookie-based session management via `@supabase/ssr`.

---

## 6. AI Provider — Sarvam AI

### 6.1 Client Architecture (`src/lib/sarvam/client.ts`)

Ardent uses **Sarvam AI** as its sole LLM provider. The client supports two modes:

| Mode | Function | Use Case |
|---|---|---|
| **Synchronous** | `chatCompletion()` | Roadmap generation, resume parsing, challenges |
| **Streaming** | `chatCompletionStream()` | Real-time mentorship chat |

**Model:** `sarvam-105b` (reasoning model)

### 6.2 Reasoning Model Handling

Sarvam's reasoning model splits output into:
- `reasoning_content` — internal chain-of-thought (hidden from user)
- `content` — the final answer

The client handles edge cases where the model exhausts its token budget on reasoning:
1. If `content` exists → use it directly (strip any `<think>` tags)
2. If `content` is null → scan `reasoning_content` for JSON arrays/objects
3. Last resort → extract the final paragraph from reasoning as plain text

### 6.3 Thinking Mode Control

For structured output (JSON generation), thinking mode is **disabled** via:
```json
{ "chat_template_kwargs": { "enable_thinking": false } }
```
This prevents the model from wasting tokens on chain-of-thought when we need strict JSON.

---

## 7. Graph Database — Neo4j

### 7.1 Driver Configuration (`src/lib/neo4j/driver.ts`)

- **Connection pooling:** Max 50 connections
- **Timeouts:** 10s connection, 10s acquisition, 30s retry
- **Connection lifetime:** 3 minutes (prevents Aura idle drops)
- **Singleton pattern:** Global driver instance, shared across all requests

### 7.2 Graph Data Model

```
(:User {userId})
    -[:HAS_SKILL {proficiency, updatedAt}]->(:Skill {name, category})
    -[:CURRENTLY_IN]->(:Role {name})
    -[:TARGETS_ROLE]->(:Role {name})

(:Role)-[:REQUIRES_SKILL {importance}]->(:Skill)
(:Role)-[:LEADS_TO {avgTransitionMonths, difficulty}]->(:Role)
(:Skill)-[:DEPENDS_ON]->(:Skill)
```

### 7.3 Graph Operations (`src/services/graph.service.ts`)

| Operation | Cypher Pattern | Purpose |
|---|---|---|
| `getUserGraph()` | `MATCH (u:User)-[r]-(n)` | Fetch entire user graph for D3 rendering |
| `syncUserSkills()` | `MERGE (s:Skill) MERGE (u)-[:HAS_SKILL]->(s)` | Sync resume skills to graph |
| `setUserRoles()` | `MERGE (u)-[:CURRENTLY_IN]->(cr)` | Set current/target role |
| `findCareerPaths()` | `MATCH path = (start)-[:LEADS_TO*1..5]->(end)` | Find all paths between roles |
| `analyzeSkillGap()` | Compare `HAS_SKILL` vs `REQUIRES_SKILL` | Calculate readiness % |
| `getSkillRecommendations()` | Missing skills ordered by `importance` | Suggest what to learn next |

---

## 8. State Management

### 8.1 Zustand Stores

| Store | File | State |
|---|---|---|
| **Graph Store** | `stores/graph.store.ts` | Graph nodes/edges, loading state, selected node |
| **User Store** | `stores/user.store.ts` | User profile, tier, session |

### 8.2 Design Decision

Ardent uses Zustand instead of React Context for two reasons:
1. **No provider nesting** — stores are imported directly, no wrapper components
2. **Selective re-renders** — components subscribe to specific slices, not the entire tree

---

## 9. Design System

### 9.1 Theme

- **Primary color:** Emerald/Teal (`#14B8A6`)
- **Typography:** Inter (sans), JetBrains Mono (code)
- **Dark mode:** Supported via `next-themes` with CSS variables
- **Noise overlay:** Subtle grain texture applied globally for premium feel

### 9.2 Motion System (`src/lib/motion.ts`)

Predefined Framer Motion variants:
- `staggerContainer` / `staggerItem` — sequential reveal animations
- Custom easing curves for page transitions
- Hover effects with physics-based spring animations

### 9.3 Custom Components

| Component | Purpose |
|---|---|
| `TiltCard` | 3D perspective-shift card on mouse hover |
| `Magnetic` | Magnetic cursor-follow effect |
| `AnimatedTestimonials` | Auto-rotating testimonial carousel |
| `ReadinessGauge` | Circular progress indicator for skill readiness |

---

## 10. Deployment Considerations

### Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEO4J_URI
NEO4J_USERNAME
NEO4J_PASSWORD
SARVAM_API_URL
SARVAM_API_KEY
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
NEXT_PUBLIC_RAZORPAY_KEY_ID
```

### Build Command

```bash
npm run build   # Production build
npm run start    # Production server
```

### Important Notes

- All SQL migrations must be executed in the Supabase SQL Editor in numerical order
- Neo4j Aura free tier may require periodic re-activation
- Sarvam AI has a token budget — rate limiters are built into every API route
- The `Brush Script MT` font (used in certificates) must be available on the deployment environment

---

> **Continue reading:** [Architecture-Features.md](./Architecture-Features.md) for a deep dive into every feature.
