// Route-group layout: every student screen renders inside the ported Shell
// (sidebar nav + profile chip + topbar chrome), exactly like the mockup. The
// /login, /live and /story/[id] routes live OUTSIDE this group on purpose.
import type { ReactNode } from "react";
import Shell from "@/components/Shell";

export default function ShellLayout({ children }: { children: ReactNode }) {
  return <Shell>{children}</Shell>;
}
