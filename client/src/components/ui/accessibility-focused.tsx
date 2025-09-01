import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, MotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

// Accessible Motion Component with Reduced Motion Support
interface AccessibleMotionProps extends MotionProps {
  children: React.ReactNode;
  reduceMotion?: boolean;
  className?: string;
  role?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export function AccessibleMotion({
  children,
  reduceMotion,
  className,
  role,
  ...motionProps
}: AccessibleMotionProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const shouldReduceMotion = reduceMotion || prefersReducedMotion;

  // Remove animation properties if motion should be reduced
  const filteredProps = shouldReduceMotion
    ? Object.fromEntries(
        Object.entries(motionProps).filter(([key]) => 
          !['animate', 'initial', 'exit', 'whileHover', 'whileTap', 'transition'].includes(key)
        )
      )
    : motionProps;

  return (
    <motion.div
      className={className}
      role={role}
      {...filteredProps}
      data-testid="accessible-motion"
    >
      {children}
    </motion.div>
  );
}

// Screen Reader Optimized Button
interface AccessibleButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-pressed'?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
}

export function AccessibleButton({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  className,
  ...ariaProps
}: AccessibleButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Keyboard navigation
  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!disabled && !loading) {
          onClick?.();
        }
      }
    };

    button.addEventListener('keydown', handleKeyDown);
    return () => button.removeEventListener('keydown', handleKeyDown);
  }, [onClick, disabled, loading]);

  const baseClasses = cn(
    "relative inline-flex items-center justify-center font-medium rounded-lg",
    "transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    {
      // Sizes
      'px-3 py-1.5 text-sm': size === 'sm',
      'px-4 py-2 text-base': size === 'md',
      'px-6 py-3 text-lg': size === 'lg',
      
      // Variants
      'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500': variant === 'primary' && !disabled,
      'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-500': variant === 'secondary' && !disabled,
      'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500': variant === 'danger' && !disabled,
      
      // Focus styles
      'ring-4 ring-blue-200': isFocused && variant === 'primary',
      'ring-4 ring-gray-200': isFocused && variant === 'secondary',
      'ring-4 ring-red-200': isFocused && variant === 'danger',
    },
    className
  );

  return (
    <button
      ref={buttonRef}
      className={baseClasses}
      onClick={onClick}
      disabled={disabled || loading}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      {...ariaProps}
      data-testid={`accessible-button-${variant}`}
    >
      {/* Loading state announcement for screen readers */}
      {loading && (
        <span className="sr-only">Loading, please wait</span>
      )}

      {/* Button content */}
      <span className={cn("flex items-center", { 'opacity-0': loading })}>
        {icon && iconPosition === 'left' && (
          <span className="mr-2" aria-hidden="true">
            {icon}
          </span>
        )}
        
        <span>{children}</span>
        
        {icon && iconPosition === 'right' && (
          <span className="ml-2" aria-hidden="true">
            {icon}
          </span>
        )}
      </span>

      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"
            role="status"
            aria-label="Loading"
          />
        </div>
      )}
    </button>
  );
}

// High Contrast Mode Toggle
interface HighContrastToggleProps {
  className?: string;
}

export function HighContrastToggle({ className }: HighContrastToggleProps) {
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    // Check for saved preference
    const saved = localStorage.getItem('high-contrast') === 'true';
    setHighContrast(saved);
    
    if (saved) {
      document.documentElement.classList.add('high-contrast');
    }
  }, []);

  const toggleHighContrast = () => {
    const newValue = !highContrast;
    setHighContrast(newValue);
    localStorage.setItem('high-contrast', String(newValue));
    
    if (newValue) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  };

  return (
    <AccessibleButton
      onClick={toggleHighContrast}
      variant="secondary"
      className={className}
      aria-label={`${highContrast ? 'Disable' : 'Enable'} high contrast mode`}
      aria-pressed={highContrast}
      icon={highContrast ? '🔆' : '🔅'}
      data-testid="high-contrast-toggle"
    >
      {highContrast ? 'Normal' : 'High'} Contrast
    </AccessibleButton>
  );
}

// Font Size Control
interface FontSizeControlProps {
  className?: string;
}

export function FontSizeControl({ className }: FontSizeControlProps) {
  const [fontSize, setFontSize] = useState(100);

  useEffect(() => {
    const saved = localStorage.getItem('font-size');
    if (saved) {
      const size = parseInt(saved);
      setFontSize(size);
      document.documentElement.style.fontSize = `${size}%`;
    }
  }, []);

  const changeFontSize = (delta: number) => {
    const newSize = Math.max(75, Math.min(150, fontSize + delta));
    setFontSize(newSize);
    localStorage.setItem('font-size', String(newSize));
    document.documentElement.style.fontSize = `${newSize}%`;
  };

  return (
    <div className={cn("flex items-center space-x-2", className)} data-testid="font-size-control">
      <AccessibleButton
        onClick={() => changeFontSize(-25)}
        disabled={fontSize <= 75}
        variant="secondary"
        size="sm"
        aria-label="Decrease font size"
        data-testid="decrease-font-size"
      >
        A-
      </AccessibleButton>
      
      <span 
        className="text-sm font-medium min-w-[60px] text-center"
        role="status"
        aria-live="polite"
        aria-label={`Current font size: ${fontSize}%`}
      >
        {fontSize}%
      </span>
      
      <AccessibleButton
        onClick={() => changeFontSize(25)}
        disabled={fontSize >= 150}
        variant="secondary"
        size="sm"
        aria-label="Increase font size"
        data-testid="increase-font-size"
      >
        A+
      </AccessibleButton>
    </div>
  );
}

// Screen Reader Announcements
interface ScreenReaderAnnouncementProps {
  message: string;
  priority?: 'polite' | 'assertive';
  clearAfter?: number;
}

export function ScreenReaderAnnouncement({
  message,
  priority = 'polite',
  clearAfter = 5000
}: ScreenReaderAnnouncementProps) {
  const [currentMessage, setCurrentMessage] = useState('');

  useEffect(() => {
    if (message) {
      setCurrentMessage(message);
      
      if (clearAfter > 0) {
        const timer = setTimeout(() => {
          setCurrentMessage('');
        }, clearAfter);
        
        return () => clearTimeout(timer);
      }
    }
  }, [message, clearAfter]);

  return (
    <div
      role="status"
      aria-live={priority}
      className="sr-only"
      data-testid="screen-reader-announcement"
    >
      {currentMessage}
    </div>
  );
}

// Keyboard Navigation Helper
interface KeyboardNavigationProps {
  children: React.ReactNode;
  onEscape?: () => void;
  trapFocus?: boolean;
  className?: string;
}

export function KeyboardNavigation({
  children,
  onEscape,
  trapFocus = false,
  className
}: KeyboardNavigationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        onEscape();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onEscape]);

  // Focus trapping for modals
  useEffect(() => {
    if (!trapFocus || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement?.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement?.focus();
            e.preventDefault();
          }
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [trapFocus]);

  return (
    <div
      ref={containerRef}
      className={className}
      data-testid="keyboard-navigation"
    >
      {children}
    </div>
  );
}

// Accessible Form Field
interface AccessibleFormFieldProps {
  label: string;
  error?: string;
  success?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function AccessibleFormField({
  label,
  error,
  success,
  required = false,
  children,
  className
}: AccessibleFormFieldProps) {
  const fieldId = useRef(`field-${Math.random().toString(36).substr(2, 9)}`);
  const errorId = useRef(`error-${fieldId.current}`);
  const successId = useRef(`success-${fieldId.current}`);

  // Clone children with accessibility attributes
  const enhancedChildren = React.cloneElement(children as React.ReactElement, {
    id: fieldId.current,
    'aria-describedby': error ? errorId.current : success ? successId.current : undefined,
    'aria-invalid': error ? 'true' : 'false',
    'aria-required': required ? 'true' : 'false'
  });

  return (
    <div className={cn("space-y-2", className)} data-testid="accessible-form-field">
      <label
        htmlFor={fieldId.current}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>

      {enhancedChildren}

      {error && (
        <div
          id={errorId.current}
          className="text-sm text-red-600 flex items-center"
          role="alert"
          aria-live="polite"
        >
          <span className="mr-1" aria-hidden="true">⚠️</span>
          {error}
        </div>
      )}

      {success && !error && (
        <div
          id={successId.current}
          className="text-sm text-green-600 flex items-center"
          role="status"
          aria-live="polite"
        >
          <span className="mr-1" aria-hidden="true">✅</span>
          {success}
        </div>
      )}
    </div>
  );
}

// Skip to Content Link
interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function SkipLink({ href, children, className }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4",
        "bg-blue-600 text-white px-4 py-2 rounded-lg z-50",
        "focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600",
        className
      )}
      data-testid="skip-link"
    >
      {children}
    </a>
  );
}

// Accessibility Status Indicator
interface AccessibilityStatusProps {
  className?: string;
}

export function AccessibilityStatus({ className }: AccessibilityStatusProps) {
  const [status, setStatus] = useState({
    highContrast: false,
    reducedMotion: false,
    fontSize: 100
  });

  useEffect(() => {
    // Check high contrast
    const highContrast = localStorage.getItem('high-contrast') === 'true';
    
    // Check reduced motion
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Check font size
    const fontSize = parseInt(localStorage.getItem('font-size') || '100');

    setStatus({ highContrast, reducedMotion, fontSize });
  }, []);

  const hasAccessibilitySettings = 
    status.highContrast || status.reducedMotion || status.fontSize !== 100;

  if (!hasAccessibilitySettings) return null;

  return (
    <div
      className={cn(
        "text-xs text-gray-600 flex items-center space-x-2 p-2 bg-gray-50 rounded",
        className
      )}
      role="status"
      aria-label="Accessibility settings active"
      data-testid="accessibility-status"
    >
      <span className="font-medium">Active:</span>
      {status.highContrast && <span>High Contrast</span>}
      {status.reducedMotion && <span>Reduced Motion</span>}
      {status.fontSize !== 100 && <span>Font Size: {status.fontSize}%</span>}
    </div>
  );
}