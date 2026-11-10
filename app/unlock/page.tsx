import type { Metadata } from "next";
import { UnlockForm } from "./UnlockForm";

export const metadata: Metadata = { title: "Forkpoint: live version" };

// The password prompt in front of the live version (landing → "Use live version").
export default function UnlockPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-10 py-20">
      <h1 className="text-2xl font-semibold text-zinc-900">Live version</h1>
      <UnlockForm />
    </main>
  );
}
