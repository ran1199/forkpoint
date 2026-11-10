// Which AI calls are running or failed right now. Not saved: after a refresh a
// failed call simply runs again, and nothing the designer typed is affected.

import { useSyncExternalStore } from "react";

export type AiStatus = { state: "loading" } | { state: "error"; detail: string } | null;

const statuses = new Map<string, AiStatus>();
const listeners = new Set<() => void>();

export function setAiStatus(key: string, status: AiStatus) {
  if (status) statuses.set(key, status);
  else statuses.delete(key);
  listeners.forEach((l) => l());
}

export function getAiStatus(key: string): AiStatus {
  return statuses.get(key) ?? null;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAiStatus(key: string): AiStatus {
  return useSyncExternalStore(subscribe, () => getAiStatus(key), () => null);
}
