// Dashboard etkinlik ızgarasının yükleme iskeleti. Gerçek kartla aynı düzen
// ve ızgara sınıflarını kullanır → içerik gelince layout zıplamaz (CLS yok).

function SkeletonCard() {
  return (
    <article className="card-playful flex h-full flex-col overflow-hidden">
      {/* Üst bant (renkli başlık yerine nötr yer tutucu) */}
      <div className="relative overflow-hidden bg-[#F4EFFB] px-5 pb-4 pt-5">
        <div className="relative flex items-start gap-3">
          <div className="skeleton h-14 w-14 shrink-0 rounded-2xl" />
          <div className="min-w-0 flex-1 pt-1">
            <div className="skeleton h-5 w-3/4 rounded-lg" />
            <div className="mt-2.5 flex gap-2">
              <div className="skeleton h-5 w-20 rounded-full" />
              <div className="skeleton h-5 w-14 rounded-full" />
            </div>
          </div>
        </div>
        <div className="skeleton mt-3 h-3 w-24 rounded" />
      </div>

      {/* Gövde */}
      <div className="flex flex-1 flex-col gap-3 bg-white px-4 py-4">
        <div className="skeleton h-3 w-1/3 rounded" />
        <div className="mt-auto flex gap-2">
          <div className="skeleton h-9 flex-1 rounded-xl" />
          <div className="skeleton h-9 w-9 rounded-xl" />
        </div>
      </div>
    </article>
  );
}

export default function DashboardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
