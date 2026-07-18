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
