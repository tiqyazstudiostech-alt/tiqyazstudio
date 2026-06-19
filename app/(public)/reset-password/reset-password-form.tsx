"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordResetAction, type ActionResult } from "@/app/actions/auth";
import { Button, Input } from "@/components/ui";

export function ResetPasswordForm() {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    requestPasswordResetAction,
    null,
  );

  if (state && "success" in state) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-ink">{state.success}</p>
        <Link href="/sign-in" className="text-sm text-gold hover:text-gold-hover transition-colors">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <Input
        name="email"
        type="email"
        label="Email"
        placeholder="your@email.com"
        hint="We'll send you a link to reset your password."
        autoComplete="email"
        error={state && "error" in state ? state.error : undefined}
      />

      <Button type="submit" loading={isPending} className="w-full">
        Send reset link
      </Button>

      <p className="text-sm text-ink-muted text-center">
        <Link href="/sign-in" className="text-gold hover:text-gold-hover transition-colors">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
