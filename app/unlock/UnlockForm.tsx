"use client";

import { useState } from "react";
import { btn } from "@/components/styles";

/** Where to go after unlocking: back to the live page that asked, never another site. */
function nextPage() {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && /^\/app(\/[a-z]*)?$/.test(next) ? next : "/app";
}

export function UnlockForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setChecking(true);
    setError("");
    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        // A full page load, so no remembered "locked" answer is reused.
        window.location.replace(nextPage());
        return;
      }
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Something went wrong. Please try again.");
    } catch {
      setError("The Forkpoint server couldn't be reached. Check your internet connection.");
    }
    setChecking(false);
  }

  return (
    <form onSubmit={submit} className="mt-6">
      <label htmlFor="password" className="block text-sm font-medium text-zinc-900">
        Password
      </label>
      <input
        id="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-blue-600"
      />
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <button type="submit" className={`${btn.primary} mt-4`} disabled={!password || checking}>
        {checking ? "Checking…" : "Continue"}
      </button>
    </form>
  );
}
