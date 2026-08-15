import { CornerDownRight } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Stars } from "@/components/ui/stars";
import type { Review } from "@/modules/reviews/domain";
import { formatRelative } from "@/lib/format";
import { toCyrillic } from "@/lib/translit";
import type { Script } from "@/lib/script";

/**
 * Tekst recenzije pišu korisnici, pa postoji samo u jednom pismu (latinica).
 * Za ćiriličnu verziju sajta se transliteruje u letu — isti sadržaj, drugo pismo,
 * bez duplog unosa i bez duplog sadržaja u indeksu.
 */
export function ReviewItem({ review, script }: { review: Review; script: Script }) {
  const body = script === "cyrl" ? toCyrillic(review.body) : review.body;
  const author = script === "cyrl" ? toCyrillic(review.authorDisplayName) : review.authorDisplayName;

  return (
    <article className="border-t border-line pt-4 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <Avatar
          src={review.authorAvatarUrl}
          name={review.authorDisplayName}
          sizes="28px"
          className="h-7 w-7 rounded-full"
        />
        <span className="text-sm font-medium text-content-primary">{author}</span>
        <Stars value={review.rating} size={13} />
        <time
          dateTime={review.createdAt.toISOString()}
          className="text-xs text-content-muted"
        >
          {formatRelative(review.createdAt, script)}
        </time>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-content-secondary">{body}</p>

      {review.reply ? (
        <div className="mt-3 flex gap-2 rounded-[var(--radius-control)] bg-surface-raised p-3">
          <CornerDownRight
            width={15}
            height={15}
            className="mt-0.5 shrink-0 text-content-muted"
            aria-hidden
          />
          <p className="text-sm leading-relaxed text-content-secondary">
            {script === "cyrl" ? toCyrillic(review.reply.body) : review.reply.body}
          </p>
        </div>
      ) : null}
    </article>
  );
}
