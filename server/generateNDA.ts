/**
 * ملف إنشاء اتفاقية عدم الإفصاح NDA باستخدام مكتبة pdfmake
 */

import { Request, Response, Router } from 'express';
import path from 'path';
import fs from 'fs';
import PdfPrinter from 'pdfmake/src/printer';

/**
 * دالة ذكية لعكس ترتيب الكلمات مع الحفاظ على علامات الترقيم في مكانها الصحيح
 * @param text النص المراد عكس كلماته
 * @returns النص بعد عكس ترتيب كلماته
 */
function reverseWordsSmart(text: string): string {
  const words = text.split(' ');
  const reversed = [];

  for (let i = words.length - 1; i >= 0; i--) {
    // فصل العلامة إن وجدت ملتصقة بالكلمة
    const match = words[i].match(/^(.+?)([.,،؛:]?)$/);
    if (match) {
      const [, word, punctuation] = match;
      reversed.push(`${word}${punctuation}`);
    } else {
      reversed.push(words[i]);
    }
  }

  return reversed.join(' ');
}

/**
 * دالة لتقسيم النص الطويل إلى أسطر مناسبة وعكس ترتيب الكلمات في كل سطر
 * @param text النص المراد تقسيمه
 * @param wordsPerLine عدد الكلمات في كل سطر
 * @returns مصفوفة من الأسطر المقسمة بعد عكس ترتيب الكلمات
 */
function splitAndReverseParagraph(
  text: string,
  wordsPerLine = 12
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];

  for (let i = 0; i < words.length; i += wordsPerLine) {
    const slice = words.slice(i, i + wordsPerLine);
    lines.push(slice.reverse().join(' '));
  }

  return lines;
}

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
      // تحميل الخط العربي - محاولة العثور عليه في مسارات متعددة محتملة
      let fontPath: string;
      
      // مصفوفة من المسارات المحتملة لملف الخط في بيئات مختلفة
      const possiblePaths = [
        path.join(process.cwd(), 'assets', 'fonts', 'Cairo-Regular.ttf'),
        path.join(process.cwd(), 'attached_assets', 'Cairo-Regular.ttf'),
        path.join(__dirname, '..', 'assets', 'fonts', 'Cairo-Regular.ttf'),
        path.join(__dirname, '..', 'attached_assets', 'Cairo-Regular.ttf'),
        path.join(__dirname, '..', '..', 'assets', 'fonts', 'Cairo-Regular.ttf'),
        path.join(__dirname, '..', '..', 'attached_assets', 'Cairo-Regular.ttf')
      ];
      
      // البحث عن ملف الخط في المسارات المحتملة
      const foundPath = possiblePaths.find(p => fs.existsSync(p));
      
      if (!foundPath) {
        console.error('تحذير: لم يتم العثور على ملف الخط Cairo-Regular.ttf في المسارات التالية:');
        possiblePaths.forEach(p => console.error(`- ${p}`));
        throw new Error('ملف الخط العربي Cairo-Regular.ttf غير موجود، تحقق من تثبيت الخطوط بشكل صحيح');
      } else {
        console.log('تم العثور على ملف الخط في المسار:', foundPath);
        fontPath = foundPath;
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
          fontSize: 12
        },
        pageMargins: [40, 60, 40, 60],
        
        // تعريف الأنماط
        styles: {
          header: { 
            fontSize: 22, 
            bold: true, 
            margin: [0, 0, 0, 20],
            alignment: 'right'
          },
          subheader: {
            fontSize: 16,
            bold: true,
            margin: [0, 15, 0, 10],
            alignment: 'right'
          },
          paragraph: { 
            fontSize: 12, 
            margin: [0, 5, 0, 5],
            alignment: 'right'
          },
          signature: {
            fontSize: 12,
            margin: [0, 10, 0, 5],
            alignment: 'right'
          },
          footer: {
            fontSize: 10,
            alignment: 'center',
            margin: [0, 30, 0, 0]
          }
        },
        
        // محتوى المستند بالعربية، مع عكس ترتيب الكلمات
        content: [
          // العنوان - النص بترتيب كلمات معكوس بالدالة الذكية
          { text: reverseWordsSmart('اتفاقية عدم الإفصاح'), style: 'header' },
          
          // تاريخ الاتفاقية
          { text: reverseWordsSmart(`تاريخ الإنشاء: ${formattedDate}`), style: 'paragraph' },
          
          // معلومات المشروع - النص بترتيب كلمات معكوس
          { text: reverseWordsSmart('معلومات المشروع:'), style: 'subheader' },
          { text: reverseWordsSmart(`اسم المشروع: ${project.title || 'غير محدد'}`), style: 'paragraph' },
          { text: reverseWordsSmart(`وصف المشروع: ${project.description || 'غير محدد'}`), style: 'paragraph' },
          
          // معلومات الشركة - النص بترتيب كلمات معكوس
          { text: reverseWordsSmart('معلومات الشركة:'), style: 'subheader' },
          { text: reverseWordsSmart(`اسم الشركة: ${company.name || 'غير محدد'}`), style: 'paragraph' },
          company.location ? { text: reverseWordsSmart(`الموقع: ${company.location}`), style: 'paragraph' } : {},
          
          // شروط الاتفاقية - النص بترتيب كلمات معكوس
          { text: reverseWordsSmart('شروط الاتفاقية:'), style: 'subheader' },
          // تقسيم البنود الطويلة إلى فقرات وعكس كل فقرة
          ...numberedTerms.map((term, index) => {
            // استخراج النص من العنصر الأصلي بدون الرقم
            const text = term.text.replace(`${index + 1}. `, '');
            
            // استخدام الدالة لتقسيم النص إلى أسطر وعكس ترتيب الكلمات في كل سطر
            const splitLines = splitAndReverseParagraph(text, 10);
            
            // إنشاء مصفوفة من العناصر النصية لكل سطر
            const paragraphItems = [
              // البند الأول مع رقمه
              { text: `${index + 1}. ${splitLines[0]}`, style: 'paragraph' }
            ];
            
            // إضافة باقي أسطر النص إن وجدت
            if (splitLines.length > 1) {
              for (let i = 1; i < splitLines.length; i++) {
                // استخدام نوع صريح لكل سطر مع خصائص إضافية
                paragraphItems.push({ 
                  text: splitLines[i], 
                  style: 'paragraph', 
                  margin: [15, 0, 0, 0] as [number, number, number, number]
                });
              }
            }
            
            return paragraphItems;
          }).flat(),
          
          // معلومات التوقيع - النص بترتيب كلمات معكوس
          { text: reverseWordsSmart('التوقيعات:'), style: 'subheader', margin: [0, 20, 0, 10] },
          { text: reverseWordsSmart('الطرف الأول (صاحب المشروع)'), style: 'signature' },
          { text: reverseWordsSmart('الطرف الثاني (الشركة)'), style: 'signature' }
        ]
      };
      
      // إضافة معلومات الموقع إذا وجدت
      if (signerInfo) {
        const signatureInfo = [
          { text: reverseWordsSmart(`تم التوقيع إلكترونياً بتاريخ: ${formattedDate}`), style: 'signature' }
        ];
        
        if (signerInfo.name) {
          signatureInfo.push({ text: reverseWordsSmart(`اسم الموقّع: ${signerInfo.name}`), style: 'signature' });
        }
        
        if (signerInfo.title) {
          signatureInfo.push({ text: reverseWordsSmart(`المنصب: ${signerInfo.title}`), style: 'signature' });
        }
        
        if (signerInfo.ip) {
          signatureInfo.push({ text: reverseWordsSmart(`عنوان IP: ${signerInfo.ip}`), style: 'signature' });
        }
        
        // إضافة معلومات التوقيع للمستند
        docDefinition.content.push(...signatureInfo);
      } else {
        // إضافة مكان للتوقيع
        docDefinition.content.push({ text: reverseWordsSmart('التوقيع: ______________________________'), style: 'signature' });
      }
      
      // إضافة معلومات المنصة في نهاية المستند
      docDefinition.content.push(
        { text: reverseWordsSmart('تم إنشاء هذه الاتفاقية عبر منصة لينكتك - https://linktech.app'), style: 'footer' },
        { text: reverseWordsSmart(`الرقم المرجعي: NDA-${project.id}-${Date.now().toString().substring(0, 8)}`), style: 'footer' }
      );
      
      // إنشاء ملف PDF
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const chunks: Buffer[] = [];
      
      // جمع البيانات
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      
      // الانتهاء من إنشاء المستند
      pdfDoc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });
      
      // معالجة الأخطاء
      pdfDoc.on('error', (err: Error) => {
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