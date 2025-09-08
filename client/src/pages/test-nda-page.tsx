import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Loader2, FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TestNdaPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  const handleViewPdf = async () => {
    setIsLoading(true);
    try {
      // فتح PDF في نافذة جديدة
      window.open('/api/generate-nda?mode=view', '_blank');
      
      toast({
        title: "تم فتح المستند",
        description: "تم فتح اتفاقية عدم الإفصاح للمعاينة",
      });
    } catch (error) {
      console.error('Error viewing PDF:', error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ أثناء محاولة عرض المستند",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsLoading(true);
    try {
      // تنزيل الملف
      const link = document.createElement('a');
      link.href = '/api/generate-nda?mode=download';
      link.setAttribute('download', 'اتفاقية_عدم_الإفصاح.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "جاري التنزيل",
        description: "بدأ تنزيل اتفاقية عدم الإفصاح",
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ أثناء محاولة تنزيل المستند",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-center mb-8">اختبار إنشاء اتفاقية عدم الإفصاح</h1>
        
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-right">ملف اتفاقية عدم الإفصاح</CardTitle>
            <CardDescription className="text-right">
              قم بعرض أو تنزيل نموذج اتفاقية عدم الإفصاح الذي يدعم اللغة العربية بالكامل
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-right">
              هذا الملف يتضمن تحسينات لعرض النصوص العربية بتنسيق صحيح:
            </p>
            <ul className="list-disc pr-5 space-y-2 text-right">
              <li>عكس ترتيب الكلمات مع الحفاظ على علامات الترقيم</li>
              <li>تقسيم الفقرات الطويلة إلى أسطر مناسبة</li>
              <li>خط Cairo لدعم الحروف العربية</li>
              <li>اسم ملف مناسب باللغة العربية</li>
            </ul>
          </CardContent>
          <CardFooter className="flex justify-between flex-wrap gap-4">
            <Button 
              variant="outline" 
              onClick={handleDownloadPdf}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Download className="h-4 w-4 ml-2" />}
              تنزيل الملف
            </Button>
            <Button 
              onClick={handleViewPdf}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <FileText className="h-4 w-4 ml-2" />}
              عرض الملف
            </Button>
          </CardFooter>
        </Card>

        {previewUrl && (
          <div className="mt-8 w-full">
            <h2 className="text-2xl font-bold mb-4 text-right">معاينة المستند</h2>
            <iframe 
              src={previewUrl} 
              className="w-full h-[70vh] border border-gray-300 rounded-md"
              title="معاينة اتفاقية عدم الإفصاح"
            />
          </div>
        )}
      </div>
    </div>
  );
}