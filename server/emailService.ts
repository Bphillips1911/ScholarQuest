import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable not set - email notifications will be disabled");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  try {
    mailService.setApiKey(process.env.SENDGRID_API_KEY);
  } catch (error) {
    console.warn("SendGrid API key configuration error:", error);
  }
}

// Administrator email - update this with your actual email address
const ADMIN_EMAIL = "bhsahouses25@gmail.com";
const FROM_EMAIL = "bhsahouses25@gmail.com"; // Must be verified in SendGrid dashboard

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('📧 Email would be sent:');
    console.log('  To:', params.to);
    console.log('  Subject:', params.subject);
    console.log('  (Email notifications disabled - no SendGrid API key configured)');
    return false;
  }

  try {
    const emailData = {
      personalizations: [
        {
          to: [{ email: params.to }],
          subject: params.subject,
        }
      ],
      from: { email: params.from },
      content: [
        ...(params.text ? [{ type: 'text/plain', value: params.text }] : []),
        ...(params.html ? [{ type: 'text/html', value: params.html }] : [])
      ],
      mail_settings: {
        sandbox_mode: {
          enable: false
        }
      }
    };
    
    await mailService.send(emailData);
    console.log('✅ Email sent successfully to:', params.to);
    return true;
  } catch (error: any) {
    console.error('❌ SendGrid email error:', error.message || error);
    console.error('❌ Full error object:', JSON.stringify(error, null, 2));
    
    // Check for common error types
    if (error.code === 403) {
      console.error('💡 Suggestion: Check your SendGrid API key permissions and sender verification');
      console.error('💡 Make sure API key has "Full Access" not "Restricted Access"');
      console.error('💡 Verify sender email in SendGrid dashboard under Sender Authentication');
    } else if (error.code === 401) {
      console.error('💡 Suggestion: Your SendGrid API key may be invalid or expired');
    }
    
    // Log email details for debugging
    console.log('📧 Attempted email details:');
    console.log('  To:', params.to);
    console.log('  From:', params.from);
    console.log('  Subject:', params.subject);
    
    return false;
  }
}

// Teacher Registration Alert
export async function sendTeacherRegistrationAlert(teacher: {
  firstName: string;
  lastName: string;
  email: string;
  gradeRole: string;
  subject?: string;
}): Promise<boolean> {
  const subject = `New Teacher Registration - ${teacher.firstName} ${teacher.lastName}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1f2937;">Bush Hills STEAM Academy - New Teacher Registration</h2>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #374151; margin-top: 0;">Teacher Information</h3>
        <p><strong>Name:</strong> ${teacher.firstName} ${teacher.lastName}</p>
        <p><strong>Email:</strong> ${teacher.email}</p>
        <p><strong>Grade Role:</strong> ${teacher.gradeRole}</p>
        ${teacher.subject ? `<p><strong>Subject:</strong> ${teacher.subject}</p>` : ''}
      </div>
      
      <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
        <p style="margin: 0; color: #92400e;">
          <strong>Action Required:</strong> Please review and approve this teacher registration in the admin portal.
        </p>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        This is an automated notification from the Bush Hills STEAM Academy PBIS House of Champions.
      </p>
    </div>
  `;
  
  const text = `
    Bush Hills STEAM Academy - New Teacher Registration
    
    Teacher Information:
    Name: ${teacher.firstName} ${teacher.lastName}
    Email: ${teacher.email}
    Grade Role: ${teacher.gradeRole}
    ${teacher.subject ? `Subject: ${teacher.subject}` : ''}
    
    Action Required: Please review and approve this teacher registration in the admin portal.
  `;

  return await sendEmail({
    to: ADMIN_EMAIL,
    from: FROM_EMAIL,
    subject,
    html,
    text
  });
}

// Parent Registration Alert
export async function sendParentRegistrationAlert(parent: {
  firstName: string;
  lastName: string;
  email: string;
  studentNames: string[];
}): Promise<boolean> {
  const subject = `New Parent Registration - ${parent.firstName} ${parent.lastName}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1f2937;">Bush Hills STEAM Academy - New Parent Registration</h2>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #374151; margin-top: 0;">Parent Information</h3>
        <p><strong>Name:</strong> ${parent.firstName} ${parent.lastName}</p>
        <p><strong>Email:</strong> ${parent.email}</p>
        <p><strong>Student(s):</strong> ${parent.studentNames.join(', ')}</p>
      </div>
      
      <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
        <p style="margin: 0; color: #1e40af;">
          <strong>Information:</strong> This parent has registered for the parent portal and can now view their student's progress.
        </p>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        This is an automated notification from the Bush Hills STEAM Academy PBIS House of Champions.
      </p>
    </div>
  `;
  
  const text = `
    Bush Hills STEAM Academy - New Parent Registration
    
    Parent Information:
    Name: ${parent.firstName} ${parent.lastName}
    Email: ${parent.email}
    Student(s): ${parent.studentNames.join(', ')}
    
    Information: This parent has registered for the parent portal and can now view their student's progress.
  `;

  return await sendEmail({
    to: ADMIN_EMAIL,
    from: FROM_EMAIL,
    subject,
    html,
    text
  });
}

// Student Registration Alert
export async function sendStudentRegistrationAlert(student: {
  firstName: string;
  lastName: string;
  studentId: string;
  grade: number;
  homeroom: string;
  username: string;
  houseName: string;
}): Promise<boolean> {
  const subject = `New Student Registration - ${student.firstName} ${student.lastName}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1f2937;">Bush Hills STEAM Academy - New Student Registration</h2>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #374151; margin-top: 0;">Student Information</h3>
        <p><strong>Name:</strong> ${student.firstName} ${student.lastName}</p>
        <p><strong>Student ID:</strong> ${student.studentId}</p>
        <p><strong>Grade:</strong> ${student.grade}</p>
        <p><strong>Homeroom Teacher:</strong> ${student.homeroom}</p>
        <p><strong>Username:</strong> ${student.username}</p>
        <p><strong>House Assignment:</strong> ${student.houseName}</p>
      </div>
      
      <div style="background-color: #dcfce7; padding: 15px; border-radius: 8px; border-left: 4px solid #16a34a;">
        <p style="margin: 0; color: #15803d;">
          <strong>Success:</strong> This student has successfully registered and been assigned to their house.
        </p>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        This is an automated notification from the Bush Hills STEAM Academy PBIS House of Champions.
      </p>
    </div>
  `;
  
  const text = `
    Bush Hills STEAM Academy - New Student Registration
    
    Student Information:
    Name: ${student.firstName} ${student.lastName}
    Student ID: ${student.studentId}
    Grade: ${student.grade}
    Homeroom Teacher: ${student.homeroom}
    Username: ${student.username}
    House Assignment: ${student.houseName}
    
    Success: This student has successfully registered and been assigned to their house.
  `;

  return await sendEmail({
    to: ADMIN_EMAIL,
    from: FROM_EMAIL,
    subject,
    html,
    text
  });
}

// Password Reset Request Alert
export async function sendPasswordResetAlert(request: {
  studentName: string;
  studentId: string;
  grade: number;
  teacherName: string;
  reason: string;
}): Promise<boolean> {
  const subject = `Password Reset Request - ${request.studentName}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1f2937;">Bush Hills STEAM Academy - Password Reset Request</h2>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #374151; margin-top: 0;">Reset Request Details</h3>
        <p><strong>Student:</strong> ${request.studentName}</p>
        <p><strong>Student ID:</strong> ${request.studentId}</p>
        <p><strong>Grade:</strong> ${request.grade}</p>
        <p><strong>Teacher:</strong> ${request.teacherName}</p>
        <p><strong>Reason:</strong> ${request.reason}</p>
      </div>
      
      <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
        <p style="margin: 0; color: #92400e;">
          <strong>Action Required:</strong> Please review this password reset request and assist the student if needed.
        </p>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        This is an automated notification from the Bush Hills STEAM Academy PBIS House of Champions.
      </p>
    </div>
  `;
  
  const text = `
    Bush Hills STEAM Academy - Password Reset Request
    
    Reset Request Details:
    Student: ${request.studentName}
    Student ID: ${request.studentId}
    Grade: ${request.grade}
    Teacher: ${request.teacherName}
    Reason: ${request.reason}
    
    Action Required: Please review this password reset request and assist the student if needed.
  `;

  return await sendEmail({
    to: ADMIN_EMAIL,
    from: FROM_EMAIL,
    subject,
    html,
    text
  });
}

// Teacher Password Reset Alert
export async function sendTeacherPasswordResetAlert(teacher: {
  name: string;
  email: string;
  gradeRole: string;
}): Promise<boolean> {
  const subject = `Teacher Password Reset Request - ${teacher.name}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1f2937;">Bush Hills STEAM Academy - Teacher Password Reset Request</h2>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #374151; margin-top: 0;">Reset Request Details</h3>
        <p><strong>Teacher:</strong> ${teacher.name}</p>
        <p><strong>Email:</strong> ${teacher.email}</p>
        <p><strong>Role:</strong> ${teacher.gradeRole}</p>
        <p><strong>Requested:</strong> ${new Date().toLocaleString()}</p>
      </div>
      
      <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
        <p style="margin: 0; color: #92400e;">
          <strong>Action Required:</strong> A teacher has requested a password reset. Please contact them directly to assist with password recovery or provide them with new login credentials.
        </p>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        This is an automated notification from the Bush Hills STEAM Academy PBIS House of Champions.
      </p>
    </div>
  `;
  
  const text = `
    Bush Hills STEAM Academy - Teacher Password Reset Request
    
    Reset Request Details:
    Teacher: ${teacher.name}
    Email: ${teacher.email}
    Role: ${teacher.gradeRole}
    Requested: ${new Date().toLocaleString()}
    
    Action Required: A teacher has requested a password reset. Please contact them directly to assist with password recovery.
  `;

  return await sendEmail({
    to: ADMIN_EMAIL,
    from: FROM_EMAIL,
    subject,
    html,
    text
  });
}

// Parent PBIS Point Notification
export async function sendParentPbisNotification(notificationData: {
  parentEmail: string;
  parentName: string;
  studentName: string;
  teacherName: string;
  points: number;
  mustangTrait: string;
  category: string;
  subcategory: string;
  reason?: string;
  entryType: 'positive' | 'negative';
}): Promise<boolean> {
  const isPositive = notificationData.entryType === 'positive';
  const pointsText = isPositive ? `+${notificationData.points}` : `${notificationData.points}`;
  const subject = `${isPositive ? '🌟 Positive' : '⚠️ Behavior'} PBIS Update - ${notificationData.studentName}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #1f2937;">Bush Hills STEAM Academy</h2>
      </div>
      
      <h2 style="color: #1f2937; text-align: center;">
        PBIS ${isPositive ? 'Recognition' : 'Alert'}
      </h2>
      
      <div style="background-color: ${isPositive ? '#f0f9ff' : '#fef2f2'}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${isPositive ? '#3b82f6' : '#ef4444'};">
        <h3 style="color: ${isPositive ? '#1e40af' : '#dc2626'}; margin-top: 0;">
          ${isPositive ? '🌟 Positive Recognition' : '⚠️ Behavior Notice'}
        </h3>
        <p><strong>Student:</strong> ${notificationData.studentName}</p>
        <p><strong>Teacher:</strong> ${notificationData.teacherName}</p>
        <p><strong>Points:</strong> <span style="font-size: 18px; font-weight: bold; color: ${isPositive ? '#059669' : '#dc2626'};">${pointsText}</span></p>
        <p><strong>MUSTANG Trait:</strong> ${notificationData.mustangTrait}</p>
        <p><strong>Category:</strong> ${notificationData.category}</p>
        <p><strong>Details:</strong> ${notificationData.subcategory}</p>
        ${notificationData.reason ? `<p><strong>Additional Notes:</strong> ${notificationData.reason}</p>` : ''}
        <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
      </div>
      
      ${isPositive ? `
      <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #22c55e;">
        <p style="margin: 0; color: #15803d;">
          <strong>Great job!</strong> Your child is demonstrating excellent character and academic growth. Keep encouraging these positive behaviors at home!
        </p>
      </div>
      ` : `
      <div style="background-color: #fffbeb; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
        <p style="margin: 0; color: #92400e;">
          <strong>Parent Support Needed:</strong> This is an opportunity to discuss expectations and work together to help your child make better choices.
        </p>
      </div>
      `}
      
      <div style="margin-top: 30px; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
        <h4 style="color: #374151; margin-top: 0;">MUSTANG Trait Definition:</h4>
        <p style="margin: 0; color: #6b7280; font-style: italic;">${getMustangTraitDefinition(notificationData.mustangTrait)}</p>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
        You can view your child's complete progress in the Parent Portal at any time.<br />
        This is an automated notification from the Bush Hills STEAM Academy PBIS House of Champions.
      </p>
    </div>
  `;
  
  const text = `
    Bush Hills STEAM Academy - PBIS ${isPositive ? 'Recognition' : 'Alert'}
    
    ${isPositive ? '🌟 Positive Recognition' : '⚠️ Behavior Notice'}
    
    Student: ${notificationData.studentName}
    Teacher: ${notificationData.teacherName}
    Points: ${pointsText}
    MUSTANG Trait: ${notificationData.mustangTrait}
    Category: ${notificationData.category}
    Details: ${notificationData.subcategory}
    ${notificationData.reason ? `Additional Notes: ${notificationData.reason}` : ''}
    Date: ${new Date().toLocaleDateString()}
    
    MUSTANG Trait Definition: ${getMustangTraitDefinition(notificationData.mustangTrait)}
    
    ${isPositive ? 
      'Great job! Your child is demonstrating excellent character and academic growth. Keep encouraging these positive behaviors at home!' :
      'Parent Support Needed: This is an opportunity to discuss expectations and work together to help your child make better choices.'
    }
    
    You can view your child's complete progress in the Parent Portal at any time.
  `;

  return await sendEmail({
    to: notificationData.parentEmail,
    from: FROM_EMAIL,
    subject,
    html,
    text
  });
}

function getMustangTraitDefinition(trait: string): string {
  const definitions = {
    "Make good choices": "Students demonstrate good decision-making skills and think before acting.",
    "Use kind words": "Students speak respectfully and considerately to others.",
    "Show school pride": "Students demonstrate respect for their school community and traditions.",
    "Tolerant of others": "Students show acceptance and respect for diversity and differences.",
    "Aim for excellence": "Students strive to do their best work and continuously improve.",
    "Need to be responsible": "Students take ownership of their actions and commitments.",
    "Give 100% everyday": "Students bring their best effort and enthusiasm to all activities."
  };
  return definitions[trait] || trait;
}

// Teacher Message Notification to Parents
export async function sendTeacherMessageNotification(messageData: {
  parentEmail: string;
  parentName: string;
  teacherName: string;
  studentName: string;
  subject: string;
  message: string;
}): Promise<boolean> {
  const subject = `📨 Message from ${messageData.teacherName} about ${messageData.studentName}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #1f2937;">Bush Hills STEAM Academy</h2>
      </div>
      
      <h2 style="color: #1f2937; text-align: center;">
        Teacher Message
      </h2>
      
      <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
        <h3 style="color: #1e40af; margin-top: 0;">📨 New Message</h3>
        <p><strong>From:</strong> ${messageData.teacherName}</p>
        <p><strong>About:</strong> ${messageData.studentName}</p>
        <p><strong>Subject:</strong> ${messageData.subject}</p>
        <div style="margin-top: 15px; padding: 15px; background-color: white; border-radius: 6px;">
          <h4 style="margin-top: 0; color: #374151;">Message:</h4>
          <p style="line-height: 1.6; color: #4b5563;">${messageData.message}</p>
        </div>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
      </div>
      
      <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #22c55e;">
        <p style="margin: 0; color: #15803d;">
          <strong>Reply Available:</strong> You can respond to this message through the Parent Portal. Your teacher will receive an email notification when you reply.
        </p>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
        You can view and respond to messages in the Parent Portal at any time.<br />
        This is an automated notification from the Bush Hills STEAM Academy PBIS House of Champions.
      </p>
    </div>
  `;
  
  const text = `
    Bush Hills STEAM Academy - Teacher Message
    
    📨 New Message
    
    From: ${messageData.teacherName}
    About: ${messageData.studentName}
    Subject: ${messageData.subject}
    
    Message:
    ${messageData.message}
    
    Date: ${new Date().toLocaleDateString()}
    
    Reply Available: You can respond to this message through the Parent Portal. Your teacher will receive an email notification when you reply.
    
    You can view and respond to messages in the Parent Portal at any time.
  `;

  return await sendEmail({
    to: messageData.parentEmail,
    from: FROM_EMAIL,
    subject,
    html,
    text
  });
}

// Parent Reply Notification to Teachers
export async function sendParentReplyNotification(replyData: {
  teacherEmail: string;
  teacherName: string;
  parentName: string;
  studentName: string;
  subject: string;
  message: string;
}): Promise<boolean> {
  const subject = `💬 Parent Reply from ${replyData.parentName} about ${replyData.studentName}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #1f2937;">Bush Hills STEAM Academy</h2>
      </div>
      
      <h2 style="color: #1f2937; text-align: center;">
        Parent Reply
      </h2>
      
      <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
        <h3 style="color: #92400e; margin-top: 0;">💬 Parent Response</h3>
        <p><strong>From:</strong> ${replyData.parentName}</p>
        <p><strong>About:</strong> ${replyData.studentName}</p>
        <p><strong>Subject:</strong> ${replyData.subject}</p>
        <div style="margin-top: 15px; padding: 15px; background-color: white; border-radius: 6px;">
          <h4 style="margin-top: 0; color: #374151;">Message:</h4>
          <p style="line-height: 1.6; color: #4b5563;">${replyData.message}</p>
        </div>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
      </div>
      
      <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
        <p style="margin: 0; color: #1e40af;">
          <strong>Continue Conversation:</strong> You can reply to this message through the Teacher Portal messaging system.
        </p>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
        You can view and manage all parent communications through the Teacher Portal.<br />
        This is an automated notification from the Bush Hills STEAM Academy PBIS House of Champions.
      </p>
    </div>
  `;
  
  const text = `
    Bush Hills STEAM Academy - Parent Reply
    
    💬 Parent Response
    
    From: ${replyData.parentName}
    About: ${replyData.studentName}
    Subject: ${replyData.subject}
    
    Message:
    ${replyData.message}
    
    Date: ${new Date().toLocaleDateString()}
    
    Continue Conversation: You can reply to this message through the Teacher Portal messaging system.
    
    You can view and manage all parent communications through the Teacher Portal.
  `;

  return await sendEmail({
    to: replyData.teacherEmail,
    from: FROM_EMAIL,
    subject,
    html,
    text
  });
}