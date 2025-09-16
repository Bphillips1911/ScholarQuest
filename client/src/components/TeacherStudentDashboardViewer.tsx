import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, Eye, Trophy, Star, Calendar, BookOpen, Heart, Target, Gamepad2, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Scholar {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  username: string;
  grade: number;
  houseId: string;
  academicPoints: number;
  attendancePoints: number;
  behaviorPoints: number;
}

interface House {
  id: string;
  name: string;
  color: string;
  description: string;
}

interface StudentDashboardData {
  scholar: Scholar;
  house: House;
  totalPoints: number;
  rank: number;
  recentActivities: any[];
  badges: any[];
  skillTree: any;
  learningPath: any;
  reflections: any[];
  moodData: any[];
}

interface TeacherStudentDashboardViewerProps {
  teacherGrades: number[];
  themeStyles: any;
}

export function TeacherStudentDashboardViewer({ teacherGrades, themeStyles }: TeacherStudentDashboardViewerProps) {
  const [selectedGrade, setSelectedGrade] = useState<number | null>(teacherGrades[0] || null);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const { toast } = useToast();

  // Fetch students for selected grade - using teacher endpoint that includes auth
  const { data: students = [] } = useQuery({
    queryKey: [`/api/teacher/scholars/grade/${selectedGrade}`],
    enabled: !!selectedGrade,
  });

  // Fetch student dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: [`/api/teacher/student-dashboard/${selectedStudent}`],
    enabled: !!selectedStudent,
  });

  const handleViewDashboard = () => {
    if (!selectedStudent) {
      toast({
        title: "No Student Selected",
        description: "Please select a student to view their dashboard.",
        variant: "destructive",
      });
      return;
    }
    
    // Navigate to interactive student dashboard experience
    const selectedStudentData = students.find((s: Scholar) => s.id === selectedStudent);
    if (selectedStudentData) {
      // Store temporary teacher viewing data
      sessionStorage.setItem('teacherViewingStudent', JSON.stringify({
        studentId: selectedStudent,
        studentName: selectedStudentData.name,
        teacherMode: true,
        returnTo: '/teacher-dashboard'
      }));
      
      // Navigate to the full student dashboard experience with teacherView flag
      window.open(`/teacher-student-view/${selectedStudent}?teacherView=true&studentId=${selectedStudent}`, '_blank');
    }
  };

  const getDashboardOverview = (data: StudentDashboardData) => {
    if (!data) return null;

    const { scholar, house, totalPoints, rank, badges } = data;

    return (
      <div className="space-y-6">
        {/* Student Header */}
        <div className="flex items-center justify-between p-6 rounded-lg" style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white" 
                 style={{backgroundColor: house?.color || '#059669'}}>
              {scholar.name.split(' ')[0]?.[0] || 'S'}{scholar.name.split(' ')[1]?.[0] || ''}
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{color: themeStyles.textPrimary}}>
                {scholar.name}
              </h2>
              <p style={{color: themeStyles.textSecondary}}>
                Grade {scholar.grade} • {house?.name} House • Username: {scholar.username}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold" style={{color: themeStyles.textPrimary}}>
              {totalPoints}
            </div>
            <p style={{color: themeStyles.textSecondary}}>Total Points</p>
            <Badge variant="outline">Rank #{rank}</Badge>
          </div>
        </div>

        {/* Points Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p style={{color: themeStyles.textSecondary}}>Academic Points</p>
                  <p className="text-2xl font-bold text-blue-600">{scholar.academicPoints}</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p style={{color: themeStyles.textSecondary}}>Attendance Points</p>
                  <p className="text-2xl font-bold text-green-600">{scholar.attendancePoints}</p>
                </div>
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p style={{color: themeStyles.textSecondary}}>Behavior Points</p>
                  <p className="text-2xl font-bold text-purple-600">{scholar.behaviorPoints}</p>
                </div>
                <Heart className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Badges and Achievements */}
        {badges && badges.length > 0 && (
          <Card style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
            <CardHeader>
              <CardTitle style={{color: themeStyles.textPrimary}}>Recent Badges Earned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {badges.slice(0, 8).map((badge: any, index: number) => (
                  <div key={index} className="text-center p-3 border rounded-lg" style={{borderColor: themeStyles.border}}>
                    <div className="text-2xl mb-2">{badge.badgeIcon || '🏆'}</div>
                    <p className="text-sm font-medium" style={{color: themeStyles.textPrimary}}>{badge.badgeName}</p>
                    <p className="text-xs" style={{color: themeStyles.textSecondary}}>
                      {new Date(badge.awardedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Learning Features Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" 
                style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
            <CardContent className="p-4 text-center">
              <Target className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-semibold" style={{color: themeStyles.textPrimary}}>Learning Path</h3>
              <p className="text-sm" style={{color: themeStyles.textSecondary}}>
                Personalized learning journey
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" 
                style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
            <CardContent className="p-4 text-center">
              <Gamepad2 className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <h3 className="font-semibold" style={{color: themeStyles.textPrimary}}>Skill Tree</h3>
              <p className="text-sm" style={{color: themeStyles.textSecondary}}>
                Track skill progression
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" 
                style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
            <CardContent className="p-4 text-center">
              <Heart className="h-8 w-8 mx-auto mb-2 text-pink-600" />
              <h3 className="font-semibold" style={{color: themeStyles.textPrimary}}>Mood Tracker</h3>
              <p className="text-sm" style={{color: themeStyles.textSecondary}}>
                Emotional well-being
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        {data.recentActivities && data.recentActivities.length > 0 && (
          <Card style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
            <CardHeader>
              <CardTitle style={{color: themeStyles.textPrimary}}>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.recentActivities.slice(0, 5).map((activity: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded" 
                       style={{borderColor: themeStyles.border}}>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <div>
                        <p style={{color: themeStyles.textPrimary}}>{activity.description}</p>
                        <p className="text-sm" style={{color: themeStyles.textSecondary}}>
                          {new Date(activity.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">+{activity.points} pts</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Selection Controls */}
      <Card style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
        <CardHeader>
          <CardTitle className="flex items-center" style={{color: themeStyles.textPrimary}}>
            <Users className="h-5 w-5 mr-2" />
            Student Dashboard Viewer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{color: themeStyles.textPrimary}}>
                Select Grade
              </label>
              <Select value={selectedGrade?.toString() || ""} onValueChange={(value) => setSelectedGrade(Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose grade" />
                </SelectTrigger>
                <SelectContent>
                  {teacherGrades.map((grade) => (
                    <SelectItem key={grade} value={grade.toString()}>
                      Grade {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{color: themeStyles.textPrimary}}>
                Select Student
              </label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student: Scholar) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} ({student.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={handleViewDashboard}
                disabled={!selectedStudent || dashboardLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="button-view-student-dashboard"
              >
                <Eye className="h-4 w-4 mr-2" />
                {dashboardLoading ? "Loading..." : "View Dashboard"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Dashboard Display */}
      {dashboardLoading && (
        <Card style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p style={{color: themeStyles.textSecondary}}>Loading student dashboard...</p>
          </CardContent>
        </Card>
      )}

      {!dashboardLoading && dashboardData && getDashboardOverview(dashboardData)}

      {!selectedStudent && !dashboardLoading && (
        <Card style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
          <CardContent className="p-8 text-center">
            <Eye className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2" style={{color: themeStyles.textPrimary}}>
              Student Dashboard Viewer
            </h3>
            <p style={{color: themeStyles.textSecondary}}>
              Select a grade and student to view their personalized dashboard including points, badges, learning progress, and recent activities.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}