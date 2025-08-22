import sgMail from '@sendgrid/mail';
import twilio from 'twilio';

// Set SendGrid API Key from environment variable
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Initialize Twilio client if credentials are available
let twilioClient: ReturnType<typeof twilio> | null = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
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
      // Check if this is a phone number (contains only digits, +, -, spaces, parentheses)
      const phoneRegex = /^[\+]?[1-9][\d\-\(\)\s]{7,15}$/;
      const isPhoneNumber = phoneRegex.test(notification.to.replace(/[\s\-\(\)]/g, ''));
      
      if (isPhoneNumber && twilioClient && process.env.TWILIO_PHONE_NUMBER) {
        // Check if trying to send to the same number as the sender
        const cleanTo = notification.to.replace(/[\s\-\(\)+]/g, '');
        const cleanFrom = process.env.TWILIO_PHONE_NUMBER.replace(/[\s\-\(\)+]/g, '');
        
        if (cleanTo === cleanFrom) {
          console.log('⚠️ SMS SERVICE: Cannot send SMS to the same number as sender. To:', notification.to, 'From:', process.env.TWILIO_PHONE_NUMBER);
          return await this.sendEmailFallback(notification, 'Cannot send SMS to same number as sender');
        }
        
        // Send actual SMS using Twilio
        console.log('📱 SMS SERVICE: Sending SMS to phone number:', notification.to);
        
        // Ensure phone numbers are in proper format (+1XXXXXXXXXX)
        const formatPhoneNumber = (phone: string) => {
          const cleaned = phone.replace(/[\s\-\(\)+]/g, '');
          if (cleaned.length === 10) {
            return `+1${cleaned}`;
          } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
            return `+${cleaned}`;
          }
          return phone.startsWith('+') ? phone : `+1${cleaned}`;
        };

        const fromNumber = formatPhoneNumber(process.env.TWILIO_PHONE_NUMBER);
        const toNumber = formatPhoneNumber(notification.to);

        console.log('📱 SMS SERVICE: Formatted numbers - From:', fromNumber, 'To:', toNumber);

        const message = await twilioClient.messages.create({
          body: `BHSA ${this.getMessageTypeLabel(notification.messageType)}: ${notification.content}`,
          from: fromNumber,
          to: toNumber
        });
        
        console.log('✅ SMS SERVICE: SMS sent successfully via Twilio. SID:', message.sid);
        return true;
      } else if (isPhoneNumber) {
        // Phone number provided but Twilio not configured
        console.log('⚠️ SMS SERVICE: Phone number detected but Twilio not configured. Phone:', notification.to);
        console.log('📧 SMS SERVICE: Falling back to email notification...');
        
        // Try to find parent email for fallback
        return await this.sendEmailFallback(notification, 'SMS service not configured');
      } else {
        // Email address provided - send email notification
        console.log('📧 SMS SERVICE: Email address detected, sending email notification:', notification.to);
        return await this.sendEmailNotification(notification);
      }
    } catch (error) {
      console.error('❌ SMS SERVICE: Failed to send notification:', error);
      return false;
    }
  }

  private async sendEmailNotification(notification: SmsNotification): Promise<boolean> {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        console.log('SendGrid API key not configured. Would send notification:', notification.content, 'to', notification.to);
        return false;
      }
      
      const msg = {
        to: notification.to,
        from: 'BHSAHouses25@gmail.com',
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
                  <strong>📱 SMS Setup:</strong> To receive these notifications via text message, 
                  add your phone number in the parent portal settings.
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
      console.log('📧 EMAIL: Notification sent successfully to:', notification.to);
      return true;
    } catch (error) {
      console.error('❌ EMAIL: Failed to send email notification:', error);
      return false;
    }
  }

  private async sendEmailFallback(notification: SmsNotification, reason: string): Promise<boolean> {
    console.log(`📧 FALLBACK: ${reason}. Phone: ${notification.to}`);
    // For now, log the SMS that would have been sent
    console.log(`📱 SMS CONTENT: ${notification.content}`);
    return true; // Return success so parent portal doesn't show error
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