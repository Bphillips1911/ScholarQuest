import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CharacterAnimations, houseCharacters } from './CharacterAnimations';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MessageSquare, HelpCircle, BookOpen, Trophy, Target, Sparkles } from 'lucide-react';

interface LearningTip {
  id: string;
  category: 'academic' | 'behavior' | 'house' | 'achievement';
  title: string;
  content: string;
  houseSpecific?: string;
}

interface InteractiveLearningAssistantProps {
  studentHouse?: string;
  studentPoints?: {
    academic: number;
    behavior: number;
    attendance: number;
  };
  onHelpRequest?: (topic: string) => void;
}

export function InteractiveLearningAssistant({ 
  studentHouse = 'franklin', 
  studentPoints = { academic: 0, behavior: 0, attendance: 0 },
  onHelpRequest 
}: InteractiveLearningAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentCharacter, setCurrentCharacter] = useState(
    houseCharacters.find(c => c.house.toLowerCase() === studentHouse.toLowerCase()) || houseCharacters[0]
  );
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [learningTips] = useState<LearningTip[]>([
    {
      id: '1',
      category: 'academic',
      title: 'Study Smart Tips',
      content: 'Break your study sessions into 25-minute chunks with 5-minute breaks. This helps your brain focus better!',
    },
    {
      id: '2',
      category: 'behavior',
      title: 'MUSTANG Traits',
      content: 'Remember: Make good choices, Use kind words, Show school pride, Tolerant of others, Aim for excellence, Need to be responsible, Give 100% everyday!',
    },
    {
      id: '3',
      category: 'house',
      title: 'House Points Strategy',
      content: 'Earn points by participating in class, helping classmates, and showing excellent behavior. Every point counts toward your house victory!',
      houseSpecific: 'franklin'
    },
    {
      id: '4',
      category: 'achievement',
      title: 'Goal Setting',
      content: 'Set SMART goals: Specific, Measurable, Achievable, Relevant, and Time-bound. Track your progress daily!',
    },
    {
      id: '5',
      category: 'academic',
      title: 'Note-Taking Magic',
      content: 'Use the Cornell Note-taking system: divide your page into notes, cues, and summary sections for better organization!',
    },
    {
      id: '6',
      category: 'behavior',
      title: 'Conflict Resolution',
      content: 'When facing conflicts, use the STOP method: Stop and think, Take a breath, Observe the situation, Proceed with kindness.',
    }
  ]);

  const welcomeMessages = [
    `Hi there! I'm ${currentCharacter.name}, your ${currentCharacter.house} learning buddy!`,
    `Ready to achieve greatness together? Let's explore what I can help you with!`,
    `Your house spirit is strong! I'm here to help you earn more points and learn new things.`,
    `Need some study tips or want to know more about your house? I'm here to help!`
  ];

  useEffect(() => {
    if (isOpen && !currentMessage) {
      setCurrentMessage(welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)]);
    }
  }, [isOpen]);

  const handleCharacterClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setCurrentMessage(welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)]);
    }
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    const categoryTips = learningTips.filter(tip => 
      tip.category === category && 
      (!tip.houseSpecific || tip.houseSpecific === studentHouse.toLowerCase())
    );
    
    if (categoryTips.length > 0) {
      const randomTip = categoryTips[Math.floor(Math.random() * categoryTips.length)];
      setCurrentMessage(`💡 ${randomTip.title}: ${randomTip.content}`);
    }
  };

  const handleHelpRequest = (topic: string) => {
    setCurrentMessage(`Great question about ${topic}! Let me help you with that...`);
    onHelpRequest?.(topic);
  };

  const getMotivationalMessage = () => {
    const totalPoints = studentPoints.academic + studentPoints.behavior + studentPoints.attendance;
    
    if (totalPoints >= 100) {
      return `Wow! You have ${totalPoints} total points! You're a true ${currentCharacter.house} champion! 🏆`;
    } else if (totalPoints >= 50) {
      return `Great job! ${totalPoints} points shows real dedication to ${currentCharacter.house}! Keep it up! ⭐`;
    } else {
      return `You're off to a good start with ${totalPoints} points! Every point brings ${currentCharacter.house} closer to victory! 💪`;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Character */}
      <CharacterAnimations
        character={currentCharacter}
        isActive={isOpen}
        message={currentMessage}
        onInteraction={handleCharacterClick}
      />

      {/* Learning Assistant Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute bottom-full right-0 mb-4 w-80"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <Card className={`p-4 shadow-xl border-2 border-${currentCharacter.color}-200 bg-white`}>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="text-2xl">{currentCharacter.avatar}</div>
                  <div>
                    <h3 className={`font-bold text-${currentCharacter.color}-600`}>
                      {currentCharacter.name}
                    </h3>
                    <p className="text-xs text-gray-500">Learning Assistant</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCategorySelect('academic')}
                  className={`flex items-center space-x-1 border-${currentCharacter.color}-200 hover:bg-${currentCharacter.color}-50`}
                >
                  <BookOpen className="w-3 h-3" />
                  <span className="text-xs">Study Tips</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCategorySelect('behavior')}
                  className={`flex items-center space-x-1 border-${currentCharacter.color}-200 hover:bg-${currentCharacter.color}-50`}
                >
                  <Target className="w-3 h-3" />
                  <span className="text-xs">MUSTANG Tips</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCategorySelect('house')}
                  className={`flex items-center space-x-1 border-${currentCharacter.color}-200 hover:bg-${currentCharacter.color}-50`}
                >
                  <Trophy className="w-3 h-3" />
                  <span className="text-xs">House Points</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCategorySelect('achievement')}
                  className={`flex items-center space-x-1 border-${currentCharacter.color}-200 hover:bg-${currentCharacter.color}-50`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span className="text-xs">Goals</span>
                </Button>
              </div>

              {/* Motivational Section */}
              <div className={`bg-${currentCharacter.color}-50 rounded-lg p-3 mb-4`}>
                <h4 className="text-sm font-semibold text-gray-700 mb-1">Your Progress</h4>
                <p className="text-xs text-gray-600">
                  {getMotivationalMessage()}
                </p>
              </div>

              {/* Quick Help */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700">Quick Help</h4>
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleHelpRequest('house system')}
                    className="w-full justify-start text-xs p-2 h-auto"
                  >
                    <HelpCircle className="w-3 h-3 mr-2" />
                    How does the house system work?
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleHelpRequest('earning points')}
                    className="w-full justify-start text-xs p-2 h-auto"
                  >
                    <HelpCircle className="w-3 h-3 mr-2" />
                    How can I earn more points?
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleHelpRequest('MUSTANG traits')}
                    className="w-full justify-start text-xs p-2 h-auto"
                  >
                    <HelpCircle className="w-3 h-3 mr-2" />
                    What are MUSTANG traits?
                  </Button>
                </div>
              </div>

              {/* Character Selector */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Choose your learning buddy:</p>
                <div className="flex space-x-2">
                  {houseCharacters.map((character) => (
                    <button
                      key={character.id}
                      onClick={() => setCurrentCharacter(character)}
                      className={`w-8 h-8 rounded-full border-2 ${
                        currentCharacter.id === character.id
                          ? `border-${character.color}-400`
                          : 'border-gray-200'
                      } flex items-center justify-center text-sm hover:scale-110 transition-transform`}
                    >
                      {character.avatar}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}