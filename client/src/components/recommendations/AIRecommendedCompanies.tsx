import { FC, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { skillsToString, truncateText, getInitials, stringToColor } from '@/lib/utils';
import { Link } from 'wouter';
import { Star, BrainCircuit, ChevronDown, ChevronUp, BotMessageSquare } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface AIRecommendedCompaniesProps {
  projectId: number;
  limit?: number;
}

type Company = {
  id: number;
  userId: number;
  description: string;
  logo?: string;
  coverPhoto?: string;
  website?: string;
  location?: string;
  skills: string[];
  rating?: number;
  reviewCount?: number;
  name?: string;
  username?: string;
  blurredName?: string;
  verified?: boolean;
};

interface MatchDetails {
  skillsScore: number;
  keywordsScore: number;
  technologiesScore: number;
  domainsScore: number;
  featuresScore: number;
}

interface AIRecommendedCompanyItem {
  company: Company;
  matchScore: number;
  matchDetails: MatchDetails;
}

const AIRecommendedCompanies: FC<AIRecommendedCompaniesProps> = ({ projectId, limit = 3 }) => {
  const [activeTab, setActiveTab] = useState<string>("ai");
  
  const { data, isLoading, error } = useQuery<AIRecommendedCompanyItem[]>({
    queryKey: ['/api/ai-recommendations/projects', projectId, 'companies'],
    queryFn: async () => {
      const response = await fetch(`/api/ai-recommendations/projects/${projectId}/companies?limit=${limit}`);
      if (!response.ok) {
        throw new Error('فشل في الحصول على الشركات الموصى بها من الذكاء الاصطناعي');
      }
      return response.json();
    },
    enabled: !!projectId,
  });

  const { data: traditionalData, isLoading: traditionalLoading } = useQuery<any[]>({
    queryKey: ['/api/recommendations/projects', projectId, 'companies'],
    queryFn: async () => {
      const response = await fetch(`/api/recommendations/projects/${projectId}/companies?limit=${limit}`);
      if (!response.ok) {
        throw new Error('فشل في الحصول على الشركات الموصى بها');
      }
      return response.json();
    },
    enabled: !!projectId && activeTab === "traditional",
  });

  // جمع عنصر التحميل
  if (isLoading || (activeTab === "traditional" && traditionalLoading)) {
    return (
      <div className="space-y-3 rtl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-right">الشركات الموصى بها</h3>
          <div className="flex items-center">
            <BrainCircuit className="w-5 h-5 ml-1 text-blue-600" />
            <span className="text-blue-600 text-sm font-semibold">تحليل ذكي</span>
          </div>
        </div>
        {Array.from({ length: limit }).map((_, i) => (
          <Card key={i} className="w-full">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-16 w-full" />
              <div className="flex flex-wrap gap-1 mt-2">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-5 w-16" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rtl text-right">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">الشركات الموصى بها</h3>
          <div className="flex items-center">
            <BrainCircuit className="w-5 h-5 ml-1 text-blue-600" />
            <span className="text-blue-600 text-sm font-semibold">تحليل ذكي</span>
          </div>
        </div>
        <p className="text-red-500">حدث خطأ أثناء تحميل الشركات الموصى بها</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rtl text-right">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">الشركات الموصى بها</h3>
          <div className="flex items-center">
            <BrainCircuit className="w-5 h-5 ml-1 text-blue-600" />
            <span className="text-blue-600 text-sm font-semibold">تحليل ذكي</span>
          </div>
        </div>
        <p className="text-gray-500">لا توجد شركات موصى بها حالياً</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rtl">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-right">الشركات الموصى بها</h3>
        <div className="flex items-center bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
          <BrainCircuit className="w-5 h-5 ml-1 text-blue-600" />
          <span className="text-blue-600 text-sm font-semibold">معزز بالذكاء الاصطناعي</span>
        </div>
      </div>
      
      <Tabs defaultValue="ai" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="ai" className="flex items-center">
            <BotMessageSquare className="w-4 h-4 ml-2" />
            توصيات ذكية
          </TabsTrigger>
          <TabsTrigger value="traditional">
            توصيات عادية
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.map(({ company, matchScore, matchDetails }) => (
              <Card key={company.id} className="overflow-hidden border border-gray-200 hover:border-primary hover:shadow-md transition-all">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      {company.logo ? (
                        <img 
                          src={company.logo} 
                          alt={company.blurredName || ''} 
                          className="w-10 h-10 rounded-md ml-2" 
                        />
                      ) : (
                        <div 
                          className="w-10 h-10 rounded-md ml-2 flex items-center justify-center text-white"
                          style={{ backgroundColor: stringToColor(company.blurredName || '') }}
                        >
                          {getInitials(company.blurredName || '')}
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-right font-bold text-lg">
                          {company.blurredName || 'شركة متخصصة'}
                        </CardTitle>
                        {company.verified && (
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">موثقة</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center">
                      {company.rating ? (
                        <>
                          <span className="text-amber-500 font-semibold ml-1">{company.rating.toFixed(1)}</span>
                          <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                        </>
                      ) : null}
                    </div>
                  </div>
                  <CardDescription className="text-right text-sm text-muted-foreground">
                    {company.location || 'غير محدد'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {company.skills?.slice(0, 5).map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs bg-gray-100">
                        {skill}
                      </Badge>
                    ))}
                    {company.skills?.length > 5 && (
                      <Badge variant="outline" className="text-xs bg-transparent border-dashed">
                        +{company.skills.length - 5}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="bg-gradient-to-l from-blue-50 to-gray-50 p-3 rounded-lg">
                    <div className="flex items-center mb-2">
                      <span className="text-sm font-semibold ml-2">نسبة التطابق مع مشروعك:</span>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-gradient-to-l from-green-600 to-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${Math.round(matchScore * 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-blue-700 mr-2 min-w-[40px] text-center">
                        {Math.round(matchScore * 100)}%
                      </span>
                    </div>
                    
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="details" className="border-0">
                        <AccordionTrigger className="py-1 text-sm text-blue-600 hover:text-blue-800 hover:no-underline">
                          تفاصيل التطابق
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span>المهارات:</span>
                              <div className="flex items-center">
                                <div className="w-24 bg-gray-200 rounded-full h-1.5 ml-2">
                                  <div 
                                    className="bg-blue-600 h-1.5 rounded-full" 
                                    style={{ width: `${Math.round(matchDetails.skillsScore * 100)}%` }}
                                  ></div>
                                </div>
                                <span>{Math.round(matchDetails.skillsScore * 100)}%</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span>التقنيات:</span>
                              <div className="flex items-center">
                                <div className="w-24 bg-gray-200 rounded-full h-1.5 ml-2">
                                  <div 
                                    className="bg-green-600 h-1.5 rounded-full" 
                                    style={{ width: `${Math.round(matchDetails.technologiesScore * 100)}%` }}
                                  ></div>
                                </div>
                                <span>{Math.round(matchDetails.technologiesScore * 100)}%</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span>المجال:</span>
                              <div className="flex items-center">
                                <div className="w-24 bg-gray-200 rounded-full h-1.5 ml-2">
                                  <div 
                                    className="bg-purple-600 h-1.5 rounded-full" 
                                    style={{ width: `${Math.round(matchDetails.domainsScore * 100)}%` }}
                                  ></div>
                                </div>
                                <span>{Math.round(matchDetails.domainsScore * 100)}%</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span>الكلمات المفتاحية:</span>
                              <div className="flex items-center">
                                <div className="w-24 bg-gray-200 rounded-full h-1.5 ml-2">
                                  <div 
                                    className="bg-amber-600 h-1.5 rounded-full" 
                                    style={{ width: `${Math.round(matchDetails.keywordsScore * 100)}%` }}
                                  ></div>
                                </div>
                                <span>{Math.round(matchDetails.keywordsScore * 100)}%</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span>الميزات:</span>
                              <div className="flex items-center">
                                <div className="w-24 bg-gray-200 rounded-full h-1.5 ml-2">
                                  <div 
                                    className="bg-orange-600 h-1.5 rounded-full" 
                                    style={{ width: `${Math.round(matchDetails.featuresScore * 100)}%` }}
                                  ></div>
                                </div>
                                <span>{Math.round(matchDetails.featuresScore * 100)}%</span>
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href={`/companies/${company.id}`}>
                    <Button variant="outline" className="w-full">عرض الشركة</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="traditional">
          {traditionalData && traditionalData.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {traditionalData.map(({ company, matchScore }) => (
                <Card key={company.id} className="overflow-hidden border border-gray-200 hover:border-primary hover:shadow-md transition-all">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        {company.logo ? (
                          <img 
                            src={company.logo} 
                            alt={company.blurredName || ''} 
                            className="w-10 h-10 rounded-md ml-2" 
                          />
                        ) : (
                          <div 
                            className="w-10 h-10 rounded-md ml-2 flex items-center justify-center text-white"
                            style={{ backgroundColor: stringToColor(company.blurredName || '') }}
                          >
                            {getInitials(company.blurredName || '')}
                          </div>
                        )}
                        <CardTitle className="text-right font-bold text-lg">
                          {company.blurredName || 'شركة متخصصة'}
                        </CardTitle>
                      </div>
                      <div className="flex items-center">
                        {company.rating ? (
                          <>
                            <span className="text-amber-500 font-semibold ml-1">{company.rating.toFixed(1)}</span>
                            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                          </>
                        ) : null}
                      </div>
                    </div>
                    <CardDescription className="text-right text-sm text-muted-foreground">
                      {company.location || 'غير محدد'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {company.skills?.slice(0, 5).map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs bg-gray-100">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="mt-3 bg-gray-100 p-2 rounded-md">
                      <div className="flex items-center">
                        <span className="text-xs font-semibold">نسبة التطابق: </span>
                        <div className="w-full bg-gray-300 rounded-full h-2 ml-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${Math.round(matchScore * 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-semibold mr-2">{Math.round(matchScore * 100)}%</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Link href={`/companies/${company.id}`}>
                      <Button variant="outline" className="w-full">عرض الشركة</Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">لا توجد توصيات متاحة في الوضع التقليدي</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIRecommendedCompanies;