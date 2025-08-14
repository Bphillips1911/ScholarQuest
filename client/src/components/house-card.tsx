import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { House } from "@shared/schema";
import falconIcon from "@assets/generated_images/Falcon_house_icon_9b9ebc40.png";

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
            <span className="house-icon-3d text-white text-3xl" data-testid={`icon-house-${house.id}`}>
              {house.id === 'west' ? (
                <svg width="48" height="48" viewBox="0 0 100 100" className="w-12 h-12 wolf-3d-icon">
                  <defs>
                    <linearGradient id={`wolfGradient-${house.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#E5E7EB" />
                      <stop offset="50%" stopColor="#D1D5DB" />
                      <stop offset="100%" stopColor="#9CA3AF" />
                    </linearGradient>
                    <radialGradient id={`wolfEyeGradient-${house.id}`} cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#FCD34D" />
                      <stop offset="100%" stopColor="#F59E0B" />
                    </radialGradient>
                  </defs>
                  
                  {/* Wolf head */}
                  <ellipse cx="50" cy="45" rx="25" ry="20" fill={`url(#wolfGradient-${house.id})`} stroke="#6B7280" strokeWidth="1"/>
                  
                  {/* Wolf ears */}
                  <path d="M32 35 L25 25 L35 30 Z" fill="#9CA3AF" stroke="#6B7280" strokeWidth="0.5"/>
                  <path d="M68 35 L75 25 L65 30 Z" fill="#9CA3AF" stroke="#6B7280" strokeWidth="0.5"/>
                  
                  {/* Wolf snout */}
                  <ellipse cx="50" cy="52" rx="12" ry="8" fill={`url(#wolfGradient-${house.id})`} stroke="#6B7280" strokeWidth="0.5"/>
                  
                  {/* Wolf nose */}
                  <ellipse cx="50" cy="48" rx="3" ry="2" fill="#374151"/>
                  
                  {/* Wolf eyes */}
                  <ellipse cx="42" cy="40" rx="4" ry="3" fill={`url(#wolfEyeGradient-${house.id})`} stroke="#374151" strokeWidth="0.5"/>
                  <ellipse cx="58" cy="40" rx="4" ry="3" fill={`url(#wolfEyeGradient-${house.id})`} stroke="#374151" strokeWidth="0.5"/>
                  
                  {/* Eye pupils */}
                  <ellipse cx="43" cy="40" rx="1.5" ry="2" fill="#000"/>
                  <ellipse cx="57" cy="40" rx="1.5" ry="2" fill="#000"/>
                  
                  {/* Eye highlights */}
                  <circle cx="43.5" cy="39" r="0.5" fill="#FFF" opacity="0.8"/>
                  <circle cx="57.5" cy="39" r="0.5" fill="#FFF" opacity="0.8"/>
                  
                  {/* Wolf mouth */}
                  <path d="M50 50 Q45 55 40 52" stroke="#374151" strokeWidth="1" fill="none"/>
                  <path d="M50 50 Q55 55 60 52" stroke="#374151" strokeWidth="1" fill="none"/>
                </svg>
              ) : (
                house.icon
              )}
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
