import Shell from "@/components/Shell";

// Every ported coach screen (the 9 routes) renders inside the 3-column app
// shell (icon rail | contextual sidebar | main). /login and /live live outside
// this route group, so they keep their own chrome.
export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
