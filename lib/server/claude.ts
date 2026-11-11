// Talking to Claude. Server-only: the API key is read here and nowhere else,
// so it never reaches the browser (hard requirement). The model comes from
// ANTHROPIC_MODEL, never from the code.

import "server-only"; // build fails if this file is ever imported by browser code
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { NextRequest } from "next/server";
import type { z } from "zod";
import type { Materials } from "@/lib/schemas";
import { isUnlocked, UNLOCK_COOKIE } from "./auth";

/** An error whose message is safe and useful to show the designer. */
export class FriendlyError extends Error {
  constructor(message: string, public status = 502) {
    super(message);
  }
}

let client: Anthropic | null = null;

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new FriendlyError("The server has no Claude API key yet (ANTHROPIC_API_KEY is not set).", 500);
  }
  return (client ??= new Anthropic()); // reads ANTHROPIC_API_KEY itself
}

function getModel() {
  const model = process.env.ANTHROPIC_MODEL?.trim();
  if (!model) throw new FriendlyError("The server has no model set (ANTHROPIC_MODEL is not set).", 500);
  return model;
}

function base64Of(dataUrl: string) {
  return dataUrl.slice(dataUrl.indexOf(",") + 1);
}

/**
 * The PRD and sketches as message content. They come first and are marked for
 * caching, so repeated calls (one call B per fork) re-read them cheaply.
 */
export function materialBlocks(m: Materials): Anthropic.ContentBlockParam[] {
  const blocks: Anthropic.ContentBlockParam[] = [];
  if (m.prdPdf) {
    blocks.push({
      type: "document",
      title: "PRD (PDF)",
      source: { type: "base64", media_type: "application/pdf", data: base64Of(m.prdPdf) },
    });
  }
  m.sketches.forEach((sketch, i) => {
    blocks.push({ type: "text", text: `Sketch ${i + 1} of ${m.sketches.length}:` });
    blocks.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64Of(sketch) } });
  });
  blocks.push({
    type: "text",
    text: m.prdText.trim() ? `PRD text:\n\n${m.prdText.trim()}` : "The PRD is the attached PDF.",
    cache_control: { type: "ephemeral" },
  });
  return blocks;
}

/**
 * One call to Claude whose answer must match `schema` (structured outputs).
 * If the answer is cut off or doesn't fit the schema, it tries once more.
 */
export async function callStructured<S extends z.ZodType>(opts: {
  system: string;
  content: Anthropic.ContentBlockParam[];
  schema: S;
  maxTokens: number;
  /** Optional extra check. If it finds a problem, ask once more; if the second answer
   *  still has it, return that answer anyway rather than failing the whole step. */
  softCheck?: (result: z.infer<S>) => string | null;
}): Promise<z.infer<S>> {
  const anthropic = getClient();
  const model = getModel();
  let problem = "Claude's answer didn't match the expected format.";

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      // Streaming avoids request timeouts on long answers; we only need the final message.
      const stream = anthropic.messages.stream({
        model,
        max_tokens: opts.maxTokens,
        system: opts.system,
        messages: [{ role: "user", content: opts.content }],
        output_config: { format: zodOutputFormat(opts.schema) },
      });
      const message = await stream.finalMessage();
      if (message.stop_reason === "refusal") throw new FriendlyError("Claude declined to answer this request.");
      if (message.stop_reason === "max_tokens") {
        problem = "Claude's answer was too long and got cut off.";
        continue;
      }
      if (message.parsed_output != null) {
        const result = message.parsed_output as z.infer<S>;
        const softProblem = opts.softCheck?.(result);
        if (softProblem && attempt === 1) {
          console.warn(`Forkpoint: asking again (${softProblem})`);
          continue;
        }
        return result;
      }
    } catch (error) {
      if (error instanceof FriendlyError) throw error;
      if (error instanceof Anthropic.AuthenticationError) throw new FriendlyError("Claude rejected the API key.");
      if (error instanceof Anthropic.PermissionDeniedError)
        throw new FriendlyError("This API key isn't allowed to use the chosen model.");
      if (error instanceof Anthropic.NotFoundError)
        throw new FriendlyError(`Claude doesn't know the model "${model}". Check ANTHROPIC_MODEL.`);
      if (error instanceof Anthropic.RateLimitError) throw new FriendlyError("Claude is busy right now (rate limit).", 503);
      if (error instanceof Anthropic.APIConnectionError) throw new FriendlyError("The server couldn't connect to Claude.");
      if (error instanceof Anthropic.APIError) throw new FriendlyError(`Claude returned an error (${error.status ?? "no status"}).`);
      // Anything else here is an answer that didn't fit the schema: try once more.
      console.error(`Forkpoint: attempt ${attempt} returned an unusable answer`, error);
    }
  }
  throw new FriendlyError(problem);
}

/** Shared wrapper for the three routes: check the request, run, and answer in JSON. */
export async function handleJson<T extends z.ZodType>(
  request: NextRequest,
  bodySchema: T,
  run: (body: z.infer<T>) => Promise<unknown>,
): Promise<Response> {
  // D10: every AI route rejects requests without the password cookie
  // (the proxy checks too; this is the second lock).
  if (!isUnlocked(request.cookies.get(UNLOCK_COOKIE)?.value)) {
    return Response.json(
      { error: "The live version is locked. Reload the page and enter the password again." },
      { status: 401 },
    );
  }
  let body: z.infer<T>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return Response.json({ error: "The request to the server was malformed." }, { status: 400 });
  }
  try {
    return Response.json(await run(body));
  } catch (error) {
    if (error instanceof FriendlyError) return Response.json({ error: error.message }, { status: error.status });
    console.error("Forkpoint: unexpected server error", error);
    return Response.json({ error: "Something went wrong on the server." }, { status: 500 });
  }
}
