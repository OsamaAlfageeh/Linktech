import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Download, FileText, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TestSadiq() {
  const [documentId, setDocumentId] = useState('');
  const [projectData, setProjectData] = useState({
    title: 'Project Management Application',
    description: 'Comprehensive project and task management solution'
  });
  const [companyData, setCompanyData] = useState({
    name: 'Advanced Technology Company',
    location: 'Riyadh - Saudi Arabia'
  });
  const [isGenerating, setIsGenerating] = useState(false);
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

      {/* Saved Document ID Display */}
      {localStorage.getItem('sadiq_document_id') && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Current Sadiq Document ID:</p>
                <p className="text-sm text-gray-600">{localStorage.getItem('sadiq_document_id')}</p>
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => {
                  localStorage.removeItem('sadiq_document_id');
                  setDocumentId('');
                  toast({
                    title: "تم المسح",
                    description: "تم مسح معرف المستند"
                  });
                }}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}