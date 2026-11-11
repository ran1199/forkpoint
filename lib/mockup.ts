// Small shared helper for wireframes (used by the server check and the screens).
import type { MockupElement, OptionsResult } from "./types";

/** How many elements a wireframe would actually draw (the tab bar alone doesn't count). */
export function visibleElementCount(elements: MockupElement[] | undefined): number {
  return (elements ?? []).filter((e) => e.kind !== "tabs").length;
}

/** Options fetched with wireframe checks and word limits carry this marker. */
export const OPTIONS_FORMAT = 2;

const words = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

/**
 * Saved options from before the checks and word limits that need replacing:
 * a blank wireframe, or clearly too many words. Options with the marker never do,
 * so a fork is refreshed at most once.
 */
export function needsRepair(result: OptionsResult | undefined): boolean {
  if (!result || result.format === OPTIONS_FORMAT) return false;
  return result.options.some(
    (o) =>
      visibleElementCount(o.mockup?.elements) < 2 ||
      words(o.title) > 6 ||
      words(o.description) > 20 ||
      words(o.upside) > 10 ||
      words(o.downside) > 10,
  );
}
