import Link from "next/link";

type TitleType = "FILM" | "SERIES" | "PODCAST";

interface PosterCardProps {
  href: string;
  title: string;
  posterUrl?: string;
  backdropUrl?: string;
  type: TitleType;
  isPremium: boolean;
}

const typeLabel: Record<TitleType, string> = {
  FILM:    "Film",
  SERIES:  "Series",
  PODCAST: "Podcast",
};

export function PosterCard({ href, title, posterUrl, backdropUrl, type, isPremium }: PosterCardProps) {
  const imageUrl = posterUrl ?? backdropUrl;

  return (
    <Link href={href} className="group flex flex-col gap-2">
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-surface-raised group-hover:ring-1 group-hover:ring-gold/40 transition-all duration-200">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-ink-dim text-xs text-center px-3 leading-snug">{title}</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

        {isPremium && (
          <div className="absolute top-2 left-2">
            <span className="text-gold text-[10px] font-semibold bg-black/75 rounded-full px-2 py-0.5 leading-none">
              PREMIUM
            </span>
          </div>
        )}

        <div className="absolute bottom-2 left-2">
          <span className="text-white/70 text-[10px] font-medium bg-black/60 rounded px-1.5 py-0.5 leading-none">
            {typeLabel[type]}
          </span>
        </div>
      </div>

      <p className="text-sm font-medium text-ink truncate group-hover:text-gold transition-colors duration-150">
        {title}
      </p>
    </Link>
  );
}
