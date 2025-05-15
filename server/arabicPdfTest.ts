/**
 * وحدة اختبار PDF العربي
 * تحتوي على نقاط نهاية لاختبار عرض وتنزيل PDF عربي
 */

import { Request, Response, Router } from 'express';
import path from 'path';
import PDFDocument from 'pdfkit';
import arabicReshaper from 'arabic-reshaper';
import bidi from 'bidi-js';

// إنشاء موجه للمسارات
const router = Router();

// مساعدة لإعادة تشكيل و bidi مع تحسين لمعالجة ترتيب الكلمات
function toArabic(text: string): string {
  try {
    // 1) reshape: يربط الحروف مع بعض
    const reshaped = arabicReshaper.reshape(text);
    
    // 2) معالجة خاصة للاتجاه من اليمين لليسار
    // تقسيم النص إلى جمل/سطور (اختياري)
    const lines = reshaped.split('\n');
    const processedLines = lines.map(line => {
      // تقسيم كل سطر إلى كلمات
      const words = line.split(' ');
      // عكس ترتيب الكلمات (حتى تظهر من اليمين إلى اليسار)
      const reversedWords = words.reverse();
      // إعادة دمج الكلمات المعكوسة
      return reversedWords.join(' ');
    });
    
    // إعادة دمج السطور
    const processedText = processedLines.join('\n');
    
    // 3) استخدام bidi للحصول على النص المرئي النهائي
    return bidi.getVisualString(processedText);
  } catch (error) {
    console.error('خطأ في معالجة النص العربي:', error);
    return text; // إرجاع النص الأصلي في حالة الخطأ
  }
}

// إنشاء مستند PDF عربي
function createArabicPdf(doc: PDFKit.PDFDocument) {
  // تحميل الخط العربي
  const fontPath = path.join(process.cwd(), 'attached_assets', 'Cairo-Regular.ttf');
  doc.font(fontPath);
  
  // إضافة محتوى باللغة العربية للاختبار
  doc.fontSize(24).text(toArabic('مرحبًا بكم في اختبار دعم اللغة العربية'), {
    align: 'right'
  });
  
  doc.moveDown();
  doc.fontSize(16).text(toArabic('هذا اختبار لعرض النصوص العربية في ملفات PDF'), {
    align: 'right'
  });
  
  doc.moveDown();
  doc.fontSize(14).text(toArabic('محتوى فقرة تجريبية باللغة العربية. نختبر هنا قدرة المكتبة على عرض النصوص العربية بشكل صحيح مع دعم التشكيل والاتجاه من اليمين إلى اليسار.'), {
    align: 'right'
  });
  
  doc.moveDown();
  const currentDate = new Date();
  const dateString = currentDate.toLocaleDateString('ar-SA');
  doc.fontSize(12).text(toArabic(`تاريخ إنشاء المستند: ${dateString}`), {
    align: 'right'
  });
  
  doc.moveDown();
  doc.fontSize(14).text(toArabic('أرقام للاختبار: ١٢٣٤٥٦٧٨٩٠'), {
    align: 'right'
  });
}

// صفحة HTML تحتوي على زر تنزيل وعرض لملف PDF
router.get('/arabic-pdf-test', (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>اختبار PDF باللغة العربية</title>
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
      <h1>اختبار عرض النصوص العربية في ملفات PDF</h1>
      
      <div class="option">
        <h2>الخيار 1: عرض PDF في المتصفح</h2>
        <p>سيتم عرض ملف PDF مباشرة في المتصفح</p>
        <a href="/api/view-arabic-pdf" class="btn view-btn" target="_blank">عرض الملف</a>
      </div>
      
      <div class="option">
        <h2>الخيار 2: تنزيل PDF</h2>
        <p>سيتم تنزيل ملف PDF للاحتفاظ به على جهازك</p>
        <a href="/api/test-arabic-pdf" class="btn download-btn">تنزيل الملف</a>
      </div>
    </body>
    </html>
  `);
});

// نقطة نهاية جديدة لعرض ملف PDF مباشرة في المتصفح
router.get('/api/view-arabic-pdf', async (req: Request, res: Response) => {
  try {
    console.log('اختبار إنشاء PDF باللغة العربية - عرض مباشر');
    
    // إنشاء وثيقة PDF جديدة
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: 'اختبار دعم اللغة العربية',
        Author: 'لينكتك',
        Subject: 'اختبار توليد ملفات PDF بالعربية',
      }
    });
    
    // إعداد رأس الاستجابة لعرض PDF مباشرة في المتصفح
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=arabic-test.pdf');
    
    // توجيه مخرجات PDF مباشرة إلى الاستجابة
    doc.pipe(res);
    
    // إضافة محتوى PDF
    createArabicPdf(doc);
    
    // إنهاء المستند
    doc.end();
    
  } catch (error) {
    console.error('خطأ في إنشاء PDF للاختبار (عرض):', error);
    res.status(500).json({ message: 'حدث خطأ أثناء إنشاء PDF للاختبار' });
  }
});

// نقطة نهاية لاختبار تنزيل ملف PDF باللغة العربية
router.get('/api/test-arabic-pdf', async (req: Request, res: Response) => {
  try {
    console.log('اختبار إنشاء PDF باللغة العربية للتنزيل');
    
    // إنشاء وثيقة PDF جديدة مع دعم اللغة العربية
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: 'وثيقة اختبار اللغة العربية',
        Author: 'منصة لينكتك',
        Subject: 'اختبار',
      }
    });

    // إعداد رأس الاستجابة للتنزيل - استخدام "attachment" بدلاً من "inline"
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=arabic-test.pdf');
    
    // توجيه مخرجات PDF مباشرة إلى الاستجابة
    doc.pipe(res);
    
    // إضافة محتوى PDF
    createArabicPdf(doc);
    
    // إنهاء المستند
    doc.end();
    
  } catch (error) {
    console.error('خطأ في إنشاء PDF للاختبار:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء إنشاء PDF للاختبار' });
  }
});

export default router;