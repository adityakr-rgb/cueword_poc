"use client";
// App shell — sidebar nav, routing, profile chip, login gate.
// Ported from the mockup's module 18 (`App`). The mockup used a `route.view`
// state machine + a `go`/`nav` callback; here that becomes App Router routes
// (usePathname / Link). The Tweaks panel is dropped — its DEFAULTS are baked
// onto the shell root as inline CSS vars so the mockup's gold/warm look is the
// fixed default (see TWEAK_DEFAULTS / rootStyle in module 18).
import { useEffect } from "react";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout, useCurrentUser } from "@cueword/core/lib/auth";
import { isSupabaseConfigured } from "@cueword/core/lib/supabase/client";
import SetupNotice from "@cueword/core/components/SetupNotice";
import { Avatar, Ic, RESOURCES } from "@/components/Ic";
import { DATA } from "@/data/studentData";

// Mockup NAV mapped to App Router routes (faithful to the mockup's NAV order).
interface NavItem {
  href: string;
  label: string;
  icon: string;
}
const NAV: NavItem[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/lessons", label: "My Stories", icon: "books" },
  { href: "/workouts", label: "My Workouts", icon: "target" },
  { href: "/schedule", label: "My Classes", icon: "calendar" },
  { href: "/progress", label: "My Progress", icon: "chart" },
  { href: "/works", label: "My Work", icon: "folder" },
];

const CRUMB_LABEL: Record<string, string> = {
  "/": "Home",
  "/lessons": "My Stories",
  "/workouts": "My Workouts",
  "/schedule": "My Classes",
  "/progress": "My Progress",
  "/works": "My Work",
  "/story": "My Stories",
};

// Baked Tweaks defaults (module 18 TWEAK_DEFAULTS, roundness "rounded" → radius 1,
// textScale 100). Reproduces the mockup's on-screen default exactly.
const ACCENT = ["#F4A261", "#B55A1A", "#FEF0E4", "#7A3A0A"];
const MINOR = ["#F4C090", "#F4A261", "#FFF8E4", "#8A4E18"];
const ROOT_STYLE: CSSProperties = {
  "--gold": ACCENT[0],
  "--gold-deep": ACCENT[1],
  "--gold-wash": ACCENT[2],
  "--gold-ink": ACCENT[3],
  "--minor": MINOR[0],
  "--minor-deep": MINOR[1],
  "--minor-wash": MINOR[2],
  "--minor-ink": MINOR[3],
  "--minor-grad": `linear-gradient(150deg, color-mix(in srgb, ${MINOR[0]} 72%, #fff) 0%, ${MINOR[0]} 60%, ${MINOR[1]} 100%)`,
  "--gold-grad": `linear-gradient(135deg, color-mix(in srgb, ${ACCENT[0]} 82%, #fff) 0%, ${ACCENT[0]} 50%, ${ACCENT[1]} 100%)`,
  "--font-head": `"DM Serif Display", Georgia, serif`,
  "--font-body": `"DM Sans", system-ui, sans-serif`,
  "--r-sm": "12px",
  "--r-md": "18px",
  "--r-lg": "26px",
  "--r-xl": "34px",
  fontSize: "100%",
} as CSSProperties;

function navKeyFor(pathname: string): string {
  if (pathname === "/") return "/";
  // /story and any sub-route of /lessons highlight "My Stories"
  if (pathname.startsWith("/story") || pathname.startsWith("/lessons")) return "/lessons";
  const top = "/" + pathname.split("/")[1];
  return top;
}

export default function Shell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, ready } = useCurrentUser();

  // Gate the app on a logged-in student.
  useEffect(() => {
    if (ready && (!user || user.role !== "student")) router.replace("/login");
  }, [ready, user, router]);

  if (!isSupabaseConfigured) return <SetupNotice />;
  if (!ready) return null;
  if (!user || user.role !== "student") return null; // redirecting to /login

  const navKey = navKeyFor(pathname);
  const here = CRUMB_LABEL[navKey] || CRUMB_LABEL[pathname] || "Home";
  const s = DATA.student;

  const onLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <div className="app" style={ROOT_STYLE}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <img className="brand-logo" src={RESOURCES.brandIcon} alt="Cueword" width={40} height={40} />
          <div className="brand-word">
            cue<b>word</b>
          </div>
        </div>
        <nav className="nav">
          {NAV.map((n) => {
            const C = Ic[n.icon];
            return (
              <Link key={n.href} href={n.href} className={"nav-item" + (navKey === n.href ? " active" : "")}>
                <C /> {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="side-foot">
          <div className="profile-chip">
            <Avatar size={40} name={s.first} />
            <div>
              <div className="nm">{user.full_name}</div>
              <div className="gr">Grade {s.grade} · Student</div>
            </div>
          </div>
          <button className="sim-live" onClick={onLogout} title="Log out of your Cueword space">
            <i></i> Log out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        <div className="topbar">
          <div className="crumbs">
            <span className="here">{here}</span>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
