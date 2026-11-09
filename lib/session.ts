// Saving and loading the session in the browser's localStorage (decision D1).
// Every change is saved immediately, so a refresh never loses anything.
// Live (/app) and demo (/demo) use separate storage so they never mix.

import { withFakeForks } from "./fake-data";
import type { Choice, Decision, Draft, Fork, Lens, Mode, Session } from "./types";

const STORAGE_KEY: Record<Mode, string> = {
  app: "forkpoint:session",
  demo: "forkpoint:demo-session",
};

export function emptySession(): Session {
  return {
    version: 1,
    prdText: "",
    prdPdf: null,
    sketches: [],
    product_name: "",
    primary_user: "",
    forks: [],
    hard_requirements: [],
    options: {},
    currentForkId: null,
    drafts: {},
    decisions: {},
    export: null,
  };
}

/** Phase 2 demo: the fake Ladle data. Phase 4 replaces this with /data/demo-session.json. */
function demoStartSession(): Session {
  return withFakeForks({
    ...emptySession(),
    prdText: "[PLACEHOLDER: the Ladle PRD text comes from the recorded demo session in Phase 4.]",
  });
}

function startSession(mode: Mode): Session {
  return mode === "demo" ? demoStartSession() : emptySession();
}

function loadSession(mode: Mode): Session {
  try {
    const raw = localStorage.getItem(STORAGE_KEY[mode]);
    if (!raw) return startSession(mode);
    const saved = JSON.parse(raw) as Partial<Session>;
    if (saved.version !== 1) return startSession(mode);
    return { ...emptySession(), ...saved } as Session;
  } catch {
    return startSession(mode);
  }
}

/** A tiny store: holds the session, saves it on every change, tells screens to redraw. */
export type SessionStore = {
  get: () => Session;
  update: (change: (s: Session) => Session) => void;
  subscribe: (listener: () => void) => () => void;
  saveFailed: () => boolean;
};

export function createSessionStore(mode: Mode): SessionStore {
  let session = loadSession(mode);
  let failed = false;
  const listeners = new Set<() => void>();
  return {
    get: () => session,
    update(change) {
      session = change(session);
      try {
        localStorage.setItem(STORAGE_KEY[mode], JSON.stringify(session));
        failed = false;
      } catch {
        failed = true; // usually: the browser's storage is full
      }
      listeners.forEach((l) => l());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    saveFailed: () => failed,
  };
}

// ---------- Helpers shared by the screens ----------

export const LENS_ORDER: Lens[] = ["journey", "app_rule", "prototype"];
export const LENS_LABEL: Record<Lens, string> = {
  journey: "Journey",
  app_rule: "Whole-app rules",
  prototype: "Prototype reality",
};
export const RISK_LABEL = { high: "High", med: "Med", low: "Low" } as const;

export type Status = "Done" | "Current" | "Later" | "AI-decided" | null;

export function forkStatus(session: Session, fork: Fork, currentId: string | null): Status {
  if (fork.id === currentId) return "Current";
  return decisionStatus(session.decisions[fork.id]);
}

export function decisionStatus(decision: Decision | undefined): Status {
  if (!decision) return null;
  if (decision.choice.kind === "later") return "Later";
  if (decision.choice.kind === "ai") return "AI-decided";
  return "Done";
}

/** The decision as a short title + text, for the log, Review and Export. */
export function describeChoice(choice: Choice): { title: string; text: string } {
  switch (choice.kind) {
    case "option":
    case "ai":
      return { title: choice.title, text: choice.description };
    case "own":
      return { title: "My own", text: choice.text };
    case "later":
      return { title: "Decide later", text: "" };
  }
}

export function groupByLens(forks: Fork[]): { lens: Lens; forks: Fork[] }[] {
  return LENS_ORDER.map((lens) => ({ lens, forks: forks.filter((f) => f.lens === lens) })).filter(
    (g) => g.forks.length > 0,
  );
}

export function emptyDraft(): Draft {
  return { selected: null, optionId: null, edits: {}, editing: false, ownText: "", why: "" };
}

/** When a decided fork is reopened (D7), start from what was decided. */
export function draftFromDecision(decision: Decision | undefined): Draft {
  if (!decision) return emptyDraft();
  const d = { ...emptyDraft(), why: decision.why };
  const c = decision.choice;
  if (c.kind === "option") {
    return { ...d, selected: "option", optionId: c.optionId, edits: { [c.optionId]: { title: c.title, description: c.description } } };
  }
  if (c.kind === "own") return { ...d, selected: "own", ownText: c.text };
  return { ...d, selected: c.kind };
}
