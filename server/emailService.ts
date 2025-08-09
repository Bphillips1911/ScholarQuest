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
const ADMIN_EMAIL = "BHSAHouses25@gmail.com";
const FROM_EMAIL = "test@example.com"; // Use a verified sender domain for testing

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
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text || undefined,
      html: params.html || undefined,
    });
    console.log('✅ Email sent successfully to:', params.to);
    return true;
  } catch (error: any) {
    console.error('❌ SendGrid email error:', error.message || error);
    
    // Check for common error types
    if (error.code === 403) {
      console.error('💡 Suggestion: Check your SendGrid API key permissions and sender verification');
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
        This is an automated notification from the Bush Hills STEAM Academy House Character Development Program.
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
        This is an automated notification from the Bush Hills STEAM Academy House Character Development Program.
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
        This is an automated notification from the Bush Hills STEAM Academy House Character Development Program.
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
        This is an automated notification from the Bush Hills STEAM Academy House Character Development Program.
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