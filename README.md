# Mentora — Interactive AI Engineering Academy

An Astro.js learning platform with an animated Mentora homepage, 11 deep-dive AI engineering courses, native first-principles learning paths for LLM Foundations, Prompt Engineering, RAG and AI Agents, and a lesson-aware AI interview tutor through 9router.

**What you get:** An animated Mentora homepage, 11 complete courses, 234 technical lessons (1,404 A–F segments), lesson-title search, saved lesson completion, native lesson routes, animated topic-specific diagrams, RAG, prompt-engineering and agent labs, LLM Foundations exercises and capstone, and a fixed desktop / slide-out mobile AI tutor backed by a private 9router proxy.

## Screens and features

- `/` — new **Mentora** branded animated homepage: animated learning map, hero, featured learning tracks, learning method, tutor demo, mobile navigation and reduced-motion support.
- `/academy/` — complete learning dashboard containing all 11 courses and progress tracking.
- `/course/<slug>/` — a native Mentora course outline and lesson progress, with lab links where available.
- `/learn/<slug>/<number>/` — full A–F technical explanation, interview questions, deep explanations, spoken interview answer, follow-up drills, production case, takeaways.
- `Cmd/Ctrl + K` — search all lesson titles.
- Right rail — lesson-aware AI interview tutor, SSE streaming, stop generation, and quick study prompts.
- Browser storage — local completion progress only. Conversations are held in the current page session, not written to disk.
- `/api/chat/` — server-only OpenAI-compatible 9router proxy with a message limit, bounded chat history, lexical course retrieval, HTTP origin allowlist, request timeout, and a basic in-memory rate limit.

The former standalone workbooks in `public/modules/` have been removed. Their 234 A–F lessons are served directly from Mentora routes. LLM Foundations retains its native exercises and capstone. Prompt Engineering adds 30 beginner guides, two animated mechanism views per lesson, 30 prompt workbenches and specialty labs. **RAG now adds 42 topic-specific beginner guides, 84 selectable animated mechanism views (two per lesson), 30 deterministic hands-on labs, eight mathematical lenses, and deeper A–F interview sections.** The RAG syllabus includes chunking, contextual retrieval, embeddings, hybrid retrieval, rerankers, ColBERT, agentic and graph retrieval, evaluation, freshness, security, PDFs and production incidents. AI Agents adds **54 foundational guides, 108 animated mechanism views, 54 deterministic agent engineering labs (ten experiment types), 11 mathematical lenses, and 5 interview questions per lesson**, while preserving all its original A–F deep technical material. Other courses keep their existing content. No links point to deleted workbooks.

### RAG learning path (`/course/rag/`)

Each lesson follows: **plain-language fundamentals → internal data flow → interactive diagram + common failure view → worked production example → trade-offs and checkpoint → A–F technical interview training**. In 30 lessons, a complementary numeric or scenario lab illustrates chunk overlap, reciprocal-rank fusion, ColBERT MaxSim, retrieval precision/recall, vector memory, tenant ACL decisions, index generation publication, PDF table parsing, multi-hop joins or request latency. Labs use invented data and deterministic browser computations; they do not run retrieval or make measured performance claims. Additional resources supplied for the curriculum are linked to the relevant lessons.

The 42 RAG topics and their original deep mechanisms and production incidents are preserved. The A section has five questions, C supplies a topic-specific spoken response, and D includes explicit technical pressure-test criteria. The sidebar and lesson progress continue using the existing Mentora routes. The chat tutor can ground both Teach and Mock Interview modes on RAG foundations.

### AI Agents learning path (`/course/agents/`)

All 54 existing topics are now taught in the sequence **plain-language foundations → three core primitives → two animated mechanism views (working operation and failure/recovery) → worked engineering incident → deterministic hands-on lab → topic-specific checkpoint → A–F technical interviews**. The original mechanism explanations, spoken interview answers, production cases and takeaways remain intact. Section A now has five applied questions and Section D adds explicit expectations for a strong pressure-test answer.

Every lesson has an interactive deterministic lab. The ten exercise types model loop stopping, memory compaction, privilege gates, conditional workflows, tool argument validation, multi-agent critical paths, MCP/function-call/skills/OKF distinctions, ambiguous outcome recovery, verified-task evaluation and token cost. Eleven lessons include qualified formulas with native MathML and LaTeX source. Examples are invented teaching scenarios **not measurements or actual model/tool executions**. The learner can play/pause or step through animated diagrams, select the failure path and examine production trade-offs. Supplied reading links are attached to relevant lessons. Mentora Tutor can retrieve these foundations in Teach and Mock Interview modes.

**Technical caveat:** MCP documentation was checked against its July 2026 stateless specification. Tool descriptions, untrusted knowledge sources and generated code never authorize side effects; only the running host application can do that.

## Requirements

- Node.js **22.22.0+**
- npm (comes with Node)
- A running **9router** instance and a configured OpenAI-compatible model

## Install and run

**Dependency compatibility:** The project specifies Astro `7.4.0` and `@astrojs/node` `11.1.8` in `package.json`. If dependency resolution fails, verify the installed versions and regenerate the lockfile on a connected machine. Use Node.js 22.22.0+ and reinstall without `--force` or `--legacy-peer-deps`.

On Windows PowerShell, create the `.env` with `Copy-Item .env.example .env` instead of `cp` if preferred.

For a reproducible install, keep the included `package-lock.json` and run `npm ci`. If an earlier install is incomplete, remove `node_modules` and run `npm ci` again (do not delete the lockfile).

```bash
npm ci
cp .env.example .env
# Edit .env and set NINEROUTER_API_KEY and NINEROUTER_MODEL.
npm run dev
```

Open **http://localhost:4321** for the animated Mentora homepage, then **http://localhost:4321/academy/** for the learning dashboard.

The site can be explored without 9router, but the AI tutor will show **setup required** until the server configuration is provided.

## Connect 9router

9router exposes an OpenAI-compatible API, usually on `http://127.0.0.1:20128/v1`. See its dashboard (`http://127.0.0.1:20128/dashboard` by default) to generate an API key and select a connected model. Model IDs are configuration-dependent; never assume one exists on your instance.

In `.env`:

```env
NINEROUTER_BASE_URL=http://127.0.0.1:20128/v1
NINEROUTER_API_KEY=YOUR_9ROUTER_ENDPOINT_KEY
NINEROUTER_MODEL=YOUR_AVAILABLE_MODEL_ID
ALLOWED_ORIGINS=http://localhost:4321,http://127.0.0.1:4321
```

Inspect available model IDs (replace the key):

```bash
curl http://127.0.0.1:20128/v1/models -H "Authorization: Bearer YOUR_9ROUTER_ENDPOINT_KEY"
```

**Never use a `PUBLIC_` prefix for the API key.** It must remain server-only. The browser sends requests to `/api/chat/`; the Astro Node server forwards them to 9router. Users never receive your endpoint key.

**Important deployment note:** `127.0.0.1` means the computer or container running the **Astro server**, not the end user's device. When hosting Astro remotely, run 9router on that server or configure an authenticated private network path to a remote 9router. Avoid exposing an unauthenticated 9router API to the public internet.

## Build and deploy

```bash
npm run check:content
npm run test:api
npm run test:site
npm run build
npm run start
```

A Node.js adapter is configured in **standalone** mode. Static course pages are prerendered; only chat and tutor status use on-demand API endpoints.

To set host and port:

```bash
HOST=0.0.0.0 PORT=4321 npm run start
```

If serving from an external domain, set `ALLOWED_ORIGINS=https://your-domain.example` and terminate HTTPS at your reverse proxy. Deploy the `dist/` server and public assets together.

## Security notes before public launch

This is a usable **self-hosted starter application**, not a fully hardened multi-user SaaS. For an internet-facing service with a billable provider key:

1. Add authentication and authorization to `/api/chat/` so your key cannot be used by anonymous visitors.
2. Replace the process-local IP rate limit with a shared, durable limit (e.g. Redis) that works across servers, and add per-user budgets.
3. Add provider quota alerts and abuse monitoring. Do not log sensitive prompts or API keys.
4. Configure HTTPS, deployment-specific allowed origins, and a firewall/private network path to 9router.
5. Treat lesson excerpts as **untrusted course data**: the tutor already labels them as context rather than high-priority instructions. The API does not execute model tool calls.
6. Add proper distributed tracing and user-level cost attribution before large-scale operation.

## Source map

```text
src/
  data/courses.json                # 234 full lessons, now served directly in Mentora
  layouts/AppLayout.astro          # Expandable navigation, main content, right tutor
  components/LLMFoundationsExercises.astro # Native labs and capstone
  components/FoundationLearningPath.astro   # Shared beginner guides and animated mechanism views
  components/RagExercises.astro             # Ten families of RAG teaching labs
  components/RagMath.astro                  # MathML / LaTeX RAG lenses
  data/rag-path.js                         # All 42 RAG first-principles lessons
  data/rag-interviews.js                   # A–F question and spoken-answer enrichment
  data/rag-labs.js                         # Lab-to-lesson mappings
  data/rag-math.js                         # Retrieval/ANN/ColBERT equations
  pages/index.astro               # Animated public Mentora homepage
  pages/academy/index.astro       # Complete 11-course curriculum dashboard
  pages/course/[slug].astro       # Course landing page
  pages/learn/[course]/[lesson].astro # Deep interview lesson
  pages/api/chat/index.js         # SSE AI chat gateway (on-demand)
  pages/api/status.js             # Shows whether the server has AI credentials
  lib/courses.js                  # Course lookup + bounded lexical retrieval
  lib/chat.js                     # Safe proxying, prompting, validation
  styles/global.css              # Dark learning-workspace design
  styles/landing.css             # Branded, responsive homepage animations
public/
  app.js                          # Client-side search, progress, tutor UI
  llm-foundations-labs.js        # Interactive foundation exercises
  rag-exercises.js               # Deterministic RAG labs (no network calls)
  search-index.json               # Lightweight searchable titles
scripts/check-content.mjs        # Checks course and section integrity
tests/chat.test.mjs              # Server proxy, provenance, history & failure tests
```

## Notes on the design

The attached Vesper.ai reference established the dark, minimal, liquid-metal visual direction. This is a learning platform rather than a single-screen hero reproduction, so the content area scrolls and the AI sidebar remains visible on desktop. On mobile, the AI tutor and curriculum navigation become separate drawers.

**Content provenance:** lesson copy is extracted from the 11 user-provided HTML courses, not newly generated placeholders. All 234 lessons retain their A–F sections. The standalone HTML source files are no longer shipped.

**Why not a vector DB for tutor context?** The starting corpus is small and already organized by course and lesson. The server includes the active lesson plus a bounded lexical search across nearby material. A vector or hybrid index can be added later for cross-course retrieval quality, but is unnecessary just to ship a functioning website.

## Validation performed while creating this package

- The 11 standalone HTML files were removed after their A–F lesson content was retained in `courses.json`.
- All 234 lesson pages contain 6 non-empty A–F lesson segments (1,404 total), including all 60 original LLM Foundations segments.
- All **44 automated checks** pass (33 site + 11 API), including six dedicated RAG checks for content, lessons, labs, equations, provided resources and tutor prompts.

**Environment limitation:** this authoring environment uses Node.js 22.16.0, while Astro 7.4.0 requires Node.js 22.22.0+. `npm ci` did not complete (npm reported an internal exit-handler error after engine warnings), so `astro build` could not be verified. Run `npm ci` and `npm run build` on Node.js 22.22.0+ in your development environment. No live 9router response was tested.

## Mentora design and motion

The home page uses black/charcoal surfaces, lilac accents, a custom M icon, editorial typography, an original SVG knowledge-map animation, sequential entry motion and scroll-activated section reveals. It is built with ordinary HTML, CSS, and minimal JavaScript: no WebGL, runtime animation library, video, or paid asset dependency. The hero graphic is decorative, not a simulation of a real AI inference model. Motion respects `prefers-reduced-motion` and content remains visible if JavaScript fails.

Navigation is updated so `/` is the public welcome page and `/academy/` is the learning workspace. The `/course/...`, `/learn/...`, `/api/chat/`, and `/api/status` routes are retained. Existing lesson completion data in `localStorage['modelcraft-progress-v1']` is read as a fallback and new changes are saved under `mentora-progress-v1` so updating the project does not discard previous progress.

## Verification status

- **Passed:** 44 automated tests, all 234 lesson data checks, JavaScript syntax checks, and comparison of all 60 LLM Foundations A–F sections against their source workbook.
- **Passed:** Chromium DOM/render checks against a static rendering of the homepage at 1440px and 390px, including mobile menu interaction and no horizontal overflow. This is **not** a complete Astro server build.
- **Not verified here:** `astro build` (Astro dependencies are incomplete in this environment) and live 9router responses. See `package.json` for current Astro and adapter versions.

To validate on your machine, use Node.js 22.22.0+, run `npm ci`, `npm run check:content`, `npm run test:api`, `npm run test:site`, and `npm run build`.
