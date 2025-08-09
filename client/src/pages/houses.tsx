import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Shuffle } from "lucide-react";
import HouseCard from "@/components/house-card";
import type { House } from "@shared/schema";

export default function Houses() {
  const { data: houses, isLoading } = useQuery<House[]>({
    queryKey: ["/api/houses"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading houses...</div>
      </div>
    );
  }

  return (
    <section data-testid="houses-section">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Our Five Houses</h2>
        <Link href="/admin">
          <Button className="bg-blue-600 text-white hover:bg-blue-700" data-testid="button-sort-scholars">
            <Shuffle className="mr-2 h-4 w-4" />
            Sort New Scholars
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {houses?.map((house) => (
          <HouseCard key={house.id} house={house} />
        ))}
      </div>
    </section>
  );
}
