import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Pause, SkipForward, RotateCcw, CheckCircle } from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  animation: 'highlight' | 'point' | 'circle' | 'bounce';
  targetElement?: string;
  duration: number;
}

interface AnimatedTutorialsProps {
  tutorialId: string;
  steps: TutorialStep[];
  onComplete?: () => void;
  autoPlay?: boolean;
}

export function AnimatedTutorials({ tutorialId, steps, onComplete, autoPlay = false }: AnimatedTutorialsProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsCompleted(true);
      onComplete?.();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsCompleted(false);
    setIsPlaying(autoPlay);
  };

  const currentStepData = steps[currentStep];

  const getAnimationVariants = (animation: string) => {
    switch (animation) {
      case 'highlight':
        return {
          initial: { opacity: 0, scale: 0.8 },
          animate: { 
            opacity: [0, 1, 1, 0], 
            scale: [0.8, 1.1, 1, 0.8],
            boxShadow: [
              '0 0 0 0 rgba(59, 130, 246, 0)',
              '0 0 0 10px rgba(59, 130, 246, 0.3)',
              '0 0 0 20px rgba(59, 130, 246, 0.1)',
              '0 0 0 0 rgba(59, 130, 246, 0)'
            ]
          },
          transition: { duration: 2, repeat: Infinity }
        };
      case 'point':
        return {
          initial: { x: -20, y: -20 },
          animate: { 
            x: [0, 10, 0], 
            y: [0, -10, 0],
            rotate: [0, 15, -15, 0]
          },
          transition: { duration: 1.5, repeat: Infinity }
        };
      case 'circle':
        return {
          initial: { scale: 0, opacity: 0 },
          animate: { 
            scale: [0, 1.2, 1, 1.2, 0], 
            opacity: [0, 0.8, 0.6, 0.8, 0],
            rotate: [0, 180, 360]
          },
          transition: { duration: 3, repeat: Infinity }
        };
      case 'bounce':
        return {
          initial: { y: 0 },
          animate: { 
            y: [0, -20, 0, -10, 0],
            scale: [1, 1.1, 1, 1.05, 1]
          },
          transition: { duration: 2, repeat: Infinity }
        };
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0.5 }
        };
    }
  };

  return (
    <div className="relative">
      {/* Tutorial Overlay */}
      <AnimatePresence>
        {!isCompleted && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Tutorial Card */}
            <motion.div
              className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-2xl"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <motion.div
                  className="bg-blue-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Step Counter */}
              <div className="text-sm text-gray-500 mb-2">
                Step {currentStep + 1} of {steps.length}
              </div>

              {/* Step Content */}
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                {currentStepData?.title}
              </h3>
              
              <p className="text-gray-600 mb-6">
                {currentStepData?.description}
              </p>

              {/* Animation Demo */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 flex items-center justify-center min-h-[80px]">
                <motion.div
                  className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold"
                  {...getAnimationVariants(currentStepData?.animation || 'highlight')}
                >
                  ✨
                </motion.div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                >
                  Previous
                </Button>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>

                <Button
                  onClick={handleNext}
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
                  <SkipForward className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion Celebration */}
      <AnimatePresence>
        {isCompleted && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg p-8 max-w-md mx-4 shadow-2xl text-center"
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 50 }}
            >
              <motion.div
                className="text-6xl mb-4"
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 15, -15, 0]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🎉
              </motion.div>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Tutorial Complete!
              </h3>
              
              <p className="text-gray-600 mb-6">
                Great job! You've mastered the {tutorialId} tutorial. You're ready to explore on your own!
              </p>

              <div className="flex items-center justify-center space-x-3">
                <Button
                  variant="outline"
                  onClick={handleReset}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Watch Again
                </Button>
                
                <Button
                  onClick={() => setIsCompleted(false)}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Got It!
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tutorial Trigger (if needed for specific elements) */}
      {currentStepData?.targetElement && (
        <motion.div
          className="absolute pointer-events-none z-40"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
          {...getAnimationVariants(currentStepData.animation)}
        >
          <div className="w-8 h-8 bg-blue-500 rounded-full opacity-80" />
        </motion.div>
      )}
    </div>
  );
}

// Predefined tutorials for different features
export const tutorialLibrary = {
  'house-system': {
    id: 'house-system',
    title: 'House System Basics',
    steps: [
      {
        id: 'intro',
        title: 'Welcome to the House System!',
        description: 'Learn how houses work and how you can earn points for your team.',
        animation: 'highlight' as const,
        duration: 3000
      },
      {
        id: 'earning-points',
        title: 'Earning Points',
        description: 'You can earn points through good behavior, academic achievement, and attendance.',
        animation: 'bounce' as const,
        duration: 4000
      },
      {
        id: 'mustang-traits',
        title: 'MUSTANG Traits',
        description: 'Show these traits to earn points: Make good choices, Use kind words, Show school pride, Tolerant of others, Aim for excellence, Need to be responsible, Give 100% everyday.',
        animation: 'circle' as const,
        duration: 5000
      },
      {
        id: 'competition',
        title: 'House Competition',
        description: 'Your points help your house compete with others. Work together to achieve victory!',
        animation: 'point' as const,
        duration: 3000
      }
    ]
  },
  'dashboard-navigation': {
    id: 'dashboard-navigation',
    title: 'Dashboard Navigation',
    steps: [
      {
        id: 'overview',
        title: 'Your Dashboard',
        description: 'This is your personal dashboard where you can see your progress and achievements.',
        animation: 'highlight' as const,
        duration: 3000
      },
      {
        id: 'points-display',
        title: 'Points Overview',
        description: 'Here you can see your academic, behavior, and attendance points.',
        animation: 'bounce' as const,
        duration: 3000
      },
      {
        id: 'quick-actions',
        title: 'Quick Actions',
        description: 'Use these buttons to quickly access important features like games and learning paths.',
        animation: 'point' as const,
        duration: 4000
      }
    ]
  },
  'learning-assistant': {
    id: 'learning-assistant',
    title: 'Your Learning Assistant',
    steps: [
      {
        id: 'meet-assistant',
        title: 'Meet Your Learning Buddy!',
        description: 'Your learning assistant is here to help you succeed and answer questions.',
        animation: 'bounce' as const,
        duration: 3000
      },
      {
        id: 'getting-help',
        title: 'Getting Help',
        description: 'Click on your learning assistant anytime you need study tips or have questions.',
        animation: 'point' as const,
        duration: 4000
      },
      {
        id: 'tips-and-motivation',
        title: 'Tips and Motivation',
        description: 'Your assistant will provide helpful tips and celebrate your achievements!',
        animation: 'circle' as const,
        duration: 4000
      }
    ]
  }
};