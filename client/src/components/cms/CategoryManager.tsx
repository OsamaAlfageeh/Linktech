import { useState } from 'react';
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
import { Loader2, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// تعريف مخطط التحقق من مدخلات فئة المدونة
const categorySchema = z.object({
  name: z.string().min(2, { message: 'اسم الفئة يجب أن يحتوي على حرفين على الأقل' }),
  slug: z.string().min(2, { message: 'الرابط المخصص يجب أن يحتوي على حرفين على الأقل' })
    .regex(/^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\w-]+$/, { message: 'الرابط المخصص يجب أن يحتوي فقط على أحرف عربية أو إنجليزية وأرقام وشرطات' }),
  description: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryManagerProps {
  onSuccess?: () => void;
}

/**
 * مكون إدارة فئات المدونة
 * يتيح إنشاء وتحرير وحذف فئات المدونة
 * 
 * @param onSuccess دالة يتم استدعاؤها بعد الحفظ بنجاح
 */
export default function CategoryManager({ onSuccess }: CategoryManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);

  // استعلام لجلب فئات المدونة
  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ['/api/blog/categories'],
  });

  // إعداد نموذج البيانات
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
    },
  });

  // mutation لإنشاء أو تحديث الفئة
  const mutation = useMutation({
    mutationFn: async (data: CategoryFormValues) => {
      const url = editingCategoryId 
        ? `/api/blog/categories/${editingCategoryId}` 
        : '/api/blog/categories';
      const method = editingCategoryId ? 'PATCH' : 'POST';
      
      const res = await apiRequest(method, url, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: editingCategoryId ? 'تم تحديث الفئة بنجاح' : 'تم إنشاء الفئة بنجاح',
        description: editingCategoryId 
          ? 'تم تحديث بيانات الفئة في قاعدة البيانات' 
          : 'تم إضافة الفئة إلى قاعدة البيانات',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/blog/categories'] });
      form.reset();
      setIsDialogOpen(false);
      setEditingCategoryId(null);
      
      // إرسال إشعار تحديث sitemap إلى محركات البحث
      apiRequest('POST', '/api/sitemap/ping', {}).catch(err => {
        console.error('فشل إرسال إشعار تحديث sitemap:', err);
      });
      
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ في حفظ الفئة',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // mutation لحذف الفئة
  const deleteMutation = useMutation({
    mutationFn: async (categoryId: number) => {
      const res = await apiRequest('DELETE', `/api/blog/categories/${categoryId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'تم حذف الفئة بنجاح',
        description: 'تم حذف الفئة من قاعدة البيانات',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/blog/categories'] });
      setDeletingCategoryId(null);
      
      // إرسال إشعار تحديث sitemap إلى محركات البحث
      apiRequest('POST', '/api/sitemap/ping', {}).catch(err => {
        console.error('فشل إرسال إشعار تحديث sitemap:', err);
      });
      
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ في حذف الفئة',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // إعداد بيانات الفئة للتحرير
  const editCategory = (category: any) => {
    form.reset({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
    });
    setEditingCategoryId(category.id);
    setIsDialogOpen(true);
  };

  // بدء عملية حذف فئة
  const initiateDeleteCategory = (categoryId: number) => {
    setDeletingCategoryId(categoryId);
  };

  // إرسال نموذج إنشاء/تحرير الفئة
  const onSubmit = (data: CategoryFormValues) => {
    mutation.mutate(data);
  };

  // ضبط الرابط المخصص (slug) تلقائيًا من الاسم
  const generateSlug = () => {
    const name = form.watch('name');
    if (name) {
      // التعامل مع الأحرف العربية وأحرف أخرى
      const slug = name
        .replace(/\s+/g, '-')
        .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
      form.setValue('slug', slug);
    }
  };

  if (loadingCategories) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="mr-2">جاري تحميل الفئات...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>إدارة فئات المدونة</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                form.reset({
                  name: '',
                  slug: '',
                  description: '',
                });
                setEditingCategoryId(null);
              }}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة فئة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCategoryId ? 'تحرير فئة' : 'إضافة فئة جديدة'}
                </DialogTitle>
                <DialogDescription>
                  {editingCategoryId 
                    ? 'قم بتحرير تفاصيل الفئة واضغط حفظ عند الانتهاء'
                    : 'أدخل تفاصيل الفئة الجديدة واضغط إضافة عند الانتهاء'
                  }
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم الفئة</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="اسم الفئة"
                            {...field}
                            onBlur={() => {
                              if (!editingCategoryId && !form.getValues('slug')) {
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
                              placeholder="الرابط-المخصص" 
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
                          سيظهر في الرابط: /blog/category/{field.value}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>وصف الفئة</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="وصف الفئة (اختياري)"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={mutation.isPending}
                      className="gap-1"
                    >
                      {mutation.isPending && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      {editingCategoryId ? 'حفظ التغييرات' : 'إضافة الفئة'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {categories?.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              لا توجد فئات بعد. قم بإضافة فئة جديدة لبدء تنظيم المدونة.
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>الرابط المخصص</TableHead>
                    <TableHead>عدد المقالات</TableHead>
                    <TableHead className="text-left">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories?.map((category: any) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>/blog/category/{category.slug}</TableCell>
                      <TableCell>{category.postsCount || 0}</TableCell>
                      <TableCell className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => editCategory(category)}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">تحرير</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => initiateDeleteCategory(category.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">حذف</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>هل أنت متأكد من حذف هذه الفئة؟</AlertDialogTitle>
                              <AlertDialogDescription>
                                سيتم حذف الفئة "{category.name}" نهائيًا. هذا الإجراء لا يمكن التراجع عنه.
                                {category.postsCount > 0 && (
                                  <div className="mt-2 text-red-500 font-semibold">
                                    تحذير: هذه الفئة تحتوي على {category.postsCount} مقال/مقالات. حذف الفئة قد يؤثر على تصنيف هذه المقالات.
                                  </div>
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => deleteMutation.mutate(category.id)}
                              >
                                {deleteMutation.isPending && deletingCategoryId === category.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  'نعم، أريد الحذف'
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}