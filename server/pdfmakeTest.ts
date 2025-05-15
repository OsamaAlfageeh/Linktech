/**
 * وحدة اختبار PDF العربي باستخدام مكتبة pdfmake
 * تحتوي على نقاط نهاية لاختبار عرض وتنزيل PDF عربي
 */

import { Request, Response, Router } from 'express';
import path from 'path';
import fs from 'fs';
import arabicReshaper from 'arabic-reshaper';
import bidiFactory from 'bidi-js';
const bidi = bidiFactory();

// استيراد pdfmake - بطريقة تتلاءم مع TypeScript/ESM
import PdfPrinter from 'pdfmake/src/printer';

// إنشاء موجه للمسارات
const router = Router();

// وظيفة مساعدة لإعادة تشكيل النص العربي بالطريقة المحسنة (كلمة كلمة)
function reshapeArabicText(text: string): string {
  try {
    // الطريقة المحسنة: معالجة النص كلمة كلمة
    return text
      .split(' ')
      .map(word => {
        const reshaped = arabicReshaper.reshape(word);
        const bidiText = bidi.getDisplay(reshaped);
        return bidiText;
      })
      .reverse() // عكس ترتيب الكلمات لتصبح من اليمين لليسار
      .join(' ');
  } catch (error) {
    console.error('خطأ في معالجة النص العربي:', error);
    return text; // إرجاع النص الأصلي في حالة الخطأ
  }
}

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

    // مسار خط Cairo محلياً
    const fontBase64 = fs.readFileSync(fontPath).toString('base64');
    
    // إنشاء تعريف الخطوط المستخدمة في pdfmake
    const fonts = {
      Cairo: {
        normal: {
          data: Buffer.from(fontBase64, 'base64'),
        },
        bold: {
          data: Buffer.from(fontBase64, 'base64'),
        },
        italics: {
          data: Buffer.from(fontBase64, 'base64'),
        },
        bolditalics: {
          data: Buffer.from(fontBase64, 'base64'),
        }
      }
    };
    
    // إنشاء نسخة مخصصة من pdfmake
    const printer = new PdfPrinter(fonts);
    
    // إنشاء تعريف المستند
    const docDefinition = {
      defaultStyle: {
        font: 'Cairo'
      },
      content: [
        { 
          text: reshapeArabicText('اتفاقية عدم الإفصاح'),
          style: 'header',
          alignment: 'center',
        },
        '\n',
        { 
          text: reshapeArabicText('بموجب هذه الاتفاقية، يلتزم الطرف الثاني بالحفاظ على سرية جميع المعلومات المتعلقة بالمشروع، وعدم مشاركتها مع أي طرف ثالث دون إذن كتابي مسبق من الطرف الأول.'),
          alignment: 'right',
          margin: [0, 20, 0, 0]
        },
        { 
          text: reshapeArabicText('تسري هذه الاتفاقية اعتباراً من تاريخ التوقيع الإلكتروني عليها، وتشمل جميع المراسلات والمستندات والمعلومات التي يتم تبادلها بين الطرفين لغرض تنفيذ المشروع.'),
          alignment: 'right',
          margin: [0, 20, 0, 0]
        },
        { 
          text: reshapeArabicText('في حال الإخلال بأي من بنود هذه الاتفاقية، يحق للطرف المتضرر اتخاذ كافة الإجراءات القانونية اللازمة لحماية مصالحه وحقوقه.'),
          alignment: 'right',
          margin: [0, 20, 0, 0]
        },
        { 
          text: reshapeArabicText('الطرف الأول: منصة لينكتك (https://linktech.app)'),
          alignment: 'right',
          margin: [0, 40, 0, 0]
        },
        { 
          text: reshapeArabicText('الطرف الثاني: ___________________________'),
          alignment: 'right',
          margin: [0, 10, 0, 0]
        },
        { 
          text: reshapeArabicText(`تاريخ التوقيع: ${new Date().toISOString().split('T')[0]}`),
          alignment: 'right',
          margin: [0, 10, 0, 0]
        },
        { 
          text: reshapeArabicText('اختبار أرقام: ١٢٣٤٥٦٧٨٩٠'),
          alignment: 'right',
          margin: [0, 40, 0, 0]
        }
      ],
      styles: {
        header: {
          fontSize: 22,
          margin: [0, 0, 0, 20]
        }
      }
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