import sgMail from '@sendgrid/mail';

// Set SendGrid API Key from environment variable
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface SmsNotification {
  to: string;
  content: string;
  messageType: 'teacher_message' | 'pbis_achievement' | 'house_update' | 'general';
}

export class SmsService {
  private static instance: SmsService;
  
  private constructor() {}
  
  public static getInstance(): SmsService {
    if (!SmsService.instance) {
      SmsService.instance = new SmsService();
    }
    return SmsService.instance;
  }
  
  async sendSms(notification: SmsNotification): Promise<boolean> {
    try {
      // In a real implementation, you'd use a service like Twilio for SMS
      // For now, we'll send an email notification instead
      if (!process.env.SENDGRID_API_KEY) {
        console.log('SendGrid API key not configured. Would send SMS:', notification.content, 'to', notification.to);
        return false;
      }
      
      const msg = {
        to: notification.to, // Assuming this is an email for now
        from: 'BHSAHouses25@gmail.com', // Verified sender address
        subject: `BHSA PBIS Notification - ${this.getMessageTypeLabel(notification.messageType)}`,
        text: notification.content,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #1e40af; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">Bush Hills STEAM Academy</h1>
              <p style="margin: 5px 0 0 0;">PBIS House of Champions</p>
            </div>
            <div style="padding: 20px; background-color: #f9fafb;">
              <div style="background-color: white; padding: 20px; border-radius: 8px; border-left: 4px solid #1e40af;">
                <h2 style="color: #1e40af; margin-top: 0;">${this.getMessageTypeLabel(notification.messageType)}</h2>
                <p style="color: #374151; line-height: 1.6;">${notification.content}</p>
              </div>
              <div style="margin-top: 20px; padding: 15px; background-color: #eff6ff; border-radius: 8px;">
                <p style="margin: 0; color: #1e40af; font-size: 14px;">
                  <strong>📱 SMS Alternative:</strong> To receive these notifications via text message instead of email, 
                  please contact the school office to set up SMS notifications.
                </p>
              </div>
            </div>
            <div style="background-color: #374151; color: white; padding: 15px; text-align: center; font-size: 12px;">
              <p style="margin: 0;">Bush Hills STEAM Academy • PBIS House of Champions Program</p>
            </div>
          </div>
        `,
      };
      
      await sgMail.send(msg);
      console.log('Notification sent successfully to:', notification.to);
      return true;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return false;
    }
  }
  
  private getMessageTypeLabel(messageType: string): string {
    switch (messageType) {
      case 'teacher_message': return 'Teacher Message';
      case 'pbis_achievement': return 'MUSTANG Achievement';
      case 'house_update': return 'House Competition Update';
      case 'general': return 'School Announcement';
      default: return 'Notification';
    }
  }
  
  async sendPbisAchievementNotification(parentPhone: string, studentName: string, achievement: string, points: number): Promise<boolean> {
    const content = `🏆 Great news! ${studentName} earned ${points} points for ${achievement}. Way to show MUSTANG pride!`;
    
    return this.sendSms({
      to: parentPhone,
      content,
      messageType: 'pbis_achievement',
    });
  }
  
  async sendTeacherMessageNotification(parentPhone: string, teacherName: string, subject: string): Promise<boolean> {
    const content = `📚 New message from ${teacherName}: "${subject}". Please check your parent portal for details.`;
    
    return this.sendSms({
      to: parentPhone,
      content,
      messageType: 'teacher_message',
    });
  }
  
  async sendHouseUpdateNotification(parentPhone: string, houseName: string, update: string): Promise<boolean> {
    const content = `🏠 ${houseName} update: ${update}. Check the parent portal for full house standings!`;
    
    return this.sendSms({
      to: parentPhone,
      content,
      messageType: 'house_update',
    });
  }
}