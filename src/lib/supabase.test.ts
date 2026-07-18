import { describe, it, expect, vi, beforeAll } from "vitest";

beforeAll(() => {
  vi.stubEnv("PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "mock-publishable-key");
  vi.stubEnv("PUBLIC_SUPABASE_ANON_KEY", "mock-anon-key");
});

import { createSupabaseClient } from "./supabase";

describe("createSupabaseClient in DEV environment", () => {
  const mockCookies = {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  } as any;

  let client: any;

  beforeAll(() => {
    client = createSupabaseClient(mockCookies);
  });

  it("should return a dev proxy client", () => {
    expect(client).toBeDefined();
  });

  it("should mock auth.getSession", async () => {
    const { data, error } = await client.auth.getSession();
    expect(error).toBeNull();
    expect(data.session.user.email).toBe("michellezhuang1014@gmail.com");
    expect(data.session.user.user_metadata.full_name).toBe("Dev Admin (Bypass)");
  });

  it("should mock auth.resetPasswordForEmail", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    
    const { data, error } = await client.auth.resetPasswordForEmail("test@example.com", {
      emailRedirectTo: "http://localhost:3000/reset",
    });

    expect(error).toBeNull();
    expect(data).toEqual({});
    expect(consoleSpy).toHaveBeenCalled();
    
    // Check console logs contains email and reset link
    const logCalls = consoleSpy.mock.calls.map(call => call[0]).join("\n");
    expect(logCalls).toContain("Password Reset requested for: test@example.com");
    expect(logCalls).toContain("http://localhost:3000/reset&code=mock-reset-code");

    consoleSpy.mockRestore();
  });

  it("should mock auth.exchangeCodeForSession", async () => {
    const { data, error } = await client.auth.exchangeCodeForSession("mock-reset-code");
    
    expect(error).toBeNull();
    expect(data.session.user.email).toBe("michellezhuang1014@gmail.com");
    expect(data.session.user.id).toBeDefined();
  });

  it("should mock auth.updateUser", async () => {
    const { data, error } = await client.auth.updateUser({ password: "newpassword" });
    
    expect(error).toBeNull();
    expect(data.user.email).toBe("michellezhuang1014@gmail.com");
    expect(data.user.id).toBeDefined();
  });
});
