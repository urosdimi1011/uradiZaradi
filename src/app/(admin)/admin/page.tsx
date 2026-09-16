import Link from "next/link";
import { MessageSquare } from "lucide-react";

import { reviewRepository } from "@/modules/reviews/repository";

export default async function AdminPage() {
  const naCekanju = await reviewRepository.listPending();

  return (
    <div className="page-container py-8">
      <h1 className="text-2xl font-semibold text-content-primary">Administracija</h1>

      <Link
        href="/admin/recenzije"
        className="mt-6 flex max-w-sm items-center gap-4 rounded-[var(--radius-card)] border border-line bg-surface-card p-5 transition-colors hover:border-line-strong"
      >
        <MessageSquare width={20} height={20} aria-hidden className="text-content-muted" />
        <div>
          <p className="text-sm font-medium text-content-primary">Recenzije na čekanju</p>
          <p className="mt-0.5 text-xs text-content-muted">
            {naCekanju.length === 0 ? "Red je prazan" : `${naCekanju.length} čeka pregled`}
          </p>
        </div>
      </Link>
    </div>
  );
}
