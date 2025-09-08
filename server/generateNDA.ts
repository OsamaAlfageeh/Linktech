/**
 * ملف إنشاء اتفاقية عدم الإفصاح NDA باستخدام مكتبة pdf-lib
 */

import { Request, Response, Router } from 'express';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

/**
 * دالة بسيطة لعكس النص للعرض الصحيح
 * @param text النص المراد معالجته
 * @returns النص بعد المعالجة
 */
function processArabicText(text: string): string {
  // إرجاع النص كما هو - النصوص العربية تعرض بشكل صحيح في pdfmake الحديث
  return text;
}

// إنشاء موجه للمسارات
const router = Router();

/**
 * وظيفة مساعدة لإنشاء ملف PDF لاتفاقية عدم الإفصاح
 * هذه النسخة تستخدم مكتبة pdf-lib للحصول على أفضل استقرار
 * 
 * @param project بيانات المشروع
 * @param company بيانات الشركة
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
    console.log('إنشاء اتفاقية عدم الإفصاح باستخدام pdf-lib');
    
    // إنشاء مستند PDF جديد
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // إضافة صفحة
    const page = pdfDoc.addPage([612, 792]); // 8.5 x 11 inches
    const { width, height } = page.getSize();
      
    // إزالة جميع مراجع التاريخ لإنشاء قالب قابل لإعادة الاستخدام
    
    let y = height - 80;
    const margin = 50;
    const lineHeight = 20;
    
    // العنوان
    page.drawText('Non-Disclosure Agreement (NDA)', {
      x: margin,
      y: y,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    y -= 40;
    
    // إزالة تاريخ الإنشاء ليصبح الملف قابلاً لإعادة الاستخدام
    
    // معلومات المشروع
    page.drawText('Project Information:', {
      x: margin,
      y: y,
      size: 14,
      font: boldFont,
    });
    y -= lineHeight;
    
    page.drawText(`Project Name: ${project.title ? project.title.replace(/[\u0600-\u06FF]/g, '[Arabic Text]') : 'Not specified'}`, {
      x: margin,
      y: y,
      size: 12,
      font: font,
    });
    y -= lineHeight;
    
    page.drawText(`Description: ${project.description ? project.description.replace(/[\u0600-\u06FF]/g, '[Arabic Text]') : 'Not specified'}`, {
      x: margin,
      y: y,
      size: 12,
      font: font,
    });
    y -= 30;
    
    // معلومات الشركة
    page.drawText('Company Information:', {
      x: margin,
      y: y,
      size: 14,
      font: boldFont,
    });
    y -= lineHeight;
    
    page.drawText(`Company Name: ${company.name ? company.name.replace(/[\u0600-\u06FF]/g, '[Arabic Text]') : 'Not specified'}`, {
      x: margin,
      y: y,
      size: 12,
      font: font,
    });
    y -= lineHeight;
    
    page.drawText(`Location: ${company.location ? company.location.replace(/[\u0600-\u06FF]/g, '[Arabic Text]') : 'Saudi Arabia'}`, {
      x: margin,
      y: y,
      size: 12,
      font: font,
    });
    y -= 30;
    
    // شروط الاتفاقية
    page.drawText('Agreement Terms:', {
      x: margin,
      y: y,
      size: 14,
      font: boldFont,
    });
    y -= lineHeight;
    
    const terms = [
      '1. The second party shall maintain confidentiality of all project information.',
      '2. This agreement is effective from the date of signing.',
      '3. This agreement remains valid for two years after project completion.',
      '4. Any breach of this agreement allows legal action by the affected party.',
      '5. This agreement is governed by Saudi Arabian law.'
    ];
    
    terms.forEach(term => {
      page.drawText(term, {
        x: margin,
        y: y,
        size: 11,
        font: font,
      });
      y -= lineHeight;
    });
    
    y -= 30;
    
    // التوقيعات
    page.drawText('Signatures:', {
      x: margin,
      y: y,
      size: 14,
      font: boldFont,
    });
    y -= 30;
    
    // First Party - Project Owner (sanitized name)
    const entrepreneurName = (partialNames?.entrepreneur || '[Project Owner Name]').replace(/[\u0600-\u06FF]/g, '[Arabic Text]');
    page.drawText(`First Party (Project Owner): ${entrepreneurName}`, {
      x: margin,
      y: y,
      size: 12,
      font: font,
    });
    page.drawText('Signature: _______________________', {
      x: margin,
      y: y - 15,
      size: 11,
      font: font,
    });
    y -= 50;
    
    // Second Party - Company Representative (sanitized names)
    const companyRepName = (partialNames?.companyRep || '[Company Representative Name]').replace(/[\u0600-\u06FF]/g, '[Arabic Text]');
    const sanitizedCompanyName = (company.name || 'Company').replace(/[\u0600-\u06FF]/g, '[Arabic Text]');
    page.drawText(`Second Party (${sanitizedCompanyName}): ${companyRepName}`, {
      x: margin,
      y: y,
      size: 12,
      font: font,
    });
    page.drawText('Signature: _______________________', {
      x: margin,
      y: y - 15,
      size: 11,
      font: font,
    });
    y -= 50;
    
    // إزالة معلومات التوقيع التلقائية - سيتم إضافتها لاحقاً في صادق
    
    y -= 30;
    
    // معلومات المنصة
    page.drawText('Created via LinkTech Platform - https://linktech.app', {
      x: margin,
      y: y,
      size: 9,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });
    y -= lineHeight;
    
    page.drawText(`Reference Number: NDA-${project.id}-${Date.now().toString().substring(0, 8)}`, {
      x: margin,
      y: y,
      size: 9,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });
    
    // حفظ المستند كـ Buffer
    const pdfBytes = await pdfDoc.save();
    console.log('تم إنشاء اتفاقية عدم الإفصاح بنجاح، حجم الملف:', pdfBytes.length, 'بايت');
    
    return Buffer.from(pdfBytes);
    
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