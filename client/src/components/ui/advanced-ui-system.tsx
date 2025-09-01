import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useEmojiNotification } from './contextual-emoji-feedback';
import { ScreenReaderAnnouncement } from './accessibility-focused';

// Advanced UI System Context
interface AdvancedUIContextType {
  // Micro-interactions
  enableMicroInteractions: boolean;
  setEnableMicroInteractions: (enabled: boolean) => void;
  
  // Emoji feedback
  showEmojiNotification: (context: string, type: string, message: string, duration?: number) => void;
  
  // Achievements
  showAchievement: (achievement: any) => void;
  showLevelUp: (level: number) => void;
  showMilestone: (milestone: any) => void;
  
  // Accessibility
  highContrastMode: boolean;
  reducedMotionMode: boolean;
  fontSize: number;
  setHighContrastMode: (enabled: boolean) => void;
  setReducedMotionMode: (enabled: boolean) => void;
  setFontSize: (size: number) => void;
  
  // Mobile optimizations
  isMobile: boolean;
  touchMode: boolean;
  
  // Screen reader announcements
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
}

const AdvancedUIContext = createContext<AdvancedUIContextType | undefined>(undefined);

// Advanced UI Provider
interface AdvancedUIProviderProps {
  children: React.ReactNode;
}

export function AdvancedUIProvider({ children }: AdvancedUIProviderProps) {
  // Micro-interactions state
  const [enableMicroInteractions, setEnableMicroInteractions] = useState(true);
  
  // Emoji notification hook
  const { showNotification: showEmojiNotification } = useEmojiNotification();
  
  // Achievement states
  const [currentAchievement, setCurrentAchievement] = useState<any>(null);
  const [currentLevelUp, setCurrentLevelUp] = useState<number | null>(null);
  const [currentMilestone, setCurrentMilestone] = useState<any>(null);
  
  // Accessibility states
  const [highContrastMode, setHighContrastMode] = useState(false);
  const [reducedMotionMode, setReducedMotionMode] = useState(false);
  const [fontSize, setFontSize] = useState(100);
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  const [touchMode, setTouchMode] = useState(false);
  
  // Screen reader announcements
  const [announcements, setAnnouncements] = useState<Array<{
    id: string;
    message: string;
    priority: 'polite' | 'assertive';
  }>>([]);

  // Initialize settings from localStorage
  useEffect(() => {
    // Load accessibility preferences
    const savedHighContrast = localStorage.getItem('high-contrast') === 'true';
    const savedFontSize = parseInt(localStorage.getItem('font-size') || '100');
    const savedMicroInteractions = localStorage.getItem('micro-interactions') !== 'false';
    
    setHighContrastMode(savedHighContrast);
    setFontSize(savedFontSize);
    setEnableMicroInteractions(savedMicroInteractions);
    
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotionMode(mediaQuery.matches);
    
    // Mobile detection
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      const touch = 'ontouchstart' in window;
      setIsMobile(mobile);
      setTouchMode(touch);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Apply accessibility settings
  useEffect(() => {
    if (highContrastMode) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    
    document.documentElement.style.fontSize = `${fontSize}%`;
    
    localStorage.setItem('high-contrast', String(highContrastMode));
    localStorage.setItem('font-size', String(fontSize));
    localStorage.setItem('micro-interactions', String(enableMicroInteractions));
  }, [highContrastMode, fontSize, enableMicroInteractions]);

  // Achievement functions
  const showAchievement = (achievement: any) => {
    setCurrentAchievement(achievement);
    announce(`Achievement unlocked: ${achievement.name}`, 'assertive');
  };

  const showLevelUp = (level: number) => {
    setCurrentLevelUp(level);
    announce(`Level up! You are now level ${level}`, 'assertive');
  };

  const showMilestone = (milestone: any) => {
    setCurrentMilestone(milestone);
    announce(`Milestone reached: ${milestone.title}`, 'assertive');
  };

  // Screen reader announcement function
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const id = Math.random().toString(36).substr(2, 9);
    const announcement = { id, message, priority };
    
    setAnnouncements(prev => [...prev, announcement]);
    
    // Remove announcement after 5 seconds
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }, 5000);
  };

  const contextValue: AdvancedUIContextType = {
    enableMicroInteractions,
    setEnableMicroInteractions,
    showEmojiNotification,
    showAchievement,
    showLevelUp,
    showMilestone,
    highContrastMode,
    reducedMotionMode,
    fontSize,
    setHighContrastMode,
    setReducedMotionMode,
    setFontSize,
    isMobile,
    touchMode,
    announce
  };

  return (
    <AdvancedUIContext.Provider value={contextValue}>
      {children}
      
      {/* Screen reader announcements */}
      {announcements.map(announcement => (
        <ScreenReaderAnnouncement
          key={announcement.id}
          message={announcement.message}
          priority={announcement.priority}
        />
      ))}
      
      {/* Achievement overlays would be rendered here */}
      {/* These would be imported and used from the gamified-achievements components */}
    </AdvancedUIContext.Provider>
  );
}

// Hook to use Advanced UI context
export function useAdvancedUI() {
  const context = useContext(AdvancedUIContext);
  if (context === undefined) {
    throw new Error('useAdvancedUI must be used within an AdvancedUIProvider');
  }
  return context;
}

// Enhanced House Card with all advanced features
interface EnhancedHouseCardProps {
  house: {
    id: string;
    name: string;
    color: string;
    points: number;
    rank: number;
    totalScholars: number;
  };
  onClick?: () => void;
  className?: string;
}

export function EnhancedHouseCard({ house, onClick, className }: EnhancedHouseCardProps) {
  const { 
    enableMicroInteractions, 
    showEmojiNotification, 
    isMobile,
    announce 
  } = useAdvancedUI();

  const handleClick = () => {
    if (onClick) {
      onClick();
      showEmojiNotification('house', house.name.toLowerCase(), `Viewing ${house.name} house details!`);
      announce(`Opened ${house.name} house details`);
    }
  };

  const houseEmojis = {
    franklin: '🔬',
    tesla: '⚡',
    curie: '🧪', 
    nobel: '🎯',
    lovelace: '💻'
  };

  const emoji = houseEmojis[house.name.toLowerCase() as keyof typeof houseEmojis] || '🏠';

  return (
    <motion.div
      className={`relative bg-white rounded-xl p-6 shadow-lg border-2 cursor-pointer ${className}`}
      style={{ borderColor: house.color }}
      onClick={handleClick}
      whileHover={enableMicroInteractions ? { 
        scale: 1.02, 
        y: -5,
        boxShadow: `0 20px 40px ${house.color}30`
      } : {}}
      whileTap={enableMicroInteractions ? { scale: 0.98 } : {}}
      role="button"
      tabIndex={0}
      aria-label={`${house.name} house, ${house.points} points, rank ${house.rank}`}
      data-testid={`enhanced-house-card-${house.id}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* House glow effect */}
      <motion.div
        className="absolute inset-0 rounded-xl opacity-0"
        style={{ backgroundColor: `${house.color}20` }}
        whileHover={enableMicroInteractions ? { opacity: 1 } : {}}
        transition={{ duration: 0.3 }}
      />

      {/* Content */}
      <div className="relative z-10 text-center">
        {/* House emoji */}
        <motion.div
          className="text-4xl mb-3"
          animate={enableMicroInteractions ? {
            rotate: [0, 5, -5, 0],
            scale: [1, 1.05, 1]
          } : {}}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          {emoji}
        </motion.div>

        {/* House name */}
        <h3 
          className="text-xl font-bold mb-2"
          style={{ color: house.color }}
        >
          House of {house.name}
        </h3>

        {/* Points display */}
        <motion.div
          className="text-3xl font-bold text-gray-800 mb-2"
          animate={enableMicroInteractions ? {
            scale: [1, 1.1, 1]
          } : {}}
          transition={{ duration: 0.5 }}
          key={house.points} // Re-animate when points change
        >
          {house.points.toLocaleString()}
        </motion.div>

        {/* Rank badge */}
        <div 
          className="inline-block px-3 py-1 rounded-full text-white text-sm font-medium"
          style={{ backgroundColor: house.color }}
        >
          Rank #{house.rank}
        </div>

        {/* Scholar count */}
        <p className="text-sm text-gray-600 mt-2">
          {house.totalScholars} scholars
        </p>
      </div>

      {/* Mobile touch indicator */}
      {isMobile && (
        <div className="absolute bottom-2 right-2 text-gray-400 text-xs">
          Tap to view
        </div>
      )}
    </motion.div>
  );
}

// Enhanced Achievement Badge with all features
interface EnhancedAchievementBadgeProps {
  badge: {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    earned: boolean;
    earnedDate?: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  };
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  onClick?: () => void;
}

export function EnhancedAchievementBadge({ 
  badge, 
  size = 'md', 
  showDetails = true, 
  onClick 
}: EnhancedAchievementBadgeProps) {
  const { enableMicroInteractions, announce } = useAdvancedUI();

  const sizeClasses = {
    sm: 'w-16 h-16 text-2xl',
    md: 'w-24 h-24 text-4xl',
    lg: 'w-32 h-32 text-6xl'
  };

  const rarityColors = {
    common: '#10b981',
    uncommon: '#3b82f6', 
    rare: '#8b5cf6',
    epic: '#f59e0b',
    legendary: '#ef4444'
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
      announce(`Viewing ${badge.name} achievement details`);
    }
  };

  return (
    <motion.div
      className={`relative flex flex-col items-center p-4 rounded-xl cursor-pointer ${
        badge.earned ? 'opacity-100' : 'opacity-50 grayscale'
      }`}
      onClick={handleClick}
      whileHover={enableMicroInteractions ? { 
        scale: 1.05,
        rotate: badge.earned ? 5 : 0
      } : {}}
      whileTap={enableMicroInteractions ? { scale: 0.95 } : {}}
      role="button"
      tabIndex={0}
      aria-label={`${badge.name} ${badge.earned ? 'earned' : 'not earned'} achievement`}
      data-testid={`enhanced-badge-${badge.id}`}
    >
      {/* Badge circle */}
      <motion.div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center border-4 shadow-lg`}
        style={{ 
          backgroundColor: badge.earned ? badge.color : '#e5e7eb',
          borderColor: badge.earned ? rarityColors[badge.rarity] : '#9ca3af',
          boxShadow: badge.earned ? `0 0 20px ${badge.color}40` : undefined
        }}
        animate={badge.earned && enableMicroInteractions ? {
          boxShadow: [
            `0 0 20px ${badge.color}40`,
            `0 0 30px ${badge.color}60`, 
            `0 0 20px ${badge.color}40`
          ]
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <motion.span
          animate={badge.earned && enableMicroInteractions ? {
            rotate: 360,
            scale: [1, 1.1, 1]
          } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          {badge.icon}
        </motion.span>
      </motion.div>

      {/* Badge details */}
      {showDetails && (
        <div className="mt-3 text-center">
          <h4 className="font-semibold text-sm text-gray-800">
            {badge.name}
          </h4>
          {badge.earned && badge.earnedDate && (
            <p className="text-xs text-gray-500 mt-1">
              Earned {badge.earnedDate}
            </p>
          )}
        </div>
      )}

      {/* Rarity indicator */}
      {badge.earned && (
        <div
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs"
          style={{ backgroundColor: rarityColors[badge.rarity] }}
          title={badge.rarity}
        >
          {badge.rarity === 'legendary' ? '👑' : '⭐'}
        </div>
      )}
    </motion.div>
  );
}

// CSS for high contrast mode and accessibility
export const advancedUIStyles = `
  /* High Contrast Mode */
  .high-contrast {
    --bg-primary: #000000;
    --bg-secondary: #1a1a1a;
    --text-primary: #ffffff;
    --text-secondary: #cccccc;
    --border: #ffffff;
    --accent: #ffff00;
  }
  
  .high-contrast * {
    background-color: var(--bg-primary) !important;
    color: var(--text-primary) !important;
    border-color: var(--border) !important;
  }
  
  .high-contrast button,
  .high-contrast .btn {
    background-color: var(--accent) !important;
    color: var(--bg-primary) !important;
    border: 2px solid var(--text-primary) !important;
  }
  
  /* Safe area padding for mobile devices */
  .safe-area-padding {
    padding-top: env(safe-area-inset-top);
    padding-right: env(safe-area-inset-right);
    padding-bottom: env(safe-area-inset-bottom);
    padding-left: env(safe-area-inset-left);
  }
  
  .pt-safe { padding-top: env(safe-area-inset-top); }
  .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
  .pl-safe { padding-left: env(safe-area-inset-left); }
  .pr-safe { padding-right: env(safe-area-inset-right); }
  
  /* Touch-friendly sizing */
  @media (hover: none) and (pointer: coarse) {
    button, .btn, [role="button"] {
      min-height: 44px;
      min-width: 44px;
    }
  }
  
  /* Reduced motion preferences */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  
  /* Focus indicators */
  .focus-visible:focus {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
  }
  
  /* Screen reader only content */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  
  .sr-only.focus:focus,
  .sr-only.focus-within:focus-within {
    position: static;
    width: auto;
    height: auto;
    padding: 0.5rem;
    margin: 0;
    overflow: visible;
    clip: auto;
    white-space: normal;
  }
`;