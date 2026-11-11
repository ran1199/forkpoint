// Fake Ladle data for the demo (used until /data/demo-session.json exists).
// The three forks' moments, screens and risks come from the brief (CLAUDE.md).
// Questions and "What the PRD says" lines were added from the Ladle PRD.

import type { Fork, Mockup, MockupElement, OptionsResult, Session } from "./types";

// ---------- Demo mockups (wireframes) ----------
// Content follows the Ladle prototype (ladle-prototype.vercel.app): Maya, a
// 1,600 kcal budget, Chicken adobo at 420 kcal per serving, confidence labels.

const el = (kind: MockupElement["kind"], text: string, detail = "", layer: MockupElement["layer"] = "screen"): MockupElement => ({
  kind,
  text,
  detail,
  layer,
});
const tabs = (active: string) => el("tabs", "Today, Recipes, 📷, Pantry, Me", active);
const mock = (screen: string, elements: MockupElement[]): Mockup => ({ screen, elements });

const MOCKUPS = {
  f1: {
    A: mock("Onboarding, last step", [
      el("heading", "Import your first recipe", "Teach Ladle a dish once, then log it with one tap."),
      el("card", "Paste a link or text", "From a cooking video or recipe site"),
      el("card", "Photograph a recipe card", "Handwritten card or cookbook page"),
      el("button", "Import a recipe"),
      el("secondary_button", "Not now"),
    ]),
    B: mock("Import (opens after setup)", [
      el("heading", "Add your first recipe", "Home opens once it's saved."),
      el("input", "Paste a link or recipe text", "Link or text"),
      el("button", "Import"),
      el("secondary_button", "Photograph a recipe card"),
      el("text", "Ladle reads the ingredients and asks about anything vague."),
    ]),
    C: mock("Home", [
      el("heading", "Welcome, Maya.", "Tuesday, November 10"),
      el("number", "1,600 left", "0 eaten of 1,600"),
      el("card", "Import your first recipe", "Paste a link, text or a recipe card"),
      el("button", "Import a recipe"),
      el("secondary_button", "Add other food"),
      tabs("Today"),
    ]),
  },
  f2: {
    A: mock("Recipes", [
      el("heading", "Recipes"),
      el("card", "Chicken adobo", "420 kcal per serving · 4 servings"),
      el("badge", "Your recipe ✓", "confirmed"),
      el("card", "Turkey chili", "380 kcal per serving · 6 servings"),
      el("badge", "Your recipe ✓", "confirmed"),
      el("text", "Chicken adobo logged · 420 kcal", "Undo · Adjust", "toast"),
      tabs("Recipes"),
    ]),
    B: mock("Recipes, portion sheet", [
      el("heading", "Recipes"),
      el("card", "Chicken adobo", "420 kcal per serving · 4 servings"),
      el("card", "Turkey chili", "380 kcal per serving · 6 servings"),
      el("card", "Chicken adobo", "Your usual: 1 serving", "sheet"),
      el("chips", "½, 1, 1½, 2", "1", "sheet"),
      el("button", "Log · 420", "", "sheet"),
      tabs("Recipes"),
    ]),
    C: mock("Recipes", [
      el("heading", "Recipes"),
      el("card", "Chicken adobo", "Confirmed 3+ times · logs instantly"),
      el("badge", "Your recipe ✓", "confirmed"),
      el("card", "Kimchi fried rice", "Newer recipe · shows the portion sheet"),
      el("badge", "Good estimate", "good"),
      el("text", "Chicken adobo logged · 420 kcal", "Undo", "toast"),
      tabs("Recipes"),
    ]),
  },
  f3: {
    A: mock("Home", [
      el("heading", "Today"),
      el("number", "203 left", "1,397 eaten of 1,600"),
      el("list_item", "Overnight oats · Your recipe ✓", "352 kcal"),
      el("list_item", "Chicken adobo · Good estimate", "418 kcal"),
      el("list_item", "Restaurant ramen · Rough estimate", "627 kcal"),
      tabs("Today"),
    ]),
    B: mock("Home", [
      el("heading", "Today"),
      el("number", "200 left", "1,400 eaten of 1,600"),
      el("list_item", "Overnight oats · Your recipe ✓", "350 kcal"),
      el("list_item", "Chicken adobo · Good estimate", "420 kcal"),
      el("list_item", "Restaurant ramen · Rough estimate", "630 kcal"),
      el("list_item", "Quick fix: more oil", "+240 kcal"),
      tabs("Today"),
    ]),
    C: mock("Home", [
      el("heading", "Today"),
      el("number", "about 200 left", "about 1,400 eaten of 1,600"),
      el("list_item", "Overnight oats · Your recipe ✓", "352 kcal"),
      el("list_item", "Chicken adobo · Good estimate", "about 420 kcal"),
      el("list_item", "Restaurant ramen · Rough estimate", "about 650 kcal"),
      tabs("Today"),
    ]),
  },
};

export const FAKE_PRODUCT_NAME = "Ladle";
export const FAKE_PRIMARY_USER = "Maya";

// Text kept short on purpose (Ran: "less words"); the wireframes carry the detail.
export const FAKE_FORKS: Fork[] = [
  {
    id: "f1",
    lens: "journey",
    screen: "First use",
    moment: "Setup's done, no recipes yet. What do I see?",
    question: "What shows after setup, before any recipe exists?",
    prd_says: "Setup ends by inviting a first import; empty Home isn't described.",
    risk: "high",
  },
  {
    id: "f2",
    lens: "journey",
    screen: "One-tap log",
    moment: "I tap my usual adobo. Log now, or ask the portion?",
    question: "Log on tap, or show the portion adjust first?",
    prd_says: '"Under 2 taps from home", but also "quick portion adjust".',
    risk: "high",
  },
  {
    id: "f3",
    lens: "app_rule",
    screen: "Everywhere",
    moment: "Are calories exact or rounded?",
    question: "Exact or rounded calories, and does confidence matter?",
    prd_says: '"One simple number plus a confidence level"; no rounding rule.',
    risk: "med",
  },
];

// Fork 2's options started word for word from the brief and were shortened at
// Ran's request; C is marked as the AI recommendation. Options for forks 1 and 3
// were drafted by Claude from the Ladle PRD (F1, F2, F8, principle 4, problem P6).
export const FAKE_OPTIONS: Record<string, OptionsResult> = {
  f1: {
    options: [
      {
        id: "A",
        title: "Invite screen first",
        description: 'Setup ends on "Import a recipe" or "Not now".',
        upside: "Follows F1 exactly",
        downside: "One extra screen",
        mockup: MOCKUPS.f1.A,
      },
      {
        id: "B",
        title: "Straight to import",
        description: "Setup opens import; Home comes after the first recipe.",
        upside: "Core loop starts now",
        downside: "May miss the 2-minute target",
        mockup: MOCKUPS.f1.B,
      },
      {
        id: "C",
        title: "Home + import card",
        description: "Home opens with a card inviting a first import.",
        upside: "Fast to Home, invite visible",
        downside: "Competes with other actions",
        mockup: MOCKUPS.f1.C,
      },
    ],
    recommended: "C",
    recommended_reason: "Fake data: reaches Home in under 2 minutes and keeps F1's invitation.",
  },
  f2: {
    options: [
      {
        id: "A",
        title: "Instant log + undo",
        description: "Tap logs your usual portion; a toast offers Undo / Adjust.",
        upside: "Meets the 2-tap target",
        downside: "Easy to log the wrong portion",
        mockup: MOCKUPS.f2.A,
      },
      {
        id: "B",
        title: "Portion sheet",
        description: "Tap opens ½ / 1 / 1½ / 2, then Log.",
        upside: "Always accurate",
        downside: "3 taps, misses the target",
        mockup: MOCKUPS.f2.B,
      },
      {
        id: "C",
        title: "Smart default",
        description: "Confirmed 3+ times: logs instantly. Newer: portion sheet.",
        upside: "Fast where trust is earned",
        downside: "Differs between recipes",
        mockup: MOCKUPS.f2.C,
      },
    ],
    recommended: "C",
    recommended_reason: "Fake data: fast for familiar recipes, a portion check where mistakes are likely.",
  },
  f3: {
    options: [
      {
        id: "A",
        title: "Exact everywhere",
        description: "Always the calculated value, e.g. 487 kcal.",
        upside: "Same dish, same number",
        downside: "Looks falsely precise (P6)",
        mockup: MOCKUPS.f3.A,
      },
      {
        id: "B",
        title: "Rounded everywhere",
        description: "Nearest 10 kcal everywhere, e.g. 490.",
        upside: "Honest about estimates",
        downside: "Items may not sum to the total",
        mockup: MOCKUPS.f3.B,
      },
      {
        id: "C",
        title: "Rounding by confidence",
        description: "Rough: nearest 50. Good: nearest 10. Your recipe ✓: exact.",
        upside: "Precision is earned",
        downside: "Numbers change as trust grows",
        mockup: MOCKUPS.f3.C,
      },
    ],
    recommended: "C",
    recommended_reason: 'Fake data: follows "Show confidence, earn precision".',
  },
};

/** Puts the fake "Claude answers" into a session (stands in for call A + call B). */
export function withFakeForks(session: Session): Session {
  return {
    ...session,
    product_name: FAKE_PRODUCT_NAME,
    primary_user: FAKE_PRIMARY_USER,
    forks: FAKE_FORKS,
    hard_requirements: [],
    options: FAKE_OPTIONS,
    currentForkId: FAKE_FORKS[0].id,
  };
}

export const FAKE_EXPORT = {
  prompt_markdown:
    "[PLACEHOLDER: Claude writes the Claude Code prompt here from Phase 3, using only your decisions.]",
  checklist_markdown:
    "[PLACEHOLDER: Claude writes the decision checklist here from Phase 3, one checkbox per decision and hard requirement.]",
};
