import { motion } from "framer-motion";
import { ReactNode } from "react";

interface MicroAnimationProps {
  children: ReactNode;
  type?: 'hover' | 'tap' | 'focus' | 'entrance' | 'success' | 'error' | 'loading' | 'pulse' | 'bounce' | 'slide';
  className?: string;
  disabled?: boolean;
  delay?: number;
}

// Hover Animation Component
export function HoverGrow({ children, className = "", disabled = false }: MicroAnimationProps) {
  return (
    <motion.div
      className={className}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

// Tap Animation Component
export function TapShrink({ children, className = "", disabled = false }: MicroAnimationProps) {
  return (
    <motion.div
      className={className}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      transition={{ duration: 0.1, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

// Combined Hover and Tap
export function InteractiveScale({ children, className = "", disabled = false }: MicroAnimationProps) {
  return (
    <motion.div
      className={className}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

// Entrance Animation
export function SlideIn({ children, className = "", delay = 0 }: MicroAnimationProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

// Fade In Animation
export function FadeIn({ children, className = "", delay = 0 }: MicroAnimationProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

// Success Animation (green glow)
export function SuccessGlow({ children, className = "" }: MicroAnimationProps) {
  return (
    <motion.div
      className={className}
      initial={{ scale: 1 }}
      animate={{ 
        scale: [1, 1.05, 1],
        boxShadow: [
          "0 0 0px rgba(34, 197, 94, 0)",
          "0 0 20px rgba(34, 197, 94, 0.6)",
          "0 0 0px rgba(34, 197, 94, 0)"
        ]
      }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

// Error Animation (red shake)
export function ErrorShake({ children, className = "" }: MicroAnimationProps) {
  return (
    <motion.div
      className={className}
      animate={{ 
        x: [0, -10, 10, -10, 10, 0],
        boxShadow: [
          "0 0 0px rgba(239, 68, 68, 0)",
          "0 0 20px rgba(239, 68, 68, 0.6)",
          "0 0 0px rgba(239, 68, 68, 0)"
        ]
      }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

// Loading Animation (pulse)
export function LoadingPulse({ children, className = "" }: MicroAnimationProps) {
  return (
    <motion.div
      className={className}
      animate={{ 
        opacity: [0.5, 1, 0.5],
        scale: [1, 1.02, 1]
      }}
      transition={{ 
        duration: 1.5, 
        repeat: Infinity, 
        ease: "easeInOut" 
      }}
    >
      {children}
    </motion.div>
  );
}

// Bounce Animation
export function Bounce({ children, className = "", delay = 0 }: MicroAnimationProps) {
  return (
    <motion.div
      className={className}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ 
        duration: 0.6, 
        delay,
        type: "spring",
        stiffness: 300,
        damping: 20
      }}
    >
      {children}
    </motion.div>
  );
}

// Floating Animation (subtle up and down)
export function Float({ children, className = "" }: MicroAnimationProps) {
  return (
    <motion.div
      className={className}
      animate={{ 
        y: [0, -10, 0]
      }}
      transition={{ 
        duration: 3, 
        repeat: Infinity, 
        ease: "easeInOut" 
      }}
    >
      {children}
    </motion.div>
  );
}

// Glow Animation
export function Glow({ children, className = "", type = 'pulse' }: MicroAnimationProps & { type?: 'pulse' | 'steady' }) {
  const isPulse = type === 'pulse';
  
  return (
    <motion.div
      className={className}
      animate={isPulse ? { 
        boxShadow: [
          "0 0 5px rgba(59, 130, 246, 0.3)",
          "0 0 25px rgba(59, 130, 246, 0.8)",
          "0 0 5px rgba(59, 130, 246, 0.3)"
        ]
      } : {}}
      transition={isPulse ? { 
        duration: 2, 
        repeat: Infinity, 
        ease: "easeInOut" 
      } : {}}
      style={!isPulse ? {
        boxShadow: "0 0 15px rgba(59, 130, 246, 0.6)"
      } : {}}
    >
      {children}
    </motion.div>
  );
}

// Slide from direction
export function SlideFromDirection({ 
  children, 
  className = "", 
  direction = 'left',
  delay = 0 
}: MicroAnimationProps & { direction?: 'left' | 'right' | 'top' | 'bottom' }) {
  const getInitialPosition = () => {
    switch (direction) {
      case 'left': return { x: -100, opacity: 0 };
      case 'right': return { x: 100, opacity: 0 };
      case 'top': return { y: -100, opacity: 0 };
      case 'bottom': return { y: 100, opacity: 0 };
      default: return { x: -100, opacity: 0 };
    }
  };

  return (
    <motion.div
      className={className}
      initial={getInitialPosition()}
      animate={{ x: 0, y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

// Stagger Children Animation
export function StaggerContainer({ 
  children, 
  className = "",
  staggerDelay = 0.1 
}: MicroAnimationProps & { staggerDelay?: number }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
}

// Stagger Child Item
export function StaggerItem({ children, className = "" }: MicroAnimationProps) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

// Rotating Animation
export function Rotate({ children, className = "", duration = 2 }: MicroAnimationProps & { duration?: number }) {
  return (
    <motion.div
      className={className}
      animate={{ rotate: 360 }}
      transition={{ 
        duration, 
        repeat: Infinity, 
        ease: "linear" 
      }}
    >
      {children}
    </motion.div>
  );
}

// Scale on Scroll/View
export function ScaleOnView({ children, className = "" }: MicroAnimationProps) {
  return (
    <motion.div
      className={className}
      initial={{ scale: 0.8, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

// Sparkle Effect (for achievements)
export function SparkleEffect({ children, className = "" }: MicroAnimationProps) {
  return (
    <motion.div
      className={`relative ${className}`}
      whileHover="hover"
    >
      {children}
      <motion.div
        className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"
        variants={{
          hover: {
            scale: [1, 1.5, 1],
            opacity: [0, 1, 0],
          }
        }}
        transition={{ duration: 0.6, repeat: Infinity }}
      />
      <motion.div
        className="absolute -bottom-1 -left-1 w-1 h-1 bg-yellow-400 rounded-full"
        variants={{
          hover: {
            scale: [1, 2, 1],
            opacity: [0, 1, 0],
          }
        }}
        transition={{ duration: 0.6, delay: 0.2, repeat: Infinity }}
      />
    </motion.div>
  );
}