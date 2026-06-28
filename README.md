<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/Neo4j-Graph-4581C3?style=for-the-badge&logo=neo4j" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=for-the-badge&logo=supabase" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" />
</p>

<h1 align="center">Ardent — Career Intelligence Platform</h1>

<p align="center">
  <strong>Every career has a path. See yours.</strong><br/>
  Ardent maps the invisible connections between your skills, your goals, and the steps in between.
</p>

---

## What is Ardent?

Ardent is a full-stack **AI-powered career intelligence platform** that combines a **Neo4j knowledge graph**, **Sarvam AI (LLM)**, and **Supabase** to give users a structured, visual, and actionable path from their current role to their dream career. It is not a job board — it is a career operating system.

Users upload their resume, and Ardent automatically extracts their skills, maps them onto a live knowledge graph, generates personalized roadmaps with daily tasks, runs AI mock interviews, simulates "Day in the Life" scenarios, and issues verifiable completion certificates.

---

## Core Features

| Feature | Description |
|---|---|
| **Resume Intelligence** | Upload a PDF resume → AI extracts skills, education, projects, and experience into structured data |
| **Career Knowledge Graph** | Interactive D3.js force-directed graph visualizing skills, roles, and career paths via Neo4j |
| **AI Roadmap Generator** | Generates milestone-based career roadmaps with 12–14 daily tasks per milestone |
| **AI Mentorship (Guide)** | Context-aware AI career coach that references your live graph data |
| **Mock Interviews** | Multi-turn AI interviews with a named interviewer (Priya), scoring, and detailed feedback |
| **Day in the Life Scenarios** | Text-adventure simulations of a typical workday in your target role |
| **Daily Micro-Challenges** | Streak-based quizzes tied to your active roadmap task, with code snippets for paid tiers |
| **Completion Certificates** | Verifiable, PDF-downloadable certificates with unique verification codes |
| **Tiered Subscriptions** | Free / Pro / Max / Enterprise plans with Razorpay payment integration |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Frontend | React 19, Framer Motion, D3.js, Tailwind CSS 4 |
| UI Components | shadcn/ui, Lucide Icons |
| Database (Relational) | Supabase (PostgreSQL + Auth + Storage + RLS) |
| Database (Graph) | Neo4j Aura (Cypher queries) |
| AI Provider | Sarvam AI (`sarvam-105b` reasoning model) |
| Payments | Razorpay |
| PDF Generation | html2canvas + jsPDF |
| State Management | Zustand |
| Form Validation | React Hook Form + Zod |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Neo4j Aura](https://neo4j.com/cloud/aura/) instance
- A [Sarvam AI](https://sarvam.ai) API key
- A [Razorpay](https://razorpay.com) account (for payments)

### Installation

```bash
git clone https://github.com/your-org/ardent.git
cd ardent
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Neo4j
NEO4J_URI=neo4j+s://your-instance.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_password

# Sarvam AI
SARVAM_API_URL=https://api.sarvam.ai
SARVAM_API_KEY=your_api_key

# Razorpay
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_key_id
```

### Database Setup

Run the SQL migrations in order inside your Supabase SQL Editor:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_add_resume_fields.sql
supabase/migrations/003_roadmap_milestones.sql
supabase/migrations/004_daily_challenges.sql
supabase/migrations/005_mock_interviews.sql
supabase/migrations/006_scenarios.sql
supabase/migrations/007_certificates.sql
supabase/migrations/007_resume_generation_limits.sql
supabase/migrations/008_user_preferences.sql
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login, Register, Onboarding
│   ├── (dashboard)/         # All authenticated pages
│   │   ├── home/            # Dashboard with roadmap progress
│   │   ├── graph/           # Career Knowledge Graph (D3)
│   │   ├── roadmap/         # Roadmap viewer + task management
│   │   ├── resume/          # Resume upload + parsing
│   │   ├── guide/           # AI Mentorship chat
│   │   ├── interviews/      # AI Mock Interviews
│   │   ├── scenarios/       # Day in the Life simulations
│   │   ├── challenges/      # Daily Micro-Challenges
│   │   ├── plans/           # Subscription management
│   │   └── settings/        # User preferences
│   ├── api/                 # All backend API routes
│   └── verify/[code]/       # Public certificate verification
├── components/
│   ├── ui/                  # shadcn primitives
│   ├── shared/              # Certificate modal, readiness gauge
│   ├── graph/               # D3 graph renderer
│   └── layout/              # Sidebar, header, navigation
├── lib/
│   ├── neo4j/               # Neo4j driver + query helpers
│   ├── sarvam/              # Sarvam AI client (chat + streaming)
│   ├── supabase/            # Supabase client (browser + server + middleware)
│   ├── parsers/             # PDF text extraction
│   └── tiers.ts             # Central tier configuration
├── services/                # Graph service (Cypher queries)
├── stores/                  # Zustand stores (graph, user)
└── types/                   # TypeScript type definitions
```

---

## Subscription Tiers

| | Starter (Free) | Pro ($15/mo) | Max ($49/mo) |
|---|---|---|---|
| Roadmaps | 3 saved, 1/mo | 15 saved, 5/mo | 100 saved, 25/mo |
| Resume Parses | 5/day | 15/day | 50/day |
| Mock Interviews | 1/mo | 5/mo | Unlimited |
| Scenarios | 1/mo | 5/mo | Unlimited |
| Daily Challenges | 3/day | 5/day (with code) | 5/day (deep-dive) |
| Mentorship | 10 msgs/hr | 50 msgs/hr | Unlimited |
| Certificates | View only | ✅ Generate & Download | ✅ Generate & Download |
| System Design Interviews | ❌ | ❌ | ✅ Exclusive |

---

## Author

**Divyansh** — Founder & CEO of Ardent

---

## License

This project is proprietary software. All rights reserved.
