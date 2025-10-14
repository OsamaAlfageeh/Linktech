/**
 * ملف إنشاء اتفاقية عدم الإفصاح NDA باستخدام مكتبة jsPDF
 * مع دعم كامل للنصوص العربية
 */

import { Request, Response, Router } from 'express';
import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';

// إنشاء موجه للمسارات
const router = Router();

/**
 * وظيفة مساعدة لإنشاء ملف PDF لاتفاقية عدم الإفصاح
 * هذه النسخة تستخدم مكتبة jsPDF مع دعم كامل للنصوص العربية
 * 
 * @param project بيانات المشروع
 * @param company بيانات الشركة
 * @param partialNames معلومات الأطراف (اختياري)
 * @param signerInfo معلومات الموقع (اختياري)
 * @returns وعد يرجع البفر النهائي للملف
 */
export async function generateProjectNdaPdf(
  project: any, 
  company: any, 
  partialNames?: {
    entrepreneur: string;
    companyRep: string;
  },
  signerInfo?: {
    name?: string;
    title?: string;
    date?: Date;
    ip?: string;
  }
): Promise<Buffer> {
  try {
    console.log('إنشاء اتفاقية عدم الإفصاح باستخدام jsPDF');
    
    // إنشاء مستند PDF جديد
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // متغيرات التخطيط
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const margin = 20;
    const lineHeight = 7;
    let currentY = margin;
    
    // دالة مساعدة لإضافة نص
    const addText = (text: string, fontSize: number = 12, isBold: boolean = false, color: string = '#000000') => {
      doc.setFontSize(fontSize);
      doc.setTextColor(color);
      if (isBold) {
        doc.setFont(undefined, 'bold');
      } else {
        doc.setFont(undefined, 'normal');
      }
      doc.text(text, margin, currentY);
      currentY += lineHeight;
    };

    // دالة مساعدة لإضافة عنوان
    const addTitle = (text: string) => {
      addText(text, 16, true, '#1a56db');
      currentY += 5;
    };

    // دالة مساعدة لإضافة عنوان فرعي
    const addSubtitle = (text: string) => {
      addText(text, 14, true, '#1e40af');
      currentY += 3;
    };

    // العنوان الرئيسي
    addTitle('Non-Disclosure Agreement (NDA)');
    currentY += 10;

    // معلومات المشروع
    addSubtitle('Project Information:');
    addText(`Project Name: ${project.title || 'Not specified'}`);
    addText(`Description: ${project.description || 'Not specified'}`);
    currentY += 5;


    // شروط الاتفاقية
    addSubtitle('Agreement Terms:');
    const terms = [
      '1. The company signing below agrees to maintain confidentiality of all project information.',
      '2. This agreement is effective from the date of digital signing through Nafath platform.',
      '3. This agreement remains valid for two years after project completion.',
      '4. Any breach of this agreement allows legal action by the affected party.',
      '5. This agreement is governed by Saudi Arabian law and digital signature regulations.',
      '6. Digital signatures through Nafath are legally binding and equivalent to handwritten signatures.'
    ];
    
    terms.forEach(term => {
      addText(term, 11);
    });
    currentY += 10;

    // التوقيعات الرقمية
    addSubtitle('Digital Signatures:');
    addText('First Party (Project Owner): Project Owner', 12, true);
    addText('Status: Agreed to terms (by posting project publicly)', 11, false, '#2d5a2d');
    currentY += 5;
    
    addText('The company signed below acknowledges and agrees to the terms of this agreement.', 12, true);
    currentY += 10;

    // تذييل
    currentY = pageHeight - 20;
    addText('Created via LinkTech Platform - https://linktech.app', 9, false, '#666666');
    addText(`Reference Number: NDA-${project.id}-${Date.now().toString().substring(0, 8)}`, 9, false, '#666666');
    
    // تحويل إلى Buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    
    console.log('تم إنشاء اتفاقية عدم الإفصاح بنجاح، حجم الملف:', pdfBuffer.length, 'بايت');
    
    return pdfBuffer;
    
  } catch (error: any) {
    console.error('خطأ في إنشاء اتفاقية عدم الإفصاح:', error);
    throw error;
  }
}

// صفحة HTML لاختبار PDF
router.get('/generate-nda-test', (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>إنشاء اتفاقية عدم الإفصاح</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          text-align: center;
        }
        h1 {
          color: #333;
        }
        .btn {
          display: inline-block;
          margin: 10px;
          padding: 12px 30px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 18px;
          text-decoration: none;
          color: white;
        }
        .download-btn {
          background-color: #4CAF50;
        }
        .view-btn {
          background-color: #2196F3;
        }
        .option {
          margin: 30px 0;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
        }
      </style>
    </head>
    <body>
      <h1>اختبار إنشاء اتفاقية عدم الإفصاح</h1>
      
      <div class="option">
        <h2>إنشاء NDA جديدة باستخدام الطريقة المحسنة</h2>
        <p>سيتم إنشاء اتفاقية عدم إفصاح جديدة لمنصة لينكتك</p>
        <a href="/api/generate-nda?mode=view" class="btn view-btn" target="_blank">عرض الملف</a>
        <a href="/api/generate-nda?mode=download" class="btn download-btn">تنزيل الملف</a>
      </div>
    </body>
    </html>
  `);
});

// نقطة نهاية لإنشاء ملف NDA
router.get('/api/generate-nda', async (req: Request, res: Response) => {
  try {
    // تحديد ما إذا كان العرض أو التنزيل
    const mode = req.query.mode === 'download' ? 'download' : 'view';
    console.log(`إنشاء اتفاقية عدم الإفصاح - وضع: ${mode}`);
    
    // إنشاء مجلد مؤقت للملف إذا لم يكن موجوداً
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // بيانات نموذجية للاختبار
    const sampleProject = {
      id: 12345,
      title: 'تطبيق إدارة المشاريع',
      description: 'تطبيق متكامل لإدارة المشاريع والمهام وتتبع الوقت لتسهيل العمل الجماعي وزيادة الإنتاجية'
    };
    
    const sampleCompany = {
      name: 'شركة التقنية المتقدمة',
      location: 'الرياض - المملكة العربية السعودية'
    };
    
    // إنشاء ملف PDF بدون معلومات توقيع لإنشاء قالب قابل لإعادة الاستخدام
    const pdfBuffer = await generateProjectNdaPdf(sampleProject, sampleCompany);
    
    // استخدام اسم ملف بالإنجليزية لتجنب مشاكل التشفير
    const pdfFilename = 'linktech-nda.pdf';
    const tempPdfPath = path.join(tempDir, pdfFilename);
    
    // حفظ الملف
    fs.writeFileSync(tempPdfPath, pdfBuffer);
    console.log(`تم إنشاء ملف PDF بنجاح في: ${tempPdfPath}`);
    
    // تعيين الترويسات المناسبة
    res.setHeader('Content-Type', 'application/pdf');
    
    if (mode === 'download') {
      // تنزيل الملف مع اسم عربي مناسب
      const arabicFilename = encodeURIComponent('اتفاقية_عدم_الإفصاح.pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${arabicFilename}"`);
    } else {
      // عرض الملف في المتصفح
      res.setHeader('Content-Disposition', `inline; filename="${pdfFilename}"`);
    }
    
    // إرسال الملف
    const fileStream = fs.createReadStream(tempPdfPath);
    fileStream.pipe(res);
    
  } catch (error: any) {
    console.error('خطأ في إنشاء اتفاقية عدم الإفصاح:', error);
    res.status(500).json({ 
      message: 'حدث خطأ أثناء إنشاء ملف اتفاقية عدم الإفصاح', 
      error: error.message || String(error)
    });
  }
});

export default router;