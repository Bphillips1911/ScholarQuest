// DIRECT ADMIN MESSAGING - Bypass caching issues with direct database queries
import { db } from './db';
import { sql } from 'drizzle-orm';

export const getAdminParentsDirect = async (): Promise<any[]> => {
  console.log("DIRECT: Executing direct parent query for admin");
  
  try {
    const result = await db.execute(sql`
      SELECT id, first_name, last_name, email, phone, created_at
      FROM parents 
      ORDER BY created_at DESC
    `);
    
    console.log(`DIRECT: Found ${result.rows?.length || 0} parents via direct query`);
    
    // Map the raw database results to proper objects
    const parents = result.rows?.map((row: any) => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      createdAt: row.created_at
    })) || [];
    
    return parents;
  } catch (error) {
    console.error("DIRECT: Error in direct parent query:", error);
    return [];
  }
};

export const getAdminMessagesDirect = async (adminId: string): Promise<any[]> => {
  console.log("DIRECT: Executing direct admin messages query");
  
  try {
    const result = await db.execute(sql`
      SELECT 
        ptm.id,
        ptm.subject,
        ptm.message,
        ptm.priority,
        ptm.sender_type,
        ptm.created_at,
        CASE 
          WHEN ptm.sender_type = 'admin' AND ptm.admin_id IS NOT NULL THEN 
            CONCAT(a.first_name, ' ', a.last_name)
          WHEN ptm.sender_type = 'parent' AND ptm.parent_id IS NOT NULL THEN 
            CONCAT(p.first_name, ' ', p.last_name)  
          WHEN ptm.sender_type = 'teacher' AND ptm.teacher_id IS NOT NULL THEN 
            ta.name
          ELSE 'Unknown'
        END as sender_name,
        CASE 
          WHEN ptm.recipient_type = 'teacher' THEN 'Teacher'
          WHEN ptm.recipient_type = 'parent' THEN 'Parent'
          ELSE 'Administrator'
        END as recipient_name
      FROM parent_teacher_messages ptm
      LEFT JOIN parents p ON ptm.parent_id = p.id
      LEFT JOIN teacher_auth ta ON ptm.teacher_id = ta.id  
      LEFT JOIN administrators a ON ptm.admin_id = a.id
      ORDER BY ptm.created_at DESC
      LIMIT 50
    `);
    
    console.log(`DIRECT: Found ${result.rows?.length || 0} admin messages via direct query`);
    return result.rows || [];
  } catch (error) {
    console.error("DIRECT: Error in direct admin messages query:", error);
    return [];
  }
};