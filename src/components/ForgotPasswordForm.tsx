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
