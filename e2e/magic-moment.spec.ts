// E2E — the automated proof of the concept, now ACROSS TWO ORIGINS:
// the student app (:3100) and the coach app (:3200) talk to one Supabase, so a
// story the student opens appears live on the coach's screen, they step in sync,
// and the student (not the coach) drives. The two video tiles are gone — both
// live views show the "Place your Zoom window here" placeholder.
//
// Requires both dev servers running (playwright.config starts them) + Supabase
// seeded. Gated on the public Supabase env. Run: npm run test:e2e
// (first time: npx playwright install chromium)
import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const STUDENT_URL = process.env.STUDENT_URL || "http://localhost:3100";
const COACH_URL = process.env.COACH_URL || "http://localhost:3200";
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Must equal config.SESSION_ID — guarded by tests/unit/config.test.ts.
const SEEDED_SESSION = "55555555-5555-5555-5555-555555555555";

test.skip(!SB_URL || !SB_ANON, "Supabase env not set (NEXT_PUBLIC_SUPABASE_URL + ANON_KEY).");

// The live class is hidden below 940px by design, so run wide.
const DESKTOP = { viewport: { width: 1280, height: 900 } };

async function login(page: Page, username: string, password: string) {
  await page.goto("/login");
  await page.locator('input[autocomplete="username"]').fill(username);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: /Log in/i }).click();
  // Each app is single-role and sends you home ("/") on success.
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 10_000 });
}

// Reset the shared session to a clean "scheduled, no story" state before each run.
// Uses the anon key (permissive POC RLS) — no service-role key needed.
test.beforeEach(async () => {
  const sb = createClient(SB_URL!, SB_ANON!);
  await sb
    .from("class_sessions")
    .update({
      story_key: null,
      status: "scheduled",
      current_step: 0,
      current_phase: null,
      driver: "student",
    })
    .eq("id", SEEDED_SESSION);
});

test("student opens a story → coach sees it live across domains → student drives", async ({
  browser,
}) => {
  const coachCtx = await browser.newContext({ ...DESKTOP, baseURL: COACH_URL });
  const studentCtx = await browser.newContext({ ...DESKTOP, baseURL: STUDENT_URL });
  const coach = await coachCtx.newPage();
  const student = await studentCtx.newPage();

  // Log in to each app (JSON-config auth, no server round-trip).
  await login(coach, "liza", "liza123");
  await login(student, "maya", "maya123");

  // Coach enters the live console and starts the class.
  await coach.goto("/live");
  await coach.getByRole("button", { name: /Start class/i }).click();
  await expect(coach.getByText(/Waiting for .* to open a story/i)).toBeVisible({
    timeout: 10_000,
  });
  // The Zoom placeholder replaced the two coach/student video tiles.
  await expect(coach.locator(".cp-zoom-stage")).toBeVisible();
  await expect(coach.locator(".cp-coach, .cp-student")).toHaveCount(0);

  // THE MAGIC MOMENT — the student joins the live class on the OTHER domain.
  // The configured story (The First Flight) auto-opens — no picker.
  await student.goto("/live");

  // The same story renders live on the coach's screen (cross-origin Realtime).
  await expect(coach.locator(".ct-story")).toContainText("The First Flight", { timeout: 15_000 });
  await expect(student.locator(".ct-story")).toContainText("The First Flight", {
    timeout: 15_000,
  });
  await expect(student.locator(".cp-zoom-stage")).toBeVisible();

  // The STUDENT drives: their Next is enabled, the coach's is not.
  const studentNext = student.getByRole("button", { name: /^Next/i });
  const coachNext = coach.getByRole("button", { name: /^Next/i });
  await expect(studentNext).toBeEnabled();
  await expect(coachNext).toBeDisabled();

  // Student advances; coach follows in lockstep.
  await studentNext.click();
  await expect(student.locator(".ex-counter")).toContainText("Step 2", { timeout: 10_000 });
  await expect(coach.locator(".ex-counter")).toContainText("Step 2", { timeout: 10_000 });

  await coachCtx.close();
  await studentCtx.close();
});

test("coach mirrors the student's answer visual (same option, same green/red verdict)", async ({
  browser,
}) => {
  const coachCtx = await browser.newContext({ ...DESKTOP, baseURL: COACH_URL });
  const studentCtx = await browser.newContext({ ...DESKTOP, baseURL: STUDENT_URL });
  const coach = await coachCtx.newPage();
  const student = await studentCtx.newPage();

  await login(coach, "liza", "liza123");
  await login(student, "maya", "maya123");

  await coach.goto("/live");
  await coach.getByRole("button", { name: /Start class/i }).click();
  await student.goto("/live");
  await expect(student.locator(".ct-story")).toContainText("The First Flight", { timeout: 15_000 });

  // Student drives to the first question: cover (Step 1) → listen (Step 2) →
  // first question (Step 3, an mcq for the configured G3 story).
  const studentNext = student.getByRole("button", { name: /^Next/i });
  await studentNext.click();
  await studentNext.click();
  await expect(student.locator(".ex-counter")).toContainText("Step 3", { timeout: 10_000 });
  await expect(coach.locator(".ex-counter")).toContainText("Step 3", { timeout: 10_000 });

  // The child answers — the option grid renders on both screens.
  const studentOpt0 = student.locator(".ge-opts .ge-opt").first();
  const coachOpt0 = coach.locator(".ge-opts .ge-opt").first();
  await expect(studentOpt0).toBeVisible();
  await studentOpt0.click();

  // The child sees their pick locked in with a verdict (green if right, red if wrong).
  await expect(studentOpt0).toHaveClass(/ge-opt-picked/);
  const studentClass = (await studentOpt0.getAttribute("class")) ?? "";
  const verdict = studentClass.includes("ge-opt-right") ? /ge-opt-right/ : /ge-opt-wrong/;

  // THE MIRROR — the coach screen shows the SAME option with the SAME verdict
  // (cross-origin Realtime), and the old text note is gone.
  await expect(coachOpt0).toHaveClass(/ge-opt-picked/, { timeout: 10_000 });
  await expect(coachOpt0).toHaveClass(verdict, { timeout: 10_000 });
  await expect(coach.locator(".ws-answer-note")).toHaveCount(0);

  await coachCtx.close();
  await studentCtx.close();
});
