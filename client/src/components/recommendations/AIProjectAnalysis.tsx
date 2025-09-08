import { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { BrainCircuit, Lightbulb, Zap, Code, FileSearch } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface AIProjectAnalysisProps {
  projectId: number;
}

interface ProjectAnalysis {
  id: number;
  title: string;
  description: string;
  budget: string;
  duration: string;
  skills: string[];
  status: string;
  extractedKeywords: string[];
  extractedTechnologies: string[];
  extractedDomains: string[];
  extractedFeatures: string[];
}

const AIProjectAnalysis: FC<AIProjectAnalysisProps> = ({ projectId }) => {
  const { data, isLoading, error } = useQuery<ProjectAnalysis>({
    queryKey: [`/api/ai-recommendations/analyze/project/${projectId}`],
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <Card className="overflow-hidden border border-gray-200 hover:border-blue-200 hover:shadow-sm transition-all">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-bold">تحليل ذكي للمشروع</CardTitle>
            <div className="flex items-center">
              <BrainCircuit className="w-5 h-5 ml-1 text-blue-600" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="overflow-hidden border border-gray-200">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-bold">تحليل ذكي للمشروع</CardTitle>
            <div className="flex items-center">
              <BrainCircuit className="w-5 h-5 ml-1 text-blue-600" />
              <span className="text-blue-600 text-sm font-semibold">تحليل متقدم</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-red-500 text-center">
            حدث خطأ أثناء تحليل المشروع. يرجى المحاولة مرة أخرى لاحقاً.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Card className="overflow-hidden border border-gray-200 hover:border-blue-200 hover:shadow-sm transition-all">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold">تحليل ذكي للمشروع</CardTitle>
          <div className="flex items-center bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            <BrainCircuit className="w-5 h-5 ml-1 text-blue-600" />
            <span className="text-blue-600 text-sm font-semibold">تحليل متقدم</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="keywords" className="border-b-0 mt-2">
            <AccordionTrigger className="py-3 hover:no-underline">
              <div className="flex items-center text-lg font-medium text-right">
                <Lightbulb className="w-5 h-5 ml-2 text-amber-500" />
                الكلمات المفتاحية
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                <div className="flex flex-wrap gap-2">
                  {data.extractedKeywords.length > 0 ? (
                    data.extractedKeywords.map((keyword, index) => (
                      <Badge 
                        key={index} 
                        className="bg-amber-100 hover:bg-amber-200 text-amber-800 hover:text-amber-900 border-amber-200"
                      >
                        {keyword}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">لم يتم العثور على كلمات مفتاحية</p>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="technologies" className="border-b-0">
            <AccordionTrigger className="py-3 hover:no-underline">
              <div className="flex items-center text-lg font-medium text-right">
                <Code className="w-5 h-5 ml-2 text-blue-500" />
                التقنيات المكتشفة
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex flex-wrap gap-2">
                  {data.extractedTechnologies.length > 0 ? (
                    data.extractedTechnologies.map((tech, index) => (
                      <Badge 
                        key={index} 
                        className="bg-blue-100 hover:bg-blue-200 text-blue-800 hover:text-blue-900 border-blue-200"
                      >
                        {tech}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">لم يتم العثور على تقنيات محددة</p>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="domains" className="border-b-0">
            <AccordionTrigger className="py-3 hover:no-underline">
              <div className="flex items-center text-lg font-medium text-right">
                <FileSearch className="w-5 h-5 ml-2 text-purple-500" />
                المجالات المرتبطة
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                <div className="flex flex-wrap gap-2">
                  {data.extractedDomains.length > 0 ? (
                    data.extractedDomains.map((domain, index) => (
                      <Badge 
                        key={index} 
                        className="bg-purple-100 hover:bg-purple-200 text-purple-800 hover:text-purple-900 border-purple-200"
                      >
                        {domain}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">لم يتم العثور على مجالات محددة</p>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="features" className="border-b-0">
            <AccordionTrigger className="py-3 hover:no-underline">
              <div className="flex items-center text-lg font-medium text-right">
                <Zap className="w-5 h-5 ml-2 text-green-500" />
                الميزات المقترحة
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                <div className="flex flex-wrap gap-2">
                  {data.extractedFeatures.length > 0 ? (
                    data.extractedFeatures.map((feature, index) => (
                      <Badge 
                        key={index} 
                        className="bg-green-100 hover:bg-green-200 text-green-800 hover:text-green-900 border-green-200"
                      >
                        {feature}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">لم يتم العثور على ميزات محددة</p>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default AIProjectAnalysis;