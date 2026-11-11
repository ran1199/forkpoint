// Call A: find the forks in the PRD and sketches.
import type { NextRequest } from "next/server";
import { callStructured, handleJson, materialBlocks } from "@/lib/server/claude";
import { FORKS_SYSTEM } from "@/lib/server/prompts";
import { ForksRequestSchema, ForksResultSchema } from "@/lib/schemas";

export const maxDuration = 300; // seconds; finding forks in a long PRD can take a while

// Ran asked for fewer words on every fork. Kept here, in the message, so the
// call A system prompt from the brief stays word for word.
const SHORT_TEXT =
  "Keep every field short: screen 1 to 3 words; moment and question under 12 words each; prd_says under 15 words.";

export async function POST(request: NextRequest) {
  return handleJson(request, ForksRequestSchema, ({ materials }) =>
    callStructured({
      system: FORKS_SYSTEM,
      content: [...materialBlocks(materials), { type: "text", text: `Find the open forks in this PRD and these sketches.\n\n${SHORT_TEXT}` }],
      schema: ForksResultSchema,
      maxTokens: 32000,
    }),
  );
}
