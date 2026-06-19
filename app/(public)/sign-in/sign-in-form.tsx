"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInAction, type ActionResult } from "@/app/actions/auth";
import { Button, Input } from "@/components/ui";

export function SignInForm() {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    signInAction,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-5">
      <Input name="email" type="email" label="Email" placeholder="your@email.com" autoComplete="email" />
      <Input
        name="password"
        type="password"
        label="Password"
        placeholder="••••••••"
        autoComplete="current-password"
      />

      {state && "error" in state && (
        <p className="text-sm text-error">{state.error}</p>
      )}

      <Button type="submit" loading={isPending} className="w-full">
        Sign in
      </Button>

      <p className="text-sm text-ink-muted text-center">
        <Link href="/reset-password" className="text-gold hover:text-gold-hover transition-colors">
          Forgot your password?
        </Link>
      </p>
      <p className="text-sm text-ink-muted text-center">
        No account?{" "}
        <Link href="/sign-up" className="text-gold hover:text-gold-hover transition-colors">
          Sign up
        </Link>
      </p>
    </form>
  );
}
