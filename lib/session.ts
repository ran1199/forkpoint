// Saving and loading the session in the browser's localStorage (decision D1).
// Every change is saved immediately, so a refresh never loses anything.
// Live (/app) and demo (/demo) use separate storage so they never mix.

import { withFakeForks } from "./fake-data";
import { deleteFile, loadFiles, saveFile } from "./file-db";
import type { Choice, Decision, Draft, Fork, Lens, Mode, Session, Sketch, UploadedPdf } from "./types";

const STORAGE_KEY = "forkpoint:session"; // live version only; the demo is never saved

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

/** The Phase 2 fake Ladle data, used by the demo until /data/demo-session.json exists. */
function fakeDemoSession(): Session {
  return withFakeForks({
    ...emptySession(),
    prdText: "[PLACEHOLDER: the Ladle PRD text comes from the recorded demo session.]",
  });
}

/**
 * D12: the demo loads /data/demo-session.json (a file saved with "Download session")
 * if it exists, otherwise the fake data. It's a plain file, not an AI call.
 */
async function loadDemoSession(): Promise<{ session: Session; files: Record<string, string> }> {
  try {
    const res = await fetch("/data/demo-session.json", { cache: "no-store" });
    if (res.ok) {
      const saved = (await res.json()) as Partial<Session> & { files?: Record<string, string> };
      if (saved.version === 1) {
        const { files = {}, ...rest } = saved;
        // The demo always starts at the first fork, wherever the recording ended.
        const forks = rest.forks ?? [];
        return { session: { ...emptySession(), ...rest, drafts: {}, currentForkId: forks[0]?.id ?? null } as Session, files };
      }
    }
  } catch {
    // fall through to the fake data
  }
  return { session: fakeDemoSession(), files: {} };
}

function loadSession(): Session {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptySession();
    const saved = JSON.parse(raw) as Partial<Session>;
    if (saved.version !== 1) return emptySession();
    return { ...emptySession(), ...saved } as Session;
  } catch {
    return emptySession();
  }
}

/**
 * A tiny store: holds the session, saves it on every change (localStorage),
 * keeps uploaded files in IndexedDB, and tells screens to redraw.
 */
export type SessionStore = {
  get: () => Session;
  update: (change: (s: Session) => Session) => void;
  subscribe: (listener: () => void) => () => void;
  saveFailed: () => boolean;
  files: () => Record<string, string>; // file id -> data URL
  addFile: (id: string, dataUrl: string) => Promise<boolean>;
  removeFile: (id: string) => void;
};

export async function loadSessionStore(mode: Mode): Promise<SessionStore> {
  if (mode === "demo") return demoStore();

  let session = loadSession();
  let files: Record<string, string> = {};
  let failed = false;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((l) => l());
  const prefix = "app:";

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      failed = false;
    } catch {
      failed = true;
    }
  }

  try {
    files = await loadFiles(prefix);
  } catch {
    failed = true; // IndexedDB unavailable (e.g. some private-browsing modes)
  }

  // Sessions saved before files moved to IndexedDB kept them inline: move them.
  type Legacy = { dataUrl?: string; id?: string };
  const legacyPdf = session.prdPdf as (UploadedPdf & Legacy) | null;
  const legacySketches = session.sketches as (Sketch & Legacy)[];
  if (legacyPdf?.dataUrl || legacySketches.some((sk) => sk.dataUrl)) {
    const moves: [string, string][] = [];
    let prdPdf = legacyPdf;
    if (legacyPdf?.dataUrl) {
      const id = legacyPdf.id ?? crypto.randomUUID();
      moves.push([id, legacyPdf.dataUrl]);
      prdPdf = { id, name: legacyPdf.name, size: legacyPdf.size };
    }
    const sketches = legacySketches.map((sk) => {
      if (!sk.dataUrl) return sk;
      moves.push([sk.id, sk.dataUrl]);
      return { id: sk.id, name: sk.name, width: sk.width, height: sk.height };
    });
    try {
      await Promise.all(moves.map(([id, url]) => saveFile(prefix + id, url)));
      moves.forEach(([id, url]) => (files[id] = url));
      session = { ...session, prdPdf, sketches };
      persist();
    } catch {
      failed = true;
    }
  }

  return {
    get: () => session,
    update(change) {
      session = change(session);
      persist();
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    saveFailed: () => failed,
    files: () => files,
    async addFile(id, dataUrl) {
      try {
        await saveFile(prefix + id, dataUrl);
        files = { ...files, [id]: dataUrl };
        failed = false;
        return true;
      } catch {
        failed = true; // usually: the browser's storage is full
        notify();
        return false;
      }
    },
    removeFile(id) {
      const next = { ...files };
      delete next[id];
      files = next;
      deleteFile(prefix + id).catch(() => {});
    },
  };
}

/** The read-only demo: kept in memory only, never saved, makes no AI calls. */
async function demoStore(): Promise<SessionStore> {
  localStorage.removeItem("forkpoint:demo-session"); // leftover from the Phase 2 demo
  const loaded = await loadDemoSession();
  let session = loaded.session;
  const listeners = new Set<() => void>();
  return {
    get: () => session,
    // Only moving between forks changes anything here; decisions can't be edited.
    update(change) {
      session = { ...session, currentForkId: change(session).currentForkId };
      listeners.forEach((l) => l());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    saveFailed: () => false,
    files: () => loaded.files,
    addFile: async () => false,
    removeFile: () => {},
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
