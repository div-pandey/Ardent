# Ardent — Database Architecture

This document details the Supabase (PostgreSQL) relational database schema, security policies, and the Neo4j graph database data model.

---

## 1. Supabase Schema (PostgreSQL)

The relational database handles user profiles, auth, roadmaps, and all structured feature state.

### 1.1 `profiles`
Central table linked 1:1 with Supabase Auth users.
- `id` (UUID, PK) — References `auth.users(id)`
- `full_name`, `avatar_url`, `bio`, `current_role`, `target_role`, `experience_level`
- `subscription_tier` (TEXT) — Default 'free'. Controls access limits.
- `current_streak`, `longest_streak`, `last_challenge_date` — Gamification state.

### 1.2 `resumes`
Stores uploaded PDFs and the resulting AI-parsed data.
- `id` (UUID, PK)
- `user_id` (UUID, FK)
- `file_url`, `filename`, `mime_type`
- `parsing_status` — 'pending', 'parsing', 'completed', 'failed'
- `parsed_skills`, `parsed_experience`, `parsed_education`, etc. (JSONB)

### 1.3 `roadmaps`
Stores AI-generated learning plans.
- `id` (UUID, PK)
- `user_id` (UUID, FK)
- `target_role`, `target_timeline`, `status`
- `is_active` (BOOLEAN) — Only one roadmap can be active at a time.
- `milestones_data` (JSONB) — The entire nested structure of milestones and daily tasks.

### 1.4 `daily_challenges`
Caches the daily generated micro-challenges per user.
- `id` (UUID, PK)
- `user_id` (UUID, FK)
- `date_ist` (DATE) — Stored in India Standard Time to ensure consistent daily resets.
- `questions` (JSONB) — The array of AI-generated MCQs.
- `is_completed` (BOOLEAN), `score` (INTEGER)

### 1.5 `mock_interviews` & `interview_messages`
Stores the state and chat history of AI interviews.
- **mock_interviews**: `id`, `user_id`, `topic`, `status`, `score`, `feedback` (JSONB)
- **interview_messages**: `id`, `interview_id` (FK), `role` (system/user/assistant), `content`

### 1.6 `scenarios` & `scenario_events`
Stores the state and chat history of "Day in the Life" simulations. Identical structure to interviews.

### 1.7 `certificates`
Stores verifiable completion records.
- `id` (UUID, PK)
- `roadmap_id` (UUID, UNIQUE) — 1 certificate per roadmap.
- `user_id` (UUID, FK)
- `recipient_name`, `roadmap_title`
- `unique_code` (TEXT) — 6-character hex string for public verification.
- `status` ('draft', 'issued')

---

## 2. Row Level Security (RLS)

All tables have RLS enabled to prevent unauthorized access.

### Standard Pattern
Most tables use a simple ownership check:
```sql
CREATE POLICY "Users can view own data" ON public.[table_name] 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can modify own data" ON public.[table_name] 
  FOR UPDATE USING (auth.uid() = user_id);
```

### Exceptions
The `certificates` table has a public view policy to enable the `/verify/[code]` page:
```sql
CREATE POLICY "Anyone can view issued certificates" ON public.certificates
  FOR SELECT USING (status = 'issued');
```

---

## 3. Storage Buckets

### `resumes` Bucket
- **Public:** False
- **RLS:** Users can only upload and read files within their own folder path (`userId/filename.pdf`).

---

## 4. Neo4j Graph Data Model

While Supabase holds structured application state, Neo4j holds the **Career Intelligence Graph**.

### 4.1 Nodes

| Label | Properties | Description |
|---|---|---|
| `User` | `userId`, `name` | The central node representing the logged-in user. |
| `Skill` | `name`, `category`, `difficulty`, `estimatedHours` | A technical or soft skill (e.g., "React", "System Design"). |
| `Role` | `name` | A job title (e.g., "Frontend Developer"). |

### 4.2 Relationships

| Source | Relationship | Target | Properties | Description |
|---|---|---|---|---|
| `User` | `HAS_SKILL` | `Skill` | `proficiency` | Indicates a user possesses a skill. |
| `User` | `CURRENTLY_IN` | `Role` | | The user's current job. |
| `User` | `TARGETS_ROLE` | `Role` | | The user's ultimate career goal. |
| `Role` | `REQUIRES_SKILL` | `Skill` | `importance` | The skills needed for a job. |
| `Role` | `LEADS_TO` | `Role` | `avgTransitionMonths`, `difficulty` | Career progression pathways. |
| `Skill` | `DEPENDS_ON` | `Skill` | | Prerequisite relationships (e.g., React depends on JavaScript). |

### 4.3 Data Synchronization

1. Neo4j is treated as a **read-heavy cache and analysis engine**.
2. When a user uploads a resume, the backend extracts skills, saves them to Supabase, and **immediately fires an asynchronous Cypher query** to `MERGE` those skills onto the User node in Neo4j.
3. The graph is heavily pre-seeded with industry-standard roles and skills to allow immediate pathfinding.

---

> **Continue reading:** [Architecture-API.md](./Architecture-API.md) for API routes and payload contracts.
