import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import CompanyCard from "@/components/companies/CompanyCard";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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

const CompanySkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
    <div className="relative">
      <Skeleton className="h-32 w-full" />
      <div className="absolute -bottom-12 right-6">
        <Skeleton className="w-24 h-24 rounded-lg" />
      </div>
    </div>
    <div className="p-6 pt-16">
      <Skeleton className="h-6 w-1/2 mb-2" />
      <div className="flex items-center text-sm mb-3">
        <Skeleton className="h-4 w-28" />
      </div>
      <Skeleton className="h-16 w-full mb-4" />
      <div className="flex flex-wrap gap-2 mb-4">
        <Skeleton className="h-6 w-20 rounded" />
        <Skeleton className="h-6 w-24 rounded" />
        <Skeleton className="h-6 w-16 rounded" />
      </div>
    </div>
    <div className="bg-neutral-50 px-6 py-3 border-t border-neutral-200 flex justify-between items-center">
      <Skeleton className="h-5 w-28" />
      <Skeleton className="h-5 w-5 rounded-full" />
    </div>
  </div>
);

const TopCompanies = () => {
  const { data: companies, isLoading, error } = useQuery<Company[]>({
    queryKey: ['/api/companies'],
  });

  // Show only the top 3 companies by rating
  const topCompanies = companies
    ?.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 3);

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10">
          <div>
            <h2 className="font-heading text-3xl font-bold text-neutral-800">شركات البرمجة المميزة</h2>
            <p className="mt-2 text-lg text-neutral-600">نخبة من أفضل شركات البرمجة في المنصة</p>
          </div>
          <Link href="/companies" className="mt-4 md:mt-0 text-primary font-medium hover:text-primary-dark flex items-center">
            عرض جميع الشركات
            <ArrowRight className="mr-2 h-4 w-4 rtl-flip" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <>
              <CompanySkeleton />
              <CompanySkeleton />
              <CompanySkeleton />
            </>
          ) : error ? (
            <div className="col-span-3 text-center py-8">
              <p className="text-neutral-600">حدث خطأ أثناء تحميل الشركات. حاول مرة أخرى لاحقاً.</p>
            </div>
          ) : topCompanies && topCompanies.length > 0 ? (
            topCompanies.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))
          ) : (
            <div className="col-span-3 text-center py-8">
              <p className="text-neutral-600">لا توجد شركات متاحة حالياً.</p>
              <Link href="/auth/register" className="mt-4 inline-block bg-primary hover:bg-primary-dark text-white font-medium rounded-lg px-6 py-2 transition-colors">
                سجل كشركة برمجة
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TopCompanies;
