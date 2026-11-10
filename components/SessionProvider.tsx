"use client";

// Gives every screen access to the saved session.
// The session lives in this browser (localStorage + IndexedDB for files),
// so this part of the page is drawn in the browser only (use(browser())).

import { createContext, Suspense, use, useContext, useSyncExternalStore } from "react";
import { browser } from "react-dom";
import { loadSessionStore, type SessionStore } from "@/lib/session";
import type { Mode } from "@/lib/types";

type Ctx = { store: SessionStore; mode: Mode; base: string; setupHref: string };
const SessionContext = createContext<Ctx | null>(null);

// One loading promise per mode, so React's use() waits for the same one.
const storePromises: Partial<Record<Mode, Promise<SessionStore>>> = {};

export function SessionProvider({ mode, children }: { mode: Mode; children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="p-10 text-zinc-600">Loading your saved work…</p>}>
      <BrowserOnly mode={mode}>{children}</BrowserOnly>
    </Suspense>
  );
}

function BrowserOnly({ mode, children }: { mode: Mode; children: React.ReactNode }) {
  use(browser("The Forkpoint session is saved in this browser."));
  const store = use((storePromises[mode] ??= loadSessionStore(mode)));
  const base = mode === "demo" ? "/demo" : "/app";
  // The demo opens on the walkthrough (/demo); its Setup screen is at /demo/setup.
  const setupHref = mode === "demo" ? "/demo/setup" : "/app";
  return <SessionContext value={{ store, mode, base, setupHref }}>{children}</SessionContext>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  const session = useSyncExternalStore(ctx.store.subscribe, ctx.store.get, ctx.store.get);
  return {
    session,
    getSession: ctx.store.get,
    update: ctx.store.update,
    saveFailed: ctx.store.saveFailed(),
    files: ctx.store.files(),
    addFile: ctx.store.addFile,
    removeFile: ctx.store.removeFile,
    mode: ctx.mode,
    readOnly: ctx.mode === "demo", // the demo is read-only (Ran, Phase 2 answers)
    base: ctx.base,
    setupHref: ctx.setupHref,
  };
}
