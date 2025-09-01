import bcrypt from 'bcryptjs';
import { db } from './db';
import { parents } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Comprehensive Parent Password Fix System
 * Ensures all parent passwords are properly hashed and fixes any plain text passwords
 */

interface ParentPasswordInfo {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/**
 * Check if a password is already bcrypt hashed
 */
function isBcryptHashed(password: string): boolean {
  // Bcrypt hashes start with $2a$, $2b$, $2x$, or $2y$ followed by cost and salt
  return /^\$2[abxy]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(password);
}

/**
 * Hash a plain text password using bcrypt
 */
function hashPassword(plainTextPassword: string): string {
  return bcrypt.hashSync(plainTextPassword, 10);
}

/**
 * Fix all parent passwords that are stored as plain text
 */
export async function fixAllParentPasswords(): Promise<void> {
  console.log('🔧 PARENT PASSWORD FIX: Starting comprehensive password validation...');
  
  try {
    // Get all parents from database
    const allParents = await db.select().from(parents);
    console.log(`🔧 PARENT PASSWORD FIX: Found ${allParents.length} parent accounts`);
    
    let fixedCount = 0;
    let alreadyHashedCount = 0;
    const problemPasswords: string[] = [];
    
    for (const parent of allParents) {
      const isHashed = isBcryptHashed(parent.password);
      
      if (!isHashed) {
        console.log(`🔧 PARENT PASSWORD FIX: Fixing plain text password for ${parent.email}`);
        
        // Hash the plain text password
        const hashedPassword = hashPassword(parent.password);
        
        // Update the database with the hashed password
        await db
          .update(parents)
          .set({ password: hashedPassword })
          .where(eq(parents.id, parent.id));
        
        console.log(`✅ PARENT PASSWORD FIX: Updated password for ${parent.email}`);
        fixedCount++;
      } else {
        console.log(`✅ PARENT PASSWORD FIX: Password already hashed for ${parent.email}`);
        alreadyHashedCount++;
      }
    }
    
    console.log(`🎯 PARENT PASSWORD FIX: Complete! Fixed: ${fixedCount}, Already hashed: ${alreadyHashedCount}`);
    
    if (fixedCount > 0) {
      console.log('🔐 PARENT PASSWORD FIX: All parent passwords are now properly secured with bcrypt hashing');
    }
    
  } catch (error) {
    console.error('❌ PARENT PASSWORD FIX: Error occurred:', error);
    throw error;
  }
}

/**
 * Verify that a parent's login credentials work correctly
 */
export async function verifyParentLogin(email: string, password: string): Promise<boolean> {
  try {
    const [parent] = await db.select().from(parents).where(eq(parents.email, email));
    
    if (!parent) {
      console.log(`❌ VERIFY: Parent not found: ${email}`);
      return false;
    }
    
    const isValid = await bcrypt.compare(password, parent.password);
    console.log(`${isValid ? '✅' : '❌'} VERIFY: Password for ${email}: ${isValid ? 'VALID' : 'INVALID'}`);
    
    return isValid;
  } catch (error) {
    console.error('❌ VERIFY: Error verifying parent login:', error);
    return false;
  }
}

/**
 * Run a comprehensive test of known parent credentials
 */
export async function testKnownParentLogins(): Promise<void> {
  console.log('🧪 PARENT LOGIN TEST: Testing known parent credentials...');
  
  const knownCredentials = [
    { email: 'tiffanydemo83@gmail.com', password: 'Champions1983!' },
    { email: 'csimmons@gmail.com', password: 'Champions1911!' },
    { email: 'clovesimmons@yahoo.com', password: 'Champions1911!' },
    { email: 'joe.clark@example.com', password: 'Family2024!' },
    { email: 'nslaw@yahoo.com', password: 'SchoolYear2024!' },
    { email: 'jrabbit@yahoo.com', password: 'Parent123!' }
  ];
  
  let passedTests = 0;
  
  for (const cred of knownCredentials) {
    const isValid = await verifyParentLogin(cred.email, cred.password);
    if (isValid) {
      passedTests++;
    }
  }
  
  console.log(`🧪 PARENT LOGIN TEST: ${passedTests}/${knownCredentials.length} known credentials verified`);
}

/**
 * Initialize parent password security system
 */
export async function initializeParentPasswordSecurity(): Promise<void> {
  console.log('🚀 PARENT PASSWORD SECURITY: Initializing...');
  
  try {
    await fixAllParentPasswords();
    await testKnownParentLogins();
    console.log('✅ PARENT PASSWORD SECURITY: Initialization complete');
  } catch (error) {
    console.error('❌ PARENT PASSWORD SECURITY: Initialization failed:', error);
  }
}