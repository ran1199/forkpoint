// Call A: find the forks in the PRD and sketches.
import { callStructured, handleJson, materialBlocks } from "@/lib/server/claude";
import { FORKS_SYSTEM } from "@/lib/server/prompts";
import { ForksRequestSchema, ForksResultSchema } from "@/lib/schemas";

export const maxDuration = 300; // seconds; finding forks in a long PRD can take a while

export async function POST(request: Request) {
  return handleJson(request, ForksRequestSchema, ({ materials }) =>
    callStructured({
      system: FORKS_SYSTEM,
      content: [...materialBlocks(materials), { type: "text", text: "Find the open forks in this PRD and these sketches." }],
      schema: ForksResultSchema,
      maxTokens: 32000,
    }),
  );
}
