// Call B: offer 2–3 options for one fork.
import type { NextRequest } from "next/server";
import { callStructured, FriendlyError, handleJson, materialBlocks } from "@/lib/server/claude";
import { OPTIONS_SYSTEM } from "@/lib/server/prompts";
import { OptionsRequestSchema, OptionsResultSchema } from "@/lib/schemas";
import { visibleElementCount } from "@/lib/mockup";

export const maxDuration = 300;

// Asks for short text and a live mockup per option (Ran's requests). Kept here, in the message,
// so the call B system prompt from the brief stays word for word.
const MOCKUP_INSTRUCTIONS = `Keep the words short, since the mockup carries the detail: title 2 to 4 words, description one sentence under 12 words, upside and downside under 6 words each, recommended_reason under 15 words.
Also give each option a "mockup" (never leave its elements empty; at least 4 elements, most on layer "screen"): the one screen that best shows how that option works, as a short list of elements from top to bottom (about 4 to 10). Use the product's own words and the PRD's content, never placeholder text. Elements inside a bottom sheet use layer "sheet", a short temporary message uses layer "toast", everything else uses layer "screen".
Element kinds: heading (screen title; detail = subtitle), text (a line of text), number (a big number; detail = the small line under it), card (title; detail = subtitle), list_item (text on the left, detail on the right), button, secondary_button, chips (text = the choices separated by commas; detail = the selected one), input (text = placeholder; detail = label), image (text = what the picture shows), badge (a small label), tabs (text = tab names separated by commas; detail = the active tab). Leave detail empty when it isn't needed. "screen" is the screen's name, e.g. "Home".`;

export async function POST(request: NextRequest) {
  return handleJson(request, OptionsRequestSchema, async ({ materials, fork, decisionsSoFar }) => {
    const result = await callStructured({
      system: OPTIONS_SYSTEM,
      content: [
        ...materialBlocks(materials),
        {
          type: "text",
          text:
            `Decisions the designer has made so far:\n${JSON.stringify(decisionsSoFar, null, 2)}\n\n` +
            `The open decision to offer options for:\n${JSON.stringify(fork, null, 2)}\n\n` +
            MOCKUP_INSTRUCTIONS,
        },
      ],
      schema: OptionsResultSchema,
      maxTokens: 16000,
      softCheck: (r) =>
        r.options.some((o) => visibleElementCount(o.mockup.elements) < 2) ? "a wireframe was nearly empty" : null,
    });
    if (!result.options.some((o) => o.id === result.recommended)) {
      throw new FriendlyError("Claude recommended an option that isn't in the list.");
    }
    return result;
  });
}
