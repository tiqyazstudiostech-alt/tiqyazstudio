"use client";

import { useActionState } from "react";
import { Button, Input } from "@/components/ui";
import { changePasswordAction, type ProfileState } from "@/app/actions/profile";

export function PasswordForm() {
  const [state, action, isPending] = useActionState<ProfileState, FormData>(
    changePasswordAction,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-4 max-w-sm">
      <Input
        name="currentPassword"
        type="password"
        label="Current password"
        placeholder="••••••••"
        autoComplete="current-password"
      />
      <Input
        name="newPassword"
        type="password"
        label="New password"
        placeholder="••••••••"
        hint="At least 8 characters."
        autoComplete="new-password"
      />
      <Input
        name="confirmPassword"
        type="password"
        label="Confirm new password"
        placeholder="••••••••"
        autoComplete="new-password"
      />

      {state && "error" in state && <p className="text-sm text-error">{state.error}</p>}
      {state && "success" in state && <p className="text-sm text-success">{state.success}</p>}

      <Button type="submit" loading={isPending} className="w-fit">
        Change password
      </Button>
    </form>
  );
}
