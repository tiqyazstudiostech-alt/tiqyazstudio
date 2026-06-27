import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { signOutAction } from "@/app/actions/auth";
import { Button, Badge } from "@/components/ui";
import { PlanManager } from "./plan-manager";
import { Plan } from "@prisma/client";

export default async function AdminPage() {
  const session = await auth();

  const users = await db.user.findMany({
    where: { isDeleted: false },
    select: {
      id: true,
      name: true,
      email: true,
      subscription: { select: { plan: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const userRows = users.map((u) => ({
    id:    u.id,
    name:  u.name,
    email: u.email,
    plan:  u.subscription?.plan ?? Plan.FREE,
  }));

  return (
    <main className="flex flex-col gap-8 px-4 py-10 max-w-2xl mx-auto">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-gold mb-2">Content Management</p>
        <h1 className="font-display text-display leading-none tracking-tight text-ink">
          Admin
        </h1>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-ink-muted">Signed in as</p>
          <Badge variant="primary">Admin</Badge>
        </div>
        <p className="font-medium text-ink">{session?.user?.name ?? "—"}</p>
        <p className="text-sm text-ink-muted">{session?.user?.email}</p>
      </div>

      <PlanManager users={userRows} />

      <form action={signOutAction}>
        <Button type="submit" variant="ghost">
          Sign out
        </Button>
      </form>
    </main>
  );
}
