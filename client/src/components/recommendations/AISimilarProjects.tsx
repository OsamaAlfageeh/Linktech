import { FC } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { truncateText } from '@/lib/utils';
import { Link } from 'wouter';
import { Calendar, Banknote, BrainCircuit } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface AISimilarProjectsProps {
  projectId: number;
  limit?: number;
}

type Project = {
  id: number;
  title: string;
  description: string;
  budget: string;
  duration: string;
  skills: string[];
  status: string;
  highlightStatus?: string;
};

interface SimilarityDetails {
  skillsScore: number;
  keywordsScore: number;
  technologiesScore: number;
  domainsScore: number;
  featuresScore: number;
}

interface AISimilarProjectItem {
  project: Project;
  similarityScore: number;
  similarityDetails: SimilarityDetails;
}

const AISimilarProjects: FC<AISimilarProjectsProps> = ({ projectId, limit = 3 }) => {
  const { data, isLoading, error } = useQuery<AISimilarProjectItem[]>({
    queryKey: ['/api/ai-recommendations/projects', projectId, 'similar'],
    queryFn: async () => {
      const response = await fetch(`/api/ai-recommendations/projects/${projectId}/similar?limit=${limit}`);
      if (!response.ok) {
        throw new Error('فشل في الحصول على المشاريع المشابهة');
      }
      return response.json();
    },
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <div className="space-y-3 rtl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-right">مشاريع مشابهة</h3>
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
          <h3 className="text-xl font-bold">مشاريع مشابهة</h3>
          <div className="flex items-center">
            <BrainCircuit className="w-5 h-5 ml-1 text-blue-600" />
            <span className="text-blue-600 text-sm font-semibold">تحليل ذكي</span>
          </div>
        </div>
        <p className="text-red-500">حدث خطأ أثناء تحميل المشاريع المشابهة</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rtl text-right">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">مشاريع مشابهة</h3>
          <div className="flex items-center">
            <BrainCircuit className="w-5 h-5 ml-1 text-blue-600" />
            <span className="text-blue-600 text-sm font-semibold">تحليل ذكي</span>
          </div>
        </div>
        <p className="text-gray-500">لا توجد مشاريع مشابهة حالياً</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rtl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-right">مشاريع مشابهة</h3>
        <div className="flex items-center bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
          <BrainCircuit className="w-5 h-5 ml-1 text-blue-600" />
          <span className="text-blue-600 text-sm font-semibold">معزز بالذكاء الاصطناعي</span>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.map(({ project, similarityScore, similarityDetails }) => (
          <Card key={project.id} className="overflow-hidden border border-gray-200 hover:border-primary hover:shadow-md transition-all">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-right font-bold text-lg line-clamp-1">
                    {project.title}
                  </CardTitle>
                  {project.highlightStatus && (
                    <Badge className="bg-accent text-white hover:bg-accent mt-1">
                      {project.highlightStatus}
                    </Badge>
                  )}
                </div>
                <Badge className={
                  project.status === "open" 
                    ? "bg-green-100 text-green-800 hover:bg-green-100" 
                    : "bg-neutral-100 text-neutral-800 hover:bg-neutral-100"
                }>
                  {project.status === "open" ? "مفتوح" : "مغلق"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-right mb-3 text-sm text-gray-700">{truncateText(project.description, 80)}</p>
              
              <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                <div className="bg-gray-50 p-2 rounded flex items-center">
                  <Banknote className="text-green-600 h-4 w-4 ml-1" />
                  <span>{project.budget}</span>
                </div>
                <div className="bg-gray-50 p-2 rounded flex items-center">
                  <Calendar className="text-blue-600 h-4 w-4 ml-1" />
                  <span>{project.duration}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {project.skills?.slice(0, 3).map((skill) => (
                  <Badge key={skill} variant="outline" className="text-xs bg-gray-100">
                    {skill}
                  </Badge>
                ))}
                {project.skills?.length > 3 && (
                  <Badge variant="outline" className="text-xs bg-transparent border-dashed">
                    +{project.skills.length - 3}
                  </Badge>
                )}
              </div>
              
              <div className="bg-gradient-to-l from-purple-50 to-gray-50 p-3 rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="text-sm font-semibold ml-2">نسبة التشابه:</span>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-gradient-to-l from-purple-600 to-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${Math.round(similarityScore * 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-purple-700 mr-2 min-w-[40px] text-center">
                    {Math.round(similarityScore * 100)}%
                  </span>
                </div>
                
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="details" className="border-0">
                    <AccordionTrigger className="py-1 text-sm text-purple-600 hover:text-purple-800 hover:no-underline">
                      تفاصيل التشابه
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span>المهارات:</span>
                          <div className="flex items-center">
                            <div className="w-24 bg-gray-200 rounded-full h-1.5 ml-2">
                              <div 
                                className="bg-blue-600 h-1.5 rounded-full" 
                                style={{ width: `${Math.round(similarityDetails.skillsScore * 100)}%` }}
                              ></div>
                            </div>
                            <span>{Math.round(similarityDetails.skillsScore * 100)}%</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span>التقنيات:</span>
                          <div className="flex items-center">
                            <div className="w-24 bg-gray-200 rounded-full h-1.5 ml-2">
                              <div 
                                className="bg-green-600 h-1.5 rounded-full" 
                                style={{ width: `${Math.round(similarityDetails.technologiesScore * 100)}%` }}
                              ></div>
                            </div>
                            <span>{Math.round(similarityDetails.technologiesScore * 100)}%</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span>المجال:</span>
                          <div className="flex items-center">
                            <div className="w-24 bg-gray-200 rounded-full h-1.5 ml-2">
                              <div 
                                className="bg-purple-600 h-1.5 rounded-full" 
                                style={{ width: `${Math.round(similarityDetails.domainsScore * 100)}%` }}
                              ></div>
                            </div>
                            <span>{Math.round(similarityDetails.domainsScore * 100)}%</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span>الكلمات المفتاحية:</span>
                          <div className="flex items-center">
                            <div className="w-24 bg-gray-200 rounded-full h-1.5 ml-2">
                              <div 
                                className="bg-amber-600 h-1.5 rounded-full" 
                                style={{ width: `${Math.round(similarityDetails.keywordsScore * 100)}%` }}
                              ></div>
                            </div>
                            <span>{Math.round(similarityDetails.keywordsScore * 100)}%</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span>الميزات:</span>
                          <div className="flex items-center">
                            <div className="w-24 bg-gray-200 rounded-full h-1.5 ml-2">
                              <div 
                                className="bg-orange-600 h-1.5 rounded-full" 
                                style={{ width: `${Math.round(similarityDetails.featuresScore * 100)}%` }}
                              ></div>
                            </div>
                            <span>{Math.round(similarityDetails.featuresScore * 100)}%</span>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </CardContent>
            <CardFooter>
              <Link href={`/projects/${project.id}`}>
                <Button variant="outline" className="w-full">عرض المشروع</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AISimilarProjects;