import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Target, CheckCircle, Plus, BarChart3, Calendar, Smile } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface MoodEntry {
  id: string;
  mood: string;
  moodEmoji: string;
  energyLevel: number;
  focusLevel: number;
  notes?: string;
  date: string;
  createdAt: string;
}

interface ProgressGoal {
  id: string;
  category: string;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
}

interface DailyReflection {
  id: string;
  date: string;
  proudMoment?: string;
  challengeFaced?: string;
  tomorrowGoal?: string;
  gratitude?: string;
  helpNeeded?: string;
  overallRating: number;
  createdAt: string;
}

const moodOptions = [
  { value: "amazing", emoji: "😍", label: "Amazing", color: "bg-green-500" },
  { value: "happy", emoji: "😊", label: "Happy", color: "bg-blue-500" },
  { value: "okay", emoji: "😐", label: "Okay", color: "bg-yellow-500" },
  { value: "stressed", emoji: "😰", label: "Stressed", color: "bg-orange-500" },
  { value: "sad", emoji: "😢", label: "Sad", color: "bg-red-500" },
];

const categoryOptions = [
  { value: "academic", label: "Academic", icon: "📚" },
  { value: "behavioral", label: "Behavioral", icon: "🎯" },
  { value: "personal", label: "Personal", icon: "💪" },
  { value: "social", label: "Social", icon: "👥" },
];

export default function StudentMoodTracker() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMood, setSelectedMood] = useState("");
  const [energyLevel, setEnergyLevel] = useState(3);
  const [focusLevel, setFocusLevel] = useState(3);
  const [moodNotes, setMoodNotes] = useState("");
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showReflectionForm, setShowReflectionForm] = useState(false);

  // New goal form state
  const [newGoal, setNewGoal] = useState({
    category: "",
    title: "",
    description: "",
    targetValue: 1,
    endDate: "",
  });

  // Daily reflection form state
  const [dailyReflection, setDailyReflection] = useState({
    proudMoment: "",
    challengeFaced: "",
    tomorrowGoal: "",
    gratitude: "",
    helpNeeded: "",
    overallRating: 3,
  });

  // Fetch today's mood entry
  const { data: todayMood } = useQuery({
    queryKey: ["/api/mood/today"],
  });

  // Fetch active progress goals
  const { data: activeGoals = [] } = useQuery({
    queryKey: ["/api/progress/goals/active"],
  });

  // Fetch today's daily reflection
  const { data: todayReflection } = useQuery({
    queryKey: ["/api/reflection/daily/today"],
  });

  // Mood entry mutation
  const moodMutation = useMutation({
    mutationFn: async (moodData: any) => {
      if (todayMood) {
        return apiRequest(`/api/mood/entry/${todayMood.id}`, {
          method: "PUT",
          body: moodData,
        });
      } else {
        return apiRequest("/api/mood/entry", {
          method: "POST",
          body: moodData,
        });
      }
    },
    onSuccess: () => {
      toast({
        title: "Mood logged successfully!",
        description: "Your mood has been recorded for today.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/mood/today"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to log mood. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Progress goal mutation
  const goalMutation = useMutation({
    mutationFn: async (goalData: any) => {
      const startDate = new Date().toISOString();
      const endDate = new Date(goalData.endDate).toISOString();
      
      return apiRequest("/api/progress/goal", {
        method: "POST",
        body: {
          ...goalData,
          startDate,
          endDate,
        },
      });
    },
    onSuccess: () => {
      toast({
        title: "Goal created!",
        description: "Your progress goal has been set.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/progress/goals/active"] });
      setShowGoalForm(false);
      setNewGoal({
        category: "",
        title: "",
        description: "",
        targetValue: 1,
        endDate: "",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create goal. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Daily reflection mutation
  const reflectionMutation = useMutation({
    mutationFn: async (reflectionData: any) => {
      if (todayReflection) {
        return apiRequest(`/api/reflection/daily/${todayReflection.id}`, {
          method: "PUT",
          body: reflectionData,
        });
      } else {
        return apiRequest("/api/reflection/daily", {
          method: "POST",
          body: reflectionData,
        });
      }
    },
    onSuccess: () => {
      toast({
        title: "Reflection saved!",
        description: "Your daily reflection has been recorded.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reflection/daily/today"] });
      setShowReflectionForm(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save reflection. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update progress goal mutation
  const updateProgressMutation = useMutation({
    mutationFn: async ({ goalId, currentValue }: { goalId: string; currentValue: number }) => {
      return apiRequest(`/api/progress/goal/${goalId}/update-progress`, {
        method: "POST",
        body: { currentValue },
      });
    },
    onSuccess: () => {
      toast({
        title: "Progress updated!",
        description: "Your goal progress has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/progress/goals/active"] });
    },
  });

  // Complete goal mutation
  const completeGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      return apiRequest(`/api/progress/goal/${goalId}/complete`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({
        title: "Goal completed! 🎉",
        description: "Congratulations on achieving your goal!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/progress/goals/active"] });
    },
  });

  // Initialize form with existing data
  useEffect(() => {
    if (todayMood) {
      setSelectedMood(todayMood.mood);
      setEnergyLevel(todayMood.energyLevel);
      setFocusLevel(todayMood.focusLevel);
      setMoodNotes(todayMood.notes || "");
    }
  }, [todayMood]);

  useEffect(() => {
    if (todayReflection) {
      setDailyReflection({
        proudMoment: todayReflection.proudMoment || "",
        challengeFaced: todayReflection.challengeFaced || "",
        tomorrowGoal: todayReflection.tomorrowGoal || "",
        gratitude: todayReflection.gratitude || "",
        helpNeeded: todayReflection.helpNeeded || "",
        overallRating: todayReflection.overallRating || 3,
      });
    }
  }, [todayReflection]);

  const handleMoodSubmit = () => {
    if (!selectedMood) {
      toast({
        title: "Please select a mood",
        description: "Choose how you're feeling today.",
        variant: "destructive",
      });
      return;
    }

    const selectedMoodOption = moodOptions.find(m => m.value === selectedMood);
    moodMutation.mutate({
      mood: selectedMood,
      moodEmoji: selectedMoodOption?.emoji,
      energyLevel,
      focusLevel,
      notes: moodNotes,
    });
  };

  const handleGoalSubmit = () => {
    if (!newGoal.category || !newGoal.title || !newGoal.endDate) {
      toast({
        title: "Please fill in all required fields",
        description: "Category, title, and end date are required.",
        variant: "destructive",
      });
      return;
    }

    goalMutation.mutate(newGoal);
  };

  const handleReflectionSubmit = () => {
    if (!dailyReflection.overallRating) {
      toast({
        title: "Please rate your day",
        description: "Overall rating is required.",
        variant: "destructive",
      });
      return;
    }

    reflectionMutation.mutate(dailyReflection);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Mood & Progress Tracker
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Track your daily mood, set goals, and reflect on your journey
        </p>
      </div>

      <Tabs defaultValue="mood" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mood" className="flex items-center gap-2">
            <Smile className="h-4 w-4" />
            Daily Mood
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Progress Goals
          </TabsTrigger>
          <TabsTrigger value="reflection" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Daily Reflection
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mood" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>How are you feeling today?</CardTitle>
              <CardDescription>
                Track your mood and energy levels to better understand your wellbeing patterns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mood Selection */}
              <div className="space-y-3">
                <Label>Mood</Label>
                <div className="grid grid-cols-5 gap-3">
                  {moodOptions.map((mood) => (
                    <Button
                      key={mood.value}
                      variant={selectedMood === mood.value ? "default" : "outline"}
                      className={`h-20 flex-col space-y-1 ${
                        selectedMood === mood.value ? mood.color : ""
                      }`}
                      onClick={() => setSelectedMood(mood.value)}
                      data-testid={`mood-${mood.value}`}
                    >
                      <span className="text-2xl">{mood.emoji}</span>
                      <span className="text-xs">{mood.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Energy Level */}
              <div className="space-y-3">
                <Label>Energy Level: {energyLevel}/5</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">Low</span>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={energyLevel}
                    onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                    className="flex-1"
                    data-testid="energy-slider"
                  />
                  <span className="text-sm">High</span>
                </div>
              </div>

              {/* Focus Level */}
              <div className="space-y-3">
                <Label>Focus Level: {focusLevel}/5</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">Low</span>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={focusLevel}
                    onChange={(e) => setFocusLevel(parseInt(e.target.value))}
                    className="flex-1"
                    data-testid="focus-slider"
                  />
                  <span className="text-sm">High</span>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-3">
                <Label htmlFor="mood-notes">Notes (optional)</Label>
                <Textarea
                  id="mood-notes"
                  placeholder="How are you feeling? What's on your mind?"
                  value={moodNotes}
                  onChange={(e) => setMoodNotes(e.target.value)}
                  data-testid="mood-notes"
                />
              </div>

              <Button
                onClick={handleMoodSubmit}
                disabled={moodMutation.isPending}
                className="w-full"
                data-testid="submit-mood"
              >
                {moodMutation.isPending ? "Saving..." : todayMood ? "Update Mood" : "Log Mood"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          {/* Active Goals */}
          <div className="grid gap-4">
            {activeGoals.map((goal: ProgressGoal) => (
              <Card key={goal.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span>
                          {categoryOptions.find(c => c.value === goal.category)?.icon}
                        </span>
                        <h3 className="font-semibold">{goal.title}</h3>
                        <Badge variant="outline">{goal.category}</Badge>
                      </div>
                      {goal.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {goal.description}
                        </p>
                      )}
                    </div>
                    {goal.currentValue >= goal.targetValue && (
                      <Button
                        size="sm"
                        onClick={() => completeGoalMutation.mutate(goal.id)}
                        disabled={completeGoalMutation.isPending}
                        data-testid={`complete-goal-${goal.id}`}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress: {goal.currentValue}/{goal.targetValue}</span>
                      <span>{Math.round((goal.currentValue / goal.targetValue) * 100)}%</span>
                    </div>
                    <Progress value={(goal.currentValue / goal.targetValue) * 100} />
                    
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (goal.currentValue > 0) {
                            updateProgressMutation.mutate({
                              goalId: goal.id,
                              currentValue: goal.currentValue - 1
                            });
                          }
                        }}
                        disabled={goal.currentValue <= 0 || updateProgressMutation.isPending}
                        data-testid={`decrease-goal-${goal.id}`}
                      >
                        -
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (goal.currentValue < goal.targetValue) {
                            updateProgressMutation.mutate({
                              goalId: goal.id,
                              currentValue: goal.currentValue + 1
                            });
                          }
                        }}
                        disabled={goal.currentValue >= goal.targetValue || updateProgressMutation.isPending}
                        data-testid={`increase-goal-${goal.id}`}
                      >
                        +
                      </Button>
                      <span className="text-sm text-gray-500 ml-2">
                        Due: {new Date(goal.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Add New Goal Button */}
          {!showGoalForm && (
            <Button
              onClick={() => setShowGoalForm(true)}
              className="w-full"
              variant="outline"
              data-testid="add-goal-button"
            >
              <Plus className="h-4 w-4 mr-2" />
              Set New Goal
            </Button>
          )}

          {/* New Goal Form */}
          {showGoalForm && (
            <Card>
              <CardHeader>
                <CardTitle>Set a New Goal</CardTitle>
                <CardDescription>
                  Create a goal to track your progress and stay motivated
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="goal-category">Category</Label>
                  <Select
                    value={newGoal.category}
                    onValueChange={(value) => setNewGoal({ ...newGoal, category: value })}
                  >
                    <SelectTrigger data-testid="goal-category-select">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.icon} {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goal-title">Goal Title</Label>
                  <Input
                    id="goal-title"
                    placeholder="e.g., Complete 5 homework assignments"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                    data-testid="goal-title-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goal-description">Description (optional)</Label>
                  <Textarea
                    id="goal-description"
                    placeholder="Describe your goal and how you'll achieve it"
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                    data-testid="goal-description-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="goal-target">Target Number</Label>
                    <Input
                      id="goal-target"
                      type="number"
                      min="1"
                      value={newGoal.targetValue}
                      onChange={(e) => setNewGoal({ ...newGoal, targetValue: parseInt(e.target.value) })}
                      data-testid="goal-target-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="goal-end-date">End Date</Label>
                    <Input
                      id="goal-end-date"
                      type="date"
                      value={newGoal.endDate}
                      onChange={(e) => setNewGoal({ ...newGoal, endDate: e.target.value })}
                      data-testid="goal-end-date-input"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleGoalSubmit}
                    disabled={goalMutation.isPending}
                    data-testid="submit-goal"
                  >
                    {goalMutation.isPending ? "Creating..." : "Create Goal"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowGoalForm(false)}
                    data-testid="cancel-goal"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reflection" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Reflection</CardTitle>
              <CardDescription>
                Take a moment to reflect on your day and set intentions for tomorrow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="proud-moment">What are you proud of today?</Label>
                <Textarea
                  id="proud-moment"
                  placeholder="Share something you accomplished or feel good about..."
                  value={dailyReflection.proudMoment}
                  onChange={(e) => setDailyReflection({ ...dailyReflection, proudMoment: e.target.value })}
                  data-testid="proud-moment-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="challenge-faced">What challenge did you face?</Label>
                <Textarea
                  id="challenge-faced"
                  placeholder="Describe any difficulties or obstacles you encountered..."
                  value={dailyReflection.challengeFaced}
                  onChange={(e) => setDailyReflection({ ...dailyReflection, challengeFaced: e.target.value })}
                  data-testid="challenge-faced-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tomorrow-goal">What's your goal for tomorrow?</Label>
                <Textarea
                  id="tomorrow-goal"
                  placeholder="Set an intention or goal for tomorrow..."
                  value={dailyReflection.tomorrowGoal}
                  onChange={(e) => setDailyReflection({ ...dailyReflection, tomorrowGoal: e.target.value })}
                  data-testid="tomorrow-goal-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gratitude">What are you grateful for?</Label>
                <Textarea
                  id="gratitude"
                  placeholder="Express gratitude for something in your life..."
                  value={dailyReflection.gratitude}
                  onChange={(e) => setDailyReflection({ ...dailyReflection, gratitude: e.target.value })}
                  data-testid="gratitude-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="help-needed">What help do you need?</Label>
                <Textarea
                  id="help-needed"
                  placeholder="Is there anything you need support with?"
                  value={dailyReflection.helpNeeded}
                  onChange={(e) => setDailyReflection({ ...dailyReflection, helpNeeded: e.target.value })}
                  data-testid="help-needed-input"
                />
              </div>

              <div className="space-y-3">
                <Label>Overall, how was your day? {dailyReflection.overallRating}/5</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">Poor</span>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={dailyReflection.overallRating}
                    onChange={(e) => setDailyReflection({ ...dailyReflection, overallRating: parseInt(e.target.value) })}
                    className="flex-1"
                    data-testid="overall-rating-slider"
                  />
                  <span className="text-sm">Great</span>
                </div>
              </div>

              <Button
                onClick={handleReflectionSubmit}
                disabled={reflectionMutation.isPending}
                className="w-full"
                data-testid="submit-reflection"
              >
                {reflectionMutation.isPending ? "Saving..." : todayReflection ? "Update Reflection" : "Save Reflection"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}