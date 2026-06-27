import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";

export default async function AdminShellLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = (session?.user as { role: Role } | undefined)?.role;
  if (!session?.user || role !== "ADMIN") redirect("/sign-in");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border px-6 py-3 flex items-center gap-6 shrink-0">
        <span className="text-xs uppercase tracking-[0.3em] text-gold font-medium">Tiqyaz CMS</span>
        <nav className="flex gap-4">
          <Link href="/admin" className="text-sm text-ink-muted hover:text-ink transition-colors">
            Dashboard
          </Link>
          <Link href="/admin/titles" className="text-sm text-ink-muted hover:text-ink transition-colors">
            Titles
          </Link>
          <Link href="/admin/collections" className="text-sm text-ink-muted hover:text-ink transition-colors">
            Collections
          </Link>
        </nav>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
