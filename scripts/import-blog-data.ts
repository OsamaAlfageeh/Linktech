#!/usr/bin/env tsx

/**
 * Blog Data Import Script
 * Imports blog data from JSON export file into the live database
 * 
 * Usage: npm run import-blog-data <export-file-path>
 */

import 'dotenv/config';
import { db } from '../server/db';
import { blogPosts, blogCategories, blogComments, users } from '../shared/schema';
import { eq } from 'drizzle-orm';
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

async function importBlogData(exportFilePath: string, options: {
  skipExisting?: boolean;
  updateExisting?: boolean;
  dryRun?: boolean;
} = {}) {
  const { skipExisting = true, updateExisting = false, dryRun = false } = options;
  
  try {
    console.log('🚀 Starting blog data import...');
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
    
    // Import authors first
    console.log('\n👥 Importing authors...');
    const authorIdMap = new Map<number, number>(); // oldId -> newId
    
    for (const author of exportData.authors) {
      try {
        // Check if author already exists by email
        const existingAuthor = await db.select().from(users).where(eq(users.email, author.email)).limit(1);
        
        if (existingAuthor.length > 0) {
          authorIdMap.set(author.id, existingAuthor[0].id);
          stats.authors.skipped++;
          console.log(`⏭️  Skipped existing author: ${author.name} (${author.email})`);
        } else {
          if (!dryRun) {
            const newAuthor = await db.insert(users).values({
              name: author.name,
              email: author.email,
              role: author.role,
              // Set default values for required fields
              password: 'migrated-user', // This should be updated by the user
              emailVerified: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            }).returning();
            
            authorIdMap.set(author.id, newAuthor[0].id);
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
        const existingCategory = await db.select().from(blogCategories).where(eq(blogCategories.slug, category.slug)).limit(1);
        
        if (existingCategory.length > 0) {
          categoryIdMap.set(category.id, existingCategory[0].id);
          stats.categories.skipped++;
          console.log(`⏭️  Skipped existing category: ${category.name}`);
        } else {
          if (!dryRun) {
            const newCategory = await db.insert(blogCategories).values({
              name: category.name,
              slug: category.slug,
              description: category.description,
              image: category.image,
              parentId: category.parentId ? categoryIdMap.get(category.parentId) || null : null,
              order: category.order,
              createdAt: category.createdAt,
              updatedAt: category.updatedAt,
            }).returning();
            
            categoryIdMap.set(category.id, newCategory[0].id);
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
        const existingPost = await db.select().from(blogPosts).where(eq(blogPosts.slug, post.slug)).limit(1);
        
        if (existingPost.length > 0) {
          if (updateExisting && !dryRun) {
            await db.update(blogPosts)
              .set({
                title: post.title,
                excerpt: post.excerpt,
                content: post.content,
                status: post.status,
                featuredImage: post.featuredImage,
                categoryId: post.categoryId ? categoryIdMap.get(post.categoryId) || null : null,
                tags: post.tags,
                metaTitle: post.metaTitle,
                metaDescription: post.metaDescription,
                metaKeywords: post.metaKeywords,
                published: post.published,
                views: post.views,
                publishedAt: post.publishedAt,
                updatedAt: new Date(),
              })
              .where(eq(blogPosts.id, existingPost[0].id));
            
            postIdMap.set(post.id, existingPost[0].id);
            stats.posts.created++; // Count as updated
            console.log(`🔄 Updated existing post: ${post.title}`);
          } else {
            postIdMap.set(post.id, existingPost[0].id);
            stats.posts.skipped++;
            console.log(`⏭️  Skipped existing post: ${post.title}`);
          }
        } else {
          if (!dryRun) {
            const newPost = await db.insert(blogPosts).values({
              title: post.title,
              slug: post.slug,
              excerpt: post.excerpt,
              content: post.content,
              status: post.status,
              featuredImage: post.featuredImage,
              authorId: authorIdMap.get(post.authorId) || 1, // Fallback to admin user
              categoryId: post.categoryId ? categoryIdMap.get(post.categoryId) || null : null,
              tags: post.tags,
              metaTitle: post.metaTitle,
              metaDescription: post.metaDescription,
              metaKeywords: post.metaKeywords,
              published: post.published,
              views: post.views,
              publishedAt: post.publishedAt,
              createdAt: post.createdAt,
              updatedAt: post.updatedAt,
            }).returning();
            
            postIdMap.set(post.id, newPost[0].id);
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
          await db.insert(blogComments).values({
            postId: newPostId,
            userId: comment.userId ? authorIdMap.get(comment.userId) || null : null,
            parentId: comment.parentId,
            authorName: comment.authorName,
            authorEmail: comment.authorEmail,
            content: comment.content,
            status: comment.status,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
          });
          
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
    }
    
    return stats;
    
  } catch (error) {
    console.error('❌ Error importing blog data:', error);
    throw error;
  }
}

// Run the import if this script is executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     import.meta.url.endsWith(process.argv[1]) ||
                     process.argv[1].endsWith('import-blog-data.ts');

if (isMainModule) {
  const args = process.argv.slice(2);
  const exportFile = args[0];
  const dryRun = args.includes('--dry-run');
  const updateExisting = args.includes('--update-existing');
  
  if (!exportFile) {
    console.error('❌ Please provide the export file path');
    console.log('Usage: npm run import-blog-data <export-file-path> [--dry-run] [--update-existing]');
    process.exit(1);
  }
  
  importBlogData(exportFile, { 
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

export { importBlogData };
