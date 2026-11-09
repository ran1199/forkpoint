import Link from "next/link";
import { btn } from "@/components/styles";

// Landing page: what Forkpoint is, and the two ways in.
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-10 py-20">
      <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">Forkpoint</h1>
      <p className="mt-6 text-lg leading-8 text-zinc-700">
        Forkpoint reads your PRD and sketches, finds the interaction and flow decisions the PRD leaves open,
        and asks you to make each one. It then turns your decisions into a prompt for Claude Code, so your
        prototyping tool doesn&apos;t have to guess.
      </p>
      <div className="mt-10 flex gap-4">
        <Link href="/demo" className={btn.primary}>
          View demo (Ladle)
        </Link>
        {/* The password prompt is added in Phase 4 (D10). */}
        <Link href="/app" className={btn.secondary}>
          Use live version
        </Link>
      </div>
    </main>
  );
}
