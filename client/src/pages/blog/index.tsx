import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  Search, 
  Clock, 
  ArrowRight, 
  Tag, 
  Filter,
  Loader2,
  RefreshCw
} from "lucide-react";
import { BlogPost, BlogCategory } from '@shared/schema';

/**
 * صفحة المدونة الرئيسية
 * تعرض قائمة بالمقالات المنشورة ووسائل التصفية والبحث
 */
export default function BlogPage() {
  const [_, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  // استعلام لجلب المقالات المنشورة
  const { 
    data: posts, 
    isLoading: loadingPosts,
    isError: postsError,
    refetch: refetchPosts
  } = useQuery({
    queryKey: ['/api/blog/posts', { categoryId: selectedCategory }],
  });
  
  // استعلام لجلب فئات المدونة
  const { 
    data: categories, 
    isLoading: loadingCategories 
  } = useQuery({
    queryKey: ['/api/blog/categories'],
  });
  
  // تصفية المقالات حسب كلمة البحث
  const filteredPosts = Array.isArray(posts) ? posts.filter((post: BlogPost) => {
    const searchLower = searchTerm.toLowerCase();
    return (post.title.toLowerCase().includes(searchLower) || 
           (post.excerpt ? post.excerpt.toLowerCase().includes(searchLower) : false) ||
           (post.tags && typeof post.tags === 'string' ? post.tags.toLowerCase().includes(searchLower) : false));
  }) : [];
  
  // تنسيق التاريخ
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // وظيفة تغيير الفئة المحددة
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value === "all" ? "" : value);
  };
  
  // وظيفة التوجه إلى مقال
  const goToPost = (slug: string) => {
    navigate(`/blog/${slug}`);
  };
  
  return (
    <>
      <Helmet>
        <title>المدونة | لينكتك</title>
        <meta
          name="description"
          content="مدونة لينكتك - آخر الأخبار والمقالات في مجال تطوير البرمجيات والتقنية في المملكة العربية السعودية"
        />
        <meta
          name="keywords"
          content="مدونة تقنية, مقالات برمجية, تطوير البرمجيات, لينكتك"
        />
      </Helmet>

      <div className="container mx-auto py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">مدونة لينكتك</h1>
          <p className="text-muted-foreground text-lg mx-auto max-w-2xl">
            آخر الأخبار والمقالات في مجال تطوير البرمجيات والتقنية في المملكة العربية السعودية
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="md:col-span-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="ابحث في المدونة..."
                className="pr-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="جميع الفئات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                {Array.isArray(categories) ? categories.map((category: BlogCategory) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                )) : null}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => refetchPosts()}
              disabled={loadingPosts}
            >
              {loadingPosts ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {loadingPosts ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="mr-2">جاري تحميل المقالات...</span>
          </div>
        ) : postsError ? (
          <div className="text-center py-12 bg-red-50 rounded-md">
            <p className="text-red-500 mb-4">حدث خطأ أثناء تحميل المقالات</p>
            <Button onClick={() => refetchPosts()}>إعادة المحاولة</Button>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12 bg-muted/40 rounded-md">
            <p className="text-muted-foreground mb-4">لا توجد مقالات تطابق معايير البحث</p>
            {searchTerm && (
              <Button 
                variant="outline" 
                onClick={() => setSearchTerm('')}
              >
                إلغاء البحث
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredPosts.map((post: BlogPost) => (
              <Card 
                key={post.id} 
                className="overflow-hidden flex flex-col cursor-pointer transition-all duration-300 hover:shadow-md"
                onClick={() => goToPost(post.slug)}
              >
                {post.featuredImage && (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary">
                      {Array.isArray(categories) ? 
                        categories.find((c: BlogCategory) => c.id === post.categoryId)?.name || 'عام'
                        : 'عام'}
                    </Badge>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 ml-1" />
                      {formatDate(post.createdAt)}
                    </div>
                  </div>
                  <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                  <CardDescription className="line-clamp-3 mt-2">
                    {post.excerpt}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="pt-0 mt-auto">
                  <div className="w-full flex justify-between items-center">
                    {post.tags && (
                      <div className="flex items-center">
                        <Tag className="h-3 w-3 ml-1" />
                        <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                          {post.tags}
                        </span>
                      </div>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-primary"
                    >
                      اقرأ المزيد
                      <ArrowRight className="mr-1 h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}