import { queryClient } from './queryClient';

// Real-time synchronization system for immediate updates across all accounts
class RealTimeSync {
  private static instance: RealTimeSync;
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  static getInstance(): RealTimeSync {
    if (!RealTimeSync.instance) {
      RealTimeSync.instance = new RealTimeSync();
    }
    return RealTimeSync.instance;
  }

  // Initialize real-time sync system
  init() {
    this.setupEventSource();
    this.setupVisibilityChangeHandler();
    this.setupBeforeUnloadHandler();
  }

  // Setup Server-Sent Events for real-time updates
  private setupEventSource() {
    try {
      this.eventSource = new EventSource('/api/realtime/updates');
      
      this.eventSource.onopen = () => {
        console.log('Real-time sync connected');
        this.reconnectAttempts = 0;
      };

      this.eventSource.onmessage = (event) => {
        this.handleRealtimeUpdate(event);
      };

      this.eventSource.onerror = () => {
        console.log('Real-time sync connection error');
        this.handleConnectionError();
      };
    } catch (error) {
      console.log('EventSource not supported, falling back to polling');
      this.setupPolling();
    }
  }

  // Handle real-time update events
  private handleRealtimeUpdate(event: MessageEvent) {
    try {
      const update = JSON.parse(event.data);
      
      switch (update.type) {
        case 'STUDENT_UPDATE':
          this.invalidateStudentQueries(update.studentId);
          break;
        case 'TEACHER_UPDATE':
          this.invalidateTeacherQueries(update.teacherId);
          break;
        case 'HOUSE_UPDATE':
          this.invalidateHouseQueries();
          break;
        case 'PBIS_UPDATE':
          this.invalidatePBISQueries(update.studentId);
          break;
        case 'REFLECTION_UPDATE':
          this.invalidateReflectionQueries(update.studentId);
          break;
        case 'ADMIN_UPDATE':
          this.invalidateAdminQueries();
          break;
        case 'GLOBAL_UPDATE':
          this.invalidateAllQueries();
          break;
        default:
          console.log('Unknown update type:', update.type);
      }
    } catch (error) {
      console.error('Error processing real-time update:', error);
    }
  }

  // Invalidate specific student queries
  private invalidateStudentQueries(studentId?: string) {
    if (studentId) {
      queryClient.invalidateQueries({ queryKey: ['/api/student', studentId] });
      queryClient.invalidateQueries({ queryKey: ['/api/scholars', studentId, 'pbis'] });
      queryClient.invalidateQueries({ queryKey: ['/api/student/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/student/reflections', studentId] });
      queryClient.invalidateQueries({ queryKey: ['/api/student/reflections'] });
      queryClient.invalidateQueries({ queryKey: ['/api/student/sel/lessons'] });
      queryClient.invalidateQueries({ queryKey: ['/api/achievements/student', studentId] });
      queryClient.invalidateQueries({ queryKey: ['/api/student/skill-tree', studentId] });
    }
    queryClient.invalidateQueries({ queryKey: ['/api/scholars'] });
    queryClient.invalidateQueries({ queryKey: ['/api/houses'] });
  }

  // Invalidate teacher-related queries
  private invalidateTeacherQueries(teacherId?: string) {
    queryClient.invalidateQueries({ queryKey: ['/api/teacher'] });
    queryClient.invalidateQueries({ queryKey: ['/api/teacher/messages'] });
    queryClient.invalidateQueries({ queryKey: ['/api/teacher/reflections'] });
    queryClient.invalidateQueries({ queryKey: ['/api/teacher/parents'] });
    queryClient.invalidateQueries({ queryKey: ['/api/teacher/administrators'] });
    if (teacherId) {
      queryClient.invalidateQueries({ queryKey: ['/api/teacher', teacherId] });
    }
  }

  // Invalidate house-related queries
  private invalidateHouseQueries() {
    queryClient.invalidateQueries({ queryKey: ['/api/houses'] });
    queryClient.invalidateQueries({ queryKey: ['/api/scholars'] });
  }

  // Invalidate PBIS-related queries - FIXED for all student dashboards
  private invalidatePBISQueries(studentId?: string) {
    queryClient.invalidateQueries({ queryKey: ['/api/pbis-photos'] });
    if (studentId) {
      // Force refresh ALL student PBIS data
      queryClient.invalidateQueries({ queryKey: ['/api/scholars', studentId, 'pbis'] });
      queryClient.refetchQueries({ queryKey: ['/api/scholars', studentId, 'pbis'] });
      queryClient.invalidateQueries({ queryKey: ['/api/student/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/student/sel/lessons'] });
    }
    queryClient.invalidateQueries({ queryKey: ['/api/houses'] });
    queryClient.invalidateQueries({ queryKey: ['/api/scholars'] });
    queryClient.invalidateQueries({ queryKey: ['/api/pbis'] });
  }

  // Invalidate reflection-related queries
  private invalidateReflectionQueries(studentId?: string) {
    queryClient.invalidateQueries({ queryKey: ['/api/teacher/reflections'] });
    if (studentId) {
      queryClient.invalidateQueries({ queryKey: ['/api/student/reflections', studentId] });
    }
  }

  // Invalidate admin-related queries
  private invalidateAdminQueries() {
    queryClient.invalidateQueries({ queryKey: ['/api/admin'] });
    queryClient.invalidateQueries({ queryKey: ['/api/teacher'] });
    queryClient.invalidateQueries({ queryKey: ['/api/scholars'] });
    queryClient.invalidateQueries({ queryKey: ['/api/houses'] });
    queryClient.invalidateQueries({ queryKey: ['/api/pbis-photos'] });
  }

  // Invalidate all queries for global updates
  private invalidateAllQueries() {
    queryClient.invalidateQueries();
    queryClient.refetchQueries();
  }

  // Handle connection errors and implement reconnection logic
  private handleConnectionError() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.setupEventSource();
      }, delay);
    } else {
      console.log('Max reconnection attempts reached, falling back to polling');
      this.setupPolling();
    }
  }

  // Fallback polling system for real-time updates
  private setupPolling() {
    setInterval(() => {
      // Poll for updates every 10 seconds as fallback
      this.checkForUpdates();
    }, 10000);
  }

  // Check for updates via polling
  private async checkForUpdates() {
    try {
      const response = await fetch('/api/realtime/check-updates', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const updates = await response.json();
        if (updates.hasUpdates) {
          // Invalidate all queries if updates are detected
          this.invalidateAllQueries();
        }
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  }

  // Handle visibility change to refresh data when user returns
  private setupVisibilityChangeHandler() {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // User returned to the tab, refresh all data
        queryClient.invalidateQueries();
      }
    });
  }

  // Handle page unload to clean up connections
  private setupBeforeUnloadHandler() {
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }

  // Manual trigger for immediate sync (for critical updates)
  public triggerSync(updateType: string, data?: any) {
    switch (updateType) {
      case 'student':
        this.invalidateStudentQueries(data?.studentId);
        break;
      case 'teacher':
        this.invalidateTeacherQueries(data?.teacherId);
        break;
      case 'house':
        this.invalidateHouseQueries();
        break;
      case 'pbis':
        this.invalidatePBISQueries(data?.studentId);
        break;
      case 'reflection':
        this.invalidateReflectionQueries(data?.studentId);
        break;
      case 'admin':
        this.invalidateAdminQueries();
        break;
      case 'global':
        this.invalidateAllQueries();
        break;
    }
  }

  // Cleanup connections
  private cleanup() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

// Export singleton instance
export const realTimeSync = RealTimeSync.getInstance();

// Auto-initialize when module is imported
if (typeof window !== 'undefined') {
  realTimeSync.init();
}