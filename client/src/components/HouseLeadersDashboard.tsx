import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Crown, Award, GraduationCap, Users, Target, Star } from "lucide-react";
import { useEffect } from "react";
import { queryClient } from "@/lib/queryClient";

interface HouseLeader {
  id: string;
  name: string;
  houseId: string;
  houseName: string;
  points: number;
  totalPoints: number;
  grade: number;
}

interface HouseLeadersData {
  behavior: HouseLeader[];
  academic: HouseLeader[];
  attendance: HouseLeader[];
  mustangTraits: HouseLeader[];
}

// House color mapping
const houseColors: Record<string, string> = {
  tesla: "#7c3aed",
  drew: "#f59e0b", 
  johnson: "#dc2626",
  marshall: "#059669",
  west: "#0ea5e9"
};

// House icon mapping
const houseIcons: Record<string, string> = {
  tesla: "⚡",
  drew: "🧪", 
  johnson: "🚀",
  marshall: "⚖️",
  west: "🧭"
};

export function HouseLeadersDashboard() {
  const { data: leaders, isLoading, error } = useQuery<HouseLeadersData>({
    queryKey: ['/api/house-leaders'],
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
  });

  // Listen for real-time updates and refresh data
  useEffect(() => {
    const handleRealTimeUpdate = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'PBIS_UPDATE' || data.type === 'STUDENT_UPDATE') {
          // Refresh house leaders data when points are updated
          queryClient.invalidateQueries({ queryKey: ['/api/house-leaders'] });
        }
      } catch (error) {
        // Ignore invalid JSON
      }
    };

    // Connect to real-time updates if available
    const eventSource = new EventSource('/api/realtime/updates');
    eventSource.addEventListener('message', handleRealTimeUpdate);

    return () => {
      eventSource.close();
    };
  }, []);

  const getPositionIcon = (index: number) => {
    switch (index) {
      case 0: return <Crown className="h-5 w-5 text-yellow-500" />;
      case 1: return <Trophy className="h-5 w-5 text-gray-400" />;
      case 2: return <Medal className="h-5 w-5 text-amber-600" />;
      default: return <Award className="h-5 w-5 text-blue-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'behavior': return <Users className="h-5 w-5" />;
      case 'academic': return <GraduationCap className="h-5 w-5" />;
      case 'attendance': return <Target className="h-5 w-5" />;
      case 'mustangTraits': return <Star className="h-5 w-5" />;
      default: return <Award className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'behavior': return "bg-blue-50 border-blue-200 text-blue-800";
      case 'academic': return "bg-green-50 border-green-200 text-green-800";
      case 'attendance': return "bg-purple-50 border-purple-200 text-purple-800";
      case 'mustangTraits': return "bg-amber-50 border-amber-200 text-amber-800";
      default: return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'behavior': return "Behavior Leaders";
      case 'academic': return "Academic Leaders";
      case 'attendance': return "Attendance Leaders";
      case 'mustangTraits': return "MUSTANG Traits Leaders";
      default: return "Leaders";
    }
  };

  const renderLeaderCard = (category: string, leaders: HouseLeader[]) => (
    <Card key={category} className={`${getCategoryColor(category)} transition-all duration-300 hover:shadow-lg`} data-testid={`card-house-leaders-${category}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          {getCategoryIcon(category)}
          {getCategoryTitle(category)}
        </CardTitle>
        <CardDescription className="text-sm opacity-80">
          Top 4 scholars in {category.replace('mustangTraits', 'MUSTANG traits')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {leaders.length === 0 ? (
          <div className="text-center py-8 text-gray-500" data-testid={`text-no-leaders-${category}`}>
            No scholars found for this category
          </div>
        ) : (
          leaders.map((leader, index) => (
            <div 
              key={leader.id} 
              className="flex items-center justify-between p-3 bg-white/70 rounded-lg border border-white/50 hover:bg-white/90 transition-all duration-200"
              data-testid={`row-leader-${category}-${index}`}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {getPositionIcon(index)}
                  <span className="font-semibold text-lg">#{index + 1}</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900" data-testid={`text-leader-name-${leader.id}`}>
                    {leader.name}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span data-testid={`text-leader-house-${leader.id}`}>
                      {houseIcons[leader.houseId]} {leader.houseName}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span data-testid={`text-leader-grade-${leader.id}`}>Grade {leader.grade}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg" data-testid={`text-leader-points-${leader.id}`}>
                  {leader.points} pts
                </div>
                <div className="text-sm text-gray-600" data-testid={`text-leader-total-${leader.id}`}>
                  Total: {leader.totalPoints}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" data-testid="loading-spinner"></div>
          <span className="ml-3 text-gray-600">Loading house leaders...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center text-red-800" data-testid="error-message">
              <h3 className="font-semibold mb-2">Unable to load house leaders</h3>
              <p className="text-sm">Please try refreshing the page or contact support if the issue persists.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6" data-testid="house-leaders-dashboard">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2" data-testid="title-house-leaders">
          🏆 House Leaders Dashboard
        </h1>
        <p className="text-gray-600" data-testid="description-house-leaders">
          Celebrating our top-performing scholars across all categories with real-time updates
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {leaders && [
          renderLeaderCard('behavior', leaders.behavior),
          renderLeaderCard('academic', leaders.academic),
          renderLeaderCard('attendance', leaders.attendance),
          renderLeaderCard('mustangTraits', leaders.mustangTraits)
        ]}
      </div>

      <div className="mt-6 text-center">
        <Badge variant="outline" className="text-xs" data-testid="badge-last-updated">
          Updates automatically every 30 seconds • Real-time sync enabled
        </Badge>
      </div>
    </div>
  );
}