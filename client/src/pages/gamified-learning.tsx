import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { isStudentAuthenticated, clearStudentAuth } from '@/lib/studentAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { StickerCollector } from '@/components/sticker-collector';
import { MoodLearningRecommendations } from '@/components/mood-learning-recommendations';
import { DailyLearningChallenges } from '@/components/daily-learning-challenges';
import { useAdvancedUI } from '@/components/ui/advanced-ui-system';

export default function GamifiedLearning() {
  const [, setLocation] = useLocation();
  const { showEmojiNotification, announce, enableMicroInteractions } = useAdvancedUI();
  const [activeTab, setActiveTab] = useState('stickers');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (!isStudentAuthenticated()) {
      clearStudentAuth();
      setLocation("/student-login");
      return;
    }
    setIsAuthenticated(true);
  }, [setLocation]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="text-xl font-bold mb-2">Login Required</h2>
            <p className="text-gray-600">
              Please log in to access your gamified learning features.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Animated Header */}
      <div className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              🎯 Gamified Learning Hub
            </h1>
            <p className="text-gray-600 text-lg">
              Level up your learning with interactive challenges, personalized activities, and collectible rewards!
            </p>
            
            {/* Welcome Message with User Info */}
            <motion.div 
              className="mt-4 inline-flex items-center space-x-2 bg-blue-100 px-4 py-2 rounded-full"
              whileHover={enableMicroInteractions ? { scale: 1.05 } : {}}
            >
              <span className="text-2xl">👋</span>
              <span className="font-medium text-blue-800">
                Welcome back, {user.name}!
              </span>
              <Badge variant="secondary">Grade {user.grade}</Badge>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <TabsList className="grid w-full grid-cols-3 lg:w-fit lg:grid-cols-3 mx-auto">
              <TabsTrigger 
                value="stickers" 
                className="flex items-center space-x-2"
                data-testid="tab-stickers"
              >
                <span className="text-lg">🎁</span>
                <span>Sticker Collection</span>
              </TabsTrigger>
              <TabsTrigger 
                value="mood" 
                className="flex items-center space-x-2"
                data-testid="tab-mood"
              >
                <span className="text-lg">🎯</span>
                <span>Mood Learning</span>
              </TabsTrigger>
              <TabsTrigger 
                value="challenges" 
                className="flex items-center space-x-2"
                data-testid="tab-challenges"
              >
                <span className="text-lg">⚡</span>
                <span>Daily Challenges</span>
              </TabsTrigger>
            </TabsList>
          </motion.div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Sticker Collection Tab */}
            <TabsContent value="stickers" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <span className="text-2xl">🎁</span>
                      <span>Digital Sticker Collection</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-purple-100">
                      Collect unique stickers by completing challenges, earning points, and demonstrating MUSTANG traits!
                      Each sticker represents a special achievement in your learning journey.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Badge className="bg-white/20 text-white border-white/30">
                        House Pride Collection
                      </Badge>
                      <Badge className="bg-white/20 text-white border-white/30">
                        Academic Excellence
                      </Badge>
                      <Badge className="bg-white/20 text-white border-white/30">
                        Character Champions
                      </Badge>
                      <Badge className="bg-white/20 text-white border-white/30">
                        Seasonal Celebrations
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <StickerCollector 
                  studentId={user.id} 
                  className="mt-6"
                />
              </motion.div>
            </TabsContent>

            {/* Mood Learning Tab */}
            <TabsContent value="mood" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <span className="text-2xl">🎯</span>
                      <span>Personalized Learning</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-blue-100">
                      Get activity recommendations based on how you're feeling! Our smart system suggests 
                      the perfect learning activities to match your current mood and energy level.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Badge className="bg-white/20 text-white border-white/30">
                        Mood Check-ins
                      </Badge>
                      <Badge className="bg-white/20 text-white border-white/30">
                        Smart Recommendations
                      </Badge>
                      <Badge className="bg-white/20 text-white border-white/30">
                        Activity Tracking
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <MoodLearningRecommendations 
                  studentId={user.id}
                  grade={user.grade}
                  className="mt-6"
                />
              </motion.div>
            </TabsContent>

            {/* Daily Challenges Tab */}
            <TabsContent value="challenges" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-gradient-to-r from-green-500 to-teal-500 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <span className="text-2xl">⚡</span>
                      <span>Daily Learning Challenges</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-green-100">
                      Take on quick 2-3 minute learning challenges every day! Build streaks, earn points, 
                      and sharpen your skills across all subjects with bite-sized educational content.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Badge className="bg-white/20 text-white border-white/30">
                        Daily Streaks
                      </Badge>
                      <Badge className="bg-white/20 text-white border-white/30">
                        Multi-Subject
                      </Badge>
                      <Badge className="bg-white/20 text-white border-white/30">
                        Quick Challenges
                      </Badge>
                      <Badge className="bg-white/20 text-white border-white/30">
                        Point Rewards
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <DailyLearningChallenges 
                  studentId={user.id}
                  grade={user.grade}
                  className="mt-6"
                />
              </motion.div>
            </TabsContent>
          </motion.div>
        </Tabs>

        {/* Quick Stats Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12"
        >
          <Card className="bg-gray-50">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-center mb-4">
                Your Learning Journey
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-4">
                  <div className="text-2xl text-purple-600 mb-1">🎁</div>
                  <div className="text-sm text-gray-600">Stickers</div>
                  <div className="font-bold">Coming Soon</div>
                </div>
                <div className="p-4">
                  <div className="text-2xl text-blue-600 mb-1">🎯</div>
                  <div className="text-sm text-gray-600">Activities</div>
                  <div className="font-bold">Ready to Start</div>
                </div>
                <div className="p-4">
                  <div className="text-2xl text-green-600 mb-1">⚡</div>
                  <div className="text-sm text-gray-600">Challenges</div>
                  <div className="font-bold">Daily Fresh</div>
                </div>
                <div className="p-4">
                  <div className="text-2xl text-orange-600 mb-1">🔥</div>
                  <div className="text-sm text-gray-600">Streak</div>
                  <div className="font-bold">Build It Up</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}