// Route-level loading UI shown instantly while the (JS-heavy) play page bundle loads.
export default function Loading() {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ background: "linear-gradient(135deg, #FFF8F0, #FFE8F5, #E8F4FD)" }}
    >
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <div
            className="h-16 w-16 animate-spin rounded-full border-[4px] border-[#FFE8F5]"
            style={{ borderTopColor: "#FF6B9D" }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">🎮</div>
        </div>
        <p className="font-heading text-lg font-bold text-[#8B7BAD]">Etkinlik yükleniyor...</p>
      </div>
    </div>
  );
}
