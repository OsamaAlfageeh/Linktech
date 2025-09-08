import { FC, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrainCircuit, TrendingUp, Code, Bookmark } from 'lucide-react';

interface AIMarketTrendsProps {
  limit?: number;
}

interface DomainTrend {
  domain: string;
  count: number;
  averageBudget: string;
}

interface TechnologyTrend {
  technology: string;
  projectCount: number;
  companies: number;
}

const AIMarketTrends: FC<AIMarketTrendsProps> = ({ limit = 10 }) => {
  const [activeTab, setActiveTab] = useState<string>("domains");
  
  const { 
    data: domainsData, 
    isLoading: domainsLoading, 
    error: domainsError 
  } = useQuery<DomainTrend[]>({
    queryKey: ['/api/ai-recommendations/market/domains'],
    queryFn: async () => {
      const response = await fetch(`/api/ai-recommendations/market/domains?limit=${limit}`);
      if (!response.ok) {
        throw new Error('فشل في الحصول على اتجاهات السوق');
      }
      return response.json();
    },
  });

  const { 
    data: technologiesData, 
    isLoading: technologiesLoading, 
    error: technologiesError 
  } = useQuery<TechnologyTrend[]>({
    queryKey: ['/api/ai-recommendations/market/technologies'],
    queryFn: async () => {
      const response = await fetch(`/api/ai-recommendations/market/technologies?limit=${limit}`);
      if (!response.ok) {
        throw new Error('فشل في الحصول على التقنيات الشائعة');
      }
      return response.json();
    },
    enabled: activeTab === "technologies",
  });

  const renderDomainsSkeleton = () => (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-3 border-b">
          <Skeleton className="h-5 w-1/3" />
          <div className="flex items-center">
            <Skeleton className="h-5 w-16 ml-2" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      ))}
    </>
  );

  const renderTechnologiesSkeleton = () => (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-3 border-b">
          <Skeleton className="h-5 w-1/3" />
          <div className="flex items-center">
            <Skeleton className="h-5 w-10 ml-2" />
            <Skeleton className="h-5 w-10" />
          </div>
        </div>
      ))}
    </>
  );

  return (
    <Card className="overflow-hidden border border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold">اتجاهات السوق</CardTitle>
          <div className="flex items-center bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            <BrainCircuit className="w-5 h-5 ml-1 text-blue-600" />
            <span className="text-blue-600 text-sm font-semibold">تحليل متقدم</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs defaultValue="domains" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="domains" className="flex items-center">
              <Bookmark className="h-4 w-4 ml-2" />
              المجالات الشائعة
            </TabsTrigger>
            <TabsTrigger value="technologies" className="flex items-center">
              <Code className="h-4 w-4 ml-2" />
              التقنيات المطلوبة
            </TabsTrigger>
          </TabsList>

          <TabsContent value="domains" className="space-y-1">
            {domainsLoading ? (
              renderDomainsSkeleton()
            ) : domainsError ? (
              <div className="p-3 text-red-500 text-center">
                حدث خطأ أثناء تحميل البيانات
              </div>
            ) : domainsData && domainsData.length > 0 ? (
              <div className="max-h-[300px] overflow-auto">
                {domainsData.slice(0, limit).map((domain, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center justify-between p-3 ${
                      index < domainsData.length - 1 ? 'border-b' : ''
                    } hover:bg-blue-50 transition-colors duration-200`}
                  >
                    <div className="flex items-center">
                      <Badge 
                        className={`ml-2 ${index < 3 ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' : 'bg-gray-100 text-gray-800 hover:bg-gray-100'}`}
                      >
                        {index + 1}
                      </Badge>
                      <span className="font-medium">{domain.domain}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="flex items-center ml-4">
                        <TrendingUp className="w-4 h-4 text-green-600 ml-1" />
                        <span className="text-sm">{domain.count} مشروع</span>
                      </div>
                      <Badge variant="outline" className="font-medium">
                        {domain.averageBudget}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 text-center text-gray-500">
                لا توجد بيانات متاحة
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="technologies" className="space-y-1">
            {technologiesLoading ? (
              renderTechnologiesSkeleton()
            ) : technologiesError ? (
              <div className="p-3 text-red-500 text-center">
                حدث خطأ أثناء تحميل البيانات
              </div>
            ) : technologiesData && technologiesData.length > 0 ? (
              <div className="max-h-[300px] overflow-auto">
                {technologiesData.slice(0, limit).map((tech, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center justify-between p-3 ${
                      index < technologiesData.length - 1 ? 'border-b' : ''
                    } hover:bg-blue-50 transition-colors duration-200`}
                  >
                    <div className="flex items-center">
                      <Badge 
                        className={`ml-2 ${index < 3 ? 'bg-purple-100 text-purple-800 hover:bg-purple-100' : 'bg-gray-100 text-gray-800 hover:bg-gray-100'}`}
                      >
                        {index + 1}
                      </Badge>
                      <span className="font-medium">{tech.technology}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="ml-4">{tech.projectCount} مشروع</span>
                      <span>{tech.companies} شركة</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 text-center text-gray-500">
                لا توجد بيانات متاحة
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AIMarketTrends;