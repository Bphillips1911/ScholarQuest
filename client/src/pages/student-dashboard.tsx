import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { isStudentAuthenticated, clearStudentAuth, maintainStudentSession } from "@/lib/studentAuth";
import { 
  Trophy, 
  Star, 
  Calendar, 
  Users, 
  Award,
  LogOut,
  Home,
  GraduationCap,
  Target,
  BookOpen,
  Clock,
  Heart,
  FileText,
  Edit3
} from "lucide-react";
import logoPath from "@assets/_BHSA Mustang 1_1754780382943.png";
import { ReflectionModal } from "@/components/ReflectionModal";

interface StudentData {
  id: string;
  name: string;
  username: string;
}

interface ScholarData {
  id: string;
  name: string;
  studentId: string;
  username: string;
  houseId: string;
  gradeLevel: number;
  academicPoints: number;
  attendancePoints: number;
  behaviorPoints: number;
  isHouseSorted: boolean;
  createdAt: string;
}

interface HouseData {
  id: string;
  name: string;
  colors: string[];
  motto: string;
  totalPoints: number;
}

interface PBISEntry {
  id: string;
  scholarId: string;
  teacherName: string;
  points: number;
  reason: string;
  mustangTrait: string;
  category: string;
  subcategory: string;
  createdAt: string;
}

interface Reflection {
  id: string;
  prompt: string;
  response: string | null;
  status: 'assigned' | 'submitted' | 'approved' | 'rejected';
  teacherFeedback: string | null;
  dueDate: string | null;
  assignedAt: string;
  submittedAt: string | null;
}

export default function StudentDashboard() {
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [selectedReflection, setSelectedReflection] = useState<Reflection | null>(null);
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check authentication using new utilities
    if (!isStudentAuthenticated()) {
      clearStudentAuth();
      setLocation("/student-login");
      return;
    }
    
    // Maintain session
    maintainStudentSession();
    
    // Set up session maintenance interval
    const interval = setInterval(() => {
      if (isStudentAuthenticated()) {
        maintainStudentSession();
      } else {
        clearStudentAuth();
        setLocation("/student-login");
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    const student = localStorage.getItem("studentData");
    if (student) {
      try {
        setStudentData(JSON.parse(student));
      } catch (error) {
        console.error("Error parsing student data:", error);
        clearStudentAuth();
        setLocation("/student-login");
      }
    }

    return () => clearInterval(interval);
  }, [setLocation]);

  // Fetch scholar details with authentication
  const { data: scholarData, isLoading: scholarLoading } = useQuery({
    queryKey: ["/api/student/profile"],
    enabled: !!studentData,
    retry: 1,
  });

  // Fetch houses data
  const { data: houses } = useQuery({
    queryKey: ["/api/houses"],
    enabled: !!studentData,
  });

  // Fetch PBIS entries for this student
  const { data: pbisEntries } = useQuery({
    queryKey: ["/api/pbis-entries", studentData?.id],
    enabled: !!studentData?.id,
  });

  // Fetch reflections for this student
  const { data: reflections = [], isLoading: reflectionsLoading } = useQuery({
    queryKey: ["/api/student/reflections"],
    enabled: !!studentData,
  });

  const handleLogout = () => {
    clearStudentAuth();
    setLocation("/");
  };

  if (!studentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const scholar: ScholarData | undefined = scholarData as ScholarData;
  const currentHouse = (houses && Array.isArray(houses)) ? houses.find((h: HouseData) => h.id === scholar?.houseId) : undefined;
  const recentPBIS = (pbisEntries && Array.isArray(pbisEntries)) ? pbisEntries.slice(0, 5) : [];

  // Calculate total points
  const totalPoints = (scholar?.academicPoints || 0) + (scholar?.attendancePoints || 0) + (scholar?.behaviorPoints || 0);
  const totalPBISPoints = (pbisEntries && Array.isArray(pbisEntries)) ? pbisEntries.reduce((sum: number, entry: PBISEntry) => sum + entry.points, 0) : 0;

  // MUSTANG trait definitions
  const mustangTraits = {
    "M": "Make good choices",
    "U": "Use kind words", 
    "S": "Show school pride",
    "T": "Tolerant of others",
    "A": "Aim for excellence",
    "N": "Need to be responsible",
    "G": "Give 100% everyday"
  };

  // Helper function to get colors for MUSTANG traits
  const getRandomColor = (letter: string, index: number): string => {
    const colors = [
      "#3B82F6", // blue
      "#10B981", // emerald
      "#F59E0B", // amber
      "#EF4444", // red
      "#8B5CF6", // violet
      "#06B6D4", // cyan
      "#84CC16"  // lime
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src={logoPath} 
                alt="BHSA Mustangs Logo" 
                className="w-12 h-12 object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Student Portal</h1>
                <p className="text-gray-600 text-sm">Bush Hills STEAM Academy</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setLocation("/student-mood-tracker")}
                className="flex items-center space-x-2"
                data-testid="button-mood-tracker"
              >
                <Heart className="h-4 w-4" />
                <span>Mood Tracker</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setLocation("/student-learning-path")}
                className="flex items-center space-x-2"
                data-testid="button-learning-path"
              >
                <Target className="h-4 w-4" />
                <span>Learning Path</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="flex items-center space-x-2"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2" data-testid="welcome-message">
            Welcome back, {studentData.name}!
          </h2>
          <p className="text-gray-600">
            {scholar ? `Grade ${scholar.gradeLevel} • ${scholar.username}` : "Loading your information..."}
          </p>
        </div>

        {scholarLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your points and achievements...</p>
          </div>
        ) : !scholar ? (
          <Alert className="mb-6">
            <AlertDescription>
              Unable to load your student information. Please contact your teacher if this persists.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* House Information */}
            {currentHouse && (
              <Card className="col-span-1 md:col-span-2 lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Home className="mr-2 h-5 w-5 text-purple-600" />
                    Your House
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-3">
                    <div className="text-2xl font-bold text-gray-800">{currentHouse.name}</div>
                    <div className="text-sm text-gray-600 italic">"{currentHouse.motto}"</div>
                    <div className="flex justify-center space-x-2">
                      {currentHouse.color && (
                        <div 
                          className="w-6 h-6 rounded-full border border-gray-300"
                          style={{ backgroundColor: currentHouse.color }}
                        />
                      )}
                    </div>
                    <Badge variant="secondary" className="text-sm">
                      <Trophy className="mr-1 h-3 w-3" />
                      House Total: {(currentHouse.academicPoints || 0) + (currentHouse.attendancePoints || 0) + (currentHouse.behaviorPoints || 0)} points
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Personal Points Summary */}
            <Card className="col-span-1 md:col-span-2 lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="mr-2 h-5 w-5 text-blue-600" />
                  Your Points Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <BookOpen className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-800">{scholar.academicPoints}</div>
                    <div className="text-sm text-blue-600">Academic</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <Clock className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-800">{scholar.attendancePoints}</div>
                    <div className="text-sm text-green-600">Attendance</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <Heart className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-800">{scholar.behaviorPoints}</div>
                    <div className="text-sm text-purple-600">Behavior</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <Trophy className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-yellow-800">{totalPoints}</div>
                    <div className="text-sm text-yellow-600">Total Points</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PBIS Recognition */}
            <Card className="col-span-1 md:col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="mr-2 h-5 w-5 text-green-600" />
                  MUSTANG Traits Recognition
                  <Badge variant="secondary" className="ml-2">{totalPBISPoints} PBIS Points</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentPBIS && recentPBIS.length > 0 ? (
                  <div className="space-y-4">
                    {recentPBIS.map((entry: PBISEntry) => (
                      <div key={entry.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <Star className="h-4 w-4 text-green-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {entry.mustangTrait} - {mustangTraits[entry.mustangTrait as keyof typeof mustangTraits]}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              +{entry.points} point{entry.points !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-800 mb-1">{entry.reason}</p>
                          <div className="flex items-center text-xs text-gray-500 space-x-2">
                            <span>{entry.teacherName}</span>
                            <span>•</span>
                            <span>{entry.category.charAt(0).toUpperCase() + entry.category.slice(1)}</span>
                            <span>•</span>
                            <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {pbisEntries && Array.isArray(pbisEntries) && pbisEntries.length > 5 && (
                      <div className="text-center pt-4">
                        <p className="text-sm text-gray-600">
                          Showing latest 5 recognitions out of {pbisEntries?.length || 0} total
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p>No PBIS recognitions yet</p>
                    <p className="text-sm mt-1">Keep demonstrating MUSTANG traits to earn recognition!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Behavioral Reflections */}
            {reflections.length > 0 && (
              <Card className="col-span-1 md:col-span-2 lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5 text-orange-600" />
                    Behavioral Reflections
                    <Badge variant={reflections.some((r: Reflection) => r.status === 'assigned') ? 'destructive' : 'secondary'} className="ml-2">
                      {reflections.filter((r: Reflection) => r.status === 'assigned').length} pending
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reflections.map((reflection: Reflection) => (
                      <div 
                        key={reflection.id} 
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedReflection(reflection);
                          setShowReflectionModal(true);
                        }}
                        data-testid={`reflection-item-${reflection.id}`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className={`w-3 h-3 rounded-full ${
                              reflection.status === 'assigned' ? 'bg-red-500' :
                              reflection.status === 'submitted' ? 'bg-yellow-500' :
                              reflection.status === 'approved' ? 'bg-green-500' :
                              'bg-gray-400'
                            }`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {reflection.status === 'assigned' ? 'Response Required' :
                               reflection.status === 'submitted' ? 'Under Review' :
                               reflection.status === 'approved' ? 'Completed' :
                               'Needs Revision'}
                            </p>
                            <p className="text-xs text-gray-500">
                              Assigned {new Date(reflection.assignedAt).toLocaleDateString()}
                              {reflection.dueDate && (
                                <span className="ml-2">• Due {new Date(reflection.dueDate).toLocaleDateString()}</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Edit3 className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        )}
      </div>

      {/* Reflection Modal */}
      {selectedReflection && (
        <ReflectionModal
          reflection={selectedReflection}
          isOpen={showReflectionModal}
          onClose={() => {
            setShowReflectionModal(false);
            setSelectedReflection(null);
          }}
          isStudent={true}
        />
      )}
    </div>
  );
}