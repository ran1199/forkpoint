// Phase 2 fake data, taken word for word from the Ladle example in CLAUDE.md.
// It stands in for Claude's answers until the AI is connected in Phase 3.
// Only fork 2 has options. The brief names no recommended option, so there is none.

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
    recommended: null,
    recommended_reason: "",
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
