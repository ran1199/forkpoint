"use client";

// Gives every screen access to the saved session.
// The session lives in localStorage, which only exists in the browser,
// so this part of the page is drawn in the browser (use(browser())).

import { createContext, Suspense, use, useContext, useState, useSyncExternalStore } from "react";
import { browser } from "react-dom";
import { createSessionStore, type SessionStore } from "@/lib/session";
import type { Mode } from "@/lib/types";

type Ctx = { store: SessionStore; mode: Mode; base: string };
const SessionContext = createContext<Ctx | null>(null);

export function SessionProvider({ mode, children }: { mode: Mode; children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="p-10 text-zinc-600">Loading your saved work…</p>}>
      <BrowserOnly mode={mode}>{children}</BrowserOnly>
    </Suspense>
  );
}

function BrowserOnly({ mode, children }: { mode: Mode; children: React.ReactNode }) {
  use(browser("The Forkpoint session is saved in this browser's localStorage."));
  const [store] = useState(() => createSessionStore(mode));
  const base = mode === "demo" ? "/demo" : "/app";
  return <SessionContext value={{ store, mode, base }}>{children}</SessionContext>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  const session = useSyncExternalStore(ctx.store.subscribe, ctx.store.get, ctx.store.get);
  return {
    session,
    update: ctx.store.update,
    saveFailed: ctx.store.saveFailed(),
    mode: ctx.mode,
    base: ctx.base,
  };
}
