"use client";

import { useState } from "react";
import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";

interface ProfileMenuProps {
  name: string | null;
  email: string | null;
  image: string | null;
}

export function ProfileMenu({ name, email, image }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const initial = (name ?? email ?? "U")[0].toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open profile menu"
        aria-expanded={open}
        className="w-8 h-8 rounded-full overflow-hidden bg-gold text-gold-fg text-sm font-bold flex items-center justify-center hover:ring-2 hover:ring-gold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={name ?? "Profile"} className="w-full h-full object-cover" />
        ) : (
          initial
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 top-10 z-50 w-52 bg-surface border border-border rounded-xl shadow-elevated overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              {name && <p className="text-sm font-medium text-ink truncate">{name}</p>}
              <p className="text-xs text-ink-muted truncate">{email}</p>
            </div>
            <nav className="py-1">
              <Link
                href="/settings/profile"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-ink hover:bg-surface-raised transition-colors"
              >
                Profile
              </Link>
              <Link
                href="/settings/subscription"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-ink hover:bg-surface-raised transition-colors"
              >
                Subscription
              </Link>
              <Link
                href="/settings/preferences"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-ink hover:bg-surface-raised transition-colors"
              >
                Preferences
              </Link>
            </nav>
            <div className="border-t border-border py-1">
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="w-full text-left px-4 py-2 text-sm text-error hover:bg-surface-raised transition-colors"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
