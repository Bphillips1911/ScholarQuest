import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';

// Mobile-optimized Tab Navigation
interface MobileTabsProps {
  tabs: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    count?: number;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  position?: 'top' | 'bottom';
  className?: string;
}

export function MobileTabs({
  tabs,
  activeTab,
  onTabChange,
  position = 'bottom',
  className
}: MobileTabsProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Handle swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    
    if (isLeftSwipe && currentIndex < tabs.length - 1) {
      onTabChange(tabs[currentIndex + 1].id);
    }
    
    if (isRightSwipe && currentIndex > 0) {
      onTabChange(tabs[currentIndex - 1].id);
    }
  };

  return (
    <div 
      className={cn(
        "w-full bg-white border-gray-200 safe-area-padding",
        {
          'border-t': position === 'bottom',
          'border-b': position === 'top'
        },
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      data-testid="mobile-tabs"
    >
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            className={cn(
              "flex flex-col items-center px-3 py-2 rounded-lg min-h-[60px] min-w-[60px]",
              "transition-colors duration-200 relative",
              {
                'text-blue-600 bg-blue-50': activeTab === tab.id,
                'text-gray-600 hover:text-gray-800 hover:bg-gray-50': activeTab !== tab.id
              }
            )}
            onClick={() => onTabChange(tab.id)}
            whileTap={{ scale: 0.95 }}
            data-testid={`mobile-tab-${tab.id}`}
          >
            {/* Tab Icon */}
            {tab.icon && (
              <motion.div
                className="text-xl mb-1"
                animate={{
                  scale: activeTab === tab.id ? 1.1 : 1,
                  color: activeTab === tab.id ? '#2563eb' : '#6b7280'
                }}
                transition={{ duration: 0.2 }}
              >
                {tab.icon}
              </motion.div>
            )}

            {/* Tab Label */}
            <span className="text-xs font-medium text-center leading-tight">
              {tab.label}
            </span>

            {/* Badge Count */}
            {tab.count !== undefined && tab.count > 0 && (
              <motion.div
                className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileTap={{ scale: 1.2 }}
              >
                {tab.count > 99 ? '99+' : tab.count}
              </motion.div>
            )}

            {/* Active Indicator */}
            {activeTab === tab.id && (
              <motion.div
                className="absolute bottom-0 left-1/2 w-8 h-1 bg-blue-600 rounded-full"
                layoutId="activeTabIndicator"
                style={{ x: '-50%' }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// Pull-to-Refresh Component
interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
  className?: string;
}

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  className
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDragEnd = async (event: any, info: PanInfo) => {
    if (info.offset.y > threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  const handleDrag = (event: any, info: PanInfo) => {
    if (info.offset.y > 0 && containerRef.current?.scrollTop === 0) {
      setPullDistance(Math.max(0, Math.min(info.offset.y, threshold * 1.5)));
    }
  };

  return (
    <motion.div
      ref={containerRef}
      className={cn("relative overflow-auto", className)}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      data-testid="pull-to-refresh"
    >
      {/* Pull-to-refresh indicator */}
      <AnimatePresence>
        {(pullDistance > 0 || isRefreshing) && (
          <motion.div
            className="absolute top-0 left-0 right-0 flex items-center justify-center py-4 bg-blue-50 z-10"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            style={{ height: Math.max(pullDistance, 50) }}
          >
            <div className="flex items-center space-x-2 text-blue-600">
              <motion.div
                animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
                transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
                className="text-xl"
              >
                🔄
              </motion.div>
              <span className="font-medium">
                {isRefreshing ? 'Refreshing...' : pullDistance > threshold ? 'Release to refresh' : 'Pull to refresh'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div style={{ marginTop: pullDistance > 0 ? pullDistance : 0 }}>
        {children}
      </div>
    </motion.div>
  );
}

// Touch-optimized Card Grid
interface TouchCardGridProps {
  cards: Array<{
    id: string;
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    color?: string;
    onClick?: () => void;
  }>;
  columns?: 1 | 2 | 3;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TouchCardGrid({
  cards,
  columns = 2,
  gap = 'md',
  className
}: TouchCardGridProps) {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  };

  return (
    <div 
      className={cn(
        "grid w-full",
        `grid-cols-${columns}`,
        gapClasses[gap],
        className
      )}
      data-testid="touch-card-grid"
    >
      {cards.map((card) => (
        <motion.div
          key={card.id}
          className={cn(
            "relative bg-white rounded-xl p-4 shadow-sm border border-gray-200",
            "min-h-[120px] touch-manipulation cursor-pointer",
            "active:scale-95 transition-transform duration-150"
          )}
          onClick={card.onClick}
          whileTap={{ scale: 0.95 }}
          style={{ backgroundColor: card.color ? `${card.color}10` : undefined }}
          data-testid={`touch-card-${card.id}`}
        >
          {/* Card Icon */}
          {card.icon && (
            <div className="text-3xl mb-2" style={{ color: card.color }}>
              {card.icon}
            </div>
          )}

          {/* Card Content */}
          <div className="space-y-1">
            <h3 className="font-semibold text-gray-800 leading-tight">
              {card.title}
            </h3>
            {card.subtitle && (
              <p className="text-sm text-gray-600 leading-tight">
                {card.subtitle}
              </p>
            )}
          </div>

          {/* Touch ripple effect */}
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{ backgroundColor: card.color || '#3b82f6' }}
            initial={{ opacity: 0, scale: 0 }}
            whileTap={{ opacity: 0.1, scale: 1 }}
            transition={{ duration: 0.1 }}
          />
        </motion.div>
      ))}
    </div>
  );
}

// Mobile-optimized Modal
interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'full' | 'large' | 'medium';
  showCloseButton?: boolean;
}

export function MobileModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'large',
  showCloseButton = true
}: MobileModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const sizeClasses = {
    full: 'inset-0 rounded-none',
    large: 'inset-x-0 bottom-0 top-20 rounded-t-2xl',
    medium: 'inset-x-4 bottom-4 top-1/3 rounded-2xl'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            data-testid="mobile-modal-backdrop"
          />

          {/* Modal */}
          <motion.div
            className={cn(
              "fixed bg-white z-50 flex flex-col safe-area-padding",
              sizeClasses[size]
            )}
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: "tween", duration: 0.3 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(event, info) => {
              if (info.offset.y > 100) {
                onClose();
              }
            }}
            data-testid="mobile-modal"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              {/* Drag Handle */}
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-10 h-1 bg-gray-300 rounded-full" />

              <h2 className="text-lg font-semibold text-gray-800 flex-1 text-center">
                {title}
              </h2>

              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
                  data-testid="mobile-modal-close"
                >
                  ×
                </button>
              )}
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Swipeable Card Stack
interface SwipeableCardProps {
  cards: Array<{
    id: string;
    content: React.ReactNode;
  }>;
  onSwipeLeft?: (cardId: string) => void;
  onSwipeRight?: (cardId: string) => void;
  className?: string;
}

export function SwipeableCards({
  cards,
  onSwipeLeft,
  onSwipeRight,
  className
}: SwipeableCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);

  const handleDragEnd = (event: any, info: PanInfo) => {
    const { offset, velocity } = info;
    const swipe = Math.abs(offset.x) * velocity.x;

    if (swipe < -10000) {
      // Swipe left
      setExitDirection('left');
      onSwipeLeft?.(cards[currentIndex]?.id);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % cards.length);
        setExitDirection(null);
      }, 200);
    } else if (swipe > 10000) {
      // Swipe right
      setExitDirection('right');
      onSwipeRight?.(cards[currentIndex]?.id);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % cards.length);
        setExitDirection(null);
      }, 200);
    }
  };

  if (!cards.length) return null;

  return (
    <div className={cn("relative h-96 overflow-hidden", className)} data-testid="swipeable-cards">
      <AnimatePresence>
        {cards.map((card, index) => {
          if (index !== currentIndex && !exitDirection) return null;

          return (
            <motion.div
              key={card.id}
              className="absolute inset-0 bg-white rounded-xl shadow-lg border border-gray-200 p-6 cursor-grab active:cursor-grabbing"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={handleDragEnd}
              initial={{ scale: 1, rotate: 0 }}
              animate={{
                scale: index === currentIndex ? 1 : 0.95,
                rotate: index === currentIndex ? 0 : (index - currentIndex) * 5,
                zIndex: cards.length - index
              }}
              exit={{
                x: exitDirection === 'left' ? -1000 : exitDirection === 'right' ? 1000 : 0,
                opacity: 0,
                rotate: exitDirection === 'left' ? -30 : exitDirection === 'right' ? 30 : 0
              }}
              transition={{ duration: 0.3 }}
              data-testid={`swipeable-card-${card.id}`}
            >
              {card.content}

              {/* Swipe indicators */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                initial={{ opacity: 0 }}
                whileDrag={{ opacity: 1 }}
              >
                <div className="text-4xl">👈 Swipe 👉</div>
              </motion.div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Card indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {cards.map((_, index) => (
          <div
            key={index}
            className={cn(
              "w-2 h-2 rounded-full transition-colors",
              index === currentIndex ? "bg-blue-600" : "bg-gray-300"
            )}
          />
        ))}
      </div>
    </div>
  );
}

// Safe Area Padding Utility Component
interface SafeAreaProps {
  children: React.ReactNode;
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
  className?: string;
}

export function SafeArea({
  children,
  top = true,
  bottom = true,
  left = true,
  right = true,
  className
}: SafeAreaProps) {
  const paddingClasses = cn(
    {
      'pt-safe': top,
      'pb-safe': bottom,
      'pl-safe': left,
      'pr-safe': right
    },
    className
  );

  return (
    <div className={paddingClasses} data-testid="safe-area">
      {children}
    </div>
  );
}