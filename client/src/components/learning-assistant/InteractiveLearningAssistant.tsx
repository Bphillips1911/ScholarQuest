import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CharacterAnimations, houseCharacters } from './CharacterAnimations';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MessageSquare, HelpCircle, BookOpen, Trophy, Target, Sparkles, Volume2, VolumeX, X, Heart, Star } from 'lucide-react';

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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [showQuickHelp, setShowQuickHelp] = useState(true);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [learningTips] = useState<LearningTip[]>([
    {
      id: 'mood-tracker-tip',
      category: 'academic',
      title: 'Mood Tracker Benefits',
      content: 'The Mood Tracker helps you understand how your emotions affect your learning. Log your mood daily and set goals to improve your mindset and academic performance!',
    },
    {
      id: 'learning-path-tip',
      category: 'academic', 
      title: 'Learning Path Power',
      content: 'Your Learning Path is personalized just for you! Choose from Academic Excellence, Character Development, House Leadership, or STEAM Innovation tracks to boost your growth.',
    },
    {
      id: 'skill-tree-tip',
      category: 'achievement',
      title: 'Skill Tree Mastery',
      content: 'The Skill Tree shows your progress across Academic, Behavioral, Social, and Leadership skills. Earn points to unlock new achievements and work toward legendary status!',
    },
    {
      id: 'house-history-tip',
      category: 'house',
      title: 'House History Magic',
      content: 'Discover the amazing stories of your house founder! Learn how Franklin, Tesla, Curie, Nobel, or Lovelace changed the world through STEAM innovation and perseverance.',
    },
    {
      id: 'mustang-traits-tip',
      category: 'behavior',
      title: 'MUSTANG Power',
      content: 'MUSTANG traits are your guide to success: Make good choices, Use kind words, Show school pride, Tolerant of others, Aim for excellence, Need to be responsible, Give 100% everyday!',
    },
    {
      id: 'dashboard-themes-tip',
      category: 'achievement',
      title: 'Dashboard Themes',
      content: 'Unlock beautiful dashboard themes by earning points! Choose from Traditional, Kelly Green, Gold, Orange, Midnight Scholar, Sunrise Energy, and MUSTANG Champion themes.',
    }
  ]);

  const featureExplanations = {
    'mood-tracker': {
      title: 'Mood Tracker',
      explanation: 'Track your daily emotions and set personal goals to improve your mindset and academic performance. Use emojis to log how you feel and reflect on your day!',
      benefits: ['Better self-awareness', 'Improved emotional intelligence', 'Academic performance insights', 'Daily goal setting']
    },
    'learning-path': {
      title: 'Learning Path',
      explanation: 'Follow personalized learning journeys designed to help you grow academically and personally. Choose from four exciting tracks based on your interests and goals!',
      benefits: ['Personalized education', 'Clear progression milestones', 'Achievement badges', 'Skill development']
    },
    'skill-tree': {
      title: 'Skill Tree',
      explanation: 'Visualize your growth across Academic, Behavioral, Social, and Leadership skills. Earn points to unlock new achievements and progress toward legendary status!',
      benefits: ['Gamified learning', 'Visual progress tracking', 'Skill connections', 'Achievement celebrations']
    },
    'house-history': {
      title: 'House History',
      explanation: 'Explore immersive stories about your house founder and learn how they changed the world through innovation, perseverance, and STEAM excellence!',
      benefits: ['Historical inspiration', 'Audio narration', 'House pride building', 'STEAM connection']
    }
  };

  const welcomeMessages = [
    `Hi there! I'm ${currentCharacter.name}, your ${currentCharacter.house} learning buddy!`,
    `Ready to achieve greatness together? Let's explore what I can help you with!`,
    `Your house spirit is strong! I'm here to help you earn more points and learn new things.`,
    `Need some study tips or want to know more about your house? I'm here to help!`
  ];

  // Text-to-speech functionality
  const speakMessage = (message: string) => {
    if (!speechEnabled || !('speechSynthesis' in window)) return;

    // Stop any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.volume = 0.8;

    // Try to find a friendly voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Female') || 
      voice.name.includes('Samantha') ||
      voice.name.includes('Karen') ||
      voice.lang.includes('en-US')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else if (currentMessage) {
      speakMessage(currentMessage);
    }
  };

  useEffect(() => {
    if (isOpen && !currentMessage) {
      const welcomeMsg = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
      setCurrentMessage(welcomeMsg);
      
      // Auto-speak welcome message after a short delay
      setTimeout(() => {
        if (speechEnabled) {
          speakMessage(welcomeMsg);
        }
      }, 1000);
    }
  }, [isOpen]);

  useEffect(() => {
    // Speak new messages when they change
    if (currentMessage && isOpen && speechEnabled) {
      setTimeout(() => {
        speakMessage(currentMessage);
      }, 500);
    }
  }, [currentMessage, speechEnabled]);

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
    if (featureExplanations[topic as keyof typeof featureExplanations]) {
      const feature = featureExplanations[topic as keyof typeof featureExplanations];
      setCurrentMessage(`📚 ${feature.title}: ${feature.explanation} Benefits include: ${feature.benefits.join(', ')}. Want to explore this feature now?`);
    } else {
      setCurrentMessage(`Great question about ${topic}! Let me help you with that...`);
    }
    onHelpRequest?.(topic);
  };

  const handleFeatureExplanation = (featureName: string) => {
    const feature = featureExplanations[featureName as keyof typeof featureExplanations];
    if (feature) {
      setCurrentMessage(`📚 ${feature.title}: ${feature.explanation} Key benefits: ${feature.benefits.join(', ')}. Ready to try it?`);
    }
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
                <div className="flex items-center space-x-2">
                  {/* Speech Controls */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSpeech}
                    className={`${isSpeaking ? 'text-green-600' : 'text-gray-400'} hover:text-gray-600`}
                    disabled={!currentMessage}
                    title={isSpeaking ? 'Stop speaking' : 'Read message aloud'}
                  >
                    {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                  
                  {/* Close Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      stopSpeaking();
                      setIsOpen(false);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                    title="Close assistant"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Quick Help Toggle */}
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-gray-700">How can I help you?</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowQuickHelp(!showQuickHelp)}
                  className={`text-xs px-2 py-1 ${showQuickHelp ? 'text-blue-600' : 'text-gray-400'}`}
                >
                  {showQuickHelp ? 'Quick Help' : 'Feature Help'}
                </Button>
              </div>

              {/* Quick Help or Feature Explanations */}
              {showQuickHelp ? (
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
              ) : (
                <div className="space-y-2 mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFeatureExplanation('mood-tracker')}
                    className="w-full justify-start text-xs p-2 h-auto border-blue-200 hover:bg-blue-50"
                  >
                    <Heart className="w-3 h-3 mr-2" />
                    <span>What is Mood Tracker?</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFeatureExplanation('learning-path')}
                    className="w-full justify-start text-xs p-2 h-auto border-green-200 hover:bg-green-50"
                  >
                    <Target className="w-3 h-3 mr-2" />
                    <span>How does Learning Path work?</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFeatureExplanation('skill-tree')}
                    className="w-full justify-start text-xs p-2 h-auto border-purple-200 hover:bg-purple-50"
                  >
                    <Star className="w-3 h-3 mr-2" />
                    <span>Explain the Skill Tree system</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFeatureExplanation('house-history')}
                    className="w-full justify-start text-xs p-2 h-auto border-orange-200 hover:bg-orange-50"
                  >
                    <BookOpen className="w-3 h-3 mr-2" />
                    <span>Tell me about House History</span>
                  </Button>
                </div>
              )}

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

              {/* Settings */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-gray-500">Assistant Settings:</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSpeechEnabled(!speechEnabled)}
                    className={`text-xs px-2 py-1 ${speechEnabled ? 'text-green-600' : 'text-gray-400'}`}
                  >
                    {speechEnabled ? 'Voice: ON' : 'Voice: OFF'}
                  </Button>
                </div>
                
                {/* Character Selector */}
                <p className="text-xs text-gray-500 mb-2">Choose your learning buddy:</p>
                <div className="flex space-x-2">
                  {houseCharacters.map((character) => (
                    <button
                      key={character.id}
                      onClick={() => {
                        setCurrentCharacter(character);
                        if (speechEnabled) {
                          speakMessage(`Hi! I'm ${character.name}, your new ${character.house} learning buddy!`);
                        }
                      }}
                      className={`w-8 h-8 rounded-full border-2 ${
                        currentCharacter.id === character.id
                          ? `border-${character.color}-400`
                          : 'border-gray-200'
                      } flex items-center justify-center text-sm hover:scale-110 transition-transform`}
                      title={`${character.name} from ${character.house}`}
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

      {/* Click-away overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-transparent z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              stopSpeaking();
              setIsOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}