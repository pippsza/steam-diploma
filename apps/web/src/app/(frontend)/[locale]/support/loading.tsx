import { Skeleton } from '@/components/ui/skeleton'

export default function SupportLoading() {
  return (
    <div className="container max-w-2xl space-y-6 py-8">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-40 w-full rounded-lg" />
    </div>
  )
}
