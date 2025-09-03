import React, { useState } from 'react';
import { NotificationBell, NotificationPanel, useNotifications } from '@/components/NotificationSystem';
import { notificationService } from '@/services/notificationService';

// Notification header component that can be added to any page
export const NotificationHeader: React.FC<{
  className?: string;
}> = ({ className }) => {
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const { addNotification } = useNotifications();

  // Connect the notification service to the notification context
  React.useEffect(() => {
    notificationService.setNotificationCallback(addNotification);
  }, [addNotification]);

  return (
    <>
      <div className={className}>
        <NotificationBell
          onClick={() => setIsNotificationPanelOpen(true)}
          className="relative"
        />
      </div>
      
      <NotificationPanel
        isOpen={isNotificationPanelOpen}
        onClose={() => setIsNotificationPanelOpen(false)}
      />
    </>
  );
};