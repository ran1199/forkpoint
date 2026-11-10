"use client";

// Screen 3: Review. Every fork and its decision, grouped by lens. "Decide later" items first.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/SessionProvider";
import { AiError, AiLoading, btn, SaveWarning, StatusPill } from "@/components/ui";
import { writePrompt } from "@/lib/ai-client";
import { setAiStatus, useAiStatus } from "@/lib/ai-status";
import { FAKE_EXPORT } from "@/lib/fake-data";
import { decisionStatus, describeChoice, groupByLens, LENS_LABEL } from "@/lib/session";
import type { Fork } from "@/lib/types";

export function ReviewScreen() {
  const { session, update, saveFailed, files, mode, base } = useSession();
  const router = useRouter();
  const status = useAiStatus("prompt");

  if (session.forks.length === 0) {
    return (
      <main className="mx-auto max-w-4xl px-10 py-12">
        <h1 className="text-2xl font-semibold text-zinc-900">Review</h1>
        <p className="mt-4 text-zinc-700">
          Nothing to review yet. <Link href={base} className={btn.link}>Go to Setup</Link>
        </p>
      </main>
    );
  }

  // Edit reopens the fork on Screen 2.
  function edit(id: string) {
    update((s) => ({ ...s, currentForkId: id }));
    router.push(`${base}/walkthrough`);
  }

  async function generate() {
    if (mode === "demo") {
      // Demo makes no AI calls: it shows the recorded (Phase 2: placeholder) export.
      update((s) => ({ ...s, export: s.export ?? FAKE_EXPORT }));
      router.push(`${base}/export`);
      return;
    }
    // Call C: write the Claude Code prompt and checklist.
    setAiStatus("prompt", { state: "loading" });
    try {
      const result = await writePrompt(session, files);
      update((s) => ({ ...s, export: result }));
      setAiStatus("prompt", null);
      router.push(`${base}/export`);
    } catch (error) {
      setAiStatus("prompt", { state: "error", detail: error instanceof Error ? error.message : "" });
    }
  }
  const loading = status?.state === "loading";

  const later = session.forks.filter((f) => session.decisions[f.id]?.choice.kind === "later");

  const renderItem = (fork: Fork) => {
    const decision = session.decisions[fork.id];
    const d = decision ? describeChoice(decision.choice) : null;
    return (
      <li key={fork.id} className="flex items-start justify-between gap-6 rounded-md border border-zinc-200 p-4">
        <div className="min-w-0">
          <p className="text-xs text-zinc-600">{fork.screen}</p>
          <p className="mt-1 text-sm text-zinc-700">&ldquo;{fork.moment}&rdquo;</p>
          {d ? (
            <>
              <p className="mt-2 text-sm font-semibold text-zinc-900">{d.title}</p>
              {d.text && <p className="mt-1 text-sm text-zinc-800">{d.text}</p>}
              {decision!.why && <p className="mt-1 text-sm text-zinc-600">Why: {decision!.why}</p>}
            </>
          ) : (
            <p className="mt-2 text-sm text-zinc-600">Not decided yet.</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <StatusPill status={decisionStatus(decision)} />
          <button type="button" className={btn.secondary} onClick={() => edit(fork.id)}
            aria-label={`Edit: ${fork.moment}`}>
            Edit
          </button>
        </div>
      </li>
    );
  };

  return (
    <main className="mx-auto max-w-4xl px-10 py-12">
      <SaveWarning failed={saveFailed} />
      <h1 className="text-2xl font-semibold text-zinc-900">Review</h1>

      {later.length > 0 && (
        <section aria-labelledby="later-heading" className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-5">
          <h2 id="later-heading" className="text-base font-semibold text-amber-900">
            Decide later ({later.length})
          </h2>
          <ul className="mt-3 space-y-3">
            {later.map(renderItem)}
          </ul>
        </section>
      )}

      {groupByLens(session.forks).map((group) => (
        <section key={group.lens} className="mt-10">
          <h2 className="text-lg font-semibold text-zinc-900">{LENS_LABEL[group.lens]}</h2>
          <ul className="mt-3 space-y-3">
            {group.forks.map(renderItem)}
          </ul>
        </section>
      ))}

      <div className="mt-12 space-y-4">
        <button type="button" className={btn.primary} disabled={loading} onClick={generate}>
          Generate prompt
        </button>
        {loading && <AiLoading label="Writing your Claude Code prompt and checklist… This can take a minute." />}
        {status?.state === "error" && <AiError detail={status.detail} onRetry={generate} />}
      </div>
    </main>
  );
}
