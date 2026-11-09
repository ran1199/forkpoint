"use client";

// Screen 4: Export. The prompt, the checklist, and the whole session as JSON.

import Link from "next/link";
import { useSession } from "@/components/SessionProvider";
import { btn, CopyButton, downloadFile } from "@/components/ui";

export function ExportScreen() {
  const { session, base } = useSession();
  const result = session.export;

  if (!result) {
    return (
      <main className="mx-auto max-w-4xl px-10 py-12">
        <h1 className="text-2xl font-semibold text-zinc-900">Export</h1>
        <p className="mt-4 text-zinc-700">
          No prompt yet. Press &ldquo;Generate prompt&rdquo; on{" "}
          <Link href={`${base}/review`} className={btn.link}>Review</Link>.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-10 py-12">
      <h1 className="text-2xl font-semibold text-zinc-900">Export</h1>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900">
          <label htmlFor="prompt">Claude Code prompt</label>
        </h2>
        <textarea id="prompt" readOnly value={result.prompt_markdown} rows={14}
          className="mt-2 w-full rounded-md border border-zinc-300 bg-zinc-50 p-3 font-mono text-sm text-zinc-900 focus-visible:outline-2 focus-visible:outline-blue-600" />
        <div className="mt-3 flex gap-3">
          <CopyButton text={result.prompt_markdown} />
          <button type="button" className={btn.secondary}
            onClick={() => downloadFile("forkpoint-prompt.md", result.prompt_markdown, "text/markdown")}>
            Download .md
          </button>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-900">
          <label htmlFor="checklist">Decision checklist</label>
        </h2>
        <textarea id="checklist" readOnly value={result.checklist_markdown} rows={8}
          className="mt-2 w-full rounded-md border border-zinc-300 bg-zinc-50 p-3 font-mono text-sm text-zinc-900 focus-visible:outline-2 focus-visible:outline-blue-600" />
        <div className="mt-3 flex gap-3">
          <CopyButton text={result.checklist_markdown} />
          <button type="button" className={btn.secondary}
            onClick={() => downloadFile("forkpoint-checklist.md", result.checklist_markdown, "text/markdown")}>
            Download .md
          </button>
        </div>
      </section>

      <div className="mt-12">
        <button type="button" className={btn.primary}
          onClick={() => downloadFile("forkpoint-session.json", JSON.stringify(session, null, 2), "application/json")}>
          Download session
        </button>
      </div>
    </main>
  );
}
