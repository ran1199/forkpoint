// The shapes of Forkpoint's data. Field names follow the AI call schemas in CLAUDE.md,
// so the fake data (Phase 2) and Claude's answers (Phase 3) fit the same screens.

export type Lens = "journey" | "app_rule" | "prototype";
export type Risk = "high" | "med" | "low";

/** One open decision found in the PRD (call A). */
export type Fork = {
  id: string;
  lens: Lens;
  screen: string;
  moment: string; // in the primary user's voice
  question: string;
  prd_says: string;
  risk: Risk;
};

/** One option card offered for a fork (call B). */
export type Option = {
  id: string;
  title: string;
  description: string;
  upside: string;
  downside: string;
};

export type OptionsResult = {
  options: Option[];
  recommended: string | null; // option id, or null when there is none (fake data)
  recommended_reason: string;
};

/** What the designer chose for one fork. */
export type Choice =
  | { kind: "option"; optionId: string; title: string; description: string }
  | { kind: "own"; text: string }
  | { kind: "later" }
  | { kind: "ai"; optionId: string | null; title: string; description: string };

export type Decision = { choice: Choice; why: string; decidedAt: number };

/** Unconfirmed work on a fork, kept so nothing typed is lost on refresh (D1). */
export type Draft = {
  selected: "option" | "own" | "later" | "ai" | null;
  optionId: string | null;
  edits: Record<string, { title: string; description: string }>; // per option id (D5)
  editing: boolean; // true while the selected card's text is editable (D5)
  ownText: string;
  why: string;
};

export type UploadedPdf = { name: string; size: number; dataUrl: string };
export type Sketch = { id: string; name: string; dataUrl: string; width: number; height: number };

export type Session = {
  version: 1;
  prdText: string;
  prdPdf: UploadedPdf | null;
  sketches: Sketch[];
  product_name: string;
  primary_user: string;
  forks: Fork[];
  hard_requirements: string[];
  options: Record<string, OptionsResult>; // by fork id
  currentForkId: string | null;
  drafts: Record<string, Draft>; // by fork id
  decisions: Record<string, Decision>; // by fork id
  export: { prompt_markdown: string; checklist_markdown: string } | null;
};

export type Mode = "app" | "demo";
