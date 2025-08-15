import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Download, FileText, Upload, Key, Send, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TestSadiq() {
  const [documentId, setDocumentId] = useState('e7cc3b1c-8434-489d-819f-faf9aa9cb797');
  const [accessToken, setAccessToken] = useState('');
  const [projectData, setProjectData] = useState({
    title: 'Project Management Application',
    description: 'Comprehensive project and task management solution'
  });
  const [companyData, setCompanyData] = useState({
    name: 'Advanced Technology Company',
    location: 'Riyadh - Saudi Arabia'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingInvitation, setIsSendingInvitation] = useState(false);
  const [invitationData, setInvitationData] = useState({
    entrepreneurEmail: '',
    companyEmail: '',
    invitationMessage: 'نرجو منك توقيع اتفاقية عدم الإفصاح المرفقة أدناه'
  });
  const { toast } = useToast();

  const generateNDAFile = async () => {
    if (!projectData.title.trim() || !companyData.name.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى ملء جميع البيانات المطلوبة",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast({
          title: "خطأ في المصادقة",
          description: "يرجى تسجيل الدخول أولاً",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch('/api/sadiq/generate-nda', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          projectData,
          companyData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate NDA');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `NDA-${projectData.title.replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "تم إنشاء الملف",
        description: "تم تنزيل اتفاقية عدم الإفصاح بنجاح"
      });

    } catch (error) {
      console.error('Document generation error:', error);
      toast({
        title: "خطأ في إنشاء الملف",
        description: "حدث خطأ أثناء إنشاء اتفاقية عدم الإفصاح",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const useDocumentId = () => {
    if (!documentId.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال معرف المستند من صادق",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "معرف المستند محفوظ",
      description: `تم حفظ معرف المستند: ${documentId}`
    });
    
    // Here you can store the document ID for later use
    localStorage.setItem('sadiq_document_id', documentId);
  };

  const authenticateWithSadiq = async () => {
    try {
      setIsSendingInvitation(true);
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch('/api/sadiq/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const result = await response.json();
      setAccessToken(result.access_token);
      
      toast({
        title: "تمت المصادقة",
        description: "تم الحصول على رمز الوصول بنجاح"
      });
    } catch (error) {
      console.error('Authentication error:', error);
      toast({
        title: "خطأ في المصادقة",
        description: "فشل في الحصول على رمز الوصول",
        variant: "destructive"
      });
    } finally {
      setIsSendingInvitation(false);
    }
  };

  const sendInvitations = async () => {
    if (!accessToken) {
      toast({
        title: "خطأ",
        description: "يجب المصادقة أولاً للحصول على رمز الوصول",
        variant: "destructive"
      });
      return;
    }

    if (!documentId || !invitationData.entrepreneurEmail || !invitationData.companyEmail) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSendingInvitation(true);
      const token = localStorage.getItem('auth_token');

      const response = await fetch('/api/sadiq/send-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          accessToken,
          documentId,
          destinations: [
            {
              destinationName: "Project Owner",
              destinationEmail: invitationData.entrepreneurEmail,
              destinationPhoneNumber: "",
              nationalId: "",
              signeOrder: 0,
              ConsentOnly: false,
              signatories: [
                {
                  signatureHigh: 80,
                  signatureWidth: 160,
                  pageNumber: 1,
                  text: "",
                  type: "Signature",
                  positionX: 70,
                  positionY: 300
                }
              ],
              availableTo: "2025-12-31T00:00:00Z",
              authenticationType: 0,
              InvitationLanguage: 1,
              RedirectUrl: "",
              AllowUserToAddDestination: ""
            },
            {
              destinationName: "Company Representative",
              destinationEmail: invitationData.companyEmail,
              destinationPhoneNumber: "",
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
                  positionY: 200
                }
              ],
              availableTo: "2025-12-31T00:00:00Z",
              authenticationType: 0,
              InvitationLanguage: 1,
              RedirectUrl: "",
              AllowUserToAddDestination: ""
            }
          ],
          invitationMessage: invitationData.invitationMessage,
          invitationSubject: "NDA Signature Request - LinkTech Platform"
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send invitations');
      }

      const result = await response.json();
      
      toast({
        title: "تم الإرسال",
        description: "تم إرسال دعوات التوقيع بنجاح"
      });
      
      console.log('Invitation result:', result);
      
    } catch (error) {
      console.error('Invitation error:', error);
      toast({
        title: "خطأ في الإرسال",
        description: "فشل في إرسال دعوات التوقيع",
        variant: "destructive"
      });
    } finally {
      setIsSendingInvitation(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sadiq Integration Test</h1>
        <p className="text-gray-600">Generate NDA documents and manage Sadiq document IDs</p>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {/* Document Generation Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generate NDA Document
            </CardTitle>
            <CardDescription>
              Create an NDA document with signature placeholders for manual upload to Sadiq dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="project-title">Project Title</Label>
              <Input
                id="project-title"
                value={projectData.title}
                onChange={(e) => setProjectData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter project title"
              />
            </div>

            <div>
              <Label htmlFor="project-description">Project Description</Label>
              <Textarea
                id="project-description"
                value={projectData.description}
                onChange={(e) => setProjectData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter project description"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={companyData.name}
                onChange={(e) => setCompanyData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter company name"
              />
            </div>

            <div>
              <Label htmlFor="company-location">Company Location</Label>
              <Input
                id="company-location"
                value={companyData.location}
                onChange={(e) => setCompanyData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Enter company location"
              />
            </div>

            <Button 
              onClick={generateNDAFile} 
              disabled={isGenerating}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Generate & Download NDA'}
            </Button>
          </CardContent>
        </Card>

        {/* Document ID Management Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Sadiq Document ID
            </CardTitle>
            <CardDescription>
              After uploading the NDA to Sadiq dashboard, enter the document ID here
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="document-id">Document ID from Sadiq</Label>
              <Input
                id="document-id"
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                placeholder="Enter document ID from Sadiq dashboard"
              />
            </div>

            <Button 
              onClick={useDocumentId}
              variant="outline"
              className="w-full"
            >
              Save Document ID
            </Button>

            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>Steps:</strong></p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Generate NDA document using the form above</li>
                <li>Download the PDF file</li>
                <li>Upload it manually to your Sadiq dashboard</li>
                <li>Copy the document ID from Sadiq</li>
                <li>Enter the ID above and save it</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sadiq Authentication Section */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Sadiq Authentication
            </CardTitle>
            <CardDescription>
              Authenticate with Sadiq API to get access token for sending invitations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600">
              <p><strong>Current Document ID:</strong></p>
              <p className="bg-gray-50 p-2 rounded text-xs font-mono">{documentId}</p>
            </div>

            <Button 
              onClick={authenticateWithSadiq}
              className="w-full"
              disabled={isSendingInvitation}
            >
              <Key className="h-4 w-4 mr-2" />
              {isSendingInvitation ? 'Authenticating...' : 'Authenticate with Sadiq'}
            </Button>

            {accessToken && (
              <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
                <p><strong>✅ Authentication Successful!</strong></p>
                <p>Access token obtained and ready for use</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Send Invitations Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Signature Invitations
            </CardTitle>
            <CardDescription>
              Send email invitations for NDA signature to both parties
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="entrepreneur-email">
                <Mail className="h-4 w-4 inline mr-2" />
                Project Owner Email
              </Label>
              <Input
                id="entrepreneur-email"
                type="email"
                value={invitationData.entrepreneurEmail}
                onChange={(e) => setInvitationData(prev => ({ ...prev, entrepreneurEmail: e.target.value }))}
                placeholder="owner@example.com"
              />
            </div>

            <div>
              <Label htmlFor="company-email">
                <Mail className="h-4 w-4 inline mr-2" />
                Company Representative Email
              </Label>
              <Input
                id="company-email"
                type="email"
                value={invitationData.companyEmail}
                onChange={(e) => setInvitationData(prev => ({ ...prev, companyEmail: e.target.value }))}
                placeholder="company@example.com"
              />
            </div>

            <div>
              <Label htmlFor="invitation-message">Invitation Message</Label>
              <Textarea
                id="invitation-message"
                value={invitationData.invitationMessage}
                onChange={(e) => setInvitationData(prev => ({ ...prev, invitationMessage: e.target.value }))}
                placeholder="Enter invitation message"
                rows={3}
              />
            </div>

            <Button 
              onClick={sendInvitations}
              className="w-full"
              disabled={isSendingInvitation || !accessToken}
            >
              <Send className="h-4 w-4 mr-2" />
              {isSendingInvitation ? 'Sending...' : 'Send Signature Invitations'}
            </Button>

            {!accessToken && (
              <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded">
                <p><strong>⚠️ Authentication Required</strong></p>
                <p>Please authenticate with Sadiq first to enable invitation sending</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Workflow Summary */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Complete Sadiq Workflow</CardTitle>
          <CardDescription>
            Step-by-step process for NDA signature management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-blue-50 p-4 rounded">
                <h4 className="font-semibold text-blue-900">Step 1: Generate & Upload</h4>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-blue-700">
                  <li>Generate NDA document</li>
                  <li>Download PDF file</li>
                  <li>Upload to Sadiq dashboard</li>
                  <li>Save document ID</li>
                </ol>
              </div>
              
              <div className="bg-green-50 p-4 rounded">
                <h4 className="font-semibold text-green-900">Step 2: Authenticate</h4>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-green-700">
                  <li>Click authenticate with Sadiq</li>
                  <li>Get access token</li>
                  <li>Ready for invitations</li>
                </ol>
              </div>
              
              <div className="bg-purple-50 p-4 rounded">
                <h4 className="font-semibold text-purple-900">Step 3: Send Invitations</h4>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-purple-700">
                  <li>Enter email addresses</li>
                  <li>Customize message</li>
                  <li>Send invitations</li>
                  <li>Track signatures</li>
                </ol>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}