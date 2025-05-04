import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import { Helmet } from 'react-helmet';
import { 
  Card,
  CardContent,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowRight,
  Calendar, 
  User, 
  Tag, 
  Loader2, 
  Eye, 
  Clock, 
  ArrowLeft,
  MessageCircle,
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  ChevronLeft
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../../App";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BlogPost, BlogComment, BlogCategory } from '@shared/schema';

/**
 * صفحة عرض مقال واحد مع التعليقات
 */
export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('comments');
  
  // استعلام لجلب المقال
  const { 
    data: post, 
    isLoading: loadingPost,
    isError: postError,
    refetch: refetchPost
  } = useQuery({
    queryKey: ['/api/blog/posts/slug', slug],
    queryFn: () => 
      apiRequest('GET', `/api/blog/posts/slug/${slug}`)
        .then(res => res.json()),
  });
  
  // استعلام لجلب فئات المدونة
  const { data: categories } = useQuery({
    queryKey: ['/api/blog/categories'],
  });
  
  // استعلام لجلب تعليقات المقال
  const { 
    data: comments, 
    isLoading: loadingComments,
    refetch: refetchComments
  } = useQuery({
    queryKey: ['/api/blog/posts', post?.id, 'comments'],
    queryFn: () => {
      if (!post?.id) return [];
      
      return apiRequest('GET', `/api/blog/posts/${post.id}/comments`)
        .then(res => res.json());
    },
    enabled: !!post?.id,
  });
  
  // مخطط تحقق من صحة التعليق
  const commentSchema = z.object({
    content: z.string().min(3, { 
      message: "التعليق يجب أن يحتوي على الأقل 3 أحرف" 
    }).max(500, { 
      message: "التعليق يجب ألا يتجاوز 500 حرف" 
    }),
  });
  
  // نموذج التعليق
  const form = useForm<z.infer<typeof commentSchema>>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: '',
    },
  });
  
  // تقديم التعليق
  const onSubmitComment = async (values: z.infer<typeof commentSchema>) => {
    if (!post?.id) return;
    
    try {
      await apiRequest('POST', '/api/blog/comments', {
        postId: post.id,
        content: values.content,
      });
      
      toast({
        title: "تم إضافة التعليق بنجاح",
        description: "سيظهر تعليقك بعد مراجعته من قبل المسؤولين",
      });
      
      form.reset();
      refetchComments();
    } catch (error) {
      toast({
        title: "فشل إضافة التعليق",
        description: "حدث خطأ أثناء إضافة التعليق. يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    }
  };
  
  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // العودة إلى صفحة المدونة
  const goBack = () => {
    navigate('/blog');
  };
  
  // التوجه إلى صفحة الفئة
  const goToCategory = (categoryId: number) => {
    navigate(`/blog?category=${categoryId}`);
  };
  
  // فلترة التعليقات المعتمدة فقط
  const approvedComments = comments?.filter((comment: BlogComment) => 
    comment.status === 'approved'
  ) || [];
  
  // الحصول على اسم الفئة
  const getCategoryName = (categoryId: number) => {
    return categories?.find((c: BlogCategory) => c.id === categoryId)?.name || 'عام';
  };
  
  // إذا كان هناك خطأ في تحميل المقال
  if (postError) {
    return (
      <div className="container mx-auto py-20 text-center">
        <h1 className="text-4xl font-bold mb-6">لم يتم العثور على المقال</h1>
        <p className="text-muted-foreground mb-8">
          المقال الذي تبحث عنه غير موجود أو تم حذفه
        </p>
        <Button onClick={goBack}>
          <ArrowRight className="ml-2 h-4 w-4" />
          العودة إلى المدونة
        </Button>
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>{post?.title ? `${post.title} | لينكتك` : "تحميل المقال..."}</title>
        {post?.seoDescription && (
          <meta name="description" content={post.seoDescription} />
        )}
        {post?.seoKeywords && (
          <meta name="keywords" content={post.seoKeywords} />
        )}
        {post && (
          <meta property="og:title" content={post.title} />
        )}
        {post?.seoDescription && (
          <meta property="og:description" content={post.seoDescription} />
        )}
        {post?.featuredImage && (
          <meta property="og:image" content={post.featuredImage} />
        )}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://linktech.app/blog/${slug}`} />
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
        
        {loadingPost ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="mr-2">جاري تحميل المقال...</span>
          </div>
        ) : post ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-8 space-y-6">
              {post.featuredImage && (
                <div className="w-full h-[300px] md:h-[400px] rounded-lg overflow-hidden mb-6">
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge 
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => post.categoryId && goToCategory(post.categoryId)}
                  >
                    {post.categoryId ? getCategoryName(post.categoryId) : 'عام'}
                  </Badge>
                  
                  {post.tags && post.tags.split(',').map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag.trim()}
                    </Badge>
                  ))}
                </div>
                
                <h1 className="text-3xl md:text-4xl font-bold mb-6">{post.title}</h1>
                
                <div className="flex items-center justify-between mb-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      <Calendar className="ml-1 h-4 w-4" />
                      {formatDate(post.createdAt)}
                    </div>
                    
                    <div className="flex items-center">
                      <Eye className="ml-1 h-4 w-4" />
                      {post.viewCount} مشاهدة
                    </div>
                  </div>
                </div>
                
                <div className="prose prose-lg max-w-none rtl" dangerouslySetInnerHTML={{ __html: post.content }} />
              </div>
              
              <Separator className="my-8" />
              
              <div>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-6">
                    <TabsTrigger value="comments">
                      التعليقات ({approvedComments.length})
                    </TabsTrigger>
                    <TabsTrigger value="share">
                      مشاركة المقال
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="comments">
                    <div className="space-y-8">
                      {isAuthenticated ? (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-xl">إضافة تعليق</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Form {...form}>
                              <form onSubmit={form.handleSubmit(onSubmitComment)} className="space-y-4">
                                <FormField
                                  control={form.control}
                                  name="content"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Textarea
                                          placeholder="اكتب تعليقك هنا..."
                                          className="min-h-[100px]"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <div className="flex justify-end">
                                  <Button type="submit" disabled={form.formState.isSubmitting}>
                                    {form.formState.isSubmitting ? (
                                      <>
                                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                        جاري الإرسال
                                      </>
                                    ) : (
                                      <>إرسال التعليق</>
                                    )}
                                  </Button>
                                </div>
                              </form>
                            </Form>
                          </CardContent>
                        </Card>
                      ) : (
                        <Card>
                          <CardContent className="pt-6">
                            <p className="text-center text-muted-foreground mb-4">
                              يجب تسجيل الدخول للتمكن من إضافة تعليق
                            </p>
                            <div className="flex justify-center">
                              <Button asChild>
                                <Link to="/auth/login">
                                  تسجيل الدخول
                                </Link>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      
                      {loadingComments ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : approvedComments.length === 0 ? (
                        <div className="text-center py-8">
                          <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                          <p className="text-muted-foreground">
                            لا توجد تعليقات على هذا المقال بعد. كن أول من يعلق!
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {approvedComments.map((comment: BlogComment) => (
                            <Card key={comment.id}>
                              <CardHeader className="pb-2">
                                <div className="flex items-start gap-4">
                                  <Avatar>
                                    <AvatarFallback>
                                      {comment.userName ? comment.userName.substring(0, 2).toUpperCase() : 'UN'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{comment.userName || "مستخدم"}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {formatDate(comment.createdAt)}
                                    </div>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="pt-2">
                                <p>{comment.content}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="share">
                    <Card>
                      <CardHeader>
                        <CardTitle>مشاركة المقال</CardTitle>
                        <CardDescription>
                          يمكنك مشاركة هذا المقال على مواقع التواصل الاجتماعي
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-4">
                          <Button
                            variant="outline"
                            className="flex items-center gap-2"
                            asChild
                          >
                            <a
                              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                                `https://linktech.app/blog/${slug}`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Facebook className="h-4 w-4" />
                              فيسبوك
                            </a>
                          </Button>
                          
                          <Button
                            variant="outline"
                            className="flex items-center gap-2"
                            asChild
                          >
                            <a
                              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                                post.title
                              )}&url=${encodeURIComponent(
                                `https://linktech.app/blog/${slug}`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Twitter className="h-4 w-4" />
                              تويتر
                            </a>
                          </Button>
                          
                          <Button
                            variant="outline"
                            className="flex items-center gap-2"
                            asChild
                          >
                            <a
                              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                                `https://linktech.app/blog/${slug}`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Linkedin className="h-4 w-4" />
                              لينكد إن
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            
            <div className="md:col-span-4 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>مقالات ذات صلة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingPost ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">
                        جاري تطوير هذه الميزة...
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {categories && categories.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>فئات المدونة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((category: BlogCategory) => (
                        <Badge
                          key={category.id}
                          variant={post.categoryId === category.id ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => goToCategory(category.id)}
                        >
                          {category.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}