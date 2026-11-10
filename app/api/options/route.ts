// Call B: offer 2–3 options for one fork.
import type { NextRequest } from "next/server";
import { callStructured, FriendlyError, handleJson, materialBlocks } from "@/lib/server/claude";
import { OPTIONS_SYSTEM } from "@/lib/server/prompts";
import { OptionsRequestSchema, OptionsResultSchema } from "@/lib/schemas";

export const maxDuration = 300;

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
            `The open decision to offer options for:\n${JSON.stringify(fork, null, 2)}`,
        },
      ],
      schema: OptionsResultSchema,
      maxTokens: 16000,
    });
    if (!result.options.some((o) => o.id === result.recommended)) {
      throw new FriendlyError("Claude recommended an option that isn't in the list.");
    }
    return result;
  });
}
