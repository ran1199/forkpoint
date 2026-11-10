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

export const FAKE_FORKS: Fork[] = [
  {
    id: "f1",
    lens: "journey",
    screen: "First use",
    moment: "I finished setup but have no recipes yet. What do I see?",
    question: "What does Maya see when onboarding ends and she has no saved recipes yet?",
    prd_says: 'Onboarding "ends by inviting the user to import her first recipe", but the empty Home isn\'t described.',
    risk: "high",
  },
  {
    id: "f2",
    lens: "journey",
    screen: "One-tap log",
    moment: "I tap my usual adobo. Does it log right away, or ask about the portion first?",
    question: "Does tapping a saved recipe log it immediately, or show the portion adjust first?",
    prd_says: '"under 2 taps from home" and also "quick portion adjust before confirming"',
    risk: "high",
  },
  {
    id: "f3",
    lens: "app_rule",
    screen: "Everywhere",
    moment: "How are calorie numbers shown: exact or rounded?",
    question: "Are calorie numbers shown exact or rounded, and does it depend on the confidence level?",
    prd_says: '"One simple number plus a confidence level" and "exact-looking numbers hide errors", but no rounding rule.',
    risk: "med",
  },
];

// Fork 2's options are word for word from the brief; C is marked as the AI
// recommendation (Ran's request). Options for forks 1 and 3 were drafted by Claude
// at Ran's request, based on the Ladle PRD (F1, F2, F8, principle 4, problem P6).
export const FAKE_OPTIONS: Record<string, OptionsResult> = {
  f1: {
    options: [
      {
        id: "A",
        title: "Invite screen, then Home",
        description:
          "Onboarding ends on a screen offering \"Import a recipe\" (link, text or recipe card) or \"Not now\"; Not now opens Home with calories left and no meals yet.",
        upside: "Follows F1's invitation exactly",
        downside: "An extra screen before Maya reaches Home",
        mockup: MOCKUPS.f1.A,
      },
      {
        id: "B",
        title: "Straight into import",
        description:
          "The last onboarding step opens the import screen directly, and Home appears once her first recipe is saved.",
        upside: "Starts the core loop and recipe-based logging right away",
        downside: "Risks missing the under-2-minutes-to-Home target",
        mockup: MOCKUPS.f1.B,
      },
      {
        id: "C",
        title: "Home with an import card",
        description:
          "Onboarding ends on Home: calories left today shows, and where today's meals would be, a card invites her to import her first recipe.",
        upside: "Reaches Home fast and keeps the invitation in view",
        downside: "The card competes with snap a plate and add other food",
        mockup: MOCKUPS.f1.C,
      },
    ],
    recommended: "C",
    recommended_reason:
      "Fake data: meets the under-2-minutes-to-Home acceptance while keeping F1's import invitation visible.",
  },
  f2: {
    options: [
      {
        id: "A",
        title: "Instant log + undo",
        description: "Tapping logs your usual portion right away; a toast offers Undo and Adjust.",
        upside: "Meets the 2-tap target",
        downside: "Easy to log the wrong portion",
        mockup: MOCKUPS.f2.A,
      },
      {
        id: "B",
        title: "Portion sheet",
        description: "Tapping opens ½ / 1 / 1½ / 2, set to your usual; then tap Log.",
        upside: "Always accurate",
        downside: "3 taps, misses the target",
        mockup: MOCKUPS.f2.B,
      },
      {
        id: "C",
        title: "Smart default",
        description: "Recipes confirmed 3+ times log instantly; newer ones show the portion sheet.",
        upside: "Fast where trust is earned",
        downside: "Behaves differently between recipes",
        mockup: MOCKUPS.f2.C,
      },
    ],
    recommended: "C",
    recommended_reason:
      "Fake data: keeps familiar recipes within the 2-tap target while still offering a portion check where mistakes are likely.",
  },
  f3: {
    options: [
      {
        id: "A",
        title: "Exact everywhere",
        description:
          "Every screen shows the calculated value, for example 487 kcal, and the confidence label carries the uncertainty.",
        upside: "Same dish, same number, easy to check against the recipe card",
        downside: "Looks precise even on a rough estimate (problem P6)",
        mockup: MOCKUPS.f3.A,
      },
      {
        id: "B",
        title: "Rounded everywhere",
        description:
          "Every number rounds to the nearest 10 kcal, for example 490 kcal, including calories left today and fix effects like +240 kcal.",
        upside: "One simple number that doesn't overclaim accuracy",
        downside: "Rounded meals may not add up exactly to the day's total",
        mockup: MOCKUPS.f3.B,
      },
      {
        id: "C",
        title: "Rounding follows confidence",
        description:
          "\"Rough estimate\" rounds to the nearest 50 kcal, \"Good estimate\" to the nearest 10, and \"Your recipe ✓\" shows the exact value.",
        upside: "Precision is earned, as in \"Show confidence, earn precision\"",
        downside: "A dish's number changes shape as its confidence rises",
        mockup: MOCKUPS.f3.C,
      },
    ],
    recommended: "C",
    recommended_reason: "Fake data: follows the PRD principle \"Show confidence, earn precision\" directly.",
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
