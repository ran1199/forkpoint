@AGENTS.md

# Forkpoint: build prompt for Claude Code

## How to work with me

- I'm a product/UX designer and a complete beginner at coding. I'm on a Mac.
- Explain each step in plain language: what you're doing and why. Tell me exactly what to type or click when you need me to do something (create an account, paste a key, approve a command).
- Build in the **phases** below. **Stop at the end of each phase**, tell me how to see the result in my browser, and wait for my OK before you start the next one.
- **Only build what this document lists.** If something isn't specified, don't invent it. Ask me, or list it under "Open questions" when you stop at the end of a phase. This rule exists because guessed interactions are exactly the problem Forkpoint is meant to solve.

---

## 1. What Forkpoint is

Forkpoint is a web tool for designers who prototype with AI tools like Claude Code. It reads a PRD and the designer's sketches, finds the **interaction and flow decisions the PRD leaves open** (the "forks"), asks the designer to make each decision one at a time, and turns those decisions into a prompt for Claude Code. That way the prototyping tool doesn't have to guess.

Core principle: **the AI never makes decisions for the designer.** It finds the decisions, offers options and writes up what the designer chose.

---

## 2. Tech stack

- **Next.js** (App Router) with TypeScript and Tailwind CSS
- **Anthropic SDK** (`@anthropic-ai/sdk`) for the Claude API
- **GitHub** for the code, **Vercel** for hosting (auto-deploy on every push to `main`)
- No database. Session data lives in the browser (see D1).

**Environment variables** (never in code, never committed):

| Name | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API key |
| `ANTHROPIC_MODEL` | Model ID. Default `claude-haiku-5-5` while building; I'll switch to `claude-sonnet-5-5` for the final test. |
| `FORKPOINT_PASSWORD` | Shared password for live mode |

Locally these go in `.env.local`. Make sure `.env.local` is in `.gitignore` **before the first commit**. Online they go in Vercel → Project → Settings → Environment Variables. Walk me through that when we get there.

---

## 3. Screens

### Landing page (`/`)
- Short explanation of Forkpoint (2 sentences).
- Two buttons: **"View demo (Ladle)"** → `/demo` and **"Use live version"** → password prompt, then `/app`.

### Screen 1: Setup
- Paste PRD text in a large text box, **or** upload a PDF (one file, under 2 MB).
- Upload sketches: PNG or JPG, up to 5 images. Show thumbnails with a remove (×) button.
- Button: **"Start walkthrough"**. Disabled until there's a PRD.

### Screen 2: Journey walkthrough (main screen, three columns)
- **Left: Journey progress.** List of forks grouped by lens (Journey · Whole-app rules · Prototype reality). Each fork shows a status: Done, Current, Later or AI-decided.
- **Center: Current fork.**
  - Where it happens (screen name) and the fork written in the user's voice, e.g. *"I just tapped my usual adobo. What happens now?"*
  - "What the PRD says" in one line, and the risk level (High / Med / Low).
  - **2–3 option cards side by side.** Each card has a title, a 1–2 sentence description, one ✅ upside and one ⚠️ downside.
  - Buttons under the cards: **"Write my own"** · **"Decide later"** · **"Fine, let the AI decide"**
  - Optional one-line "Why?" text field.
  - **"Confirm & next"** button.
- **Right: Decision log.** Running list of decisions made so far, newest at the top.

### Screen 3: Review
- Every fork and its decision on one list, grouped by lens.
- "Decide later" items are flagged at the top.
- Each item has an **Edit** button that reopens it on Screen 2.
- Button: **"Generate prompt"**.

### Screen 4: Export
- The generated Claude Code prompt in a read-only box with a **Copy** button and a **Download .md** button.
- The decision checklist (markdown checkboxes) with its own Copy and Download buttons.
- Button: **"Download session"**. Saves the whole session as JSON (used for demo mode, see D12).

---

## 4. Decisions about Forkpoint's own interactions

These are Forkpoint's own forks, decided before building.

### Decided by me
| # | Decision |
|---|---|
| M1 | Guided interview: **one fork at a time**, options **side by side** |
| M2 | Options are **text cards**. No images in this version. |
| M3 | Every fork offers: pick a card, edit it, "Write my own", "Decide later", "Fine, let the AI decide" |
| M4 | Decision log always visible on the right |
| M5 | Public **demo mode** (no AI calls) + **password-protected live mode** |
| M6 | No automatic build checker. The exported checklist replaces it. |

### Defaults (proposed by Claude, confirmed by me)
| # | Fork | Default |
|---|---|---|
| D1 | Where session data is stored | Browser `localStorage`, saved on every change. Nothing typed is ever lost on refresh. No accounts. |
| D2 | Sketch size | Resize in the browser to max 1568 px on the long edge and save as JPEG before sending (cheaper, faster). Keep each request to the server under Vercel's ~4.5 MB limit; if PRD + sketches would go over, tell the user which file to shrink. |
| D3 | When call B runs | When the user arrives at a fork. While waiting, show 3 grey placeholder cards and "Thinking through options…" |
| D4 | Picking a card | Click selects it (highlighted border); click again to deselect. **"Confirm & next"** saves it. One click never advances on its own. |
| D5 | Editing a card | "Edit" link on the selected card turns its text into an editable field |
| D6 | "Fine, let the AI decide" | Saves call B's recommended option, labelled **AI-decided** in the log and listed separately in the export |
| D7 | Going back | Clicking a done fork in the left list reopens it. Changing it does **not** regenerate later forks. |
| D8 | AI errors | Plain message ("Couldn't reach Claude. Your work is saved.") + **Retry** button. Never clear what the user entered. |
| D9 | Layout | Desktop-first (min width 1280 px). No mobile layout in this version. Neutral, clean styling; I'll restyle later. |
| D10 | Password | Checked on the server. Stored in an httpOnly cookie for the session. Every AI route rejects requests without it. |
| D11 | Demo banner | Fixed banner on every demo page: *"Recorded walkthrough using the Ladle PRD. Live version available on request."* |
| D12 | Demo data | Demo mode loads `/data/demo-session.json` (a session saved with "Download session"). Before Day 3 it uses the fake data in Phase 2. All screens are browsable, nothing calls the API, and buttons that would call the AI are disabled with a tooltip. |

### Whole-app rules
- Never open a modal on top of another modal.
- Every AI wait shows a loading state that says what's happening.
- All buttons are keyboard-reachable, and text meets WCAG AA contrast.

### Hard requirements
- The API key is **only** used in server code (route handlers). It never reaches the browser, the client bundle or GitHub.
- The model comes from `ANTHROPIC_MODEL`, never hard-coded.
- Demo mode makes **zero** API calls.

---

## 5. AI calls (server routes)

All three live in `app/api/…/route.ts`, check the password cookie, and call Claude with the system prompt below. Calls A and B must return valid JSON matching the schema. Use the SDK's structured output / tool-use feature to enforce the schema if available; otherwise ask for JSON only, validate it, and retry once on failure.

### Call A: `/api/forks`: find the forks
**Input:** PRD (text or PDF) + sketches (images)
**System prompt:**
```
You are Forkpoint, a design assistant. A designer will give you a PRD and sketches for a product they are about to prototype with an AI coding tool. Your job is to find the interaction and flow decisions the PRD leaves open: places where the coding tool would have to guess. You never make these decisions; you only surface them.

Look through three lenses:
1. JOURNEY: walk through the product as its primary user, step by step. Stop at every point where what happens next, what the user sees, or how they interact is not specified, or where the PRD contradicts itself.
2. APP RULES: rules that should apply everywhere but aren't stated: e.g. how sheets/modals stack, number formatting and rounding, empty/loading/error states, feedback after actions.
3. PROTOTYPE REALITY: if the PRD describes a prototype or simulated features, what happens when a tester goes off-script (uses their own input), what demo data must stay consistent, and what the prototype should measure for testing.

Also list any explicit hard requirements in the PRD (e.g. tap target sizes, tone rules, safety limits) that a build must not break.

Rules:
- Only list decisions that are genuinely open. If the PRD specifies it clearly, skip it.
- Write each fork's "moment" in the primary user's voice, first person, one sentence.
- Order journey forks in the order the user meets them.
- Risk = how likely an AI coding tool is to guess something the designer doesn't want: high, med or low.
- Aim for 10–20 forks. Don't pad.
```
**Output schema:**
```json
{
  "product_name": "string",
  "primary_user": "string",
  "forks": [
    {
      "id": "string",
      "lens": "journey | app_rule | prototype",
      "screen": "string",
      "moment": "string (user's voice)",
      "question": "string (the decision to make)",
      "prd_says": "string (one line; what the PRD does and doesn't specify)",
      "risk": "high | med | low"
    }
  ],
  "hard_requirements": ["string"]
}
```

### Call B: `/api/options`: offer options for one fork
**Input:** the current fork + PRD + all decisions made so far
**System prompt:**
```
You are Forkpoint. For the one open design decision given, offer 2–3 genuinely different options the designer could choose. Make each option consistent with the decisions the designer has already made and with the PRD's goals and principles. Each option gets a short title, a 1–2 sentence description of exactly how the interaction works, one upside and one downside tied to the PRD's goals. Then name the option you'd recommend and why, in one sentence. The designer decides; your recommendation is only used if they explicitly ask you to decide.
```
**Output schema:**
```json
{
  "options": [
    { "id": "A", "title": "string", "description": "string", "upside": "string", "downside": "string" }
  ],
  "recommended": "A",
  "recommended_reason": "string"
}
```

### Call C: `/api/prompt`: write the Claude Code prompt
**Input:** PRD + sketches + all forks with their decisions + hard requirements
**System prompt:**
```
You are Forkpoint. Write a prompt the designer will paste into Claude Code to build (or rebuild) their prototype. Use only the designer's decisions; do not add new interactions.

Structure, in markdown:
1. Context: product, primary user, what this prototype is for (2–3 sentences).
2. Screens and flows: for each screen, in journey order, the decided interactions as plain step-by-step instructions.
3. Whole-app rules: the decided app rules.
4. Prototype reality: decided demo data, off-script handling, and test measurement.
5. Hard requirements: restate every hard requirement from the PRD.
6. Not decided yet: any "decide later" forks, with the instruction "Leave this as simple as possible and flag it to me; don't design it."
7. AI-decided: forks the designer let the AI decide, listed separately so they can review them.
End with this exact line: "Only build the interactions listed here. If something isn't specified, ask me instead of inventing it."

Then, separately, output a checklist: one markdown checkbox per decision and hard requirement, phrased so the designer can tick it while clicking through the build.
```
**Output:** `{ "prompt_markdown": "string", "checklist_markdown": "string" }`

---

## 6. Build phases (stop after each one)

**Phase 1: Project setup**
Create the Next.js project in this folder, set up `.gitignore` (including `.env.local`), create `.env.local` with placeholders, make a first commit, and help me create a GitHub repo and push to it. Show me the starter page running locally.

**Phase 2: Screens with fake data**
Build the landing page and Screens 1–4 using fake data, with no AI calls yet. Use this fake data from the Ladle PRD (an iOS calorie tracker for home cooks; primary user: Maya):
- 3 forks:
  1. Journey · First use · "I finished setup but have no recipes yet. What do I see?" · High
  2. Journey · One-tap log · "I tap my usual adobo. Does it log right away, or ask about the portion first?" · PRD says: "under 2 taps from home" and also "quick portion adjust before confirming" · High
  3. App rule · Everywhere · "How are calorie numbers shown: exact or rounded?" · Med
- Options for fork 2:
  - A **Instant log + undo**: tapping logs your usual portion right away; a toast offers Undo and Adjust. ✅ Meets the 2-tap target ⚠️ Easy to log the wrong portion
  - B **Portion sheet**: tapping opens ½ / 1 / 1½ / 2, set to your usual; then tap Log. ✅ Always accurate ⚠️ 3 taps, misses the target
  - C **Smart default**: recipes confirmed 3+ times log instantly; newer ones show the portion sheet. ✅ Fast where trust is earned ⚠️ Behaves differently between recipes

Make the full click-through work: select, edit, write my own, decide later, let the AI decide, review, export (export can show placeholder text). Also build `/demo` using the same fake data, with the demo banner.

**Phase 3: Connect the AI**
Build calls A, B and C as server routes and wire them to the screens. Help me add my API key to `.env.local`. Test with a short sample PRD first, then I'll try the Ladle PRD.

**Phase 4: Password and demo mode**
Add the password gate (D10) for `/app` and all `/api` routes. Make `/demo` load `/data/demo-session.json` if it exists, otherwise the Phase 2 fake data.

**Phase 5: Deploy**
Walk me through connecting the GitHub repo to Vercel, adding the three environment variables in Vercel, and deploying. Then check together that: the live site works with the password, `/demo` works without it, and the API key doesn't appear anywhere in the browser (view source / network tab).

---

## 7. Done means

- [ ] I can paste the Ladle PRD, walk through every fork, and export a prompt, on the live Vercel URL.
- [ ] Demo mode works for anyone, with no password and no API calls.
- [ ] The API key is not in GitHub and not visible in the browser.
- [ ] Refreshing the page mid-walkthrough loses nothing.
- [ ] Nothing was built that isn't listed in this document.

---

## Working notes (kept up to date by Claude)

- **Where the work happens:** Claude works in a temporary cloud computer with a copy of the GitHub repository `ran1199/forkpoint`, not on the Mac. Anything not committed and pushed to GitHub is lost when the session ends. `.env.local` is never pushed, so it has to be recreated in each new cloud session (placeholders, plus the real key only if needed for testing).
- **Versions (Phase 1):** Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS 4, TypeScript, ESLint. Created with `create-next-app`, no `src/` folder, import alias `@/*`. Read `node_modules/next/dist/docs/` before writing Next.js code (see AGENTS.md).
- **Secrets:** `.gitignore` ignores every `.env*` file.
- **Branch:** `main` is the published branch (Vercel deploys it from Phase 5).
- **Current phase:** Phase 1 (Project setup).
