import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Download, FileText, Upload, Key, Send, Mail, CheckCircle, Clock } from 'lucide-react';
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
  const [isUploading, setIsUploading] = useState(false);
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [uploadedDocumentId, setUploadedDocumentId] = useState('');
  const [signingParties, setSigningParties] = useState({
    entrepreneurName: '',
    companyRepName: ''
  });
  const [invitationData, setInvitationData] = useState({
    entrepreneurEmail: '',
    companyEmail: '',
    invitationMessage: 'نرجو منك توقيع اتفاقية عدم الإفصاح المرفقة أدناه'
  });
  const [statusResult, setStatusResult] = useState<any>(null);
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const { toast } = useToast();

  // وظيفة تحميل الوثيقة
  const downloadDocument = async (documentId: string, fileName: string) => {
    if (!accessToken) {
      toast({
        title: "❌ خطأ",
        description: "يرجى إدخال رمز الوصول أولاً",
        variant: "destructive"
      });
      return;
    }

    try {
      const downloadUrl = `/api/sadiq/download-document/${documentId}?accessToken=${encodeURIComponent(accessToken)}`;
      
      // إنشاء رابط تحميل مؤقت
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "✅ تم التحميل",
        description: `تم بدء تحميل الملف: ${fileName}`
      });
    } catch (error) {
      console.error('خطأ في تحميل الوثيقة:', error);
      toast({
        title: "❌ خطأ في التحميل",
        description: "فشل في تحميل الوثيقة",
        variant: "destructive"
      });
    }
  };

  const generateNDAAsBase64 = async () => {
    if (!projectData.title.trim() || !companyData.name.trim() || !signingParties.entrepreneurName.trim() || !signingParties.companyRepName.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى ملء جميع البيانات المطلوبة بما في ذلك أسماء الأطراف",
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

      const response = await fetch('/api/sadiq/generate-nda-base64', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          projectData,
          companyData,
          entrepreneurName: signingParties.entrepreneurName,
          companyRepName: signingParties.companyRepName
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate NDA');
      }

      const result = await response.json();
      setGeneratedData(result);

      toast({
        title: "تم إنشاء الملف",
        description: `تم إنشاء اتفاقية عدم الإفصاح بنجاح (${result.fileSize} بايت)`
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

  const initiateEnvelope = async () => {
    if (!generatedData || !accessToken) {
      toast({
        title: "خطأ",
        description: "يجب توليد الملف والمصادقة أولاً",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch('/api/sadiq/bulk-initiate-envelope', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          accessToken,
          base64: generatedData.base64,
          filename: generatedData.filename
        })
      });

      if (!response.ok) {
        throw new Error('Failed to initiate envelope');
      }

      const result = await response.json();
      setUploadedDocumentId(result.envelopeId);

      toast({
        title: "تم إنشاء المظروف",
        description: `تم إنشاء مظروف صادق وحصلنا على معرف المظروف: ${result.envelopeId.substring(0, 8)}...`
      });

    } catch (error) {
      console.error('Envelope initiate error:', error);
      toast({
        title: "خطأ في إنشاء المظروف",
        description: "فشل في إنشاء مظروف صادق",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
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

    if (!uploadedDocumentId || !invitationData.entrepreneurEmail || !invitationData.companyEmail) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى رفع الوثيقة وملء عناوين البريد الإلكتروني",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSendingInvitation(true);
      const token = localStorage.getItem('auth_token');

      const response = await fetch('/api/sadiq/send-invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          accessToken,
          documentId: uploadedDocumentId,
          entrepreneurEmail: invitationData.entrepreneurEmail,
          companyEmail: invitationData.companyEmail,
          invitationMessage: invitationData.invitationMessage
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

  const checkEnvelopeStatus = async () => {
    if (!uploadedDocumentId) {
      toast({
        title: "خطأ",
        description: "لا يوجد معرف مظروف. يجب إنشاء مظروف أولاً",
        variant: "destructive"
      });
      return;
    }

    if (!accessToken) {
      toast({
        title: "خطأ",
        description: "يجب المصادقة أولاً للحصول على رمز الوصول",
        variant: "destructive"
      });
      return;
    }

    setIsCheckingStatus(true);
    try {
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`/api/sadiq/envelope-status/by-id/${uploadedDocumentId}?accessToken=${accessToken}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to check envelope status');
      }

      const result = await response.json();
      setStatusResult(result);
      
      toast({
        title: "تم فحص الحالة",
        description: `حالة المظروف: ${result.status || 'غير محددة'}`
      });
      
      console.log('Status check result:', result);
      
    } catch (error) {
      console.error('Status check error:', error);
      toast({
        title: "خطأ في فحص الحالة",
        description: "فشل في فحص حالة المظروف",
        variant: "destructive"
      });
    } finally {
      setIsCheckingStatus(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Sadiq Integration</h1>
        <p className="text-gray-600">Automated workflow: Generate NDA → Authenticate → Create Envelope → Send Invitations</p>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {/* Document Generation Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generate NDA as Base64
            </CardTitle>
            <CardDescription>
              Create an NDA document as base64 with signing party names (partially hidden for privacy)
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

            <div>
              <Label htmlFor="entrepreneur-name">Entrepreneur Name</Label>
              <Input
                id="entrepreneur-name"
                value={signingParties.entrepreneurName}
                onChange={(e) => setSigningParties(prev => ({ ...prev, entrepreneurName: e.target.value }))}
                placeholder="Enter entrepreneur name"
              />
            </div>

            <div>
              <Label htmlFor="company-rep-name">Company Representative Name</Label>
              <Input
                id="company-rep-name"
                value={signingParties.companyRepName}
                onChange={(e) => setSigningParties(prev => ({ ...prev, companyRepName: e.target.value }))}
                placeholder="Enter company representative name"
              />
            </div>

            <Button 
              onClick={generateNDAAsBase64}
              className="w-full"
              disabled={isGenerating}
            >
              <Download className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating Base64...' : 'Generate NDA as Base64'}
            </Button>

            {generatedData && (
              <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
                <p><strong>✅ NDA Generated Successfully!</strong></p>
                <p>File size: {generatedData.fileSize} bytes</p>
                <p>Signing parties: {generatedData.signingParties.entrepreneur} & {generatedData.signingParties.companyRep}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Initiate Envelope Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Initiate Sadiq Envelope
            </CardTitle>
            <CardDescription>
              Create envelope and get document ID in one step using Bulk Initiate Envelope
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={initiateEnvelope}
              variant="outline"
              className="w-full"
              disabled={!generatedData || !accessToken || isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Creating Envelope...' : 'Create Sadiq Envelope'}
            </Button>

            {uploadedDocumentId && (
              <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
                <p><strong>✅ Envelope Created Successfully!</strong></p>
                <p>Document ID: {uploadedDocumentId.substring(0, 8)}...{uploadedDocumentId.substring(-8)}</p>
                <p>Ready to send invitations</p>
              </div>
            )}

            {!generatedData && (
              <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded">
                <p><strong>⚠️ Generate NDA First</strong></p>
                <p>Generate the NDA document before creating envelope</p>
              </div>
            )}

            {!accessToken && (
              <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded">
                <p><strong>⚠️ Authentication Required</strong></p>
                <p>Authenticate with Sadiq first</p>
              </div>
            )}
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
              disabled={isSendingInvitation || !accessToken || !uploadedDocumentId}
            >
              <Send className="h-4 w-4 mr-2" />
              {isSendingInvitation ? 'Sending...' : 'Send Signature Invitations'}
            </Button>

            {!uploadedDocumentId && (
              <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded">
                <p><strong>⚠️ Create Envelope First</strong></p>
                <p>Create the Sadiq envelope to get document ID before sending invitations</p>
              </div>
            )}

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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-blue-50 p-4 rounded">
                <h4 className="font-semibold text-blue-900">Step 1: Generate Base64</h4>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-blue-700">
                  <li>Fill project details</li>
                  <li>Enter signing party names</li>
                  <li>Generate NDA as base64</li>
                  <li>Names partially hidden</li>
                </ol>
              </div>
              
              <div className="bg-green-50 p-4 rounded">
                <h4 className="font-semibold text-green-900">Step 2: Authenticate</h4>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-green-700">
                  <li>Click authenticate</li>
                  <li>Get Sadiq access token</li>
                  <li>Ready for upload</li>
                </ol>
              </div>
              
              <div className="bg-orange-50 p-4 rounded">
                <h4 className="font-semibold text-orange-900">Step 3: Create Envelope</h4>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-orange-700">
                  <li>Bulk initiate envelope</li>
                  <li>Upload + get document ID</li>
                  <li>Single API call</li>
                </ol>
              </div>
              
              <div className="bg-purple-50 p-4 rounded">
                <h4 className="font-semibold text-purple-900">Step 4: Send Invitations</h4>
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

      {/* Envelope Status Tracking */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Envelope Status Tracking
          </CardTitle>
          <CardDescription>
            Track the status of your envelope using the reference number
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="reference-number">Reference Number</Label>
            <Input
              id="reference-number"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Enter envelope reference number"
            />
          </div>

          <Button 
            onClick={checkEnvelopeStatus} 
            disabled={isCheckingStatus || !referenceNumber.trim() || !accessToken}
            className="w-full"
          >
            {isCheckingStatus ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Checking Status...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Check Envelope Status
              </>
            )}
          </Button>

          {statusResult && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-sm text-gray-700 mb-3">Envelope Status Details:</h4>
              
              {/* Status Overview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span><strong>Status:</strong></span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    statusResult.isComplete ? 'bg-green-100 text-green-800' : 
                    statusResult.isInProgress ? 'bg-blue-100 text-blue-800' :
                    statusResult.isPending ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {statusResult.status}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span><strong>Progress:</strong></span>
                  <span className="text-sm">
                    {statusResult.signedCount}/{statusResult.totalSignatories} signed 
                    <span className="ml-2 text-xs text-gray-500">
                      ({statusResult.completionPercentage}%)
                    </span>
                  </span>
                </div>

                <div><strong>Reference:</strong> {statusResult.referenceNumber}</div>
                <div><strong>Created:</strong> {statusResult.createDate ? new Date(statusResult.createDate).toLocaleString() : 'Unknown'}</div>
              </div>

              {/* Signatories Progress - Filter out the Sadiq account */}
              {statusResult.signatories?.length > 0 && (
                <div className="mt-4">
                  <h5 className="font-medium text-gray-700 mb-2">Signatories:</h5>
                  <div className="space-y-2">
                    {statusResult.signatories
                      .filter((signer: any) => {
                        // Hide the third party (Sadiq account) - we'll pass this from backend
                        // For now, filter based on if it's marked as system account
                        return !signer.isSystemAccount;
                      })
                      .map((signer: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {signer.name || signer.nameAr || 'Unknown'}
                          </div>
                          <div className="text-xs text-gray-500">{signer.email}</div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          signer.status === 'SIGNED' ? 'bg-green-100 text-green-800' :
                          signer.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {signer.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              {statusResult.documents?.length > 0 && (
                <div className="mt-4">
                  <h5 className="font-medium text-gray-700 mb-2">Documents:</h5>
                  <div className="space-y-1">
                    {statusResult.documents.map((doc: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white rounded border text-xs">
                        <div className="flex-1">
                          <div className="font-medium">{doc.fileName}</div>
                          <div className="text-gray-500">{doc.sizeInKB} KB</div>
                        </div>
                        {(statusResult.isComplete || statusResult.isInProgress) && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => downloadDocument(doc.id, doc.fileName)}
                            className="ml-2"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-3 text-xs text-gray-500">
                Last checked: {new Date(statusResult.lastUpdated).toLocaleString()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}