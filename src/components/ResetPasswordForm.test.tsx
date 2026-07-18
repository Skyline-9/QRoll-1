/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
expect.extend(matchers);
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
  let originalLocationDescriptor: PropertyDescriptor | undefined;

  beforeAll(() => {
    originalLocationDescriptor = Object.getOwnPropertyDescriptor(window, "location");
  });

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
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  afterAll(() => {
    if (originalLocationDescriptor) {
      Object.defineProperty(window, "location", originalLocationDescriptor);
    }
  });

  it("displays error when passwords do not match", async () => {
    render(<ResetPasswordForm />);
    const passInput = screen.getByLabelText("New Password");
    const confirmInput = screen.getByLabelText("Confirm Password");
    const submitBtn = screen.getByRole("button", { name: "Update Password" });

    fireEvent.change(passInput, { target: { value: "password123" } });
    fireEvent.change(confirmInput, { target: { value: "password456" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    });
  });

  it("submits successfully and redirects to dashboard", async () => {
    vi.useFakeTimers();

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
    fireEvent.click(submitBtn);

    await vi.runAllTimersAsync();

    expect(mockFetch).toHaveBeenCalled();
    expect(locationMock.href).toBe("/dashboard");
  });
});

