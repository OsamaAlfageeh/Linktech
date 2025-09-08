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

    // إنشاء ملف PDF مع أسماء افتراضية (للتحميل المحلي فقط)
    const defaultPartialNames = {
      entrepreneur: '[Project Owner]',
      companyRep: '[Company Representative]'
    };
    const pdfBuffer = await generateProjectNdaPdf(projectData, companyData, defaultPartialNames);
    
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

    // إنشاء ملف PDF مع أسماء افتراضية مخفية جزئياً
    const defaultPartialNames = {
      entrepreneur: '[Proj*** Own***]',
      companyRep: '[Com*** Rep***]'
    };
    const pdfBuffer = await generateProjectNdaPdf(defaultProject, defaultCompany, defaultPartialNames);
    
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

// Helper function to hide partial names
function hidePartialName(name: string): string {
  if (!name || name.length < 2) return name;
  
  const words = name.trim().split(' ');
  return words.map(word => {
    if (word.length <= 2) return word;
    const visibleLength = Math.ceil(word.length / 2);
    const hiddenLength = word.length - visibleLength;
    return word.substring(0, visibleLength) + '*'.repeat(hiddenLength);
  }).join(' ');
}

// NEW WORKFLOW: Generate NDA as base64 for bulk upload
router.post('/generate-nda-base64', authenticateToken, async (req: Request, res: Response) => {
  try {
    console.log('إنشاء اتفاقية عدم الإفصاح كـ base64...');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { projectData, companyData, entrepreneurName, companyRepName } = req.body;
    
    if (!projectData?.title || !companyData?.name || !entrepreneurName || !companyRepName) {
      return res.status(400).json({
        error: 'Missing required data',
        message: 'بيانات المشروع والشركة وأسماء الأطراف مطلوبة'
      });
    }

    console.log('Starting PDF generation with signing parties:', { 
      projectTitle: projectData.title, 
      companyName: companyData.name,
      entrepreneurName,
      companyRepName
    });

    // إنشاء ملف PDF باستخدام المكتبة المحسنة مع الأسماء المخفية جزئياً
    const partialNames = {
      entrepreneur: hidePartialName(entrepreneurName),
      companyRep: hidePartialName(companyRepName)
    };
    const pdfBuffer = await generateProjectNdaPdf(projectData, companyData, partialNames);
    console.log('PDF generation completed, buffer size:', pdfBuffer.length);

    // تحويل إلى base64
    const base64String = pdfBuffer.toString('base64');
    console.log('Base64 conversion completed, length:', base64String.length);

    // إنشاء اسم ملف فريد
    const timestamp = Date.now();
    const filename = `NDA-${projectData.title.replace(/\s+/g, '-')}-${timestamp}.pdf`;
    
    console.log(`✅ تم إنشاء ملف PDF كـ base64 بنجاح: ${filename}`);

    // إرسال النتيجة مع base64 وأسماء الأطراف (مخفية جزئياً)
    res.json({
      success: true,
      base64: base64String,
      filename,
      fileSize: pdfBuffer.length,
      signingParties: {
        entrepreneur: hidePartialName(entrepreneurName),
        companyRep: hidePartialName(companyRepName)
      },
      originalNames: {
        entrepreneur: entrepreneurName,
        companyRep: companyRepName
      }
    });

  } catch (error: any) {
    console.error('خطأ في إنشاء اتفاقية عدم الإفصاح:', error);
    res.status(500).json({
      error: 'PDF generation failed',
      message: 'فشل في إنشاء ملف اتفاقية عدم الإفصاح',
      details: error.message
    });
  }
});

// CORRECTED WORKFLOW: Bulk Initiate Envelope (Upload + Get Document ID in one step)
router.post('/bulk-initiate-envelope', authenticateToken, async (req: Request, res: Response) => {
  try {
    console.log('إنشاء مظروف صادق مع رفع الوثيقة...');
    const { accessToken, base64, filename } = req.body;
    
    if (!accessToken || !base64 || !filename) {
      return res.status(400).json({
        error: 'Missing required data',
        message: 'رمز الوصول والملف والاسم مطلوبة'
      });
    }

    const bulkInitiateUrl = 'https://sandbox-api.sadq-sa.com/IntegrationService/Document/Bulk/Initiate-envelope-Base64';
    
    const payload = {
      webhookId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      referenceNumber: `linktech-contract-${Date.now()}`,
      files: [
        {
          file: base64,
          fileName: filename,
          password: ""
        }
      ]
    };

    console.log('Initiating envelope with Sadiq...');

    const response = await fetch(bulkInitiateUrl, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error('خطأ في إنشاء المظروف:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('تفاصيل خطأ المظروف:', errorText);
      return res.status(response.status).json({ 
        error: 'Bulk envelope initiate failed',
        details: errorText 
      });
    }

    const result = await response.json();
    console.log('تم إنشاء المظروف بنجاح:', result);
    
    // Extract document ID from the response
    const documentId = result.data?.bulkFileResponse?.[0]?.documentId;
    
    if (!documentId) {
      console.error('No document ID found in response:', result);
      return res.status(500).json({
        error: 'No document ID received',
        message: 'لم يتم الحصول على معرف الوثيقة من صادق'
      });
    }

    console.log(`✅ تم الحصول على معرف الوثيقة من المظروف: ${documentId}`);

    const referenceNumber = result.data?.bulkFileResponse?.[0]?.referenceNumber || payload.referenceNumber;
    
    res.json({
      success: true,
      documentId,
      envelopeId: result.data?.envelopeId,
      referenceNumber: referenceNumber,
      statusCheckUrl: referenceNumber ? `/api/sadiq/envelope-status/${referenceNumber}` : null,
      fullResponse: result
    });

  } catch (error: any) {
    console.error('خطأ في إنشاء المظروف:', error);
    res.status(500).json({
      error: 'Envelope initiate failed',
      message: 'فشل في إنشاء مظروف صادق',
      details: error.message
    });
  }
});

// NEW WORKFLOW: Send invitations using the updated format
router.post('/send-invitations', authenticateToken, async (req: Request, res: Response) => {
  try {
    console.log('إرسال دعوات التوقيع عبر صادق...');
    const { accessToken, documentId, entrepreneurEmail, companyEmail, invitationMessage } = req.body;
    
    if (!accessToken || !documentId || !entrepreneurEmail || !companyEmail) {
      return res.status(400).json({
        error: 'Missing required data',
        message: 'رمز الوصول ومعرف الوثيقة وعناوين البريد الإلكتروني مطلوبة'
      });
    }

    const invitationUrl = 'https://sandbox-api.sadq-sa.com/IntegrationService/Invitation/Send-Invitation';
    
    const invitationPayload = {
      documentId,
      destinations: [
        {
          destinationName: "Project Owner",
          destinationEmail: entrepreneurEmail,
          destinationPhoneNumber: "",
          nationalId: "",
          signeOrder: 0,
          ConsentOnly: true,
          signatories: [],
          availableTo: "2029-08-29",
          authenticationType: 0,
          InvitationLanguage: 1,
          RedirectUrl: "",
          AllowUserToAddDestination: false
        },
        {
          destinationName: "Company Representative",
          destinationEmail: companyEmail,
          destinationPhoneNumber: "",
          nationalId: "",
          signeOrder: 1,
          ConsentOnly: true,
          signatories: [
            {
              signatureHigh: 80,
              signatureWidth: 160,
              pageNumber: 1,
              text: "",
              type: "Signature",
              positionX: 70,
              positionY: 500
            }
          ],
          availableTo: "2024-10-15T00:00:00Z",
          authenticationType: 0,
          InvitationLanguage: 1,
          RedirectUrl: "",
          AllowUserToAddDestination: false
        }
      ],
      invitationMessage: invitationMessage || "Dear User, please sign the document attached below",
      invitationSubject: "NDA Signature Request - LinkTech Platform"
    };

    console.log('Sending invitation with payload ready...');

    const response = await fetch(invitationUrl, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(invitationPayload)
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
    
    res.json({
      success: true,
      result: invitationResult
    });

  } catch (error: any) {
    console.error('خطأ في إرسال دعوة التوقيع:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'فشل في إرسال دعوة التوقيع عبر صادق',
      details: error.message
    });
  }
});

// تتبع حالة المظروف باستخدام رقم المرجع
router.get('/envelope-status/:referenceNumber', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { referenceNumber } = req.params;
    const { accessToken } = req.query;

    if (!accessToken) {
      return res.status(400).json({
        error: 'Access token required',
        message: 'رمز الوصول مطلوب لتتبع حالة المظروف'
      });
    }

    console.log(`فحص حالة المظروف برقم المرجع: ${referenceNumber}`);

    const statusUrl = `https://sandbox-api.sadq-sa.com/IntegrationService/Document/envelope-status/referenceNumber/${referenceNumber}`;

    const response = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      console.error('خطأ في تتبع حالة المظروف:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('تفاصيل خطأ تتبع الحالة:', errorText);
      return res.status(response.status).json({ 
        error: 'Status check failed',
        details: errorText,
        message: 'فشل في تتبع حالة المظروف'
      });
    }

    const statusResult = await response.json();
    console.log('حالة المظروف الحالية:', JSON.stringify(statusResult, null, 2));

    // معالجة الاستجابة من صادق وتحسينها
    const envelopeData = statusResult.data;
    const signatories = envelopeData?.signatories || [];
    const documents = envelopeData?.documents || [];
    
    // حساب إحصائيات التوقيع
    const signedCount = signatories.filter((s: any) => s.status === 'SIGNED').length;
    const pendingCount = signatories.filter((s: any) => s.status === 'PENDING').length;
    const totalSignatories = signatories.length;
    
    // تحديد الحالة العامة
    const isComplete = envelopeData?.status === 'completed' || envelopeData?.status === 'Completed';
    const isInProgress = envelopeData?.status === 'In-progress';
    const isPending = pendingCount > 0;
    
    const processedStatus = {
      referenceNumber,
      envelopeId: envelopeData?.id,
      status: envelopeData?.status || 'Unknown',
      createDate: envelopeData?.createDate,
      lastUpdated: new Date().toISOString(),
      
      // إحصائيات التوقيع
      signedCount,
      pendingCount,
      totalSignatories,
      completionPercentage: totalSignatories > 0 ? Math.round((signedCount / totalSignatories) * 100) : 0,
      
      // معلومات الموقعين
      signatories: signatories.map((signer: any) => ({
        id: signer.id,
        name: signer.fullName,
        nameAr: signer.fullNameAr,
        email: signer.email,
        status: signer.status,
        signOrder: signer.signOrder,
        phoneNumber: signer.phoneNumber
      })),
      
      // معلومات الوثائق
      documents: documents.map((doc: any) => ({
        id: doc.id,
        fileName: doc.fileName,
        uploadDate: doc.uploadDate,
        sizeInKB: doc.sizeInKB,
        isSigned: doc.isSigned
      })),
      
      // حالات منطقية
      isComplete,
      isInProgress,
      isPending,
      
      rawResponse: statusResult
    };

    res.json(processedStatus);

  } catch (error: any) {
    console.error('خطأ في تتبع حالة المظروف:', error);
    res.status(500).json({
      error: 'Status check failed',
      message: 'فشل في تتبع حالة المظروف',
      details: error.message
    });
  }
});

// إنشاء webhook لتلقي تحديثات حالة المظروف من صادق
router.post('/webhook/envelope-status', async (req: Request, res: Response) => {
  try {
    console.log('تلقي تحديث حالة المظروف من صادق:', JSON.stringify(req.body, null, 2));
    
    const { referenceNumber, status, envelopeId, signingProgress } = req.body;
    
    // يمكن إضافة منطق لحفظ حالة المظروف في قاعدة البيانات هنا
    console.log(`تحديث حالة المظروف ${referenceNumber}: ${status}`);
    
    // إرسال إشعار للمستخدمين إذا اكتمل التوقيع
    if (status === 'completed' || status === 'signed') {
      console.log(`✅ تم إكمال التوقيع للمظروف ${referenceNumber}`);
      // يمكن إضافة إرسال إشعارات هنا
    }
    
    res.json({ 
      success: true, 
      message: 'تم تلقي تحديث الحالة بنجاح',
      processed: true 
    });
    
  } catch (error: any) {
    console.error('خطأ في معالجة webhook حالة المظروف:', error);
    res.status(500).json({
      error: 'Webhook processing failed',
      message: 'فشل في معالجة تحديث حالة المظروف'
    });
  }
});

// تحميل الوثيقة من صادق
router.get('/download-document/:documentId', async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const accessToken = req.query.accessToken as string;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    console.log(`تحميل الوثيقة برقم المعرف: ${documentId}`);

    const response = await fetch(`https://sandbox-api.sadq-sa.com/IntegrationService/Document/DownloadBase64/${documentId}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const downloadResult = await response.json();
    console.log('نتيجة تحميل الوثيقة:', JSON.stringify(downloadResult, null, 2));

    if (downloadResult.errorCode !== 0) {
      return res.status(400).json({ 
        error: 'فشل في تحميل الوثيقة', 
        message: downloadResult.message 
      });
    }

    const documentData = downloadResult.data;
    
    // إرسال الوثيقة كاستجابة مباشرة للتحميل
    const fileBuffer = Buffer.from(documentData.file, 'base64');
    
    res.setHeader('Content-Type', documentData.contentType || 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${documentData.fileName}"`);
    res.setHeader('Content-Length', fileBuffer.length);
    
    res.send(fileBuffer);

  } catch (error) {
    console.error('خطأ في تحميل الوثيقة:', error);
    res.status(500).json({ 
      error: 'فشل في تحميل الوثيقة', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;