// Phase 2 fake data, taken word for word from the Ladle example in CLAUDE.md.
// It stands in for Claude's answers until the AI is connected in Phase 3.
// Fork 2's options come word for word from the brief; C is marked as the AI
// recommendation (Ran's request). Ran later asked for A/B/C options on every demo
// fork: the options for forks 1 and 3 were drafted by Claude and are easy to edit here.

import type { Fork, OptionsResult, Session } from "./types";

export const FAKE_PRODUCT_NAME = "Ladle";
export const FAKE_PRIMARY_USER = "Maya";

export const FAKE_FORKS: Fork[] = [
  {
    id: "f1",
    lens: "journey",
    screen: "First use",
    moment: "I finished setup but have no recipes yet. What do I see?",
    question: "",
    prd_says: "",
    risk: "high",
  },
  {
    id: "f2",
    lens: "journey",
    screen: "One-tap log",
    moment: "I tap my usual adobo. Does it log right away, or ask about the portion first?",
    question: "",
    prd_says: '"under 2 taps from home" and also "quick portion adjust before confirming"',
    risk: "high",
  },
  {
    id: "f3",
    lens: "app_rule",
    screen: "Everywhere",
    moment: "How are calorie numbers shown: exact or rounded?",
    question: "",
    prd_says: "",
    risk: "med",
  },
];

export const FAKE_OPTIONS: Record<string, OptionsResult> = {
  // Drafted by Claude at Ran's request (not from the Ladle PRD).
  f1: {
    options: [
      {
        id: "A",
        title: "Empty state + one button",
        description: "Home shows a short message and one large \"Add your first recipe\" button.",
        upside: "One clear next step",
        downside: "Nothing to log until a recipe is added",
      },
      {
        id: "B",
        title: "Starter recipes",
        description: "Home comes with a few sample home-cooked dishes that Maya can log right away or replace.",
        upside: "One-tap logging can be tried immediately",
        downside: "Samples may not match what Maya actually cooks",
      },
      {
        id: "C",
        title: "Guided first recipe",
        description: "Right after setup, a short guided step helps Maya add her most-cooked dish, then Home opens with it ready to log.",
        upside: "Home is personal from day one",
        downside: "Adds a step before Maya reaches Home",
      },
    ],
    recommended: "A",
    recommended_reason: "Fake data: keeps first use simple and leads straight to adding the recipe Maya will log most.",
  },
  f2: {
    options: [
      {
        id: "A",
        title: "Instant log + undo",
        description: "Tapping logs your usual portion right away; a toast offers Undo and Adjust.",
        upside: "Meets the 2-tap target",
        downside: "Easy to log the wrong portion",
      },
      {
        id: "B",
        title: "Portion sheet",
        description: "Tapping opens ½ / 1 / 1½ / 2, set to your usual; then tap Log.",
        upside: "Always accurate",
        downside: "3 taps, misses the target",
      },
      {
        id: "C",
        title: "Smart default",
        description: "Recipes confirmed 3+ times log instantly; newer ones show the portion sheet.",
        upside: "Fast where trust is earned",
        downside: "Behaves differently between recipes",
      },
    ],
    recommended: "C",
    recommended_reason:
      "Fake data: keeps familiar recipes within the 2-tap target while still offering a portion check where mistakes are likely.",
  },
  // Drafted by Claude at Ran's request (not from the Ladle PRD).
  f3: {
    options: [
      {
        id: "A",
        title: "Exact everywhere",
        description: "Every screen shows the calculated number, for example 487 kcal.",
        upside: "Matches the calculation exactly",
        downside: "Looks more precise than a home-cooked estimate is",
      },
      {
        id: "B",
        title: "Rounded everywhere",
        description: "Every number is rounded to the nearest 10 kcal, for example 490 kcal, including daily totals.",
        upside: "Easier to read and honest about estimates",
        downside: "Rounded items may not add up exactly to the rounded total",
      },
      {
        id: "C",
        title: "Rounded, exact on tap",
        description: "Numbers are shown rounded; tapping one reveals the exact value.",
        upside: "Easy to scan, with detail when wanted",
        downside: "Two numbers for the same thing can confuse",
      },
    ],
    recommended: "B",
    recommended_reason: "Fake data: home-cooked calories are estimates, so rounded numbers read faster and more honestly.",
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
