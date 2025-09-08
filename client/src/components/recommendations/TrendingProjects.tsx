import { FC } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { skillsToString, truncateText } from '@/lib/utils';
import { Link } from 'wouter';
import { TrendingUp } from 'lucide-react';

interface TrendingProjectsProps {
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
  userId: number;
  name?: string;
  username?: string;
};

const TrendingProjects: FC<TrendingProjectsProps> = ({ limit = 5 }) => {
  const { data, isLoading, error } = useQuery<Project[]>({
    queryKey: ['/api/recommendations/trending-projects'],
    queryFn: async () => {
      const response = await fetch(`/api/recommendations/trending-projects?limit=${limit}`);
      if (!response.ok) {
        throw new Error('فشل في الحصول على المشاريع الرائجة');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3 rtl">
        <div className="flex items-center mb-4">
          <TrendingUp className="ml-2 text-primary" />
          <h3 className="text-xl font-bold text-right">المشاريع الرائجة</h3>
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
        <div className="flex items-center mb-4">
          <TrendingUp className="ml-2 text-primary" />
          <h3 className="text-xl font-bold">المشاريع الرائجة</h3>
        </div>
        <p className="text-red-500">حدث خطأ أثناء تحميل المشاريع الرائجة</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rtl text-right">
        <div className="flex items-center mb-4">
          <TrendingUp className="ml-2 text-primary" />
          <h3 className="text-xl font-bold">المشاريع الرائجة</h3>
        </div>
        <p className="text-gray-500">لا توجد مشاريع رائجة حالياً</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rtl">
      <div className="flex items-center mb-4">
        <TrendingUp className="ml-2 text-primary" />
        <h3 className="text-xl font-bold">المشاريع ذات الطلب العالي</h3>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.map((project) => (
          <Card key={project.id} className="overflow-hidden border border-gray-200 hover:border-primary hover:shadow-md transition-all">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-right font-bold text-lg">{project.title}</CardTitle>
                <Badge variant={project.highlightStatus === 'عالي الطلب' ? 'destructive' : 'secondary'}>
                  {project.highlightStatus || project.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1 mt-2">
                {project.skills?.map((skill) => (
                  <Badge key={skill} variant="outline" className="text-xs bg-gray-100">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/auth/register">
                <Button className="w-full">اطلب مشروع مماثل</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TrendingProjects;