# Mentora — Interactive AI Engineering Academy

An Astro.js learning platform with an animated Mentora homepage, 11 deep-dive AI engineering courses, original interactive laboratories, and a lesson-aware AI interview tutor through 9router.

**What you get:** An animated Mentora homepage, 11 complete courses, 234 technical lessons (1,404 A–F segments), lesson-title search, saved lesson completion, native lesson routes, original animated course workbooks, and a fixed desktop / slide-out mobile AI tutor backed by a private 9router proxy.

## Screens and features

- `/` — new **Mentora** branded animated homepage: animated learning map, hero, featured learning tracks, learning method, tutor demo, mobile navigation and reduced-motion support.
- `/academy/` — complete learning dashboard containing all 11 courses and progress tracking.
- `/course/<slug>/` — a course outline, lesson status, and the original interactive workbook.
- `/learn/<slug>/<number>/` — full A–F technical explanation, interview questions, deep explanations, spoken interview answer, follow-up drills, production case, takeaways.
- `Cmd/Ctrl + K` — search all lesson titles.
- Right rail — lesson-aware AI interview tutor, SSE streaming, stop generation, and quick study prompts.
- Browser storage — local completion progress only. Conversations are held in the current page session, not written to disk.
- `/api/chat/` — server-only OpenAI-compatible 9router proxy with a message limit, bounded chat history, lexical course retrieval, HTTP origin allowlist, request timeout, and a basic in-memory rate limit.

The **original 11 single-file courses** are preserved in `public/modules/`. Their own animations, graphs, and interactive laboratories remain available by clicking **Open original interactive labs** or **Interactive course**.

## Requirements

- Node.js **22.12+**
- npm (comes with Node)
- A running **9router** instance and a configured OpenAI-compatible model

## Install and run

**Dependency compatibility:** The project pins Astro `6.4.8` and `@astrojs/node` `10.1.4` to compatible majors. The earlier package paired Astro 6 with the Astro 7 adapter, which caused `ERESOLVE` during `npm install`. Use Node.js 22.12+ and reinstall without `--force` or `--legacy-peer-deps`.

On Windows PowerShell, create the `.env` with `Copy-Item .env.example .env` instead of `cp` if preferred.

If you previously attempted an install, delete `node_modules` and `package-lock.json` before rerunning `npm install`.

```bash
npm install
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
  data/courses.json                # 234 full lessons sourced from 11 HTML workbooks
  layouts/AppLayout.astro          # Left navigation, main content, right tutor
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
  search-index.json               # Lightweight searchable titles
  modules/*.html                  # Original offline interactive courses
scripts/check-content.mjs        # Checks course and section integrity
tests/chat.test.mjs              # Server proxy, provenance, history & failure tests
```

## Notes on the design

The attached Vesper.ai reference established the dark, minimal, liquid-metal visual direction. This is a learning platform rather than a single-screen hero reproduction, so the content area scrolls and the AI sidebar remains visible on desktop. On mobile, the AI tutor and curriculum navigation become separate drawers.

**Content provenance:** lesson copy is extracted from the 11 user-provided HTML courses, not newly generated placeholders. All 234 lessons have the original A–F sections. The original HTML source files are retained unmodified.

**Why not a vector DB for tutor context?** The starting corpus is small and already organized by course and lesson. The server includes the active lesson plus a bounded lexical search across nearby material. A vector or hybrid index can be added later for cross-course retrieval quality, but is unnecessary just to ship a functioning website.

## Validation performed while creating this package

- All 11 source HTML course files were found and copied.
- All 234 lesson pages contain 6 non-empty A–F lesson segments (1,404 total).
- The 9router proxy passed 11 unit tests with an injected mock streaming endpoint, including error handling and API-key protection.

**Environment limitation:** package installation and a full `astro build` could not be run in the authoring environment because the npm registry was not reachable. Run `npm install` and `npm run build` in your connected development environment to complete that verification. A live 9router instance was not provided, so real model responses could not be tested.

## Mentora design and motion

The home page uses black/charcoal surfaces, lilac accents, a custom M icon, editorial typography, an original SVG knowledge-map animation, sequential entry motion and scroll-activated section reveals. It is built with ordinary HTML, CSS, and minimal JavaScript: no WebGL, runtime animation library, video, or paid asset dependency. The hero graphic is decorative, not a simulation of a real AI inference model. Motion respects `prefers-reduced-motion` and content remains visible if JavaScript fails.

Navigation is updated so `/` is the public welcome page and `/academy/` is the learning workspace. The `/course/...`, `/learn/...`, `/api/chat/`, and `/api/status` routes are retained. Existing lesson completion data in `localStorage['modelcraft-progress-v1']` is read as a fallback and new changes are saved under `mentora-progress-v1` so updating the project does not discard previous progress.

## Verification status

- **Passed:** 11 existing backend/API tests, 4 new homepage/source tests, all 234 lesson data checks, JavaScript syntax check.
- **Passed:** Chromium DOM/render checks against a static rendering of the homepage at 1440px and 390px, including mobile menu interaction and no horizontal overflow. This is **not** a complete Astro server build.
- **Not verified here:** `npm install`, `astro build`, and the real 9router endpoint. The npm registry could not be reached from the build environment (`EAI_AGAIN`). Version pins stay at Astro 6.4.8 + `@astrojs/node` 10.1.4, an Astro 6 adapter.

To validate on your machine, install dependencies, then run `npm run build` and `npm run dev` as above.
