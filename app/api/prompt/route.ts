// Call C: write the Claude Code prompt and the decision checklist.
import { callStructured, handleJson, materialBlocks } from "@/lib/server/claude";
import { PROMPT_SYSTEM } from "@/lib/server/prompts";
import { PromptRequestSchema, PromptResultSchema } from "@/lib/schemas";

export const maxDuration = 300;

export async function POST(request: Request) {
  return handleJson(request, PromptRequestSchema, ({ materials, product_name, primary_user, forks, hard_requirements }) =>
    callStructured({
      system: PROMPT_SYSTEM,
      content: [
        ...materialBlocks(materials),
        {
          type: "text",
          text:
            `Product: ${product_name}\nPrimary user: ${primary_user}\n\n` +
            `Every fork with the designer's decision:\n${JSON.stringify(forks, null, 2)}\n\n` +
            `Hard requirements from the PRD:\n${JSON.stringify(hard_requirements, null, 2)}`,
        },
      ],
      schema: PromptResultSchema,
      maxTokens: 32000,
    }),
  );
}
