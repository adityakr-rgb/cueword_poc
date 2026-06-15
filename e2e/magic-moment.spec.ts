// E2E — the automated proof of the concept: a child logs in and opens a story,
// and the SAME story appears live on the coach's screen; then they step the
// lesson in sync and the student (not the coach) drives. Requires a running app
// + Supabase (with seed). Gated on env. Run: npm run test:e2e
import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SEEDED_SESSION = "55555555-5555-5555-5555-555555555555";

test.skip(!URL || !SERVICE, "Supabase env not set (NEXT_PUBLIC_SUPABASE_URL + SERVICE_ROLE_KEY).");

async function loginAs(page: Page, username: string, password: string, expectPath: RegExp) {
  await page.goto("/login");
  await page.locator('input[autocomplete="username"]').fill(username);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: /Log in/i }).click();
  await page.waitForURL(expectPath, { timeout: 10_000 });
}

// Reset the seeded session to a clean "scheduled, no story" state before each run.
test.beforeEach(async () => {
  const sb = createClient(URL!, SERVICE!);
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

test("child opens a story → coach sees it live → student drives in sync", async ({ browser }) => {
  const coachCtx = await browser.newContext();
  const studentCtx = await browser.newContext();
  const coach = await coachCtx.newPage();
  const student = await studentCtx.newPage();

  await loginAs(coach, "maya", "maya123", /\/coach/);
  await loginAs(student, "aanya", "aanya123", /\/student/);

  // Coach starts the class.
  await coach.getByRole("button", { name: /Start class/i }).click();
  await expect(coach.getByText(/Waiting for .* to open a story/i)).toBeVisible({ timeout: 10_000 });

  // THE MAGIC MOMENT — child taps a story on their slate.
  await student.getByRole("button", { name: /The First Flight/i }).click();

  // The same story now renders on the coach's screen, live.
  await expect(coach.locator(".ct-story")).toContainText("The First Flight", { timeout: 10_000 });
  await expect(student.locator(".ct-story")).toContainText("The First Flight", { timeout: 10_000 });

  // The STUDENT drives: their Next button is enabled; the coach's is not.
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
