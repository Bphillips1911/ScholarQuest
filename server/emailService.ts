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
      from: { 
        email: params.from,
        name: "Bush Hills STEAM Academy" // Improve sender reputation
      },
      reply_to: {
        email: "noreply@bhsahouses25.com", // Professional no-reply address
        name: "Bush Hills STEAM Academy - Do Not Reply"
      },
      content: [
        ...(params.text ? [{ type: 'text/plain', value: params.text }] : []),
        ...(params.html ? [{ type: 'text/html', value: params.html }] : [])
      ],
      // Enhanced delivery settings to avoid spam
      mail_settings: {
        sandbox_mode: {
          enable: false
        }
      },
      tracking_settings: {
        click_tracking: {
          enable: true,
          enable_text: false
        },
        open_tracking: {
          enable: true,
          substitution_tag: "%open-track%"
        },
        subscription_tracking: {
          enable: false
        }
      },
      // Add headers to improve deliverability
      headers: {
        "X-Priority": "3",
        "X-MSMail-Priority": "Normal",
        "Importance": "Normal"
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
  const subject = `📨 Message from ${messageData.teacherName} - ${messageData.subject}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
      <!-- Header with School Branding -->
      <div style="background-color: #1f2937; color: white; padding: 25px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">🏫 Bush Hills STEAM Academy</h1>
        <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 16px;">PBIS House of Champions</p>
      </div>
      
      <!-- Main Content -->
      <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <h2 style="color: #374151; margin-top: 0; font-size: 22px; text-align: center;">📧 New Message from Your Child's Teacher</h2>
        
        <!-- Message Details Card -->
        <div style="background-color: #f0f9ff; padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 5px solid #3b82f6;">
          <h3 style="color: #1e40af; margin-top: 0; font-size: 18px; margin-bottom: 20px;">📨 Message Information</h3>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 0; color: #6b7280; font-weight: bold; width: 30%;">From Teacher:</td>
              <td style="padding: 10px 0; color: #1f2937; font-weight: 600;">${messageData.teacherName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 0; color: #6b7280; font-weight: bold;">To Parent:</td>
              <td style="padding: 10px 0; color: #1f2937; font-weight: 600;">${messageData.parentName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 0; color: #6b7280; font-weight: bold;">About Student:</td>
              <td style="padding: 10px 0; color: #1f2937; font-weight: 600;">${messageData.studentName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 0; color: #6b7280; font-weight: bold;">Subject:</td>
              <td style="padding: 10px 0; color: #1f2937; font-weight: 600;">${messageData.subject}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b7280; font-weight: bold;">Date:</td>
              <td style="padding: 10px 0; color: #1f2937; font-weight: 600;">${new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}</td>
            </tr>
          </table>
        </div>
        
        <!-- Message Content -->
        <div style="background-color: #ffffff; padding: 25px; border-radius: 10px; border: 2px solid #e5e7eb; margin: 25px 0; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
          <h4 style="color: #374151; margin-top: 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 20px;">💬 Message Content</h4>
          <div style="white-space: pre-wrap; line-height: 1.7; color: #1f2937; font-size: 16px; padding: 15px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #3b82f6;">${messageData.message}</div>
        </div>
        
        <!-- Response Instructions -->
        <div style="background-color: #dbeafe; padding: 25px; border-radius: 10px; border-left: 5px solid #3b82f6; margin: 25px 0;">
          <h4 style="margin: 0 0 15px 0; color: #1e40af; font-size: 18px;">📱 How to Respond</h4>
          <p style="margin: 0; color: #1e40af; line-height: 1.6; font-size: 15px;">
            To reply to this message, please log into the <strong>Parent Portal</strong> on your child's school website. 
            Your response will be delivered directly to <strong>${messageData.teacherName}</strong>, and they will receive an email notification.
          </p>
        </div>
        
        <!-- Important Notice -->
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 10px; border-left: 5px solid #f59e0b; margin: 25px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
            <strong>📧 Email Notification:</strong> This is an automated notification. Please do not reply directly to this email. 
            Use the parent portal to ensure your response reaches ${messageData.teacherName}.
          </p>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="text-align: center; padding: 25px; color: #6b7280; font-size: 13px; line-height: 1.5;">
        <p style="margin: 0; font-weight: 600;">Bush Hills STEAM Academy</p>
        <p style="margin: 5px 0 0 0;">PBIS House of Champions Communication System</p>
        <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.8;">Fostering positive behavior and academic excellence</p>
      </div>
    </div>
  `;
  
  const text = `
    BUSH HILLS STEAM ACADEMY - PBIS HOUSE OF CHAMPIONS
    
    📧 New Message from Your Child's Teacher
    
    MESSAGE INFORMATION:
    From Teacher: ${messageData.teacherName}
    To Parent: ${messageData.parentName}
    About Student: ${messageData.studentName}
    Subject: ${messageData.subject}
    Date: ${new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })}
    
    💬 MESSAGE CONTENT:
    ${messageData.message}
    
    📱 HOW TO RESPOND:
    To reply to this message, please log into the Parent Portal on your child's school website. 
    Your response will be delivered directly to ${messageData.teacherName}, and they will receive an email notification.
    
    📧 IMPORTANT: This is an automated notification. Please do not reply directly to this email. 
    Use the parent portal to ensure your response reaches ${messageData.teacherName}.
    
    ---
    Bush Hills STEAM Academy - PBIS House of Champions Communication System
    Fostering positive behavior and academic excellence
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

export async function sendParentReflectionNotification(parentEmail: string, studentName: string, reflectionPrompt: string, dueDate?: Date): Promise<boolean> {
  const subject = "Behavioral Reflection Assigned - " + studentName;
  const text = `Dear Parent/Guardian,

A behavioral reflection has been assigned to your child, ${studentName}, at Bush Hills STEAM Academy.

Reflection Assignment:
"${reflectionPrompt}"

Your child will need to complete this reflection as part of our Positive Behavioral Interventions and Supports (PBIS) program. This is an opportunity for ${studentName} to reflect on their behavior and develop strategies for improvement.

You can view the reflection status in your parent portal. We will notify you when the reflection has been completed and reviewed.

If you have any questions or concerns, please don't hesitate to contact us.

Best regards,
Bush Hills STEAM Academy`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">🏫 Bush Hills STEAM Academy - Behavioral Reflection Assigned</h2>
      <p>Dear Parent/Guardian,</p>
      <p>A behavioral reflection has been assigned to your child, <strong>${studentName}</strong>, at Bush Hills STEAM Academy.</p>
      
      <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #856404;">Reflection Assignment:</h3>
        <p style="font-style: italic; margin-bottom: 0;">"${reflectionPrompt}"</p>
      </div>
      
      <p>Your child will need to complete this reflection as part of our Positive Behavioral Interventions and Supports (PBIS) program. This is an opportunity for ${studentName} to reflect on their behavior and develop strategies for improvement.</p>
      
      <p>You can view the reflection status in your parent portal. We will notify you when the reflection has been completed and reviewed.</p>
      
      <p>If you have any questions or concerns, please don't hesitate to contact us.</p>
      
      <p>Best regards,<br>Bush Hills STEAM Academy</p>
    </div>
  `;

  return await sendEmail({
    to: parentEmail,
    from: FROM_EMAIL,
    subject,
    text,
    html
  });
}

export async function sendReflectionApprovedNotification(parentEmail: string, parentName: string, studentName: string, reflectionPrompt: string, studentResponse: string, teacherFeedback?: string): Promise<boolean> {
  const subject = "Reflection Completed and Approved - " + studentName;
  const text = `Dear ${parentName},

Your child, ${studentName}, has successfully completed their behavioral reflection assignment at Bush Hills STEAM Academy.

Original Assignment:
"${reflectionPrompt}"

Student Response:
"${studentResponse}"

${teacherFeedback ? `Teacher Feedback:
"${teacherFeedback}"` : ''}

This reflection demonstrates ${studentName}'s commitment to growth and positive behavior. Thank you for supporting our PBIS program at home.

You can view the complete reflection in your parent portal.

Best regards,
Bush Hills STEAM Academy`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">✅ Bush Hills STEAM Academy - Reflection Approved</h2>
      <p>Dear ${parentName},</p>
      <p>Your child, <strong>${studentName}</strong>, has successfully completed their behavioral reflection assignment at Bush Hills STEAM Academy.</p>
      
      <div style="background: #f8f9fa; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #155724;">Original Assignment:</h3>
        <p style="font-style: italic;">"${reflectionPrompt}"</p>
      </div>
      
      <div style="background: #f8f9fa; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #0c5460;">Student Response:</h3>
        <p style="font-style: italic;">"${studentResponse}"</p>
      </div>
      
      ${teacherFeedback ? `<div style="background: #f8f9fa; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #856404;">Teacher Feedback:</h3>
        <p style="font-style: italic;">"${teacherFeedback}"</p>
      </div>` : ''}
      
      <p>This reflection demonstrates ${studentName}'s commitment to growth and positive behavior. Thank you for supporting our PBIS program at home.</p>
      
      <p>You can view the complete reflection in your parent portal.</p>
      
      <p>Best regards,<br>Bush Hills STEAM Academy</p>
    </div>
  `;

  return await sendEmail({
    to: parentEmail,
    from: FROM_EMAIL,
    subject,
    text,
    html
  });
}



export async function sendParentReflectionApproval(parentEmail: string, studentName: string, prompt: string, response: string, teacherFeedback?: string) {
  const subject = `✅ ${studentName}'s Reflection Approved`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;">
      <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1f2937; margin: 0; font-size: 24px;">✅ Reflection Completed</h1>
        </div>
        
        <div style="background: #d1fae5; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #065f46; margin: 0 0 10px 0; font-size: 18px;">Great Work!</h2>
          <p style="color: #065f46; margin: 0; font-size: 16px;">
            <strong>${studentName}</strong>'s behavioral reflection has been reviewed and approved by their teacher.
          </p>
        </div>
        
        <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #374151; margin: 0 0 15px 0;">Reflection Summary:</h3>
          
          <div style="margin-bottom: 20px;">
            <strong style="color: #6b7280;">Original Prompt:</strong>
            <div style="background: #e5e7eb; border-radius: 6px; padding: 12px; margin-top: 8px; font-style: italic;">
              "${prompt}"
            </div>
          </div>
          
          <div style="margin-bottom: 20px;">
            <strong style="color: #6b7280;">Student Response:</strong>
            <div style="background: #dbeafe; border-radius: 6px; padding: 12px; margin-top: 8px;">
              ${response}
            </div>
          </div>
          
          ${teacherFeedback ? `
          <div>
            <strong style="color: #6b7280;">Teacher Feedback:</strong>
            <div style="background: #d1fae5; border-radius: 6px; padding: 12px; margin-top: 8px;">
              ${teacherFeedback}
            </div>
          </div>
          ` : ""}
        </div>
        
        <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin-bottom: 20px;">
          <p style="margin: 0; color: #065f46;">
            <strong>Excellent!</strong> ${studentName} has successfully completed their reflection. This shows growth in self-awareness and responsibility.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #6b7280; margin: 0; font-size: 14px;">
            This is an automated notification from Bush Hills STEAM Academy<br>
            Behavioral Reflection System
          </p>
        </div>
      </div>
    </div>
  `;

  await sendEmail({
    to: parentEmail,
    from: FROM_EMAIL,
    subject,
    html
  });
}

export async function sendReflectionRejectedNotification(parentEmail: string, parentName: string, studentName: string, reflectionPrompt: string, studentResponse: string, rejectionReason?: string): Promise<boolean> {
  const subject = "Reflection Needs Revision - " + studentName;
  const text = `Dear ${parentName},

The behavioral reflection submitted by your child, ${studentName}, at Bush Hills STEAM Academy requires revision before approval.

Original Assignment:
"${reflectionPrompt}"

Student's Response:
"${studentResponse}"

Teacher's Feedback:
${rejectionReason || "Please provide more detail and thoughtful reflection on the behavior and future improvements."}

Your child will need to revise and resubmit their reflection. This is an opportunity for ${studentName} to provide a more thoughtful response that demonstrates understanding of the behavior and commitment to positive change.

You can view the reflection status in your parent portal. We will notify you when the revised reflection has been submitted and reviewed.

If you have any questions, please don't hesitate to contact us.

Best regards,
Bush Hills STEAM Academy`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">🔄 Bush Hills STEAM Academy - Reflection Needs Revision</h2>
      <p>Dear ${parentName},</p>
      <p>The behavioral reflection submitted by your child, <strong>${studentName}</strong>, at Bush Hills STEAM Academy requires revision before approval.</p>
      
      <div style="background: #f8f9fa; border-left: 4px solid #6c757d; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #495057;">Original Assignment:</h3>
        <p style="font-style: italic;">"${reflectionPrompt}"</p>
      </div>
      
      <div style="background: #f8f9fa; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #0c5460;">Student's Response:</h3>
        <p style="font-style: italic;">"${studentResponse}"</p>
      </div>
      
      <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #856404;">Teacher's Feedback:</h3>
        <p style="margin-bottom: 0;">${rejectionReason || "Please provide more detail and thoughtful reflection on the behavior and future improvements."}</p>
      </div>
      
      <p>Your child will need to revise and resubmit their reflection. This is an opportunity for ${studentName} to provide a more thoughtful response that demonstrates understanding of the behavior and commitment to positive change.</p>
      
      <p>You can view the reflection status in your parent portal. We will notify you when the revised reflection has been submitted and reviewed.</p>
      
      <p>If you have any questions, please don't hesitate to contact us.</p>
      
      <p>Best regards,<br>Bush Hills STEAM Academy</p>
    </div>
  `;

  return await sendEmail({
    to: parentEmail,
    from: FROM_EMAIL,
    subject,
    text,
    html
  });
}
