/**
 * Blurry skeleton placeholders shown while gas data is loading.
 * Layout matches SurfReport, FeaturedChainWidget, and ChainCard grid.
 */

const SKELETON_BASE = 'rounded-lg bg-slate-300/50 dark:bg-white/15 animate-pulse';

export function SurfReportSkeleton() {
  return (
    <div className={`text-center opacity-80 blur-[1px] transition-all duration-500 ${SKELETON_BASE}`} aria-hidden>
      <div className={`inline-block w-24 h-24 rounded-full bg-slate-400/50 dark:bg-white/20 mb-4 ${SKELETON_BASE}`} />
      <div className={`h-12 w-48 mx-auto mb-2 bg-slate-400/50 dark:bg-white/20 ${SKELETON_BASE}`} />
      <div className={`h-5 w-36 mx-auto mb-1 bg-slate-300/50 dark:bg-white/15 ${SKELETON_BASE}`} />
      <div className={`h-4 w-56 mx-auto mb-4 bg-slate-300/50 dark:bg-white/15 ${SKELETON_BASE}`} />
      <div className={`h-4 w-40 mx-auto mb-2 bg-slate-300/40 dark:bg-white/10 ${SKELETON_BASE}`} />
      <div className="mt-6 max-w-md mx-auto flex gap-4 justify-center">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-3 w-12 bg-slate-300/40 dark:bg-white/10 ${SKELETON_BASE}`} />
        ))}
      </div>
    </div>
  );
}

export function ChainCardSkeleton({ featured = false }: { featured?: boolean }) {
  return (
    <div
      className={`
        w-full rounded-2xl glass border border-slate-200/50 dark:border-white/10 p-5 opacity-80 blur-[1px]
        ${featured ? 'p-6 md:p-7 border-2' : ''}
      `}
      aria-hidden
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className={`h-7 bg-slate-400/50 dark:bg-white/20 ${SKELETON_BASE} ${featured ? 'w-32' : 'w-24'}`} />
        <div className={`h-5 w-16 rounded-full bg-slate-300/50 dark:bg-white/15 ${SKELETON_BASE}`} />
      </div>
      <div className="grid grid-cols-3 gap-2 text-sm">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <div className={`h-3 w-8 mb-1 bg-slate-300/40 dark:bg-white/10 ${SKELETON_BASE}`} />
            <div className={`h-5 w-12 bg-slate-400/50 dark:bg-white/20 ${SKELETON_BASE}`} />
          </div>
        ))}
      </div>
      <div className={`h-3 w-20 mt-2 bg-slate-300/40 dark:bg-white/10 ${SKELETON_BASE}`} />
      <div className={`h-3 w-28 mt-2 bg-slate-300/40 dark:bg-white/10 ${SKELETON_BASE}`} />
    </div>
  );
}

export function FeaturedWidgetSkeleton({ theme }: { theme: 'bitcoin' | 'ethereum' }) {
  const wrapper =
    theme === 'bitcoin'
      ? 'rounded-2xl border-2 border-amber-400/40 dark:border-amber-400/30 bg-amber-100/50 dark:bg-amber-950/10 p-4 md:p-5'
      : 'rounded-2xl border-2 border-blue-400/40 dark:border-blue-500/20 bg-blue-100/50 dark:bg-blue-950/10 p-4 md:p-5';
  return (
    <div className={wrapper}>
      <div className={`h-5 w-20 mb-3 bg-slate-400/50 dark:bg-white/20 ${SKELETON_BASE}`} aria-hidden />
      <ChainCardSkeleton featured />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className={`rounded-xl glass p-4 opacity-80 blur-[1px] ${SKELETON_BASE}`} aria-hidden>
      <div className={`h-3 w-48 mb-2 bg-slate-300/50 dark:bg-white/15 ${SKELETON_BASE}`} />
      <div className="h-16 w-full max-w-[280px] mx-auto rounded-lg bg-slate-300/40 dark:bg-white/10" />
    </div>
  );
}

/** Number of EVM chain cards (excluding Bitcoin and Ethereum). */
const EVM_CARD_COUNT = 13;

export function PageSkeletons() {
  return (
    <>
      <section className="mb-12 md:mb-16">
        <div className="glass-strong rounded-3xl p-8 md:p-12 border border-white/10 shadow-2xl">
          <SurfReportSkeleton />
        </div>
      </section>

      <section className="mb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-10">
          <FeaturedWidgetSkeleton theme="bitcoin" />
          <FeaturedWidgetSkeleton theme="ethereum" />
        </div>
        <div className={`h-8 w-32 mb-4 bg-slate-300/50 dark:bg-white/15 ${SKELETON_BASE}`} aria-hidden />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: EVM_CARD_COUNT }, (_, i) => (
            <ChainCardSkeleton key={i} />
          ))}
        </div>
      </section>

      <section className="mb-10">
        <div className={`h-8 w-52 mb-4 bg-slate-300/50 dark:bg-white/15 ${SKELETON_BASE}`} aria-hidden />
        <div className="flex justify-center">
          <ChartSkeleton />
        </div>
      </section>
    </>
  );
}
