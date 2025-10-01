import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { db } from '../db';
import { blogPosts, blogCategories, blogComments, users } from '../../shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

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

interface SeedStats {
  categories: { created: number; skipped: number; errors: number };
  authors: { created: number; skipped: number; errors: number };
  posts: { created: number; skipped: number; errors: number };
  comments: { created: number; skipped: number; errors: number };
}

/**
 * Admin route to run blog data seeding directly
 * POST /api/admin/seed-blog-data
 */
router.post('/seed-blog-data', async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }

    const { exportFile = 'exports/blog-export-2025-10-01.json' } = req.body;

    // Check if export file exists
    const exportPath = path.join(process.cwd(), exportFile);
    try {
      await fs.access(exportPath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: `Export file not found: ${exportFile}`,
        availableFiles: await getAvailableExportFiles()
      });
    }

    console.log('🚀 Starting blog data seeding via API...');
    
    // Run the seeding directly
    const result = await seedBlogDataDirect(exportPath);
    
    res.json({
      success: true,
      message: 'Blog data seeding completed successfully',
      ...result
    });

  } catch (error) {
    console.error('❌ Error in blog seeding API:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed blog data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Admin route to get available export files
 * GET /api/admin/export-files
 */
router.get('/export-files', async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }

    const files = await getAvailableExportFiles();
    
    res.json({
      success: true,
      files
    });

  } catch (error) {
    console.error('❌ Error getting export files:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get export files',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Direct blog data seeding function
 */
async function seedBlogDataDirect(exportFilePath: string): Promise<any> {
  try {
    console.log('🚀 Starting direct blog data seeding...');
    console.log(`📁 Import file: ${exportFilePath}`);
    
    // Read export file
    const exportData: BlogExportData = JSON.parse(
      await fs.readFile(exportFilePath, 'utf-8')
    );
    
    console.log(`📊 Found ${exportData.totalRecords.categories} categories, ${exportData.totalRecords.posts} posts, ${exportData.totalRecords.comments} comments, ${exportData.totalRecords.authors} authors`);
    
    const stats: SeedStats = {
      categories: { created: 0, skipped: 0, errors: 0 },
      authors: { created: 0, skipped: 0, errors: 0 },
      posts: { created: 0, skipped: 0, errors: 0 },
      comments: { created: 0, skipped: 0, errors: 0 },
    };
    
    // Import authors first
    console.log('\n👥 Seeding authors...');
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
        }
      } catch (error) {
        stats.authors.errors++;
        console.error(`❌ Error seeding author ${author.name}:`, error);
      }
    }
    
    // Import categories
    console.log('\n📁 Seeding categories...');
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
          const newCategory = await db.insert(blogCategories).values({
            name: category.name,
            slug: category.slug,
            description: category.description,
            image: category.image,
            parentId: category.parentId ? categoryIdMap.get(category.parentId) || null : null,
            order: category.order,
            createdAt: new Date(category.createdAt),
            updatedAt: new Date(category.updatedAt),
          }).returning();
          
          categoryIdMap.set(category.id, newCategory[0].id);
          stats.categories.created++;
          console.log(`✅ Created category: ${category.name}`);
        }
      } catch (error) {
        stats.categories.errors++;
        console.error(`❌ Error seeding category ${category.name}:`, error);
      }
    }
    
    // Import posts
    console.log('\n📝 Seeding posts...');
    const postIdMap = new Map<number, number>(); // oldId -> newId
    
    for (const post of exportData.posts) {
      try {
        // Check if post already exists by slug
        const existingPost = await db.select().from(blogPosts).where(eq(blogPosts.slug, post.slug)).limit(1);
        
        if (existingPost.length > 0) {
          postIdMap.set(post.id, existingPost[0].id);
          stats.posts.skipped++;
          console.log(`⏭️  Skipped existing post: ${post.title}`);
        } else {
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
            publishedAt: post.publishedAt ? new Date(post.publishedAt) : null,
            createdAt: new Date(post.createdAt),
            updatedAt: new Date(post.updatedAt),
          }).returning();
          
          postIdMap.set(post.id, newPost[0].id);
          stats.posts.created++;
          console.log(`✅ Created post: ${post.title}`);
        }
      } catch (error) {
        stats.posts.errors++;
        console.error(`❌ Error seeding post ${post.title}:`, error);
      }
    }
    
    // Import comments
    console.log('\n💬 Seeding comments...');
    
    for (const comment of exportData.comments) {
      try {
        const newPostId = postIdMap.get(comment.postId);
        if (!newPostId) {
          stats.comments.errors++;
          console.error(`❌ Post not found for comment: ${comment.id}`);
          continue;
        }
        
        // Handle missing user IDs by setting to null
        const newUserId = comment.userId ? authorIdMap.get(comment.userId) || null : null;
        
        await db.insert(blogComments).values({
          postId: newPostId,
          userId: newUserId,
          parentId: comment.parentId,
          authorName: comment.authorName,
          authorEmail: comment.authorEmail,
          content: comment.content,
          status: comment.status,
          createdAt: new Date(comment.createdAt),
          updatedAt: new Date(comment.updatedAt),
        });
        
        stats.comments.created++;
        console.log(`✅ Created comment by: ${comment.authorName || 'Anonymous'}`);
      } catch (error) {
        stats.comments.errors++;
        console.error(`❌ Error seeding comment:`, error);
      }
    }
    
    // Print summary
    console.log('\n🎉 Blog data seeding completed!');
    console.log('📊 Seeding Summary:');
    console.log(`   Categories: ${stats.categories.created} created, ${stats.categories.skipped} skipped, ${stats.categories.errors} errors`);
    console.log(`   Authors: ${stats.authors.created} created, ${stats.authors.skipped} skipped, ${stats.authors.errors} errors`);
    console.log(`   Posts: ${stats.posts.created} created, ${stats.posts.skipped} skipped, ${stats.posts.errors} errors`);
    console.log(`   Comments: ${stats.comments.created} created, ${stats.comments.skipped} skipped, ${stats.comments.errors} errors`);
    
    return {
      categories: stats.categories,
      authors: stats.authors,
      posts: stats.posts,
      comments: stats.comments,
      message: 'Seeding completed successfully'
    };
    
  } catch (error) {
    console.error('❌ Error in direct seeding:', error);
    throw error;
  }
}

/**
 * Helper function to get available export files
 */
async function getAvailableExportFiles(): Promise<string[]> {
  try {
    const exportsDir = path.join(process.cwd(), 'exports');
    const files = await fs.readdir(exportsDir);
    return files.filter(file => file.endsWith('.json'));
  } catch (error) {
    console.error('Error reading exports directory:', error);
    return [];
  }
}

export default router;