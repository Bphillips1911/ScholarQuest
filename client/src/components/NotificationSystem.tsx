import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { X, Bell, CheckCircle, AlertTriangle, Info, Star, Users, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

// Notification types with their visual styles
export type NotificationType = 
  | 'success' 
  | 'warning' 
  | 'info' 
  | 'achievement' 
  | 'pbis' 
  | 'reflection' 
  | 'student_update'
  | 'teacher_update'
  | 'house_update';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  actionUrl?: string;
  metadata?: {
    studentName?: string;
    teacherName?: string;
    houseName?: string;
    points?: number;
    [key: string]: any;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Notification icon mapping
const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    case 'info':
      return <Info className="w-5 h-5 text-blue-500" />;
    case 'achievement':
      return <Star className="w-5 h-5 text-purple-500" />;
    case 'pbis':
      return <Star className="w-5 h-5 text-gold-500" />;
    case 'reflection':
      return <BookOpen className="w-5 h-5 text-orange-500" />;
    case 'student_update':
      return <Users className="w-5 h-5 text-cyan-500" />;
    case 'teacher_update':
      return <Users className="w-5 h-5 text-indigo-500" />;
    case 'house_update':
      return <Users className="w-5 h-5 text-emerald-500" />;
    default:
      return <Bell className="w-5 h-5 text-gray-500" />;
  }
};

// Notification style mapping
const getNotificationStyles = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800';
    case 'warning':
      return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800';
    case 'info':
      return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800';
    case 'achievement':
      return 'border-purple-200 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-800';
    case 'pbis':
      return 'border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 dark:border-yellow-800';
    case 'reflection':
      return 'border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800';
    case 'student_update':
      return 'border-cyan-200 bg-cyan-50 dark:bg-cyan-900/20 dark:border-cyan-800';
    case 'teacher_update':
      return 'border-indigo-200 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-800';
    case 'house_update':
      return 'border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800';
    default:
      return 'border-gray-200 bg-gray-50 dark:bg-gray-900/20 dark:border-gray-800';
  }
};

// Individual notification component
const NotificationItem: React.FC<{
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onRemove: (id: string) => void;
}> = ({ notification, onMarkAsRead, onRemove }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(notification.id);
    }, 300);
  };

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border p-4 shadow-sm transition-all duration-300 cursor-pointer hover:shadow-md',
        getNotificationStyles(notification.type),
        !notification.isRead && 'ring-2 ring-blue-200 dark:ring-blue-800',
        isRemoving && 'opacity-0 transform scale-95'
      )}
      onClick={handleClick}
    >
      {!notification.isRead && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
      )}
      
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {notification.title}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            {notification.message}
          </p>
          
          {notification.metadata && (
            <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
              {notification.metadata.studentName && (
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                  Student: {notification.metadata.studentName}
                </span>
              )}
              {notification.metadata.teacherName && (
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                  Teacher: {notification.metadata.teacherName}
                </span>
              )}
              {notification.metadata.houseName && (
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                  House: {notification.metadata.houseName}
                </span>
              )}
              {notification.metadata.points && (
                <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded">
                  +{notification.metadata.points} points
                </span>
              )}
            </div>
          )}
          
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            {new Date(notification.timestamp).toLocaleString()}
          </div>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRemove();
          }}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Toast notification component for real-time updates
const ToastNotification: React.FC<{
  notification: Notification;
  onRemove: (id: string) => void;
}> = ({ notification, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onRemove(notification.id), 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [notification.id, onRemove]);

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 max-w-sm rounded-lg border p-4 shadow-lg transition-all duration-300',
        getNotificationStyles(notification.type),
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {notification.title}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {notification.message}
          </p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onRemove(notification.id), 300);
          }}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Main notification provider
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toastNotifications, setToastNotifications] = useState<Notification[]>([]);

  const addNotification = (notificationData: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    const notification: Notification = {
      ...notificationData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      isRead: false,
    };

    setNotifications(prev => [notification, ...prev]);
    setToastNotifications(prev => [notification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const removeToastNotification = (id: string) => {
    setToastNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
    setToastNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
      }}
    >
      {children}
      
      {/* Toast notifications container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toastNotifications.map(notification => (
          <ToastNotification
            key={notification.id}
            notification={notification}
            onRemove={removeToastNotification}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

// Notification panel component
export const NotificationPanel: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { notifications, markAsRead, removeNotification, markAllAsRead, clearAll } = useNotifications();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-96 bg-white dark:bg-gray-900 shadow-xl">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Notifications
          </h2>
          <div className="flex items-center space-x-2">
            {notifications.length > 0 && (
              <>
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Mark all read
                </button>
                <button
                  onClick={clearAll}
                  className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                  Clear all
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="h-full overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onRemove={removeNotification}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Notification bell icon with badge
export const NotificationBell: React.FC<{
  onClick: () => void;
  className?: string;
}> = ({ onClick, className }) => {
  const { unreadCount } = useNotifications();

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 transition-colors',
        className
      )}
    >
      <Bell className="w-6 h-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};