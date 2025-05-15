/**
 * وحدة اختبار PDF العربي
 * تحتوي على نقاط نهاية لاختبار عرض وتنزيل PDF عربي
 */

import { Request, Response, Router } from 'express';
import path from 'path';
import PDFKit from 'pdfkit';
// تعريف نوع PDFDocument كـ any لتجنب مشاكل TypeScript
type PDFDocument = any;
import arabicReshaper from 'arabic-reshaper';
import bidi from 'bidi-js';

// إنشاء موجه للمسارات
const router = Router();

// مساعدة لإعادة تشكيل النص العربي باستخدام النهج المقترح
function toArabic(text: string): string {
  try {
    // 1. إعادة تشكيل النص العربي (دمج الحروف بشكل صحيح)
    const reshaped = arabicReshaper.reshape(text);
    
    // 2. تصحيح اتجاه النص من اليمين إلى اليسار
    const bidiText = bidi.getDisplay(reshaped);
    
    return bidiText;
  } catch (error) {
    console.error('خطأ في معالجة النص العربي:', error);
    return text; // إرجاع النص الأصلي في حالة الخطأ
  }
}

// إنشاء مستند PDF عربي
function createArabicPdf(doc: any) {
  // تحميل الخط العربي
  const fontPath = path.join(process.cwd(), 'assets', 'fonts', 'Cairo-Regular.ttf');
  doc.font(fontPath);
  
  // حساب عرض الصفحة المتاح للكتابة
  const pageWidth = doc.page.width - (doc.page.margins as any).left - (doc.page.margins as any).right;
  
  // إضافة العنوان
  doc.fontSize(24);
  doc.text(toArabic('اتفاقية عدم إفصاح'), {
    align: 'center'
  });
  doc.moveDown();
  
  // إضافة محتوى رئيسي
  doc.fontSize(14);
  
  const content = `
بموجب هذه الاتفاقية، يلتزم الطرف الثاني بالحفاظ على سرية جميع المعلومات المتعلقة بالمشروع،
وعدم مشاركتها مع أي طرف ثالث دون إذن كتابي مسبق من الطرف الأول.

تسري هذه الاتفاقية اعتباراً من تاريخ التوقيع الإلكتروني عليها، وتشمل جميع المراسلات
والمستندات والمعلومات التي يتم تبادلها بين الطرفين لغرض تنفيذ المشروع.

في حال الإخلال بأي من بنود هذه الاتفاقية، يحق للطرف المتضرر اتخاذ كافة الإجراءات القانونية
اللازمة لحماية مصالحه وحقوقه.
  `;
  
  // معالجة كل سطر على حدة للحصول على أفضل نتيجة
  const lines = content.trim().split('\n');
  lines.forEach(line => {
    if (line.trim()) {
      doc.text(toArabic(line), {
        align: 'right',
        lineGap: 5
      });
    } else {
      doc.moveDown(0.5);
    }
  });
  
  // معلومات التواقيع
  doc.moveDown();
  doc.fontSize(12);
  doc.text(toArabic('الطرف الأول: منصة لينكتك (https://linktech.app)'), {
    align: 'right'
  });
  doc.moveDown();
  doc.text(toArabic('الطرف الثاني: ______________________'), {
    align: 'right'
  });
  doc.moveDown();
  
  // التاريخ
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  doc.text(toArabic(`تاريخ التوقيع: ${dateStr}`), {
    align: 'right'
  });
  
  // إضافة اختبار الأرقام
  doc.moveDown(2);
  doc.text(toArabic('اختبار أرقام: ١٢٣٤٥٦٧٨٩٠'), {
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
    const doc = new PDFKit({
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
    const doc = new PDFKit({
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