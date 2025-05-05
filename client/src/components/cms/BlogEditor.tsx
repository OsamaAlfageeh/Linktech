import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save, Eye, Image, Trash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

// تعريف مخطط التحقق من مدخلات المدونة
const blogPostSchema = z.object({
  title: z.string().min(5, { message: 'عنوان المقال يجب أن يحتوي على 5 أحرف على الأقل' }),
  slug: z.string().min(3, { message: 'الرابط المخصص يجب أن يحتوي على 3 أحرف على الأقل' })
    .regex(/^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\w-]+$/, { message: 'الرابط المخصص يجب أن يحتوي فقط على أحرف عربية أو إنجليزية وأرقام وشرطات' }),
  excerpt: z.string().min(10, { message: 'ملخص المقال يجب أن يحتوي على 10 أحرف على الأقل' }),
  content: z.string().min(50, { message: 'محتوى المقال يجب أن يحتوي على 50 حرفًا على الأقل' }),
  categoryId: z.string().min(1, { message: 'اختر فئة للمقال' }),
  featuredImage: z.string().optional(),
  tags: z.string().optional(),
  status: z.enum(['draft', 'published']),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
});

type BlogPostFormValues = z.infer<typeof blogPostSchema>;

interface BlogEditorProps {
  postId?: number;
  onSuccess?: () => void;
}

/**
 * مكون محرر المدونة
 * يتيح إنشاء وتحرير مقالات المدونة مع معاينة مباشرة
 * 
 * @param postId معرف المقال (اختياري - للتحرير)
 * @param onSuccess دالة يتم استدعاؤها بعد الحفظ بنجاح
 */
export default function BlogEditor({ postId, onSuccess }: BlogEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('edit');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // استعلام لجلب فئات المدونة
  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ['/api/blog/categories'],
  });

  // استعلام لجلب تفاصيل المقال (في حالة التحرير)
  const { data: post, isLoading: loadingPost } = useQuery({
    queryKey: [`/api/blog/posts/${postId}`],
    enabled: !!postId,
  });

  // إعداد نموذج البيانات
  const form = useForm<BlogPostFormValues>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      categoryId: '',
      featuredImage: '',
      tags: '',
      status: 'draft',
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
    },
  });

  // mutation لإنشاء أو تحديث المقال
  const mutation = useMutation({
    mutationFn: async (data: BlogPostFormValues) => {
      const url = postId 
        ? `/api/blog/posts/${postId}` 
        : '/api/blog/posts';
      const method = postId ? 'PATCH' : 'POST';
      
      const res = await apiRequest(method, url, {
        ...data,
        tags: tags.join(','),
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: postId ? 'تم تحديث المقال بنجاح' : 'تم إنشاء المقال بنجاح',
        description: postId 
          ? 'تم تحديث بيانات المقال في قاعدة البيانات' 
          : 'تم إضافة المقال إلى قاعدة البيانات',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/blog/posts'] });
      if (postId) {
        queryClient.invalidateQueries({ queryKey: [`/api/blog/posts/${postId}`] });
      }
      if (onSuccess) onSuccess();

      // إرسال إشعار تحديث sitemap إلى محركات البحث
      apiRequest('POST', '/api/sitemap/ping', {}).catch(err => {
        console.error('فشل إرسال إشعار تحديث sitemap:', err);
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ في حفظ المقال',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // تعبئة بيانات النموذج عند تحميل التفاصيل
  useEffect(() => {
    if (post) {
      form.reset({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        categoryId: post.categoryId.toString(),
        featuredImage: post.featuredImage || '',
        status: post.status as 'draft' | 'published',
        seoTitle: post.seoTitle || '',
        seoDescription: post.seoDescription || '',
        seoKeywords: post.seoKeywords || '',
      });
      
      // تعبئة الوسوم
      if (post.tags) {
        setTags(post.tags.split(',').map(tag => tag.trim()));
      }
    }
  }, [post, form]);

  // معالجة إرسال النموذج
  const onSubmit = (data: BlogPostFormValues) => {
    mutation.mutate(data);
  };

  // إضافة وسم جديد
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  // حذف وسم
  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  // ضبط الرابط المخصص (slug) تلقائيًا من العنوان
  const generateSlug = () => {
    const title = form.watch('title');
    if (title) {
      // تحويل الفراغات إلى شرطات والتأكد من أن الرابط صالح
      // نحتفظ بالأحرف العربية والإنجليزية والأرقام والشرطات فقط
      const slug = title
        .replace(/\s+/g, '-') // تحويل الفراغات إلى شرطات
        .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\w\-]+/g, '') // الاحتفاظ بالأحرف العربية والإنجليزية والأرقام والشرطات فقط
        .replace(/\-\-+/g, '-') // حذف الشرطات المتكررة
        .replace(/^-+/, '') // حذف الشرطات في بداية النص
        .replace(/-+$/, ''); // حذف الشرطات في نهاية النص
        
      form.setValue('slug', slug);
    }
  };

  // حالات التحميل
  if ((postId && loadingPost) || loadingCategories) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="mr-2">جاري تحميل البيانات...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Tabs defaultValue="edit" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {postId ? 'تحرير مقال' : 'إنشاء مقال جديد'}
          </h1>
          <TabsList>
            <TabsTrigger value="edit">تحرير</TabsTrigger>
            <TabsTrigger value="preview">معاينة</TabsTrigger>
            <TabsTrigger value="seo">تحسين SEO</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="edit">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>عنوان المقال</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="أدخل عنوان المقال"
                          {...field}
                          onBlur={() => {
                            if (!postId && !form.getValues('slug')) {
                              generateSlug();
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الرابط المخصص</FormLabel>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Input 
                            placeholder="الرابط-المخصص-للمقال" 
                            {...field} 
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={generateSlug}
                        >
                          إنشاء
                        </Button>
                      </div>
                      <FormDescription>
                        سيظهر في الرابط: /blog/{field.value}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="excerpt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ملخص المقال</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="اكتب ملخصاً قصيراً للمقال (سيظهر في صفحة قائمة المقالات)"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>محتوى المقال</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="اكتب محتوى المقال الكامل هنا"
                        rows={15}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      يمكنك استخدام وسوم HTML لتنسيق النص
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الفئة</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر فئة المقال" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories?.map((category: any) => (
                              <SelectItem
                                key={category.id}
                                value={category.id.toString()}
                              >
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>حالة النشر</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر حالة النشر" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">مسودة</SelectItem>
                            <SelectItem value="published">منشور</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="featuredImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>صورة المقال الرئيسية</FormLabel>
                    <FormControl>
                      <div className="flex items-start gap-2">
                        <Input
                          placeholder="رابط صورة المقال الرئيسية"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="flex-shrink-0"
                        >
                          <Image className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormControl>
                    {field.value && (
                      <div className="mt-2 border rounded-md overflow-hidden max-w-xs">
                        <img
                          src={field.value}
                          alt="صورة المقال الرئيسية"
                          className="max-w-full h-auto"
                        />
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>الوسوم</FormLabel>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex gap-1 items-center">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Trash className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="أضف وسمًا جديدًا"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addTag}
                    className="flex-shrink-0"
                  >
                    إضافة
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab('preview')}
                >
                  <Eye className="h-4 w-4 ml-2" />
                  معاينة
                </Button>
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  className="gap-1"
                >
                  {mutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  <Save className="h-4 w-4 ml-2" />
                  حفظ المقال
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-lg max-w-none border-b pb-6 mb-6">
                <h1 className="text-3xl font-bold">{form.watch('title') || 'عنوان المقال'}</h1>
                <div className="flex flex-wrap gap-2 mb-4">
                  {tags.length > 0 ? (
                    tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-sm">لا توجد وسوم</span>
                  )}
                </div>
                {form.watch('featuredImage') && (
                  <img
                    src={form.watch('featuredImage')}
                    alt={form.watch('title')}
                    className="w-full h-auto rounded-lg mb-6"
                  />
                )}
                <div className="mb-6 italic text-muted-foreground">
                  {form.watch('excerpt') || 'ملخص المقال سيظهر هنا'}
                </div>
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: form.watch('content') || '<p>محتوى المقال سيظهر هنا</p>' 
                  }}
                />
              </div>
              <div className="flex justify-end">
                <Button type="button" onClick={() => setActiveTab('edit')}>
                  العودة للتحرير
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card>
            <CardContent className="pt-6">
              <Form {...form}>
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="seoTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>عنوان SEO</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="عنوان الصفحة لمحركات البحث (50-60 حرف)"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {field.value?.length || 0}/60 حرف
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="seoDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>وصف SEO</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="وصف الصفحة لمحركات البحث (120-160 حرف)"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {field.value?.length || 0}/160 حرف
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="seoKeywords"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>كلمات مفتاحية SEO</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="كلمات مفتاحية مفصولة بفواصل"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          مثال: لينكتك, مدونة تقنية, تطوير مواقع
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Alert className="bg-muted/50">
                    <AlertDescription>
                      معاينة ظهور المقال في نتائج بحث جوجل:
                      <div className="mt-2 p-4 border rounded-md">
                        <div className="text-blue-600 text-lg font-medium">
                          {form.watch('seoTitle') || form.watch('title') || 'عنوان المقال'} | لينكتك
                        </div>
                        <div className="text-green-700 text-sm">
                          linktech.app/blog/{form.watch('slug') || 'رابط-المقال'}
                        </div>
                        <div className="text-gray-700 text-sm mt-1">
                          {form.watch('seoDescription') || form.watch('excerpt') || 'وصف المقال سيظهر هنا...'}
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={() => {
                        form.trigger(['seoTitle', 'seoDescription', 'seoKeywords']);
                        setActiveTab('edit');
                      }}
                    >
                      تأكيد وحفظ
                    </Button>
                  </div>
                </div>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}