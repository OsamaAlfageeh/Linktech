import { Router, Request, Response } from 'express';

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

// Upload document to Sadiq (placeholder for future implementation)
router.post('/upload-document', async (req: Request, res: Response) => {
  try {
    const { accessToken, documentBase64, documentName } = req.body;
    
    if (!accessToken || !documentBase64) {
      return res.status(400).json({ 
        error: 'Access token and document required',
        message: 'رمز الوصول والوثيقة مطلوبان' 
      });
    }

    console.log('رفع وثيقة إلى صادق...');
    
    // TODO: Implement document upload endpoint when provided
    // For now, return a placeholder response
    
    res.json({ 
      message: 'Document upload endpoint not yet implemented',
      documentName,
      status: 'pending_implementation' 
    });
  } catch (error) {
    console.error('خطأ في رفع الوثيقة:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'فشل في رفع الوثيقة' 
    });
  }
});

export default router;