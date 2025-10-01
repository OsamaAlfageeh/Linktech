#!/usr/bin/env tsx

/**
 * Blog Data Import Script for PostgreSQL
 * Imports blog data from JSON export file into a local PostgreSQL database
 * 
 * Usage: npm run import-blog-data-postgres <export-file-path>
 */

import 'dotenv/config';
import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';

interface BlogExportData {
  categories: any[];
  posts: any[];
  comments: any[];
  authors: any[];
  exportDate: string;
  totalRecords: {
    categories: number;
    posts: number;
    comments: number;
    authors: number;
  };
}

interface ImportStats {
  categories: { created: number; skipped: number; errors: number };
  authors: { created: number; skipped: number; errors: number };
  posts: { created: number; skipped: number; errors: number };
  comments: { created: number; skipped: number; errors: number };
}

// Create PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Alternative: use individual environment variables
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  user: process.env.PGUSER || 'root',
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE || 'linktech',
});

async function importBlogDataPostgres(exportFilePath: string, options: {
  skipExisting?: boolean;
  updateExisting?: boolean;
  dryRun?: boolean;
} = {}) {
  const { skipExisting = true, updateExisting = false, dryRun = false } = options;
  
  try {
    console.log('🚀 Starting blog data import to PostgreSQL...');
    console.log(`📁 Import file: ${exportFilePath}`);
    console.log(`🔧 Options: skipExisting=${skipExisting}, updateExisting=${updateExisting}, dryRun=${dryRun}`);
    
    // Read export file
    const exportData: BlogExportData = JSON.parse(
      await fs.readFile(exportFilePath, 'utf-8')
    );
    
    console.log(`📊 Found ${exportData.totalRecords.categories} categories, ${exportData.totalRecords.posts} posts, ${exportData.totalRecords.comments} comments, ${exportData.totalRecords.authors} authors`);
    
    const stats: ImportStats = {
      categories: { created: 0, skipped: 0, errors: 0 },
      authors: { created: 0, skipped: 0, errors: 0 },
      posts: { created: 0, skipped: 0, errors: 0 },
      comments: { created: 0, skipped: 0, errors: 0 },
    };
    
    // Test database connection
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');
    
    try {
      // Import authors first
      console.log('\n👥 Importing authors...');
      const authorIdMap = new Map<number, number>(); // oldId -> newId
      
      for (const author of exportData.authors) {
        try {
          // Check if author already exists by email
          const existingAuthor = await client.query(
            'SELECT id FROM users WHERE email = $1',
            [author.email]
          );
          
          if (existingAuthor.rows.length > 0) {
            authorIdMap.set(author.id, existingAuthor.rows[0].id);
            stats.authors.skipped++;
            console.log(`⏭️  Skipped existing author: ${author.name} (${author.email})`);
          } else {
            if (!dryRun) {
              const newAuthor = await client.query(
                `INSERT INTO users (name, email, role, password, email_verified, created_at, updated_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
                [author.name, author.email, author.role, 'migrated-user', false, new Date(), new Date()]
              );
              
              authorIdMap.set(author.id, newAuthor.rows[0].id);
              stats.authors.created++;
              console.log(`✅ Created author: ${author.name} (${author.email})`);
            } else {
              stats.authors.created++;
              console.log(`🔍 [DRY RUN] Would create author: ${author.name} (${author.email})`);
            }
          }
        } catch (error) {
          stats.authors.errors++;
          console.error(`❌ Error importing author ${author.name}:`, error);
        }
      }
      
      // Import categories
      console.log('\n📁 Importing categories...');
      const categoryIdMap = new Map<number, number>(); // oldId -> newId
      
      for (const category of exportData.categories) {
        try {
          // Check if category already exists by slug
          const existingCategory = await client.query(
            'SELECT id FROM blog_categories WHERE slug = $1',
            [category.slug]
          );
          
          if (existingCategory.rows.length > 0) {
            categoryIdMap.set(category.id, existingCategory.rows[0].id);
            stats.categories.skipped++;
            console.log(`⏭️  Skipped existing category: ${category.name}`);
          } else {
            if (!dryRun) {
              const newCategory = await client.query(
                `INSERT INTO blog_categories (name, slug, description, image, parent_id, "order", created_at, updated_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
                [
                  category.name, 
                  category.slug, 
                  category.description, 
                  category.image, 
                  category.parentId ? categoryIdMap.get(category.parentId) || null : null,
                  category.order,
                  category.createdAt,
                  category.updatedAt
                ]
              );
              
              categoryIdMap.set(category.id, newCategory.rows[0].id);
              stats.categories.created++;
              console.log(`✅ Created category: ${category.name}`);
            } else {
              stats.categories.created++;
              console.log(`🔍 [DRY RUN] Would create category: ${category.name}`);
            }
          }
        } catch (error) {
          stats.categories.errors++;
          console.error(`❌ Error importing category ${category.name}:`, error);
        }
      }
      
      // Import posts
      console.log('\n📝 Importing posts...');
      const postIdMap = new Map<number, number>(); // oldId -> newId
      
      for (const post of exportData.posts) {
        try {
          // Check if post already exists by slug
          const existingPost = await client.query(
            'SELECT id FROM blog_posts WHERE slug = $1',
            [post.slug]
          );
          
          if (existingPost.rows.length > 0) {
            if (updateExisting && !dryRun) {
              await client.query(
                `UPDATE blog_posts SET 
                 title = $1, excerpt = $2, content = $3, status = $4, featured_image = $5,
                 category_id = $6, tags = $7, meta_title = $8, meta_description = $9, 
                 meta_keywords = $10, published = $11, views = $12, published_at = $13, updated_at = $14
                 WHERE id = $15`,
                [
                  post.title, post.excerpt, post.content, post.status, post.featuredImage,
                  post.categoryId ? categoryIdMap.get(post.categoryId) || null : null,
                  post.tags, post.metaTitle, post.metaDescription, post.metaKeywords,
                  post.published, post.views, post.publishedAt, new Date(), existingPost.rows[0].id
                ]
              );
              
              postIdMap.set(post.id, existingPost.rows[0].id);
              stats.posts.created++; // Count as updated
              console.log(`🔄 Updated existing post: ${post.title}`);
            } else {
              postIdMap.set(post.id, existingPost.rows[0].id);
              stats.posts.skipped++;
              console.log(`⏭️  Skipped existing post: ${post.title}`);
            }
          } else {
            if (!dryRun) {
              const newPost = await client.query(
                `INSERT INTO blog_posts (
                  title, slug, excerpt, content, status, featured_image, author_id, category_id,
                  tags, meta_title, meta_description, meta_keywords, published, views, 
                  published_at, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING id`,
                [
                  post.title, post.slug, post.excerpt, post.content, post.status, post.featuredImage,
                  authorIdMap.get(post.authorId) || 1, // Fallback to admin user
                  post.categoryId ? categoryIdMap.get(post.categoryId) || null : null,
                  post.tags, post.metaTitle, post.metaDescription, post.metaKeywords,
                  post.published, post.views, post.publishedAt, post.createdAt, post.updatedAt
                ]
              );
              
              postIdMap.set(post.id, newPost.rows[0].id);
              stats.posts.created++;
              console.log(`✅ Created post: ${post.title}`);
            } else {
              stats.posts.created++;
              console.log(`🔍 [DRY RUN] Would create post: ${post.title}`);
            }
          }
        } catch (error) {
          stats.posts.errors++;
          console.error(`❌ Error importing post ${post.title}:`, error);
        }
      }
      
      // Import comments
      console.log('\n💬 Importing comments...');
      
      for (const comment of exportData.comments) {
        try {
          const newPostId = postIdMap.get(comment.postId);
          if (!newPostId) {
            stats.comments.errors++;
            console.error(`❌ Post not found for comment: ${comment.id}`);
            continue;
          }
          
          if (!dryRun) {
            await client.query(
              `INSERT INTO blog_comments (
                post_id, user_id, parent_id, author_name, author_email, content, status, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
              [
                newPostId,
                comment.userId ? authorIdMap.get(comment.userId) || null : null,
                comment.parentId,
                comment.authorName,
                comment.authorEmail,
                comment.content,
                comment.status,
                comment.createdAt,
                comment.updatedAt
              ]
            );
            
            stats.comments.created++;
            console.log(`✅ Created comment by: ${comment.authorName || 'Anonymous'}`);
          } else {
            stats.comments.created++;
            console.log(`🔍 [DRY RUN] Would create comment by: ${comment.authorName || 'Anonymous'}`);
          }
        } catch (error) {
          stats.comments.errors++;
          console.error(`❌ Error importing comment:`, error);
        }
      }
      
    } finally {
      client.release();
    }
    
    // Print summary
    console.log('\n🎉 Blog data import completed!');
    console.log('📊 Import Summary:');
    console.log(`   Categories: ${stats.categories.created} created, ${stats.categories.skipped} skipped, ${stats.categories.errors} errors`);
    console.log(`   Authors: ${stats.authors.created} created, ${stats.authors.skipped} skipped, ${stats.authors.errors} errors`);
    console.log(`   Posts: ${stats.posts.created} created, ${stats.posts.skipped} skipped, ${stats.posts.errors} errors`);
    console.log(`   Comments: ${stats.comments.created} created, ${stats.comments.skipped} skipped, ${stats.comments.errors} errors`);
    
    if (dryRun) {
      console.log('\n🔍 This was a DRY RUN - no data was actually imported.');
      console.log('   Run without --dry-run to perform the actual import.');
    } else {
      console.log('\n✅ Blog data has been successfully imported to PostgreSQL!');
      console.log('   You can now access your blog posts on the live site.');
    }
    
    return stats;
    
  } catch (error) {
    console.error('❌ Error importing blog data:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the import if this script is executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     import.meta.url.endsWith(process.argv[1]) ||
                     process.argv[1].endsWith('import-blog-data-postgres.ts');

if (isMainModule) {
  const args = process.argv.slice(2);
  const exportFile = args[0];
  const dryRun = args.includes('--dry-run');
  const updateExisting = args.includes('--update-existing');
  
  if (!exportFile) {
    console.error('❌ Please provide the export file path');
    console.log('Usage: npm run import-blog-data-postgres <export-file-path> [--dry-run] [--update-existing]');
    process.exit(1);
  }
  
  importBlogDataPostgres(exportFile, { 
    skipExisting: !updateExisting, 
    updateExisting, 
    dryRun 
  })
    .then((stats) => {
      console.log(`\n✅ Import completed successfully!`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Import failed:', error);
      process.exit(1);
    });
}

export { importBlogDataPostgres };
