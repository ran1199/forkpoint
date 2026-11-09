"use client";

// Screen 1: Setup. Paste the PRD or upload a PDF, add up to 5 sketches.

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { btn, SaveWarning } from "@/components/ui";
import { withFakeForks } from "@/lib/fake-data";
import type { Sketch } from "@/lib/types";

const MAX_PDF_BYTES = 2 * 1024 * 1024; // under 2 MB
const MAX_SKETCHES = 5;
const MAX_EDGE = 1568; // D2: longest side after resizing

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** D2: shrink to max 1568 px on the long edge and save as JPEG, in the browser. */
async function resizeToJpeg(file: File): Promise<Omit<Sketch, "id" | "name">> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff"; // transparent PNG areas become white
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return { dataUrl: canvas.toDataURL("image/jpeg", 0.85), width, height };
}

function formatMb(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function SetupScreen() {
  const { session, update, saveFailed, base } = useSession();
  const router = useRouter();
  const [pdfError, setPdfError] = useState("");
  const [sketchError, setSketchError] = useState("");

  const hasPrd = session.prdText.trim() !== "" || session.prdPdf !== null;

  async function onPdf(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf") return setPdfError("Please choose a PDF file.");
    if (file.size >= MAX_PDF_BYTES)
      return setPdfError(`That PDF is ${formatMb(file.size)}. Please use a PDF under 2 MB.`);
    setPdfError("");
    const dataUrl = await readAsDataUrl(file);
    update((s) => ({ ...s, prdPdf: { name: file.name, size: file.size, dataUrl } }));
  }

  async function onSketches(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    const messages: string[] = [];
    const room = MAX_SKETCHES - session.sketches.length;
    const images = files.filter((f) => {
      const ok = f.type === "image/png" || f.type === "image/jpeg";
      if (!ok) messages.push(`${f.name} isn't a PNG or JPG.`);
      return ok;
    });
    if (images.length > room) messages.push(`You can add up to ${MAX_SKETCHES} sketches.`);
    const added: Sketch[] = [];
    for (const file of images.slice(0, Math.max(0, room))) {
      try {
        added.push({ id: crypto.randomUUID(), name: file.name, ...(await resizeToJpeg(file)) });
      } catch {
        messages.push(`${file.name} couldn't be read.`);
      }
    }
    setSketchError(messages.join(" "));
    if (added.length) update((s) => ({ ...s, sketches: [...s.sketches, ...added].slice(0, MAX_SKETCHES) }));
  }

  function start() {
    // Phase 2: the fake Ladle forks stand in for Claude's answer (call A, Phase 3).
    update((s) => (s.forks.length ? s : withFakeForks(s)));
    router.push(`${base}/walkthrough`);
  }

  return (
    <main className="mx-auto max-w-4xl px-10 py-12">
      <SaveWarning failed={saveFailed} />
      <h1 className="text-2xl font-semibold text-zinc-900">Setup</h1>

      <section className="mt-8">
        <label htmlFor="prd" className="block text-base font-medium text-zinc-900">
          Paste your PRD
        </label>
        <textarea
          id="prd"
          value={session.prdText}
          onChange={(e) => update((s) => ({ ...s, prdText: e.target.value }))}
          rows={14}
          className="mt-2 w-full rounded-md border border-zinc-300 p-3 text-sm text-zinc-900 focus-visible:outline-2 focus-visible:outline-blue-600"
        />

        <p className="mt-4 text-sm text-zinc-600">or upload it as a PDF (one file, under 2 MB)</p>
        <div className="mt-2 flex items-center gap-3">
          <label className={`${btn.secondary} cursor-pointer focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-blue-600`}>
            Upload PDF
            <input type="file" accept="application/pdf" className="sr-only" onChange={onPdf} />
          </label>
          {session.prdPdf && (
            <span className="flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-800">
              {session.prdPdf.name} ({formatMb(session.prdPdf.size)})
              <button
                type="button"
                aria-label={`Remove ${session.prdPdf.name}`}
                onClick={() => update((s) => ({ ...s, prdPdf: null }))}
                className="rounded px-1 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                ×
              </button>
            </span>
          )}
        </div>
        {pdfError && <p role="alert" className="mt-2 text-sm text-red-700">{pdfError}</p>}
      </section>

      <section className="mt-10">
        <h2 className="text-base font-medium text-zinc-900">Sketches</h2>
        <p className="mt-1 text-sm text-zinc-600">PNG or JPG, up to {MAX_SKETCHES} images.</p>
        <div className="mt-3 flex flex-wrap gap-4">
          {session.sketches.map((sk) => (
            <figure key={sk.id} className="relative h-32 w-32 overflow-hidden rounded-md border border-zinc-200 bg-zinc-50">
              {/* eslint-disable-next-line @next/next/no-img-element -- local data URL thumbnail */}
              <img src={sk.dataUrl} alt={sk.name} className="h-full w-full object-cover" />
              <button
                type="button"
                aria-label={`Remove ${sk.name}`}
                onClick={() => update((s) => ({ ...s, sketches: s.sketches.filter((x) => x.id !== sk.id) }))}
                className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-zinc-800 shadow hover:bg-white focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                ×
              </button>
            </figure>
          ))}
        </div>
        {session.sketches.length < MAX_SKETCHES && (
          <label className={`${btn.secondary} mt-3 cursor-pointer focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-blue-600`}>
            Add sketches
            <input type="file" accept="image/png,image/jpeg" multiple className="sr-only" onChange={onSketches} />
          </label>
        )}
        {sketchError && <p role="alert" className="mt-2 text-sm text-red-700">{sketchError}</p>}
      </section>

      <div className="mt-12">
        <button type="button" className={btn.primary} disabled={!hasPrd} onClick={start}>
          Start walkthrough
        </button>
      </div>
    </main>
  );
}
