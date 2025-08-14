import { Router, Request, Response } from 'express';
import { generateProjectNdaPdf } from '../generateNDA';
import jwt from 'jsonwebtoken';
import { storage } from '../storage';

// JWT middleware للمصادقة (نسخة محدثة متطابقة مع النظام الرئيسي)
const authenticateToken = async (req: any, res: Response, next: any) => {
  try {
    console.log('JWT Middleware: POST /api/sadiq/generate-nda');
    const authHeader = req.headers['authorization'];
    console.log('Authorization header:', authHeader ? authHeader.substring(0, 50) + '...' : 'undefined');
    
    const token = authHeader && authHeader.split(' ')[1];
    console.log('Extracted token:', token ? 'Present' : 'Missing');

    if (!token) {
      console.log('No token found');
      return res.status(401).json({ 
        error: 'Access token required',
        message: 'رمز الوصول مطلوب' 
      });
    }

    try {
      const decoded: any = jwt.verify(token, 'linktech-jwt-secret-2024');
      console.log('Token verification result: Valid');
      console.log('Decoded token userId:', decoded.userId);
      
      const user = await storage.getUser(decoded.userId);
      console.log('User lookup result:', user ? `Found user ${user.username}` : 'User not found');
      
      if (!user) {
        return res.status(401).json({ 
          error: 'User not found',
          message: 'المستخدم غير موجود' 
        });
      }

      console.log(`Set req.user to: ${user.username} (${user.role})`);
      req.user = user;
      next();
    } catch (jwtError) {
      console.log('Token verification result: Invalid');
      console.error('JWT verification error:', jwtError);
      return res.status(403).json({ 
        error: 'Invalid token',
        message: 'رمز وصول غير صالح' 
      });
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'خطأ في المصادقة' 
    });
  }
};

const router = Router();

// Sadiq API Authentication
router.post('/authenticate', async (req: Request, res: Response) => {
  try {
    console.log('محاولة المصادقة مع واجهة برمجة تطبيقات صادق...');
    
    // Sadiq authentication endpoint
    const authUrl = 'https://sandbox-api.sadq-sa.com/Authentication/Authority/Token';
    
    // Prepare form data for authentication
    const formData = new URLSearchParams();
    formData.append('grant_type', 'integration');
    formData.append('accountId', '98AA5961-3917-4595-A14B-ED5E99BDEBE4');
    formData.append('accountSecret', 'DcQ8FhLKTZC1QoTZXFJRMKqVMLoilUr6');
    formData.append('username', 'mj266501@gmail.com');
    formData.append('password', '11223344@Mm');

    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic SW50ZWdyYXRpb25jbGllbnQ6ZHZuY3h6dmNkc3NoYmJ6YXZyd2lkc2JkdmRnZmRoc2JjdmJkZ2Y='
      },
      body: formData
    });

    if (!response.ok) {
      console.error('خطأ في استجابة صادق:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('تفاصيل الخطأ:', errorText);
      return res.status(response.status).json({ 
        error: 'Authentication failed',
        details: errorText 
      });
    }

    const authResult = await response.json();
    console.log('تم الحصول على رمز الوصول من صادق بنجاح');
    
    res.json(authResult);
  } catch (error) {
    console.error('خطأ في المصادقة مع صادق:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'فشل في الاتصال مع واجهة برمجة تطبيقات صادق' 
    });
  }
});

// Send invitation through Sadiq API
router.post('/send-invitation', async (req: Request, res: Response) => {
  try {
    const { accessToken, invitationData } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({ 
        error: 'Access token required',
        message: 'رمز الوصول مطلوب لإرسال الدعوة' 
      });
    }

    console.log('إرسال دعوة التوقيع عبر صادق...');
    console.log('بيانات الدعوة:', JSON.stringify(invitationData, null, 2));

    const invitationUrl = 'https://sandbox-api.sadq-sa.com/IntegrationService/Invitation/Send-Invitation';

    const response = await fetch(invitationUrl, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(invitationData)
    });

    if (!response.ok) {
      console.error('خطأ في إرسال الدعوة:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('تفاصيل خطأ الدعوة:', errorText);
      return res.status(response.status).json({ 
        error: 'Invitation failed',
        details: errorText 
      });
    }

    const invitationResult = await response.json();
    console.log('تم إرسال دعوة التوقيع بنجاح عبر صادق');
    
    res.json(invitationResult);
  } catch (error) {
    console.error('خطأ في إرسال دعوة التوقيع:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'فشل في إرسال دعوة التوقيع عبر صادق' 
    });
  }
});

// إنشاء اتفاقية عدم الإفصاح للتنزيل المحلي
router.post('/generate-nda', authenticateToken, async (req: Request, res: Response) => {
  try {
    console.log('إنشاء اتفاقية عدم الإفصاح للتنزيل...');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { projectData, companyData } = req.body;
    
    if (!projectData || !companyData) {
      console.log('Missing required data - projectData:', !!projectData, 'companyData:', !!companyData);
      return res.status(400).json({
        error: 'Missing required data',
        message: 'بيانات المشروع والشركة مطلوبة'
      });
    }

    console.log('Starting PDF generation with:', {
      projectTitle: projectData.title,
      companyName: companyData.name
    });

    // إنشاء ملف PDF
    const pdfBuffer = await generateProjectNdaPdf(projectData, companyData);
    
    console.log('PDF generation completed, buffer size:', pdfBuffer.length);
    
    if (pdfBuffer.length < 100) {
      console.error('PDF buffer too small, likely an error occurred');
      return res.status(500).json({
        error: 'PDF generation failed',
        message: 'فشل في إنشاء ملف PDF - حجم غير صحيح'
      });
    }
    
    // إعداد headers للتنزيل
    const filename = `NDA-${projectData.title.replace(/\s+/g, '-')}-${Date.now()}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    console.log(`✅ تم إنشاء ملف PDF بنجاح: ${filename}, الحجم: ${pdfBuffer.length} بايت`);
    
    // إرسال الملف
    res.send(pdfBuffer);
    
  } catch (error: any) {
    console.error('❌ خطأ في إنشاء اتفاقية عدم الإفصاح:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: 'Internal server error',
      message: 'فشل في إنشاء اتفاقية عدم الإفصاح',
      details: error.message
    });
  }
});

// Generate and upload NDA document to Sadiq
router.post('/generate-and-upload-nda', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { accessToken, projectData, companyData } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({ 
        error: 'Access token required',
        message: 'رمز الوصول مطلوب لرفع الوثيقة' 
      });
    }

    console.log('إنشاء ورفع اتفاقية عدم الإفصاح إلى صادق...');
    
    // Generate NDA document with placeholder data if not provided
    const defaultProject = {
      id: Date.now(),
      title: projectData?.title || 'مشروع تطوير البرمجيات',
      description: projectData?.description || 'مشروع لتطوير تطبيق أو نظام برمجي حسب المتطلبات المحددة'
    };
    
    const defaultCompany = {
      name: companyData?.name || '[اسم الشركة]',
      location: companyData?.location || '[موقع الشركة]'
    };

    // Generate PDF buffer
    const pdfBuffer = await generateProjectNdaPdf(defaultProject, defaultCompany);
    
    // Convert to base64
    const documentBase64 = pdfBuffer.toString('base64');
    const documentName = `NDA-${defaultProject.id}-${Date.now().toString().substring(0, 8)}.pdf`;
    
    console.log('تم إنشاء الـ PDF وتحويله إلى base64، حجم الملف:', pdfBuffer.length, 'بايت');

    // Upload document to Sadiq
    const uploadUrl = 'https://sandbox-api.sadq-sa.com/IntegrationService/Document/Upload';
    
    const uploadPayload = {
      name: documentName,
      content: documentBase64,
      contentType: 'application/pdf'
    };

    console.log('رفع الوثيقة إلى صادق...', documentName);

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(uploadPayload)
    });

    if (!uploadResponse.ok) {
      console.error('خطأ في رفع الوثيقة:', uploadResponse.status, uploadResponse.statusText);
      const errorText = await uploadResponse.text();
      console.error('تفاصيل خطأ الرفع:', errorText);
      return res.status(uploadResponse.status).json({ 
        error: 'Document upload failed',
        details: errorText 
      });
    }

    const uploadResult = await uploadResponse.json();
    console.log('تم رفع الوثيقة بنجاح، معرف الوثيقة:', uploadResult.id);
    
    // Return document ID and signature field information
    res.json({
      documentId: uploadResult.id,
      documentName,
      signatureFields: [
        {
          name: 'الطرف الأول (صاحب المشروع)',
          placeholder: '[اسم رائد الأعمال]',
          position: 'entrepreneur'
        },
        {
          name: 'الطرف الثاني (الشركة)', 
          placeholder: '[اسم ممثل الشركة]',
          position: 'company'
        }
      ],
      uploadResult
    });
  } catch (error) {
    console.error('خطأ في إنشاء ورفع اتفاقية عدم الإفصاح:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'فشل في إنشاء ورفع اتفاقية عدم الإفصاح' 
    });
  }
});

// Upload document to Sadiq (fallback for custom documents)
router.post('/upload-document', async (req: Request, res: Response) => {
  try {
    const { accessToken, documentBase64, documentName } = req.body;
    
    if (!accessToken || !documentBase64) {
      return res.status(400).json({ 
        error: 'Access token and document required',
        message: 'رمز الوصول والوثيقة مطلوبان' 
      });
    }

    console.log('رفع وثيقة مخصصة إلى صادق...');
    
    const uploadUrl = 'https://sandbox-api.sadq-sa.com/IntegrationService/Document/Upload';
    
    const uploadPayload = {
      name: documentName || `document-${Date.now()}.pdf`,
      content: documentBase64,
      contentType: 'application/pdf'
    };

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(uploadPayload)
    });

    if (!uploadResponse.ok) {
      console.error('خطأ في رفع الوثيقة:', uploadResponse.status, uploadResponse.statusText);
      const errorText = await uploadResponse.text();
      console.error('تفاصيل خطأ الرفع:', errorText);
      return res.status(uploadResponse.status).json({ 
        error: 'Document upload failed',
        details: errorText 
      });
    }

    const uploadResult = await uploadResponse.json();
    console.log('تم رفع الوثيقة المخصصة بنجاح، معرف الوثيقة:', uploadResult.id);
    
    res.json(uploadResult);
  } catch (error) {
    console.error('خطأ في رفع الوثيقة:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'فشل في رفع الوثيقة' 
    });
  }
});

export default router;