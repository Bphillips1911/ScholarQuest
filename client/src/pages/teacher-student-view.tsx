import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
  Eye,
  User,
  Trophy,
  Star,
  Target,
  BookOpen,
  Calendar,
  Heart,
  Gamepad2,
  Sparkles,
  Award,
  TrendingUp,
  Palette,
  Volume2,
  Gift,
  Zap
} from 'lucide-react';
import { InteractiveLearningAssistant } from '@/components/learning-assistant/InteractiveLearningAssistant';
import { DashboardThemes } from '@/components/DashboardThemes';
import logoPath from '@assets/_BHSA Mustang 1_1754780382943.png';

interface StudentData {
  id: string;
  name: string;
  username: string;
  grade: number;
  houseId: string;
  houseName: string;
  houseColor: string;
  academicPoints: number;
  attendancePoints: number;
  behaviorPoints: number;
  totalPoints: number;
  level: number;
  xp: number;
  nextLevelXp: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  category: string;
  unlocked: boolean;
  unlockedAt?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface SkillNode {
  id: string;
  title: string;
  description: string;
  category: 'academic' | 'behavioral' | 'social' | 'leadership';
  level: number;
  requiredPoints: number;
  currentPoints: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  position: { x: number; y: number };
  icon: string;
  rewards: string[];
}

export default function TeacherStudentView() {
  const [match, params] = useRoute('/teacher-student-view/:studentId');
  const [, setLocation] = useLocation();
  const [teacherViewData, setTeacherViewData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTheme, setSelectedTheme] = useState('default');
  const [showThemes, setShowThemes] = useState(false);

  useEffect(() => {
    // Get teacher viewing session data
    const viewingData = sessionStorage.getItem('teacherViewingStudent');
    if (viewingData) {
      setTeacherViewData(JSON.parse(viewingData));
    }
  }, []);

  // Fetch comprehensive student data
  const { data: studentData, isLoading } = useQuery({
    queryKey: [`/api/teacher/student-dashboard/${params?.studentId}`],
    enabled: !!params?.studentId,
  });

  // Fetch student achievements
  const { data: achievements = [] } = useQuery({
    queryKey: [`/api/achievements/student/${params?.studentId}`],
    enabled: !!params?.studentId,
  });

  // Fetch student skill tree data
  const { data: skillTreeData = [] } = useQuery({
    queryKey: [`/api/student/skill-tree/${params?.studentId}`],
    enabled: !!params?.studentId,
  });

  // Fetch PBIS entries for activity
  const { data: pbisEntries = [] } = useQuery({
    queryKey: [`/api/pbis-entries`, params?.studentId],
    enabled: !!params?.studentId,
  });

  const handleReturnToTeacher = () => {
    // Clear teacher viewing session
    sessionStorage.removeItem('teacherViewingStudent');
    window.close();
  };

  const getThemeStyles = (theme: string) => {
    const themes = {
      default: {
        bg: 'from-slate-900 via-purple-900 to-slate-900',
        cardBg: 'rgba(15, 23, 42, 0.8)',
        border: 'rgba(148, 163, 184, 0.2)',
        accent: 'from-blue-600 to-purple-600',
        textPrimary: '#f1f5f9',
        textSecondary: '#94a3b8'
      },
      'kelly-green': {
        bg: 'from-green-900 via-emerald-900 to-slate-900',
        cardBg: 'rgba(20, 83, 45, 0.8)',
        border: 'rgba(52, 211, 153, 0.2)',
        accent: 'from-green-500 to-emerald-500',
        textPrimary: '#f0fdf4',
        textSecondary: '#86efac'
      },
      gold: {
        bg: 'from-yellow-900 via-amber-900 to-orange-900',
        cardBg: 'rgba(120, 53, 15, 0.8)',
        border: 'rgba(251, 191, 36, 0.2)',
        accent: 'from-yellow-400 to-amber-400',
        textPrimary: '#fffbeb',
        textSecondary: '#fcd34d'
      }
    };
    return themes[theme as keyof typeof themes] || themes.default;
  };

  if (!match || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading student dashboard...</p>
        </div>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Card className="p-8 text-center">
          <p className="text-red-500 mb-4">Unable to load student data</p>
          <Button onClick={handleReturnToTeacher}>Return to Teacher Dashboard</Button>
        </Card>
      </div>
    );
  }

  const themeStyles = getThemeStyles(selectedTheme);
  const { scholar, house, pbisEntries: studentPbisEntries = [] } = studentData;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${themeStyles.bg}`}>
      {/* Teacher Header Banner */}
      <div className="bg-blue-900 bg-opacity-90 backdrop-blur-sm border-b border-blue-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logoPath} alt="BHSA Logo" className="h-12 w-12" />
            <div>
              <h1 className="text-xl font-bold text-white">Teacher View: {scholar?.name}</h1>
              <p className="text-blue-200 text-sm">
                {teacherViewData?.teacherMode ? 'Interactive Student Dashboard Experience' : 'Student Portal View'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => setShowThemes(true)}
              variant="outline" 
              className="text-white border-white hover:bg-white hover:text-blue-900"
            >
              <Palette className="h-4 w-4 mr-2" />
              Themes
            </Button>
            <Button 
              onClick={handleReturnToTeacher}
              className="bg-white text-blue-900 hover:bg-blue-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Student Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-0 shadow-2xl backdrop-blur-sm" style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div 
                      className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg"
                      style={{backgroundColor: house?.color || '#7c3aed'}}
                    >
                      {scholar?.name?.charAt(0)}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1">
                      <Badge variant="secondary" className="text-xs px-2 py-1">
                        Level {scholar?.level || 1}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold mb-2" style={{color: themeStyles.textPrimary}}>
                      {scholar?.name}
                    </h2>
                    <div className="flex items-center gap-3">
                      <Badge 
                        className="text-white font-semibold"
                        style={{backgroundColor: house?.color || '#7c3aed'}}
                      >
                        House {house?.name}
                      </Badge>
                      <Badge variant="outline" style={{color: themeStyles.textSecondary, borderColor: themeStyles.border}}>
                        Grade {scholar?.grade}
                      </Badge>
                      <Badge variant="outline" style={{color: themeStyles.textSecondary, borderColor: themeStyles.border}}>
                        @{scholar?.username}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <span className="text-2xl font-bold" style={{color: themeStyles.textPrimary}}>
                      {scholar?.totalPoints || 0}
                    </span>
                    <span className="text-sm" style={{color: themeStyles.textSecondary}}>Total Points</span>
                  </div>
                  <div className="w-64">
                    <div className="flex justify-between text-xs mb-1" style={{color: themeStyles.textSecondary}}>
                      <span>XP Progress</span>
                      <span>{scholar?.xp || 0} / {scholar?.nextLevelXp || 100}</span>
                    </div>
                    <Progress 
                      value={((scholar?.xp || 0) / (scholar?.nextLevelXp || 100)) * 100} 
                      className="h-2 bg-opacity-30"
                    />
                  </div>
                </div>
              </div>

              {/* Points Breakdown */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-blue-500 bg-opacity-20 backdrop-blur-sm">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 text-blue-400" />
                  <div className="text-2xl font-bold text-blue-400">{scholar?.academicPoints || 0}</div>
                  <div className="text-sm" style={{color: themeStyles.textSecondary}}>Academic</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-green-500 bg-opacity-20 backdrop-blur-sm">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-green-400" />
                  <div className="text-2xl font-bold text-green-400">{scholar?.attendancePoints || 0}</div>
                  <div className="text-sm" style={{color: themeStyles.textSecondary}}>Attendance</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-purple-500 bg-opacity-20 backdrop-blur-sm">
                  <Heart className="h-8 w-8 mx-auto mb-2 text-purple-400" />
                  <div className="text-2xl font-bold text-purple-400">{scholar?.behaviorPoints || 0}</div>
                  <div className="text-sm" style={{color: themeStyles.textSecondary}}>Behavior</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Interactive Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 p-1 bg-black bg-opacity-30 backdrop-blur-sm rounded-lg border" style={{borderColor: themeStyles.border}}>
            <TabsTrigger value="overview" className="text-white data-[state=active]:bg-white data-[state=active]:text-black">
              <Eye className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="achievements" className="text-white data-[state=active]:bg-white data-[state=active]:text-black">
              <Trophy className="h-4 w-4 mr-2" />
              Achievements
            </TabsTrigger>
            <TabsTrigger value="skill-tree" className="text-white data-[state=active]:bg-white data-[state=active]:text-black">
              <Gamepad2 className="h-4 w-4 mr-2" />
              Skill Tree
            </TabsTrigger>
            <TabsTrigger value="learning-path" className="text-white data-[state=active]:bg-white data-[state=active]:text-black">
              <Target className="h-4 w-4 mr-2" />
              Learning Path
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-white data-[state=active]:bg-white data-[state=active]:text-black">
              <Sparkles className="h-4 w-4 mr-2" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Recent Achievements */}
            <Card className="border-0 shadow-lg backdrop-blur-sm" style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{color: themeStyles.textPrimary}}>
                  <Award className="h-5 w-5 text-yellow-500" />
                  Recent Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {achievements.slice(0, 6).map((achievement: Achievement) => (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 rounded-lg bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-center"
                    >
                      <div className="text-2xl mb-2">{achievement.icon}</div>
                      <h3 className="font-semibold text-sm">{achievement.title}</h3>
                      <p className="text-xs opacity-90">{achievement.description}</p>
                      <Badge variant="secondary" className="mt-2">
                        {achievement.points} pts
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Learning Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg backdrop-blur-sm" style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" style={{color: themeStyles.textPrimary}}>
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Progress Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span style={{color: themeStyles.textSecondary}}>Academic Growth</span>
                        <span style={{color: themeStyles.textPrimary}}>+12% this week</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span style={{color: themeStyles.textSecondary}}>Behavior Consistency</span>
                        <span style={{color: themeStyles.textPrimary}}>+8% this week</span>
                      </div>
                      <Progress value={68} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span style={{color: themeStyles.textSecondary}}>House Participation</span>
                        <span style={{color: themeStyles.textPrimary}}>+15% this week</span>
                      </div>
                      <Progress value={82} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg backdrop-blur-sm" style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" style={{color: themeStyles.textPrimary}}>
                    <Gift className="h-5 w-5 text-purple-500" />
                    Learning Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-blue-500 bg-opacity-20">
                      <h4 className="font-semibold text-blue-400 text-sm">Focus on Math Skills</h4>
                      <p className="text-xs" style={{color: themeStyles.textSecondary}}>
                        Great progress in algebra! Try geometry challenges next.
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-green-500 bg-opacity-20">
                      <h4 className="font-semibold text-green-400 text-sm">Collaboration Opportunity</h4>
                      <p className="text-xs" style={{color: themeStyles.textSecondary}}>
                        Join a house project to boost leadership skills.
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-purple-500 bg-opacity-20">
                      <h4 className="font-semibold text-purple-400 text-sm">STEAM Innovation</h4>
                      <p className="text-xs" style={{color: themeStyles.textSecondary}}>
                        Perfect time to explore coding or engineering projects.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <Card className="border-0 shadow-lg backdrop-blur-sm" style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
              <CardHeader>
                <CardTitle style={{color: themeStyles.textPrimary}}>Achievement Gallery</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements.map((achievement: Achievement) => (
                    <motion.div
                      key={achievement.id}
                      whileHover={{ scale: 1.05 }}
                      className={`p-4 rounded-lg border-2 ${
                        achievement.unlocked 
                          ? 'bg-gradient-to-r from-yellow-500 to-amber-500 border-yellow-400' 
                          : 'bg-gray-600 bg-opacity-30 border-gray-500'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-2">{achievement.icon}</div>
                        <h3 className="font-bold text-white mb-1">{achievement.title}</h3>
                        <p className="text-xs text-white opacity-90 mb-2">{achievement.description}</p>
                        <div className="flex justify-between items-center">
                          <Badge variant={achievement.unlocked ? "default" : "secondary"}>
                            {achievement.points} pts
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={
                              achievement.rarity === 'legendary' ? 'border-yellow-400 text-yellow-400' :
                              achievement.rarity === 'epic' ? 'border-purple-400 text-purple-400' :
                              achievement.rarity === 'rare' ? 'border-blue-400 text-blue-400' :
                              'border-gray-400 text-gray-400'
                            }
                          >
                            {achievement.rarity}
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skill-tree" className="space-y-6">
            <Card className="border-0 shadow-lg backdrop-blur-sm" style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
              <CardHeader>
                <CardTitle style={{color: themeStyles.textPrimary}}>Interactive Skill Tree</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative h-96 bg-black bg-opacity-30 rounded-lg p-6 overflow-hidden">
                  <div className="text-center">
                    <Gamepad2 className="h-16 w-16 mx-auto mb-4 text-purple-400" />
                    <h3 className="text-xl font-bold mb-2" style={{color: themeStyles.textPrimary}}>
                      Skill Development Journey
                    </h3>
                    <p style={{color: themeStyles.textSecondary}}>
                      Interactive skill tree showing progression across Academic, Behavioral, Social, and Leadership areas.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      {['Academic', 'Behavioral', 'Social', 'Leadership'].map((category) => (
                        <div key={category} className="text-center p-3 bg-gray-700 bg-opacity-50 rounded-lg">
                          <div className="text-2xl mb-2">
                            {category === 'Academic' && '📚'}
                            {category === 'Behavioral' && '⭐'}
                            {category === 'Social' && '🤝'}
                            {category === 'Leadership' && '👑'}
                          </div>
                          <h4 className="font-semibold text-sm" style={{color: themeStyles.textPrimary}}>
                            {category}
                          </h4>
                          <div className="text-xs" style={{color: themeStyles.textSecondary}}>
                            Level {Math.floor(Math.random() * 5) + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="learning-path" className="space-y-6">
            <Card className="border-0 shadow-lg backdrop-blur-sm" style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
              <CardHeader>
                <CardTitle style={{color: themeStyles.textPrimary}}>Personalized Learning Path</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { title: 'Academic Excellence Track', progress: 75, color: 'blue' },
                    { title: 'Character Development Path', progress: 60, color: 'purple' },
                    { title: 'House Leadership Journey', progress: 80, color: 'green' },
                    { title: 'STEAM Innovation Quest', progress: 45, color: 'orange' }
                  ].map((path) => (
                    <div key={path.title} className="p-4 rounded-lg bg-gray-700 bg-opacity-30">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold" style={{color: themeStyles.textPrimary}}>
                          {path.title}
                        </h3>
                        <span className="text-sm" style={{color: themeStyles.textSecondary}}>
                          {path.progress}% Complete
                        </span>
                      </div>
                      <Progress value={path.progress} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card className="border-0 shadow-lg backdrop-blur-sm" style={{backgroundColor: themeStyles.cardBg, borderColor: themeStyles.border}}>
              <CardHeader>
                <CardTitle style={{color: themeStyles.textPrimary}}>Recent Activity Feed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {studentPbisEntries.slice(0, 10).map((entry: any, index: number) => (
                    <motion.div
                      key={entry.id || index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-4 p-3 rounded-lg bg-gray-700 bg-opacity-30"
                    >
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{backgroundColor: entry.points > 0 ? '#10b981' : '#ef4444'}}
                      >
                        {entry.points > 0 ? '+' : ''}
                        {entry.points}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold" style={{color: themeStyles.textPrimary}}>
                          {entry.reason || 'MUSTANG Recognition'}
                        </h4>
                        <p className="text-sm" style={{color: themeStyles.textSecondary}}>
                          {entry.mustangTrait || entry.category} • {entry.teacherName}
                        </p>
                        <p className="text-xs" style={{color: themeStyles.textSecondary}}>
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge 
                        variant={entry.points > 0 ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {entry.category}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Interactive Learning Assistant */}
      <InteractiveLearningAssistant 
        studentHouse={house?.id}
        studentPoints={{
          academic: scholar?.academicPoints || 0,
          behavior: scholar?.behaviorPoints || 0,
          attendance: scholar?.attendancePoints || 0
        }}
        onHelpRequest={(topic) => console.log('Help requested for:', topic)}
      />

      {/* Theme Selector Modal */}
      <DashboardThemes
        isOpen={showThemes}
        onClose={() => setShowThemes(false)}
        currentTheme={selectedTheme}
        onThemeChange={setSelectedTheme}
        studentData={scholar}
      />
    </div>
  );
}