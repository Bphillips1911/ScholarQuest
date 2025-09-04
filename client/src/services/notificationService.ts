import { realTimeSync } from '@/lib/realTimeSync';
import type { Notification, NotificationType } from '@/components/NotificationSystem';

// Notification service for managing real-time notifications
class NotificationService {
  private static instance: NotificationService;
  private addNotificationCallback: ((notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void) | null = null;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Set the callback function to add notifications
  setNotificationCallback(callback: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void) {
    this.addNotificationCallback = callback;
  }

  // Create notification for PBIS point additions
  notifyPBISPointsAdded(data: {
    studentName: string;
    teacherName: string;
    points: number;
    houseName: string;
    behavior: string;
  }) {
    this.addNotification({
      type: 'pbis',
      title: '🌟 PBIS Points Earned!',
      message: `${data.studentName} earned ${data.points} points for ${data.behavior}`,
      metadata: {
        studentName: data.studentName,
        teacherName: data.teacherName,
        points: data.points,
        houseName: data.houseName,
        behavior: data.behavior,
      },
    });
  }

  // Create notification for negative PBIS points
  notifyNegativePBISPoints(data: {
    studentName: string;
    teacherName: string;
    points: number;
    reason: string;
    category: string;
  }) {
    this.addNotification({
      type: 'warning',
      title: '⚠️ PBIS Points Deducted',
      message: `${data.studentName} lost ${Math.abs(data.points)} points for ${data.reason}`,
      metadata: {
        studentName: data.studentName,
        teacherName: data.teacherName,
        points: data.points,
        reason: data.reason,
        category: data.category,
      },
    });
  }

  // Create notification for reflection assignments
  notifyReflectionAssigned(data: {
    studentName: string;
    teacherName: string;
    reason: string;
  }) {
    this.addNotification({
      type: 'reflection',
      title: '📝 Reflection Assigned',
      message: `${data.teacherName} assigned a reflection to ${data.studentName}`,
      metadata: {
        studentName: data.studentName,
        teacherName: data.teacherName,
        reason: data.reason,
      },
    });
  }

  // Create notification for reflection completions
  notifyReflectionCompleted(data: {
    studentName: string;
    teacherName: string;
  }) {
    this.addNotification({
      type: 'success',
      title: '✅ Reflection Completed',
      message: `${data.studentName} completed their reflection`,
      metadata: {
        studentName: data.studentName,
        teacherName: data.teacherName,
      },
    });
  }

  // Create notification for reflection approvals
  notifyReflectionApproved(data: {
    studentName: string;
    teacherName: string;
  }) {
    this.addNotification({
      type: 'achievement',
      title: '🎉 Reflection Approved',
      message: `${data.teacherName} approved ${data.studentName}'s reflection`,
      metadata: {
        studentName: data.studentName,
        teacherName: data.teacherName,
      },
    });
  }

  // Create notification for new student registrations
  notifyNewStudent(data: {
    studentName: string;
    houseName: string;
    grade: number;
  }) {
    this.addNotification({
      type: 'student_update',
      title: '👋 New Student Added',
      message: `${data.studentName} joined ${data.houseName} House`,
      metadata: {
        studentName: data.studentName,
        houseName: data.houseName,
        grade: data.grade,
      },
    });
  }

  // Create notification for house point updates
  notifyHouseUpdate(data: {
    houseName: string;
    totalPoints: number;
    changeAmount: number;
  }) {
    this.addNotification({
      type: 'house_update',
      title: '🏆 House Points Updated',
      message: `${data.houseName} House now has ${data.totalPoints} total points`,
      metadata: {
        houseName: data.houseName,
        totalPoints: data.totalPoints,
        changeAmount: data.changeAmount,
      },
    });
  }

  // Create notification for teacher actions
  notifyTeacherUpdate(data: {
    teacherName: string;
    action: string;
    target?: string;
  }) {
    this.addNotification({
      type: 'teacher_update',
      title: '👨‍🏫 Teacher Update',
      message: `${data.teacherName} ${data.action}${data.target ? ` for ${data.target}` : ''}`,
      metadata: {
        teacherName: data.teacherName,
        action: data.action,
        target: data.target,
      },
    });
  }

  // Create notification for achievements
  notifyAchievement(data: {
    studentName: string;
    achievementName: string;
    description: string;
  }) {
    this.addNotification({
      type: 'achievement',
      title: '🏅 Achievement Unlocked!',
      message: `${data.studentName} earned "${data.achievementName}"`,
      metadata: {
        studentName: data.studentName,
        achievementName: data.achievementName,
        description: data.description,
      },
    });
  }

  // Create notification for parent messages
  notifyParentMessage(data: {
    parentName: string;
    teacherName: string;
    studentName: string;
    preview: string;
  }) {
    this.addNotification({
      type: 'info',
      title: '💬 New Parent Message',
      message: `Message from ${data.parentName} about ${data.studentName}`,
      metadata: {
        parentName: data.parentName,
        teacherName: data.teacherName,
        studentName: data.studentName,
        preview: data.preview,
      },
    });
  }

  // Create notification for admin updates
  notifyAdminUpdate(data: {
    adminName: string;
    action: string;
    details: string;
  }) {
    this.addNotification({
      type: 'info',
      title: '⚙️ Admin Update',
      message: `${data.adminName} ${data.action}`,
      metadata: {
        adminName: data.adminName,
        action: data.action,
        details: data.details,
      },
    });
  }

  // Create custom notification
  notifyCustom(data: {
    type: NotificationType;
    title: string;
    message: string;
    metadata?: Record<string, any>;
  }) {
    this.addNotification(data);
  }

  // Generic method to add notification
  private addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) {
    if (this.addNotificationCallback) {
      this.addNotificationCallback(notification);
    }
  }

  // Initialize real-time notification listeners
  initializeRealTimeListeners() {
    // Listen for real-time updates and convert them to notifications
    const originalHandleUpdate = (realTimeSync as any).handleRealtimeUpdate;
    
    if (originalHandleUpdate) {
      (realTimeSync as any).handleRealtimeUpdate = (event: MessageEvent) => {
        // Call original handler first
        originalHandleUpdate.call(realTimeSync, event);
        
        // Then process for notifications
        try {
          const update = JSON.parse(event.data);
          this.processRealTimeUpdate(update);
        } catch (error) {
          console.error('Error processing real-time update for notifications:', error);
        }
      };
    }
  }

  // Process real-time updates and generate notifications
  private processRealTimeUpdate(update: any) {
    switch (update.type) {
      case 'PBIS_UPDATE':
        if (update.data?.action === 'points_added') {
          this.notifyPBISPointsAdded({
            studentName: update.data.studentName || 'Student',
            teacherName: update.data.teacherName || 'Teacher',
            points: update.data.points || 0,
            houseName: update.data.houseName || 'House',
            behavior: update.data.behavior || 'positive behavior',
          });
        } else if (update.data?.action === 'negative_points') {
          this.notifyNegativePBISPoints({
            studentName: update.data.studentName || 'Student',
            teacherName: update.data.teacherName || 'Teacher',
            points: update.data.points || 0,
            reason: update.data.reason || 'behavioral concern',
            category: update.data.category || 'behavior',
          });
        }
        break;

      case 'REFLECTION_UPDATE':
        if (update.data?.action === 'assigned') {
          this.notifyReflectionAssigned({
            studentName: update.data.studentName || 'Student',
            teacherName: update.data.teacherName || 'Teacher',
            reason: update.data.reason || 'behavioral reflection',
          });
        } else if (update.data?.action === 'approved') {
          this.notifyReflectionApproved({
            studentName: update.data.studentName || 'Student',
            teacherName: update.data.teacherName || 'Teacher',
          });
        }
        break;

      case 'STUDENT_UPDATE':
        if (update.data?.action === 'created') {
          this.notifyNewStudent({
            studentName: update.data.studentName || 'New Student',
            houseName: update.data.houseName || 'House',
            grade: update.data.grade || 0,
          });
        }
        break;

      case 'HOUSE_UPDATE':
        if (update.data?.action === 'points_updated') {
          this.notifyHouseUpdate({
            houseName: update.data.houseName || 'House',
            totalPoints: update.data.totalPoints || 0,
            changeAmount: update.data.changeAmount || 0,
          });
        }
        break;

      case 'GLOBAL_UPDATE':
        // Handle global updates that might need special notifications
        this.notifyCustom({
          type: 'info',
          title: '🔄 System Update',
          message: 'Data has been updated across the system',
          metadata: {
            updateType: update.data?.action || 'general_update',
          },
        });
        break;
    }
  }

  // Get user role for role-specific notifications
  private getUserRole(): string {
    const studentToken = localStorage.getItem('studentToken');
    const teacherToken = localStorage.getItem('teacherToken');
    const parentToken = localStorage.getItem('parentToken');
    const adminToken = localStorage.getItem('adminToken');

    if (studentToken) return 'student';
    if (teacherToken) return 'teacher';
    if (parentToken) return 'parent';
    if (adminToken) return 'admin';
    return 'guest';
  }

  // Check if user should receive notification based on role and preferences
  private shouldReceiveNotification(notificationType: NotificationType, userRole: string): boolean {
    // Define role-based notification rules
    const roleNotificationMap: Record<string, NotificationType[]> = {
      student: ['pbis', 'achievement', 'reflection', 'info'],
      teacher: ['pbis', 'reflection', 'student_update', 'info', 'teacher_update'],
      parent: ['pbis', 'reflection', 'achievement', 'info'],
      admin: ['pbis', 'reflection', 'student_update', 'teacher_update', 'house_update', 'info', 'achievement'],
    };

    return roleNotificationMap[userRole]?.includes(notificationType) || false;
  }
}

export const notificationService = NotificationService.getInstance();