export function ProductGridSkeleton({ n = 8 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: n }).map((_, i) => (
        <div key={`skel-${i}`} className="space-y-3">
          <div className="aspect-[4/5] rounded-2xl shimmer bg-muted"/>
          <div className="h-3 w-1/3 shimmer bg-muted rounded"/>
          <div className="h-4 w-2/3 shimmer bg-muted rounded"/>
          <div className="h-4 w-1/4 shimmer bg-muted rounded"/>
        </div>
      ))}
    </div>
  )
}
