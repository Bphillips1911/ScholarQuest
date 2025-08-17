// This file contains the properly implemented messaging methods for the database storage
// These will be integrated into the main db-storage.ts file

import { eq, desc, sql } from "drizzle-orm";
import { db } from "./db";
import * as schema from "@shared/schema";

// Fixed Parent Message Methods
export const getParentMessagesFixed = async (parentId: string): Promise<any[]> => {
  try {
    console.log("DATABASE: Getting messages for parent:", parentId);
    const result = await db.execute(sql`
      SELECT ptm.*, 
             CASE 
               WHEN ptm.teacher_id IS NOT NULL THEN ta.name
               WHEN ptm.admin_id IS NOT NULL THEN 'Administrator'
               ELSE 'Unknown'
             END as sender_name,
             s.name as scholar_name 
      FROM parent_teacher_messages ptm
      LEFT JOIN teacher_auth ta ON ptm.teacher_id = ta.id
      LEFT JOIN scholars s ON ptm.scholar_id = s.id
      WHERE ptm.parent_id = ${parentId}
      ORDER BY ptm.created_at DESC
    `);
    console.log(`DATABASE: Found ${result.rows?.length || 0} messages for parent`);
    return result.rows || [];
  } catch (error) {
    console.error('DATABASE: Error in getParentMessages:', error);
    return [];
  }
};

// Fixed Teacher Message Methods
export const getMessagesByTeacherFixed = async (teacherId: string): Promise<any[]> => {
  try {
    console.log("DATABASE: Getting messages for teacher:", teacherId);
    const result = await db.execute(sql`
      SELECT ptm.*, 
             p.first_name, 
             p.last_name, 
             s.name as scholar_name,
             CASE 
               WHEN ptm.admin_id IS NOT NULL THEN CONCAT(a.first_name, ' ', a.last_name)
               WHEN ptm.parent_id IS NOT NULL THEN CONCAT(p.first_name, ' ', p.last_name)
               ELSE 'Unknown'
             END as sender_name
      FROM parent_teacher_messages ptm
      LEFT JOIN parents p ON ptm.parent_id = p.id
      LEFT JOIN scholars s ON ptm.scholar_id = s.id
      LEFT JOIN administrators a ON ptm.admin_id = a.id
      WHERE ptm.teacher_id = ${teacherId}
      ORDER BY ptm.created_at DESC
    `);
    console.log(`DATABASE: Found ${result.rows?.length || 0} messages for teacher ${teacherId}`);
    return result.rows || [];
  } catch (error) {
    console.error('DATABASE: Error in getMessagesByTeacher:', error);
    return [];
  }
};

// DEPLOYMENT FIX - Fixed Admin Message Methods  
console.log("DEPLOYMENT: Loading fixed admin message methods");
export const getMessagesForAdminFixed = async (adminId: string): Promise<any[]> => {
  try {
    console.log("DATABASE: Getting messages for admin:", adminId);
    
    const result = await db.execute(sql`
      SELECT ptm.*, 
             CASE 
               WHEN ptm.sender_type = 'admin' AND ptm.admin_id IS NOT NULL THEN CONCAT(a.first_name, ' ', a.last_name)
               WHEN ptm.sender_type = 'parent' AND ptm.parent_id IS NOT NULL THEN CONCAT(p.first_name, ' ', p.last_name)
               WHEN ptm.sender_type = 'teacher' AND ptm.teacher_id IS NOT NULL THEN ta.name
               ELSE 'Unknown'
             END as sender_name,
             ptm.sender_type as actual_sender_type,
             CASE 
               WHEN ptm.recipient_type = 'teacher' THEN 'Teacher'
               WHEN ptm.recipient_type = 'parent' THEN 'Parent'
               WHEN ptm.recipient_type = 'admin' THEN 'Administrator'
               ELSE 'Unknown'
             END as recipient_name,
             s.name as scholar_name 
      FROM parent_teacher_messages ptm
      LEFT JOIN parents p ON ptm.parent_id = p.id
      LEFT JOIN teacher_auth ta ON ptm.teacher_id = ta.id
      LEFT JOIN administrators a ON ptm.admin_id = a.id
      LEFT JOIN scholars s ON ptm.scholar_id = s.id
      WHERE ptm.admin_id = ${adminId} OR ptm.recipient_type = 'admin'
      ORDER BY ptm.created_at DESC
    `);
    
    console.log(`DATABASE: Found ${result.rows?.length || 0} messages for admin`);
    return result.rows || [];
  } catch (error) {
    console.error("DATABASE: Error getting admin messages:", error);
    return [];
  }
};

// Fixed Parent and Teacher Retrieval Methods
export const getAllParentsFixed = async (): Promise<any[]> => {
  try {
    console.log("DATABASE: Getting all parents for admin messaging");
    const parentsData = await db.select().from(schema.parents).orderBy(desc(schema.parents.createdAt));
    console.log(`DATABASE: Found ${parentsData.length} parents`);
    return parentsData;
  } catch (error) {
    console.error("DATABASE: Error getting all parents:", error);
    throw error;
  }
};

export const getAllTeachersFixed = async (): Promise<any[]> => {
  try {
    console.log("DATABASE: Getting all teachers for admin messaging");
    const teachers = await db.select().from(schema.teacherAuth)
      .where(eq(schema.teacherAuth.isApproved, true))
      .orderBy(schema.teacherAuth.name);
    console.log(`DATABASE: Found ${teachers.length} approved teachers`);
    return teachers;
  } catch (error) {
    console.error("DATABASE: Error getting all teachers:", error);
    throw error;
  }
};

// Fixed Create Message Method with Email Notifications
export const createMessageFixed = async (messageData: any): Promise<any> => {
  try {
    const [message] = await db.insert(schema.parentTeacherMessages).values({
      id: crypto.randomUUID(),
      parentId: messageData.parentId,
      teacherId: messageData.teacherId || null,
      adminId: messageData.adminId || null,
      scholarId: messageData.scholarId || null,
      senderType: messageData.senderType,
      recipientType: messageData.recipientType,
      subject: messageData.subject,
      message: messageData.message,
      isRead: messageData.isRead || false,
      threadId: messageData.threadId || null,
      priority: messageData.priority || 'normal',
      notificationSent: messageData.notificationSent || false,
      createdAt: new Date()
    }).returning();

    // Send email notifications for teacher to parent messages
    if (messageData.senderType === 'teacher' && messageData.recipientType === 'parent') {
      try {
        const [parent] = await db.select({
          email: schema.parents.email,
          firstName: schema.parents.firstName,
          lastName: schema.parents.lastName
        }).from(schema.parents).where(eq(schema.parents.id, messageData.parentId));
        
        if (parent) {
          const [teacher] = await db.select({
            name: schema.teacherAuth.name
          }).from(schema.teacherAuth).where(eq(schema.teacherAuth.id, messageData.teacherId));
          
          let scholarName = 'your student';
          
          if (messageData.scholarId) {
            const [scholar] = await db.select({ name: schema.scholars.name })
              .from(schema.scholars)
              .where(eq(schema.scholars.id, messageData.scholarId));
            if (scholar) {
              scholarName = scholar.name;
            }
          }
          
          // Import and send email notification
          const { sendTeacherMessageNotification } = await import('./emailService');
          await sendTeacherMessageNotification({
            parentEmail: parent.email,
            parentName: `${parent.firstName} ${parent.lastName}`,
            teacherName: teacher?.name || 'Teacher',
            studentName: scholarName,
            subject: messageData.subject,
            message: messageData.message
          });
          
          console.log(`DATABASE: Email notification sent to parent ${parent.email}`);
        }
      } catch (emailError) {
        console.error('DATABASE: Failed to send email notification:', emailError);
        // Continue with success even if email fails
      }
    }

    return message;
  } catch (error) {
    console.error('DATABASE: createMessage error:', error);
    throw error;
  }
};