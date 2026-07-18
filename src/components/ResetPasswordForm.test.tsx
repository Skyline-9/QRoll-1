import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { ResetPasswordForm } from "./ResetPasswordForm";

// Mock global toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("ResetPasswordForm", () => {
  let locationMock: { href: string };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
    
    locationMock = { href: "http://localhost/reset-password" };
    Object.defineProperty(window, "location", {
      value: locationMock,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("displays error when passwords do not match", async () => {
    render(<ResetPasswordForm />);
    const passInput = screen.getByLabelText("New Password");
    const confirmInput = screen.getByLabelText("Confirm Password");
    const submitBtn = screen.getByRole("button", { name: "Update Password" });

    fireEvent.change(passInput, { target: { value: "password123" } });
    fireEvent.change(confirmInput, { target: { value: "password456" } });
    fireEvent.submit(submitBtn.closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("Passwords do not match")).toBeDefined();
    });
  });

  it("submits successfully and redirects to dashboard", async () => {
    const originalSetTimeout = window.setTimeout;
    vi.spyOn(window, "setTimeout").mockImplementation((cb: any, ms?: number) => {
      if (ms === 1000 && cb.toString().includes("dashboard")) {
        Promise.resolve().then(cb);
        return 999 as any;
      }
      return originalSetTimeout(cb, ms);
    });

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("Success"),
    });
    vi.stubGlobal("fetch", mockFetch);

    render(<ResetPasswordForm />);
    const passInput = screen.getByLabelText("New Password");
    const confirmInput = screen.getByLabelText("Confirm Password");
    const submitBtn = screen.getByRole("button", { name: "Update Password" });

    fireEvent.change(passInput, { target: { value: "password123" } });
    fireEvent.change(confirmInput, { target: { value: "password123" } });
    fireEvent.submit(submitBtn.closest("form")!);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
      expect(locationMock.href).toBe("/dashboard");
    });
  });
});
