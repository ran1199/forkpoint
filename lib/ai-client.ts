// The browser side of the three AI calls. It only talks to Forkpoint's own
// server routes (/api/...); the server holds the API key and calls Claude.

import type { DecisionForClaude, Materials } from "./schemas";
import { describeChoice } from "./session";
import type { Decision, Fork, OptionsResult, Session } from "./types";

const VERCEL_LIMIT_BYTES = 4.4 * 1024 * 1024; // D2: Vercel accepts ~4.5 MB per request

export class AiCallError extends Error {}

function mb(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function materialsFor(session: Session, files: Record<string, string>): Materials {
  return {
    prdText: session.prdText,
    prdPdf: session.prdPdf ? (files[session.prdPdf.id] ?? null) : null,
    sketches: session.sketches.map((s) => files[s.id]).filter(Boolean),
  };
}

/** D2: if the request would be too big, say which file to shrink. */
function checkSize(body: string, session: Session, files: Record<string, string>) {
  if (body.length <= VERCEL_LIMIT_BYTES) return;
  const candidates = [
    ...(session.prdPdf ? [{ name: session.prdPdf.name, size: files[session.prdPdf.id]?.length ?? 0 }] : []),
    ...session.sketches.map((s) => ({ name: s.name, size: files[s.id]?.length ?? 0 })),
  ].sort((a, b) => b.size - a.size);
  const biggest = candidates[0];
  throw new AiCallError(
    `Your PRD and sketches add up to ${mb(body.length)}, over the ${mb(VERCEL_LIMIT_BYTES)} limit.` +
      (biggest ? ` Try shrinking or removing ${biggest.name} (${mb(biggest.size)}).` : ""),
  );
}

async function post<T>(path: string, payload: unknown, session: Session, files: Record<string, string>): Promise<T> {
  const body = JSON.stringify(payload);
  checkSize(body, session, files);
  let res: Response;
  try {
    res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body });
  } catch {
    throw new AiCallError("The Forkpoint server couldn't be reached. Check your internet connection.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new AiCallError(data?.error ?? `The server answered with an error (${res.status}).`);
  return data as T;
}

/** A decision written out plainly for Claude. */
export function decisionForClaude(decision: Decision | undefined): DecisionForClaude {
  if (!decision) return { kind: "not_decided", title: "", details: "", why: "" };
  const { title, text } = describeChoice(decision.choice);
  const kind = {
    option: "chosen_option",
    own: "own_words",
    later: "decide_later",
    ai: "ai_decided",
  } as const;
  return { kind: kind[decision.choice.kind], title, details: text, why: decision.why };
}

type ForksResult = {
  product_name: string;
  primary_user: string;
  forks: Fork[];
  hard_requirements: string[];
};

/** Call A. */
export function findForks(session: Session, files: Record<string, string>) {
  return post<ForksResult>("/api/forks", { materials: materialsFor(session, files) }, session, files);
}

/** Call B. */
export function fetchOptions(session: Session, files: Record<string, string>, fork: Fork) {
  const decisionsSoFar = session.forks
    .filter((f) => session.decisions[f.id])
    .map((f) => ({ fork: f, decision: decisionForClaude(session.decisions[f.id]) }));
  return post<OptionsResult>(
    "/api/options",
    { materials: materialsFor(session, files), fork, decisionsSoFar },
    session,
    files,
  );
}

/** Call C. */
export function writePrompt(session: Session, files: Record<string, string>) {
  return post<{ prompt_markdown: string; checklist_markdown: string }>(
    "/api/prompt",
    {
      materials: materialsFor(session, files),
      product_name: session.product_name,
      primary_user: session.primary_user,
      forks: session.forks.map((f) => ({ fork: f, decision: decisionForClaude(session.decisions[f.id]) })),
      hard_requirements: session.hard_requirements,
    },
    session,
    files,
  );
}
