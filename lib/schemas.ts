// The shapes Claude must answer in (CLAUDE.md section 5), plus the shape of
// what the browser sends to the server. Used to enforce and check every answer.

import { z } from "zod";

export const ForksResultSchema = z.object({
  product_name: z.string(),
  primary_user: z.string(),
  forks: z.array(
    z.object({
      id: z.string(),
      lens: z.enum(["journey", "app_rule", "prototype"]),
      screen: z.string(),
      moment: z.string(),
      question: z.string(),
      prd_says: z.string(),
      risk: z.enum(["high", "med", "low"]),
    }),
  ),
  hard_requirements: z.array(z.string()),
});

export const OptionsResultSchema = z.object({
  options: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        upside: z.string(),
        downside: z.string(),
      }),
    )
    .min(2)
    .max(3),
  recommended: z.string(),
  recommended_reason: z.string(),
});

export const PromptResultSchema = z.object({
  prompt_markdown: z.string(),
  checklist_markdown: z.string(),
});

// ---------- What the browser sends ----------

const dataUrl = (prefix: string) => z.string().startsWith(prefix);

export const MaterialsSchema = z.object({
  prdText: z.string(),
  prdPdf: dataUrl("data:application/pdf;base64,").nullable(),
  sketches: z.array(dataUrl("data:image/jpeg;base64,")).max(5),
});

const ForkSchema = ForksResultSchema.shape.forks.element;

/** A decision written out for Claude (calls B and C). */
export const DecisionForClaudeSchema = z.object({
  kind: z.enum(["chosen_option", "own_words", "decide_later", "ai_decided", "not_decided"]),
  title: z.string(),
  details: z.string(),
  why: z.string(),
});

export const OptionsRequestSchema = z.object({
  materials: MaterialsSchema,
  fork: ForkSchema,
  decisionsSoFar: z.array(z.object({ fork: ForkSchema, decision: DecisionForClaudeSchema })),
});

export const PromptRequestSchema = z.object({
  materials: MaterialsSchema,
  product_name: z.string(),
  primary_user: z.string(),
  forks: z.array(z.object({ fork: ForkSchema, decision: DecisionForClaudeSchema })),
  hard_requirements: z.array(z.string()),
});

export const ForksRequestSchema = z.object({ materials: MaterialsSchema });

export type Materials = z.infer<typeof MaterialsSchema>;
export type DecisionForClaude = z.infer<typeof DecisionForClaudeSchema>;
