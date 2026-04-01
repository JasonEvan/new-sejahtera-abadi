import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 pb-4">
      <section className="overflow-hidden rounded-2xl border bg-card p-5 sm:p-6 lg:p-7">
        <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-3">
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-8 w-60" />
            <Skeleton className="h-4 w-full max-w-xl" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-36" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`headline-skeleton-${index}`}
                className="rounded-xl border bg-background/80 p-4"
              >
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-3 h-6 w-28" />
                <Skeleton className="mt-2 h-3 w-36" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`quick-skeleton-${index}`}
              className="rounded-xl border p-4"
            >
              <Skeleton className="h-8 w-8" />
              <Skeleton className="mt-3 h-4 w-28" />
              <Skeleton className="mt-2 h-3 w-44" />
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-2xl border bg-card p-4 sm:p-5">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`operational-skeleton-${index}`}
                className="rounded-lg border bg-background p-3"
              >
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-2 h-7 w-16" />
                <Skeleton className="mt-2 h-3 w-20" />
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border bg-card p-4 sm:p-5">
          <div className="space-y-2.5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`activity-skeleton-${index}`}
                className="rounded-lg border bg-background p-3"
              >
                <Skeleton className="h-4 w-44" />
                <Skeleton className="mt-2 h-3 w-56" />
                <Skeleton className="mt-2 h-3 w-24" />
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
