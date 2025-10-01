import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

// Create PostgreSQL connection
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  user: process.env.PGUSER || 'root',
  password: process.env.PGPASSWORD || '@Bomba.123',
  database: process.env.PGDATABASE || 'linktech',
});
const db = drizzle(pool);

async function applyMigrationDirect() {
  try {
    console.log('Applying migration directly to database...');
    
    // Add the registration_document column
    await db.execute(`
      ALTER TABLE company_profiles 
      ADD COLUMN IF NOT EXISTS registration_document text;
    `);
    
    console.log('✅ Successfully added registration_document column to company_profiles table');
    
    // Verify the column was added
    const result = await db.execute(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'company_profiles' 
      AND column_name = 'registration_document';
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Column verification successful:', result.rows[0]);
    } else {
      console.log('❌ Column verification failed - column not found');
    }
    
  } catch (error) {
    console.error('❌ Error applying migration:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Run the script
applyMigrationDirect();

