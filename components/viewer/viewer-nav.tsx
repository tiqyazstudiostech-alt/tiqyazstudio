import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProfileMenu } from "./profile-menu";

export async function ViewerNav() {
  const session = await auth();

  // Profile.avatarUrl is the user-uploaded photo (R2). Fall back to OAuth image.
  const profile = session?.user?.id
    ? await db.profile.findUnique({
        where: { userId: session.user.id },
        select: { avatarUrl: true },
      })
    : null;

  const avatarImage = profile?.avatarUrl ?? session?.user?.image ?? null;

  return (
    <header className="fixed top-0 inset-x-0 z-30 h-14 bg-background/90 backdrop-blur-md border-b border-border/50 flex items-center px-6 gap-6">
      <Link
        href="/home"
        className="font-display text-lg text-gold leading-none shrink-0 hover:text-gold-hover transition-colors"
      >
        Tiqyaz
      </Link>

      <nav className="flex items-center gap-1 flex-1">
        <NavLink href="/browse">Browse</NavLink>
        <NavLink href="/home">My List</NavLink>
      </nav>

      {session?.user && (
        <ProfileMenu
          name={session.user.name ?? null}
          email={session.user.email ?? null}
          image={avatarImage}
        />
      )}
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 text-sm text-ink-muted hover:text-ink rounded-md hover:bg-surface-raised transition-colors duration-150"
    >
      {children}
    </Link>
  );
}
