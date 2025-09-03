import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import schoolLogoPath from "@assets/BHSA Mustangs Crest_1754722733103.jpg";
import { 
  LogOut, 
  Users, 
  Award, 
  MessageCircle, 
  Home, 
  BookOpen, 
  Trophy, 
  Heart,
  Sparkles,
  TrendingUp,
  Shield,
  Zap,
  Globe,
  Target,
  Brain,
  FileText,
  Camera,
  Search,
  Calendar,
  Star
} from "lucide-react";

interface Teacher {
  id: string;
  name: string;
  email: string;
  role: string;
  gradeRole: string;
  subject?: string;
  canSeeGrades: number[];
}

interface Scholar {
  id: string;
  name: string;
  studentId: string;
  houseId: string;
  grade: number;
  academicPoints: number;
  attendancePoints: number;
  behaviorPoints: number;
}

export default function ModernTeacherDashboard() {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Check teacher authentication
  useEffect(() => {
    const token = localStorage.getItem("teacherToken");
    const teacherData = localStorage.getItem("teacherData");
    
    if (!token || !teacherData) {
      setLocation("/teacher-login");
      return;
    }
    
    try {
      const parsedTeacher = JSON.parse(teacherData);
      setTeacher(parsedTeacher);
    } catch (error) {
      localStorage.removeItem("teacherToken");
      localStorage.removeItem("teacherData");
      setLocation("/teacher-login");
    }
  }, [setLocation]);

  // Fetch students based on teacher's permissions
  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['/api/teacher/scholars'],
    enabled: !!teacher,
    retry: false
  });

  // Fetch teacher's PBIS entries for today
  const { data: todayPBIS = [], isLoading: pbisLoading } = useQuery({
    queryKey: ['/api/teacher/today-pbis'],
    enabled: !!teacher,
    retry: false
  });

  const handleLogout = () => {
    localStorage.removeItem("teacherToken");
    localStorage.removeItem("teacherData");
    setLocation("/teacher-login");
    toast({
      title: "Logged out successfully",
      description: "You have been safely signed out.",
    });
  };

  if (!teacher) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      {/* Modern Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-b border-white/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img 
                  src={schoolLogoPath} 
                  alt="BHSA Mustangs" 
                  className="h-12 w-12 rounded-full shadow-lg ring-2 ring-blue-500/20"
                />
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Teacher Portal
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Welcome back, {teacher.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="hidden md:flex items-center gap-2 px-3 py-1.5">
                <Shield className="h-4 w-4 text-green-500" />
                {teacher.gradeRole} Teacher
              </Badge>
              <Badge variant="secondary" className="hidden md:flex">
                Grade {teacher.canSeeGrades?.join(', ')}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Modern Navigation */}
      <div className="container mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-6 gap-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 p-1 h-auto">
            <TabsTrigger 
              value="dashboard" 
              className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger 
              value="students" 
              className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">My Students</span>
            </TabsTrigger>
            <TabsTrigger 
              value="pbis" 
              className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
            >
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">PBIS Awards</span>
            </TabsTrigger>
            <TabsTrigger 
              value="messages" 
              className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Messages</span>
            </TabsTrigger>
            <TabsTrigger 
              value="insights" 
              className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
            >
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">AI Insights</span>
            </TabsTrigger>
            <TabsTrigger 
              value="tools" 
              className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-500 data-[state=active]:to-gray-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Tools</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Key Metrics Cards */}
              <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">My Students</p>
                      <p className="text-3xl font-bold">{students.length}</p>
                      <p className="text-blue-200 text-xs">Active learners</p>
                    </div>
                    <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="absolute -right-4 -bottom-4 h-20 w-20 bg-white/10 rounded-full"></div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm font-medium">PBIS Today</p>
                      <p className="text-3xl font-bold">{todayPBIS.length}</p>
                      <p className="text-emerald-200 text-xs">Points awarded</p>
                    </div>
                    <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Award className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="absolute -right-4 -bottom-4 h-20 w-20 bg-white/10 rounded-full"></div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Class Average</p>
                      <p className="text-3xl font-bold">87%</p>
                      <p className="text-purple-200 text-xs">Engagement score</p>
                    </div>
                    <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="absolute -right-4 -bottom-4 h-20 w-20 bg-white/10 rounded-full"></div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden bg-gradient-to-br from-orange-500 to-red-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm font-medium">Messages</p>
                      <p className="text-3xl font-bold">12</p>
                      <p className="text-orange-200 text-xs">New notifications</p>
                    </div>
                    <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                      <MessageCircle className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="absolute -right-4 -bottom-4 h-20 w-20 bg-white/10 rounded-full"></div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    onClick={() => setActiveTab("pbis")}
                    className="h-20 flex flex-col items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Award className="h-6 w-6" />
                    <span className="text-sm font-medium">Award PBIS</span>
                  </Button>
                  <Button 
                    onClick={() => setActiveTab("students")}
                    className="h-20 flex flex-col items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Users className="h-6 w-6" />
                    <span className="text-sm font-medium">View Students</span>
                  </Button>
                  <Button 
                    onClick={() => setActiveTab("messages")}
                    className="h-20 flex flex-col items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <MessageCircle className="h-6 w-6" />
                    <span className="text-sm font-medium">Messages</span>
                  </Button>
                  <Button 
                    onClick={() => setActiveTab("insights")}
                    className="h-20 flex flex-col items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Brain className="h-6 w-6" />
                    <span className="text-sm font-medium">AI Insights</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                    <div className="h-10 w-10 bg-emerald-500 rounded-full flex items-center justify-center">
                      <Award className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-emerald-900">PBIS Points Awarded</p>
                      <p className="text-sm text-emerald-700">You awarded 15 points today across 8 students</p>
                    </div>
                    <Badge className="bg-emerald-500 text-white">Today</Badge>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <MessageCircle className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-blue-900">Parent Messages</p>
                      <p className="text-sm text-blue-700">3 new messages from parents awaiting response</p>
                    </div>
                    <Badge className="bg-blue-500 text-white">New</Badge>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <div className="h-10 w-10 bg-purple-500 rounded-full flex items-center justify-center">
                      <Star className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-purple-900">Student Achievements</p>
                      <p className="text-sm text-purple-700">2 students earned new badges this week</p>
                    </div>
                    <Badge className="bg-purple-500 text-white">This Week</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other tabs placeholder content */}
          <TabsContent value="students">
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-xl">
              <CardContent className="p-8 text-center">
                <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Student Management</h3>
                <p className="text-gray-600">Your student roster and management tools</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pbis">
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-xl">
              <CardContent className="p-8 text-center">
                <Award className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">PBIS Awards</h3>
                <p className="text-gray-600">Award points and recognize positive behavior</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-xl">
              <CardContent className="p-8 text-center">
                <MessageCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Messages</h3>
                <p className="text-gray-600">Communicate with parents and administrators</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights">
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-xl">
              <CardContent className="p-8 text-center">
                <Brain className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">AI Insights</h3>
                <p className="text-gray-600">AI-powered recommendations and analytics</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tools">
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-xl">
              <CardContent className="p-8 text-center">
                <BookOpen className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Teaching Tools</h3>
                <p className="text-gray-600">Resources and utilities for your classroom</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}