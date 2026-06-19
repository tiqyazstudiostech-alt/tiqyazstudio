"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type ActionResult } from "@/app/actions/auth";
import { Button, Input } from "@/components/ui";

export function SignUpForm() {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    registerAction,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-5">
      <Input name="name" type="text" label="Name" placeholder="Your name" autoComplete="name" />
      <Input name="email" type="email" label="Email" placeholder="your@email.com" autoComplete="email" />
      <Input
        name="password"
        type="password"
        label="Password"
        placeholder="••••••••"
        hint="At least 8 characters."
        autoComplete="new-password"
      />

      {state && "error" in state && (
        <p className="text-sm text-error">{state.error}</p>
      )}

      <Button type="submit" loading={isPending} className="w-full">
        Create account
      </Button>

      <p className="text-sm text-ink-muted text-center">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-gold hover:text-gold-hover transition-colors">
          Sign in
        </Link>
      </p>
    </form>
  );
}
