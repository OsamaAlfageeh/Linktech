import { FC, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { skillsToString, truncateText } from '@/lib/utils';
import { Link } from 'wouter';

interface RecommendedProjectsProps {
  companyId: number;
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

interface RecommendedProjectItem {
  project: Project;
  matchScore: number;
}

const RecommendedProjects: FC<RecommendedProjectsProps> = ({ companyId, limit = 3 }) => {
  const { data, isLoading, error } = useQuery<RecommendedProjectItem[]>({
    queryKey: ['/api/recommendations/companies', companyId, 'projects'],
    queryFn: async () => {
      const response = await fetch(`/api/recommendations/companies/${companyId}/projects?limit=${limit}`);
      if (!response.ok) {
        throw new Error('فشل في الحصول على المشاريع الموصى بها');
      }
      return response.json();
    },
    enabled: !!companyId,
  });

  if (isLoading) {
    return (
      <div className="space-y-3 rtl">
        <h3 className="text-xl font-bold text-right mb-4">المشاريع الموصى بها</h3>
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
        <h3 className="text-xl font-bold mb-4">المشاريع الموصى بها</h3>
        <p className="text-red-500">حدث خطأ أثناء تحميل المشاريع الموصى بها</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rtl text-right">
        <h3 className="text-xl font-bold mb-4">المشاريع الموصى بها</h3>
        <p className="text-gray-500">لا توجد مشاريع موصى بها حالياً</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rtl">
      <h3 className="text-xl font-bold text-right mb-4">المشاريع الموصى بها</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.map(({ project, matchScore }) => (
          <Card key={project.id} className="overflow-hidden border border-gray-200 hover:border-primary hover:shadow-md transition-all">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-right font-bold text-lg">{project.title}</CardTitle>
                <Badge variant={project.highlightStatus === 'عالي الطلب' ? 'destructive' : 'secondary'}>
                  {project.highlightStatus || project.status}
                </Badge>
              </div>
              <CardDescription className="text-right text-sm text-muted-foreground">
                بواسطة {project.name || project.username || 'مستخدم'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-right mb-3">{truncateText(project.description, 100)}</p>
              <div className="flex justify-between text-sm mb-3 text-gray-500">
                <div>
                  <span className="font-bold">الميزانية:</span> {project.budget}
                </div>
                <div>
                  <span className="font-bold">المدة:</span> {project.duration}
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {project.skills?.map((skill) => (
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
              <Link href={`/projects/${project.id}`}>
                <Button variant="outline" className="w-full">عرض التفاصيل</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RecommendedProjects;