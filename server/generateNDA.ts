/**
 * ملف إنشاء اتفاقية عدم الإفصاح NDA باستخدام مكتبة pdfmake
 */

import { Request, Response, Router } from 'express';
import path from 'path';
import fs from 'fs';
import PdfPrinter from 'pdfmake/src/printer';

// إنشاء موجه للمسارات
const router = Router();

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
    
    // تحميل الخط العربي
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
    
    // محتوى الاتفاقية
    const paragraphs = [
      'بموجب هذه الاتفاقية، يلتزم الطرف الثاني بالحفاظ على سرية جميع المعلومات المتعلقة بالمشروع، وعدم مشاركتها مع أي طرف ثالث دون إذن كتابي مسبق من الطرف الأول.',
      'تسري هذه الاتفاقية اعتباراً من تاريخ التوقيع الإلكتروني عليها، وتشمل جميع المراسلات والمستندات والمعلومات التي يتم تبادلها بين الطرفين لغرض تنفيذ المشروع.',
      'في حال الإخلال بأي من بنود هذه الاتفاقية، يحق للطرف المتضرر اتخاذ كافة الإجراءات القانونية اللازمة لحماية مصالحه وحقوقه.',
      'الطرف الأول: منصة لينكتك (https://linktech.app)',
      'الطرف الثاني: _____________________________',
      `تاريخ التوقيع: ${new Date().toISOString().split('T')[0]}`,
      'اختبار أرقام: ١٢٣٤٥٦٧٨٩٠'
    ];

    // إنشاء تعريف المستند
    const docDefinition = {
      // إعدادات المستند
      defaultStyle: {
        font: 'Cairo',
        alignment: 'right',
        direction: 'rtl',
        lineHeight: 1.5
      },
      pageMargins: [40, 60, 40, 60],
      
      // تعريف الأنماط
      styles: {
        header: { 
          fontSize: 22, 
          bold: true, 
          margin: [0, 0, 0, 20],
          alignment: 'center'
        },
        paragraph: { 
          fontSize: 14, 
          margin: [0, 10, 0, 10] 
        },
        signature: {
          fontSize: 12,
          margin: [0, 30, 0, 0]
        }
      },
      
      // محتوى المستند
      content: [
        // العنوان
        { text: 'اتفاقية عدم الإفصاح', style: 'header' },
        
        // مقدمة الاتفاقية
        { 
          text: 'تم إبرام هذه الاتفاقية بين كل من:', 
          style: 'paragraph',
          margin: [0, 0, 0, 20]
        },
        
        // الفقرات الرئيسية
        ...paragraphs.slice(0, 3).map(p => ({ 
          text: p, 
          style: 'paragraph'
        })),
        
        // معلومات التوقيع
        { 
          text: paragraphs[3], 
          style: 'signature'
        },
        { 
          text: paragraphs[4], 
          style: 'signature' 
        },
        { 
          text: paragraphs[5], 
          style: 'signature',
          margin: [0, 10, 0, 10]
        }
      ]
    };
    
    // استخدام اسم ملف بالإنجليزية لتجنب مشاكل التشفير
    const pdfFilename = 'linktech-nda.pdf';
    const tempPdfPath = path.join(tempDir, pdfFilename);
    
    // إنشاء الـ PDF
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    
    // كتابة الملف إلى مسار مؤقت
    const writeStream = fs.createWriteStream(tempPdfPath);
    pdfDoc.pipe(writeStream);
    pdfDoc.end();
    
    // عندما يكتمل إنشاء الملف
    writeStream.on('finish', () => {
      console.log(`تم إنشاء ملف PDF بنجاح في: ${tempPdfPath}`);
      
      // تعيين الترويسات المناسبة
      res.setHeader('Content-Type', 'application/pdf');
      
      if (mode === 'download') {
        // تنزيل الملف
        res.setHeader('Content-Disposition', `attachment; filename="${pdfFilename}"`);
      } else {
        // عرض الملف في المتصفح
        res.setHeader('Content-Disposition', `inline; filename="${pdfFilename}"`);
      }
      
      // إرسال الملف
      const fileStream = fs.createReadStream(tempPdfPath);
      fileStream.pipe(res);
    });
    
    // التعامل مع أخطاء الكتابة
    writeStream.on('error', (error) => {
      console.error('خطأ في كتابة ملف PDF:', error);
      res.status(500).json({ 
        message: 'حدث خطأ أثناء كتابة ملف PDF',
        error: error.message 
      });
    });
  } catch (error: any) {
    console.error('خطأ في إنشاء اتفاقية عدم الإفصاح:', error);
    res.status(500).json({ 
      message: 'حدث خطأ أثناء إنشاء ملف اتفاقية عدم الإفصاح', 
      error: error.message || String(error)
    });
  }
});

export default router;