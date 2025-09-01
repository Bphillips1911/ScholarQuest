import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Trophy, 
  Target, 
  Zap, 
  Star, 
  Gift,
  HelpCircle,
  CheckCircle,
  Award
} from 'lucide-react';

interface HelpQuest {
  id: string;
  title: string;
  description: string;
  category: 'academic' | 'behavior' | 'house' | 'system';
  difficulty: 'easy' | 'medium' | 'hard';
  xpReward: number;
  completed: boolean;
  steps: string[];
  icon: React.ReactNode;
}

interface GamifiedHelpSystemProps {
  onQuestComplete?: (questId: string) => void;
  studentLevel?: number;
  studentXP?: number;
}

export function GamifiedHelpSystem({ 
  onQuestComplete, 
  studentLevel = 1, 
  studentXP = 0 
}: GamifiedHelpSystemProps) {
  const [activeQuest, setActiveQuest] = useState<HelpQuest | null>(null);
  const [completedQuests, setCompletedQuests] = useState<string[]>(() => {
    const saved = localStorage.getItem('completed-help-quests');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [showReward, setShowReward] = useState(false);

  const helpQuests: HelpQuest[] = [
    {
      id: 'house-basics',
      title: 'House System Explorer',
      description: 'Learn the fundamentals of the house system and how to earn points.',
      category: 'house',
      difficulty: 'easy',
      xpReward: 50,
      completed: completedQuests.includes('house-basics'),
      icon: <Trophy className="w-5 h-5" />,
      steps: [
        'Understand what houses are and which one you belong to',
        'Learn about the different ways to earn house points',
        'Discover MUSTANG traits and their importance',
        'See how your points contribute to house competition'
      ]
    },
    {
      id: 'academic-excellence',
      title: 'Academic Achievement Master',
      description: 'Master the art of academic success and point earning.',
      category: 'academic',
      difficulty: 'medium',
      xpReward: 75,
      completed: completedQuests.includes('academic-excellence'),
      icon: <BookOpen className="w-5 h-5" />,
      steps: [
        'Learn effective study techniques',
        'Understand how academic points are awarded',
        'Discover resources for homework help',
        'Master time management skills'
      ]
    },
    {
      id: 'behavior-champion',
      title: 'MUSTANG Behavior Champion',
      description: 'Become an expert in positive behavior and earn behavior points.',
      category: 'behavior',
      difficulty: 'medium',
      xpReward: 75,
      completed: completedQuests.includes('behavior-champion'),
      icon: <Star className="w-5 h-5" />,
      steps: [
        'Master all 7 MUSTANG traits',
        'Learn conflict resolution strategies',
        'Practice kindness and respect',
        'Become a peer helper'
      ]
    },
    {
      id: 'system-navigator',
      title: 'Platform Navigation Expert',
      description: 'Become a pro at using all platform features and tools.',
      category: 'system',
      difficulty: 'hard',
      xpReward: 100,
      completed: completedQuests.includes('system-navigator'),
      icon: <Zap className="w-5 h-5" />,
      steps: [
        'Master dashboard navigation',
        'Learn to use all learning tools',
        'Understand the achievement system',
        'Help others navigate the platform'
      ]
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Beginner';
      case 'medium': return 'Intermediate';
      case 'hard': return 'Advanced';
      default: return 'Unknown';
    }
  };

  const handleStartQuest = (quest: HelpQuest) => {
    if (!quest.completed) {
      setActiveQuest(quest);
      setCurrentStep(0);
    }
  };

  const handleNextStep = () => {
    if (activeQuest && currentStep < activeQuest.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else if (activeQuest) {
      handleCompleteQuest();
    }
  };

  const handleCompleteQuest = () => {
    if (activeQuest) {
      const newCompleted = [...completedQuests, activeQuest.id];
      setCompletedQuests(newCompleted);
      localStorage.setItem('completed-help-quests', JSON.stringify(newCompleted));
      
      setShowReward(true);
      onQuestComplete?.(activeQuest.id);
      
      setTimeout(() => {
        setActiveQuest(null);
        setShowReward(false);
        setCurrentStep(0);
      }, 3000);
    }
  };

  const getNextLevelXP = (level: number) => level * 100;
  const currentLevelProgress = ((studentXP % 100) / 100) * 100;

  return (
    <div className="space-y-6">
      {/* Player Progress */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              {studentLevel}
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Learning Level {studentLevel}</h3>
              <p className="text-sm text-gray-600">Help System Explorer</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">XP Progress</div>
            <div className="font-bold text-blue-600">{studentXP % 100}/100</div>
          </div>
        </div>
        <Progress value={currentLevelProgress} className="h-2" />
      </Card>

      {/* Available Quests */}
      <div className="grid gap-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center">
          <HelpCircle className="w-5 h-5 mr-2" />
          Learning Quests
        </h3>
        
        {helpQuests.map((quest) => (
          <Card key={quest.id} className={`p-4 ${quest.completed ? 'bg-green-50 border-green-200' : 'hover:shadow-md transition-shadow cursor-pointer'}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${quest.completed ? 'bg-green-500' : 'bg-blue-500'} text-white`}>
                  {quest.completed ? <CheckCircle className="w-5 h-5" /> : quest.icon}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-bold text-gray-800">{quest.title}</h4>
                    <Badge variant="secondary" className={`${getDifficultyColor(quest.difficulty)} text-white text-xs`}>
                      {getDifficultyText(quest.difficulty)}
                    </Badge>
                    {quest.completed && (
                      <Badge variant="secondary" className="bg-green-500 text-white text-xs">
                        <Award className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{quest.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Target className="w-3 h-3" />
                      <span>{quest.steps.length} steps</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1 text-sm text-orange-600">
                        <Gift className="w-4 h-4" />
                        <span>{quest.xpReward} XP</span>
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => handleStartQuest(quest)}
                        disabled={quest.completed}
                        className={quest.completed ? 'bg-green-500' : ''}
                      >
                        {quest.completed ? 'Completed' : 'Start Quest'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Active Quest Modal */}
      <AnimatePresence>
        {activeQuest && !showReward && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              {/* Quest Header */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white">
                  {activeQuest.icon}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{activeQuest.title}</h3>
                  <p className="text-sm text-gray-600">Step {currentStep + 1} of {activeQuest.steps.length}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <Progress value={((currentStep + 1) / activeQuest.steps.length) * 100} className="h-2" />
              </div>

              {/* Current Step */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-blue-800 mb-2">Current Step:</h4>
                <p className="text-blue-700">{activeQuest.steps[currentStep]}</p>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setActiveQuest(null)}
                >
                  Cancel Quest
                </Button>
                
                <Button
                  onClick={handleNextStep}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  {currentStep === activeQuest.steps.length - 1 ? 'Complete Quest' : 'Next Step'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reward Animation */}
      <AnimatePresence>
        {showReward && activeQuest && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl text-center"
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 50 }}
            >
              <motion.div
                className="text-6xl mb-4"
                animate={{
                  scale: [1, 1.3, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                🏆
              </motion.div>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Quest Complete!
              </h3>
              
              <p className="text-gray-600 mb-4">
                Awesome work completing "{activeQuest.title}"!
              </p>

              <div className="bg-orange-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-center space-x-2 text-orange-600">
                  <Gift className="w-6 h-6" />
                  <span className="text-xl font-bold">+{activeQuest.xpReward} XP</span>
                </div>
              </div>

              <div className="text-sm text-gray-500">
                Keep exploring to unlock more quests and level up!
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}