import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAdvancedUI, EnhancedHouseCard, EnhancedAchievementBadge } from '@/components/ui/advanced-ui-system';
import { AnimatedButton, AnimatedInput, AnimatedCard } from '@/components/ui/micro-interactions';
import { EmojiContext, MoodSelector, FloatingEmojiNotification } from '@/components/ui/contextual-emoji-feedback';
import { AchievementUnlock, LevelUpCelebration, MilestoneCelebration } from '@/components/ui/gamified-achievements';
import { MobileTabs, PullToRefresh, TouchCardGrid } from '@/components/ui/responsive-mobile';
import { AccessibleButton, HighContrastToggle, FontSizeControl, AccessibilityStatus } from '@/components/ui/accessibility-focused';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdvancedUIShowcase() {
  const { 
    showEmojiNotification, 
    showAchievement, 
    showLevelUp, 
    showMilestone,
    isMobile,
    announce
  } = useAdvancedUI();

  // Demo states
  const [inputValue, setInputValue] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [showFloatingEmoji, setShowFloatingEmoji] = useState(false);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [activeTab, setActiveTab] = useState('micro-interactions');

  // Sample data
  const sampleHouses = [
    { id: 'franklin', name: 'Johnson', color: '#3b82f6', points: 2150, rank: 1, totalScholars: 45 },
    { id: 'tesla', name: 'Tesla', color: '#8b5cf6', points: 1980, rank: 2, totalScholars: 42 },
    { id: 'curie', name: 'Drew', color: '#ef4444', points: 1820, rank: 3, totalScholars: 38 },
    { id: 'nobel', name: 'Marshall', color: '#10b981', points: 1650, rank: 4, totalScholars: 40 },
    { id: 'lovelace', name: 'West', color: '#f59e0b', points: 1420, rank: 5, totalScholars: 35 }
  ];

  const sampleAchievements = [
    {
      id: 'first-badge',
      name: 'First Steps',
      description: 'Earned your first achievement badge',
      icon: '🏆',
      color: '#3b82f6',
      earned: true,
      earnedDate: '2 days ago',
      rarity: 'common' as const
    },
    {
      id: 'streak-master',
      name: 'Streak Master',
      description: 'Maintained a 7-day attendance streak',
      icon: '🔥',
      color: '#ef4444',
      earned: true,
      earnedDate: '1 week ago',
      rarity: 'rare' as const
    },
    {
      id: 'legendary-scholar',
      name: 'Legendary Scholar',
      description: 'Reached 1000+ total points',
      icon: '👑',
      color: '#f59e0b',
      earned: false,
      rarity: 'legendary' as const
    }
  ];

  const moods = [
    { emoji: '😊', label: 'Happy', value: 'happy' },
    { emoji: '😔', label: 'Sad', value: 'sad' },
    { emoji: '😴', label: 'Tired', value: 'tired' },
    { emoji: '🤔', label: 'Thinking', value: 'thinking' },
    { emoji: '😤', label: 'Frustrated', value: 'frustrated' },
    { emoji: '🎉', label: 'Excited', value: 'excited' }
  ];

  const touchCards = [
    { id: '1', title: 'Quick Points', subtitle: 'Award PBIS points', icon: '⭐', color: '#3b82f6' },
    { id: '2', title: 'View Progress', subtitle: 'Check house standings', icon: '📊', color: '#10b981' },
    { id: '3', title: 'Messages', subtitle: 'Parent communication', icon: '💬', color: '#8b5cf6' },
    { id: '4', title: 'Settings', subtitle: 'Account preferences', icon: '⚙️', color: '#6b7280' }
  ];

  const tabs = [
    { id: 'micro-interactions', label: 'Micro UI', icon: '✨' },
    { id: 'emoji-feedback', label: 'Emoji', icon: '😊' },
    { id: 'achievements', label: 'Awards', icon: '🏆', count: 3 },
    { id: 'mobile', label: 'Mobile', icon: '📱' },
    { id: 'accessibility', label: 'Access', icon: '♿' }
  ];

  const demoAchievement = {
    id: 'demo',
    name: 'UI Explorer',
    description: 'Discovered the advanced UI showcase!',
    icon: '🎨',
    color: '#8b5cf6',
    points: 50,
    rarity: 'uncommon' as const
  };

  const demoMilestone = {
    points: 1000,
    title: 'Milestone Master',
    message: 'You have explored all the advanced UI features!'
  };

  const handleRefresh = async () => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    announce('Content refreshed successfully');
    showEmojiNotification('general', 'success', 'Page refreshed!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4" id="main-content">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1
            className="text-4xl font-bold text-gray-800 mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            🎨 Advanced UI Features Showcase
          </motion.h1>
          <p className="text-lg text-gray-600">
            Experience the next-generation user interface enhancements
          </p>
          <EmojiContext context="general" type="celebration" size="lg" className="mt-4" />
        </div>

        {/* Accessibility Controls */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>♿</span>
              <span>Accessibility Controls</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <HighContrastToggle />
              <FontSizeControl />
              <AccessibilityStatus />
            </div>
          </CardContent>
        </Card>

        {/* Mobile Tab Navigation */}
        {isMobile && (
          <div className="mb-6">
            <MobileTabs
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              position="top"
            />
          </div>
        )}

        {/* Pull to Refresh Wrapper */}
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="space-y-8">
            {/* Micro-interactions Section */}
            {(!isMobile || activeTab === 'micro-interactions') && (
              <AnimatedCard className="p-6" glowOnHover>
                <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
                  <span>✨</span>
                  <span>Micro-interactions & Animated Elements</span>
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-4">Animated Buttons</h3>
                    <div className="space-y-3">
                      <AnimatedButton
                        variant="primary"
                        icon="🚀"
                        onClick={() => showEmojiNotification('general', 'success', 'Primary button clicked!')}
                      >
                        Primary Action
                      </AnimatedButton>
                      
                      <AnimatedButton
                        variant="house"
                        houseColor="#8b5cf6"
                        icon="🏠"
                        onClick={() => showEmojiNotification('house', 'tesla', 'House button activated!')}
                      >
                        House Action
                      </AnimatedButton>
                      
                      <AnimatedButton
                        variant="success"
                        loading={false}
                        icon="✅"
                        onClick={() => showEmojiNotification('achievement', 'badge_earned', 'Success!')}
                      >
                        Success Action
                      </AnimatedButton>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-4">Animated Input</h3>
                    <AnimatedInput
                      label="Enter your message"
                      placeholder="Type something amazing..."
                      value={inputValue}
                      onChange={setInputValue}
                      icon="✍️"
                      success={inputValue.length > 10}
                      error={inputValue.length > 0 && inputValue.length < 5 ? "Message too short" : undefined}
                    />
                  </div>
                </div>
              </AnimatedCard>
            )}

            {/* Emoji Feedback Section */}
            {(!isMobile || activeTab === 'emoji-feedback') && (
              <AnimatedCard className="p-6" glowOnHover>
                <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
                  <span>😊</span>
                  <span>Contextual Emoji Feedback System</span>
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-4">Mood Selector</h3>
                    <MoodSelector
                      moods={moods}
                      selectedMood={selectedMood}
                      onMoodSelect={(mood) => {
                        setSelectedMood(mood);
                        showEmojiNotification('general', 'success', `Feeling ${mood}!`);
                      }}
                    />
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-4">Emoji Notifications</h3>
                    <div className="space-y-3">
                      <Button
                        onClick={() => {
                          setShowFloatingEmoji(true);
                          setTimeout(() => setShowFloatingEmoji(false), 3000);
                        }}
                      >
                        Show Floating Emoji
                      </Button>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => showEmojiNotification('achievement', 'badge_earned', 'Achievement unlocked!')}
                        >
                          🏆 Achievement
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => showEmojiNotification('behavior', 'excellent', 'Excellent behavior!')}
                        >
                          😊 Behavior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => showEmojiNotification('academic', 'excellent', 'Great work!')}
                        >
                          📚 Academic
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => showEmojiNotification('house', 'johnson', 'Johnson pride!')}
                        >
                          🚀 House
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <FloatingEmojiNotification
                  emoji="🎉"
                  message="This is a floating emoji notification!"
                  show={showFloatingEmoji}
                  onClose={() => setShowFloatingEmoji(false)}
                  position="top-right"
                />
              </AnimatedCard>
            )}

            {/* Achievement System Section */}
            {(!isMobile || activeTab === 'achievements') && (
              <AnimatedCard className="p-6" glowOnHover>
                <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
                  <span>🏆</span>
                  <span>Gamified Achievement System</span>
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-4">Achievement Badges</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {sampleAchievements.map(achievement => (
                        <EnhancedAchievementBadge
                          key={achievement.id}
                          badge={achievement}
                          onClick={() => showEmojiNotification('achievement', 'badge_earned', `Viewing ${achievement.name}`)}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-4">Achievement Celebrations</h3>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={() => setShowAchievementModal(true)}
                        className="bg-gradient-to-r from-purple-600 to-blue-600"
                      >
                        🏆 Show Achievement
                      </Button>
                      <Button
                        onClick={() => setShowLevelUpModal(true)}
                        className="bg-gradient-to-r from-green-600 to-blue-600"
                      >
                        📈 Show Level Up
                      </Button>
                      <Button
                        onClick={() => setShowMilestoneModal(true)}
                        className="bg-gradient-to-r from-yellow-600 to-red-600"
                      >
                        🎯 Show Milestone
                      </Button>
                    </div>
                  </div>
                </div>

                <AchievementUnlock
                  badge={demoAchievement}
                  show={showAchievementModal}
                  onClose={() => setShowAchievementModal(false)}
                  houseColor="#8b5cf6"
                />

                <LevelUpCelebration
                  level={25}
                  show={showLevelUpModal}
                  onClose={() => setShowLevelUpModal(false)}
                  houseColor="#3b82f6"
                />

                <MilestoneCelebration
                  milestone={demoMilestone}
                  show={showMilestoneModal}
                  onClose={() => setShowMilestoneModal(false)}
                  houseColor="#f59e0b"
                />
              </AnimatedCard>
            )}

            {/* Enhanced House Cards */}
            <AnimatedCard className="p-6" glowOnHover>
              <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
                <span>🏠</span>
                <span>Enhanced House System</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {sampleHouses.map(house => (
                  <EnhancedHouseCard
                    key={house.id}
                    house={house}
                    onClick={() => showEmojiNotification('house', house.name.toLowerCase(), `Exploring House ${house.name}!`)}
                  />
                ))}
              </div>
            </AnimatedCard>

            {/* Mobile Features */}
            {(!isMobile || activeTab === 'mobile') && (
              <AnimatedCard className="p-6" glowOnHover>
                <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
                  <span>📱</span>
                  <span>Mobile-Optimized Features</span>
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-4">Touch-Friendly Cards</h3>
                    <TouchCardGrid
                      cards={touchCards}
                      columns={2}
                      gap="md"
                    />
                  </div>
                  
                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">
                      Pull down to refresh this page
                    </p>
                    <div className="text-2xl">⬇️</div>
                  </div>
                </div>
              </AnimatedCard>
            )}
          </div>
        </PullToRefresh>

        {/* Footer */}
        <div className="text-center mt-12 py-8">
          <p className="text-gray-600">
            All advanced UI features are now active in your PBIS House of Champions platform!
          </p>
          <EmojiContext context="general" type="celebration" size="md" className="mt-4" />
        </div>
      </div>
    </div>
  );
}