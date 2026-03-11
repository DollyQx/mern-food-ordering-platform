import { Skeleton } from "./skeleton"

export function MenuSkeleton() {
    return (
        <div className="container pb-20 px-4 mx-auto max-w-7xl animate-pulse">
            <div className="flex flex-col items-center justify-center py-8 gap-4">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-8 w-64 rounded-full" />
            </div>

            <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm -mx-4 px-4 py-2 border-b mb-6 transition-all shadow-sm">
                <div className="flex gap-4 overflow-hidden px-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="flex flex-col items-center gap-2 min-w-[80px] sm:min-w-[100px]">
                            <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-full" />
                            <Skeleton className="h-4 w-12" />
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="space-y-3">
                        <Skeleton className="h-48 w-full rounded-xl" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                ))}
            </div>
        </div>
    )
}
