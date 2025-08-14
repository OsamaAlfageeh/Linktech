import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2, FileText, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TestSadiq() {
  const { toast } = useToast();
  const [accessToken, setAccessToken] = useState<string>('');
  const [documentId, setDocumentId] = useState<string>('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isGeneratingDocument, setIsGeneratingDocument] = useState(false);
  const [isSendingInvitation, setIsSendingInvitation] = useState(false);
  const [authResult, setAuthResult] = useState<any>(null);
  const [documentResult, setDocumentResult] = useState<any>(null);
  const [invitationResult, setInvitationResult] = useState<any>(null);
  
  // Project and company data for NDA generation
  const [projectData, setProjectData] = useState({
    title: 'تطبيق إدارة المشاريع',
    description: 'تطبيق متكامل لإدارة المشاريع والمهام'
  });
  
  const [companyData, setCompanyData] = useState({
    name: 'شركة التقنية المتقدمة',
    location: 'الرياض - المملكة العربية السعودية'
  });
  
  // Test data for destinations
  const [entrepreneur, setEntrepreneur] = useState({
    name: 'أحمد رائد الأعمال',
    email: 'entrepreneur@example.com',
    phone: '966501234567'
  });
  
  const [company, setCompany] = useState({
    name: 'شركة البرمجة',
    email: 'company@example.com', 
    phone: '966509876543'
  });

  const handleAuthenticate = async () => {
    setIsAuthenticating(true);
    try {
      const response = await fetch('/api/sadiq/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Authentication failed');
      }
      
      const result = await response.json();
      setAuthResult(result);
      setAccessToken(result.access_token);
      
      toast({
        title: 'تم الحصول على رمز المصادقة',
        description: 'تم الاتصال بنجاح مع واجهة برمجة تطبيقات صادق',
      });
    } catch (error) {
      console.error('Authentication error:', error);
      toast({
        title: 'خطأ في المصادقة',
        description: 'فشل في الاتصال مع واجهة برمجة تطبيقات صادق',
        variant: 'destructive'
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGenerateAndUploadNDA = async () => {
    if (!accessToken) {
      toast({
        title: 'مطلوب رمز المصادقة',
        description: 'يرجى المصادقة أولاً للحصول على رمز الوصول',
        variant: 'destructive'
      });
      return;
    }

    setIsGeneratingDocument(true);
    try {
      const response = await fetch('/api/sadiq/generate-and-upload-nda', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          accessToken,
          projectData,
          companyData
        })
      });
      
      if (!response.ok) {
        throw new Error('Document generation failed');
      }
      
      const result = await response.json();
      setDocumentResult(result);
      setDocumentId(result.documentId);
      
      toast({
        title: 'تم إنشاء الوثيقة بنجاح',
        description: `تم رفع اتفاقية عدم الإفصاح إلى صادق - معرف الوثيقة: ${result.documentId}`,
      });
    } catch (error) {
      console.error('Document generation error:', error);
      toast({
        title: 'خطأ في إنشاء الوثيقة',
        description: 'فشل في إنشاء ورفع اتفاقية عدم الإفصاح',
        variant: 'destructive'
      });
    } finally {
      setIsGeneratingDocument(false);
    }
  };

  const handleSendInvitation = async () => {
    if (!accessToken) {
      toast({
        title: 'مطلوب رمز المصادقة',
        description: 'يرجى المصادقة أولاً للحصول على رمز الوصول',
        variant: 'destructive'
      });
      return;
    }
    
    if (!documentId) {
      toast({
        title: 'مطلوب معرف الوثيقة',
        description: 'يرجى إدخال معرف الوثيقة من لوحة التحكم',
        variant: 'destructive'
      });
      return;
    }

    setIsSendingInvitation(true);
    try {
      const invitationData = {
        documentId: documentId,
        destinations: [
          {
            DestinationName: entrepreneur.name,
            destinationEmail: entrepreneur.email,
            destinationPhoneNumber: entrepreneur.phone,
            nationalId: "",
            signeOrder: 0,
            ConsentOnly: true,
            signatories: [],
            availableTo: "2029-08-29",
            authenticationType: 0,
            InvitationLanguage: 1,
            RedirectUrl: "",
            AllowUserToAddDestination: ""
          },
          {
            destinationName: company.name,
            destinationEmail: company.email,
            destinationPhoneNumber: company.phone,
            nationalId: "",
            signeOrder: 1,
            ConsentOnly: false,
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
            AllowUserToAddDestination: ""
          }
        ],
        invitationMessage: "عزيزي المستخدم، يرجى التوقيع على الوثيقة المرفقة أدناه",
        invitationSubject: "دعوة للتوقيع على اتفاقية عدم الإفصاح"
      };

      const response = await fetch('/api/sadiq/send-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          accessToken,
          invitationData
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send invitation');
      }
      
      const result = await response.json();
      setInvitationResult(result);
      
      toast({
        title: 'تم إرسال الدعوات',
        description: 'تم إرسال دعوات التوقيع بنجاح عبر صادق',
      });
    } catch (error) {
      console.error('Invitation error:', error);
      toast({
        title: 'خطأ في إرسال الدعوة',
        description: 'فشل في إرسال دعوات التوقيع',
        variant: 'destructive'
      });
    } finally {
      setIsSendingInvitation(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-4">اختبار تكامل صادق</h1>
        <p className="text-neutral-600 text-center">صفحة اختبار للتكامل مع واجهة برمجة تطبيقات صادق للتوقيع الرقمي</p>
      </div>

      <div className="grid gap-6">
        {/* Authentication Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {accessToken ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-orange-500" />
              )}
              1. المصادقة مع صادق
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                onClick={handleAuthenticate}
                disabled={isAuthenticating}
                className="w-full"
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري المصادقة...
                  </>
                ) : (
                  'الحصول على رمز الوصول'
                )}
              </Button>
              
              {authResult && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="text-sm">
                      <p><strong>نوع الرمز:</strong> {authResult.token_type}</p>
                      <p><strong>انتهاء الصلاحية:</strong> {authResult.expires_in} ثانية</p>
                      <p><strong>النطاق:</strong> {authResult.scope}</p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Project Data Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              2. بيانات المشروع لإنشاء اتفاقية عدم الإفصاح
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  عنوان المشروع
                </label>
                <Input
                  value={projectData.title}
                  onChange={(e) => setProjectData({...projectData, title: e.target.value})}
                  placeholder="أدخل عنوان المشروع..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  وصف المشروع
                </label>
                <Textarea
                  value={projectData.description}
                  onChange={(e) => setProjectData({...projectData, description: e.target.value})}
                  placeholder="أدخل وصف مفصل للمشروع..."
                  rows={3}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    اسم الشركة
                  </label>
                  <Input
                    value={companyData.name}
                    onChange={(e) => setCompanyData({...companyData, name: e.target.value})}
                    placeholder="اسم الشركة..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    موقع الشركة
                  </label>
                  <Input
                    value={companyData.location}
                    onChange={(e) => setCompanyData({...companyData, location: e.target.value})}
                    placeholder="موقع الشركة..."
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleGenerateAndUploadNDA}
                disabled={isGeneratingDocument || !accessToken}
                className="w-full"
                variant="outline"
              >
                {isGeneratingDocument ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري إنشاء ورفع الوثيقة...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    إنشاء ورفع اتفاقية عدم الإفصاح
                  </>
                )}
              </Button>
              
              {documentResult && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="text-sm space-y-2">
                      <p><strong>معرف الوثيقة:</strong> {documentResult.documentId}</p>
                      <p><strong>اسم الملف:</strong> {documentResult.documentName}</p>
                      <div>
                        <strong>حقول التوقيع:</strong>
                        <ul className="list-disc list-inside mt-1 text-xs">
                          {documentResult.signatureFields?.map((field: any, index: number) => (
                            <li key={index}>{field.name} - {field.placeholder}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Manual Document ID Section */}
        <Card>
          <CardHeader>
            <CardTitle>أو: إدخال معرف وثيقة يدوياً</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  معرف الوثيقة من لوحة تحكم صادق (اختياري)
                </label>
                <Input
                  value={documentId}
                  onChange={(e) => setDocumentId(e.target.value)}
                  placeholder="أدخل معرف الوثيقة هنا..."
                  className="text-left"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  في حالة عدم إنشاء وثيقة جديدة أعلاه، يمكنك إدخال معرف وثيقة موجودة
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parties Information */}
        <Card>
          <CardHeader>
            <CardTitle>3. بيانات الأطراف للتوقيع</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">رائد الأعمال</h4>
                <div className="space-y-3">
                  <Input
                    value={entrepreneur.name}
                    onChange={(e) => setEntrepreneur({...entrepreneur, name: e.target.value})}
                    placeholder="اسم رائد الأعمال"
                  />
                  <Input
                    value={entrepreneur.email}
                    onChange={(e) => setEntrepreneur({...entrepreneur, email: e.target.value})}
                    placeholder="البريد الإلكتروني"
                    type="email"
                  />
                  <Input
                    value={entrepreneur.phone}
                    onChange={(e) => setEntrepreneur({...entrepreneur, phone: e.target.value})}
                    placeholder="رقم الهاتف"
                  />
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">الشركة</h4>
                <div className="space-y-3">
                  <Input
                    value={company.name}
                    onChange={(e) => setCompany({...company, name: e.target.value})}
                    placeholder="اسم الشركة"
                  />
                  <Input
                    value={company.email}
                    onChange={(e) => setCompany({...company, email: e.target.value})}
                    placeholder="البريد الإلكتروني"
                    type="email"
                  />
                  <Input
                    value={company.phone}
                    onChange={(e) => setCompany({...company, phone: e.target.value})}
                    placeholder="رقم الهاتف"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Send Invitation Section */}
        <Card>
          <CardHeader>
            <CardTitle>4. إرسال دعوات التوقيع</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                onClick={handleSendInvitation}
                disabled={isSendingInvitation || !accessToken}
                className="w-full"
                size="lg"
              >
                {isSendingInvitation ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري إرسال الدعوات...
                  </>
                ) : (
                  'إرسال دعوات التوقيع'
                )}
              </Button>
              
              {invitationResult && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="text-sm">
                      <p><strong>تم إرسال الدعوات بنجاح!</strong></p>
                      <pre className="mt-2 p-2 bg-neutral-100 rounded text-xs overflow-auto">
                        {JSON.stringify(invitationResult, null, 2)}
                      </pre>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}