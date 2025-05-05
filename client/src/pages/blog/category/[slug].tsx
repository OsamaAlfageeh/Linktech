import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet';
import { apiRequest } from '@/lib/queryClient';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  Search, 
  Calendar, 
  ArrowRight, 
  Tag,
  ChevronLeft,
  BookOpen,
  Eye
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImage: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  categoryId: number | null;
  authorId: number;
  tags: string | null;
  views: number;
}

interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

/**
 * صفحة عرض مقالات فئة معينة في المدونة
 */
export default function BlogCategoryPage() {
  const params = useParams<{ slug: string }>();
  const [_, navigate] = useLocation();
  const slug = params.slug; // الرابط المخصص (slug) للفئة
  const [searchTerm, setSearchTerm] = useState('');
  
  // استعلام لجلب الفئة بناءً على الرابط المخصص
  const { 
    data: category, 
    isLoading: loadingCategory,
    isError: categoryError
  } = useQuery({
    queryKey: ['/api/blog/categories/slug', slug],
    queryFn: () => {
      // تشفير الـ slug في حالة أنه يحتوي على أحرف عربية أو خاصة
      const encodedSlug = encodeURIComponent(slug);
      return apiRequest('GET', `/api/blog/categories/slug/${encodedSlug}`)
        .then(res => res.json());
    },
  });
  
  // استعلام لجلب المقالات المنتمية للفئة
  const { 
    data: posts, 
    isLoading: loadingPosts,
    isError: postsError
  } = useQuery({
    queryKey: ['/api/blog/posts', { categoryId: category?.id }],
    queryFn: () => {
      if (!category?.id) return [];
      return apiRequest('GET', `/api/blog/posts?categoryId=${category.id}`)
        .then(res => res.json());
    },
    enabled: !!category?.id,
  });
  
  // استعلام لجلب جميع فئات المدونة (للعرض في القائمة الجانبية)
  const { 
    data: categories 
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
  
  // العودة إلى صفحة المدونة الرئيسية
  const goBack = () => {
    navigate('/blog');
  };
  
  // التوجه إلى مقال معين
  const goToPost = (postSlug: string) => {
    navigate(`/blog/${postSlug}`);
  };
  
  // التوجه إلى فئة معينة
  const goToCategory = (categorySlug: string) => {
    navigate(`/blog/category/${categorySlug}`);
  };
  
  // في حالة حدوث خطأ أثناء تحميل الفئة
  if (categoryError) {
    return (
      <div className="container mx-auto py-20 text-center">
        <h1 className="text-4xl font-bold mb-6">لم يتم العثور على الفئة</h1>
        <p className="text-muted-foreground mb-8">
          الفئة التي تبحث عنها غير موجودة أو تم حذفها
        </p>
        <Button onClick={goBack}>
          <ChevronLeft className="ml-2 h-4 w-4" />
          العودة إلى المدونة
        </Button>
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>{category?.name ? `${category.name} | لينكتك` : "تحميل الفئة..."}</title>
        {category?.description && (
          <meta name="description" content={category.description} />
        )}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://linktech.app/blog/category/${slug}`} />
      </Helmet>
      
      <div className="container mx-auto py-8">
        <Button 
          variant="ghost" 
          onClick={goBack}
          className="mb-6"
        >
          <ChevronLeft className="ml-2 h-4 w-4" />
          العودة إلى المدونة
        </Button>
        
        {loadingCategory ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="mr-2">جاري تحميل معلومات الفئة...</span>
          </div>
        ) : category ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-8 space-y-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">
                  {category.name}
                </h1>
                
                {category.description && (
                  <p className="text-muted-foreground mb-6">
                    {category.description}
                  </p>
                )}
                
                <div className="relative mb-8">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="ابحث في مقالات هذه الفئة..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                {loadingPosts ? (
                  <div className="flex items-center justify-center min-h-[200px]">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="mr-2">جاري تحميل المقالات...</span>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredPosts.length === 0 ? (
                      <div className="text-center py-12">
                        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">
                          لا توجد مقالات في هذه الفئة{searchTerm ? " تطابق معايير البحث" : ""}
                        </p>
                      </div>
                    ) : (
                      filteredPosts.map((post: BlogPost) => (
                        <Card key={post.id} className="overflow-hidden">
                          {post.featuredImage && (
                            <div className="w-full h-[200px] overflow-hidden">
                              <img
                                src={post.featuredImage}
                                alt={post.title}
                                className="w-full h-full object-cover transition-transform hover:scale-105"
                              />
                            </div>
                          )}
                          
                          <CardHeader>
                            <CardTitle className="text-2xl cursor-pointer hover:text-primary transition-colors" onClick={() => goToPost(post.slug)}>
                              {post.title}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-4 text-sm">
                              <div className="flex items-center">
                                <Calendar className="ml-1 h-4 w-4" />
                                {formatDate(post.createdAt)}
                              </div>
                              <div className="flex items-center">
                                <Eye className="ml-1 h-4 w-4" />
                                {post.views} مشاهدة
                              </div>
                            </CardDescription>
                          </CardHeader>
                          
                          <CardContent>
                            {post.excerpt && (
                              <p className="text-muted-foreground mb-4">
                                {post.excerpt}
                              </p>
                            )}
                            
                            {post.tags && (
                              <div className="flex flex-wrap gap-2 mb-4">
                                <div className="flex items-center text-sm text-muted-foreground ml-2">
                                  <Tag className="ml-1 h-3 w-3" />
                                  الوسوم:
                                </div>
                                {post.tags.split(',').map((tag, index) => (
                                  <Badge key={index} variant="outline">
                                    {tag.trim()}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </CardContent>
                          
                          <CardFooter>
                            <Button variant="link" className="p-0" onClick={() => goToPost(post.slug)}>
                              قراءة المزيد
                              <ArrowRight className="mr-2 h-4 w-4" />
                            </Button>
                          </CardFooter>
                        </Card>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="md:col-span-4 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>فئات المدونة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {categories?.map((cat: BlogCategory) => (
                    <Button
                      key={cat.id}
                      variant={category?.id === cat.id ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => goToCategory(cat.slug)}
                    >
                      {cat.name}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <h1 className="text-3xl font-bold mb-6">لم يتم العثور على الفئة</h1>
            <p className="text-muted-foreground mb-8">
              الفئة التي تبحث عنها غير موجودة أو تم حذفها
            </p>
          </div>
        )}
      </div>
    </>
  );
}