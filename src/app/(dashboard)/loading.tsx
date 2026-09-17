export default function Loading() {
  return (
    <div className="flex flex-col gap-5">
      <div className="glass h-20 animate-pulse rounded-[28px]" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="glass h-64 animate-pulse rounded-[28px]" />
        <div className="glass h-64 animate-pulse rounded-[28px]" />
        <div className="glass h-64 animate-pulse rounded-[28px]" />
      </div>
      <div className="glass h-40 animate-pulse rounded-[28px]" />
    </div>
  )
}