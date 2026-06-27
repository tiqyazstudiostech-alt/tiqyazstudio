"use client";

import { useActionState } from "react";
import { Button, Badge } from "@/components/ui";
import { setUserPlanAction, type AdminActionResult } from "@/app/actions/admin";
import type { Plan } from "@prisma/client";

interface UserRow {
  id: string;
  name: string | null;
  email: string | null;
  plan: Plan;
}

export function PlanManager({ users }: { users: UserRow[] }) {
  const [state, action, isPending] = useActionState<AdminActionResult | null, FormData>(
    setUserPlanAction,
    null,
  );

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="font-semibold text-ink">User plans</h2>
      </div>

      {state && "error" in state && (
        <p className="px-6 py-2 text-sm text-error border-b border-border">{state.error}</p>
      )}
      {state && "success" in state && (
        <p className="px-6 py-2 text-sm text-success border-b border-border">{state.success}</p>
      )}

      <ul className="divide-y divide-border">
        {users.map((user) => (
          <li key={user.id} className="flex items-center justify-between gap-4 px-6 py-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink truncate">{user.name ?? "—"}</p>
              <p className="text-xs text-ink-muted truncate">{user.email}</p>
            </div>

            <form action={action} className="flex items-center gap-2 shrink-0">
              <input type="hidden" name="userId" value={user.id} />
              <Badge variant={user.plan === "PREMIUM" ? "primary" : "neutral"}>
                {user.plan}
              </Badge>
              <select
                name="plan"
                defaultValue={user.plan}
                className="text-xs bg-surface border border-border rounded px-2 py-1 text-ink focus:outline-none"
              >
                <option value="FREE">FREE</option>
                <option value="PREMIUM">PREMIUM</option>
              </select>
              <Button type="submit" size="sm" loading={isPending}>
                Set
              </Button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
