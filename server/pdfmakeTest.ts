/**
 * وحدة اختبار PDF العربي باستخدام مكتبة pdfmake
 * تحتوي على نقاط نهاية لاختبار عرض وتنزيل PDF عربي
 */

import { Request, Response, Router } from 'express';
import path from 'path';
import fs from 'fs';
// استيراد pdfmake - بطريقة تتلاءم مع TypeScript/ESM
import PdfPrinter from 'pdfmake/src/printer.js';

// إنشاء موجه للمسارات
const router = Router();

// لم نعد بحاجة لوظيفة إعادة تشكيل النص العربي
// نعتمد الآن على خاصية RTL المدمجة في pdfmake

// صفحة HTML لاختبار PDF
router.get('/pdfmake-test', (req: Request, res: Response) => {
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
      <h1>اختبار عرض النصوص العربية في PDF باستخدام pdfmake</h1>
      
      <div class="option">
        <h2>اختبار pdfkit (الطريقة الحالية)</h2>
        <a href="/arabic-pdf-test" class="btn view-btn">فتح اختبار pdfkit</a>
      </div>
      
      <div class="option">
        <h2>اختبار pdfmake (الطريقة الجديدة)</h2>
        <p>اختبار عرض النص العربي باستخدام PDFMake</p>
        <a href="/api/test-pdfmake?mode=view" class="btn view-btn" target="_blank">عرض الملف باستخدام pdfmake</a>
        <a href="/api/test-pdfmake?mode=download" class="btn download-btn">تنزيل الملف باستخدام pdfmake</a>
      </div>
    </body>
    </html>
  `);
});

// نقطة نهاية موحدة للعرض أو التنزيل باستخدام pdfmake
router.get('/api/test-pdfmake', async (req: Request, res: Response) => {
  try {
    // تحديد ما إذا كان العرض أو التنزيل
    const mode = req.query.mode === 'download' ? 'download' : 'view';
    console.log(`اختبار إنشاء PDF باللغة العربية باستخدام pdfmake - وضع: ${mode}`);
    
    // تحميل الخط العربي وتحويله إلى Base64
    const fontPath = path.join(process.cwd(), 'assets', 'fonts', 'Cairo-Regular.ttf');
    let fontExists = true;
    try {
      fs.accessSync(fontPath, fs.constants.R_OK);
    } catch (err) {
      fontExists = false;
      console.error(`خطأ: ملف الخط غير موجود في ${fontPath}`);
    }

    if (!fontExists) {
      return res.status(500).json({ 
        message: 'لم يتم العثور على ملف الخط Cairo-Regular.ttf' 
      });
    }

    // إنشاء تعريف الخطوط المستخدمة في pdfmake
    // استخدام مسار الملف مباشرة بدلاً من البيانات الثنائية
    const fonts = {
      Cairo: {
        normal: fontPath,
        bold: fontPath,
        italics: fontPath,
        bolditalics: fontPath
      }
    };
    
    // إنشاء نسخة مخصصة من pdfmake
    const printer = new PdfPrinter(fonts);
    
    // إنشاء تعريف المستند باستخدام الطريقة الجديدة
    const paragraphs = [
      'بموجب هذه الاتفاقية، يلتزم الطرف الثاني بالحفاظ على سرية جميع المعلومات المتعلقة بالمشروع، وعدم مشاركتها مع أي طرف ثالث دون إذن كتابي مسبق من الطرف الأول.',
      'تسري هذه الاتفاقية اعتباراً من تاريخ التوقيع الإلكتروني عليها، وتشمل جميع المراسلات والمستندات والمعلومات التي يتم تبادلها بين الطرفين لغرض تنفيذ المشروع.',
      'في حال الإخلال بأي من بنود هذه الاتفاقية، يحق للطرف المتضرر اتخاذ كافة الإجراءات القانونية اللازمة لحماية مصالحه وحقوقه.',
      'الطرف الأول: منصة لينكتك (https://linktech.app)',
      'الطرف الثاني: _____________________________',
      `تاريخ التوقيع: ${new Date().toISOString().split('T')[0]}`,
      'اختبار أرقام: ١٢٣٤٥٦٧٨٩٠'
    ];

    const docDefinition = {
      defaultStyle: {
        font: 'Cairo',
        alignment: 'right',
        direction: 'rtl',
        lineHeight: 1.3
      },
      pageMargins: [40, 60, 40, 60],
      styles: {
        header: { 
          fontSize: 20, 
          bold: true, 
          margin: [0, 0, 0, 10],
          alignment: 'center'
        },
        paragraph: { 
          fontSize: 12, 
          margin: [0, 8, 0, 8] 
        }
      },
      content: [
        // العنوان
        { text: 'اتفاقية عدم الإفصاح', style: 'header' },
        // الفقرات
        ...paragraphs.map((p, index) => ({ 
          text: p, 
          style: 'paragraph',
          margin: index === 3 ? [0, 30, 0, 0] : undefined // إضافة مسافة إضافية قبل معلومات الشركة
        }))
      ]
    };
    
    // إنشاء الـ PDF
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    
    // تحديد كيفية عرض الملف
    if (mode === 'download') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=arabic-test-pdfmake.pdf');
    } else {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename=arabic-test-pdfmake.pdf');
    }
    
    // إنشاء مسار مؤقت لحفظ الملف
    const tempPdfPath = path.join(process.cwd(), 'temp', 'arabic-test-pdfmake.pdf');
    
    // حفظ الملف محلياً ثم إرساله
    pdfDoc.pipe(fs.createWriteStream(tempPdfPath));
    pdfDoc.end();
    
    // انتظار حتى يتم إنشاء الملف بالكامل
    pdfDoc.on('end', () => {
      const fileStream = fs.createReadStream(tempPdfPath);
      fileStream.pipe(res);
    });
  } catch (error: any) {
    console.error('خطأ في إنشاء PDF باستخدام pdfmake:', error);
    res.status(500).json({ 
      message: 'حدث خطأ أثناء إنشاء ملف PDF', 
      error: error.message || String(error)
    });
  }
});

export default router;