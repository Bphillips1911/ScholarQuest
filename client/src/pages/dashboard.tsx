import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Trophy, Plus, Book, Calendar, Heart, Shield, Star, Leaf, Mountain, Flame } from "lucide-react";
import type { House } from "@shared/schema";
import schoolLogoPath from "@assets/BHSA Mustangs Crest_1754722733103.jpg";

const iconMap = {
  "shield-alt": Shield,
  "star": Star,
  "leaf": Leaf,
  "mountain": Mountain,
  "fire": Flame,
};

export default function Dashboard() {
  const { data: houses, isLoading } = useQuery<House[]>({
    queryKey: ["/api/houses"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const totalAcademic = houses?.reduce((sum, house) => sum + house.academicPoints, 0) || 0;
  const totalAttendance = houses?.reduce((sum, house) => sum + house.attendancePoints, 0) || 0;
  const totalBehavior = houses?.reduce((sum, house) => sum + house.behaviorPoints, 0) || 0;

  return (
    <section data-testid="dashboard-section">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white mb-8" data-testid="hero-section">
        <div className="flex items-center justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center mb-4">
              <img 
                src={schoolLogoPath} 
                alt="Bush Hills STEAM Academy" 
                className="h-16 w-auto mr-4 bg-white rounded-lg p-2 school-logo-3d"
                data-testid="hero-school-logo"
              />
              <div>
                <h2 className="text-4xl font-bold mb-2">Welcome to House Character Development</h2>
                <p className="text-blue-100 font-medium">Bush Hills STEAM Academy</p>
              </div>
            </div>
            <p className="text-xl text-blue-100 mb-6">
              Building character, fostering community, and celebrating excellence in our five distinguished houses.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/houses">
                <Button className="bg-white text-blue-600 hover:bg-blue-50" data-testid="button-view-leaderboard">
                  <Trophy className="mr-2 h-4 w-4" />
                  View Leaderboard
                </Button>
              </Link>
              <Link href="/admin">
                <Button className="bg-blue-500 hover:bg-blue-400" data-testid="button-add-points">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Points
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* House Leaderboard */}
      <Card className="bg-white rounded-2xl shadow-lg p-6 mb-8" data-testid="house-standings-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">House Standings</h3>
          <span className="text-sm text-gray-500">
            Updated: <span data-testid="last-update">{new Date().toLocaleString()}</span>
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {houses?.map((house, index) => {
            // Use direct emoji icon instead of mapping
            const totalPoints = house.academicPoints + house.attendancePoints + house.behaviorPoints;
            
            const houseBgLightClass = {
              franklin: "bg-red-50 border-red-200",
              courie: "bg-purple-50 border-purple-200", 
              west: "bg-emerald-50 border-emerald-200",
              blackwell: "bg-gray-50 border-gray-200",
              berruguete: "bg-orange-50 border-orange-200",
            }[house.id] || "bg-red-50 border-red-200";

            const houseBgClass = {
              franklin: "bg-house-franklin",
              courie: "bg-house-courie", 
              west: "bg-house-west",
              blackwell: "bg-house-blackwell",
              berruguete: "bg-house-berruguete",
            }[house.id] || "bg-house-franklin";

            const houseColorClass = {
              franklin: "house-franklin",
              courie: "house-courie", 
              west: "house-west",
              blackwell: "house-blackwell",
              berruguete: "house-berruguete",
            }[house.id] || "house-franklin";

            return (
              <div
                key={house.id}
                className={`${houseBgLightClass} border-2 rounded-xl p-4 text-center hover:shadow-md transition-shadow`}
                data-testid={`house-standing-${house.id}`}
              >
                <div className={`w-12 h-12 ${houseBgClass} rounded-full flex items-center justify-center mx-auto mb-3`}>
                  <span className="house-icon-3d text-white" data-testid={`icon-house-${house.id}`}>
                    {house.icon}
                  </span>
                </div>
                <h4 className="font-bold text-gray-900 mb-1" data-testid={`house-name-${house.id}`}>
                  {house.name.replace("House of ", "")}
                </h4>
                <div className={`text-2xl font-bold ${houseColorClass} mb-1`} data-testid={`house-points-${house.id}`}>
                  {totalPoints.toLocaleString()}
                </div>
                <span className="text-xs text-gray-600" data-testid={`house-members-${house.id}`}>
                  {house.memberCount} Scholars
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Point Categories Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-white rounded-xl shadow-lg p-6" data-testid="academic-category-card">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <Book className="text-blue-600 text-lg" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Academic Excellence</h4>
              <p className="text-sm text-gray-600">Outstanding academic performance</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-600" data-testid="academic-total-points">
            {totalAcademic.toLocaleString()}
          </div>
          <p className="text-sm text-gray-500">Total points awarded this semester</p>
        </Card>

        <Card className="bg-white rounded-xl shadow-lg p-6" data-testid="attendance-category-card">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
              <Calendar className="text-green-600 text-lg" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Perfect Attendance</h4>
              <p className="text-sm text-gray-600">Consistent daily attendance</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-green-600" data-testid="attendance-total-points">
            {totalAttendance.toLocaleString()}
          </div>
          <p className="text-sm text-gray-500">Total points awarded this semester</p>
        </Card>

        <Card className="bg-white rounded-xl shadow-lg p-6" data-testid="behavior-category-card">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
              <Heart className="text-purple-600 text-lg" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Character Behavior</h4>
              <p className="text-sm text-gray-600">Positive behavior and leadership</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-600" data-testid="behavior-total-points">
            {totalBehavior.toLocaleString()}
          </div>
          <p className="text-sm text-gray-500">Total points awarded this semester</p>
        </Card>
      </div>
    </section>
  );
}
