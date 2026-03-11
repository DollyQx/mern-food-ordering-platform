import { Skeleton } from "./skeleton"

export function HomeSkeleton() {
    return (
        <div className="flex min-h-screen flex-col animate-pulse">
            <main className="flex-1">
                {/* Category Carousel Skeleton */}
                <div className="w-full py-6">
                    <Skeleton className="h-8 w-48 mb-4 ml-4" />
                    <div className="flex gap-4 overflow-hidden px-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="flex flex-col items-center gap-2 min-w-[80px]">
                                <Skeleton className="w-20 h-20 rounded-full" />
                                <Skeleton className="h-4 w-12" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Deals Section Skeleton */}
                <div className="w-full py-6 px-4">
                    <Skeleton className="h-8 w-32 mb-4" />
                    <div className="grid gap-4 md:grid-cols-2">
                        {[1, 2].map((i) => (
                            <Skeleton key={i} className="h-32 w-full rounded-xl" />
                        ))}
                    </div>
                </div>

                {/* Party Hall Card Skeleton */}
                <div className="container px-4 mx-auto py-4">
                    <Skeleton className="h-64 w-full rounded-2xl" />
                </div>

                {/* Recommended Items Skeleton */}
                <div className="container px-4 py-6 mx-auto">
                    <Skeleton className="h-8 w-48 mb-6" />
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="space-y-3">
                                <Skeleton className="h-48 w-full rounded-xl" />
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    )
}
