import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LogOut, Trophy, Star, Calendar, BookOpen, Users, Award } from "lucide-react";
import type { Scholar, House, PbisEntry } from "@shared/schema";
import schoolLogoPath from "@assets/BHSA Mustangs Crest_1754722733103.jpg";

interface StudentData {
  student: Scholar;
  house: House;
  pbisEntries: PbisEntry[];
  totalPoints: number;
  rank: number;
  totalStudents: number;
}

export default function StudentDashboard() {
  const [studentData, setStudentData] = useState<any>(null);

  useEffect(() => {
    const data = localStorage.getItem("student_data");
    if (data) {
      setStudentData(JSON.parse(data));
    } else {
      window.location.href = "/student-login";
    }
  }, []);

  const { data: dashboardData } = useQuery<StudentData>({
    queryKey: ["/api/student/dashboard"],
    retry: false,
  });

  const handleLogout = () => {
    localStorage.removeItem("student_token");
    localStorage.removeItem("student_data");
    window.location.href = "/student-login";
  };

  if (!studentData || !dashboardData) {
    return (
      <section className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </section>
    );
  }

  const { student, house, pbisEntries, totalPoints, rank, totalStudents } = dashboardData;

  const houseColorClass = {
    franklin: "from-red-500 to-red-700",
    courie: "from-blue-500 to-blue-700", 
    west: "from-green-500 to-green-700",
    blackwell: "from-purple-500 to-purple-700",
    berruguete: "from-yellow-500 to-yellow-700",
  }[house.id] || "from-gray-500 to-gray-700";

  const mustangTraits = [
    "Make good choices",
    "Use kind words", 
    "Show school pride",
    "Tolerant of others",
    "Aim for excellence",
    "Need to be responsible",
    "Give 100% everyday"
  ];

  const traitCounts = mustangTraits.reduce((acc, trait) => {
    acc[trait] = pbisEntries.filter(entry => entry.mustangTrait === trait).length;
    return acc;
  }, {} as Record<string, number>);

  const categoryPoints = {
    academic: student.academicPoints,
    attendance: student.attendancePoints,
    behavior: student.behaviorPoints,
  };

  const maxCategoryPoints = Math.max(...Object.values(categoryPoints));

  return (
    <section className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4" data-testid="student-dashboard-section">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img 
                  src={schoolLogoPath} 
                  alt="Bush Hills STEAM Academy" 
                  className="h-12 w-auto school-logo-3d"
                  data-testid="dashboard-school-logo"
                />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900" data-testid="student-name">
                    Welcome, {student.name}!
                  </h1>
                  <p className="text-gray-600">Grade {student.grade} • Student ID: {student.studentId}</p>
                </div>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="text-gray-600 hover:text-gray-800"
                data-testid="button-logout"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* House Card */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl overflow-hidden" data-testid="house-card">
          <div className={`bg-gradient-to-r ${houseColorClass} p-6 text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold" data-testid="house-name">
                  {house.name}
                </h2>
                <p className="text-xl opacity-90" data-testid="house-motto">
                  "{house.motto}"
                </p>
              </div>
              <div className="text-6xl opacity-20">
                {house.icon}
              </div>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900" data-testid="student-total-points">
                  {totalPoints}
                </div>
                <div className="text-sm text-gray-600">Your Total Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900" data-testid="student-rank">
                  #{rank}
                </div>
                <div className="text-sm text-gray-600">Your Rank</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900" data-testid="total-students">
                  {totalStudents}
                </div>
                <div className="text-sm text-gray-600">Total Students</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Points Breakdown */}
          <Card className="bg-white/90 backdrop-blur-sm shadow-xl" data-testid="points-breakdown-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="mr-2 h-5 w-5 text-yellow-600" />
                Points Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(categoryPoints).map(([category, points]) => (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="capitalize font-medium text-gray-700">
                      {category === 'academic' && <BookOpen className="inline mr-1 h-4 w-4" />}
                      {category === 'attendance' && <Calendar className="inline mr-1 h-4 w-4" />}
                      {category === 'behavior' && <Star className="inline mr-1 h-4 w-4" />}
                      {category}
                    </span>
                    <span className="font-bold text-gray-900" data-testid={`points-${category}`}>
                      {points} pts
                    </span>
                  </div>
                  <Progress 
                    value={maxCategoryPoints > 0 ? (points / maxCategoryPoints) * 100 : 0} 
                    className="h-2"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* MUSTANG Traits */}
          <Card className="bg-white/90 backdrop-blur-sm shadow-xl" data-testid="mustang-traits-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="mr-2 h-5 w-5 text-blue-600" />
                MUSTANG Traits Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {mustangTraits.map((trait) => (
                  <div key={trait} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="font-bold text-xs">
                        {trait[0]}
                      </Badge>
                      <span className="text-sm font-medium text-gray-700">
                        {trait}
                      </span>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className="bg-blue-100 text-blue-800"
                      data-testid={`trait-count-${trait.split(' ')[0].toLowerCase()}`}
                    >
                      {traitCounts[trait] || 0}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent PBIS Entries */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl" data-testid="recent-pbis-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5 text-green-600" />
              Recent PBIS Recognition ({pbisEntries.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {pbisEntries.length > 0 ? (
                pbisEntries.slice(0, 10).map((entry, index) => (
                  <div 
                    key={entry.id} 
                    className="flex items-center justify-between p-4 bg-green-50 rounded-lg border"
                    data-testid={`pbis-entry-${index}`}
                  >
                    <div className="flex items-center space-x-3">
                      <Badge className="bg-green-600 text-white">
                        {entry.mustangTrait[0]}
                      </Badge>
                      <div>
                        <p className="font-medium text-gray-900" data-testid={`pbis-trait-${index}`}>
                          {entry.mustangTrait}
                        </p>
                        <p className="text-sm text-gray-600" data-testid={`pbis-details-${index}`}>
                          {entry.category.charAt(0).toUpperCase() + entry.category.slice(1)} • {entry.subcategory}
                        </p>
                        <p className="text-xs text-gray-500" data-testid={`pbis-teacher-${index}`}>
                          Recognized by {entry.teacherName} ({entry.teacherRole})
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600" data-testid={`pbis-points-${index}`}>
                        +{entry.points}
                      </div>
                      <div className="text-xs text-gray-500" data-testid={`pbis-date-${index}`}>
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8" data-testid="no-pbis-message">
                  <Award className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                  <p>No PBIS recognition yet. Keep up the great work!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}