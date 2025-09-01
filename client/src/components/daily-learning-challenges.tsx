import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAdvancedUI } from '@/components/ui/advanced-ui-system';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/lib/queryClient';

interface DailyChallenge {
  id: string;
  date: string;
  subject: 'math' | 'science' | 'english' | 'history' | 'mixed';
  title: string;
  description: string;
  challengeType: 'question' | 'puzzle' | 'creative' | 'reflection';
  content: {
    question?: string;
    options?: string[];
    correctAnswer?: string;
    instructions?: string;
    prompt?: string;
    tips?: string[];
  };
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  timeEstimate: number;
  isCompleted: boolean;
  userResponse?: any;
  isCorrect?: boolean;
  pointsEarned?: number;
}

interface ChallengeStreak {
  currentStreak: number;
  longestStreak: number;
  lastActivity: string;
}

interface DailyLearningChallengesProps {
  studentId: string;
  grade: number;
  className?: string;
}

const subjectColors = {
  math: '#3b82f6',
  science: '#10b981',
  english: '#8b5cf6',
  history: '#f59e0b',
  mixed: '#6b7280'
};

const subjectEmojis = {
  math: '🔢',
  science: '🧪',
  english: '📚',
  history: '🏛️',
  mixed: '🎯'
};

const challengeTypeIcons = {
  question: '❓',
  puzzle: '🧩',
  creative: '🎨',
  reflection: '💭'
};

const difficultyColors = {
  easy: '#10b981',
  medium: '#f59e0b',
  hard: '#ef4444'
};

export function DailyLearningChallenges({ studentId, grade, className }: DailyLearningChallengesProps) {
  const { showEmojiNotification, announce, enableMicroInteractions } = useAdvancedUI();
  const queryClient = useQueryClient();
  const [selectedChallenge, setSelectedChallenge] = useState<DailyChallenge | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [userText, setUserText] = useState<string>('');
  const [showResults, setShowResults] = useState(false);

  // Fetch today's challenges
  const { data: todayChallenges = [], isLoading: loadingChallenges } = useQuery({
    queryKey: ['/api/student/challenges/today', studentId, grade],
    enabled: !!studentId,
  });

  // Fetch weekly challenges for streak tracking
  const { data: weekChallenges = [] } = useQuery({
    queryKey: ['/api/student/challenges/week', studentId],
    enabled: !!studentId,
  });

  // Fetch challenge streak
  const { data: streak } = useQuery({
    queryKey: ['/api/student/challenges/streak', studentId],
    enabled: !!studentId,
  });

  // Challenge completion mutation
  const completeChallengeM = useMutation({
    mutationFn: async ({ challengeId, response }: { challengeId: string; response: any }) =>
      apiRequest('POST', '/api/student/challenges/complete', {
        studentId,
        challengeId,
        response,
      }),
    onSuccess: (data) => {
      setShowResults(true);
      if (data.isCorrect) {
        showEmojiNotification('achievement', 'challenge_completed', `Great job! +${data.pointsEarned} points`);
        announce(`Challenge completed correctly! You earned ${data.pointsEarned} points.`);
      } else {
        showEmojiNotification('general', 'try_again', 'Nice try! Keep learning and improving.');
        announce('Challenge completed. Keep practicing to improve!');
      }
      queryClient.invalidateQueries({ queryKey: ['/api/student/challenges'] });
    },
  });

  const ChallengeCard = ({ challenge }: { challenge: DailyChallenge }) => (
    <motion.div
      className={`bg-white rounded-xl border-2 p-6 cursor-pointer transition-all duration-300 ${
        challenge.isCompleted 
          ? 'border-green-300 bg-green-50' 
          : 'border-gray-200 hover:border-blue-300 hover:shadow-lg'
      }`}
      whileHover={enableMicroInteractions ? { 
        scale: 1.02, 
        y: -5 
      } : {}}
      onClick={() => !challenge.isCompleted && setSelectedChallenge(challenge)}
      data-testid={`challenge-${challenge.id}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
            style={{ backgroundColor: subjectColors[challenge.subject] }}
          >
            {subjectEmojis[challenge.subject]}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{challenge.title}</h3>
            <p className="text-sm text-gray-600">{challenge.description}</p>
          </div>
        </div>
        
        <div className="text-right">
          {challenge.isCompleted ? (
            <Badge className="bg-green-500 text-white mb-2">
              ✓ Complete
            </Badge>
          ) : (
            <Badge 
              style={{ 
                backgroundColor: difficultyColors[challenge.difficulty],
                color: 'white'
              }}
              className="mb-2"
            >
              {challenge.difficulty}
            </Badge>
          )}
          <div className="text-sm text-gray-500">
            {challenge.timeEstimate} min
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Badge variant="outline" className="capitalize">
            {challenge.subject}
          </Badge>
          <Badge variant="outline">
            {challengeTypeIcons[challenge.challengeType]} {challenge.challengeType}
          </Badge>
        </div>
        
        <div className="text-right">
          {challenge.isCompleted && challenge.pointsEarned !== undefined ? (
            <div className="text-green-600 font-semibold">
              +{challenge.pointsEarned} pts
            </div>
          ) : (
            <div className="text-blue-600 font-semibold">
              {challenge.points} pts
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  const ChallengeModal = ({ challenge }: { challenge: DailyChallenge }) => {
    const handleSubmit = () => {
      let response: any = {};
      
      if (challenge.challengeType === 'question' && challenge.content.options) {
        response = { selectedAnswer: userAnswer };
      } else if (challenge.challengeType === 'creative' || challenge.challengeType === 'reflection') {
        response = { textResponse: userText };
      }
      
      completeChallengeM.mutate({ 
        challengeId: challenge.id, 
        response 
      });
    };

    const resetModal = () => {
      setSelectedChallenge(null);
      setUserAnswer('');
      setUserText('');
      setShowResults(false);
    };

    return (
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) resetModal();
        }}
      >
        <motion.div
          className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl"
                  style={{ backgroundColor: subjectColors[challenge.subject] }}
                >
                  {subjectEmojis[challenge.subject]}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {challenge.title}
                  </h2>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline">{challenge.subject}</Badge>
                    <Badge 
                      style={{ 
                        backgroundColor: difficultyColors[challenge.difficulty],
                        color: 'white'
                      }}
                    >
                      {challenge.difficulty}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetModal}
                data-testid="close-challenge-modal"
              >
                ✕
              </Button>
            </div>

            {/* Challenge Content */}
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-800">{challenge.description}</p>
              </div>

              {/* Question Type */}
              {challenge.challengeType === 'question' && challenge.content.question && (
                <div>
                  <h3 className="font-semibold mb-3">{challenge.content.question}</h3>
                  
                  {challenge.content.options && !showResults && (
                    <RadioGroup value={userAnswer} onValueChange={setUserAnswer}>
                      <div className="space-y-2">
                        {challenge.content.options.map((option, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`option-${index}`} />
                            <Label htmlFor={`option-${index}`} className="cursor-pointer">
                              {option}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  )}
                </div>
              )}

              {/* Creative/Reflection Type */}
              {(challenge.challengeType === 'creative' || challenge.challengeType === 'reflection') && (
                <div>
                  {challenge.content.prompt && (
                    <h3 className="font-semibold mb-3">{challenge.content.prompt}</h3>
                  )}
                  {challenge.content.instructions && (
                    <p className="text-gray-600 mb-3">{challenge.content.instructions}</p>
                  )}
                  
                  {!showResults && (
                    <Textarea
                      value={userText}
                      onChange={(e) => setUserText(e.target.value)}
                      placeholder="Share your thoughts..."
                      rows={4}
                      className="w-full"
                    />
                  )}
                </div>
              )}

              {/* Tips */}
              {challenge.content.tips && challenge.content.tips.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">💡 Tips:</h4>
                  <ul className="space-y-1">
                    {challenge.content.tips.map((tip, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start space-x-2">
                        <span>•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Results */}
              {showResults && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg ${
                    completeChallengeM.data?.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">
                      {completeChallengeM.data?.isCorrect ? '🎉' : '👏'}
                    </div>
                    <h3 className="font-semibold text-lg mb-2">
                      {completeChallengeM.data?.isCorrect ? 'Excellent work!' : 'Great effort!'}
                    </h3>
                    <p className="text-gray-600 mb-3">
                      {completeChallengeM.data?.isCorrect 
                        ? `You earned ${completeChallengeM.data.pointsEarned} points!`
                        : 'Keep practicing and you\'ll improve!'
                      }
                    </p>
                    
                    {/* Show correct answer for questions */}
                    {challenge.challengeType === 'question' && challenge.content.correctAnswer && !completeChallengeM.data?.isCorrect && (
                      <div className="text-left bg-white p-3 rounded border">
                        <p className="text-sm font-semibold text-gray-700 mb-1">Correct answer:</p>
                        <p className="text-sm text-gray-600">{challenge.content.correctAnswer}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={resetModal}
              >
                Close
              </Button>
              {!showResults && (
                <Button
                  onClick={handleSubmit}
                  disabled={
                    completeChallengeM.isPending || 
                    (challenge.challengeType === 'question' && !userAnswer) ||
                    ((challenge.challengeType === 'creative' || challenge.challengeType === 'reflection') && !userText.trim())
                  }
                  data-testid="submit-challenge"
                >
                  {completeChallengeM.isPending ? 'Submitting...' : 'Submit Answer'}
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  const StreakDisplay = ({ streak }: { streak: ChallengeStreak }) => (
    <Card className="bg-gradient-to-r from-orange-400 to-pink-500 text-white">
      <CardContent className="pt-6">
        <div className="text-center">
          <motion.div
            className="text-4xl mb-2"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🔥
          </motion.div>
          <h3 className="font-bold text-lg">Challenge Streak</h3>
          <div className="flex justify-center space-x-6 mt-3">
            <div>
              <div className="text-2xl font-bold">{streak.currentStreak}</div>
              <div className="text-sm opacity-90">Current</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{streak.longestStreak}</div>
              <div className="text-sm opacity-90">Best</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const WeeklyProgress = () => {
    const completedThisWeek = weekChallenges.filter(c => c.isCompleted).length;
    const totalThisWeek = weekChallenges.length;
    const progressPercent = totalThisWeek > 0 ? (completedThisWeek / totalThisWeek) * 100 : 0;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📅 This Week's Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Challenges Completed</span>
                <span>{completedThisWeek}/{totalThisWeek}</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
            <div className="text-center text-sm text-gray-600">
              {progressPercent === 100 ? '🏆 Perfect week!' : 'Keep it up!'}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loadingChallenges) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-6"></div>
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          ⚡ Daily Learning Challenges
        </h2>
        <p className="text-gray-600">
          Quick 2-3 minute challenges to boost your learning every day!
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {streak && <StreakDisplay streak={streak} />}
        <WeeklyProgress />
      </div>

      {/* Today's Challenges */}
      {todayChallenges.length > 0 ? (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold">
              Today's Challenges ({new Date().toLocaleDateString()})
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Complete all challenges to maintain your streak!
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <AnimatePresence>
              {todayChallenges.map((challenge, index) => (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ChallengeCard challenge={challenge} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Completion Status */}
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-gray-100 rounded-full px-4 py-2">
              <span className="text-sm font-medium">
                {todayChallenges.filter(c => c.isCompleted).length}/{todayChallenges.length} completed
              </span>
              {todayChallenges.every(c => c.isCompleted) && (
                <span className="text-lg">🎉</span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-lg font-semibold mb-2">No Challenges Today</h3>
            <p className="text-gray-600">
              Check back tomorrow for new exciting challenges!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Challenge Modal */}
      <AnimatePresence>
        {selectedChallenge && (
          <ChallengeModal challenge={selectedChallenge} />
        )}
      </AnimatePresence>
    </div>
  );
}