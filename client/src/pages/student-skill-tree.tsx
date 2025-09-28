import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { 
  ArrowLeft,
  Star,
  Lock,
  Unlock,
  Award,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { isStudentAuthenticated, clearStudentAuth, maintainStudentSession, isTeacherViewing } from "@/lib/studentAuth";
import logoPath from "@assets/_BHSA Mustang 1_1754780382943.png";
import { motion, AnimatePresence } from "framer-motion";

interface SkillNode {
  id: string;
  title: string;
  description: string;
  category: 'academic' | 'behavioral' | 'social' | 'leadership';
  level: number;
  prerequisite?: string;
  requiredPoints: number;
  currentPoints: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  position: { x: number; y: number };
  icon: string;
  rewards: string[];
}

interface SkillTreePath {
  from: string;
  to: string;
  isActive: boolean;
}

export default function StudentSkillTree() {
  const [, setLocation] = useLocation();
  const [studentData, setStudentData] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
  const [animatingNodes, setAnimatingNodes] = useState<Set<string>>(new Set());
  const [newUnlocks, setNewUnlocks] = useState<string[]>([]);

  // Authentication check - handle both student and teacher viewing modes
  useEffect(() => {
    // Enhanced teacher viewing detection - check URL path pattern for deployed environment
    const teacherView = isTeacherViewing() || window.location.pathname.includes('teacher-student-view');
    const urlStudentId = new URLSearchParams(window.location.search).get('studentId') || 
                        window.location.pathname.split('/').pop(); // Extract ID from URL path
    
    if (teacherView && urlStudentId) {
      // Teacher viewing mode - create student data from URL params
      setStudentData({ id: urlStudentId });
      return;
    }
    
    // For direct student access, be more lenient with authentication
    if (!teacherView) {
      // Try to maintain session first
      maintainStudentSession();
      
      const student = localStorage.getItem("studentData");
      if (student) {
        try {
          setStudentData(JSON.parse(student));
          return;
        } catch (error) {
          console.warn("Error parsing student data:", error);
        }
      }
      
      // Only redirect to login if we have no student data AND not authenticated
      if (!isStudentAuthenticated()) {
        clearStudentAuth();
        setLocation("/student-login");
        return;
      }
    }
  }, [setLocation]);

  // Fetch profile data - only for student view, teacher view uses PBIS data directly
  const { data: profile } = useQuery({
    queryKey: ["/api/student/profile"],
    enabled: !!studentData && !isTeacherViewing(),
  });

  // For teacher view, get student basic info from URL or sessionStorage
  const getStudentBasicInfo = () => {
    if (!isTeacherViewing()) return null;
    
    // Get student ID from URL
    const urlStudentId = new URLSearchParams(window.location.search).get('studentId');
    if (!urlStudentId) return null;
    
    // Create basic student info structure for skill tree calculation
    return {
      id: urlStudentId,
      academicPoints: 0, // Will be calculated from PBIS entries
      behaviorPoints: 0, // Will be calculated from PBIS entries  
      attendancePoints: 0 // Will be calculated from PBIS entries
    };
  };

  // Fetch PBIS entries - use proper array format for better caching
  const { data: pbisEntries = [] } = useQuery({
    queryKey: ["/api/scholars", studentData?.id, "pbis"],
    enabled: !!studentData?.id,
  });

  // Generate skill tree based on student progress
  const generateSkillTree = (): { nodes: SkillNode[], paths: SkillTreePath[] } => {
    // For teacher view, calculate points directly from PBIS entries
    if (isTeacherViewing()) {
      if (!pbisEntries || pbisEntries.length === 0) {
        // Show basic structure even with no data
        const studentInfo = getStudentBasicInfo();
        if (!studentInfo) return { nodes: [], paths: [] };
      }
      
      // Calculate points from PBIS entries
      const academicPoints = pbisEntries?.filter((entry: any) => entry.category === 'academic').reduce((sum: number, entry: any) => sum + (entry.points || 0), 0) || 0;
      const behaviorPoints = pbisEntries?.filter((entry: any) => entry.category === 'behavior').reduce((sum: number, entry: any) => sum + (entry.points || 0), 0) || 0;
      const attendancePoints = pbisEntries?.filter((entry: any) => entry.category === 'attendance').reduce((sum: number, entry: any) => sum + (entry.points || 0), 0) || 0;
      
      // Use these calculated points for skill tree generation
      const totalPoints = academicPoints + behaviorPoints + attendancePoints;
      
      return generateTreeFromPoints(academicPoints, behaviorPoints, attendancePoints, totalPoints);
    }
    
    // Regular student view - use profile data
    if (!profile) return { nodes: [], paths: [] };
    
    // Use actual PBIS points from the profile (no bonus points)
    const academicPoints = Math.max(0, (profile as any)?.academicPoints || 0);
    const behaviorPoints = Math.max(0, (profile as any)?.behaviorPoints || 0);
    const attendancePoints = Math.max(0, (profile as any)?.attendancePoints || 0);
    
    // Calculate total points across all categories for overall progress  
    const totalPoints = academicPoints + behaviorPoints + attendancePoints;
    
    return generateTreeFromPoints(academicPoints, behaviorPoints, attendancePoints, totalPoints);
  };

  // Helper function to generate skill tree from point values
  const generateTreeFromPoints = (academicPoints: number, behaviorPoints: number, attendancePoints: number, totalPoints: number) => {
    
    // For PBIS entries calculation, use actual entries data
    const totalPBISPoints = Array.isArray(pbisEntries) ? pbisEntries.reduce((sum: number, entry: any) => sum + entry.points, 0) : 0;

    const nodes: SkillNode[] = [
      // Foundation (Center)
      {
        id: 'foundation-student',
        title: 'BHSA Student',
        description: 'Welcome to Bush Hills STEAM Academy! Your journey begins here.',
        category: 'academic',
        level: 1,
        requiredPoints: 0,
        currentPoints: totalPoints,
        isUnlocked: true,
        isCompleted: true,
        position: { x: 600, y: 500 },
        icon: '🎓',
        rewards: ['Access to all basic features', 'House assignment eligibility']
      },

      // Academic Branch (Left Side)
      {
        id: 'academic-explorer',
        title: 'Academic Explorer',
        description: 'Show dedication to learning and academic growth',
        category: 'academic',
        level: 2,
        prerequisite: 'foundation-student',
        requiredPoints: 50,
        currentPoints: academicPoints,
        isUnlocked: academicPoints >= 50,
        isCompleted: academicPoints >= 50,
        position: { x: 300, y: 400 },
        icon: '📚',
        rewards: ['Academic achievement badge', '+5 bonus academic points']
      },
      {
        id: 'scholar-specialist',
        title: 'Scholar Specialist',
        description: 'Master advanced academic concepts and study techniques',
        category: 'academic',
        level: 3,
        prerequisite: 'academic-explorer',
        requiredPoints: 150,
        currentPoints: academicPoints,
        isUnlocked: academicPoints >= 150,
        isCompleted: academicPoints >= 150,
        position: { x: 150, y: 300 },
        icon: '🔬',
        rewards: ['Scholar recognition', 'Access to advanced projects', 'Tutor opportunities']
      },
      {
        id: 'academic-champion',
        title: 'Academic Champion',
        description: 'Achieve academic excellence and inspire others',
        category: 'academic',
        level: 4,
        prerequisite: 'scholar-specialist',
        requiredPoints: 250,
        currentPoints: academicPoints,
        isUnlocked: academicPoints >= 250,
        isCompleted: academicPoints >= 250,
        position: { x: 50, y: 200 },
        icon: '👑',
        rewards: ['Academic Champion title', 'Leadership opportunities', 'Special recognition']
      },

      // Behavioral Branch (Right Side)
      {
        id: 'mustang-student',
        title: 'MUSTANG Student',
        description: 'Embody the MUSTANG traits in daily life',
        category: 'behavioral',
        level: 2,
        prerequisite: 'foundation-student',
        requiredPoints: 50,
        currentPoints: behaviorPoints,
        isUnlocked: behaviorPoints >= 50,
        isCompleted: behaviorPoints >= 50,
        position: { x: 900, y: 400 },
        icon: '🐎',
        rewards: ['MUSTANG recognition badge', 'Character spotlight']
      },
      {
        id: 'character-leader',
        title: 'Character Leader',
        description: 'Lead by example and mentor others in positive behavior',
        category: 'behavioral',
        level: 3,
        prerequisite: 'mustang-student',
        requiredPoints: 100,
        currentPoints: behaviorPoints,
        isUnlocked: behaviorPoints >= 100,
        isCompleted: behaviorPoints >= 100,
        position: { x: 1050, y: 300 },
        icon: '⭐',
        rewards: ['Character Leader badge', 'Peer mentoring role', 'House leadership consideration']
      },
      {
        id: 'exemplary-mustang',
        title: 'Exemplary MUSTANG',
        description: 'Demonstrate exceptional character and leadership',
        category: 'behavioral',
        level: 4,
        prerequisite: 'character-leader',
        requiredPoints: 200,
        currentPoints: behaviorPoints,
        isUnlocked: behaviorPoints >= 200,
        isCompleted: behaviorPoints >= 200,
        position: { x: 1150, y: 200 },
        icon: '🌟',
        rewards: ['Exemplary MUSTANG title', 'School ambassador role', 'Special privileges']
      },

      // Social Branch (Center-Left)
      {
        id: 'team-player',
        title: 'Team Player',
        description: 'Collaborate effectively and support your house community',
        category: 'social',
        level: 2,
        prerequisite: 'foundation-student',
        requiredPoints: 75,
        currentPoints: attendancePoints,
        isUnlocked: attendancePoints >= 75,
        isCompleted: attendancePoints >= 75,
        position: { x: 450, y: 350 },
        icon: '🤝',
        rewards: ['Team Player badge', 'Group project leader eligibility']
      },
      {
        id: 'house-champion',
        title: 'House Champion',
        description: 'Represent your house with pride and dedication',
        category: 'social',
        level: 3,
        prerequisite: 'team-player',
        requiredPoints: 150,
        currentPoints: attendancePoints,
        isUnlocked: attendancePoints >= 150,
        isCompleted: attendancePoints >= 150,
        position: { x: 350, y: 250 },
        icon: '🏆',
        rewards: ['House Champion title', 'House event planning role', 'Special house privileges']
      },

      // Leadership Branch (Center-Right)
      {
        id: 'emerging-leader',
        title: 'Emerging Leader',
        description: 'Show leadership potential and initiative',
        category: 'leadership',
        level: 2,
        prerequisite: 'foundation-student',
        requiredPoints: 100,
        currentPoints: Math.floor((academicPoints + behaviorPoints) / 2),
        isUnlocked: (academicPoints + behaviorPoints) >= 200,
        isCompleted: (academicPoints + behaviorPoints) >= 200,
        position: { x: 750, y: 350 },
        icon: '🌱',
        rewards: ['Leadership development opportunities', 'Student council eligibility']
      },
      {
        id: 'student-leader',
        title: 'Student Leader',
        description: 'Take on leadership roles and inspire positive change',
        category: 'leadership',
        level: 3,
        prerequisite: 'emerging-leader',
        requiredPoints: 200,
        currentPoints: Math.floor((academicPoints + behaviorPoints) / 2),
        isUnlocked: (academicPoints + behaviorPoints) >= 400,
        isCompleted: (academicPoints + behaviorPoints) >= 400,
        position: { x: 850, y: 250 },
        icon: '🚀',
        rewards: ['Student Leader badge', 'Event organization opportunities', 'School improvement input']
      },

      // Ultimate Goal (Top Center) - Requires 1000 total points to become BHSA Legend
      {
        id: 'bhsa-legend',
        title: 'BHSA Legend',
        description: 'Achieve legendary status with 1000+ total points across all areas',
        category: 'leadership',
        level: 5,
        prerequisite: 'academic-champion',
        requiredPoints: 1000,
        currentPoints: totalPoints,
        isUnlocked: (academicPoints >= 200 && behaviorPoints >= 200 && attendancePoints >= 50 && totalPoints >= 800),
        isCompleted: totalPoints >= 1000,
        position: { x: 600, y: 100 },
        icon: '👑',
        rewards: ['BHSA Legend status', 'Permanent recognition', 'Mentorship of future students', 'Special graduation honors', 'Hall of Fame induction']
      }
    ];

    // Generate paths between connected nodes
    const paths: SkillTreePath[] = [
      { from: 'foundation-student', to: 'academic-explorer', isActive: nodes.find(n => n.id === 'academic-explorer')?.isUnlocked || false },
      { from: 'foundation-student', to: 'mustang-student', isActive: nodes.find(n => n.id === 'mustang-student')?.isUnlocked || false },
      { from: 'foundation-student', to: 'team-player', isActive: nodes.find(n => n.id === 'team-player')?.isUnlocked || false },
      { from: 'foundation-student', to: 'emerging-leader', isActive: nodes.find(n => n.id === 'emerging-leader')?.isUnlocked || false },
      { from: 'academic-explorer', to: 'scholar-specialist', isActive: nodes.find(n => n.id === 'scholar-specialist')?.isUnlocked || false },
      { from: 'scholar-specialist', to: 'academic-champion', isActive: nodes.find(n => n.id === 'academic-champion')?.isUnlocked || false },
      { from: 'mustang-student', to: 'character-leader', isActive: nodes.find(n => n.id === 'character-leader')?.isUnlocked || false },
      { from: 'character-leader', to: 'exemplary-mustang', isActive: nodes.find(n => n.id === 'exemplary-mustang')?.isUnlocked || false },
      { from: 'team-player', to: 'house-champion', isActive: nodes.find(n => n.id === 'house-champion')?.isUnlocked || false },
      { from: 'emerging-leader', to: 'student-leader', isActive: nodes.find(n => n.id === 'student-leader')?.isUnlocked || false },
      { from: 'academic-champion', to: 'bhsa-legend', isActive: nodes.find(n => n.id === 'bhsa-legend')?.isUnlocked || false },
      { from: 'exemplary-mustang', to: 'bhsa-legend', isActive: nodes.find(n => n.id === 'bhsa-legend')?.isUnlocked || false },
    ];

    return { nodes, paths };
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'academic': return '#3B82F6';
      case 'behavioral': return '#10B981';
      case 'social': return '#F59E0B';
      case 'leadership': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const getNodeIcon = (node: SkillNode) => {
    if (!node.isUnlocked) return <Lock className="h-6 w-6 text-gray-400" />;
    if (node.isCompleted) return <span className="text-2xl">{node.icon}</span>;
    return <Unlock className="h-6 w-6 text-blue-500" />;
  };

  if (!studentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { nodes, paths } = generateSkillTree();

  // Calculate current totals for progress summary (works for both views)
  const getProgressTotals = () => {
    if (isTeacherViewing()) {
      // Calculate from PBIS entries directly
      const academicTotal = pbisEntries?.filter((entry: any) => entry.category === 'academic').reduce((sum: number, entry: any) => sum + (entry.points || 0), 0) || 0;
      const behaviorTotal = pbisEntries?.filter((entry: any) => entry.category === 'behavior').reduce((sum: number, entry: any) => sum + (entry.points || 0), 0) || 0;
      const attendanceTotal = pbisEntries?.filter((entry: any) => entry.category === 'attendance').reduce((sum: number, entry: any) => sum + (entry.points || 0), 0) || 0;
      return academicTotal + behaviorTotal + attendanceTotal;
    } else {
      // Use profile data for student view
      return ((profile as any)?.academicPoints || 0) + ((profile as any)?.behaviorPoints || 0) + ((profile as any)?.attendancePoints || 0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => {
                  // Enhanced navigation logic for deployed environment
                  const teacherView = isTeacherViewing() || window.location.pathname.includes('teacher-student-view');
                  if (teacherView) {
                    // Check if we have a return path from teacher viewing
                    const returnTo = sessionStorage.getItem('teacherReturnPath') || '/teacher-dashboard';
                    window.location.href = returnTo;
                  } else {
                    setLocation("/student-dashboard");
                  }
                }}
                className="flex items-center space-x-2 text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Return to Student Dashboard</span>
              </Button>
              <img 
                src={logoPath} 
                alt="BHSA Mustangs Logo" 
                className="w-12 h-12 object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-white">Skill Tree</h1>
                <p className="text-gray-300 text-sm">Your Journey to Excellence</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Instructions */}
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-white text-center z-10">
        <p className="text-sm">🖱️ Scroll or drag to explore the skill tree • Click nodes for details</p>
      </div>

      {/* Skill Tree Visualization */}
      <div className="relative w-full h-screen overflow-auto bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="min-w-[1400px] min-h-[700px] relative">
          <svg className="absolute inset-0 w-full h-full min-w-[1400px] min-h-[700px]">
            {/* Connection Paths */}
            {paths.map((path, index) => {
              const fromNode = nodes.find(n => n.id === path.from);
              const toNode = nodes.find(n => n.id === path.to);
              if (!fromNode || !toNode) return null;

              return (
                <motion.line
                  key={`${path.from}-${path.to}`}
                  x1={fromNode.position.x}
                  y1={fromNode.position.y}
                  x2={toNode.position.x}
                  y2={toNode.position.y}
                  stroke={path.isActive ? "#60A5FA" : "#374151"}
                  strokeWidth={path.isActive ? "3" : "2"}
                  strokeDasharray={path.isActive ? "0" : "10,5"}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                />
              );
            })}

            {/* Animated particles along active paths */}
            {paths.filter(p => p.isActive).map((path, index) => {
              const fromNode = nodes.find(n => n.id === path.from);
              const toNode = nodes.find(n => n.id === path.to);
              if (!fromNode || !toNode) return null;

              return (
                <motion.circle
                  key={`particle-${path.from}-${path.to}`}
                  r="3"
                  fill="#FCD34D"
                  initial={{ cx: fromNode.position.x, cy: fromNode.position.y }}
                  animate={{ 
                    cx: toNode.position.x,
                    cy: toNode.position.y
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: index * 0.5,
                    ease: "linear"
                  }}
                />
              );
            })}
          </svg>

          {/* Skill Nodes */}
          {nodes.map((node, index) => (
            <motion.div
              key={node.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{
                left: node.position.x,
                top: node.position.y,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.1 }}
              onClick={() => setSelectedNode(node)}
            >
              <div className="relative">
                {/* Node Background */}
                <motion.div
                  className={`w-20 h-20 rounded-full border-4 flex items-center justify-center ${
                    node.isCompleted 
                      ? `bg-gradient-to-br from-yellow-400 to-yellow-600 border-yellow-400 shadow-lg shadow-yellow-400/50` 
                      : node.isUnlocked 
                      ? `bg-gradient-to-br from-blue-500 to-blue-700 border-blue-400 shadow-lg shadow-blue-400/50` 
                      : 'bg-gray-700 border-gray-600'
                  }`}
                >
                  {getNodeIcon(node)}
                </motion.div>

                {/* Progress Ring */}
                {node.isUnlocked && !node.isCompleted && (
                  <svg className="absolute -inset-2 w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="44"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="4"
                      fill="none"
                    />
                    <motion.circle
                      cx="48"
                      cy="48"
                      r="44"
                      stroke={getCategoryColor(node.category)}
                      strokeWidth="4"
                      fill="none"
                      strokeLinecap="round"
                      pathLength="0"
                      animate={{ pathLength: Math.min(node.currentPoints / node.requiredPoints, 1) }}
                      transition={{ duration: 1 }}
                    />
                  </svg>
                )}

                {/* Level Badge */}
                <div className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                  {node.level}
                </div>

                {/* Node Title */}
                <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 text-center">
                  <div className="text-white text-sm font-semibold whitespace-nowrap">
                    {node.title}
                  </div>
                  {node.isUnlocked && !node.isCompleted && (
                    <div className="text-gray-300 text-xs">
                      {node.currentPoints}/{node.requiredPoints}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Node Detail Modal */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedNode(null)}
          >
            <motion.div
              className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{selectedNode.icon}</div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedNode.title}</h3>
                    <Badge 
                      style={{ backgroundColor: getCategoryColor(selectedNode.category) }}
                      className="text-white"
                    >
                      Level {selectedNode.level}
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" onClick={() => setSelectedNode(null)}>
                  ×
                </Button>
              </div>

              <p className="text-gray-600">{selectedNode.description}</p>

              {/* Progress Section */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{selectedNode.currentPoints}/{selectedNode.requiredPoints} points</span>
                </div>
                <Progress 
                  value={(selectedNode.currentPoints / selectedNode.requiredPoints) * 100} 
                  className="h-3"
                />
                {selectedNode.isCompleted ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-semibold">Completed!</span>
                  </div>
                ) : selectedNode.isUnlocked ? (
                  <div className="text-sm text-blue-600">
                    {selectedNode.requiredPoints - selectedNode.currentPoints} points needed to complete
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    Unlock requirements not met
                  </div>
                )}
              </div>

              {/* Rewards */}
              <div>
                <h4 className="font-semibold mb-2">Rewards</h4>
                <ul className="space-y-1">
                  {selectedNode.rewards.map((reward, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Award className="h-3 w-3 text-yellow-500" />
                      <span>{reward}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="fixed bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white z-10">
        <h4 className="font-semibold mb-2">Legend</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-700 rounded-full"></div>
            <span>Locked</span>
          </div>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="fixed bottom-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white z-10">
        <h4 className="font-semibold mb-2">Your Progress</h4>
        <div className="space-y-2 text-sm">
          <div>Completed Skills: {nodes.filter(n => n.isCompleted).length}/{nodes.length}</div>
          <div>Current Level: {Math.max(...nodes.filter(n => n.isCompleted).map(n => n.level), 1)}</div>
          <div>Total Points: {getProgressTotals()}</div>
        </div>
      </div>
    </div>
  );
}