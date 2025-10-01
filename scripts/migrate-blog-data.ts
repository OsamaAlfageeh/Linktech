#!/usr/bin/env tsx

/**
 * Complete Blog Data Migration Script
 * This script provides a simple interface to migrate blog data between databases
 * 
 * Usage: npm run migrate-blog-data
 */

import 'dotenv/config';
import { exportBlogData } from './export-blog-data';
import { importBlogData } from './import-blog-data';
import fs from 'fs/promises';
import path from 'path';
import readline from 'readline';

interface MigrationOptions {
  sourceDb: string;
  targetDb: string;
  exportFile?: string;
  dryRun: boolean;
  updateExisting: boolean;
}

async function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function confirmAction(message: string): Promise<boolean> {
  const answer = await askQuestion(`${message} (y/N): `);
  return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
}

async function migrateBlogData(options: MigrationOptions) {
  try {
    console.log('🚀 Starting blog data migration...');
    console.log(`📊 Source DB: ${options.sourceDb}`);
    console.log(`🎯 Target DB: ${options.targetDb}`);
    console.log(`🔧 Dry Run: ${options.dryRun}`);
    console.log(`🔄 Update Existing: ${options.updateExisting}`);
    
    // Step 1: Export data from source database
    console.log('\n📤 Step 1: Exporting data from source database...');
    const exportFile = options.exportFile || await exportBlogData();
    console.log(`✅ Export completed: ${exportFile}`);
    
    // Step 2: Verify export file
    console.log('\n🔍 Step 2: Verifying export file...');
    const exportData = JSON.parse(await fs.readFile(exportFile, 'utf-8'));
    console.log(`📊 Export contains:`);
    console.log(`   - ${exportData.totalRecords.categories} categories`);
    console.log(`   - ${exportData.totalRecords.posts} posts`);
    console.log(`   - ${exportData.totalRecords.comments} comments`);
    console.log(`   - ${exportData.totalRecords.authors} authors`);
    console.log(`   - Export date: ${exportData.exportDate}`);
    
    // Step 3: Confirm migration
    if (!options.dryRun) {
      const confirmed = await confirmAction('\n⚠️  Are you sure you want to import this data into the target database?');
      if (!confirmed) {
        console.log('❌ Migration cancelled by user');
        return;
      }
    }
    
    // Step 4: Import data to target database
    console.log('\n📥 Step 3: Importing data to target database...');
    const stats = await importBlogData(exportFile, {
      skipExisting: !options.updateExisting,
      updateExisting: options.updateExisting,
      dryRun: options.dryRun,
    });
    
    // Step 5: Summary
    console.log('\n🎉 Migration completed successfully!');
    console.log('📊 Final Summary:');
    console.log(`   Categories: ${stats.categories.created} created, ${stats.categories.skipped} skipped, ${stats.categories.errors} errors`);
    console.log(`   Authors: ${stats.authors.created} created, ${stats.authors.skipped} skipped, ${stats.authors.errors} errors`);
    console.log(`   Posts: ${stats.posts.created} created, ${stats.posts.skipped} skipped, ${stats.posts.errors} errors`);
    console.log(`   Comments: ${stats.comments.created} created, ${stats.comments.skipped} skipped, ${stats.comments.errors} errors`);
    
    if (options.dryRun) {
      console.log('\n🔍 This was a DRY RUN - no data was actually migrated.');
      console.log('   Run without --dry-run to perform the actual migration.');
    } else {
      console.log('\n✅ Blog data has been successfully migrated!');
      console.log('   You can now access your blog posts on the live site.');
    }
    
    return stats;
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function interactiveMigration() {
  console.log('🔄 Blog Data Migration Tool');
  console.log('============================\n');
  
  try {
    // Get source database info
    const sourceDb = await askQuestion('Enter source database name/identifier: ');
    
    // Get target database info
    const targetDb = await askQuestion('Enter target database name/identifier: ');
    
    // Ask about existing export file
    const useExistingExport = await confirmAction('Do you have an existing export file to use?');
    let exportFile: string | undefined;
    
    if (useExistingExport) {
      exportFile = await askQuestion('Enter path to existing export file: ');
      
      // Verify file exists
      try {
        await fs.access(exportFile);
        console.log('✅ Export file found');
      } catch {
        console.log('❌ Export file not found, will create new export');
        exportFile = undefined;
      }
    }
    
    // Ask about dry run
    const dryRun = await confirmAction('Do you want to perform a dry run first? (recommended)');
    
    // Ask about updating existing records
    const updateExisting = await confirmAction('Do you want to update existing records?');
    
    const options: MigrationOptions = {
      sourceDb,
      targetDb,
      exportFile,
      dryRun,
      updateExisting,
    };
    
    await migrateBlogData(options);
    
  } catch (error) {
    console.error('❌ Interactive migration failed:', error);
    throw error;
  }
}

// Run the migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Blog Data Migration Tool

Usage:
  npm run migrate-blog-data                    # Interactive mode
  npm run migrate-blog-data --dry-run          # Dry run mode
  npm run migrate-blog-data --update-existing  # Update existing records

Options:
  --dry-run          Perform a dry run without making changes
  --update-existing  Update existing records instead of skipping them
  --help, -h         Show this help message

Examples:
  npm run migrate-blog-data
  npm run migrate-blog-data --dry-run
  npm run migrate-blog-data --update-existing
`);
    process.exit(0);
  }
  
  const dryRun = args.includes('--dry-run');
  const updateExisting = args.includes('--update-existing');
  
  if (dryRun || updateExisting) {
    // Non-interactive mode
    const options: MigrationOptions = {
      sourceDb: 'current',
      targetDb: 'live',
      dryRun,
      updateExisting,
    };
    
    migrateBlogData(options)
      .then(() => {
        console.log('\n✅ Migration completed successfully!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Migration failed:', error);
        process.exit(1);
      });
  } else {
    // Interactive mode
    interactiveMigration()
      .then(() => {
        console.log('\n✅ Migration completed successfully!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Migration failed:', error);
        process.exit(1);
      });
  }
}

export { migrateBlogData, interactiveMigration };
