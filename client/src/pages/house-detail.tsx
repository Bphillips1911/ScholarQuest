import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Star, Leaf, Mountain, Flame } from "lucide-react";
import { Link } from "wouter";
import type { House, Scholar } from "@shared/schema";

const iconMap = {
  "shield-alt": Shield,
  "star": Star,
  "leaf": Leaf,
  "mountain": Mountain,
  "fire": Flame,
};

export default function HouseDetail() {
  const { id } = useParams();

  const { data: house, isLoading: houseLoading } = useQuery<House>({
    queryKey: ["/api/houses", id],
  });

  const { data: scholars, isLoading: scholarsLoading } = useQuery<Scholar[]>({
    queryKey: ["/api/houses", id, "scholars"],
    enabled: !!id,
  });

  if (houseLoading || scholarsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading house details...</div>
      </div>
    );
  }

  if (!house) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">House not found</div>
      </div>
    );
  }

  const Icon = iconMap[house.icon as keyof typeof iconMap] || Shield;
  const totalPoints = house.academicPoints + house.attendancePoints + house.behaviorPoints;

  const houseGradientClass = {
    franklin: "from-house-franklin to-red-700",
    courie: "from-house-courie to-purple-700", 
    west: "from-house-west to-emerald-700",
    blackwell: "from-house-blackwell to-gray-800",
    berruguete: "from-house-berruguete to-orange-700",
  }[house.id] || "from-house-franklin to-red-700";

  const houseColorClass = {
    franklin: "house-franklin",
    courie: "house-courie", 
    west: "house-west",
    blackwell: "house-blackwell",
    berruguete: "house-berruguete",
  }[house.id] || "house-franklin";

  // Calculate progress percentages for visualization
  const maxPoints = Math.max(house.academicPoints, house.attendancePoints, house.behaviorPoints);
  const academicPercent = maxPoints > 0 ? (house.academicPoints / maxPoints) * 100 : 0;
  const attendancePercent = maxPoints > 0 ? (house.attendancePoints / maxPoints) * 100 : 0;
  const behaviorPercent = maxPoints > 0 ? (house.behaviorPoints / maxPoints) * 100 : 0;

  return (
    <div data-testid="house-detail-page">
      <div className="mb-6">
        <Link href="/houses">
          <Button variant="outline" className="mb-4" data-testid="button-back-to-houses">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Houses
          </Button>
        </Link>
      </div>

      <Card className="bg-white rounded-2xl shadow-lg overflow-hidden" data-testid="house-detail-card">
        <div className={`bg-gradient-to-br ${houseGradientClass} p-6 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-3xl font-bold" data-testid="house-detail-name">{house.name}</h3>
              <p className="text-white/90 mt-2" data-testid="house-detail-motto">{house.motto}</p>
              <div className="mt-4 flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <Icon className="text-3xl" />
                </div>
                <div>
                  <div className="text-2xl font-bold" data-testid="house-detail-total-points">
                    {totalPoints.toLocaleString()} Total Points
                  </div>
                  <div className="text-white/80" data-testid="house-detail-member-count">
                    {house.memberCount} Scholars
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className={`text-3xl font-bold ${houseColorClass} mb-2`} data-testid="house-detail-academic-points">
                {house.academicPoints.toLocaleString()}
              </div>
              <div className="text-gray-600 mb-2">Academic Points</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${academicPercent}%` }}
                  data-testid="academic-progress-bar"
                ></div>
              </div>
            </div>

            <div className="text-center">
              <div className={`text-3xl font-bold ${houseColorClass} mb-2`} data-testid="house-detail-attendance-points">
                {house.attendancePoints.toLocaleString()}
              </div>
              <div className="text-gray-600 mb-2">Attendance Points</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${attendancePercent}%` }}
                  data-testid="attendance-progress-bar"
                ></div>
              </div>
            </div>

            <div className="text-center">
              <div className={`text-3xl font-bold ${houseColorClass} mb-2`} data-testid="house-detail-behavior-points">
                {house.behaviorPoints.toLocaleString()}
              </div>
              <div className="text-gray-600 mb-2">Behavior Points</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all"
                  style={{ width: `${behaviorPercent}%` }}
                  data-testid="behavior-progress-bar"
                ></div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xl font-bold text-gray-900 mb-4">House Members</h4>
            <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto" data-testid="house-members-list">
              {scholars && scholars.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {scholars.map((scholar) => {
                    const scholarTotal = scholar.academicPoints + scholar.attendancePoints + scholar.behaviorPoints;
                    return (
                      <div key={scholar.id} className="flex items-center justify-between bg-white rounded-lg p-3" data-testid={`scholar-item-${scholar.id}`}>
                        <div>
                          <span className="font-medium" data-testid={`scholar-name-${scholar.id}`}>
                            {scholar.name}
                          </span>
                          <div className="text-xs text-gray-500" data-testid={`scholar-id-${scholar.id}`}>
                            ID: {scholar.studentId}
                          </div>
                        </div>
                        <span className="text-sm text-gray-600" data-testid={`scholar-points-${scholar.id}`}>
                          {scholarTotal} pts
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8" data-testid="no-scholars-message">
                  No scholars assigned to this house yet.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
