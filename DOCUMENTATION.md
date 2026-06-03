# AnyTurn — Technical Documentation

> Interactive, AI-generated picture books for reading together with a child.
> Repository codename: **`skazki`** (`abayserikov-spec/skazki`). Product brand: **AnyTurn**.
> Status of this doc: reflects the codebase as read on 2026‑06‑02, through commit `SKZ-33` (signup/login authentication). Prose is in English; all identifiers, prompts, and log tags match the source. A Russian version can be produced on request.

---

## 1. Overview

AnyTurn generates a personalized, **branching** children's storybook one spread at a time. A parent picks (or writes) a premise; Claude writes each page and offers 2–3 choices that carry a *value* (e.g. courage, selfishness); Gemini renders each page as a full‑bleed watercolor illustration **with the story text painted into the art**; ElevenLabs narrates it. Choices shape the ending (happy / mixed / sad) and feed a per‑session **values report** for the parent. Characters and finished books persist, so a child can reuse a character across stories or continue an old book with a new twist.

**Core loop:** `premise → page text (Claude) → choices → illustration (Gemini) → narration (ElevenLabs) → choice → next page → … → ending → report`.

The product is positioned for the UK market with a freemium model (Free: 3 stories, Family $9/mo, Premium $19/mo).

---

## 2. Tech stack

| Layer | Technology |
|---|---|
| Build | Vite 8 (multi‑page), `@vitejs/plugin-react` |
| Language | TypeScript (strict) — entire `src/` and `api/` are `.ts`/`.tsx` |
| Frontend | React 19, `motion` (Framer Motion), `lucide-react` icons |
| Book rendering | `@vuvandinh203/react-flipbook` |
| Auth | **Supabase Auth** — email/password, Google OAuth, Apple OAuth, magic-link OTP, password reset |
| Text generation | Anthropic **Claude Sonnet 4.6** (`claude-sonnet-4-6`) |
| Image generation | Google **Gemini 3.1 Flash Image** ("Nano Banana 2", `gemini-3.1-flash-image-preview`) — *plus an optional OpenAI **GPT Image 2** path (`gpt-image-2`) for A/B testing* |
| Narration (TTS) | ElevenLabs (`eleven_flash_v2_5`) |
| Backend | Vercel serverless functions (`api/*`), region `iad1`, `maxDuration: 60s` |
| Persistence | Supabase (Postgres + Storage); `localStorage` for preferences/session cache only |
| Fonts | **Sassoon Primary** (`public/fonts/sassoon-primary.otf`) — early‑reader handwriting font, embedded into illustrations |

---

## 3. Repository layout

```
index.html              ← Landing page entry (marketing)
app/index.html          ← Product (React app) entry  [was app.html]
vite.config.ts          ← Multi-page build (main + app) + dev proxies
vercel.json             ← Function config (60s, iad1) + legacy rewrites

api/                     ← Vercel serverless proxies
  anthropic.js           ← Claude text proxy (key: ANTHROPIC_API_KEY)
  gemini.js              ← Gemini image proxy (model preset system)
  openai-image.js        ← GPT Image 2 proxy (A/B alternative to gemini.js)
  elevenlabs.js          ← ElevenLabs pass-through proxy (TTS)
  migrate.js             ← One-shot DB migration via Supabase Management API
  render-text.js         ← ⚠️ DEPRECATED/broken (server-side canvas, missing dep)

supabase/
  migrations/
    001_init.sql         ← Full schema: users/children/characters/books/book_pages/book_values + RLS

src/
  main.tsx               ← React bootstrap (mounts <App/> on #root)
  App.tsx                ← Path-based routing: /app → Dashboard, /app/login, /app/register, else Landing
  index.css              ← Global CSS reset / Tailwind base

  pages/
    dashboard/index.tsx  ← Thin shell: loads AppProvider + Dashboard
    login/index.tsx      ← Email+password login, forgot-password flow, OAuth buttons
    register/index.tsx   ← Email+password signup, OAuth buttons; shows "check inbox" on success
    landing/index.tsx    ← Marketing landing page

  context/
    AppContext.tsx        ← Global state: view routing, user/dbUser, prefs, children (DB-only), library
    StoryContext.tsx      ← Active story session orchestration (the engine)

  views/                 ← Screens (selected by AppContext.view)
    AuthView.tsx           legacy name-only quick-start (kept for fallback)
    DashboardView.tsx      child selector, new session, nav, Settings
    SetupView.tsx          premise selection / art style
    SessionView.tsx        interactive reading + flipbook + choices
    ReportView.tsx         post-session values report
    LibraryView.tsx        saved books → ReadingView
    ReadingView.tsx        read a finished book (flipbook)
    CharactersView.tsx     manage reusable characters

  components/
    BookPage.tsx           single flipbook page (full-bleed image)
    SettingsPanel.tsx      image-model A/B selector (Gemini presets)
    UI.tsx                 design tokens (T), shared CSS, primitives
    AnimIn.tsx             fade-in-up animation wrapper
    AuthButton.tsx         OAuth/email button with icon + animation
    AuthCard.tsx           card container for auth pages
    AuthLayout.tsx         centered layout wrapper for login/register
    reactbits/             BlurText, GradientText, ShinyText (animated text)

  hooks/
    useTTS.ts              ElevenLabs narration + caching
    useStyleRefs.ts        mood → style reference image
    useBookFlip.ts         auto-flip flipbook to the latest spread

  lib/
    auth.ts                signInWithGoogle/Apple/Email, signInWithPassword, signUpWithEmail, resetPassword
    constants.ts           CLAUDE_MODEL, TOTAL_PAGES, VALS, ART_STYLES, I18N
    ai.ts                  barrel re-export of ai/*
    ai/story-gen.ts        Claude page generation (genPage)
    ai/image-gen.ts        Gemini image generation (all gen* functions)
    ai/text-render.ts      Sassoon text → canvas → base64 (client-side)
    ai/image-utils.ts      browser-side reference-image compression
    supabase.ts            Supabase client (null if env missing)
    db.ts                  All Supabase queries (users/children/books/characters)
    storage.ts             localStorage helper (ST, prefix "skazka_")
    storage-cloud.ts       upload illustrations/portraits to Supabase Storage
    types.ts               Shared TypeScript interfaces

public/
  fonts/sassoon-primary.otf
  style-refs/ref-0X-*.png  ← 6 watercolor style anchors (per mood)
  landing-media/*          ← marketing assets

test_single.js, test_text_ref.js  ← ad-hoc Node test scripts
```

**Total source:** ~8,500 LOC across `src/` and `api/`.

---

## 4. Architecture

### 4.1 Two entry points
`vite.config.ts` builds two HTML pages. `App.tsx` inspects `window.location.pathname`:
- `/app` or `/app/` → `<AppProvider><Dashboard/>` (the product).
- `/app/login` → `<Login>` — redirects to `/app` immediately if `skazka_user` is already in localStorage.
- `/app/register` → `<Register>` — same guard.
- anything else → `<Landing>` (marketing).

### 4.2 Authentication flow
`src/lib/auth.ts` wraps all Supabase Auth calls:
- **`signUpWithEmail(name, email, password)`** — calls `supabase.auth.signUp`, detects duplicate emails via `identities.length === 0` (Supabase hides duplicates when email confirmation is on), returns `{ needsConfirmation: boolean }`. If `needsConfirmation` is false (auto-confirm enabled), the register page skips the "check your inbox" message and relies on the auth state change listener.
- **`signInWithPassword(email, password)`** — calls `supabase.auth.signInWithPassword`; on success the login page calls `window.location.replace('/app')`. `AppContext` init picks up the live Supabase session and bootstraps the user.
- **`signInWithGoogle / signInWithApple`** — OAuth redirect to `/app`.
- **`signInWithEmail(email)`** — magic-link OTP (passwordless).
- **`resetPassword(email)`** — sends a reset link redirecting to `/app/reset-password`.

### 4.3 View routing (within the product)
There is no router library. `AppContext.view` is a string; the dashboard shell switches on it:

```
loading → auth → dashboard → { setup | session | report | library | characters }
```
`auth` renders `<AuthView>` (legacy quick-start); **all other views are wrapped in `<StoryProvider>`**. In practice, users enter through `/app/login` or `/app/register` and land directly at `dashboard` once Supabase session is established.

### 4.4 Two React contexts
- **`AppContext`** — app‑global, persistent state: `view`, `user`/`dbUser`, `lang`, `artStyle`, `geminiModel`, `childrenList`, `activeChild`, `characters`, `selectedChars`, `library`, `sessions`, plus actions (`register`, `logout`, `addChild`, `refreshLibrary`, `refreshCharacters`, `toggleLang`, `saveArtStyle`, `saveGeminiModel`) and the i18n dictionary `L`. On mount: hydrates prefs from `localStorage`, calls `supabase.auth.getSession()` to restore user, then `ensureUser` → loads children from DB + library.
- **`StoryContext`** — the per‑session engine: current page/image, loading flags, picks history, the generation `useEffect`s, and the actions `startSession`, `pickChoice`, `submitCustom`, `continueSession`, `finishSession`, `generatePresets`, `getVals`. It composes three hooks (`useTTS`, `useStyleRefs`, `useBookFlip`).

### 4.4 Data‑flow at a glance
```
SetupView ─startSession()→ StoryContext
   │
   ├─ createBook() ───────────────→ Supabase (books)
   ├─ genPage() ──→ /api/anthropic ─→ Claude        (page text + scene + choices)
   │
   ▼ setCurPage() triggers image useEffect
   ├─ (first page) genCharPortrait()×N in parallel ─→ /api/gemini
   ├─ genBookSpread() / genFirstBookSpread() ───────→ /api/gemini   (illustration)
   │       └─ renderTextRef()/renderSpreadTextRef() builds the text image client-side
   ▼ image shown in SessionView (flipbook)
   ├─ auto-TTS via useTTS ──────────→ /api/elevenlabs
   │
   └─ pickChoice() ─ savePage() ─ uploadIllustration() ─→ Supabase (Storage + book_pages)
            └─ genPage(next) … (may introduce newMainCharacter → genNewCharPortrait)
   …
finishSession() ─ finalizeBook() + saveBookValues() + updateCharacterAfterStory() → ReportView
```

---

## 5. The generation pipeline (the heart of the app)

A single page is produced by **two model calls plus a client‑side canvas step**, in this order:

### 5.1 Step 1 — Page text (Claude)
`genPage(ctx)` in `ai/story-gen.js` builds a large system prompt that encodes:
- **Age‑adaptive writing rules** (`getAgeWritingStyle`) — four bands (≤4, ≤5, ≤7, 8+) controlling sentence length, vocabulary, sound effects, and choice complexity.
- **Character continuity** — on page 1 it asks for a `characterDesc` (pipe‑separated visual descriptions) + `characterName`; on later pages it asks for `newMainCharacter`/`newCharacterName` whenever a new interacting character appears.
- **Camera direction** — a `CAMERA_SEQUENCE` is rotated so consecutive pages never repeat a shot.
- **Text‑zone direction** — Claude returns a `textZone` (e.g. `top-left`, `overlay-bottom`) and an `intensity` (0–100) chosen to place text over negative space.
- **Ending logic** — on the last page (`TOTAL_PAGES = 6`) the ending is good/mixed/sad based on the tally of positive vs negative choice values.
- **Copyright guard** — if the child names a franchise character, Claude is told to invent an *original* inspired character.

Returns strict JSON: `{ text, mood, scene, cameraAngle, textZone, intensity, sceneSummary, actionSummary, [characterDesc, characterName | newMainCharacter, newCharacterName], choices | isEnd+ending, title, sfx, tts_text, [storySummary] }`.

### 5.2 Step 2 — Text reference image (client canvas)
`renderTextRef(text, opts)` in `ai/text-render.js` loads Sassoon Primary via the `FontFace` API, word‑wraps the text, and draws it to a `<canvas>`, returning a base64 PNG. Text color is chosen by `getTextColor(intensity, textZone)` (white on dark/overlay or high‑intensity scenes, dark ink otherwise).

For **spreads**, `renderSpreadTextRef(left, right)` renders two blocks and stitches them onto one canvas with a gutter gap; `splitTextForSpread(text)` splits the page text at a sentence boundary near the midpoint (word‑boundary fallback).

> **Why this exists:** image models mangle arbitrary text and pick their own fonts. Rendering the exact words in the exact early‑reader font on a canvas, then asking the image model to *reproduce* that reference, gives precise control over font and wording. This is a deliberate design choice, not a workaround to remove.

### 5.3 Step 3 — Illustration (Gemini)
`genBookSpread(...)` (current main path; `genBookPage` is the older single‑page variant) assembles a prompt from:
1. **Style** — either the inline `STYLE_ANCHORS[artStyle]` text prompt *or*, when no portraits exist yet, a compressed **style reference image** + `STYLE_REF_INSTRUCTION`.
2. **Spread composition rules** — keep the central gutter (~8% each side of center) free of faces/text; one continuous scene across both pages.
3. **Scene** — the 40–80‑word cinematic description from Claude.
4. **Character instruction** — when portraits exist: *"keep ALL characters from portrait reference images with identical appearance."*
5. **Text‑zone instruction** — from `SPREAD_ZONE_INSTRUCTIONS` (or `TEXT_ZONE_INSTRUCTIONS` for single pages) telling the model where the reference text blocks go.
6. **Reference images** (order matters): `[textRef, (styleRef?), ...portraits]`, all compressed to 512px JPEG via `compressRefs`.

All image calls funnel through **`geminiGenerate(prompt, refs, aspectRatio, label)`** (see §6.2).

### 5.4 Character consistency
- **Page 1:** `characterDesc` is split on `|`; one `genCharPortrait` call per character runs **in parallel** (`Promise.all`). The generated portraits become the reference set carried into every subsequent spread.
- **New characters mid‑story:** when Claude returns `newMainCharacter`, `genNewCharPortrait` makes a portrait that is appended to `portraitUrls`, and (if logged in) a `characters` row is created and cross‑linked to the existing companions.
- Optimization: once portraits exist, the **style reference image is dropped** (portraits + the style‑anchor text already lock the look), saving one reference image per page.

### 5.5 Persistence during a session
On each choice, `pickChoice` calls `savePage` (which `upsert`s a `book_pages` row and, on page 1, sets the book cover) after `uploadIllustration` copies the base64 image into Supabase Storage. `finishSession` writes the final page, `finalizeBook` (ending/duration/page count), `saveBookValues`, and `updateCharacterAfterStory` (increments stories, merges choice tallies, appends to the 5‑entry `story_arc`).

---

## 6. AI modules reference (`src/lib/ai/`)

### 6.1 `story-gen.ts`
- `genPage(ctx)` → `Promise<parsedPage>`. `ctx`: `{ name, age, theme, history[], choice, charDesc, backstory, lang, identityTag, previousArc }`. Posts to `/api/anthropic` with `max_tokens: 1500`. Robust JSON parsing (strips code fences, falls back to first `{…}` match). Fills sane defaults for `textZone`/`intensity`.

### 6.2 `image-gen.ts`
**Core call**
```js
geminiGenerate(prompt, referenceImages=[], aspectRatio="3:4", label="unknown")
```
- Posts `{ prompt, referenceImages, aspectRatio, imageSize:"1K" }` to **`endpoint`**.
- **Endpoint selection:** `localStorage.imageProvider === "openai"` → `/api/openai-image`, else `/api/gemini`.
- **Model header:** forwards `x-gemini-model` from `localStorage.geminiModel`.
- **Retry:** `RETRY_DELAYS_MS = [0, 1500, 4000]`; retryable = HTTP `5xx` or `429`. Each attempt has its own `AbortController` at `PER_ATTEMPT_TIMEOUT_MS = 55_000` (just under Vercel's 60s, so the client retries instead of getting a 504).
- Returns a `data:` URL string, or `null` after exhausting retries.
- Rich console logging under `[IMG-GEN]`.

**Generation functions** (all return a `data:` URL or `null`):

| Function | Aspect | Purpose |
|---|---|---|
| `genCharPortrait(charDesc, scene, artStyleKey, opts)` | `1:1` | Solo character portrait (reference for consistency) |
| `genNewCharPortrait(newCharDesc, artStyleKey, opts)` | `1:1` | Portrait for a newly introduced character |
| `genFirstBookSpread(scene, charDesc, artStyleKey, pageText, textZone, intensity, opts)` | `3:2` | **Opening spread** (no portraits yet) |
| `genBookSpread(scene, charDesc, portraitUrls, artStyleKey, pageText, textZone, intensity, opts)` | `3:2` | **Subsequent spreads** (current main path) |
| `genFirstBookPage` / `genBookPage` | `3:4` | Older single‑page variants (text embedded) |
| `genFirstImage` / `genNextImage` | `3:4` | **Legacy** text‑less scene generation |
| `addCharToPortrait(existing, newCharDesc, …)` | `1:1` | ⚠️ **No‑op** — ignores `existing`, just calls `genNewCharPortrait` |

`opts.styleRefUrl` provides the per‑mood style reference. Exports also include `STYLE_ANCHORS` (`book`/`anime`/`realistic` style prompts) and `STYLE_REF_INSTRUCTION`.

### 6.3 `text-render.ts`
- `renderTextRef(text, { color, bgColor, fontSize=44, maxWidth=600 })` → base64 PNG (client canvas, Sassoon Primary with Nunito fallback).
- `getTextColor(intensity, textZone)` → `#FFFFFF` for overlay/high‑intensity, else `#2C1810`.

### 6.4 `image-utils.ts`
- `compressForRef(src, { maxSize=512, quality=0.85 })` → downscaled JPEG `data:` URL (8s safety timeout; falls back to original on failure). ~10× payload reduction vs raw PNG.
- `compressRefs(sources, opts)` → parallel `compressForRef`.

---

## 7. Serverless API reference (`api/`)

All functions set permissive CORS (`Access-Control-Allow-Origin: *`) and key off env vars (with a legacy client‑header fallback — see §13).

### 7.1 `POST /api/anthropic`
Proxy to `https://api.anthropic.com/v1/messages`. Body: `{ model, max_tokens, system, messages, temperature }`. Adds `anthropic-version: 2023-06-01`. Returns `{ content, usage, model, stop_reason }`. Key: `ANTHROPIC_API_KEY`.

### 7.2 `POST /api/gemini`
Proxy to Gemini `:generateContent`. Body: `{ prompt, referenceImages[], aspectRatio, imageSize }`. Reference images that are `data:` URLs are inlined; `http(s)` URLs are fetched server‑side and base64‑encoded. Returns `{ text, imageBase64, mimeType, usage, modelUsed, presetUsed }`. Key: `GEMINI_API_KEY`. **Model preset** chosen by priority: `x-gemini-model` header → `GEMINI_MODEL` env → `nb2-default`:

| Preset key | Model ID | thinkingLevel | tools |
|---|---|---|---|
| `nb2-default` | `gemini-3.1-flash-image-preview` | (default) | unset |
| `nb2-minimal` | `gemini-3.1-flash-image-preview` | `minimal` | `[]` |
| `nb1` | `gemini-2.5-flash-image` | (default) | `[]` |

Logging under `[GEMINI]` — note `google API call <ms> status=<code>` is the key line for diagnosing latency/quota.

### 7.3 `POST /api/openai-image`  *(A/B alternative)*
Proxy to OpenAI **GPT Image 2**. Same request/response **contract as `/api/gemini`**, so the client switches by endpoint only. Routing inside: references present → `POST /v1/images/edits` (multipart, refs as `image[]`); none → `POST /v1/images/generations` (JSON). Aspect → size map: `1:1→1024x1024`, `3:2→1536x1024`, `3:4→1152x1536`. Returns `{ imageBase64, mimeType, usage, modelUsed }`. Keys/config: `OPENAI_API_KEY` (required), `OPENAI_IMAGE_MODEL` (default `gpt-image-2`), `OPENAI_IMAGE_QUALITY` (default `medium`). Logging under `[OPENAI-IMG]`. See §8.3 for usage.

### 7.4 `ANY /api/elevenlabs/*`
Path pass‑through to `https://api.elevenlabs.io/*` (also configured as a `rewrite` in `vercel.json` and a dev proxy in `vite.config.js`). Streams audio bodies through. Key: `ELEVENLABS_API_KEY` (client `xi-api-key` fallback).

### 7.5 `POST /api/render-text`  ⚠️ deprecated/broken
Server‑side text rendering using the `canvas` npm package — **but `canvas` is not in `package.json`**, so this endpoint will throw at runtime. Text rendering is done **client‑side** in `ai/text-render.js`; this file is dead and can be removed.

---

## 8. Model configuration & A/B switching

### 8.1 Switches summary
| Switch | Where | Values | Effect |
|---|---|---|---|
| Image **model** | `localStorage.geminiModel` (+ Settings UI) | `nb2-default` / `nb2-minimal` / `nb1` | Sent as `x-gemini-model`; selects a Gemini preset |
| Image **provider** | `localStorage.imageProvider` | `gemini` (default) / `openai` | Routes `geminiGenerate` to `/api/gemini` or `/api/openai-image` |
| Text model | `CLAUDE_MODEL` (constant) | `claude-sonnet-4-6` | Hard‑coded; no runtime switch yet |

`AppContext` mirrors `geminiModel` into `localStorage` so `image-gen.js` can read it synchronously. The Settings UI (`SettingsPanel.tsx`) currently exposes **only the Gemini presets**.

### 8.2 A/B testing the Gemini presets
Open Settings → choose a preset. Watch the DevTools console for `preset=…` and the `[GEMINI] google API call <ms>` timing line.

### 8.3 A/B testing GPT Image 2
1. Set `OPENAI_API_KEY` in Vercel env and redeploy. (GPT Image 2 may require OpenAI **org verification**; a 403/model‑not‑found means that.)
2. In the browser console: `localStorage.setItem('imageProvider','openai')`. Generate a story; the whole pipeline (portraits + spreads) routes through GPT Image 2. Revert with `localStorage.removeItem('imageProvider')`.
3. Keep `OPENAI_IMAGE_QUALITY=medium` — `high` + reasoning can exceed the 60s function timeout. If edits are slow, set `thinking: low` in `api/openai-image.js`.
4. **Caveat:** the canvas text‑reference is treated as an edit input by OpenAI and may not reproduce identically; for a pure illustration‑quality comparison, leave the pipeline as‑is. The provider switch is **not** in the Settings UI yet (console/localStorage only).

---

## 9. Data model (Supabase)

Schema defined in `supabase/migrations/001_init.sql`. All write paths are no‑ops when the Supabase client is `null` (env missing), so the app degrades to local‑only. **RLS is enabled on every table.**

**`users`** — `id UUID PK = auth.uid()` (FK → `auth.users`), `email` (unique), `name`, `created_at`. `ensureUser` looks up/inserts by `id = auth.uid()` so the RLS policy `id = auth.uid()` works correctly. Children are linked here.
**`children`** — `id`, `user_id→users`, `name`, `age`, `created_at`. RLS: `user_id = auth.uid()`. **Children are stored DB-only — no localStorage fallback.**
**`books`** — `id`, `child_id→children`, `character_id→characters?`, `title`, `premise`, `art_style`, `lang`, `ending_type` (good/mixed/sad), `duration_seconds`, `page_count`, `cover_image_url`, `created_at`
**`book_pages`** — `id`, `book_id→books`, `page_number`, `title`, `text`, `tts_text`, `scene`, `scene_summary`, `action_summary`, `mood`, `image_url`, `sfx`, `choice_label`, `choice_value`, `is_end`. **Unique `(book_id, page_number)`** (upsert on conflict).
**`book_values`** — `id`, `book_id→books`, `value_key`, `count`
**`characters`** — `id`, `child_id→children`, `name`, `description`, `portrait_url`, `art_style`, `companion_ids` (uuid[]), `stories_count`, `total_choices` (jsonb map), `story_arc` (text[], last 5), `last_used_at`, `created_at`

**Storage buckets**
- `illustrations` → `{bookId}/page_{n}.{png|webp}`
- `portraits` → `{childId}/{characterId}.{png|webp}`

> Deletes rely on **cascade** (`deleteBook` deletes pages + values; set up FK `ON DELETE CASCADE` accordingly).

**Values taxonomy** (`constants.js` `VALS`): 8 positive (generosity, empathy, courage, curiosity, kindness, honesty, patience, teamwork) and 8 negative (selfishness, cowardice, cruelty, greed, laziness, dishonesty, aggression, indifference), each with RU/EN labels and a color.

---

## 10. State management inventory

**`AppContext`**: `view`, `user`, `dbUser`, `lang` (`ru`/`en`), `artStyle` (`book`), `geminiModel`, `childrenList`, `activeChild`, `characters`, `selectedChars`, `library`, `sessions`, `L`. On mount: reads prefs from `localStorage`, resolves user from `localStorage` cache or live `supabase.auth.getSession()`, then `ensureUser` → loads **children from DB only** (always overwrites the in-memory list, even if empty) → loads library. `addChild` writes to DB only — no localStorage write. Changing `activeChild` reloads that child's characters.

**`StoryContext`** (selected): `theme`, `pages[]`, `curPage`, `curImg`, `imgLoading`, `loading`, `picks[]`, `sel`, `error`, `timer`, `charDesc`, `portraitUrls[]`, `presets[]`, `genStep` (UI progress label: `story`/`portrait(s)`/`page`/`next-page`), `bookId`. Two `useEffect`s drive image generation (first‑page vs subsequent), each with a `cancelled` guard. Several "retroactive" effects backfill the last page's image and upload the first portrait once a character row exists.

---

## 11. Hooks

- **`useTTS()`** → `{ speaking, ttsEnabled, setTtsEnabled, ttsVoice, speakText, stopSpeak, clearCache }`. `speakText` calls `/api/elevenlabs/v1/text-to-speech/{voiceId}` (voice `EXAVITQu4vr4xnSDxMaL`, model `eleven_flash_v2_5`), caches blobs by `voiceId:text`. `ttsEnabled` defaults to **false** (auto‑narration is opt‑in). A `speechSynthesis` voice is also initialized as a fallback path.
- **`useStyleRefs()`** → `{ getStyleRef(mood) }`. Maps `mood` → one of 6 images in `public/style-refs/` via `MOOD_MAP` (`home/school→0`, `forest/city/ocean/sports→1`, `magic/castle/space→4`), preloaded as base64. Falls back to `book` set for unknown styles.
- **`useBookFlip(allPagesLen, viewName)`** → `{ bookRef }`. When a new spread is added during `session`, auto‑flips the flipbook to the latest spread's left page (`(len-1)*2`).

---

## 12. Configuration & environment variables

**Client (Vite, exposed in the bundle — public anon values only):**
| Var | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/publishable key |

**Server (Vercel function env — secret):**
| Var | Default | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | Claude (text) — **required** |
| `GEMINI_API_KEY` | — | Gemini (images) |
| `ELEVENLABS_API_KEY` | — | ElevenLabs (TTS) |
| `OPENAI_API_KEY` | — | GPT Image 2 (A/B; only if used) |
| `GEMINI_MODEL` | `nb2-default` | Server default image preset |
| `OPENAI_IMAGE_MODEL` | `gpt-image-2` | Override OpenAI image model/snapshot |
| `OPENAI_IMAGE_QUALITY` | `medium` | `low`/`medium`/`high` (high risks timeout) |
| `SUPABASE_ACCESS_TOKEN` | — | Supabase Personal Access Token — used by `api/migrate.js` only |
| `MIGRATE_SECRET` | — | Guards the `/api/migrate` endpoint; any random string |

**`localStorage` keys:** `imageProvider`, `geminiModel`, and app prefs under the `skazka_` prefix (`skazka_user`, `skazka_lang`, `skazka_artStyle`, `skazka_geminiModel`, `skazka_sessions`). Note: `skazka_children` is **no longer used** — children are DB-only.

**`vercel.json`:** functions `maxDuration: 60`, region `iad1`; rewrites for `/api/elevenlabs/*` and a **legacy** `/api/replicate/*`. **`vite.config.ts`:** two‑page input + dev proxies for elevenlabs/replicate.

---

## 13. Known issues & technical debt

1. **Unauthenticated, open API proxies.** `api/anthropic.js`, `api/gemini.js`, `api/openai-image.js` use `CORS: *`, have **no auth/JWT check and no rate limiting**, and accept the model API key from the client `Authorization`/`xi-api-key` header (falling back to env). In production the endpoints run on the server's env keys, which means **anyone who finds the URL can generate on the account's keys**. Fix: drop the client‑key path, verify the Supabase JWT inside the function, add per‑user quotas. *(Highest priority.)*
2. ~~**No real authentication.**~~ **Resolved in SKZ-33.** Full Supabase Auth is implemented: email/password signup+login, Google/Apple OAuth, magic-link OTP, password reset. `users.id = auth.uid()`. RLS enabled on all tables. Children are DB-only and scoped to `auth.uid()`. The legacy `AuthView` name-only quick-start remains as a fallback but is no longer the primary path.
3. **Gemini preview rate limits / latency.** `gemini-3.1-flash-image-preview` is a preview endpoint with low, volatile RPM/IPM limits. Parallel page‑1 portrait bursts can trip the per‑minute image quota, producing requests that hang to the 55s client abort (the "minute + retry" symptom). The retry backoff (`[0,1500,4000]ms`) is tuned for transient network errors, not for per‑minute quota windows. Mitigations: enable Cloud Billing (Tier 1), throttle own concurrency, add 429‑aware exponential backoff (respect `Retry-After`), consider a GA/Vertex model.
4. **No prompt caching on Claude.** The `genPage` system prompt (~1.5–2k tokens) is largely static across the 6 pages but billed in full each time. Anthropic prompt caching would cut input cost substantially (see §14).
5. **`api/render-text.js` is broken/dead** — imports `canvas`, which is absent from dependencies. Remove it (rendering is client‑side).
6. **Legacy Replicate plumbing** — `/api/replicate/*` rewrite (`vercel.json`) and dev proxy (`vite.config.js`) remain from the pre‑Gemini image pipeline; remove if unused.
7. **Rebrand gap.** `package.json` name is `skazka-vmeste`, `README.md` and the i18n strings still say "Сказка Вместе / Skazka Together", while the product is **AnyTurn** (the AI module header already reads "ANYTURN v11"). Propagate the rebrand through user‑facing strings and metadata for the UK launch.
8. **`addCharToPortrait` is a no‑op** — it ignores `existingPortraitUrl` and just calls `genNewCharPortrait`. If group composition was intended, it isn't implemented.
9. **Dormant art styles.** `STYLE_ANCHORS`/`I18N` reference `anime` and `realistic`, but only `book` ships (`ART_STYLES`, `SetupView`), and `AppContext` forces `artStyle` back to `book`. Either wire them up or prune the references.
10. **`TOTAL_PAGES = 6` is hard‑coded.** Could become a tier lever (e.g., longer Premium stories).
11. **No persisted cost/usage tracking.** `/api/anthropic` returns `usage` and the Gemini proxy returns `usageMetadata`, but nothing is logged to Supabase, so real per‑story / per‑user COGS is unknown.
12. **GPT Image 2 switch is console‑only** — not surfaced in `SettingsPanel.tsx`.

---

## 14. Cost model (approximate)

Per fully generated 6‑page story (text + ~7 images + narration). Per‑unit prices are approximate and move; verify against current provider pricing.

| Component | Basis | ~ per story |
|---|---|---|
| Text — Claude Sonnet 4.6 | $3 / $15 per 1M (in/out), ~6–7 calls | **~$0.11** |
| Text — *with prompt caching* | −90% on cached input | **~$0.05** |
| Images — Nano Banana 2 | ~$0.04–0.06/image × ~7 | **~$0.35** |
| TTS — ElevenLabs flash v2.5 | per‑character | **~$0.10–0.30** |
| **Total (current stack)** | | **~$0.6–1.0** |

Switching levers: **GPT‑5.5** text ≈ ×2 ($5/$30). **GPT Image 2** ≈ comparable at `medium` (~$0.05/img), but ~×3–4 at `high` (~$0.17–0.21/img). Against a **$9/mo Family** plan, a heavy household (30+ stories/mo) can approach or exceed revenue — hence caching and per‑user quotas matter before adopting pricier models.

---

## 15. Local development & deployment

### Setup
```bash
npm install

# .env — copy from .env.example and fill in:
#   VITE_SUPABASE_URL=...
#   VITE_SUPABASE_ANON_KEY=...
#   ANTHROPIC_API_KEY=sk-ant-...
#   GEMINI_API_KEY=...
#   ELEVENLABS_API_KEY=...           # optional — TTS
#   SUPABASE_ACCESS_TOKEN=...        # optional — migration endpoint only
#   MIGRATE_SECRET=...               # optional — migration endpoint only

npm run dev      # → http://localhost:5173/  (landing)
                 # → http://localhost:5173/app/  (product)
```
Server functions (`api/*`) need their secret env vars. Run via `vercel dev` for full local function support, or test against a deployed preview. Without Supabase env, the app runs without persistence. Without model keys, generation fails with an error.

### First-time database setup
Run the migration once to create all tables and RLS policies:
```bash
# Option A — Supabase SQL editor (paste supabase/migrations/001_init.sql)

# Option B — via the migration API endpoint (requires SUPABASE_ACCESS_TOKEN + MIGRATE_SECRET):
curl -X POST https://your-app.vercel.app/api/migrate \
  -H "x-migrate-secret: <MIGRATE_SECRET>"
```

### Build & deploy
```bash
npm run build    # → dist/ (both index.html and app.html)
npm run preview  # local preview of the build
```
Deployed on **Vercel** (project includes `vercel.json`). Supabase provides Postgres + two Storage buckets (`illustrations`, `portraits`). Set all server env vars in the Vercel dashboard.

---

## 16. Recommended roadmap (prioritized)

1. **Lock down the proxies** (#13.1) — now that Supabase Auth is in place, verify the JWT inside `api/anthropic.js`, `api/gemini.js`, `api/openai-image.js`; drop the client‑key header path; add per‑user rate limits/quotas tied to Free/Family/Premium tiers.
2. ~~**Introduce real auth**~~ — **Done in SKZ-33.** See §4.2.
3. **Add Claude prompt caching** (#13.4) — cache the static `genPage` prefix; roughly halves text COGS.
4. **Build a text‑model router** mirroring the Gemini preset pattern, so Sonnet vs GPT‑5.5 vs Haiku can be A/B‑tested without a redeploy.
5. **Persist usage/cost to Supabase** (#13.11) — know real unit economics before any model change.
6. **Harden Gemini reliability** (#13.3) — billing tier, concurrency throttle, 429‑aware backoff.
7. **Cleanup** — remove `render-text.js` and Replicate plumbing; finish the AnyTurn rebrand; fix or remove `addCharToPortrait` and the dormant art styles; surface the image‑provider switch in Settings.

---

*End of documentation.*
