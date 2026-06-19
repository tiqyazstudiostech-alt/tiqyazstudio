import { auth } from "@/lib/auth";
import { signOutAction } from "@/app/actions/auth";
import { Button, Badge } from "@/components/ui";

export default async function AdminPage() {
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-gold mb-2">Content Management</p>
        <h1 className="font-display text-display leading-none tracking-tight text-ink">
          Admin
        </h1>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 max-w-sm w-full flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-ink-muted">Signed in as</p>
          <Badge variant="primary">Admin</Badge>
        </div>
        <p className="font-medium text-ink">{session?.user?.name ?? "—"}</p>
        <p className="text-sm text-ink-muted">{session?.user?.email}</p>
      </div>

      <form action={signOutAction}>
        <Button type="submit" variant="ghost">
          Sign out
        </Button>
      </form>
    </main>
  );
}
