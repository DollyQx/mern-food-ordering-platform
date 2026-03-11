import { CategoryCarousel } from "@/components/home/CategoryCarousel";
import { DealsSection } from "@/components/home/DealsSection";
import { PartyHallCard } from "@/components/home/PartyHallCard"; // Import
import { MenuItemCard } from "@/components/MenuItemCard";
import { fetchCategories, fetchFeaturedItems } from "@/lib/server-api";
import { HomeMenuGrid } from "@/components/home/HomeMenuGrid";

// Force dynamic or revalidate every hour
export const revalidate = 0;

export default async function Home() {
  const [categories, featuredItems] = await Promise.all([
    fetchCategories(),
    fetchFeaturedItems()
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        {/* LCP Optimization: Render immediately without client-side fade-in */}

        {/* Category Carousel - Top LCP candidate */}
        <CategoryCarousel categories={categories} />

        {/* Deals Section */}
        <DealsSection />

        {/* Party Hall Premium Card */}
        <div className="container px-4 mx-auto">
          <PartyHallCard />
        </div>

        <div className="container px-4 py-6 mx-auto">
          <h2 className="mb-4 text-xl font-bold">Recommended for you</h2>

          {featuredItems.length > 0 ? (
            <HomeMenuGrid items={featuredItems} categories={categories} />
          ) : (
            <div className="text-center py-10">No items found.</div>
          )}
        </div>
      </main>
    </div>
  );
}

