#!/usr/bin/env tsx

/**
 * Blog Data Export Script
 * Exports all blog data from the current database to JSON files
 * 
 * Usage: npm run export-blog-data
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

async function exportBlogData() {
  try {
    console.log('🚀 Starting blog data export...');
    
    // Create export directory
    const exportDir = path.join(process.cwd(), 'exports');
    await fs.mkdir(exportDir, { recursive: true });
    
    // Export blog categories
    console.log('📁 Exporting blog categories...');
    const categories = await db.select().from(blogCategories);
    console.log(`✅ Exported ${categories.length} categories`);
    
    // Export blog posts with author information
    console.log('📝 Exporting blog posts...');
    const posts = await db.select({
      id: blogPosts.id,
      title: blogPosts.title,
      slug: blogPosts.slug,
      excerpt: blogPosts.excerpt,
      content: blogPosts.content,
      status: blogPosts.status,
      featuredImage: blogPosts.featuredImage,
      authorId: blogPosts.authorId,
      categoryId: blogPosts.categoryId,
      tags: blogPosts.tags,
      metaTitle: blogPosts.metaTitle,
      metaDescription: blogPosts.metaDescription,
      metaKeywords: blogPosts.metaKeywords,
      published: blogPosts.published,
      views: blogPosts.views,
      publishedAt: blogPosts.publishedAt,
      createdAt: blogPosts.createdAt,
      updatedAt: blogPosts.updatedAt,
      // Include author information
      authorName: users.name,
      authorEmail: users.email,
    })
    .from(blogPosts)
    .leftJoin(users, eq(blogPosts.authorId, users.id));
    
    console.log(`✅ Exported ${posts.length} posts`);
    
    // Export blog comments
    console.log('💬 Exporting blog comments...');
    const comments = await db.select({
      id: blogComments.id,
      postId: blogComments.postId,
      userId: blogComments.userId,
      parentId: blogComments.parentId,
      authorName: blogComments.authorName,
      authorEmail: blogComments.authorEmail,
      content: blogComments.content,
      status: blogComments.status,
      createdAt: blogComments.createdAt,
      updatedAt: blogComments.updatedAt,
    }).from(blogComments);
    
    console.log(`✅ Exported ${comments.length} comments`);
    
    // Get unique authors
    const authorIds = [...new Set(posts.map(post => post.authorId).filter(Boolean))];
    const authors = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    }).from(users).where(eq(users.id, authorIds[0] || 0));
    
    // If multiple authors, get all of them
    if (authorIds.length > 1) {
      const additionalAuthors = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      }).from(users).where(eq(users.id, authorIds[1] || 0));
      authors.push(...additionalAuthors);
    }
    
    console.log(`✅ Exported ${authors.length} authors`);
    
    // Prepare export data
    const exportData: BlogExportData = {
      categories,
      posts,
      comments,
      authors,
      exportDate: new Date().toISOString(),
      totalRecords: {
        categories: categories.length,
        posts: posts.length,
        comments: comments.length,
        authors: authors.length,
      }
    };
    
    // Save to JSON file
    const exportFile = path.join(exportDir, `blog-export-${new Date().toISOString().split('T')[0]}.json`);
    await fs.writeFile(exportFile, JSON.stringify(exportData, null, 2), 'utf-8');
    
    console.log('🎉 Blog data export completed successfully!');
    console.log(`📄 Export file: ${exportFile}`);
    console.log(`📊 Total records exported:`);
    console.log(`   - Categories: ${exportData.totalRecords.categories}`);
    console.log(`   - Posts: ${exportData.totalRecords.posts}`);
    console.log(`   - Comments: ${exportData.totalRecords.comments}`);
    console.log(`   - Authors: ${exportData.totalRecords.authors}`);
    
    return exportFile;
    
  } catch (error) {
    console.error('❌ Error exporting blog data:', error);
    throw error;
  }
}

// Run the export if this script is executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     import.meta.url.endsWith(process.argv[1]) ||
                     process.argv[1].endsWith('export-blog-data.ts');

if (isMainModule) {
  console.log('🚀 Starting blog data export...');
  exportBlogData()
    .then((exportFile) => {
      console.log(`\n✅ Export completed successfully!`);
      console.log(`📁 File saved to: ${exportFile}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Export failed:', error);
      process.exit(1);
    });
}

export { exportBlogData };
