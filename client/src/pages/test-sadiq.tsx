import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TestSadiq() {
  const { toast } = useToast();
  const [accessToken, setAccessToken] = useState<string>('');
  const [documentId, setDocumentId] = useState<string>('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSendingInvitation, setIsSendingInvitation] = useState(false);
  const [authResult, setAuthResult] = useState<any>(null);
  const [invitationResult, setInvitationResult] = useState<any>(null);
  
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

        {/* Document ID Section */}
        <Card>
          <CardHeader>
            <CardTitle>2. معرف الوثيقة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  معرف الوثيقة من لوحة تحكم صادق
                </label>
                <Input
                  value={documentId}
                  onChange={(e) => setDocumentId(e.target.value)}
                  placeholder="أدخل معرف الوثيقة هنا..."
                  className="text-left"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parties Information */}
        <Card>
          <CardHeader>
            <CardTitle>3. بيانات الأطراف</CardTitle>
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