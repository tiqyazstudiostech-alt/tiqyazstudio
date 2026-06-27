import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getEntitlements } from "@/lib/entitlements";
import { Button, Badge } from "@/components/ui";

export default async function SubscriptionPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const entitlements = await getEntitlements(session.user.id);
  const isPremium = entitlements.plan === "PREMIUM";

  return (
    <main className="flex flex-col gap-8 px-4 py-10 max-w-lg mx-auto">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-gold mb-1">Account</p>
        <h1 className="font-display text-3xl text-ink">Your plan</h1>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-ink-muted">Current plan</span>
          <Badge variant={isPremium ? "primary" : "neutral"}>
            {isPremium ? "Premium" : "Free"}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-ink-muted">Video quality</span>
          <span className="text-sm font-medium text-ink">{entitlements.maxQuality}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-ink-muted">Catalog access</span>
          <span className="text-sm font-medium text-ink">
            {isPremium ? "Full catalog" : "Limited catalog"}
          </span>
        </div>
      </div>

      {!isPremium && (
        <div className="bg-surface-raised border border-border rounded-xl p-6 flex flex-col gap-3">
          <p className="font-semibold text-ink">Upgrade to Premium</p>
          <p className="text-sm text-ink-muted">
            Get HD streaming and access to the full catalog, including exclusive titles.
          </p>
          <Button disabled className="w-fit">
            Upgrade — coming soon
          </Button>
        </div>
      )}
    </main>
  );
}
