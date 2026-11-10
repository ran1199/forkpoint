"use client";

// Screen 2: Journey walkthrough. Left: progress. Center: current fork. Right: decision log.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { MockupPhone } from "@/components/Mockup";
import { useSession } from "@/components/SessionProvider";
import { AiError, AiLoading, btn, RiskBadge, SaveWarning, StatusPill } from "@/components/ui";
import { fetchOptions } from "@/lib/ai-client";
import { getAiStatus, setAiStatus, useAiStatus } from "@/lib/ai-status";
import {
  decisionStatus,
  describeChoice,
  draftFromDecision,
  forkStatus,
  groupByLens,
  LENS_LABEL,
} from "@/lib/session";
import type { Choice, Draft, Fork, Option, Session } from "@/lib/types";

/** Call B for one fork. The answer is saved under that fork, even if the designer has moved on. */
async function requestOptions(
  getSession: () => Session,
  files: Record<string, string>,
  update: (change: (s: Session) => Session) => void,
  forkId: string,
) {
  const key = `options:${forkId}`;
  const fork = getSession().forks.find((f) => f.id === forkId);
  if (!fork || getAiStatus(key)?.state === "loading") return;
  setAiStatus(key, { state: "loading" });
  try {
    const result = await fetchOptions(getSession(), files, fork);
    update((s) => ({ ...s, options: { ...s.options, [forkId]: result } }));
    setAiStatus(key, null);
  } catch (error) {
    setAiStatus(key, { state: "error", detail: error instanceof Error ? error.message : "" });
  }
}

export function WalkthroughScreen() {
  const { session, getSession, update, saveFailed, files, mode, base, setupHref } = useSession();
  const router = useRouter();

  const currentForkId = session.currentForkId ?? session.forks[0]?.id ?? null;
  // D3: call B runs when the designer arrives at a fork (live mode only; demo makes no calls).
  const needsOptions = mode === "app" && currentForkId !== null && !session.options[currentForkId];
  useEffect(() => {
    if (!needsOptions || !currentForkId) return;
    if (getAiStatus(`options:${currentForkId}`)) return; // already loading, or failed: wait for Retry
    void requestOptions(getSession, files, update, currentForkId);
  }, [needsOptions, currentForkId, getSession, files, update]);

  if (session.forks.length === 0) {
    return (
      <main className="px-10 py-12">
        <h1 className="text-2xl font-semibold text-zinc-900">Journey walkthrough</h1>
        <p className="mt-4 text-zinc-700">
          No walkthrough yet. <Link href={setupHref} className={btn.link}>Go to Setup</Link>
        </p>
      </main>
    );
  }

  const currentId = session.currentForkId ?? session.forks[0].id;
  const fork = session.forks.find((f) => f.id === currentId) ?? session.forks[0];
  const draft = session.drafts[fork.id] ?? draftFromDecision(session.decisions[fork.id]);

  const setDraft = (change: (d: Draft) => Draft) =>
    update((s) => ({ ...s, drafts: { ...s.drafts, [fork.id]: change(draft) } }));

  function openFork(id: string) {
    update((s) => ({ ...s, currentForkId: id }));
  }

  function confirmAndNext() {
    const choice = choiceFromDraft(session, fork, draft);
    if (!choice) return;
    const index = session.forks.findIndex((f) => f.id === fork.id);
    const next = session.forks[index + 1];
    update((s) => {
      const drafts = { ...s.drafts };
      delete drafts[fork.id];
      return {
        ...s,
        drafts,
        decisions: { ...s.decisions, [fork.id]: { choice, why: draft.why.trim(), decidedAt: Date.now() } },
        currentForkId: next ? next.id : fork.id,
      };
    });
    if (!next) router.push(`${base}/review`);
  }

  return (
    <div className="grid min-h-screen grid-cols-[280px_minmax(0,1fr)_320px]">
      <ProgressList session={session} currentId={fork.id} onOpen={openFork} />
      <main className="border-x border-zinc-200 px-10 py-10">
        <SaveWarning failed={saveFailed} />
        <h1 className="sr-only">Journey walkthrough</h1>
        <CurrentFork
          key={fork.id}
          session={session}
          fork={fork}
          draft={draft}
          setDraft={setDraft}
          canConfirm={choiceFromDraft(session, fork, draft) !== null}
          onConfirm={confirmAndNext}
          onRetry={() => {
            setAiStatus(`options:${fork.id}`, null);
            void requestOptions(getSession, files, update, fork.id);
          }}
        />
      </main>
      <DecisionLog session={session} />
    </div>
  );
}

/** Turns the unconfirmed draft into a decision, or null if nothing valid is chosen yet. */
function choiceFromDraft(session: Session, fork: Fork, draft: Draft): Choice | null {
  const result = session.options[fork.id];
  switch (draft.selected) {
    case "option": {
      const opt = result?.options.find((o) => o.id === draft.optionId);
      if (!opt) return null;
      const edit = draft.edits[opt.id];
      return {
        kind: "option",
        optionId: opt.id,
        title: (edit?.title ?? opt.title).trim() || opt.title,
        description: (edit?.description ?? opt.description).trim() || opt.description,
      };
    }
    case "own":
      return draft.ownText.trim() ? { kind: "own", text: draft.ownText.trim() } : null;
    case "later":
      return { kind: "later" };
    case "ai": {
      // D6: save call B's recommended option (nothing to save until options have loaded).
      const rec = result?.options.find((o) => o.id === result.recommended);
      return rec ? { kind: "ai", optionId: rec.id, title: rec.title, description: rec.description } : null;
    }
    default:
      return null;
  }
}

// ---------- Left column ----------

function ProgressList({
  session,
  currentId,
  onOpen,
}: {
  session: Session;
  currentId: string;
  onOpen: (id: string) => void;
}) {
  return (
    <nav aria-label="Journey progress" className="px-6 py-10">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">Journey progress</h2>
      {groupByLens(session.forks).map((group) => (
        <div key={group.lens} className="mt-6">
          <h3 className="text-sm font-semibold text-zinc-900">{LENS_LABEL[group.lens]}</h3>
          <ul className="mt-2 space-y-1">
            {group.forks.map((f) => {
              const status = forkStatus(session, f, currentId);
              // D7: forks that were already decided can be reopened. Unreached ones can't.
              const canOpen = status !== null && f.id !== currentId;
              const content = (
                <>
                  <span className="min-w-0">
                    <span className="block text-xs text-zinc-600">{f.screen}</span>
                    <span className="line-clamp-2 block text-sm text-zinc-900">{f.moment}</span>
                  </span>
                  <StatusPill status={status} />
                </>
              );
              return (
                <li key={f.id}>
                  {canOpen ? (
                    <button
                      type="button"
                      onClick={() => onOpen(f.id)}
                      className="flex w-full items-start justify-between gap-2 rounded-md px-2 py-2 text-left hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-blue-600"
                    >
                      {content}
                    </button>
                  ) : (
                    <div
                      aria-current={f.id === currentId ? "step" : undefined}
                      className={`flex items-start justify-between gap-2 rounded-md px-2 py-2 ${f.id === currentId ? "bg-blue-50" : ""}`}
                    >
                      {content}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

// ---------- Center column ----------

function CurrentFork({
  session,
  fork,
  draft,
  setDraft,
  canConfirm,
  onConfirm,
  onRetry,
}: {
  session: Session;
  fork: Fork;
  draft: Draft;
  setDraft: (change: (d: Draft) => Draft) => void;
  canConfirm: boolean;
  onConfirm: () => void;
  onRetry: () => void;
}) {
  const result = session.options[fork.id];
  const status = useAiStatus(`options:${fork.id}`);
  const { mode } = useSession();
  const toggle = (kind: "own" | "later" | "ai") =>
    setDraft((d) => ({ ...d, selected: d.selected === kind ? null : kind, optionId: null, editing: false }));

  return (
    <article>
      <p className="text-sm text-zinc-600">{fork.screen}</p>
      <h2 className="mt-1 text-2xl font-semibold leading-snug text-zinc-900">&ldquo;{fork.moment}&rdquo;</h2>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <p className="text-sm text-zinc-700">
          <span className="font-medium text-zinc-900">What the PRD says:</span>{" "}
          {fork.prd_says || <span className="text-zinc-600">Not recorded.</span>}
        </p>
        <RiskBadge risk={fork.risk} />
      </div>

      {result && result.options.length > 0 ? (
        <>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {result.options.map((opt) => (
              <OptionCard key={opt.id} option={opt} draft={draft} setDraft={setDraft} />
            ))}
          </div>
          {/* A live mockup under each option card: Ladle's look in the demo, a wireframe live. */}
          {result.options.some((o) => o.mockup) && (
            <div className="mt-4 grid grid-cols-3 gap-4">
              {result.options.map((opt) =>
                opt.mockup ? (
                  <MockupPhone key={opt.id} mockup={opt.mockup} look={mode === "demo" ? "ladle" : "wireframe"} label={`Option ${opt.id}`} />
                ) : (
                  <div key={opt.id} />
                ),
              )}
            </div>
          )}
        </>
      ) : status?.state === "loading" ? (
        // D3: three grey placeholder cards while Claude thinks.
        <div className="mt-8">
          <div aria-hidden="true" className="grid grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-56 animate-pulse rounded-lg bg-zinc-100" />
            ))}
          </div>
          <div className="mt-3">
            <AiLoading label="Thinking through options…" />
          </div>
        </div>
      ) : status?.state === "error" ? (
        <div className="mt-8">
          <AiError detail={status.detail} onRetry={onRetry} />
        </div>
      ) : (
        <p className="mt-8 rounded-md border border-dashed border-zinc-300 px-4 py-6 text-sm text-zinc-600">
          No options were recorded for this fork.
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" aria-pressed={draft.selected === "own"} onClick={() => toggle("own")}
          className={draft.selected === "own" ? btn.toggleOn : btn.toggleOff}>
          Write my own
        </button>
        <button type="button" aria-pressed={draft.selected === "later"} onClick={() => toggle("later")}
          className={draft.selected === "later" ? btn.toggleOn : btn.toggleOff}>
          Decide later
        </button>
        <button type="button" aria-pressed={draft.selected === "ai"} onClick={() => toggle("ai")}
          className={draft.selected === "ai" ? btn.toggleOn : btn.toggleOff}>
          Fine, let the AI decide
        </button>
      </div>

      {draft.selected === "ai" && !result?.options.some((o) => o.id === result.recommended) && (
        <p className="mt-4 text-sm text-zinc-700">
          There&apos;s no recommendation to save yet, because no options have loaded for this fork.
        </p>
      )}

      {draft.selected === "own" && (
        <div className="mt-4">
          <label htmlFor="own" className="block text-sm font-medium text-zinc-900">My own decision</label>
          <textarea
            id="own"
            rows={3}
            value={draft.ownText}
            onChange={(e) => setDraft((d) => ({ ...d, ownText: e.target.value }))}
            className="mt-1 w-full rounded-md border border-zinc-300 p-3 text-sm focus-visible:outline-2 focus-visible:outline-blue-600"
          />
        </div>
      )}

      <div className="mt-6">
        <label htmlFor="why" className="block text-sm font-medium text-zinc-900">
          Why? <span className="font-normal text-zinc-600">(optional)</span>
        </label>
        <input
          id="why"
          type="text"
          value={draft.why}
          onChange={(e) => setDraft((d) => ({ ...d, why: e.target.value }))}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-blue-600"
        />
      </div>

      <div className="mt-8">
        <button type="button" className={btn.primary} disabled={!canConfirm} onClick={onConfirm}>
          Confirm &amp; next
        </button>
      </div>
    </article>
  );
}

function OptionCard({
  option,
  draft,
  setDraft,
}: {
  option: Option;
  draft: Draft;
  setDraft: (change: (d: Draft) => Draft) => void;
}) {
  const selected = draft.selected === "option" && draft.optionId === option.id;
  const edit = draft.edits[option.id];
  const editing = selected && draft.editing;
  const title = edit?.title ?? option.title;
  const description = edit?.description ?? option.description;

  // D4: click selects, click again deselects. Nothing advances on its own.
  const toggleSelect = () =>
    setDraft((d) =>
      selected
        ? { ...d, selected: null, optionId: null, editing: false }
        : { ...d, selected: "option", optionId: option.id, editing: false },
    );
  // D5: "Edit" turns the selected card's text into editable fields.
  const setEditing = (on: boolean) =>
    setDraft((d) => ({ ...d, editing: on, edits: { ...d.edits, [option.id]: { title, description } } }));
  const setText = (field: "title" | "description", value: string) =>
    setDraft((d) => ({ ...d, edits: { ...d.edits, [option.id]: { ...d.edits[option.id], [field]: value } } }));

  return (
    <div
      className={`flex flex-col rounded-lg border-2 bg-white p-4 ${selected ? "border-blue-600 ring-2 ring-blue-100" : "border-zinc-200"}`}
    >
      {editing ? (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-zinc-700">
            Title
            <input
              type="text"
              value={title}
              onChange={(e) => setText("title", e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm font-semibold text-zinc-900 focus-visible:outline-2 focus-visible:outline-blue-600"
            />
          </label>
          <label className="block text-xs font-medium text-zinc-700">
            Description
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setText("description", e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900 focus-visible:outline-2 focus-visible:outline-blue-600"
            />
          </label>
        </div>
      ) : (
        <button
          type="button"
          aria-pressed={selected}
          onClick={toggleSelect}
          className="flex-1 rounded-md text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
        >
          <span className="block text-xs font-medium text-zinc-600">Option {option.id}</span>
          <span className="mt-1 block font-semibold text-zinc-900">{title}</span>
          <span className="mt-2 block text-sm text-zinc-700">{description}</span>
        </button>
      )}
      <ul className="mt-4 space-y-1 text-sm text-zinc-800">
        <li><span aria-hidden="true">✅</span> <span className="sr-only">Upside:</span> {option.upside}</li>
        <li><span aria-hidden="true">⚠️</span> <span className="sr-only">Downside:</span> {option.downside}</li>
      </ul>
      {selected && (
        <button type="button" onClick={() => setEditing(!editing)} className={`${btn.link} mt-3 self-start`}>
          {editing ? "Done editing" : "Edit"}
        </button>
      )}
    </div>
  );
}

// ---------- Right column ----------

function DecisionLog({ session }: { session: Session }) {
  const entries = session.forks
    .filter((f) => session.decisions[f.id])
    .map((f) => ({ fork: f, decision: session.decisions[f.id] }))
    .sort((a, b) => b.decision.decidedAt - a.decision.decidedAt); // newest at the top

  return (
    <aside aria-label="Decision log" className="px-6 py-10">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">Decision log</h2>
      {entries.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-600">No decisions yet.</p>
      ) : (
        <ol className="mt-4 space-y-4">
          {entries.map(({ fork, decision }) => {
            const d = describeChoice(decision.choice);
            return (
              <li key={fork.id} className="rounded-md border border-zinc-200 p-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs text-zinc-600">{fork.screen}</span>
                  <StatusPill status={decisionStatus(decision)} />
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-zinc-700">{fork.moment}</p>
                <p className="mt-2 text-sm font-semibold text-zinc-900">{d.title}</p>
                {d.text && <p className="mt-1 text-sm text-zinc-800">{d.text}</p>}
                {decision.why && <p className="mt-2 text-sm text-zinc-600">Why: {decision.why}</p>}
              </li>
            );
          })}
        </ol>
      )}
    </aside>
  );
}
