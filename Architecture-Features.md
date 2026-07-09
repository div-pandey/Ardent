# Ardent — Feature Architecture

This document breaks down the implementation details of every user-facing feature in the Ardent platform.

---

## 1. Resume Intelligence

### Goal
Extract structured data from a user's uploaded PDF resume to initialize their career graph.

### Implementation
- **Frontend (`src/app/(dashboard)/resume/page.tsx`)**
  - Uses a standard file input with a hidden drag-and-drop overlay.
  - Submits the PDF via `FormData` to `/api/resume`.
  - Renders the parsed data (skills, experience, education, projects) in an editable form format allowing user corrections before saving.

- **Backend (`src/app/api/resume/route.ts`)**
  1. Checks tier-based rate limits (Free: 3/day, Pro: 15/day, Max: 50/day).
  2. Parses the PDF into raw text using `pdfjs-dist` (server-side).
  3. Uploads the original PDF to Supabase Storage bucket `resumes`.
  4. Inserts a `pending` record into the `resumes` table.
  5. Sends the raw text to Sarvam AI with a strict JSON schema prompt (no thinking mode).
  6. Parses the AI's JSON output, cleans malformed markdown blocks if any.
  7. Updates the `resumes` record with the extracted JSON (skills, experience, etc.) and marks status as `completed`.
  8. Returns the extracted data to the client.

---

## 2. Career Knowledge Graph

### Goal
Provide a visual, interactive representation of the user's skills, current role, and target role.

### Implementation
- **Data Source (`src/services/graph.service.ts`)**
  - Fetches node and edge data from Neo4j via `getUserGraph()`.
  - Node types: `user`, `skill`, `role`, `role_target`, `technology`.
  - Edge types: `HAS_SKILL`, `CURRENTLY_IN`, `TARGETS_ROLE`, `REQUIRES_SKILL`, `LEADS_TO`.

- **Frontend Visualization (`src/components/graph/graph-viewer.tsx`)**
  - Built natively with **D3.js** inside a React `useEffect` hook.
  - Implements a force-directed layout (`d3.forceSimulation`).
  - Forces applied:
    - `forceLink`: Pulls connected nodes together.
    - `forceManyBody`: Pushes all nodes apart (repulsion).
    - `forceCenter`: Keeps the graph centered in the SVG canvas.
  - Features pan, zoom, and drag interactions.
  - Nodes are styled based on their `type` property (e.g., User is large and teal, skills are small and gray).

---

## 3. Skill Gap Analysis & Career Paths

### Goal
Calculate how ready a user is for their target role and show them the stepping stones to get there.

### Implementation
- **Skill Gap (`analyzeSkillGap`)**
  - A Cypher query compares the user's `HAS_SKILL` relationships against the target role's `REQUIRES_SKILL` relationships.
  - Calculates a `readinessScore` percentage.
  - Groups skills into `matchingSkills` and `missingSkills`.

- **Career Paths (`findCareerPaths`)**
  - Uses Neo4j pathfinding: `MATCH path = (start:Role)-[:LEADS_TO*1..5]->(end:Role)`.
  - Returns up to 5 routes, identifying the next immediate role to jump to.
  - Calculates total transition time and aggregate difficulty.

---

## 4. AI Roadmap Generation

### Goal
Generate a structured, actionable, multi-week learning plan to acquire missing skills.

### Implementation
- **Backend (`src/app/api/roadmap/route.ts`)**
  - Takes the user's target role and their calculated `missingSkills`.
  - Prompts Sarvam AI to generate 4-6 milestones.
  - Enforces EXACTLY 12-14 daily tasks per milestone to simulate a 2-week sprint.
  - Saves the generated JSON into the Supabase `roadmaps` table as `milestones_data`.

- **Frontend (`src/app/(dashboard)/roadmap/page.tsx`)**
  - Renders the milestones as collapsible accordions.
  - Tasks can be toggled on/off.
  - Progress bars automatically calculate completion percentage based on checked tasks.

---

## 5. Daily Micro-Challenges

### Goal
Keep users engaged with bite-sized, daily technical questions related to their current roadmap task.

### Implementation
- **Generation (`src/app/api/challenges/route.ts` - GET)**
  - Finds the user's currently active (uncompleted) roadmap task.
  - Prompts Sarvam AI to generate multiple-choice questions specific to that task.
  - Tier logic applies: Free gets text questions, Pro/Max get code-snippet questions (`challengeIncludesCode: true`).
  - Caches the challenge in the `daily_challenges` table for that specific date (IST timezone).

- **Scoring & Streaks (`src/app/api/challenges/route.ts` - POST)**
  - Validates the user's score.
  - Calculates streak logic: if the previous challenge was completed exactly 1 day ago, increment `current_streak`. If > 1 day, reset to 1.
  - Updates `longest_streak` in the `profiles` table.

---

## 6. AI Mock Interviews

### Goal
Simulate real technical interviews with a conversational AI agent.

### Implementation
- **Initialization (`src/app/api/interviews/route.ts` - POST)**
  - Checks monthly tier limits.
  - Generates the opening greeting from the AI (interviewer persona: "Priya").
  - Saves initial system and assistant messages to `interview_messages`.

- **Chat Loop (`src/app/api/interviews/route.ts` - PATCH)**
  - Saves the user's answer.
  - Fetches the entire conversation history.
  - Appends hidden system instructions based on the turn count (e.g., "This is question 3 of 5").
  - Sends the history to Sarvam AI.
  - Saves the AI's response.

- **Completion (`action: 'finish'`)**
  - Generates a final hidden prompt containing the entire transcript, asking for a score (0-100) and detailed feedback.
  - Parses the JSON feedback and updates the `mock_interviews` record.

---

## 7. Day in the Life Scenarios

### Goal
Provide a text-adventure style simulation of a workday in the target role to test situational awareness.

### Implementation
- Nearly identical architectural pattern to Mock Interviews.
- Uses `src/app/api/scenarios/route.ts` and the `scenarios` and `scenario_events` tables.
- System prompt differs: acts as a "game master" rather than an interviewer.
- Complexity level scales by tier (Basic / Moderate / High).

---

## 8. Completion Certificates

### Goal
Reward users who complete 100% of their roadmap tasks with a verifiable PDF certificate, while strictly protecting the exclusivity of the certificate through aggressive anti-theft mechanisms for free users.

### Implementation

- **Roadmap Integration (`src/app/(dashboard)/roadmap/page.tsx`)**
  - The certificate acts as the final "milestone" in the adaptive roadmap timeline.
  - Dynamically switches from a "Locked" state to an "Award" state based on the calculated `completedCount === totalCount` logic.

- **UI & Generation (`src/components/shared/certificate-modal.tsx`)**
  - Renders a visually complex, high-fidelity HTML/Tailwind DOM structure natively in the browser (RedSun/Ovo-RedSun design system aesthetics).
  - Enforces strict absolute bounding boxes (`inset-[36px]`) to ensure the design scales properly without text overflowing the decorative borders on varying screen sizes.
  - Uses `html2canvas` to capture the DOM as a high-fidelity image.
  - Uses `jsPDF` to embed the image into a landscape PDF file and trigger a download.

- **Aggressive Anti-Screenshot & Security Measures**
  - **Clipboard Permission Gate**: Users must explicitly grant clipboard access to view the preview. If denied, the certificate is hidden behind a lock screen.
  - **PrintScreen Interception**: Hooks into `keydown` and `keyup` events. If `PrtScn` is pressed, the screen instantly blacks out and the user's clipboard payload is forcibly overwritten with the text: *"screenshot is prohibited for unverified certificates"*, neutralizing the captured image buffer.
  - **Snipping Tool Defeat (Blur Event)**: Listens to the `window.blur` event. When an OS-level snipping tool is activated (which steals window focus), the certificate instantly blacks out.
  - **Visual Obfuscation**: In preview mode (`draft`), the user's Name and Verification ID are heavily blurred (`blur-[4px]`), and a `z-50` repeating diagonal grid pattern with a "PREVIEW SAMPLE" stamp overlays the entire document.

- **Backend Logic (`src/app/api/certificates/route.ts`)**
  - Validates that 100% of roadmap tasks are marked `done` before allowing issuance.
  - Generates a random 6-character hex string as a `unique_code`.
  - Saves the certificate record to Supabase with status `issued`.
  - *Tier Gate:* Free users can see the certificate modal (with all anti-screenshot measures active), but the POST request to officially issue/download it will fail with a 403 unless they are Pro/Max.

- **Public Verification (`src/app/verify/[code]/page.tsx`)**
  - A publicly accessible Next.js Server Component that fetches the certificate by its unique code.
  - Displays the recipient name, roadmap, and issue date to prove authenticity to employers.

---

## 9. Subscriptions & Billing

### Goal
Monetize the platform via tiered access limits.

### Implementation
- **Configuration (`src/lib/tiers.ts`)**
  - Central source of truth for all limits (max roadmaps, parses per day, feature flags).
- **Payment Gateway (`src/app/api/checkout/razorpay/route.ts`)**
  - Uses Razorpay for order creation.
  - Next.js API generates an `order_id`.
  - Frontend opens the Razorpay modal.
  - Upon success, the frontend calls the verification route to validate the signature using the `crypto` library.
  - If valid, the user's `subscription_tier` in the `profiles` table is upgraded.

---

## 10. UI/UX & Responsive Design

### Goal
Deliver a premium, physics-driven, and highly accessible user interface across all device sizes.

### Implementation
- **RedSun Design System:**
  - Implements a deep dark mode (`#020617` background) with teal (`#14b8a6`) ambient glows (`bg-[radial-gradient]`).
  - Utilizes glassmorphism (`backdrop-blur-xl`, `bg-card/60`) and tactile SVG noise overlays to create depth.
  - Heavy reliance on `framer-motion` for staggered reveals, layout animations, and interactive elements (e.g., magnetic buttons, tilt cards).
- **Mobile Responsiveness (`src/app/(dashboard)/client-layout.tsx`):**
  - Desktop utilizes a collapsible sidebar (`w-64` to `w-16`).
  - Mobile drops the sidebar in favor of a fixed `BottomNav`.
  - The `BottomNav` utilizes a **Shadcn Sheet** drawer for the "More" menu, ensuring all routes (including secondary routes like Settings and Upgrade) remain accessible on small screens without cluttering the bottom bar.
  - Hydration safety is strictly enforced by avoiding nested `<button>` elements inside Base UI triggers.

---

> **Continue reading:** [Architecture-Database.md](./Architecture-Database.md) for database schema and data flows.
