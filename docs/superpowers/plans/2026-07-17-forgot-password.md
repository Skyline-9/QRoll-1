# Forgot Password Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a password recovery and reset flow for users who signed up with email/password and forgot their password.

**Architecture:** A dedicated `/forgot-password` page that requests a reset email from Supabase Auth (mocked in DEV mode), leading to a verification callback that signs the user in and redirects them to a `/reset-password` page to update their password.

**Tech Stack:** Astro SSR, React, React Hook Form, Zod, Supabase Auth (`@supabase/ssr`), Vitest, `@testing-library/react`.

## Global Constraints
- Use Tailwind CSS and follow the design guidelines in `DESIGN.md` (Warm Milk background, Eggplant Ink text/borders, and Soft Lavender/Fresh Mint accents).
- All shell commands must be prefixed with `rtk` (e.g., `rtk npm run test`).
- Write complete and self-contained tests for each component.

---

### Task 1: Update Supabase Client Dev Proxy

**Files:**
- Modify: `src/lib/supabase.ts` (around lines 450-492)
- Test: Run verification commands in local environment.

**Interfaces:**
- Consumes: None
- Produces: Mock implementations of `auth.resetPasswordForEmail`, `auth.exchangeCodeForSession`, and `auth.updateUser` when running in `import.meta.env.DEV`.

- [ ] **Step 1: Inspect the current Dev Proxy setup in supabase.ts**
  Read `/src/lib/supabase.ts` from lines 450 to 495 to confirm where we will hook our mocks.

- [ ] **Step 2: Modify the supabase.ts file to mock the reset functions**
  Replace the dev mode Proxy in `/src/lib/supabase.ts` so it intercepts `resetPasswordForEmail`, `exchangeCodeForSession`, and `updateUser`.

  ```typescript
  if (import.meta.env.DEV) {
    return new Proxy(client, {
      get(target, prop, receiver) {
        if (prop === 'auth') {
          const auth = Reflect.get(target, prop, receiver);
          return new Proxy(auth, {
            get(authTarget, authProp, authReceiver) {
              if (authProp === 'getSession') {
                return async () => {
                  return {
                    data: {
                      session: {
                        user: {
                          id: mockAdminId,
                          email: 'michellezhuang1014@gmail.com',
                          user_metadata: { full_name: 'Dev Admin (Bypass)' },
                        },
                      },
                    },
                    error: null,
                  };
                };
              }
              if (authProp === 'resetPasswordForEmail') {
                return async (email: string, options: any) => {
                  const resetLink = `${options.emailRedirectTo || ''}&code=mock-reset-code`;
                  console.log('\n======================================');
                  console.log(`[DEV] Password Reset requested for: ${email}`);
                  console.log(`[DEV] Click this link to reset password:\n${resetLink}`);
                  console.log('======================================\n');
                  return { data: {}, error: null };
                };
              }
              if (authProp === 'exchangeCodeForSession') {
                return async (code: string) => {
                  return {
                    data: {
                      session: {
                        user: {
                          id: mockAdminId,
                          email: 'michellezhuang1014@gmail.com',
                        },
                      },
                    },
                    error: null,
                  };
                };
              }
              if (authProp === 'updateUser') {
                return async (attributes: any) => {
                  return {
                    data: {
                      user: {
                        id: mockAdminId,
                        email: 'michellezhuang1014@gmail.com',
                      },
                    },
                    error: null,
                  };
                };
              }
              return Reflect.get(authTarget, authProp, authReceiver);
            }
          });
        }

        if (prop === 'from') {
          return function(table: string) {
            return new MockQueryBuilder(table);
          };
        }

        return Reflect.get(target, prop, receiver);
      }
    });
  }
  ```

- [ ] **Step 3: Run existing unit tests to ensure no regressions**
  Run: `rtk npm run test`
  Expected: All existing tests pass.

- [ ] **Step 4: Commit changes**
  Run:
  ```bash
  git add src/lib/supabase.ts
  git commit -m "feat(auth): add password reset mock helpers to supabase dev client"
  ```

---

### Task 2: Create API Endpoints

**Files:**
- Create: `src/pages/api/auth/forgot-password.ts`
- Create: `src/pages/api/auth/reset-password.ts`

**Interfaces:**
- Consumes: Supabase SSR client instance
- Produces: API endpoints mapping:
  - `POST /api/auth/forgot-password` -> Sends reset email link.
  - `POST /api/auth/reset-password` -> Updates logged-in user password.

- [ ] **Step 1: Create forgot-password.ts API route**
  Create the file `/src/pages/api/auth/forgot-password.ts`:

  ```typescript
  import type { APIRoute } from 'astro';
  import { createSupabaseClient } from '../../../lib/supabase';

  export const POST: APIRoute = async ({ request, cookies, url }) => {
    const formData = await request.formData();
    const email = formData.get('email')?.toString();
    const next = '/reset-password';
    const baseUrl = import.meta.env.PUBLIC_APP_URL || url.origin;

    if (!email) {
      return new Response('Email is required', { status: 400 });
    }

    const supabase = createSupabaseClient(cookies);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${baseUrl}/api/auth/callback?next=${encodeURIComponent(next)}`,
    });

    if (error) {
      return new Response(error.message, { status: 400 });
    }

    return new Response('Check your email for the password reset link!', { status: 200 });
  };
  ```

- [ ] **Step 2: Create reset-password.ts API route**
  Create the file `/src/pages/api/auth/reset-password.ts`:

  ```typescript
  import type { APIRoute } from 'astro';
  import { createSupabaseClient } from '../../../lib/supabase';

  export const POST: APIRoute = async ({ request, cookies }) => {
    const formData = await request.formData();
    const password = formData.get('password')?.toString();

    if (!password || password.length < 6) {
      return new Response('Password must be at least 6 characters long', { status: 400 });
    }

    const supabase = createSupabaseClient(cookies);
    
    // Ensure user has a valid active session first
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return new Response('Unauthorized: Session not found', { status: 401 });
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      return new Response(error.message, { status: 400 });
    }

    return new Response('Password updated successfully', { status: 200 });
  };
  ```

- [ ] **Step 3: Commit API Routes**
  Run:
  ```bash
  git add src/pages/api/auth/forgot-password.ts src/pages/api/auth/reset-password.ts
  git commit -m "feat(auth): implement forgot-password and reset-password api endpoints"
  ```

---

### Task 3: Add Forgot Password Link & Create Forgot Password Form & Page

**Files:**
- Modify: `src/components/EmailAuthForm.tsx` (Add Forgot Password link next to Password Label)
- Create: `src/components/ForgotPasswordForm.tsx` (React Component)
- Create: `src/components/ForgotPasswordForm.test.tsx` (Vitest unit tests)
- Create: `src/pages/forgot-password.astro` (Astro Page)

**Interfaces:**
- Consumes: `/api/auth/forgot-password` endpoint.
- Produces: Accessible Forgot Password form showing validation status and handling submission.

- [ ] **Step 1: Add Forgot Password link to Login Form**
  Modify `/src/components/EmailAuthForm.tsx` around line 80:
  ```tsx
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <Label htmlFor="password">Password</Label>
      <a href="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground hover:underline">
        Forgot password?
      </a>
    </div>
    <Input
      id="password"
      type="password"
      autoComplete="current-password"
      placeholder="••••••••"
      {...form.register("password")}
    />
  ```

- [ ] **Step 2: Create ForgotPasswordForm.tsx**
  Create the file `/src/components/ForgotPasswordForm.tsx`:

  ```tsx
  import * as React from "react";
  import { useForm } from "react-hook-form";
  import { zodResolver } from "@hookform/resolvers/zod";
  import { z } from "zod";
  import { toast } from "sonner";
  import { Input } from "src/components/ui/input";
  import { Label } from "src/components/ui/label";
  import { Button } from "src/components/ui/button";

  const schema = z.object({
    email: z.string().email("Enter a valid email"),
  });

  type Values = z.infer<typeof schema>;

  export function ForgotPasswordForm() {
    const form = useForm<Values>({
      resolver: zodResolver(schema),
      defaultValues: { email: "" },
    });
    const [pending, setPending] = React.useState(false);
    const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
    const [isShaking, setIsShaking] = React.useState(false);

    const submit = async (values: Values) => {
      setPending(true);
      const fd = new FormData();
      fd.set("email", values.email);

      try {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          body: fd,
        });
        const text = await res.text();
        if (!res.ok) {
          toast.error(text || "Failed to request link");
          setIsShaking(true);
        } else {
          setSuccessMsg(text || "Reset link sent!");
          toast.success(text || "Reset link sent!");
        }
      } catch (e: any) {
        toast.error(e?.message || "Network error");
        setIsShaking(true);
      } finally {
        setPending(false);
      }
    };

    if (successMsg) {
      return (
        <div className="space-y-4 text-center">
          <p className="text-sm text-foreground">{successMsg}</p>
          <a href="/login" className="inline-block text-sm text-muted-foreground hover:underline">
            Back to login
          </a>
        </div>
      );
    }

    return (
      <form
        className={`space-y-4 ${isShaking ? "animate-shake" : ""}`}
        onAnimationEnd={() => setIsShaking(false)}
        onSubmit={form.handleSubmit(submit)}
      >
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...form.register("email")}
          />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Sending link…" : "Send reset link"}
          </Button>
          <a href="/login" className="text-center text-sm text-muted-foreground hover:underline mt-2">
            Back to login
          </a>
        </div>
      </form>
    );
  }
  ```

- [ ] **Step 3: Create ForgotPasswordForm.test.tsx**
  Create `/src/components/ForgotPasswordForm.test.tsx`:

  ```tsx
  import { describe, it, expect, vi, beforeEach } from "vitest";
  import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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

    it("displays validation error for invalid email", async () => {
      render(<ForgotPasswordForm />);
      const emailInput = screen.getByLabelText("Email");
      const submitBtn = screen.getByRole("button", { name: "Send reset link" });

      fireEvent.change(emailInput, { target: { value: "invalid-email" } });
      fireEvent.click(submitBtn);

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
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
        expect(screen.getByText("Check your email for the link!")).toBeInTheDocument();
        expect(screen.getByText("Back to login")).toBeInTheDocument();
      });
    });
  });
  ```

- [ ] **Step 4: Create forgot-password.astro page**
  Create the file `/src/pages/forgot-password.astro`:

  ```html
  ---
  import Layout from '../layouts/Layout.astro';
  import AstroCard from '../components/AstroCard.astro';
  import { ForgotPasswordForm } from '../components/ForgotPasswordForm';
  import PartyBackground from '../components/PartyBackground.astro';
  ---
  <Layout title="Forgot Password">
    <main class="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4 relative overflow-hidden">
      <PartyBackground />
      <AstroCard className="w-full max-w-md relative z-10 p-8 bg-white/80 backdrop-blur-md border border-[#ECE6F2]/80 shadow-[0_8px_30px_rgba(47,39,56,0.06),0_2px_8px_rgba(228,193,249,0.08)] translate-y-10">
        <div class="flex flex-col items-center mb-8">
          <h1 class="text-2xl font-bold tracking-tight text-center">Reset your password</h1>
          <p class="text-muted-foreground text-center mt-2 text-sm">Enter your email and we'll send you a password reset link.</p>
        </div>
        <ForgotPasswordForm client:load />
      </AstroCard>
    </main>
  </Layout>
  ```

- [ ] **Step 5: Run tests**
  Run: `rtk npm run test`
  Expected: The new ForgotPasswordForm test passes.

- [ ] **Step 6: Commit Page and Form**
  Run:
  ```bash
  git add src/components/EmailAuthForm.tsx src/components/ForgotPasswordForm.tsx src/components/ForgotPasswordForm.test.tsx src/pages/forgot-password.astro
  git commit -m "feat(auth): create forgot-password page and form components with unit tests"
  ```

---

### Task 4: Create Reset Password Form & Page

**Files:**
- Create: `src/components/ResetPasswordForm.tsx` (React Component)
- Create: `src/components/ResetPasswordForm.test.tsx` (Vitest unit tests)
- Create: `src/pages/reset-password.astro` (Astro Page)

**Interfaces:**
- Consumes: `/api/auth/reset-password` endpoint.
- Produces: Form validating and submitting new password updates, gating access to authenticated users.

- [ ] **Step 1: Create ResetPasswordForm.tsx**
  Create the file `/src/components/ResetPasswordForm.tsx`:

  ```tsx
  import * as React from "react";
  import { useForm } from "react-hook-form";
  import { zodResolver } from "@hookform/resolvers/zod";
  import { z } from "zod";
  import { toast } from "sonner";
  import { Input } from "src/components/ui/input";
  import { Label } from "src/components/ui/label";
  import { Button } from "src/components/ui/button";

  const schema = z.object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm Password must be at least 6 characters"),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

  type Values = z.infer<typeof schema>;

  export function ResetPasswordForm() {
    const form = useForm<Values>({
      resolver: zodResolver(schema),
      defaultValues: { password: "", confirmPassword: "" },
    });
    const [pending, setPending] = React.useState(false);
    const [isShaking, setIsShaking] = React.useState(false);

    const submit = async (values: Values) => {
      setPending(true);
      const fd = new FormData();
      fd.set("password", values.password);

      try {
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          body: fd,
        });
        const text = await res.text();
        if (!res.ok) {
          toast.error(text || "Failed to reset password");
          setIsShaking(true);
        } else {
          toast.success("Password reset successfully!");
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 1000);
        }
      } catch (e: any) {
        toast.error(e?.message || "Network error");
        setIsShaking(true);
      } finally {
        setPending(false);
      }
    };

    return (
      <form
        className={`space-y-4 ${isShaking ? "animate-shake" : ""}`}
        onAnimationEnd={() => setIsShaking(false)}
        onSubmit={form.handleSubmit(submit)}
      >
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            {...form.register("password")}
          />
          {form.formState.errors.password && (
            <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            {...form.register("confirmPassword")}
          />
          {form.formState.errors.confirmPassword && (
            <p className="text-xs text-destructive">{form.formState.errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Updating…" : "Update Password"}
          </Button>
        </div>
      </form>
    );
  }
  ```

- [ ] **Step 2: Create ResetPasswordForm.test.tsx**
  Create the file `/src/components/ResetPasswordForm.test.tsx`:

  ```tsx
  import { describe, it, expect, vi, beforeEach } from "vitest";
  import { render, screen, fireEvent, waitFor } from "@testing-library/react";
  import { ResetPasswordForm } from "./ResetPasswordForm";

  // Mock global toast
  vi.mock("sonner", () => ({
    toast: {
      success: vi.fn(),
      error: vi.fn(),
    },
  }));

  describe("ResetPasswordForm", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      vi.stubGlobal("fetch", vi.fn());
      vi.stubGlobal("window", {
        location: { href: "" }
      });
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
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("Success"),
      });
      vi.stubGlobal("fetch", mockFetch);

      const locationMock = { href: "" };
      vi.stubGlobal("window", {
        location: locationMock,
      });

      render(<ResetPasswordForm />);
      const passInput = screen.getByLabelText("New Password");
      const confirmInput = screen.getByLabelText("Confirm Password");
      const submitBtn = screen.getByRole("button", { name: "Update Password" });

      fireEvent.change(passInput, { target: { value: "password123" } });
      fireEvent.change(confirmInput, { target: { value: "password123" } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
        expect(locationMock.href).toBe("/dashboard");
      });
    });
  });
  ```

- [ ] **Step 3: Create reset-password.astro page**
  Create the file `/src/pages/reset-password.astro`:

  ```html
  ---
  import Layout from '../layouts/Layout.astro';
  import AstroCard from '../components/AstroCard.astro';
  import { ResetPasswordForm } from '../components/ResetPasswordForm';
  import PartyBackground from '../components/PartyBackground.astro';
  import { createSupabaseClient } from '../lib/supabase';

  const supabase = createSupabaseClient(Astro.cookies);
  const { data: { session } } = await supabase.auth.getSession();

  // Redirect users to login if they try to access reset-password without an active session
  if (!session) {
    return Astro.redirect('/login');
  }
  ---
  <Layout title="Reset Password">
    <main class="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4 relative overflow-hidden">
      <PartyBackground />
      <AstroCard className="w-full max-w-md relative z-10 p-8 bg-white/80 backdrop-blur-md border border-[#ECE6F2]/80 shadow-[0_8px_30px_rgba(47,39,56,0.06),0_2px_8px_rgba(228,193,249,0.08)] translate-y-10">
        <div class="flex flex-col items-center mb-8">
          <h1 class="text-2xl font-bold tracking-tight text-center">Set new password</h1>
          <p class="text-muted-foreground text-center mt-2 text-sm">Please enter a new password to secure your account.</p>
        </div>
        <ResetPasswordForm client:load />
      </AstroCard>
    </main>
  </Layout>
  ```

- [ ] **Step 4: Run all tests**
  Run: `rtk npm run test`
  Expected: All unit tests pass.

- [ ] **Step 5: Commit changes**
  Run:
  ```bash
  git add src/components/ResetPasswordForm.tsx src/components/ResetPasswordForm.test.tsx src/pages/reset-password.astro
  git commit -m "feat(auth): create reset-password page and form components with unit tests"
  ```
