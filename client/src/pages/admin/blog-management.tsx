import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BlogEditor from '@/components/cms/BlogEditor';
import CategoryManager from '@/components/cms/CategoryManager';
import BlogMigration from '@/components/admin/BlogMigration';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/App';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet';
import { Loader2, FileText, FolderTree, Settings, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

/**
 * صفحة إدارة المدونة
 * تتيح للمسؤولين إدارة فئات المدونة وإنشاء وتحرير المقالات
 */
export default function BlogManagement() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('posts');
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  
  // وظيفة تمرير الصفحة إلى الأعلى
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // استعلام لجلب مقالات المدونة
  const { data: posts, isLoading: loadingPosts, refetch: refetchPosts } = useQuery({
    queryKey: ['/api/blog/posts/all'],
  });

  // Ya no necesitamos el navigate porque ProtectedRoute maneja la autenticación
  const [_] = useLocation();
  
  // لا نحتاج إلى التحقق من الصلاحيات هنا، فقد تم التحقق من خلال مكون ProtectedRoute
  
  // تمرير الصفحة إلى الأعلى عند تغيير التبويب
  useEffect(() => {
    scrollToTop();
  }, [activeTab]);

  // إرسال إشعار تحديث sitemap إلى محركات البحث
  const handlePingSitemap = async () => {
    try {
      const res = await fetch('/api/sitemap/ping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      
      if (data.success) {
        toast({
          title: 'تم إرسال الإشعار بنجاح',
          description: 'تم إرسال إشعار تحديث خريطة الموقع إلى محركات البحث بنجاح',
        });
      } else {
        throw new Error(data.message || 'حدث خطأ أثناء إرسال الإشعار');
      }
    } catch (error: any) {
      toast({
        title: 'فشل إرسال الإشعار',
        description: error.message || 'حدث خطأ غير معروف',
        variant: 'destructive',
      });
    }
  };

  // حالة التحميل
  if (loadingPosts) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="mr-2">جاري تحميل البيانات...</span>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>إدارة المدونة | لوحة التحكم</title>
      </Helmet>
      <div className="container mx-auto p-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">إدارة المدونة</h1>
            <p className="text-muted-foreground mt-1">
              إدارة محتوى المدونة وتحسين محركات البحث
            </p>
          </div>
          <Button onClick={handlePingSitemap}>
            إرسال إشعار تحديث sitemap لمحركات البحث
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full justify-start border-b rounded-none px-0 h-auto">
            <TabsTrigger
              value="posts"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2"
            >
              <FileText className="h-5 w-5 ml-2" />
              المقالات
            </TabsTrigger>
            <TabsTrigger
              value="categories"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2"
            >
              <FolderTree className="h-5 w-5 ml-2" />
              الفئات
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2"
            >
              <Settings className="h-5 w-5 ml-2" />
              إعدادات SEO
            </TabsTrigger>
            <TabsTrigger
              value="migration"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2"
            >
              <Database className="h-5 w-5 ml-2" />
              استيراد البيانات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-6">
            {editingPostId ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">تحرير المقال</h2>
                  <Button
                    variant="outline"
                    onClick={() => setEditingPostId(null)}
                  >
                    العودة إلى قائمة المقالات
                  </Button>
                </div>
                <BlogEditor
                  postId={editingPostId}
                  onSuccess={() => {
                    setEditingPostId(null);
                    refetchPosts();
                  }}
                />
              </>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">مقالات المدونة</h2>
                  <Button
                    onClick={() => {
                      setActiveTab('new-post'); 
                      scrollToTop();
                    }}
                  >
                    إضافة مقال جديد
                  </Button>
                </div>
                {posts?.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <div className="text-muted-foreground mb-4">
                        لا توجد مقالات في المدونة حتى الآن
                      </div>
                      <Button onClick={() => {
                        setActiveTab('new-post');
                        scrollToTop();
                      }}>
                        إضافة أول مقال
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts?.map((post: any) => (
                      <Card key={post.id} className="overflow-hidden flex flex-col">
                        {post.featuredImage && (
                          <div className="h-40 w-full overflow-hidden">
                            <img
                              src={post.featuredImage}
                              alt={post.title}
                              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                            />
                          </div>
                        )}
                        <CardHeader>
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className={`text-xs font-medium px-2.5 py-0.5 rounded ${
                                post.status === 'published'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {post.status === 'published' ? 'منشور' : 'مسودة'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(post.createdAt).toLocaleDateString('ar-SA')}
                            </span>
                          </div>
                          <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                          <CardDescription className="line-clamp-3">
                            {post.excerpt}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0 mt-auto">
                          <div className="flex justify-end space-x-2 space-x-reverse">
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <a
                                href={`/blog/${post.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                معاينة
                              </a>
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setEditingPostId(post.id);
                                scrollToTop();
                              }}
                            >
                              تحرير
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="new-post">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">إضافة مقال جديد</h2>
              <Button
                variant="outline"
                onClick={() => setActiveTab('posts')}
              >
                إلغاء
              </Button>
            </div>
            <BlogEditor
              onSuccess={() => {
                setActiveTab('posts');
                refetchPosts();
              }}
            />
          </TabsContent>

          <TabsContent value="categories">
            <CategoryManager
              onSuccess={() => {
                refetchPosts();
              }}
            />
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات تحسين محركات البحث (SEO)</CardTitle>
                <CardDescription>
                  إعدادات تحسين محركات البحث الخاصة بالمدونة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">خريطة الموقع</h3>
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          asChild
                        >
                          <a
                            href="/sitemap.xml"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            معاينة خريطة الموقع
                          </a>
                        </Button>
                        <Button onClick={handlePingSitemap}>
                          إرسال إشعار التحديث
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        يتم إنشاء خريطة الموقع تلقائيًا وتحديثها عند إضافة محتوى جديد.
                        يمكنك إرسال إشعار تحديث لمحركات البحث يدويًا.
                      </p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">ملف robots.txt</h3>
                      <Button
                        variant="outline"
                        asChild
                      >
                        <a
                          href="/robots.txt"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          معاينة ملف robots.txt
                        </a>
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        يتم تكوين ملف robots.txt تلقائيًا لمنع فهرسة المناطق الخاصة من الموقع
                        مثل صفحات المشاريع ولوحات التحكم.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="migration">
            <BlogMigration />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}