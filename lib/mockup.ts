// Small shared helper for wireframes (used by the server check and the screens).
import type { MockupElement } from "./types";

/** How many elements a wireframe would actually draw (the tab bar alone doesn't count). */
export function visibleElementCount(elements: MockupElement[] | undefined): number {
  return (elements ?? []).filter((e) => e.kind !== "tabs").length;
}
