import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import CompanyCard from "@/components/companies/CompanyCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

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

const Companies = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("rating");

  const { data: companies, isLoading, error } = useQuery<Company[]>({
    queryKey: ['/api/companies'],
  });

  // Filter and sort companies
  const filteredCompanies = companies
    ? companies.filter(company => {
        const matchesSearch = 
          (company.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) || 
          company.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (company.location?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
        
        const matchesSkill = selectedSkill === "_all" || selectedSkill === ""
          ? true
          : company.skills.some(skill => skill.toLowerCase() === selectedSkill.toLowerCase());
        
        return matchesSearch && matchesSkill;
      })
    : [];

  // Sort companies
  const sortedCompanies = [...filteredCompanies].sort((a, b) => {
    if (sortBy === "rating") {
      return (b.rating || 0) - (a.rating || 0);
    } else if (sortBy === "reviews") {
      return (b.reviewCount || 0) - (a.reviewCount || 0);
    } else if (sortBy === "name") {
      return (a.name || "").localeCompare(b.name || "");
    }
    return 0;
  });

  // Extract unique skills from all companies
  const allSkills = companies
    ? Array.from(new Set(companies.flatMap(company => company.skills)))
    : [];

  return (
    <>
      <Helmet>
        <title>شركات البرمجة | تِكلينك</title>
        <meta name="description" content="استعرض أفضل شركات البرمجة المتخصصة في تطوير المشاريع التقنية" />
      </Helmet>

      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-heading mb-2">شركات البرمجة</h1>
          <p className="text-neutral-600">استعرض أفضل شركات البرمجة المتخصصة في تطوير المشاريع التقنية</p>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-neutral-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <Input
                  placeholder="البحث عن شركة..."
                  className="pl-3 pr-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                <SelectTrigger>
                  <SelectValue placeholder="التخصص" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">جميع التخصصات</SelectItem>
                  {allSkills.map((skill, index) => (
                    <SelectItem key={index} value={skill}>{skill}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="الترتيب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">التقييم</SelectItem>
                  <SelectItem value="reviews">عدد المراجعات</SelectItem>
                  <SelectItem value="name">الاسم</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Companies Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CompanySkeleton />
            <CompanySkeleton />
            <CompanySkeleton />
            <CompanySkeleton />
            <CompanySkeleton />
            <CompanySkeleton />
          </div>
        ) : error ? (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-neutral-200 text-center">
            <p className="text-neutral-600">حدث خطأ أثناء تحميل الشركات. حاول مرة أخرى لاحقاً.</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              className="mt-4"
            >
              إعادة المحاولة
            </Button>
          </div>
        ) : sortedCompanies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedCompanies.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-neutral-200 text-center">
            <p className="text-neutral-600 mb-2">لا توجد شركات متطابقة مع معايير البحث.</p>
            <p className="text-neutral-500 text-sm mb-4">حاول تغيير معايير البحث أو التصفية.</p>
            <Button 
              onClick={() => {
                setSearchQuery("");
                setSelectedSkill("");
                setSortBy("rating");
              }} 
              variant="outline"
            >
              إعادة ضبط عوامل التصفية
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default Companies;
