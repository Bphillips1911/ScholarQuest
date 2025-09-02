import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAdvancedUI } from '@/components/ui/advanced-ui-system';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { apiRequest } from '@/lib/queryClient';

interface MoodCheckin {
  mood: 'energetic' | 'tired' | 'frustrated' | 'confident' | 'bored' | 'focused';
  energyLevel: 'low' | 'medium' | 'high';
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  context?: string;
}

interface LearningActivity {
  id: string;
  title: string;
  description: string;
  subject: string;
  activityType: 'interactive' | 'video' | 'game' | 'reflection' | 'reading' | 'creative';
  duration: number;
  difficulty: 'easy' | 'medium' | 'hard';
  moodMatch: string[];
  energyLevel: 'low' | 'medium' | 'high';
  instructions: string;
  content?: any;
  points: number;
}

interface LearningRecommendation {
  id: string;
  title: string;
  description: string;
  subject: string;
  activityType: 'video' | 'game' | 'reflection' | 'practice' | 'creative';
  duration: number;
  difficulty: 'easy' | 'medium' | 'hard';
  content: {
    instructions?: string;
    videoUrl?: string;
    gameUrl?: string;
    questions?: Array<{
      question: string;
      type: 'text' | 'choice';
      options?: string[];
    }>;
    tips?: string[];
  };
  tags: string[];
}

interface MoodLearningProps {
  studentId: string;
  grade: number;
  className?: string;
}

const moodEmojis = {
  energetic: '⚡',
  tired: '😴',
  frustrated: '😤',
  confident: '😊',
  bored: '😑',
  focused: '🎯'
};

const moodDescriptions = {
  energetic: 'Ready to tackle challenges!',
  tired: 'Need something gentle and restorative',
  frustrated: 'Looking for confidence-building activities',
  confident: 'Ready for new challenges and growth',
  bored: 'Seeking engaging and interactive content',
  focused: 'Perfect for deep learning and practice'
};

const activityTypeIcons = {
  video: '📺',
  game: '🎮',
  reflection: '🤔',
  practice: '📝',
  creative: '🎨'
};

const subjectColors = {
  math: '#3b82f6',
  science: '#10b981',
  english: '#8b5cf6',
  history: '#f59e0b',
  mixed: '#6b7280'
};

export function MoodLearningRecommendations({ studentId, grade, className }: MoodLearningProps) {
  const { showEmojiNotification, announce, isMobile } = useAdvancedUI();
  const queryClient = useQueryClient();
  const [currentMood, setCurrentMood] = useState<MoodCheckin | null>(null);
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<LearningRecommendation | null>(null);
  const [completedActivities, setCompletedActivities] = useState<string[]>([]);
  const [moodBasedActivities, setMoodBasedActivities] = useState<LearningActivity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<LearningActivity | null>(null);

  // Get today's mood check-in
  const { data: todayMoodCheckin } = useQuery({
    queryKey: ['/api/student/mood/today', studentId],
    enabled: !!studentId,
  });

  // Get mood-based recommendations
  const { data: recommendations = [], isLoading: loadingRecommendations } = useQuery({
    queryKey: ['/api/student/mood/recommendations', studentId, currentMood?.mood, currentMood?.energyLevel],
    enabled: !!studentId && !!currentMood,
  });

  // Fetch mood-based activities when user feels bored, tired, or frustrated
  useEffect(() => {
    if (currentMood?.mood && ['bored', 'tired', 'frustrated'].includes(currentMood.mood)) {
      const fetchActivities = async () => {
        try {
          const response = await fetch(`/api/mood-activities?mood=${currentMood.mood}&energyLevel=${currentMood.energyLevel}&maxDuration=15`);
          if (response.ok) {
            const activities = await response.json();
            setMoodBasedActivities(activities);
            if (activities.length > 0) {
              setSelectedActivity(activities[0]); // Auto-select first activity
              showEmojiNotification('mood', 'activity_suggested', 'Found helpful activities for you!');
            }
          }
        } catch (error) {
          console.error('Failed to fetch mood activities:', error);
        }
      };
      fetchActivities();
    }
  }, [currentMood?.mood, currentMood?.energyLevel]);

  // Mood check-in mutation
  const moodCheckinMutation = useMutation({
    mutationFn: async (checkin: MoodCheckin) => 
      apiRequest('POST', '/api/student/mood/checkin', { 
        studentId, 
        ...checkin 
      }),
    onSuccess: (data) => {
      setCurrentMood(data.checkin);
      setShowMoodSelector(false);
      showEmojiNotification('mood', data.checkin.mood, `Mood updated: ${data.checkin.mood}`);
      announce(`Mood check-in complete. Finding activities for your ${data.checkin.mood} mood.`);
      queryClient.invalidateQueries({ queryKey: ['/api/student/mood'] });
    },
  });

  // Activity completion mutation
  const completeActivityMutation = useMutation({
    mutationFn: async (recommendationId: string) =>
      apiRequest('POST', '/api/student/mood/complete-activity', {
        studentId,
        recommendationId,
      }),
    onSuccess: (data) => {
      setCompletedActivities(prev => [...prev, data.recommendationId]);
      showEmojiNotification('achievement', 'activity_completed', 'Great job completing that activity!');
      announce('Activity completed successfully!');
      queryClient.invalidateQueries({ queryKey: ['/api/student/mood'] });
    },
  });

  useEffect(() => {
    if (todayMoodCheckin) {
      setCurrentMood(todayMoodCheckin);
    }
  }, [todayMoodCheckin]);

  const MoodSelector = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="grid grid-cols-2 md:grid-cols-3 gap-4"
    >
      {Object.entries(moodEmojis).map(([mood, emoji]) => (
        <motion.button
          key={mood}
          className="p-6 bg-white rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 text-center group"
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleMoodSelect(mood as keyof typeof moodEmojis)}
          data-testid={`mood-${mood}`}
        >
          <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">
            {emoji}
          </div>
          <div className="font-semibold capitalize text-gray-800">
            {mood}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {moodDescriptions[mood as keyof typeof moodDescriptions]}
          </div>
        </motion.button>
      ))}
    </motion.div>
  );

  const EnergyLevelSelector = ({ onSelect }: { onSelect: (level: 'low' | 'medium' | 'high') => void }) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center">How's your energy level?</h3>
      <div className="grid grid-cols-3 gap-4">
        {['low', 'medium', 'high'].map((level) => (
          <Button
            key={level}
            variant="outline"
            className="h-16 flex flex-col space-y-1"
            onClick={() => onSelect(level as any)}
            data-testid={`energy-${level}`}
          >
            <div className="text-2xl">
              {level === 'low' ? '🔋' : level === 'medium' ? '🔋🔋' : '🔋🔋🔋'}
            </div>
            <span className="capitalize text-sm">{level}</span>
          </Button>
        ))}
      </div>
    </div>
  );

  const [moodStep, setMoodStep] = useState<'mood' | 'energy' | 'time'>('mood');
  const [tempCheckin, setTempCheckin] = useState<Partial<MoodCheckin>>({});

  const handleMoodSelect = (mood: keyof typeof moodEmojis) => {
    setTempCheckin({ mood });
    setMoodStep('energy');
  };

  const handleEnergySelect = (energyLevel: 'low' | 'medium' | 'high') => {
    setTempCheckin(prev => ({ ...prev, energyLevel }));
    setMoodStep('time');
  };

  const handleTimeSelect = (timeOfDay: 'morning' | 'afternoon' | 'evening') => {
    const finalCheckin = {
      ...tempCheckin,
      timeOfDay,
    } as MoodCheckin;
    
    // Load mood-based activities for special moods (bored, tired, frustrated)
    if (['bored', 'tired', 'frustrated'].includes(finalCheckin.mood)) {
      loadMoodBasedActivities(finalCheckin.mood, finalCheckin.energyLevel);
    }
    
    moodCheckinMutation.mutate(finalCheckin);
    setMoodStep('mood');
    setTempCheckin({});
  };

  const loadMoodBasedActivities = async (mood: string, energyLevel: string) => {
    try {
      const response = await fetch(`/api/mood-activities?mood=${mood}&energyLevel=${energyLevel}&maxDuration=30`);
      if (response.ok) {
        const activities = await response.json();
        setMoodBasedActivities(activities);
      }
    } catch (error) {
      console.error('Error loading mood-based activities:', error);
    }
  };

  const MoodActivityCard = ({ activity }: { activity: LearningActivity }) => {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200 p-6 transition-all duration-300 hover:border-purple-300"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">
              {activity.activityType === 'interactive' ? '🎮' : 
               activity.activityType === 'video' ? '📺' :
               activity.activityType === 'game' ? '🎯' :
               activity.activityType === 'reflection' ? '🤔' :
               activity.activityType === 'reading' ? '📖' :
               activity.activityType === 'creative' ? '🎨' : '📝'}
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">
                {activity.title}
              </h3>
              <p className="text-sm text-gray-600">
                {activity.description}
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge className="bg-purple-500 text-white">
              +{activity.points} pts
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge 
            style={{ 
              backgroundColor: subjectColors[activity.subject as keyof typeof subjectColors] || subjectColors.mixed,
              color: 'white'
            }}
          >
            {activity.subject}
          </Badge>
          <Badge variant="outline">
            {activity.duration} min
          </Badge>
          <Badge variant="outline" className={
            activity.difficulty === 'easy' ? 'text-green-600' :
            activity.difficulty === 'medium' ? 'text-yellow-600' : 'text-red-600'
          }>
            {activity.difficulty}
          </Badge>
          <Badge variant="outline">
            {activity.energyLevel} energy
          </Badge>
        </div>

        <div className="bg-white rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-700 font-medium">Instructions:</p>
          <p className="text-sm text-gray-600 mt-1">{activity.instructions}</p>
        </div>

        <Button
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          onClick={() => setSelectedActivity(activity)}
          data-testid={`start-mood-activity-${activity.id}`}
        >
          Start Activity
        </Button>
      </motion.div>
    );
  };

  const RecommendationCard = ({ recommendation }: { recommendation: LearningRecommendation }) => {
    const isCompleted = completedActivities.includes(recommendation.id);
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white rounded-xl border-2 p-6 transition-all duration-300 ${
          isCompleted ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-blue-300'
        }`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">
              {activityTypeIcons[recommendation.activityType]}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">
                {recommendation.title}
              </h3>
              <p className="text-sm text-gray-600">
                {recommendation.description}
              </p>
            </div>
          </div>
          {isCompleted && (
            <Badge className="bg-green-500 text-white">
              ✓ Completed
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge 
            style={{ 
              backgroundColor: subjectColors[recommendation.subject as keyof typeof subjectColors] || subjectColors.mixed,
              color: 'white'
            }}
          >
            {recommendation.subject}
          </Badge>
          <Badge variant="outline">
            {recommendation.duration} min
          </Badge>
          <Badge variant="outline" className={
            recommendation.difficulty === 'easy' ? 'text-green-600' :
            recommendation.difficulty === 'medium' ? 'text-yellow-600' : 'text-red-600'
          }>
            {recommendation.difficulty}
          </Badge>
        </div>

        <div className="flex space-x-3">
          <Button
            className="flex-1"
            onClick={() => setSelectedRecommendation(recommendation)}
            disabled={isCompleted}
            data-testid={`start-activity-${recommendation.id}`}
          >
            {isCompleted ? 'Completed' : 'Start Activity'}
          </Button>
          {!isCompleted && (
            <Button
              variant="outline"
              onClick={() => completeActivityMutation.mutate(recommendation.id)}
              data-testid={`complete-activity-${recommendation.id}`}
            >
              Mark Complete
            </Button>
          )}
        </div>

        {recommendation.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {recommendation.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  const ActivityModal = ({ recommendation }: { recommendation: LearningRecommendation }) => (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setSelectedRecommendation(null);
        }
      }}
    >
      <motion.div
        className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {recommendation.title}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedRecommendation(null)}
              data-testid="close-activity-modal"
            >
              ✕
            </Button>
          </div>

          <div className="space-y-4">
            {recommendation.content.instructions && (
              <div>
                <h3 className="font-semibold mb-2">Instructions</h3>
                <p className="text-gray-600">{recommendation.content.instructions}</p>
              </div>
            )}

            {recommendation.content.questions && (
              <div>
                <h3 className="font-semibold mb-2">Questions</h3>
                <div className="space-y-3">
                  {recommendation.content.questions.map((q, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded">
                      <p className="font-medium mb-2">{q.question}</p>
                      {q.type === 'choice' && q.options && (
                        <div className="space-y-1">
                          {q.options.map((option, optIndex) => (
                            <label key={optIndex} className="flex items-center space-x-2">
                              <input type="radio" name={`question-${index}`} />
                              <span className="text-sm">{option}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      {q.type === 'text' && (
                        <textarea 
                          className="w-full p-2 border rounded text-sm" 
                          rows={3}
                          placeholder="Your answer..."
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recommendation.content.tips && (
              <div>
                <h3 className="font-semibold mb-2">Tips</h3>
                <ul className="space-y-1">
                  {recommendation.content.tips.map((tip, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start space-x-2">
                      <span>💡</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setSelectedRecommendation(null)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                completeActivityMutation.mutate(recommendation.id);
                setSelectedRecommendation(null);
              }}
              data-testid="complete-activity-from-modal"
            >
              Complete Activity
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          🎯 Personalized Learning
        </h2>
        <p className="text-gray-600">
          Get activity recommendations based on how you're feeling today
        </p>
      </div>

      {/* Current Mood Display */}
      {currentMood && !showMoodSelector && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-4xl">
                  {moodEmojis[currentMood.mood]}
                </div>
                <div>
                  <h3 className="font-semibold capitalize">
                    Feeling {currentMood.mood}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Energy: {currentMood.energyLevel} • {currentMood.timeOfDay}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowMoodSelector(true)}
                data-testid="update-mood"
              >
                Update Mood
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mood Check-in */}
      {(!currentMood || showMoodSelector) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {moodStep === 'mood' && 'How are you feeling?'}
              {moodStep === 'energy' && 'What\'s your energy level?'}
              {moodStep === 'time' && 'What time of day is it?'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {moodStep === 'mood' && <MoodSelector />}
              
              {moodStep === 'energy' && (
                <motion.div
                  key="energy"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <EnergyLevelSelector onSelect={handleEnergySelect} />
                </motion.div>
              )}
              
              {moodStep === 'time' && (
                <motion.div
                  key="time"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-semibold text-center">What time of day is it?</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {['morning', 'afternoon', 'evening'].map((time) => (
                      <Button
                        key={time}
                        variant="outline"
                        className="h-16 flex flex-col space-y-1"
                        onClick={() => handleTimeSelect(time as any)}
                        data-testid={`time-${time}`}
                      >
                        <div className="text-2xl">
                          {time === 'morning' ? '🌅' : time === 'afternoon' ? '☀️' : '🌙'}
                        </div>
                        <span className="capitalize text-sm">{time}</span>
                      </Button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {moodCheckinMutation.isPending && (
              <div className="mt-4 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Getting your personalized recommendations...</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mood-Based Activity Redirection */}
      {currentMood && ['bored', 'tired', 'frustrated'].includes(currentMood.mood) && moodBasedActivities.length > 0 && (
        <div className="space-y-6">
          <div className="text-center bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl p-6">
            <h3 className="text-xl font-bold mb-2">
              🎯 Let's Turn This Around!
            </h3>
            <p className="mb-4">
              {currentMood.mood === 'bored' && "We found some exciting activities to spark your interest!"}
              {currentMood.mood === 'tired' && "Here are some gentle activities to help you recharge while learning!"}
              {currentMood.mood === 'frustrated' && "Let's try some calming activities that will help you feel better and learn!"}
            </p>
            <Badge className="bg-white text-purple-600 font-semibold">
              Personalized for your {currentMood.mood} mood
            </Badge>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <AnimatePresence>
              {moodBasedActivities.map((activity) => (
                <MoodActivityCard key={activity.id} activity={activity} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Regular Recommendations */}
      {currentMood && !['bored', 'tired', 'frustrated'].includes(currentMood.mood) && recommendations.length > 0 && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold">
              Perfect Activities for Your {currentMood.mood} Mood
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              These activities are designed to match your current energy and mindset
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <AnimatePresence>
              {recommendations.map((recommendation) => (
                <RecommendationCard
                  key={recommendation.id}
                  recommendation={recommendation}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* No mood check-in yet */}
      {!currentMood && !showMoodSelector && (
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold mb-2">Ready to Learn?</h3>
            <p className="text-gray-600 mb-4">
              Tell us how you're feeling and we'll recommend the perfect learning activities for you!
            </p>
            <Button 
              onClick={() => setShowMoodSelector(true)}
              data-testid="start-mood-checkin"
            >
              Start Mood Check-in
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Mood-Based Activity Modal */}
      <AnimatePresence>
        {selectedActivity && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedActivity(null);
              }
            }}
          >
            <motion.div
              className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                      {selectedActivity.title}
                    </h2>
                    <p className="text-gray-600">{selectedActivity.description}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedActivity(null)}
                    data-testid="close-mood-activity-modal"
                  >
                    ✕
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Activity Details */}
                  <div className="flex flex-wrap gap-3">
                    <Badge className="bg-blue-500 text-white">
                      {selectedActivity.subject}
                    </Badge>
                    <Badge variant="outline">
                      {selectedActivity.duration} minutes
                    </Badge>
                    <Badge variant="outline">
                      {selectedActivity.difficulty}
                    </Badge>
                    <Badge className="bg-purple-500 text-white">
                      +{selectedActivity.points} points
                    </Badge>
                  </div>

                  {/* Instructions */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-800 mb-2">📋 Instructions</h3>
                    <p className="text-blue-700">{selectedActivity.instructions}</p>
                  </div>

                  {/* Activity Content */}
                  {selectedActivity.content && (
                    <div className="space-y-4">
                      {selectedActivity.content.puzzle && (
                        <div className="bg-yellow-50 rounded-lg p-4">
                          <h4 className="font-semibold text-yellow-800 mb-2">🧩 Puzzle</h4>
                          <p className="text-yellow-700 mb-3">{selectedActivity.content.puzzle}</p>
                          {selectedActivity.content.hint && (
                            <div className="bg-yellow-100 rounded p-2">
                              <p className="text-sm text-yellow-600">
                                <strong>Hint:</strong> {selectedActivity.content.hint}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {selectedActivity.content.steps && (
                        <div className="bg-green-50 rounded-lg p-4">
                          <h4 className="font-semibold text-green-800 mb-2">📝 Steps</h4>
                          <ol className="list-decimal list-inside space-y-2">
                            {selectedActivity.content.steps.map((step: string, index: number) => (
                              <li key={index} className="text-green-700">{step}</li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {selectedActivity.content.reflection && (
                        <div className="bg-purple-50 rounded-lg p-4">
                          <h4 className="font-semibold text-purple-800 mb-2">🤔 Reflection</h4>
                          <p className="text-purple-700 mb-3">{selectedActivity.content.reflection}</p>
                          <textarea 
                            className="w-full p-3 border border-purple-200 rounded-lg text-sm" 
                            rows={4}
                            placeholder="Write your reflection here..."
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedActivity(null)}
                    >
                      Close
                    </Button>
                    <Button
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                      onClick={() => {
                        // Award points and close modal
                        showEmojiNotification('achievement', 'activity_completed', `Great job! +${selectedActivity.points} points`);
                        announce(`Activity completed! You earned ${selectedActivity.points} points.`);
                        setSelectedActivity(null);
                      }}
                      data-testid="complete-mood-activity-from-modal"
                    >
                      Complete Activity (+{selectedActivity.points} pts)
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activity Modal */}
      <AnimatePresence>
        {selectedRecommendation && (
          <ActivityModal recommendation={selectedRecommendation} />
        )}
      </AnimatePresence>
    </div>
  );
}