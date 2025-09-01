import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { EmojiContext } from './contextual-emoji-feedback';

// Achievement Unlock Animation
interface AchievementUnlockProps {
  badge: {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    points: number;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  };
  show: boolean;
  onClose: () => void;
  houseColor?: string;
}

export function AchievementUnlock({
  badge,
  show,
  onClose,
  houseColor
}: AchievementUnlockProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  const rarityColors = {
    common: '#10b981',
    uncommon: '#3b82f6',
    rare: '#8b5cf6',
    epic: '#f59e0b',
    legendary: '#ef4444'
  };

  const rarityEmojis = {
    common: '⭐',
    uncommon: '🌟',
    rare: '💫',
    epic: '✨',
    legendary: '👑'
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            data-testid="achievement-backdrop"
          >
            {/* Achievement Card */}
            <motion.div
              className="bg-white rounded-2xl p-8 max-w-md w-full text-center relative overflow-hidden"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              onClick={(e) => e.stopPropagation()}
              data-testid="achievement-card"
            >
              {/* Background Particles */}
              <motion.div className="absolute inset-0 pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      y: [0, -20, 0],
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0]
                    }}
                    transition={{
                      duration: 2,
                      delay: Math.random() * 2,
                      repeat: Infinity
                    }}
                  />
                ))}
              </motion.div>

              {/* Achievement Header */}
              <motion.div
                className="mb-6"
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  ACHIEVEMENT UNLOCKED!
                </h2>
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-2xl">{rarityEmojis[badge.rarity]}</span>
                  <span 
                    className="px-3 py-1 rounded-full text-white text-sm font-medium"
                    style={{ backgroundColor: rarityColors[badge.rarity] }}
                  >
                    {badge.rarity.toUpperCase()}
                  </span>
                </div>
              </motion.div>

              {/* Badge Icon */}
              <motion.div
                className="mb-4"
                initial={{ scale: 0, rotate: -360 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
              >
                <div 
                  className="w-24 h-24 mx-auto rounded-full flex items-center justify-center text-4xl shadow-lg"
                  style={{ 
                    backgroundColor: houseColor || badge.color,
                    boxShadow: `0 0 30px ${houseColor || badge.color}50`
                  }}
                >
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    {badge.icon}
                  </motion.span>
                </div>
              </motion.div>

              {/* Badge Details */}
              <motion.div
                className="space-y-2"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <h3 className="text-xl font-bold text-gray-800">{badge.name}</h3>
                <p className="text-gray-600">{badge.description}</p>
                <div className="flex items-center justify-center space-x-4 mt-4">
                  <div className="flex items-center space-x-1">
                    <span className="text-2xl">⭐</span>
                    <span className="font-bold text-lg text-blue-600">+{badge.points}</span>
                  </div>
                  <EmojiContext context="achievement" type="badge_earned" size="md" />
                </div>
              </motion.div>

              {/* Close Button */}
              <motion.button
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600"
                onClick={onClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                data-testid="close-achievement"
              >
                ×
              </motion.button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Level Up Celebration
interface LevelUpCelebrationProps {
  level: number;
  show: boolean;
  onClose: () => void;
  houseColor?: string;
}

export function LevelUpCelebration({
  level,
  show,
  onClose,
  houseColor
}: LevelUpCelebrationProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          data-testid="level-up-backdrop"
        >
          {/* Confetti Animation */}
          <motion.div className="absolute inset-0 pointer-events-none">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded"
                style={{
                  backgroundColor: ['#fbbf24', '#f87171', '#60a5fa', '#34d399', '#a78bfa'][i % 5],
                  left: `${Math.random() * 100}%`,
                  top: '-10px'
                }}
                animate={{
                  y: window.innerHeight + 100,
                  rotate: 360,
                  x: Math.random() * 200 - 100
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  delay: Math.random() * 2,
                  repeat: Infinity
                }}
              />
            ))}
          </motion.div>

          {/* Level Up Content */}
          <motion.div
            className="text-center text-white"
            initial={{ scale: 0, y: 100 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: -100 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.h1
              className="text-8xl font-bold mb-4"
              animate={{
                scale: [1, 1.1, 1],
                textShadow: [
                  '0 0 20px rgba(255,255,255,0.8)',
                  '0 0 40px rgba(255,255,255,1)',
                  '0 0 20px rgba(255,255,255,0.8)'
                ]
              }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              LEVEL UP!
            </motion.h1>
            
            <motion.div
              className="flex items-center justify-center space-x-4 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div
                className="text-6xl"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                👑
              </motion.div>
              <div className="text-6xl font-bold" style={{ color: houseColor || '#fbbf24' }}>
                {level}
              </div>
              <motion.div
                className="text-6xl"
                animate={{ rotate: -360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                ⭐
              </motion.div>
            </motion.div>

            <motion.p
              className="text-2xl font-medium"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              Amazing Progress!
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Skill Tree Unlock Animation
interface SkillUnlockProps {
  skill: {
    id: string;
    name: string;
    icon: string;
    description: string;
  };
  show: boolean;
  onClose: () => void;
  houseColor?: string;
}

export function SkillUnlock({
  skill,
  show,
  onClose,
  houseColor
}: SkillUnlockProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-xl border-2 p-4 max-w-sm"
          style={{ borderColor: houseColor || '#3b82f6' }}
          initial={{ opacity: 0, x: 300, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 300, scale: 0.8 }}
          data-testid="skill-unlock"
        >
          <div className="flex items-center space-x-3">
            <motion.div
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
              style={{ backgroundColor: houseColor || '#3b82f6' }}
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 360, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {skill.icon}
            </motion.div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-800">Skill Unlocked!</h4>
              <p className="text-sm text-gray-600">{skill.name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              data-testid="close-skill-unlock"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Milestone Celebration
interface MilestoneCelebrationProps {
  milestone: {
    points: number;
    title: string;
    message: string;
  };
  show: boolean;
  onClose: () => void;
  houseColor?: string;
}

export function MilestoneCelebration({
  milestone,
  show,
  onClose,
  houseColor
}: MilestoneCelebrationProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          data-testid="milestone-backdrop"
        >
          <motion.div
            className="bg-white rounded-3xl p-8 max-w-lg w-full text-center relative overflow-hidden"
            initial={{ scale: 0, y: 100 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: 100 }}
            transition={{ type: "spring", stiffness: 150 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sparkle Effects */}
            <motion.div className="absolute inset-0 pointer-events-none">
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-2xl"
                  style={{
                    left: `${10 + (i * 5)}%`,
                    top: `${10 + (i * 3)}%`
                  }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    rotate: [0, 180, 360]
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.1,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                >
                  ✨
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              className="mb-6"
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                🎯 MILESTONE REACHED!
              </h2>
              <div 
                className="text-5xl font-bold mb-2"
                style={{ color: houseColor || '#f59e0b' }}
              >
                {milestone.points.toLocaleString()}
              </div>
              <p className="text-xl text-gray-700">{milestone.title}</p>
            </motion.div>

            <motion.div
              className="mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
            >
              <div className="text-4xl mb-4">🏆</div>
              <p className="text-gray-600">{milestone.message}</p>
            </motion.div>

            <EmojiContext 
              context="achievement" 
              type="milestone" 
              size="lg" 
              className="mb-4" 
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// House Victory Celebration
interface HouseVictoryProps {
  houseName: string;
  houseColor: string;
  show: boolean;
  onClose: () => void;
}

export function HouseVictory({
  houseName,
  houseColor,
  show,
  onClose
}: HouseVictoryProps) {
  const houseEmojis = {
    franklin: '🔬💡⚡',
    tesla: '⚡🔬💜', 
    curie: '🧪🔬❤️',
    nobel: '🎯🏆💚',
    lovelace: '💻🚀🧡'
  };

  const emojis = houseEmojis[houseName.toLowerCase() as keyof typeof houseEmojis] || '🏆⭐🎉';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: `${houseColor}20` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          data-testid="house-victory-backdrop"
        >
          {/* Victory Animation */}
          <motion.div
            className="text-center text-white p-8"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 100 }}
          >
            <motion.h1
              className="text-6xl font-bold mb-6"
              style={{ color: houseColor }}
              animate={{
                scale: [1, 1.1, 1],
                textShadow: [
                  `0 0 20px ${houseColor}80`,
                  `0 0 40px ${houseColor}`,
                  `0 0 20px ${houseColor}80`
                ]
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              HOUSE {houseName.toUpperCase()} VICTORY!
            </motion.h1>

            <motion.div
              className="text-8xl mb-6"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              🏆
            </motion.div>

            <div className="flex justify-center space-x-4 text-6xl">
              {emojis.split('').map((emoji, index) => (
                <motion.span
                  key={index}
                  animate={{
                    y: [0, -20, 0],
                    rotate: [0, 360, 0]
                  }}
                  transition={{
                    duration: 2,
                    delay: index * 0.2,
                    repeat: Infinity
                  }}
                >
                  {emoji}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}