import { SessionProvider } from "@/components/SessionProvider";

// Live version. The password gate (D10) is added in Phase 4.
export default function LiveLayout({ children }: LayoutProps<"/app">) {
  return <SessionProvider mode="app">{children}</SessionProvider>;
}
