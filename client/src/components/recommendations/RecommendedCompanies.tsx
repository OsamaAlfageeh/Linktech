import { FC } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { skillsToString, truncateText, getInitials, stringToColor } from '@/lib/utils';
import { Link } from 'wouter';
import { Star } from 'lucide-react';

interface RecommendedCompaniesProps {
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
};

interface RecommendedCompanyItem {
  company: Company;
  matchScore: number;
}

const RecommendedCompanies: FC<RecommendedCompaniesProps> = ({ projectId, limit = 3 }) => {
  const { data, isLoading, error } = useQuery<RecommendedCompanyItem[]>({
    queryKey: ['/api/recommendations/projects', projectId, 'companies'],
    queryFn: async () => {
      const response = await fetch(`/api/recommendations/projects/${projectId}/companies?limit=${limit}`);
      if (!response.ok) {
        throw new Error('فشل في الحصول على الشركات الموصى بها');
      }
      return response.json();
    },
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <div className="space-y-3 rtl">
        <h3 className="text-xl font-bold text-right mb-4">الشركات الموصى بها</h3>
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
        <h3 className="text-xl font-bold mb-4">الشركات الموصى بها</h3>
        <p className="text-red-500">حدث خطأ أثناء تحميل الشركات الموصى بها</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rtl text-right">
        <h3 className="text-xl font-bold mb-4">الشركات الموصى بها</h3>
        <p className="text-gray-500">لا توجد شركات موصى بها حالياً</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rtl">
      <h3 className="text-xl font-bold text-right mb-4">الشركات الموصى بها</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.map(({ company, matchScore }) => (
          <Card key={company.id} className="overflow-hidden border border-gray-200 hover:border-primary hover:shadow-md transition-all">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  {company.logo ? (
                    <img 
                      src={company.logo} 
                      alt={company.name || ''} 
                      className="w-10 h-10 rounded-md ml-2" 
                    />
                  ) : (
                    <div 
                      className="w-10 h-10 rounded-md ml-2 flex items-center justify-center text-white"
                      style={{ backgroundColor: stringToColor(company.name || company.username || '') }}
                    >
                      {getInitials(company.name || company.username || '')}
                    </div>
                  )}
                  <CardTitle className="text-right font-bold text-lg">
                    {company.name || company.username || 'شركة'}
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
              <p className="text-right mb-3">{truncateText(company.description, 100)}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {company.skills?.map((skill) => (
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
    </div>
  );
};

export default RecommendedCompanies;