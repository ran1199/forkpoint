import { SessionProvider } from "@/components/SessionProvider";

// Demo version: same screens, fake/recorded data, fixed banner (D11).
export default function DemoLayout({ children }: LayoutProps<"/demo">) {
  return (
    <>
      <div
        role="note"
        className="fixed inset-x-0 top-0 z-50 bg-zinc-900 px-6 py-2 text-center text-sm text-white"
      >
        Recorded walkthrough using the Ladle PRD. Live version available on request.
      </div>
      <div className="pt-9">
        <SessionProvider mode="demo">{children}</SessionProvider>
      </div>
    </>
  );
}
