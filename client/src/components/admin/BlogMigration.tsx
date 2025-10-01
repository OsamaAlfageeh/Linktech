import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Database, Upload, FileText, CheckCircle, XCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface ExportFile {
  name: string;
  path: string;
}

interface SeedingResult {
  success: boolean;
  message: string;
  categories?: { created: number; skipped: number; errors: number };
  authors?: { created: number; skipped: number; errors: number };
  posts?: { created: number; skipped: number; errors: number };
  comments?: { created: number; skipped: number; errors: number };
  stdout?: string;
  stderr?: string;
}

/**
 * Blog Migration Admin Component
 * Allows admins to seed blog data from JSON export files
 */
export default function BlogMigration() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [exportFiles, setExportFiles] = useState<ExportFile[]>([]);
  const [selectedFile, setSelectedFile] = useState('exports/blog-export-2025-10-01.json');
  const [result, setResult] = useState<SeedingResult | null>(null);

  // Load available export files
  const loadExportFiles = async () => {
    try {
      const response = await apiRequest('GET', '/api/admin/export-files');
      const data = await response.json();
      
      if (data.success) {
        setExportFiles(data.files.map((file: string) => ({
          name: file,
          path: `exports/${file}`
        })));
      }
    } catch (error) {
      console.error('Error loading export files:', error);
    }
  };

  // Run blog data seeding
  const runSeeding = async () => {
    if (!selectedFile) {
      toast({
        title: 'خطأ',
        description: 'يرجى اختيار ملف التصدير',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await apiRequest('POST', '/api/admin/seed-blog-data', {
        exportFile: selectedFile
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        toast({
          title: 'تم بنجاح',
          description: 'تم استيراد بيانات المدونة بنجاح',
        });
      } else {
        toast({
          title: 'خطأ',
          description: data.message || 'فشل في استيراد البيانات',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error running seeding:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء استيراد البيانات',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            إدارة استيراد بيانات المدونة
          </CardTitle>
          <CardDescription>
            استيراد بيانات المدونة من ملفات JSON إلى قاعدة البيانات الحية
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Export Files Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="export-files">ملفات التصدير المتاحة</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={loadExportFiles}
                disabled={isLoading}
              >
                <FileText className="h-4 w-4 mr-2" />
                تحديث القائمة
              </Button>
            </div>
            
            {exportFiles.length > 0 ? (
              <div className="grid gap-2">
                {exportFiles.map((file) => (
                  <div
                    key={file.path}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedFile === file.path
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedFile(file.path)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{file.name}</span>
                      {selectedFile === file.path && (
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center text-gray-500">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>لا توجد ملفات تصدير متاحة</p>
                <p className="text-sm">تأكد من وجود ملفات JSON في مجلد exports</p>
              </div>
            )}
          </div>

          {/* Manual File Input */}
          <div className="space-y-2">
            <Label htmlFor="manual-file">أو أدخل مسار الملف يدوياً</Label>
            <Input
              id="manual-file"
              value={selectedFile}
              onChange={(e) => setSelectedFile(e.target.value)}
              placeholder="exports/blog-export-2025-10-01.json"
            />
          </div>

          {/* Run Seeding Button */}
          <Button
            onClick={runSeeding}
            disabled={isLoading || !selectedFile}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                جاري الاستيراد...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                استيراد بيانات المدونة
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Section */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              نتيجة الاستيراد
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`p-4 rounded-lg ${
              result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`font-medium ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {result.message}
              </p>
            </div>

            {/* Statistics */}
            {result.success && (result.categories || result.authors || result.posts || result.comments) && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {result.categories && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-600">الفئات</div>
                    <div className="text-lg font-semibold text-blue-800">
                      {result.categories.created} جديد
                    </div>
                    <div className="text-xs text-blue-600">
                      {result.categories.skipped} موجود
                    </div>
                  </div>
                )}
                
                {result.authors && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-sm text-green-600">المؤلفون</div>
                    <div className="text-lg font-semibold text-green-800">
                      {result.authors.created} جديد
                    </div>
                    <div className="text-xs text-green-600">
                      {result.authors.skipped} موجود
                    </div>
                  </div>
                )}
                
                {result.posts && (
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="text-sm text-purple-600">المقالات</div>
                    <div className="text-lg font-semibold text-purple-800">
                      {result.posts.created} جديد
                    </div>
                    <div className="text-xs text-purple-600">
                      {result.posts.skipped} موجود
                    </div>
                  </div>
                )}
                
                {result.comments && (
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="text-sm text-orange-600">التعليقات</div>
                    <div className="text-lg font-semibold text-orange-800">
                      {result.comments.created} جديد
                    </div>
                    <div className="text-xs text-orange-600">
                      {result.comments.skipped} موجود
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Output Logs */}
            {result.stdout && (
              <div className="space-y-2">
                <Label>سجل التنفيذ</Label>
                <pre className="p-3 bg-gray-100 rounded-lg text-sm overflow-auto max-h-40">
                  {result.stdout}
                </pre>
              </div>
            )}

            {result.stderr && (
              <div className="space-y-2">
                <Label>أخطاء</Label>
                <pre className="p-3 bg-red-100 rounded-lg text-sm overflow-auto max-h-40 text-red-800">
                  {result.stderr}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
