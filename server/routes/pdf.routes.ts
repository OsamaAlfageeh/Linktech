/**
 * PDF Routes for Arabic PDF Generation
 */

import express from 'express';
import { generateArabicPDF, saveArabicPDF, sendPDFResponse } from '../pdfGenerator.tsx';

const router = express.Router();

// Route 1: Generate and download PDF
router.post('/generate-pdf', async (req, res) => {
  try {
    const projectData = req.body;
    
    // التحقق من البيانات
    if (!projectData || !projectData.projectName) {
      return res.status(400).json({ 
        error: 'بيانات المشروع مطلوبة' 
      });
    }

    // توليد PDF وإرساله
    await sendPDFResponse(projectData, res);
    
  } catch (error) {
    console.error('خطأ في توليد PDF:', error);
    res.status(500).json({ 
      error: 'حدث خطأ في توليد ملف PDF' 
    });
  }
});

// Route 2: Generate and save PDF to server
router.post('/save-pdf', async (req, res) => {
  try {
    const projectData = req.body;
    const filename = `project-${Date.now()}.pdf`;
    const outputPath = `./uploads/${filename}`;

    await saveArabicPDF(projectData, outputPath);

    res.json({ 
      success: true,
      message: 'تم حفظ PDF بنجاح',
      filename,
      path: outputPath
    });
    
  } catch (error) {
    console.error('خطأ في حفظ PDF:', error);
    res.status(500).json({ 
      error: 'حدث خطأ في حفظ ملف PDF' 
    });
  }
});

// Route 3: Generate PDF and return base64
router.post('/generate-pdf-base64', async (req, res) => {
  try {
    const projectData = req.body;
    
    const pdfBuffer = await generateArabicPDF(projectData);
    const base64 = pdfBuffer.toString('base64');

    res.json({ 
      success: true,
      pdf: base64,
      mimeType: 'application/pdf'
    });
    
  } catch (error) {
    console.error('خطأ في توليد PDF:', error);
    res.status(500).json({ 
      error: 'حدث خطأ في توليد ملف PDF' 
    });
  }
});

export default router;
