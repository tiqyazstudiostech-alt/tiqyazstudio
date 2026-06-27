import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { AvatarUpload } from "./avatar-upload";
import { DisplayNameForm } from "./display-name-form";
import { PasswordForm } from "./password-form";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const [user, profile] = await Promise.all([
    db.user.findUnique({
      where:  { id: session.user.id },
      select: { name: true, hashedPassword: true },
    }),
    db.profile.findUnique({
      where:  { userId: session.user.id },
      select: { avatarUrl: true },
    }),
  ]);

  return (
    <div className="min-h-screen bg-background px-4 py-16">
      <div className="mx-auto w-full max-w-2xl flex flex-col gap-10">
        <div>
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-widest mb-1">
            Settings
          </p>
          <h1 className="text-2xl font-bold text-ink">Profile</h1>
        </div>

        <div className="h-px bg-border" />

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-ink">Avatar</h2>
          <AvatarUpload
            currentAvatarUrl={profile?.avatarUrl ?? null}
            name={user?.name ?? null}
          />
        </section>

        <div className="h-px bg-border" />

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-ink">Display name</h2>
          <DisplayNameForm currentName={user?.name ?? ""} />
        </section>

        <div className="h-px bg-border" />

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-ink">Password</h2>
          {user?.hashedPassword ? (
            <PasswordForm />
          ) : (
            <p className="text-sm text-ink-muted">
              This account uses Google Sign‑In — no password is set.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
