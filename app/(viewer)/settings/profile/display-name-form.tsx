"use client";

import { useActionState } from "react";
import { Button, Input } from "@/components/ui";
import { updateDisplayNameAction, type ProfileState } from "@/app/actions/profile";

export function DisplayNameForm({ currentName }: { currentName: string }) {
  const [state, action, isPending] = useActionState<ProfileState, FormData>(
    updateDisplayNameAction,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-4 max-w-sm">
      <Input
        name="name"
        type="text"
        label="Display name"
        defaultValue={currentName}
        placeholder="Your name"
        autoComplete="name"
      />

      {state && "error" in state && <p className="text-sm text-error">{state.error}</p>}
      {state && "success" in state && <p className="text-sm text-success">{state.success}</p>}

      <Button type="submit" loading={isPending} className="w-fit">
        Save name
      </Button>
    </form>
  );
}
