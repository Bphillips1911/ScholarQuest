import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Emoji categories and contexts
export const EMOJI_CONTEXTS = {
  achievement: {
    badge_earned: '🏆✨🎉',
    level_up: '📈💪🌟',
    milestone: '🎯🔥💯',
    perfect_score: '⭐🎖️👑',
    improvement: '📊💫🚀'
  },
  behavior: {
    excellent: '😊👍💯',
    good: '🙂👏✅',
    needs_work: '🤔💭📝',
    improvement: '📈😊💪'
  },
  house: {
    franklin: '🔬💡⚡',
    tesla: '⚡🔬💜',
    curie: '🧪🔬❤️',
    nobel: '🎯🏆💚',
    lovelace: '💻🚀🧡'
  },
  academic: {
    excellent: '📚🎓⭐',
    good: '📖👍✅',
    progress: '📈📝💪',
    completed: '✅🎉👏'
  },
  attendance: {
    perfect: '🎯✨💯',
    good: '👍✅😊',
    improved: '📈💪🌟'
  },
  reflection: {
    submitted: '📝✅💭',
    approved: '👍🎉✨',
    needs_revision: '🤔📝💡',
    thoughtful: '💭🌟👏'
  },
  general: {
    success: '🎉✅💚',
    error: '😅🤔💡',
    loading: '⏳🔄💫',
    celebration: '🎊🎉🥳',
    encouragement: '💪🌟👍'
  }
};

interface EmojiContextProps {
  context: keyof typeof EMOJI_CONTEXTS;
  type: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
  className?: string;
}

export function EmojiContext({
  context,
  type,
  size = 'md',
  animate = true,
  className
}: EmojiContextProps) {
  const emojis = EMOJI_CONTEXTS[context]?.[type as keyof typeof EMOJI_CONTEXTS[typeof context]] || '😊';
  const emojiArray = emojis.split('');

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-6xl'
  };

  return (
    <div className={cn("flex items-center space-x-1", sizeClasses[size], className)} data-testid={`emoji-context-${context}-${type}`}>
      {emojiArray.map((emoji, index) => (
        <motion.span
          key={index}
          initial={animate ? { scale: 0, rotate: -180 } : {}}
          animate={animate ? { scale: 1, rotate: 0 } : {}}
          transition={{
            delay: index * 0.1,
            type: "spring",
            stiffness: 300,
            damping: 20
          }}
          whileHover={animate ? { 
            scale: 1.2, 
            rotate: [0, 10, -10, 0],
            transition: { duration: 0.3 }
          } : {}}
        >
          {emoji}
        </motion.span>
      ))}
    </div>
  );
}

// Floating Emoji Notification
interface FloatingEmojiNotificationProps {
  emoji: string;
  message: string;
  show: boolean;
  onClose: () => void;
  duration?: number;
  position?: 'top-right' | 'top-center' | 'bottom-right' | 'center';
}

export function FloatingEmojiNotification({
  emoji,
  message,
  show,
  onClose,
  duration = 3000,
  position = 'top-right'
}: FloatingEmojiNotificationProps) {
  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
    'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={cn(
            "fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm",
            positionClasses[position]
          )}
          initial={{ opacity: 0, scale: 0.8, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          whileHover={{ scale: 1.02 }}
          data-testid="floating-emoji-notification"
        >
          <div className="flex items-center space-x-3">
            <motion.div
              className="text-3xl"
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                repeatDelay: 2
              }}
            >
              {emoji}
            </motion.div>
            <div className="flex-1">
              <p className="text-gray-900 font-medium">{message}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
              data-testid="close-notification"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Contextual Emoji Feedback Hook
interface UseEmojiNotificationReturn {
  showNotification: (context: keyof typeof EMOJI_CONTEXTS, type: string, message: string, duration?: number) => void;
  notification: {
    emoji: string;
    message: string;
    show: boolean;
  };
  closeNotification: () => void;
}

export function useEmojiNotification(): UseEmojiNotificationReturn {
  const [notification, setNotification] = useState({
    emoji: '',
    message: '',
    show: false
  });

  const showNotification = (
    context: keyof typeof EMOJI_CONTEXTS,
    type: string,
    message: string,
    duration: number = 3000
  ) => {
    const emojis = EMOJI_CONTEXTS[context]?.[type as keyof typeof EMOJI_CONTEXTS[typeof context]] || '😊';
    const emoji = emojis.split('')[0]; // Use first emoji for notifications
    
    setNotification({
      emoji,
      message,
      show: true
    });

    if (duration > 0) {
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, duration);
    }
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  return {
    showNotification,
    notification,
    closeNotification
  };
}

// Emoji Reaction Component
interface EmojiReactionProps {
  reactions: Array<{ emoji: string; count: number; active?: boolean }>;
  onReactionClick: (emoji: string) => void;
  className?: string;
}

export function EmojiReaction({
  reactions,
  onReactionClick,
  className
}: EmojiReactionProps) {
  return (
    <div className={cn("flex items-center space-x-2 flex-wrap gap-2", className)} data-testid="emoji-reactions">
      {reactions.map((reaction, index) => (
        <motion.button
          key={index}
          className={cn(
            "flex items-center space-x-1 px-2 py-1 rounded-full border text-sm",
            "transition-colors duration-200 hover:bg-gray-100",
            {
              'bg-blue-100 border-blue-300 text-blue-700': reaction.active,
              'bg-white border-gray-200 text-gray-700': !reaction.active
            }
          )}
          onClick={() => onReactionClick(reaction.emoji)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          data-testid={`reaction-${reaction.emoji}`}
        >
          <motion.span
            className="text-lg"
            whileHover={{ rotate: 10 }}
          >
            {reaction.emoji}
          </motion.span>
          <span className="font-medium">{reaction.count}</span>
        </motion.button>
      ))}
    </div>
  );
}

// Progress Emoji Indicator
interface ProgressEmojiProps {
  progress: number; // 0-100
  emojis: {
    start: string;
    middle: string;
    complete: string;
  };
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
}

export function ProgressEmoji({
  progress,
  emojis,
  size = 'md',
  showProgress = true
}: ProgressEmojiProps) {
  const getEmoji = () => {
    if (progress >= 100) return emojis.complete;
    if (progress >= 50) return emojis.middle;
    return emojis.start;
  };

  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl'
  };

  return (
    <div className="flex flex-col items-center space-y-2" data-testid="progress-emoji">
      <motion.div
        className={sizeClasses[size]}
        animate={{
          scale: [1, 1.1, 1],
          rotate: progress >= 100 ? [0, 10, -10, 0] : 0
        }}
        transition={{
          duration: progress >= 100 ? 0.6 : 2,
          repeat: progress >= 100 ? Infinity : 0,
          repeatDelay: progress >= 100 ? 1 : 0
        }}
      >
        {getEmoji()}
      </motion.div>
      {showProgress && (
        <div className="text-sm text-gray-600 font-medium">
          {progress}%
        </div>
      )}
    </div>
  );
}

// Mood Selector with Emojis
interface MoodSelectorProps {
  moods: Array<{ emoji: string; label: string; value: string }>;
  selectedMood?: string;
  onMoodSelect: (mood: string) => void;
  className?: string;
}

export function MoodSelector({
  moods,
  selectedMood,
  onMoodSelect,
  className
}: MoodSelectorProps) {
  return (
    <div className={cn("grid grid-cols-3 gap-3", className)} data-testid="mood-selector">
      {moods.map((mood) => (
        <motion.button
          key={mood.value}
          className={cn(
            "flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-200",
            {
              'border-blue-500 bg-blue-50': selectedMood === mood.value,
              'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50': selectedMood !== mood.value
            }
          )}
          onClick={() => onMoodSelect(mood.value)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          data-testid={`mood-${mood.value}`}
        >
          <motion.div
            className="text-3xl mb-1"
            animate={selectedMood === mood.value ? {
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            } : {}}
            transition={{ duration: 0.6 }}
          >
            {mood.emoji}
          </motion.div>
          <span className="text-sm font-medium text-gray-700">{mood.label}</span>
        </motion.button>
      ))}
    </div>
  );
}