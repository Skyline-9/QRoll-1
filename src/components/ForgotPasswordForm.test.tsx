import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
expect.extend(matchers);
import { ForgotPasswordForm } from "./ForgotPasswordForm";

// Mock global toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("displays validation error for invalid email", async () => {
    render(<ForgotPasswordForm />);
    const emailInput = screen.getByLabelText("Email");
    const submitBtn = screen.getByRole("button", { name: "Send reset link" });

    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.submit(submitBtn.closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("Enter a valid email")).toBeInTheDocument();
    });
  });

  it("submits successfully and displays confirmation screen", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("Check your email for the link!"),
    });
    vi.stubGlobal("fetch", mockFetch);

    render(<ForgotPasswordForm />);
    const emailInput = screen.getByLabelText("Email");
    const submitBtn = screen.getByRole("button", { name: "Send reset link" });

    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.submit(submitBtn.closest("form")!);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
      expect(screen.getByText("Check your email for the link!")).toBeInTheDocument();
      expect(screen.getByText("Back to login")).toBeInTheDocument();
    });
  });
});
