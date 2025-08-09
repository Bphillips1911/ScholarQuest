import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { House } from "@shared/schema";

interface HouseCardProps {
  house: House;
}

export default function HouseCard({ house }: HouseCardProps) {
  const totalPoints = house.academicPoints + house.attendancePoints + house.behaviorPoints;
  
  const houseColorClass = {
    franklin: "house-franklin",
    courie: "house-courie", 
    west: "house-west",
    blackwell: "house-blackwell",
    berruguete: "house-berruguete",
  }[house.id] || "house-franklin";

  const houseBgClass = {
    franklin: "bg-house-franklin",
    courie: "bg-house-courie", 
    west: "bg-house-west",
    blackwell: "bg-house-blackwell",
    berruguete: "bg-house-berruguete",
  }[house.id] || "bg-house-franklin";

  const houseBgLightClass = {
    franklin: "bg-red-50 border-red-200",
    courie: "bg-purple-50 border-purple-200", 
    west: "bg-emerald-50 border-emerald-200",
    blackwell: "bg-gray-50 border-gray-200",
    berruguete: "bg-orange-50 border-orange-200",
  }[house.id] || "bg-red-50 border-red-200";

  const houseGradientClass = {
    franklin: "from-house-franklin to-red-700",
    courie: "from-house-courie to-purple-700", 
    west: "from-house-west to-emerald-700",
    blackwell: "from-house-blackwell to-gray-800",
    berruguete: "from-house-berruguete to-orange-700",
  }[house.id] || "from-house-franklin to-red-700";

  return (
    <Card className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow" data-testid={`card-house-${house.id}`}>
      <div className={`bg-gradient-to-br ${houseGradientClass} p-6 text-white`}>
        <div className="flex items-center justify-between mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <span className="house-icon-3d text-white" data-testid={`icon-house-${house.id}`}>
              {house.icon}
            </span>
          </div>
          <span className="text-2xl font-bold" data-testid={`text-total-points-${house.id}`}>
            {totalPoints.toLocaleString()}
          </span>
        </div>
        <h3 className="text-2xl font-bold mb-2" data-testid={`text-house-name-${house.id}`}>
          {house.name}
        </h3>
        <p className="text-white/90" data-testid={`text-house-motto-${house.id}`}>
          {house.motto}
        </p>
      </div>
      <CardContent className="p-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900" data-testid={`text-academic-points-${house.id}`}>
              {house.academicPoints.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Academic</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900" data-testid={`text-attendance-points-${house.id}`}>
              {house.attendancePoints.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Attendance</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900" data-testid={`text-behavior-points-${house.id}`}>
              {house.behaviorPoints.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Behavior</div>
          </div>
        </div>
        <Link href={`/houses/${house.id}`}>
          <Button 
            className={`w-full ${houseBgClass} text-white hover:opacity-90 transition-opacity`}
            data-testid={`button-view-house-${house.id}`}
          >
            View House Details
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
