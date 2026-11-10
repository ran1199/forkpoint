"use client";

// Small building blocks shared by the screens: buttons, labels, copy and download.

import { useState } from "react";
import type { Status } from "@/lib/session";
import type { Risk } from "@/lib/types";
import { RISK_LABEL } from "@/lib/session";
import { btn } from "./styles";

export { btn };


const STATUS_STYLE: Record<Exclude<Status, null>, string> = {
  Done: "bg-green-50 text-green-800 border-green-200",
  Current: "bg-blue-50 text-blue-800 border-blue-200",
  Later: "bg-amber-50 text-amber-900 border-amber-200",
  "AI-decided": "bg-violet-50 text-violet-800 border-violet-200",
};

export function StatusPill({ status }: { status: Status }) {
  if (!status) return null;
  return (
    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}>
      {status}
    </span>
  );
}

const RISK_STYLE: Record<Risk, string> = {
  high: "bg-red-50 text-red-800 border-red-200",
  med: "bg-amber-50 text-amber-900 border-amber-200",
  low: "bg-zinc-100 text-zinc-700 border-zinc-200",
};

export function RiskBadge({ risk }: { risk: Risk }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${RISK_STYLE[risk]}`}>
      Risk: {RISK_LABEL[risk]}
    </span>
  );
}

/** Copies text; the label briefly changes to "Copied ✓". */
export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }
  return (
    <button type="button" className={btn.secondary} onClick={copy}>
      <span aria-live="polite">{copied ? "Copied ✓" : label}</span>
    </button>
  );
}

/** Saves text as a file on the user's computer. */
export function downloadFile(filename: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Shown if the browser refuses to save (usually because its storage is full). */
export function SaveWarning({ failed }: { failed: boolean }) {
  if (!failed) return null;
  return (
    <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
      This browser couldn&apos;t save your latest change, probably because the uploaded files are too large.
      Remove a sketch or the PDF to free up space.
    </p>
  );
}

/** Every AI wait says what's happening (whole-app rule). */
export function AiLoading({ label }: { label: string }) {
  return (
    <p role="status" className="flex items-center gap-2 text-sm text-zinc-700">
      <span aria-hidden="true" className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
      {label}
    </p>
  );
}

/** D8: plain message + Retry. Never clears what the designer entered. */
export function AiError({ detail, onRetry }: { detail: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3">
      <p className="text-sm font-medium text-red-800">Couldn&apos;t reach Claude. Your work is saved.</p>
      {detail && <p className="mt-1 text-sm text-red-800">{detail}</p>}
      <button type="button" className={`${btn.secondary} mt-3`} onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}
