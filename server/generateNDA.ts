/**
 * ملف إنشاء اتفاقية عدم الإفصاح NDA باستخدام مكتبة pdfmake
 */

import { Request, Response, Router } from 'express';
import path from 'path';
import fs from 'fs';
import PdfPrinter from 'pdfmake/src/printer';

// إنشاء موجه للمسارات
const router = Router();

/**
 * وظيفة مساعدة لإنشاء ملف PDF لاتفاقية عدم الإفصاح
 * هذه النسخة محسنة لعرض النص العربي باستخدام pdfmake
 * مع استخدام خاصية direction:rtl بدلاً من مكتبات خارجية
 * 
 * @param project بيانات المشروع
 * @param company بيانات الشركة
 * @param signerInfo معلومات الموقع (اختياري)
 * @returns وعد يرجع البفر النهائي للملف
 */
export async function generateProjectNdaPdf(
  project: any, 
  company: any, 
  signerInfo?: {
    name?: string;
    title?: string;
    date?: Date;
    ip?: string;
  }
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // تحميل الخط العربي
      const fontPath = path.join(process.cwd(), 'assets', 'fonts', 'Cairo-Regular.ttf');
      
      // التحقق من وجود ملف الخط
      if (!fs.existsSync(fontPath)) {
        throw new Error('ملف الخط العربي Cairo-Regular.ttf غير موجود');
      }
      
      // إنشاء تعريف الخطوط
      const fonts = {
        Cairo: {
          normal: fontPath,
          bold: fontPath,
          italics: fontPath,
          bolditalics: fontPath
        }
      };
      
      // إنشاء نسخة من pdfmake مع الخطوط العربية
      const printer = new PdfPrinter(fonts);
      
      // تحضير معلومات التوقيع
      const signedDate = signerInfo?.date ? new Date(signerInfo.date) : new Date();
      const formattedDate = `${signedDate.getDate()}-${signedDate.getMonth() + 1}-${signedDate.getFullYear()}`;
      
      // شروط الاتفاقية
      const terms = [
        'بموجب هذه الاتفاقية، يلتزم الطرف الثاني (الشركة) بالحفاظ على سرية جميع المعلومات المتعلقة بالمشروع، وعدم مشاركتها مع أي طرف ثالث دون إذن كتابي مسبق من الطرف الأول (صاحب المشروع).',
        'تسري هذه الاتفاقية اعتباراً من تاريخ التوقيع عليها إلكترونياً، وتشمل جميع المراسلات والمستندات والمعلومات التي يتم تبادلها بين الطرفين لغرض تنفيذ المشروع.',
        'تبقى هذه الاتفاقية سارية لمدة عامين (2) بعد انتهاء العمل بالمشروع أو انتهاء العلاقة بين الطرفين، أيهما أبعد.',
        'في حال الإخلال بأي من بنود هذه الاتفاقية، يحق للطرف المتضرر اتخاذ كافة الإجراءات القانونية اللازمة لحماية مصالحه وحقوقه.',
        'تخضع هذه الاتفاقية للقوانين المعمول بها في المملكة العربية السعودية وتحل أي نزاعات تنشأ عنها في محاكم المملكة.',
      ];
      
      // ترقيم البنود
      const numberedTerms = terms.map((term, index) => {
        return { text: `${index + 1}. ${term}`, style: 'paragraph' };
      });
      
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
          subheader: {
            fontSize: 16,
            bold: true,
            margin: [0, 15, 0, 10]
          },
          paragraph: { 
            fontSize: 12, 
            margin: [0, 5, 0, 5]
          },
          signature: {
            fontSize: 12,
            margin: [0, 10, 0, 5]
          },
          footer: {
            fontSize: 10,
            alignment: 'center',
            margin: [0, 30, 0, 0]
          }
        },
        
        // محتوى المستند
        content: [
          // العنوان
          { text: 'اتفاقية عدم إفصاح', style: 'header' },
          
          // تاريخ الاتفاقية
          { text: `تاريخ الإنشاء: ${formattedDate}`, style: 'paragraph', alignment: 'left' },
          
          // معلومات المشروع
          { text: 'معلومات المشروع:', style: 'subheader' },
          { text: `اسم المشروع: ${project.title || 'غير محدد'}`, style: 'paragraph' },
          { text: `وصف المشروع: ${project.description || 'غير محدد'}`, style: 'paragraph' },
          
          // معلومات الشركة
          { text: 'معلومات الشركة:', style: 'subheader' },
          { text: `اسم الشركة: ${company.name || 'غير محدد'}`, style: 'paragraph' },
          company.location ? { text: `الموقع: ${company.location}`, style: 'paragraph' } : {},
          
          // شروط الاتفاقية
          { text: 'شروط الاتفاقية:', style: 'subheader' },
          ...numberedTerms,
          
          // معلومات التوقيع
          { text: 'التوقيعات:', style: 'subheader', margin: [0, 20, 0, 10] },
          { text: 'الطرف الأول (صاحب المشروع)', style: 'signature' },
          { text: 'الطرف الثاني (الشركة)', style: 'signature' }
        ]
      };
      
      // إضافة معلومات الموقع إذا وجدت
      if (signerInfo) {
        const signatureInfo = [
          { text: `تم التوقيع إلكترونياً بتاريخ: ${formattedDate}`, style: 'signature' }
        ];
        
        if (signerInfo.name) {
          signatureInfo.push({ text: `اسم الموقّع: ${signerInfo.name}`, style: 'signature' });
        }
        
        if (signerInfo.title) {
          signatureInfo.push({ text: `المنصب: ${signerInfo.title}`, style: 'signature' });
        }
        
        if (signerInfo.ip) {
          signatureInfo.push({ text: `IP عنوان: ${signerInfo.ip}`, style: 'signature', fontSize: 10 });
        }
        
        // إضافة معلومات التوقيع للمستند
        docDefinition.content.push(...signatureInfo);
      } else {
        // إضافة مكان للتوقيع
        docDefinition.content.push({ text: 'التوقيع: ______________________________', style: 'signature' });
      }
      
      // إضافة معلومات المنصة في نهاية المستند
      docDefinition.content.push(
        { text: 'تم إنشاء هذه الاتفاقية عبر منصة لينكتك - https://linktech.app', style: 'footer' },
        { text: `الرقم المرجعي: NDA-${project.id}-${Date.now().toString().substring(0, 8)}`, style: 'footer' }
      );
      
      // إنشاء ملف PDF
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const chunks: Buffer[] = [];
      
      // جمع البيانات
      pdfDoc.on('data', (chunk) => chunks.push(chunk));
      
      // الانتهاء من إنشاء المستند
      pdfDoc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });
      
      // معالجة الأخطاء
      pdfDoc.on('error', (err) => {
        console.error('خطأ في إنشاء ملف PDF:', err);
        reject(err);
      });
      
      // إنهاء المستند
      pdfDoc.end();
      
    } catch (error) {
      console.error('خطأ في إنشاء ملف PDF:', error);
      reject(error);
    }
  });
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
    
    // إنشاء ملف PDF
    const pdfBuffer = await generateProjectNdaPdf(sampleProject, sampleCompany, {
      name: 'محمد علي',
      title: 'مدير المشاريع',
      date: new Date(),
      ip: '192.168.1.1'
    });
    
    // استخدام اسم ملف بالإنجليزية لتجنب مشاكل التشفير
    const pdfFilename = 'linktech-nda.pdf';
    const tempPdfPath = path.join(tempDir, pdfFilename);
    
    // حفظ الملف
    fs.writeFileSync(tempPdfPath, pdfBuffer);
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
    
  } catch (error: any) {
    console.error('خطأ في إنشاء اتفاقية عدم الإفصاح:', error);
    res.status(500).json({ 
      message: 'حدث خطأ أثناء إنشاء ملف اتفاقية عدم الإفصاح', 
      error: error.message || String(error)
    });
  }
});

export default router;