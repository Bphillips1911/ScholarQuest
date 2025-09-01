import React, { createContext, useContext, useState, useEffect } from 'react';

interface LearningAssistantContextType {
  isAssistantEnabled: boolean;
  setAssistantEnabled: (enabled: boolean) => void;
  currentTip: string | null;
  setCurrentTip: (tip: string | null) => void;
  helpHistory: string[];
  addToHelpHistory: (query: string) => void;
  assistantPreferences: {
    autoTips: boolean;
    celebrationAnimations: boolean;
    dailyMotivation: boolean;
  };
  updatePreferences: (prefs: Partial<LearningAssistantContextType['assistantPreferences']>) => void;
}

const LearningAssistantContext = createContext<LearningAssistantContextType | undefined>(undefined);

export function LearningAssistantProvider({ children }: { children: React.ReactNode }) {
  const [isAssistantEnabled, setIsAssistantEnabled] = useState(() => {
    const saved = localStorage.getItem('learning-assistant-enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [currentTip, setCurrentTip] = useState<string | null>(null);
  const [helpHistory, setHelpHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('learning-assistant-history');
    return saved ? JSON.parse(saved) : [];
  });

  const [assistantPreferences, setAssistantPreferences] = useState(() => {
    const saved = localStorage.getItem('learning-assistant-preferences');
    return saved ? JSON.parse(saved) : {
      autoTips: true,
      celebrationAnimations: true,
      dailyMotivation: true
    };
  });

  const setAssistantEnabled = (enabled: boolean) => {
    setIsAssistantEnabled(enabled);
    localStorage.setItem('learning-assistant-enabled', JSON.stringify(enabled));
  };

  const addToHelpHistory = (query: string) => {
    const newHistory = [query, ...helpHistory.slice(0, 9)]; // Keep last 10
    setHelpHistory(newHistory);
    localStorage.setItem('learning-assistant-history', JSON.stringify(newHistory));
  };

  const updatePreferences = (prefs: Partial<LearningAssistantContextType['assistantPreferences']>) => {
    const newPreferences = { ...assistantPreferences, ...prefs };
    setAssistantPreferences(newPreferences);
    localStorage.setItem('learning-assistant-preferences', JSON.stringify(newPreferences));
  };

  // Daily motivation system
  useEffect(() => {
    if (assistantPreferences.dailyMotivation && isAssistantEnabled) {
      const lastMotivation = localStorage.getItem('last-daily-motivation');
      const today = new Date().toDateString();
      
      if (lastMotivation !== today) {
        const motivationalMessages = [
          "Today is a new day to achieve greatness! 🌟",
          "Remember, every small step counts toward your big goals! 💪",
          "Your house is counting on you to shine today! ✨",
          "Believe in yourself and show those MUSTANG traits! 🐎",
          "Make today amazing with your positive attitude! 🌈"
        ];
        
        setTimeout(() => {
          setCurrentTip(motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]);
          localStorage.setItem('last-daily-motivation', today);
        }, 3000); // Show after 3 seconds
      }
    }
  }, [assistantPreferences.dailyMotivation, isAssistantEnabled]);

  const value: LearningAssistantContextType = {
    isAssistantEnabled,
    setAssistantEnabled,
    currentTip,
    setCurrentTip,
    helpHistory,
    addToHelpHistory,
    assistantPreferences,
    updatePreferences
  };

  return (
    <LearningAssistantContext.Provider value={value}>
      {children}
    </LearningAssistantContext.Provider>
  );
}

export function useLearningAssistant() {
  const context = useContext(LearningAssistantContext);
  if (context === undefined) {
    throw new Error('useLearningAssistant must be used within a LearningAssistantProvider');
  }
  return context;
}

// Hook for triggering celebration animations
export function useCelebrationTrigger() {
  const { setCurrentTip, assistantPreferences } = useLearningAssistant();

  const triggerCelebration = (achievement: string, points?: number) => {
    if (assistantPreferences.celebrationAnimations) {
      const celebrations = [
        `🎉 Awesome! You earned ${points || ''} points for ${achievement}!`,
        `🌟 Outstanding work on ${achievement}! Keep it up!`,
        `🏆 You're crushing it! ${achievement} shows real MUSTANG spirit!`,
        `⭐ Fantastic! Your ${achievement} is inspiring!`,
        `🎊 Way to go! ${achievement} earned you some serious recognition!`
      ];
      
      setCurrentTip(celebrations[Math.floor(Math.random() * celebrations.length)]);
    }
  };

  return { triggerCelebration };
}

// Hook for auto-tips based on user activity
export function useAutoTips() {
  const { setCurrentTip, assistantPreferences } = useLearningAssistant();

  const triggerAutoTip = (context: string) => {
    if (!assistantPreferences.autoTips) return;

    const tips: Record<string, string[]> = {
      'low-points': [
        "Don't worry about your points! Every day is a new opportunity to shine! ⭐",
        "Small steps lead to big achievements. Keep trying your best! 💪",
        "Remember, it's not about being perfect, it's about improving! 🌱"
      ],
      'studying': [
        "Take breaks every 25 minutes to keep your brain fresh! 🧠",
        "Try teaching someone else what you learned - it helps you remember! 👥",
        "Make flashcards for important concepts! ✏️"
      ],
      'behavior': [
        "Kind words can make someone's whole day better! 😊",
        "When you help others, you're showing true MUSTANG spirit! 🐎",
        "Taking responsibility shows real maturity! 👏"
      ],
      'house-competition': [
        "Every point you earn helps your whole house succeed! 🏠",
        "Teamwork makes the dream work! Support your housemates! 🤝",
        "Your house pride is showing, and it's amazing! ✨"
      ]
    };

    const contextTips = tips[context];
    if (contextTips) {
      setTimeout(() => {
        setCurrentTip(contextTips[Math.floor(Math.random() * contextTips.length)]);
      }, 2000);
    }
  };

  return { triggerAutoTip };
}