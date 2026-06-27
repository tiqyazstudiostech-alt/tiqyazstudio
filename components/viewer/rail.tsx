import type { ReactNode } from "react";

interface RailProps {
  heading: string;
  children: ReactNode;
  empty?: string;
}

export function Rail({ heading, children, empty }: RailProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-semibold text-ink px-6 text-base">{heading}</h2>
      {/* Scroll container — negative margin + padding trick to keep card shadows visible */}
      <div
        className="flex gap-3 overflow-x-auto px-6 pb-3"
        style={{ scrollbarWidth: "none" }}
      >
        {/* WebKit scrollbar hide — inline style can't target pseudo-elements,
            so we rely on scrollbarWidth for FF and the overflow clip on the
            scrollbar track for Chrome/Safari (which doesn't show a track when
            content fits, and clips when it doesn't). */}
        {children}
      </div>
      {empty && (
        <p className="px-6 text-sm text-ink-muted">{empty}</p>
      )}
    </section>
  );
}
