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
  Edit3,
  Book,
  Palette,
  TrendingUp,
  HelpCircle,
  Brain
} from "lucide-react";
import logoPath from "@assets/_BHSA Mustang 1_1754780382943.png";
import { ReflectionModal } from "@/components/ReflectionModal";
import { DashboardThemes } from "@/components/DashboardThemes";
import { InteractiveLearningAssistant } from "@/components/learning-assistant/InteractiveLearningAssistant";
import { LearningAssistantProvider, useLearningAssistant, useCelebrationTrigger, useAutoTips } from "@/components/learning-assistant/LearningAssistantProvider";
import { AnimatedTutorials, tutorialLibrary } from "@/components/learning-assistant/AnimatedTutorials";
import { GamifiedHelpSystem } from "@/components/learning-assistant/GamifiedHelpSystem";
import { LearningAssistantIntegration } from "@/components/learning-assistant/LearningAssistantIntegration";
import { 
  InteractiveScale, 
  SlideIn, 
  FadeIn,
  StaggerContainer, 
  StaggerItem,
  SparkleEffect,
  Bounce
} from "@/components/MicroAnimations";
import { motion } from "framer-motion";
import { NotificationHeader } from "@/components/NotificationHeader";

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

function StudentDashboardContent() {
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [selectedReflection, setSelectedReflection] = useState<Reflection | null>(null);
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [themesModalOpen, setThemesModalOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('default');
  const [showHelpSystem, setShowHelpSystem] = useState(false);
  const [showTutorial, setShowTutorial] = useState<string | null>(null);
  
  // Learning assistant hooks
  const { triggerCelebration } = useCelebrationTrigger();
  const { triggerAutoTip } = useAutoTips();

  // Theme configurations
  const getThemeStyles = (themeId: string) => {
    const themes = {
      'default': {
        background: 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900',
        accent: 'from-blue-600 to-purple-600',
        cardBg: 'bg-white/90 backdrop-blur-sm',
        textPrimary: 'text-gray-900',
        textSecondary: 'text-gray-600'
      },
      'kelly-green': {
        background: 'bg-gradient-to-br from-green-900 via-emerald-900 to-slate-900',
        accent: 'from-green-500 to-emerald-500',
        cardBg: 'bg-white/90 backdrop-blur-sm',
        textPrimary: 'text-gray-900',
        textSecondary: 'text-gray-600'
      },
      'gold': {
        background: 'bg-gradient-to-br from-yellow-900 via-amber-900 to-orange-900',
        accent: 'from-yellow-400 to-amber-400',
        cardBg: 'bg-white/90 backdrop-blur-sm',
        textPrimary: 'text-gray-900',
        textSecondary: 'text-gray-600'
      },
      'orange': {
        background: 'bg-gradient-to-br from-orange-900 via-red-900 to-slate-900',
        accent: 'from-orange-500 to-red-500',
        cardBg: 'bg-white/90 backdrop-blur-sm',
        textPrimary: 'text-gray-900',
        textSecondary: 'text-gray-600'
      },
      'dark': {
        background: 'bg-gradient-to-br from-gray-900 via-slate-900 to-black',
        accent: 'from-gray-600 to-slate-600',
        cardBg: 'bg-gray-800/90 backdrop-blur-sm',
        textPrimary: 'text-white',
        textSecondary: 'text-gray-300'
      },
      'light': {
        background: 'bg-gradient-to-br from-yellow-100 via-orange-100 to-pink-100',
        accent: 'from-yellow-500 to-orange-500',
        cardBg: 'bg-white/95 backdrop-blur-sm',
        textPrimary: 'text-gray-900',
        textSecondary: 'text-gray-700'
      },
      'champion': {
        background: 'bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900',
        accent: 'from-purple-400 to-blue-400',
        cardBg: 'bg-white/90 backdrop-blur-sm',
        textPrimary: 'text-gray-900',
        textSecondary: 'text-gray-600'
      }
    };
    return themes[themeId as keyof typeof themes] || themes['default'];
  };

  const themeStyles = getThemeStyles(currentTheme);

  // Load saved theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('student-dashboard-theme');
    if (savedTheme) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  // Save theme to localStorage when changed
  const handleThemeChange = (newTheme: string) => {
    setCurrentTheme(newTheme);
    localStorage.setItem('student-dashboard-theme', newTheme);
  };
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

  // Calculate total points and legendary progress
  const totalPoints = (scholar?.academicPoints || 0) + (scholar?.attendancePoints || 0) + (scholar?.behaviorPoints || 0);
  const totalPBISPoints = (pbisEntries && Array.isArray(pbisEntries)) ? pbisEntries.reduce((sum: number, entry: PBISEntry) => sum + entry.points, 0) : 0;
  const legendaryRequirement = 1000;
  const legendaryProgress = Math.min(100, (totalPoints / legendaryRequirement) * 100);

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
    <div className={`min-h-screen ${themeStyles.background}`}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b relative z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 min-w-0 flex-shrink-0">
              <img 
                src={logoPath} 
                alt="BHSA Mustangs Logo" 
                className="w-12 h-12 object-contain flex-shrink-0"
              />
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-gray-800 truncate">Student Portal</h1>
                <p className="text-gray-600 text-xs md:text-sm truncate">Bush Hills STEAM Academy</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 md:space-x-3 flex-wrap">
              <InteractiveScale>
                <Button 
                  variant="outline" 
                  onClick={() => setLocation("/student-mood-tracker")}
                  className="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm px-2 md:px-4"
                  data-testid="button-mood-tracker"
                >
                  <Heart className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Mood Tracker</span>
                  <span className="sm:hidden">Mood</span>
                </Button>
              </InteractiveScale>
              <InteractiveScale>
                <Button 
                  variant="outline" 
                  onClick={() => setLocation("/student-learning-path")}
                  className="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm px-2 md:px-4"
                  data-testid="button-learning-path"
                >
                  <Target className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Learning Path</span>
                  <span className="sm:hidden">Learn</span>
                </Button>
              </InteractiveScale>
              <InteractiveScale>
                <Button 
                  variant="outline" 
                  onClick={() => setLocation("/student-skill-tree")}
                  className="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm px-2 md:px-4"
                  data-testid="button-skill-tree"
                >
                  <Star className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Skill Tree</span>
                  <span className="sm:hidden">Skills</span>
                </Button>
              </InteractiveScale>
              <InteractiveScale>
                <Button 
                  variant="outline" 
                  onClick={() => setLocation("/student-house-history")}
                  className="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm px-2 md:px-4"
                  data-testid="button-house-history"
                >
                  <Book className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">House History</span>
                  <span className="sm:hidden">History</span>
                </Button>
              </InteractiveScale>
              <InteractiveScale>
                <Button 
                  variant="outline" 
                  onClick={() => setLocation("/gamified-learning")}
                  className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-400 hover:from-purple-600 hover:to-pink-600"
                  data-testid="button-gamified-learning"
                >
                  <Trophy className="h-4 w-4" />
                  <span>Game Zone</span>
                </Button>
              </InteractiveScale>
              <InteractiveScale>
                <Button 
                  variant="outline" 
                  onClick={() => setLocation("/student-achievements")}
                  className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-blue-500 text-white border-green-400 hover:from-green-600 hover:to-blue-600"
                  data-testid="button-achievements"
                >
                  <Star className="h-4 w-4" />
                  <span>Achievements</span>
                </Button>
              </InteractiveScale>
              <InteractiveScale>
                <Button 
                  variant="outline" 
                  onClick={() => setThemesModalOpen(true)}
                  className="flex items-center space-x-2"
                  data-testid="button-themes"
                >
                  <Palette className="h-4 w-4" />
                  <span>Themes</span>
                </Button>
              </InteractiveScale>
              <InteractiveScale>
                <Button 
                  variant="outline" 
                  onClick={() => setShowHelpSystem(true)}
                  className="flex items-center space-x-2"
                  data-testid="button-help-quests"
                >
                  <HelpCircle className="h-4 w-4" />
                  <span>Help Quests</span>
                </Button>
              </InteractiveScale>
              <div className="flex items-center space-x-2">
                <NotificationHeader />
                <InteractiveScale>
                  <Button 
                    variant="outline" 
                    onClick={handleLogout}
                    className="flex items-center space-x-2"
                    data-testid="button-logout"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </Button>
                </InteractiveScale>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Welcome Section */}
        <SlideIn delay={0.1}>
          <div className="mb-8">
            <Bounce>
              <h2 className="text-3xl font-bold text-gray-900 mb-2" data-testid="welcome-message">
                Welcome back, {studentData.name}!
              </h2>
            </Bounce>
            <FadeIn delay={0.3}>
              <p className="text-gray-600">
                {scholar ? `Grade ${scholar.gradeLevel} • ${scholar.username}` : "Loading your information..."}
              </p>
            </FadeIn>
          </div>
        </SlideIn>

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
          <StaggerContainer>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* House Information */}
              {currentHouse && (
                <StaggerItem>
                  <SparkleEffect>
                    <Card className={`col-span-1 md:col-span-2 lg:col-span-1 ${themeStyles.cardBg} border-white/20`}>
                      <CardHeader>
                        <CardTitle className={`flex items-center ${themeStyles.textPrimary}`}>
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
                  </SparkleEffect>
                </StaggerItem>
            )}

            {/* Personal Points Summary */}
            <StaggerItem>
              <Card className={`col-span-1 md:col-span-2 lg:col-span-2 ${themeStyles.cardBg} border-white/20`}>
                <CardHeader>
                  <CardTitle className={`flex items-center ${themeStyles.textPrimary}`}>
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
                  
                  {/* Legendary Status Progress */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <GraduationCap className="h-5 w-5 text-yellow-600" />
                        <span className="font-semibold text-yellow-800">BHSA Legend Progress</span>
                      </div>
                      <span className="text-sm font-medium text-yellow-700">
                        {totalPoints} / {legendaryRequirement} points
                      </span>
                    </div>
                    <div className="w-full bg-yellow-200 rounded-full h-3 mb-2">
                      <div 
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${legendaryProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-yellow-700">
                      {totalPoints < legendaryRequirement 
                        ? `${legendaryRequirement - totalPoints} more points needed to achieve legendary status!`
                        : '🏆 Congratulations! You have achieved BHSA Legend status!'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>

            {/* PBIS Recognition */}
            <StaggerItem>
              <Card className={`col-span-1 md:col-span-2 lg:col-span-3 ${themeStyles.cardBg} border-white/20`}>
                <CardHeader>
                  <CardTitle className={`flex items-center ${themeStyles.textPrimary}`}>
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
                  <div className={`text-center py-8 ${themeStyles.textSecondary}`}>
                    <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p>No PBIS recognitions yet</p>
                    <p className="text-sm mt-1">Keep demonstrating MUSTANG traits to earn recognition!</p>
                  </div>
                )}
                </CardContent>
              </Card>
            </StaggerItem>

            {/* Behavioral Reflections */}
            {reflections.length > 0 && (
              <StaggerItem>
                <Card className={`col-span-1 md:col-span-2 lg:col-span-3 ${themeStyles.cardBg} border-white/20`}>
                <CardHeader>
                  <CardTitle className={`flex items-center ${themeStyles.textPrimary}`}>
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
              </StaggerItem>
            )}

            {/* Social Emotional Learning (SEL) Section */}
            <StaggerItem>
              <Card className={`col-span-1 md:col-span-2 lg:col-span-3 ${themeStyles.cardBg} border-white/20`}>
                <CardHeader>
                  <CardTitle className={`flex items-center ${themeStyles.textPrimary}`}>
                    <Brain className="mr-2 h-5 w-5 text-purple-600" />
                    Social Emotional Learning
                    <Badge variant="secondary" className="ml-2">
                      0 lessons
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Brain className="h-12 w-12 mx-auto mb-4 text-purple-400 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2" style={{color: themeStyles.textPrimary}}>
                      SEL System Coming Soon
                    </h3>
                    <p className="text-sm mb-4" style={{color: themeStyles.textSecondary}}>
                      When you receive negative PBIS points, you'll get personalized learning lessons to help improve your behavior and social skills.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto text-sm">
                      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                        <span className="text-gray-700">AI-powered lessons</span>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                        <span className="text-gray-700">Interactive quizzes</span>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                        <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                        <span className="text-gray-700">Progress tracking</span>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                        <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0"></div>
                        <span className="text-gray-700">Parent notifications</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>

            </div>
          </StaggerContainer>
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

      {/* Dashboard Themes Modal */}
      <DashboardThemes
        isOpen={themesModalOpen}
        onClose={() => setThemesModalOpen(false)}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
        studentData={scholar}
      />

      {/* Learning Assistant Integration (invisible helper) */}
      <LearningAssistantIntegration
        studentPoints={{
          academic: scholar?.academicPoints || 0,
          behavior: scholar?.behaviorPoints || 0,
          attendance: scholar?.attendancePoints || 0
        }}
      />

      {/* Interactive Learning Assistant */}
      <InteractiveLearningAssistant
        studentHouse={currentHouse?.name || 'franklin'}
        studentPoints={{
          academic: scholar?.academicPoints || 0,
          behavior: scholar?.behaviorPoints || 0,
          attendance: scholar?.attendancePoints || 0
        }}
        onHelpRequest={(topic) => {
          console.log('Help requested for:', topic);
          // Trigger appropriate tutorial or help content
          if (topic.includes('house system')) {
            setShowTutorial('house-system');
          } else if (topic.includes('earning points')) {
            setShowTutorial('dashboard-navigation');
          } else if (topic.includes('MUSTANG traits')) {
            setShowTutorial('learning-assistant');
          }
        }}
      />

      {/* Gamified Help System Modal */}
      {showHelpSystem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Learning Quests</h2>
              <Button
                variant="ghost"
                onClick={() => setShowHelpSystem(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </Button>
            </div>
            <GamifiedHelpSystem
              onQuestComplete={(questId) => {
                triggerCelebration(`completing the ${questId} quest`, 50);
              }}
              studentLevel={Math.floor(((scholar?.academicPoints || 0) + (scholar?.behaviorPoints || 0) + (scholar?.attendancePoints || 0)) / 100) + 1}
              studentXP={(scholar?.academicPoints || 0) + (scholar?.behaviorPoints || 0) + (scholar?.attendancePoints || 0)}
            />
          </div>
        </div>
      )}

      {/* Animated Tutorial System */}
      {showTutorial && tutorialLibrary[showTutorial as keyof typeof tutorialLibrary] && (
        <AnimatedTutorials
          tutorialId={showTutorial}
          steps={tutorialLibrary[showTutorial as keyof typeof tutorialLibrary].steps}
          onComplete={() => {
            setShowTutorial(null);
            triggerCelebration(`completing the ${showTutorial} tutorial`, 25);
          }}
          autoPlay={true}
        />
      )}
    </div>
  );
}

// Main component wrapped with Learning Assistant Provider
export default function StudentDashboard() {
  return (
    <LearningAssistantProvider>
      <StudentDashboardContent />
    </LearningAssistantProvider>
  );
}