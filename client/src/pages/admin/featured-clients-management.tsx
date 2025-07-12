import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Eye, Globe, Image } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

// تعريف نوع العميل المميز
interface FeaturedClient {
  id: number;
  name: string;
  logo: string;
  website?: string;
  description?: string;
  category?: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// مخطط التحقق من صحة البيانات
const featuredClientSchema = z.object({
  name: z.string().min(1, 'اسم العميل مطلوب'),
  logo: z.string().url('رابط الشعار يجب أن يكون صالحاً'),
  website: z.string().url('رابط الموقع يجب أن يكون صالحاً').optional().or(z.literal('')),
  description: z.string().optional(),
  category: z.string().optional(),
  order: z.number().min(0).default(0),
  active: z.boolean().default(true),
});

type FeaturedClientFormData = z.infer<typeof featuredClientSchema>;

const FeaturedClientsManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<FeaturedClient | null>(null);

  // استرجاع العملاء المميزين
  const { data: clients = [], isLoading, error } = useQuery<FeaturedClient[]>({
    queryKey: ['/api/admin/featured-clients'],
    refetchOnWindowFocus: false,
  });

  // نموذج إضافة/تحديث عميل
  const form = useForm<FeaturedClientFormData>({
    resolver: zodResolver(featuredClientSchema),
    defaultValues: {
      name: '',
      logo: '',
      website: '',
      description: '',
      category: '',
      order: 0,
      active: true,
    },
  });

  // طفرة إضافة عميل جديد
  const createMutation = useMutation({
    mutationFn: (data: FeaturedClientFormData) => apiRequest('/api/admin/featured-clients', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/featured-clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/featured-clients'] });
      toast({
        title: 'تم بنجاح',
        description: 'تم إضافة العميل المميز بنجاح',
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء إضافة العميل',
        variant: 'destructive',
      });
    },
  });

  // طفرة تحديث عميل
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FeaturedClientFormData> }) => 
      apiRequest(`/api/admin/featured-clients/${id}`, 'PUT', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/featured-clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/featured-clients'] });
      toast({
        title: 'تم بنجاح',
        description: 'تم تحديث العميل المميز بنجاح',
      });
      setIsDialogOpen(false);
      setEditingClient(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء تحديث العميل',
        variant: 'destructive',
      });
    },
  });

  // طفرة حذف عميل
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/featured-clients/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/featured-clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/featured-clients'] });
      toast({
        title: 'تم بنجاح',
        description: 'تم حذف العميل المميز بنجاح',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء حذف العميل',
        variant: 'destructive',
      });
    },
  });

  // معالج إرسال النموذج
  const onSubmit = (data: FeaturedClientFormData) => {
    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // معالج تحديد عميل للتحديث
  const handleEdit = (client: FeaturedClient) => {
    setEditingClient(client);
    form.reset({
      name: client.name,
      logo: client.logo,
      website: client.website || '',
      description: client.description || '',
      category: client.category || '',
      order: client.order,
      active: client.active,
    });
    setIsDialogOpen(true);
  };

  // معالج حذف عميل
  const handleDelete = (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العميل المميز؟')) {
      deleteMutation.mutate(id);
    }
  };

  // معالج إغلاق النافذة المنبثقة
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingClient(null);
    form.reset();
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">حدث خطأ أثناء تحميل البيانات</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">إدارة العملاء المميزين</h1>
          <p className="text-gray-600">إدارة عملاء التميز الذين يظهرون في الصفحة الرئيسية</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingClient(null)}>
              <Plus className="w-4 h-4 mr-2" />
              إضافة عميل مميز
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingClient ? 'تحديث عميل مميز' : 'إضافة عميل مميز جديد'}
              </DialogTitle>
              <DialogDescription>
                {editingClient ? 'تحديث بيانات العميل المميز' : 'إضافة عميل مميز جديد لعرضه في الصفحة الرئيسية'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم العميل *</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: شركة الرياض للتقنية" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="logo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رابط الشعار *</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/logo.png" {...field} />
                      </FormControl>
                      <FormDescription>
                        رابط مباشر لصورة شعار العميل
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>موقع العميل</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>وصف العميل</FormLabel>
                      <FormControl>
                        <Textarea placeholder="وصف موجز عن العميل..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>فئة العميل</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: التقنية، الطب، التجارة" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ترتيب العرض</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        رقم الترتيب (0 = الأول)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">نشط</FormLabel>
                        <FormDescription>
                          عرض العميل في الصفحة الرئيسية
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    إلغاء
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingClient ? 'تحديث' : 'إضافة'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clients.map((client) => (
          <Card key={client.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {client.logo ? (
                      <img 
                        src={client.logo} 
                        alt={client.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Image className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{client.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant={client.active ? "default" : "secondary"}>
                        {client.active ? 'نشط' : 'غير نشط'}
                      </Badge>
                      {client.category && (
                        <Badge variant="outline">{client.category}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {client.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {client.description}
                </p>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {client.website && (
                    <a
                      href={client.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Globe className="w-4 h-4" />
                    </a>
                  )}
                  <span className="text-sm text-gray-500">
                    ترتيب: {client.order}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(client)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(client.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {clients.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">لا توجد عملاء مميزين حالياً</div>
          <p className="text-gray-400 mb-6">ابدأ بإضافة عملاء مميزين لعرضهم في الصفحة الرئيسية</p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            إضافة أول عميل مميز
          </Button>
        </div>
      )}
    </div>
  );
};

export default FeaturedClientsManagement;