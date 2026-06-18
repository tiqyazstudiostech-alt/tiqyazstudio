import {
  Button,
  Input,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Badge,
  Spinner,
  Skeleton,
} from "@/components/ui";

/* ── Section wrapper ──────────────────────────────────────────────────────── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="font-display text-title text-gold border-b border-border pb-3">{title}</h2>
      {children}
    </section>
  );
}

/* ── State row ────────────────────────────────────────────────────────────── */
function StateRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium uppercase tracking-widest text-ink-dim">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

/* ── Color swatch ─────────────────────────────────────────────────────────── */
function Swatch({ bg, label }: { bg: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`w-12 h-12 rounded-lg border border-border ${bg}`} />
      <p className="text-xs text-ink-muted text-center leading-tight max-w-[3.5rem]">{label}</p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
 * Styleguide page
 * ════════════════════════════════════════════════════════════════════════════ */
export default function StyleguidePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="border-b border-border px-8 py-16 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-gold mb-4">Design System</p>
        <h1 className="font-display text-hero leading-none tracking-tight text-ink mb-4">
          Tiqyaz
        </h1>
        <p className="text-ink-muted text-lg max-w-md mx-auto">
          African-inspired · Cinematic · Dark-first
        </p>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-16 flex flex-col gap-16">

        {/* ── Typography ─────────────────────────────────────────────────── */}
        <Section title="Typography">
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-xs text-ink-dim mb-1">font-display / text-hero</p>
              <p className="font-display text-hero leading-none tracking-tight text-ink">
                The Savanna
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-dim mb-1">font-display / text-display</p>
              <p className="font-display text-display leading-tight tracking-tight text-ink">
                Origins of Fire
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-dim mb-1">font-display / text-headline</p>
              <p className="font-display text-headline leading-snug text-ink">
                Dust and Gold
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-dim mb-1">font-display / text-title</p>
              <p className="font-display text-title text-ink">Season 2 — Episode 4</p>
            </div>
            <div>
              <p className="text-xs text-ink-dim mb-1">font-sans / text-base</p>
              <p className="text-ink leading-relaxed max-w-prose">
                A gripping story of resilience, set across the terracotta plains of East Africa.
                Stream exclusively on Tiqyaz.
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-dim mb-1">font-sans / text-sm — ink-muted</p>
              <p className="text-sm text-ink-muted">
                Released 2026 · 1h 52m · Drama · Rated 16
              </p>
            </div>
          </div>
        </Section>

        {/* ── Colour palette ─────────────────────────────────────────────── */}
        <Section title="Colour tokens">
          <div className="flex flex-col gap-4">
            <StateRow label="Surfaces">
              <Swatch bg="bg-background"     label="background" />
              <Swatch bg="bg-surface"        label="surface" />
              <Swatch bg="bg-surface-raised" label="surface-raised" />
              <Swatch bg="bg-overlay"        label="overlay" />
              <Swatch bg="bg-border"         label="border" />
              <Swatch bg="bg-border-strong"  label="border-strong" />
            </StateRow>
            <StateRow label="Primary – gold">
              <Swatch bg="bg-gold"        label="gold" />
              <Swatch bg="bg-gold-hover"  label="gold-hover" />
              <Swatch bg="bg-gold-active" label="gold-active" />
              <Swatch bg="bg-gold-fg"     label="gold-fg" />
            </StateRow>
            <StateRow label="Secondary – terra">
              <Swatch bg="bg-terra"        label="terra" />
              <Swatch bg="bg-terra-hover"  label="terra-hover" />
              <Swatch bg="bg-terra-active" label="terra-active" />
              <Swatch bg="bg-terra-fg"     label="terra-fg" />
            </StateRow>
            <StateRow label="Ink / text">
              <Swatch bg="bg-ink"       label="ink" />
              <Swatch bg="bg-ink-muted" label="ink-muted" />
              <Swatch bg="bg-ink-dim"   label="ink-dim" />
            </StateRow>
            <StateRow label="Status">
              <Swatch bg="bg-success" label="success" />
              <Swatch bg="bg-warning" label="warning" />
              <Swatch bg="bg-error"   label="error" />
              <Swatch bg="bg-info"    label="info" />
            </StateRow>
          </div>
        </Section>

        {/* ── Button ─────────────────────────────────────────────────────── */}
        <Section title="Button">
          <StateRow label="Variants — default (hover / focus / active via CSS)">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
          </StateRow>

          <StateRow label="Sizes">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </StateRow>

          <StateRow label="Loading">
            <Button variant="primary"   loading>Primary</Button>
            <Button variant="secondary" loading>Secondary</Button>
            <Button variant="ghost"     loading>Ghost</Button>
          </StateRow>

          <StateRow label="Disabled">
            <Button variant="primary"   disabled>Primary</Button>
            <Button variant="secondary" disabled>Secondary</Button>
            <Button variant="ghost"     disabled>Ghost</Button>
          </StateRow>
        </Section>

        {/* ── Input ──────────────────────────────────────────────────────── */}
        <Section title="Input">
          <div className="grid gap-5 max-w-sm">
            <Input label="Default"      placeholder="Search titles…" />
            <Input label="With hint"    placeholder="your@email.com"
                   hint="We'll never share your email." />
            <Input label="Error state"  placeholder="your@email.com"
                   defaultValue="notanemail" error="Enter a valid email address." />
            <Input label="Disabled"     placeholder="Unavailable" disabled />
          </div>
        </Section>

        {/* ── Card ───────────────────────────────────────────────────────── */}
        <Section title="Card">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <p className="font-display text-title text-ink">Default Card</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-ink-muted">Surface background, default border.</p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Action</Button>
                <Button size="sm" variant="ghost">Cancel</Button>
              </CardFooter>
            </Card>

            <Card elevated>
              <CardHeader>
                <p className="font-display text-title text-ink">Elevated Card</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-ink-muted">Surface-raised background, stronger shadow.</p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Action</Button>
                <Button size="sm" variant="ghost">Cancel</Button>
              </CardFooter>
            </Card>
          </div>
        </Section>

        {/* ── Badge ──────────────────────────────────────────────────────── */}
        <Section title="Badge">
          <StateRow label="Variants">
            <Badge variant="primary">Primary</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="neutral">Neutral</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="info">Info</Badge>
          </StateRow>

          <StateRow label="In context">
            <Badge variant="primary">New</Badge>
            <Badge variant="secondary">Series</Badge>
            <Badge variant="neutral">Drama</Badge>
            <Badge variant="warning">18+</Badge>
            <Badge variant="error">Expiring soon</Badge>
          </StateRow>
        </Section>

        {/* ── Spinner ────────────────────────────────────────────────────── */}
        <Section title="Spinner">
          <StateRow label="Sizes">
            <div className="flex flex-col items-center gap-1">
              <Spinner size="sm" />
              <span className="text-xs text-ink-dim">sm</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Spinner size="md" />
              <span className="text-xs text-ink-dim">md</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Spinner size="lg" />
              <span className="text-xs text-ink-dim">lg</span>
            </div>
          </StateRow>
        </Section>

        {/* ── Skeleton ───────────────────────────────────────────────────── */}
        <Section title="Skeleton">
          <StateRow label="Shapes">
            <div className="flex flex-col gap-3 w-full max-w-sm">
              {/* Card skeleton */}
              <Skeleton className="w-full h-40 rounded-xl" />
              <div className="flex gap-3">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex flex-col gap-2 flex-1">
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                  <Skeleton className="h-3 w-1/2 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-3 w-full rounded-md" />
              <Skeleton className="h-3 w-5/6 rounded-md" />
              <Skeleton className="h-3 w-4/6 rounded-md" />
            </div>
          </StateRow>
        </Section>

      </main>
    </div>
  );
}
