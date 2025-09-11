/**
 * SCHEMA BOOTSTRAP
 * 
 * Ensures all required database tables exist before any operations.
 * This fixes the deployment issue where tables don't exist.
 */

import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export async function ensureSchema(db: NodePgDatabase<any>) {
  console.log("🔧 SCHEMA BOOTSTRAP: Ensuring all tables exist...");
  
  try {
    // Enable UUID extension if not exists
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
    console.log("   ✅ pgcrypto extension enabled");
    
    // Create houses table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS houses (
        id varchar PRIMARY KEY,
        name varchar NOT NULL,
        color varchar NOT NULL,
        icon varchar NOT NULL,
        motto varchar NOT NULL,
        academic_points integer DEFAULT 0,
        attendance_points integer DEFAULT 0,
        behavior_points integer DEFAULT 0,
        bhsa_mustang_traits_points integer DEFAULT 0,
        member_count integer DEFAULT 0
      )
    `);
    console.log("   ✅ houses table ensured");
    
    // Create scholars table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS scholars (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar NOT NULL,
        student_id varchar UNIQUE NOT NULL,
        house_id varchar REFERENCES houses(id),
        grade integer NOT NULL,
        academic_points integer DEFAULT 0,
        attendance_points integer DEFAULT 0,
        behavior_points integer DEFAULT 0,
        bhsa_mustang_traits_points integer DEFAULT 0,
        is_house_sorted boolean DEFAULT false,
        username varchar UNIQUE NOT NULL,
        password_hash varchar NOT NULL,
        is_active boolean DEFAULT true,
        created_at timestamp DEFAULT now()
      )
    `);
    console.log("   ✅ scholars table ensured");
    
    // Create parents table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS parents (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        email varchar UNIQUE NOT NULL,
        password varchar NOT NULL,
        first_name varchar NOT NULL,
        last_name varchar NOT NULL,
        phone varchar,
        preferred_language varchar DEFAULT 'en',
        scholar_ids text[] DEFAULT ARRAY[]::text[],
        is_verified boolean DEFAULT false,
        created_at timestamp DEFAULT now()
      )
    `);
    console.log("   ✅ parents table ensured");
    
    // Create teachers table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS teachers (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar NOT NULL,
        email varchar UNIQUE NOT NULL,
        password varchar NOT NULL,
        role varchar NOT NULL,
        subject varchar,
        can_see_grades integer[] DEFAULT ARRAY[]::integer[],
        created_at timestamp DEFAULT now()
      )
    `);
    console.log("   ✅ teachers table ensured");
    
    // Create administrators table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS administrators (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        email varchar UNIQUE NOT NULL,
        password varchar NOT NULL,
        role varchar NOT NULL,
        name varchar NOT NULL,
        is_approved boolean DEFAULT false,
        created_at timestamp DEFAULT now()
      )
    `);
    console.log("   ✅ administrators table ensured");
    
    // Create point_entries table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS point_entries (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        scholar_id varchar REFERENCES scholars(id),
        teacher_id varchar REFERENCES teachers(id),
        points integer NOT NULL,
        category varchar NOT NULL,
        reason varchar NOT NULL,
        timestamp timestamp DEFAULT now()
      )
    `);
    console.log("   ✅ point_entries table ensured");
    
    // Create pbis_entries table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS pbis_entries (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        scholar_id varchar REFERENCES scholars(id),
        teacher_id varchar REFERENCES teachers(id),
        category varchar NOT NULL,
        points integer DEFAULT 0,
        description varchar,
        timestamp timestamp DEFAULT now()
      )
    `);
    console.log("   ✅ pbis_entries table ensured");
    
    // Create pbis_photos table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS pbis_photos (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        scholar_id varchar REFERENCES scholars(id),
        teacher_id varchar REFERENCES teachers(id),
        photo_url varchar NOT NULL,
        description varchar,
        uploaded_at timestamp DEFAULT now()
      )
    `);
    console.log("   ✅ pbis_photos table ensured");
    
    // Create badges table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS badges (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar NOT NULL,
        description varchar,
        icon varchar,
        category varchar,
        points_required integer DEFAULT 0,
        rarity varchar DEFAULT 'common',
        is_active boolean DEFAULT true
      )
    `);
    console.log("   ✅ badges table ensured");
    
    // Create scholar_badges table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS scholar_badges (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        scholar_id varchar REFERENCES scholars(id),
        badge_id varchar REFERENCES badges(id),
        earned_at timestamp DEFAULT now(),
        points_earned integer DEFAULT 0
      )
    `);
    console.log("   ✅ scholar_badges table ensured");
    
    // Create games table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS games (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar NOT NULL,
        description varchar,
        is_active boolean DEFAULT true,
        created_at timestamp DEFAULT now()
      )
    `);
    console.log("   ✅ games table ensured");
    
    // Create game_access table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS game_access (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        scholar_id varchar REFERENCES scholars(id),
        game_id varchar REFERENCES games(id),
        granted_at timestamp DEFAULT now(),
        expires_at timestamp
      )
    `);
    console.log("   ✅ game_access table ensured");
    
    // Create game_sessions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS game_sessions (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        scholar_id varchar REFERENCES scholars(id),
        game_id varchar REFERENCES games(id),
        started_at timestamp DEFAULT now(),
        ended_at timestamp,
        score integer DEFAULT 0
      )
    `);
    console.log("   ✅ game_sessions table ensured");
    
    // Create reflections table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS reflections (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        scholar_id varchar REFERENCES scholars(id),
        teacher_id varchar REFERENCES teachers(id),
        parent_id varchar REFERENCES parents(id),
        incident_description varchar NOT NULL,
        scholar_response varchar,
        status varchar DEFAULT 'pending',
        teacher_feedback varchar,
        rejection_reason varchar,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      )
    `);
    console.log("   ✅ reflections table ensured");
    
    // Create parent_teacher_messages table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS parent_teacher_messages (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        parent_id varchar REFERENCES parents(id),
        teacher_id varchar REFERENCES teachers(id),
        scholar_id varchar REFERENCES scholars(id),
        sender_type varchar NOT NULL,
        subject varchar NOT NULL,
        message varchar NOT NULL,
        is_read boolean DEFAULT false,
        sent_at timestamp DEFAULT now()
      )
    `);
    console.log("   ✅ parent_teacher_messages table ensured");
    
    console.log("🎉 SCHEMA BOOTSTRAP: All tables ensured successfully!");
    
    // Return table verification
    const tableCheck = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const tables = tableCheck.rows.map(row => row.table_name);
    console.log(`   📊 Found ${tables.length} tables: ${tables.join(', ')}`);
    
    return {
      success: true,
      tablesCreated: tables.length,
      tableNames: tables
    };
    
  } catch (error) {
    console.error("🔧 SCHEMA BOOTSTRAP ERROR:", error);
    throw error;
  }
}