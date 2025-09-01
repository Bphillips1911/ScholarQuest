import React, { ReactNode, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Animated Button with Micro-interactions
interface AnimatedButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'house';
  size?: 'sm' | 'md' | 'lg';
  houseColor?: string;
  disabled?: boolean;
  className?: string;
  icon?: ReactNode;
  loading?: boolean;
}

export function AnimatedButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  houseColor,
  disabled = false,
  className,
  icon,
  loading = false
}: AnimatedButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const baseClasses = cn(
    "relative inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 overflow-hidden",
    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
    {
      'px-3 py-1.5 text-sm': size === 'sm',
      'px-4 py-2 text-base': size === 'md',
      'px-6 py-3 text-lg': size === 'lg',
      'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg transform hover:-translate-y-0.5': variant === 'primary' && !disabled,
      'bg-gray-200 hover:bg-gray-300 text-gray-700 hover:shadow-md transform hover:-translate-y-0.5': variant === 'secondary' && !disabled,
      'bg-green-600 hover:bg-green-700 text-white hover:shadow-lg transform hover:-translate-y-0.5': variant === 'success' && !disabled,
      'bg-red-600 hover:bg-red-700 text-white hover:shadow-lg transform hover:-translate-y-0.5': variant === 'danger' && !disabled,
      'text-white hover:shadow-xl transform hover:-translate-y-1 hover:scale-105': variant === 'house' && !disabled,
      'opacity-50 cursor-not-allowed': disabled,
      'cursor-pointer': !disabled
    },
    className
  );

  const houseStyle = houseColor && variant === 'house' ? {
    background: `linear-gradient(135deg, ${houseColor}CC, ${houseColor})`
  } : {};

  return (
    <motion.button
      className={baseClasses}
      style={houseStyle}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      data-testid={`animated-button-${variant}`}
    >
      {/* Animated background pulse */}
      <motion.div
        className="absolute inset-0 bg-white opacity-0 rounded-lg"
        animate={{
          opacity: isPressed ? 0.2 : 0,
          scale: isPressed ? 1 : 0.8
        }}
        transition={{ duration: 0.2 }}
      />
      
      {/* Loading spinner */}
      <AnimatePresence>
        {loading && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-inherit rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Button content */}
      <motion.div
        className={cn("flex items-center space-x-2", { 'opacity-0': loading })}
        animate={{ opacity: loading ? 0 : 1 }}
      >
        {icon && (
          <motion.div
            whileHover={{ rotate: 15 }}
            transition={{ duration: 0.2 }}
          >
            {icon}
          </motion.div>
        )}
        <span>{children}</span>
      </motion.div>
    </motion.button>
  );
}

// Animated Input Field
interface AnimatedInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  success?: boolean;
  type?: 'text' | 'email' | 'password' | 'number';
  icon?: ReactNode;
  className?: string;
}

export function AnimatedInput({
  label,
  placeholder,
  value,
  onChange,
  error,
  success,
  type = 'text',
  icon,
  className
}: AnimatedInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  useEffect(() => {
    setHasValue(value.length > 0);
  }, [value]);

  return (
    <div className={cn("relative", className)}>
      {/* Floating Label */}
      {label && (
        <motion.label
          className={cn(
            "absolute left-3 transition-all duration-200 pointer-events-none",
            {
              'top-2 text-xs text-blue-600': isFocused || hasValue,
              'top-1/2 -translate-y-1/2 text-gray-500': !isFocused && !hasValue,
              'text-red-500': error,
              'text-green-600': success
            }
          )}
          animate={{
            y: isFocused || hasValue ? -10 : 0,
            scale: isFocused || hasValue ? 0.85 : 1,
            color: error ? '#ef4444' : success ? '#16a34a' : isFocused ? '#2563eb' : '#6b7280'
          }}
        >
          {label}
        </motion.label>
      )}

      {/* Input Field */}
      <motion.div
        className="relative"
        whileFocus={{ scale: 1.01 }}
      >
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={isFocused ? placeholder : ''}
          className={cn(
            "w-full px-3 py-3 border-2 rounded-lg transition-all duration-200",
            "focus:outline-none focus:ring-0 bg-white",
            {
              'border-gray-300 focus:border-blue-500': !error && !success,
              'border-red-500 focus:border-red-600': error,
              'border-green-500 focus:border-green-600': success,
              'pl-10': icon
            }
          )}
          data-testid={`animated-input-${type}`}
        />

        {/* Icon */}
        {icon && (
          <motion.div
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            animate={{ color: isFocused ? '#2563eb' : '#9ca3af' }}
          >
            {icon}
          </motion.div>
        )}

        {/* Animated Border */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-lg"
          initial={{ scaleX: 0 }}
          animate={{
            scaleX: isFocused ? 1 : 0,
            backgroundColor: error ? '#ef4444' : success ? '#16a34a' : '#2563eb'
          }}
          transition={{ duration: 0.2 }}
        />
      </motion.div>

      {/* Error/Success Message */}
      <AnimatePresence>
        {(error || success) && (
          <motion.div
            className={cn(
              "mt-1 text-sm flex items-center space-x-1",
              {
                'text-red-500': error,
                'text-green-600': success
              }
            )}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              {error ? '⚠️' : '✅'}
            </motion.span>
            <span>{error || 'Looks good!'}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Animated Card with Hover Effects
interface AnimatedCardProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  houseColor?: string;
  glowOnHover?: boolean;
  floatOnHover?: boolean;
}

export function AnimatedCard({
  children,
  onClick,
  className,
  houseColor,
  glowOnHover = false,
  floatOnHover = true
}: AnimatedCardProps) {
  return (
    <motion.div
      className={cn(
        "relative bg-white rounded-lg border border-gray-200 overflow-hidden",
        "transition-all duration-300 cursor-pointer",
        className
      )}
      onClick={onClick}
      whileHover={{
        scale: floatOnHover ? 1.02 : 1,
        y: floatOnHover ? -5 : 0,
        boxShadow: glowOnHover && houseColor 
          ? `0 10px 25px ${houseColor}40, 0 0 20px ${houseColor}20`
          : "0 10px 25px rgba(0, 0, 0, 0.15)"
      }}
      whileTap={{ scale: 0.98 }}
      data-testid="animated-card"
    >
      {/* Animated background gradient on hover */}
      {houseColor && (
        <motion.div
          className="absolute inset-0 opacity-0"
          style={{
            background: `linear-gradient(135deg, ${houseColor}10, ${houseColor}05)`
          }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}

// Loading Skeleton Component
interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  animate?: boolean;
}

export function Skeleton({
  width = '100%',
  height = '1rem',
  className,
  animate = true
}: SkeletonProps) {
  return (
    <motion.div
      className={cn("bg-gray-200 rounded", className)}
      style={{ width, height }}
      animate={animate ? {
        opacity: [0.5, 1, 0.5]
      } : {}}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      data-testid="skeleton-loader"
    />
  );
}