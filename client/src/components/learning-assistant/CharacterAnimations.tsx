import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Lightbulb, Star, BookOpen, Trophy } from 'lucide-react';

interface Character {
  id: string;
  name: string;
  house: string;
  personality: string;
  color: string;
  avatar: string;
}

interface CharacterAnimationsProps {
  character: Character;
  isActive: boolean;
  message?: string;
  onInteraction?: () => void;
}

export function CharacterAnimations({ character, isActive, message, onInteraction }: CharacterAnimationsProps) {
  const [currentAnimation, setCurrentAnimation] = useState<'idle' | 'talking' | 'celebrating' | 'thinking'>('idle');
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (message) {
      setCurrentAnimation('talking');
      setShowMessage(true);
      const timer = setTimeout(() => {
        setCurrentAnimation('idle');
        setShowMessage(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const characterVariants = {
    idle: {
      y: [0, -5, 0],
      rotateY: [0, 5, 0, -5, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    talking: {
      scale: [1, 1.05, 1],
      rotateZ: [-2, 2, -2, 2, 0],
      transition: {
        duration: 0.5,
        repeat: 3,
        ease: "easeInOut"
      }
    },
    celebrating: {
      y: [0, -20, 0],
      rotateZ: [0, 10, -10, 0],
      scale: [1, 1.1, 1],
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    },
    thinking: {
      rotateY: [0, -10, 10, 0],
      y: [0, -3, 0],
      transition: {
        duration: 2,
        repeat: 2,
        ease: "easeInOut"
      }
    }
  };

  const floatingIconVariants = {
    float: {
      y: [0, -10, 0],
      rotateZ: [0, 5, -5, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const sparkleVariants = {
    sparkle: {
      opacity: [0, 1, 0],
      scale: [0, 1, 0],
      rotateZ: [0, 180, 360],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
        staggerChildren: 0.2
      }
    }
  };

  return (
    <div className="relative">
      {/* Character Avatar */}
      <motion.div
        className={`relative w-20 h-20 rounded-full border-4 border-${character.color}-400 bg-gradient-to-br from-${character.color}-100 to-${character.color}-200 flex items-center justify-center cursor-pointer shadow-lg`}
        variants={characterVariants}
        animate={currentAnimation}
        onClick={onInteraction}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="text-3xl">{character.avatar}</div>
        
        {/* Character glow effect */}
        <motion.div
          className={`absolute inset-0 rounded-full bg-${character.color}-400 opacity-20`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>

      {/* Floating Icons */}
      <AnimatePresence>
        {isActive && (
          <>
            <motion.div
              className="absolute -top-2 -right-2"
              variants={floatingIconVariants}
              animate="float"
              initial={{ opacity: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className={`w-6 h-6 rounded-full bg-${character.color}-500 flex items-center justify-center`}>
                <Lightbulb className="w-3 h-3 text-white" />
              </div>
            </motion.div>

            <motion.div
              className="absolute -bottom-2 -left-2"
              variants={floatingIconVariants}
              animate="float"
              initial={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className={`w-6 h-6 rounded-full bg-${character.color}-500 flex items-center justify-center`}>
                <Star className="w-3 h-3 text-white" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sparkle Effects */}
      <AnimatePresence>
        {currentAnimation === 'celebrating' && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            variants={sparkleVariants}
            animate="sparkle"
            initial={{ opacity: 0 }}
            exit={{ opacity: 0 }}
          >
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                }}
                variants={sparkleVariants}
                transition={{ delay: i * 0.1 }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Bubble */}
      <AnimatePresence>
        {showMessage && message && (
          <motion.div
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48"
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <div className={`bg-white rounded-lg p-3 shadow-lg border-2 border-${character.color}-200`}>
              <div className="text-sm text-gray-700 font-medium">
                {message}
              </div>
              <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-${character.color}-200`} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Character Info */}
      <motion.div
        className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: isActive ? 1 : 0.7 }}
      >
        <div className={`text-xs font-bold text-${character.color}-600`}>
          {character.name}
        </div>
        <div className="text-xs text-gray-500">
          {character.house}
        </div>
      </motion.div>
    </div>
  );
}

// Character presets for each house
export const houseCharacters: Character[] = [
  {
    id: 'franklin-bot',
    name: 'Katherine',
    house: 'Johnson',
    personality: 'Precise and mathematical',
    color: 'blue',
    avatar: '🚀'
  },
  {
    id: 'tesla-bot',
    name: 'Nikki',
    house: 'Tesla',
    personality: 'Energetic and inventive',
    color: 'purple',
    avatar: '⚡'
  },
  {
    id: 'curie-bot',
    name: 'Charles',
    house: 'Drew',
    personality: 'Caring and innovative',
    color: 'red',
    avatar: '🧪'
  },
  {
    id: 'nobel-bot',
    name: 'Thurgood',
    house: 'Marshall',
    personality: 'Just and accomplished',
    color: 'green',
    avatar: '⚖️'
  },
  {
    id: 'lovelace-bot',
    name: 'Gladys',
    house: 'West',
    personality: 'Logical and precise',
    color: 'orange',
    avatar: '🧭'
  }
];