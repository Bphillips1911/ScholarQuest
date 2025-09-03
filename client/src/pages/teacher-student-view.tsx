import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
  Home,
  Heart,
  Target,
  BookOpen,
  Calendar,
  Gamepad2,
  Sparkles,
  Award,
  Palette,
  HelpCircle,
  LogOut,
  Map
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
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-900 to-gray-900">
      {/* Exact Student Portal Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <img src={logoPath} alt="BHSA Logo" className="h-10 w-10" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Student Portal</h1>
                <p className="text-sm text-gray-600">Bush Hills STEAM Academy</p>
              </div>
            </div>

            {/* Navigation Buttons - Exact Match */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <Heart className="h-4 w-4 mr-1" />
                Mood Tracker
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <Target className="h-4 w-4 mr-1" />
                Learning Path
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <Gamepad2 className="h-4 w-4 mr-1" />
                Skill Tree
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <Map className="h-4 w-4 mr-1" />
                House History
              </Button>
              <Button variant="ghost" size="sm" className="bg-purple-100 text-purple-700 hover:bg-purple-200">
                <Sparkles className="h-4 w-4 mr-1" />
                Game Zone
              </Button>
              <Button variant="ghost" size="sm" className="bg-green-100 text-green-700 hover:bg-green-200">
                <Award className="h-4 w-4 mr-1" />
                Achievements
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowThemes(true)}
                className="text-gray-600 hover:text-gray-900"
              >
                <Palette className="h-4 w-4 mr-1" />
                Themes
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <HelpCircle className="h-4 w-4 mr-1" />
                Help Quests
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleReturnToTeacher}
                className="text-red-600 hover:text-red-800 hover:bg-red-50"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Return
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Exact Student Dashboard Layout */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Message - Exact Match */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, {scholar?.name}!
          </h1>
          <p className="text-green-200">
            Grade {scholar?.grade} • House {house?.name}
          </p>
        </div>

        {/* Three Card Layout - Exact Match */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Your House Card - Exact Match */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="bg-white rounded-2xl shadow-lg h-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Home className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Your House</h3>
                </div>
                
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">{house?.name}</h2>
                  <p className="text-sm text-gray-600 mb-6 italic">"{house?.description || 'Electrifying Excellence'}"</p>
                  
                  {/* House Color Circle */}
                  <div className="flex justify-center mb-6">
                    <div 
                      className="w-12 h-12 rounded-full"
                      style={{backgroundColor: house?.color || '#7c3aed'}}
                    ></div>
                  </div>
                  
                  {/* House Total Points */}
                  <div className="bg-gray-900 text-white px-4 py-2 rounded-lg inline-block">
                    <span className="text-sm">⚡ House Total: {(scholar?.totalPoints || 0)} points</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Your Points Summary Card - Exact Match */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-white rounded-2xl shadow-lg h-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Your Points Summary</h3>
                </div>
                
                {/* Points Grid */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <div className="text-2xl font-bold text-blue-600">{scholar?.academicPoints || 0}</div>
                    <div className="text-xs text-gray-600">Academic</div>
                  </div>
                  <div className="text-center">
                    <Calendar className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <div className="text-2xl font-bold text-green-600">{scholar?.attendancePoints || 0}</div>
                    <div className="text-xs text-gray-600">Attendance</div>
                  </div>
                  <div className="text-center">
                    <Heart className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <div className="text-2xl font-bold text-purple-600">{scholar?.behaviorPoints || 0}</div>
                    <div className="text-xs text-gray-600">Behavior</div>
                  </div>
                  <div className="text-center">
                    <Award className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                    <div className="text-2xl font-bold text-yellow-600">{scholar?.totalPoints || 0}</div>
                    <div className="text-xs text-gray-600">Total Points</div>
                  </div>
                </div>

                {/* BHSA Legend Progress */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-semibold text-yellow-800">BHSA Legend Progress</span>
                  </div>
                  <div className="text-lg font-bold text-yellow-800 mb-1">
                    {scholar?.totalPoints || 0} / 1000 points
                  </div>
                  <div className="w-full bg-yellow-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-yellow-600 h-2 rounded-full" 
                      style={{width: `${Math.min(((scholar?.totalPoints || 0) / 1000) * 100, 100)}%`}}
                    ></div>
                  </div>
                  <p className="text-xs text-yellow-700">
                    {Math.max(1000 - (scholar?.totalPoints || 0), 0)} more points needed to achieve legendary status!
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* MUSTANG Traits Recognition Card - Exact Match */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="bg-white rounded-2xl shadow-lg h-full">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">MUSTANG Traits Recognition</h3>
                  </div>
                  <Badge variant="secondary" className="bg-gray-900 text-white">
                    {pbisEntries.length} PBIS Points
                  </Badge>
                </div>
                
                {pbisEntries.length > 0 ? (
                  <div className="space-y-3">
                    {pbisEntries.slice(0, 3).map((entry: any, index: number) => (
                      <div key={entry.id || index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-gray-900 text-sm">{entry.reason}</span>
                          <span className="text-green-600 font-bold text-sm">+{entry.points}</span>
                        </div>
                        <p className="text-xs text-gray-600">{entry.mustangTrait} • {entry.teacherName}</p>
                        <p className="text-xs text-gray-500">{new Date(entry.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl text-gray-400">🏆</span>
                    </div>
                    <p className="text-gray-600 font-medium mb-2">No PBIS recognitions yet</p>
                    <p className="text-sm text-gray-500">
                      Keep demonstrating MUSTANG traits to earn recognition!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
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