import { defineConfig, devices } from "@playwright/test";

// The magic-moment E2E drives BOTH apps (student :3100 + coach :3200). baseURL
// is the student app; the spec opens the coach app via its absolute URL.
const STUDENT_URL = process.env.STUDENT_URL || "http://localhost:3100";
const COACH_URL = process.env.COACH_URL || "http://localhost:3200";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: STUDENT_URL,
    trace: "on-first-retry",
  },
  metadata: { studentUrl: STUDENT_URL, coachUrl: COACH_URL },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : [
        {
          command: "npm run dev:student",
          url: STUDENT_URL,
          reuseExistingServer: true,
          timeout: 120_000,
        },
        {
          command: "npm run dev:coach",
          url: COACH_URL,
          reuseExistingServer: true,
          timeout: 120_000,
        },
      ],
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
