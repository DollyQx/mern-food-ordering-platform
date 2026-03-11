'use client';

import Link from 'next/link';
import Image from 'next/image';

export function DealsSection() {
    // Static content for now, or fetch marked items
    const deals = [
        {
            id: 1,
            title: "Free 250g Gujiya with 2kg Gujiya",
            image: "/images/gujiya_fest.jpg",
            bg: "bg-pink-100",
            link: "/menu?category=69747253c1e71d002a431ddb"
        },
        {
            id: 2,
            title: "Free Delivery on Order Above ₹199",
            image: "https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b1?w=800&q=80",
            bg: "bg-green-100",
            link: "/menu"
        }
    ];

    return (
        <div className="w-full py-6 px-4">
            <h2 className="mb-4 text-xl font-bold">Deals for you</h2>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {deals.map((deal, index) => {
                    const isFullWidthImage = deal.id === 1; // Make the first deal (Gujiya) focus on the image

                    if (isFullWidthImage) {
                        return (
                            <Link href={deal.link} key={deal.id} className={`${deal.bg} rounded-xl overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-shadow relative aspect-[2/1] sm:aspect-[3/1] md:col-span-2`}>
                                <Image
                                    src={deal.image}
                                    alt={deal.title}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                    className="object-cover"
                                    priority={true}
                                />
                                {/* Optional text overlay if we want to keep the "Grab Now" button, but the image already has text. 
                                     Just an absolute positioned invisible link box is enough. */}
                            </Link>
                        )
                    }

                    return (
                        <Link href={deal.link} key={deal.id} className={`${deal.bg} p-6 rounded-xl flex items-center justify-between shadow-sm cursor-pointer hover:shadow-md transition-shadow`}>
                            <div className="max-w-[60%]">
                                <h3 className="text-lg font-bold mb-2">{deal.title}</h3>
                                <button className="bg-black text-white px-3 py-1 rounded-full text-xs font-bold uppercase">Grab Now</button>
                            </div>
                            <div className="h-24 w-24 rounded-lg overflow-hidden relative">
                                <Image
                                    src={deal.image}
                                    alt={deal.title}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 33vw"
                                    className="object-cover"
                                    priority={true}
                                />
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
