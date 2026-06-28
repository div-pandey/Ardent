# Ardent — API Architecture

All backend logic in Ardent runs inside Next.js API Routes (Serverless functions) under `/src/app/api/`. Every route relies on the `@supabase/ssr` server client to validate user session cookies.

---

## 1. Security & Rate Limiting

- **Authentication:** Every non-public route starts by validating `supabase.auth.getUser()`. If null, returns `401 Unauthorized`.
- **Tier Configuration:** Limits are centrally defined in `src/lib/tiers.ts`. The API fetches the user's `subscription_tier` from the `profiles` table to determine budget.
- **In-Memory Rate Limiting:** Because Sarvam AI requests are expensive and slow, routes like `/api/guide` and `/api/resume` implement basic in-memory `Map` structures to block spam (e.g., max 10 requests per hour).

---

## 2. Route Directory

### 2.1 `/api/resume`
- **POST**
  - **Accepts:** `multipart/form-data` with a `resume` file (PDF).
  - **Action:** Extracts text, stores PDF in Supabase, prompts Sarvam AI to extract JSON, saves to DB.
  - **Returns:** The structured JSON data.

### 2.2 `/api/graph`
- **GET**
  - **Action:** Returns the full Neo4j graph for the user (`getUserGraph`).
- **POST**
  - **Accepts:** `{ action: 'sync_skills' | 'set_roles' | 'find_paths' | 'skill_gap' | 'recommendations', ...data }`
  - **Action:** Acts as a proxy to `graph.service.ts` to execute Cypher queries.

### 2.3 `/api/roadmap`
- **GET**
  - **Action:** Returns the user's active roadmap.
- **POST**
  - **Accepts:** `{ targetRole: string }`
  - **Action:** Triggers Sarvam AI to generate 4-6 milestones with exactly 12-14 daily tasks based on missing skills.

### 2.4 `/api/guide`
- **POST**
  - **Accepts:** `{ messages: { role: string, content: string }[] }`
  - **Action:** Context-aware chat endpoint. Injects the user's current skills and target role into the system prompt. Uses `chatCompletion`.

### 2.5 `/api/interviews`
- **POST (Start)**
  - **Accepts:** `{ topic: string }`
  - **Action:** Verifies tier limits. Creates a `mock_interviews` row. Returns AI opening greeting.
- **PATCH (Chat / Finish)**
  - **Accepts:** `{ interviewId, message, action? }`
  - **Action:** Progresses the interview. If `action: 'finish'`, prompts the AI to grade the entire transcript and returns a score/feedback JSON.

### 2.6 `/api/scenarios`
- **POST / PATCH**
  - Structurally identical to `/api/interviews`, but with a "game master" system prompt for "Day in the Life" text-adventure simulations.

### 2.7 `/api/challenges`
- **GET**
  - **Action:** Looks up the active roadmap task. Checks if a challenge exists for today (`date_ist`). If not, generates one via Sarvam AI. Returns the challenge.
- **POST**
  - **Accepts:** `{ challengeId, score }`
  - **Action:** Marks challenge as complete. Calculates and updates the user's daily streak.

### 2.8 `/api/certificates`
- **GET**
  - **Query:** `?code=XYZ` (Public) or `?roadmapId=ABC` (Authenticated).
- **POST**
  - **Accepts:** `{ roadmapId, roadmapTitle, recipientName, action: 'issue' | 'draft' }`
  - **Action:** Ensures roadmap is 100% complete. If `action: 'issue'`, generates a unique hex code and locks the record. Free tier is blocked from issuing.

### 2.9 `/api/checkout/razorpay`
- **POST (Create Order)**
  - **Accepts:** `{ planName, isYearly }`
  - **Action:** Calls Razorpay SDK to create an order ID.
- **POST (Verify `/verify`)**
  - **Accepts:** Razorpay signature and payment ID.
  - **Action:** Cryptographically verifies the signature. Updates user's `subscription_tier` in the `profiles` table.

---

> **End of Architecture Documentation.**
