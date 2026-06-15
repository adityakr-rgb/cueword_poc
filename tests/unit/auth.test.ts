import { beforeEach, describe, expect, it, vi } from "vitest";

// auth.ts persists identity to localStorage and guards on `window`; stub both
// for the node test environment. (Stubs are applied before the tests run; the
// hoisted import of auth.ts touches neither at module-load time.)
const store: Record<string, string> = {};
vi.stubGlobal("localStorage", {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => {
    store[k] = v;
  },
  removeItem: (k: string) => {
    delete store[k];
  },
  clear: () => {
    for (const k of Object.keys(store)) delete store[k];
  },
  key: () => null,
  length: 0,
});
vi.stubGlobal("window", globalThis);

import { validateLogin, getCurrentUser, logout, HOME_FOR } from "@/lib/auth";
import { POC } from "@/lib/config";

describe("validateLogin (JSON-config auth)", () => {
  beforeEach(() => logout());

  it("accepts the coach credentials and persists a coach identity", () => {
    const u = validateLogin("coach", POC.coach.username, POC.coach.password);
    expect(u.role).toBe("coach");
    expect(u.full_name).toBe(POC.coach.displayName);
    expect(getCurrentUser()?.role).toBe("coach");
  });

  it("accepts the student credentials", () => {
    const u = validateLogin("student", POC.student.username, POC.student.password);
    expect(u.role).toBe("student");
    expect(u.full_name).toBe(POC.student.displayName);
  });

  it("is case-insensitive on username but exact on password", () => {
    expect(() =>
      validateLogin("coach", POC.coach.username.toUpperCase(), POC.coach.password),
    ).not.toThrow();
    expect(() => validateLogin("coach", POC.coach.username, POC.coach.password + "x")).toThrow();
  });

  it("rejects the other role's credentials (each app is role-scoped)", () => {
    expect(() =>
      validateLogin("coach", POC.student.username, POC.student.password),
    ).toThrow();
    expect(() =>
      validateLogin("student", POC.coach.username, POC.coach.password),
    ).toThrow();
  });

  it("HOME_FOR covers coach + student and has no admin", () => {
    expect(HOME_FOR.coach).toBeTruthy();
    expect(HOME_FOR.student).toBeTruthy();
    expect((HOME_FOR as Record<string, string>).admin).toBeUndefined();
  });
});
