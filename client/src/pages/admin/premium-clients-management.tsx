import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Trash2, PenLine, Plus, ImagePlus } from "lucide-react";
import { Helmet } from "react-helmet";
import { Redirect } from "wouter";

type PremiumClient = {
  id: number;
  name: string;
  description: string;
  logo: string;
  category: string;
  website?: string;
  featured?: boolean;
  active?: boolean;
  benefits?: string[];
  createdAt: string;
  updatedAt: string;
};

type PremiumClientFormData = Omit<PremiumClient, "id" | "createdAt" | "updatedAt">;

const PremiumClientsManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<PremiumClient | null>(null);
  const [formData, setFormData] = useState<PremiumClientFormData>({
    name: "",
    description: "",
    logo: "",
    category: "تكنولوجيا",
    website: "",
    featured: false,
    active: true,
    benefits: [],
  });

  // الاستعلام لجلب عملاء التميز
  const {
    data: clients,
    isLoading: isLoadingClients,
    error: clientsError,
  } = useQuery({
    queryKey: ["/api/premium-clients"],
  });

  // طلب إضافة عميل جديد
  const addClientMutation = useMutation({
    mutationFn: async (newClient: PremiumClientFormData) => {
      const response = await apiRequest("POST", "/api/premium-clients", newClient);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "فشل في إضافة العميل");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/premium-clients"] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "تمت الإضافة بنجاح",
        description: "تم إضافة العميل المميز بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في الإضافة",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // طلب تحديث عميل موجود
  const updateClientMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: PremiumClientFormData;
    }) => {
      const response = await apiRequest("PUT", `/api/premium-clients/${id}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "فشل في تحديث العميل");
      }
      return await response.json();
    },
    onSuccess: (data) => {
      // إعادة تحميل البيانات بشكل صريح
      queryClient.invalidateQueries({ queryKey: ["/api/premium-clients"] });
      
      // تحديث البيانات مباشرة في حالة التخزين المؤقت
      queryClient.setQueryData(["/api/premium-clients"], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((client: PremiumClient) => 
          client.id === data.id ? data : client
        );
      });
      
      setIsEditDialogOpen(false);
      setSelectedClient(null);
      resetForm();
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث بيانات العميل المميز بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في التحديث",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // طلب حذف عميل
  const deleteClientMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/premium-clients/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "فشل في حذف العميل");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/premium-clients"] });
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف العميل المميز بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في الحذف",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // معالجة التغييرات في النموذج
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({ ...formData, [name]: checked });
  };

  // إعادة ضبط النموذج
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      logo: "",
      category: "تكنولوجيا",
      website: "",
      featured: false,
      active: true,
      benefits: [],
    });
  };

  // إرسال نموذج الإضافة
  const handleAddSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    addClientMutation.mutate(formData);
  };

  // إرسال نموذج التحديث
  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedClient) {
      updateClientMutation.mutate({
        id: selectedClient.id,
        data: formData,
      });
    }
  };

  // تعبئة بيانات النموذج للتحرير
  const handleEditClient = (client: PremiumClient) => {
    setSelectedClient(client);
    setFormData({
      name: client.name,
      description: client.description,
      logo: client.logo,
      category: client.category,
      website: client.website || "",
      featured: client.featured || false,
      active: client.active !== false, // true by default
      benefits: client.benefits || [],
    });
    setIsEditDialogOpen(true);
  };

  // حذف عميل بعد تأكيد المستخدم
  const handleDeleteClient = (client: PremiumClient) => {
    if (confirm(`هل أنت متأكد من حذف العميل: ${client.name}؟`)) {
      deleteClientMutation.mutate(client.id);
    }
  };

  // التحقق من دور المستخدم من خلال خادم التفويض
  const { data: authData, isLoading: isAuthLoading } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  if (isAuthLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // إعادة توجيه إذا لم يكن المستخدم مسؤولاً
  if (!isAuthLoading && (!authData || authData?.user?.role !== "admin")) {
    return <Redirect to="/" />;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Helmet>
        <title>إدارة عملاء التميز | لينكتك</title>
      </Helmet>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">إدارة عملاء التميز</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="ml-2 h-4 w-4" /> إضافة عميل مميز جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>إضافة عميل مميز جديد</DialogTitle>
              <DialogDescription>
                أدخل بيانات العميل المميز الجديد هنا. اضغط على حفظ عندما تنتهي.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">اسم العميل</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="اسم العميل أو المؤسسة"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">وصف</Label>
                  <Textarea
                    id="description"
                    name="description"
                    required
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="وصف مختصر للعميل"
                    rows={3}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="logo">رابط الشعار</Label>
                  <Input
                    id="logo"
                    name="logo"
                    required
                    value={formData.logo}
                    onChange={handleInputChange}
                    placeholder="رابط URL لشعار العميل"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">الفئة</Label>
                  <select
                    id="category"
                    name="category"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.category}
                    onChange={handleInputChange}
                  >
                    <option value="تكنولوجيا">تكنولوجيا</option>
                    <option value="تعليم">تعليم</option>
                    <option value="صحة">صحة</option>
                    <option value="تمويل">تمويل</option>
                    <option value="ترفيه">ترفيه</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="website">الموقع الإلكتروني (اختياري)</Label>
                  <Input
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="featured"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="featured">عرض بشكل مميز</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="active"
                    name="active"
                    checked={formData.active}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="active">نشط حاليًا</Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={addClientMutation.isPending}
                  className="w-full"
                >
                  {addClientMutation.isPending ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" /> جاري الإضافة...
                    </>
                  ) : (
                    "إضافة"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoadingClients ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : clientsError ? (
        <div className="text-center py-12 text-red-500">
          <p>عذراً، حدث خطأ أثناء تحميل بيانات العملاء المميزين</p>
        </div>
      ) : clients && clients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client: PremiumClient) => (
            <Card key={client.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{client.name}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditClient(client)}
                      title="تعديل"
                    >
                      <PenLine className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClient(client)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      title="حذف"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>{client.category}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex justify-center">
                  <img
                    src={client.logo}
                    alt={client.name}
                    className="h-16 w-auto object-contain"
                  />
                </div>
                <p className="text-sm text-gray-600 line-clamp-3">{client.description}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {client.featured && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded">
                      مميز
                    </span>
                  )}
                  {client.active === false && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                      غير نشط
                    </span>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                {client.website && (
                  <a
                    href={client.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    {client.website}
                  </a>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-medium mb-2">لا يوجد عملاء مميزين حالياً</h3>
          <p className="text-gray-500 mb-4">قم بإضافة عملاء مميزين باستخدام الزر أعلاه</p>
        </div>
      )}

      {/* نافذة تعديل العميل */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل العميل المميز</DialogTitle>
            <DialogDescription>
              قم بتعديل بيانات العميل المميز. اضغط على حفظ عندما تنتهي.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">اسم العميل</Label>
                <Input
                  id="edit-name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="اسم الشركة أو المؤسسة"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">وصف</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  required
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="وصف مختصر للعميل"
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-logo">رابط الشعار</Label>
                <Input
                  id="edit-logo"
                  name="logo"
                  required
                  value={formData.logo}
                  onChange={handleInputChange}
                  placeholder="رابط URL لشعار العميل"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-category">الفئة</Label>
                <select
                  id="edit-category"
                  name="category"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.category}
                  onChange={handleInputChange}
                >
                  <option value="تكنولوجيا">تكنولوجيا</option>
                  <option value="تعليم">تعليم</option>
                  <option value="صحة">صحة</option>
                  <option value="تمويل">تمويل</option>
                  <option value="ترفيه">ترفيه</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-website">الموقع الإلكتروني (اختياري)</Label>
                <Input
                  id="edit-website"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-featured"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="edit-featured">مميز</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-active"
                  name="active"
                  checked={formData.active}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="edit-active">نشط</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={updateClientMutation.isPending}
                className="w-full"
              >
                {updateClientMutation.isPending ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" /> جاري التحديث...
                  </>
                ) : (
                  "حفظ التغييرات"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PremiumClientsManagement;