import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { GameModal } from "@/components/games/GameModal";
import { ReflectionLogs } from "@/components/admin/ReflectionLogs";
import { ProgressReportGenerator } from "@/components/ProgressReportGenerator";
import { AchievementPlayground } from "@/components/AchievementPlayground";
import { TeacherPerformanceHeatmap } from "@/components/TeacherPerformanceHeatmap";
import { AIRecommendationEngine } from "@/components/AIRecommendationEngine";
import { AdminTeacherViewer } from "@/components/AdminTeacherViewer";
import { useLocation } from "wouter";
import { 
  Users, 
  GraduationCap, 
  Award, 
  LogOut, 
  MessageSquare, 
  Camera, 
  BarChart3, 
  Brain, 
  FileText, 
  Trophy,
  Sparkles,
  TrendingUp,
  Shield,
  Zap,
  Globe,
  Target,
  Layers,
  Download,
  RefreshCw,
  UserPlus,
  Plus,
  CheckCircle,
  Clock,
  Send,
  Reply,
  Image,
  Palette,
  Eye,
  Mail,
  TestTube,
  Settings
} from "lucide-react";
import schoolLogoPath from "@assets/BHSA Mustangs Crest_1754722733103.jpg";
import type { House, Scholar, TeacherAuth } from "@shared/schema";

export default function ModernAdminDashboard() {
  const [activeTab, setActiveTab] = useState("teachers");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminData, setAdminData] = useState<any>(null);

  // Message form state
  const [messageForm, setMessageForm] = useState({
    subject: "",
    message: "",
    recipientType: ""
  });

  // Photo upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [photoDescription, setPhotoDescription] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Theme state
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'normal'>('normal');
  
  // Game modal state
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [showGameModal, setShowGameModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const data = localStorage.getItem("adminData");
    const savedTheme = localStorage.getItem("adminTheme") as 'light' | 'dark' | 'normal' || 'normal';
    
    setCurrentTheme(savedTheme);
    
    if (token && data) {
      try {
        const parsedData = JSON.parse(data);
        setAdminData(parsedData);
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminData");
        setLocation("/admin-login");
      }
    } else {
      setLocation("/admin-login");
    }
  }, [setLocation]);

  // Theme toggle function
  const toggleTheme = () => {
    const themes: ('light' | 'dark' | 'normal')[] = ['normal', 'light', 'dark'];
    const currentIndex = themes.indexOf(currentTheme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setCurrentTheme(nextTheme);
    localStorage.setItem("adminTheme", nextTheme);
  };

  // Fetch data hooks
  const { data: houses } = useQuery<House[]>({
    queryKey: ["/api/houses"],
    enabled: isAuthenticated,
  });

  const { data: allScholars } = useQuery<Scholar[]>({
    queryKey: ["/api/scholars"],
    enabled: isAuthenticated,
  });

  const { data: pendingTeachers } = useQuery<TeacherAuth[]>({
    queryKey: ["/api/admin/teachers/pending"],
    enabled: isAuthenticated,
  });

  // Fetch admin messages
  const { data: adminMessages = [] } = useQuery({
    queryKey: ["/api/admin/messages"],
    enabled: isAuthenticated,
  });

  // Fetch gallery photos for admin
  const { data: galleryPhotos = [] } = useQuery({
    queryKey: ["/api/pbis-photos"],
    enabled: isAuthenticated,
  });

  // Fetch badges data
  const { data: allBadges = [] } = useQuery({
    queryKey: ["/api/badges"],
    enabled: isAuthenticated,
  });

  // Fetch games data
  const { data: allGames = [] } = useQuery({
    queryKey: ["/api/games"],
    enabled: isAuthenticated,
  });

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    setLocation("/admin-login");
    toast({
      title: "Logged out successfully",
      description: "You have been safely logged out of the admin portal.",
    });
  };

  if (!isAuthenticated) return null;

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
                  PBIS Command Center
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Welcome back, {adminData?.name || 'Administrator'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="hidden md:flex items-center gap-2 px-3 py-1.5">
                <Shield className="h-4 w-4 text-green-500" />
                {adminData?.title || 'Principal'}
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
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
            <TabsList className="grid grid-cols-6 gap-1 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 p-1 h-auto col-span-3 md:col-span-6">
              <TabsTrigger value="teachers" className="flex items-center gap-1 px-2 py-2 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
                <Users className="h-3 w-3" />
                <span className="hidden sm:inline">Teachers</span>
              </TabsTrigger>
              <TabsTrigger value="teacher-viewer" className="flex items-center gap-1 px-2 py-2 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
                <Eye className="h-3 w-3" />
                <span className="hidden sm:inline">Viewer</span>
              </TabsTrigger>
              <TabsTrigger value="students" className="flex items-center gap-1 px-2 py-2 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white">
                <GraduationCap className="h-3 w-3" />
                <span className="hidden sm:inline">Students</span>
              </TabsTrigger>
              <TabsTrigger value="houses" className="flex items-center gap-1 px-2 py-2 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500 data-[state=active]:text-white">
                <Trophy className="h-3 w-3" />
                <span className="hidden sm:inline">Houses</span>
              </TabsTrigger>
              <TabsTrigger value="badges" className="flex items-center gap-1 px-2 py-2 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white">
                <Award className="h-3 w-3" />
                <span className="hidden sm:inline">Badges</span>
              </TabsTrigger>
              <TabsTrigger value="games" className="flex items-center gap-1 px-2 py-2 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
                <Sparkles className="h-3 w-3" />
                <span className="hidden sm:inline">Games</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            <TabsList className="grid grid-cols-4 gap-1 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 p-1 h-auto col-span-2 md:col-span-4">
              <TabsTrigger value="messaging" className="flex items-center gap-1 px-2 py-2 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
                <MessageSquare className="h-3 w-3" />
                <span className="hidden sm:inline">Messages</span>
              </TabsTrigger>
              <TabsTrigger value="gallery" className="flex items-center gap-1 px-2 py-2 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-500 data-[state=active]:text-white">
                <Camera className="h-3 w-3" />
                <span className="hidden sm:inline">Gallery</span>
              </TabsTrigger>
              <TabsTrigger value="reflections" className="flex items-center gap-1 px-2 py-2 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
                <FileText className="h-3 w-3" />
                <span className="hidden sm:inline">Reflections</span>
              </TabsTrigger>
              <TabsTrigger value="exports" className="flex items-center gap-1 px-2 py-2 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-500 data-[state=active]:to-gray-600 data-[state=active]:text-white">
                <Download className="h-3 w-3" />
                <span className="hidden sm:inline">Exports</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
            <TabsList className="grid grid-cols-4 gap-1 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 p-1 h-auto col-span-2 md:col-span-4">
              <TabsTrigger value="progress-reports" className="flex items-center gap-1 px-2 py-2 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">
                <BarChart3 className="h-3 w-3" />
                <span className="hidden sm:inline">Reports</span>
              </TabsTrigger>
              <TabsTrigger value="achievement-hub" className="flex items-center gap-1 px-2 py-2 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500 data-[state=active]:text-white">
                <Trophy className="h-3 w-3" />
                <span className="hidden sm:inline">Achievements</span>
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-1 px-2 py-2 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white">
                <TrendingUp className="h-3 w-3" />
                <span className="hidden sm:inline">Performance</span>
              </TabsTrigger>
              <TabsTrigger value="ai-engine" className="flex items-center gap-1 px-2 py-2 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
                <Brain className="h-3 w-3" />
                <span className="hidden sm:inline">AI Engine</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Teachers Tab */}
          <TabsContent value="teachers" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Key Metrics Cards */}
              <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Total Students</p>
                      <p className="text-3xl font-bold">847</p>
                      <p className="text-blue-200 text-xs">+12 this month</p>
                    </div>
                    <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                      <GraduationCap className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="absolute -right-4 -bottom-4 h-20 w-20 bg-white/10 rounded-full"></div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm font-medium">Active Teachers</p>
                      <p className="text-3xl font-bold">42</p>
                      <p className="text-emerald-200 text-xs">All systems active</p>
                    </div>
                    <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="absolute -right-4 -bottom-4 h-20 w-20 bg-white/10 rounded-full"></div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">PBIS Points Today</p>
                      <p className="text-3xl font-bold">1,247</p>
                      <p className="text-purple-200 text-xs">+18% vs yesterday</p>
                    </div>
                    <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Award className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="absolute -right-4 -bottom-4 h-20 w-20 bg-white/10 rounded-full"></div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden bg-gradient-to-br from-orange-500 to-red-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm font-medium">AI Insights</p>
                      <p className="text-3xl font-bold">94%</p>
                      <p className="text-orange-200 text-xs">Student engagement</p>
                    </div>
                    <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Brain className="h-6 w-6 text-white" />
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
                    onClick={() => setActiveTab("ai-tools")}
                    className="h-20 flex flex-col items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Brain className="h-6 w-6" />
                    <span className="text-sm font-medium">AI Reports</span>
                  </Button>
                  <Button 
                    onClick={() => setActiveTab("analytics")}
                    className="h-20 flex flex-col items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <BarChart3 className="h-6 w-6" />
                    <span className="text-sm font-medium">Analytics</span>
                  </Button>
                  <Button 
                    onClick={() => setActiveTab("students")}
                    className="h-20 flex flex-col items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <GraduationCap className="h-6 w-6" />
                    <span className="text-sm font-medium">Students</span>
                  </Button>
                  <Button 
                    onClick={() => setActiveTab("teachers")}
                    className="h-20 flex flex-col items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Users className="h-6 w-6" />
                    <span className="text-sm font-medium">Teachers</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Teacher Viewer Tab */}
          <TabsContent value="teacher-viewer" className="space-y-6">
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-500" />
                  Teacher Management & Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AdminTeacherViewer />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Houses Tab */}
          <TabsContent value="houses" className="space-y-6">
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  House Standings & Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {houses?.map((house: House, index) => (
                    <Card key={house.id} className="relative overflow-hidden group hover:scale-105 transition-transform duration-200" style={{ backgroundColor: `${house.color}15`, borderColor: house.color }}>
                      <CardContent className="p-6 text-center">
                        <div className="h-16 w-16 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-2xl" style={{ backgroundColor: house.color }}>
                          {house.name.charAt(0)}
                        </div>
                        <h3 className="font-bold text-lg mb-2">{house.name}</h3>
                        <div className="space-y-2">
                          <div className="bg-white/50 rounded-lg p-2">
                            <p className="text-sm font-medium">Total Points</p>
                            <p className="text-2xl font-bold" style={{ color: house.color }}>{house.totalPoints}</p>
                          </div>
                          <Badge className="w-full" style={{ backgroundColor: house.color, color: 'white' }}>
                            Rank #{index + 1}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Badges Tab */}
          <TabsContent value="badges" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-green-500" />
                    Badge Overview ({allBadges?.length || 0} Total)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {allBadges?.map((badge: any) => (
                      <div key={badge.id} className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-green-900">{badge.name}</h4>
                            <p className="text-sm text-green-700">{badge.description}</p>
                          </div>
                          <Badge variant={badge.category === 'overall' ? 'default' : 'secondary'}>
                            Level {badge.level}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-green-600">
                          <span>{badge.category} • {badge.pointsRequired} points</span>
                          <span>{badge.houseId ? badge.houseId.charAt(0).toUpperCase() + badge.houseId.slice(1) : 'Universal'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle>Badge Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['academic', 'behavior', 'attendance', 'overall'].map(category => {
                      const categoryBadges = allBadges?.filter((b: any) => b.category === category) || [];
                      return (
                        <div key={category} className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                          <div className="flex justify-between items-center">
                            <span className="font-medium capitalize text-blue-900">{category}</span>
                            <Badge variant="outline">{categoryBadges.length} badges</Badge>
                          </div>
                          <p className="text-xs mt-1 text-blue-700">
                            {categoryBadges.map((b: any) => `${b.pointsRequired}pts`).join(', ')}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Games Tab */}
          <TabsContent value="games" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    Game Library ({allGames?.length || 0} Games)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {allGames?.map((game: any) => (
                      <div key={game.id} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-purple-900">{game.name}</h4>
                            <p className="text-sm text-purple-700">{game.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={game.difficulty === 'easy' ? 'default' : game.difficulty === 'medium' ? 'secondary' : 'destructive'}>
                              {game.difficulty}
                            </Badge>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedGame(game);
                                setShowGameModal(true);
                              }}
                              className="bg-purple-500 text-white hover:bg-purple-600"
                            >
                              Test Game
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-purple-600">
                          <span>{game.category} • {game.pointsRequired} points required</span>
                          <span className={`px-2 py-1 rounded ${game.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {game.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle>Game Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['sports', 'puzzle', 'strategy', 'arcade', 'adventure', 'racing'].map(category => {
                      const categoryGames = allGames?.filter((g: any) => g.category === category) || [];
                      return (
                        <div key={category} className="p-3 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
                          <div className="flex justify-between items-center">
                            <span className="font-medium capitalize text-indigo-900">{category}</span>
                            <Badge variant="outline">{categoryGames.length} games</Badge>
                          </div>
                          {categoryGames.length > 0 && (
                            <p className="text-xs mt-1 text-indigo-700">
                              {categoryGames.map((g: any) => g.name).slice(0, 2).join(', ')}
                              {categoryGames.length > 2 && ` +${categoryGames.length - 2} more`}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Messaging Tab */}
          <TabsContent value="messaging" className="space-y-6">

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-blue-500" />
                    Student Roster ({allScholars?.length || 0} Students)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {allScholars?.map((scholar: Scholar) => (
                      <div key={scholar.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                            {scholar.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-blue-900">{scholar.name}</p>
                            <p className="text-sm text-blue-700">Grade {scholar.grade} • {scholar.studentId}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-blue-900">{scholar.academicPoints + scholar.attendancePoints + scholar.behaviorPoints} Points</p>
                          <p className="text-xs text-blue-700">Total PBIS</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    House Standings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {houses?.map((house: House, index) => (
                      <div key={house.id} className="flex items-center justify-between p-3 rounded-lg border" style={{ backgroundColor: `${house.color}20`, borderColor: house.color }}>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full" style={{ backgroundColor: house.color }}></div>
                          <span className="font-medium">{house.name}</span>
                        </div>
                        <div className="text-right">
                          <Badge className="text-xs">#{index + 1}</Badge>
                          <p className="text-sm font-medium">{house.totalPoints} pts</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Teachers Tab */}
          <TabsContent value="teachers" className="space-y-6">
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  Teacher Management & Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AdminTeacherViewer />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messaging Tab (renamed from messages) */}
          <TabsContent value="messaging" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5 text-green-500" />
                    Send Message
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="recipientType">Send To</Label>
                    <Select value={messageForm.recipientType} onValueChange={(value) => setMessageForm(prev => ({ ...prev, recipientType: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select recipients" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_parents">All Parents</SelectItem>
                        <SelectItem value="all_teachers">All Teachers</SelectItem>
                        <SelectItem value="grade_6_parents">Grade 6 Parents</SelectItem>
                        <SelectItem value="grade_7_parents">Grade 7 Parents</SelectItem>
                        <SelectItem value="grade_8_parents">Grade 8 Parents</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input 
                      id="subject"
                      placeholder="Message subject"
                      value={messageForm.subject}
                      onChange={(e) => setMessageForm(prev => ({ ...prev, subject: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <textarea 
                      id="message"
                      className="w-full h-32 p-3 border rounded-lg resize-none"
                      placeholder="Type your message here..."
                      value={messageForm.message}
                      onChange={(e) => setMessageForm(prev => ({ ...prev, message: e.target.value }))}
                    />
                  </div>
                  <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                    Recent Messages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {adminMessages?.slice(0, 10).map((message: any) => (
                      <div key={message.id} className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-blue-900">{message.subject}</span>
                          <Badge variant="outline">{message.type}</Badge>
                        </div>
                        <p className="text-sm text-blue-700 mb-1">{message.message.substring(0, 100)}...</p>
                        <p className="text-xs text-blue-600">To: {message.recipientType}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5 text-green-500" />
                    Upload Photo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="photo">Select Photo</Label>
                    <Input 
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input 
                      id="description"
                      placeholder="Photo description"
                      value={photoDescription}
                      onChange={(e) => setPhotoDescription(e.target.value)}
                    />
                  </div>
                  <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                    <Camera className="h-4 w-4 mr-2" />
                    Upload Photo
                  </Button>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5 text-purple-500" />
                    PBIS Photo Gallery
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                    {galleryPhotos?.map((photo: any) => (
                      <div key={photo.id} className="relative group">
                        <img 
                          src={photo.photoUrl} 
                          alt={photo.description}
                          className="w-full h-32 object-cover rounded-lg shadow-md group-hover:shadow-xl transition-shadow duration-200"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors duration-200"></div>
                        <div className="absolute bottom-2 left-2 right-2">
                          <p className="text-white text-xs font-medium bg-black/50 rounded px-2 py-1 truncate">
                            {photo.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reflections Tab */}
          <TabsContent value="reflections" className="space-y-6">
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-500" />
                  Behavioral Reflection Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ReflectionLogs />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Exports Tab */}
          <TabsContent value="exports" className="space-y-6">
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-slate-500" />
                  Data Export Center
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    onClick={() => window.open('/api/admin/export/scholars', '_blank')}
                    className="flex items-center gap-2 h-20 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                  >
                    <Download className="h-6 w-6" />
                    <div className="text-left">
                      <div className="font-semibold">Export Students</div>
                      <div className="text-sm opacity-75">Download all student data</div>
                    </div>
                  </Button>
                  
                  <Button 
                    onClick={() => window.open('/api/admin/export/pbis', '_blank')}
                    className="flex items-center gap-2 h-20 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                  >
                    <Download className="h-6 w-6" />
                    <div className="text-left">
                      <div className="font-semibold">Export PBIS Data</div>
                      <div className="text-sm opacity-75">Download all PBIS entries</div>
                    </div>
                  </Button>
                  
                  <Button 
                    onClick={() => window.open('/api/admin/export/houses', '_blank')}
                    className="flex items-center gap-2 h-20 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                  >
                    <Download className="h-6 w-6" />
                    <div className="text-left">
                      <div className="font-semibold">Export House Data</div>
                      <div className="text-sm opacity-75">Download house standings</div>
                    </div>
                  </Button>
                  
                  <Button 
                    onClick={() => window.open('/api/admin/export/reflections', '_blank')}
                    className="flex items-center gap-2 h-20 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  >
                    <Download className="h-6 w-6" />
                    <div className="text-left">
                      <div className="font-semibold">Export Reflections</div>
                      <div className="text-sm opacity-75">Download reflection logs</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          </TabsContent>

          {/* Progress Reports Tab */}
          <TabsContent value="progress-reports" className="space-y-6">
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-cyan-500" />
                  AI-Powered Progress Report Generator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressReportGenerator />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievement Hub Tab */}
          <TabsContent value="achievement-hub" className="space-y-6">
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Interactive Achievement Playground
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AchievementPlayground />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                  Teacher Performance Analytics & Heatmap
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TeacherPerformanceHeatmap />
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Engine Tab */}
          <TabsContent value="ai-engine" className="space-y-6">
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-violet-500" />
                  AI-Powered Adaptive Recommendation Engine
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AIRecommendationEngine />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Progress Reports Tab */}
          <TabsContent value="progress-reports" className="space-y-6">
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-cyan-500" />
                  AI-Powered Progress Report Generator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressReportGenerator />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievement Hub Tab */}
          <TabsContent value="achievement-hub" className="space-y-6">
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Interactive Achievement Playground
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AchievementPlayground />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                  Teacher Performance Analytics & Heatmap
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TeacherPerformanceHeatmap />
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Engine Tab */}
          <TabsContent value="ai-engine" className="space-y-6">
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-violet-500" />
                  AI-Powered Adaptive Recommendation Engine
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AIRecommendationEngine />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}