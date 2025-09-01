import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge, Award, Star, Crown, Zap, Trophy, Shield, Medal } from "lucide-react";
import type { Badge as BadgeType, ScholarBadge } from "@shared/schema";

interface BadgeDisplayProps {
  badge: BadgeType;
  scholarBadge?: ScholarBadge;
  size?: "sm" | "md" | "lg" | "xl";
  showAnimation?: boolean;
  onClick?: () => void;
}

// House color mappings
const houseColors = {
  franklin: "#8B4513", // Brown
  courie: "#DC143C", // Crimson
  west: "#FF8C00", // Dark Orange
  blackwell: "#000000", // Black
  berruguete: "#4B0082", // Indigo
};

// Badge level colors and effects
const badgeLevels = {
  1: { name: "Bronze", color: "#CD7F32", gradient: "from-amber-600 to-amber-800", glow: "shadow-amber-500/50" },
  2: { name: "Silver", color: "#C0C0C0", gradient: "from-gray-300 to-gray-500", glow: "shadow-gray-400/50" },
  3: { name: "Gold", color: "#FFD700", gradient: "from-yellow-300 to-yellow-600", glow: "shadow-yellow-500/50" },
  4: { name: "Platinum", color: "#E5E4E2", gradient: "from-slate-200 to-slate-400", glow: "shadow-slate-400/50" },
  5: { name: "Diamond", color: "#B9F2FF", gradient: "from-cyan-200 to-blue-400", glow: "shadow-cyan-400/50" },
};

// Badge icons by category
const badgeIcons = {
  academic: Star,
  attendance: Clock,
  behavior: Shield,
  overall: Trophy,
};

// Animation variants
const animationVariants = {
  pulse: {
    scale: [1, 1.1, 1],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
  },
  glow: {
    boxShadow: [
      "0 0 20px rgba(255, 215, 0, 0.5)",
      "0 0 30px rgba(255, 215, 0, 0.8)",
      "0 0 20px rgba(255, 215, 0, 0.5)"
    ],
    transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
  },
  rotate: {
    rotate: [0, 10, -10, 0],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
  },
  bounce: {
    y: [0, -10, 0],
    transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
  }
};

const sizeClasses = {
  sm: "w-12 h-12",
  md: "w-16 h-16", 
  lg: "w-24 h-24",
  xl: "w-32 h-32"
};

function Clock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12,6 12,12 16,14"/>
    </svg>
  );
}

export function BadgeDisplay({ 
  badge, 
  scholarBadge, 
  size = "md", 
  showAnimation = true,
  onClick 
}: BadgeDisplayProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const badgeLevel = badgeLevels[badge.level as keyof typeof badgeLevels];
  const IconComponent = badgeIcons[badge.category as keyof typeof badgeIcons] || Trophy;
  const houseColor = badge.houseId ? houseColors[badge.houseId as keyof typeof houseColors] : "#666";

  useEffect(() => {
    if (showAnimation && scholarBadge?.isActive) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showAnimation, scholarBadge]);

  const badgeVariant = badge.animationType ? 
    animationVariants[badge.animationType as keyof typeof animationVariants] : 
    animationVariants.pulse;

  return (
    <motion.div
      className={`relative ${sizeClasses[size]} cursor-pointer group`}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      animate={isAnimating && showAnimation ? badgeVariant : {}}
    >
      {/* Badge Background */}
      <div className={`
        w-full h-full rounded-full 
        bg-gradient-to-br ${badgeLevel.gradient}
        ${scholarBadge?.isActive ? `${badgeLevel.glow} shadow-lg` : 'opacity-50'}
        border-4 border-white
        flex items-center justify-center
        transition-all duration-300
      `}>
        {/* House Accent Ring */}
        {badge.houseId && (
          <div 
            className="absolute inset-0 rounded-full border-2 opacity-70"
            style={{ borderColor: houseColor }}
          />
        )}
        
        {/* Badge Icon */}
        <IconComponent 
          className={`${size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-16 h-16'} text-white`}
        />
        
        {/* Level Indicator */}
        <div className="absolute -top-1 -right-1 bg-white rounded-full p-1">
          <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${badgeLevel.gradient}`} />
        </div>
      </div>

      {/* Earned Badge Sparkle Effect */}
      <AnimatePresence>
        {scholarBadge?.isActive && showAnimation && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-yellow-300 rounded-full"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)"
                }}
                animate={{
                  x: [0, Math.cos(i * 60 * Math.PI / 180) * 30],
                  y: [0, Math.sin(i * 60 * Math.PI / 180) * 30],
                  opacity: [1, 0],
                  scale: [0, 1, 0]
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.1,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block">
        <div className="bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap">
          <div className="font-semibold">{badge.name}</div>
          <div>{badge.description}</div>
          <div className="text-gray-300">{badgeLevel.name} Level</div>
          {!scholarBadge?.isActive && (
            <div className="text-yellow-300">{badge.pointsRequired} points needed</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface BadgeCollectionProps {
  badges: (BadgeType & { scholarBadge?: ScholarBadge })[];
  title?: string;
  emptyMessage?: string;
}

export function BadgeCollection({ badges, title, emptyMessage }: BadgeCollectionProps) {
  const earnedBadges = badges.filter(b => b.scholarBadge?.isActive);
  const availableBadges = badges.filter(b => !b.scholarBadge?.isActive);

  return (
    <div className="space-y-4">
      {title && (
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      )}
      
      {/* Earned Badges */}
      {earnedBadges.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-green-600 mb-2">Earned Badges</h4>
          <div className="flex flex-wrap gap-3">
            {earnedBadges.map((badge) => (
              <BadgeDisplay
                key={badge.id}
                badge={badge}
                scholarBadge={badge.scholarBadge}
                size="lg"
                showAnimation={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Available Badges */}
      {availableBadges.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Available Badges</h4>
          <div className="flex flex-wrap gap-3">
            {availableBadges.map((badge) => (
              <BadgeDisplay
                key={badge.id}
                badge={badge}
                scholarBadge={badge.scholarBadge}
                size="md"
                showAnimation={false}
              />
            ))}
          </div>
        </div>
      )}

      {badges.length === 0 && emptyMessage && (
        <p className="text-gray-500 text-center py-8">{emptyMessage}</p>
      )}
    </div>
  );
}