import { Router, Request, Response } from 'express';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

const router = Router();

/**
 * Admin route to run blog data seeding
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
    
    // Run the seeding script
    const result = await runSeedingScript(exportFile);
    
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
 * Admin route to get seeding status/logs
 * GET /api/admin/seed-status
 */
router.get('/seed-status', async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }

    // This could be enhanced to store logs in database or file
    res.json({
      success: true,
      message: 'Seeding status endpoint - logs would be stored here in production'
    });

  } catch (error) {
    console.error('❌ Error getting seed status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get seed status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Helper function to run the seeding script
 */
function runSeedingScript(exportFile: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), 'scripts', 'seed-blog-data.ts');
    const exportPath = path.join(process.cwd(), exportFile);
    
    const command = `npx tsx "${scriptPath}" "${exportPath}"`;
    console.log(`Running: ${command}`);
    
    exec(command, {
      cwd: process.cwd(),
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    }, (error, stdout, stderr) => {
      if (error) {
        console.error('Seeding error:', error.message);
        console.error('Stderr:', stderr);
        reject(new Error(`Seeding script failed: ${error.message}\n${stderr}`));
        return;
      }

      console.log('Seeding output:', stdout);
      if (stderr) {
        console.error('Seeding stderr:', stderr);
      }

      resolve({
        exitCode: 0,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        message: 'Seeding completed successfully'
      });
    });
  });
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
