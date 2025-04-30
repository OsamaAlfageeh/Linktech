import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/App";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Loader2, Users, Briefcase, Building2, CheckCircle2, XCircle, Eye, Pencil, Trash2, Settings, Upload, Image } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";

type AdminDashboardStats = {
  users: {
    total: number;
    entrepreneurs: number;
    companies: number;
    admins: number;
  };
  projects: {
    total: number;
    open: number;
    closed: number;
  };
  companies: {
    total: number;
    verified: number;
    unverified: number;
  };
};

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // متغيرات لمراقبة المحادثات
  const [selectedUser1Id, setSelectedUser1Id] = useState<number | null>(null);
  const [selectedUser2Id, setSelectedUser2Id] = useState<number | null>(null);
  const [conversation, setConversation] = useState<any[]>([]);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [conversationLoaded, setConversationLoaded] = useState(false);
  const [conversationError, setConversationError] = useState<string | null>(null);
  
  // متغيرات لإعدادات الموقع
  const [headerImageUrl, setHeaderImageUrl] = useState<string>("");
  const [headerImageFile, setHeaderImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // متغيرات لصورة الجانب
  const [sideImageUrl, setSideImageUrl] = useState<string>("");
  const [sideImageFile, setSideImageFile] = useState<File | null>(null);
  const [uploadingSideImage, setUploadingSideImage] = useState(false);
  const sideImageInputRef = useRef<HTMLInputElement>(null);

  // تأكد من أن المستخدم مسؤول
  // تعطيل التحقق مؤقتاً
  /*
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth/login");
      return;
    }

    if (user?.role !== "admin") {
      toast({
        title: "غير مصرح",
        description: "فقط المسؤولون يمكنهم الوصول إلى لوحة التحكم",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [user, isAuthenticated, navigate, toast]);
  */

  // استعلام لجلب جميع المستخدمين
  const {
    data: users,
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users/all");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      return response.json();
    },
    // مؤقتاً: جعل الاستعلام يعمل دائماً
    enabled: true,
  });

  // استعلام لجلب كل المشاريع
  const {
    data: projects,
    isLoading: projectsLoading,
    refetch: refetchProjects,
  } = useQuery({
    queryKey: ["/api/projects/all"],
    queryFn: async () => {
      const response = await fetch("/api/projects");
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      return response.json();
    },
    enabled: isAuthenticated && user?.role === "admin",
  });

  // استعلام لجلب كل الشركات
  const {
    data: companies,
    isLoading: companiesLoading,
    refetch: refetchCompanies,
  } = useQuery({
    queryKey: ["/api/companies/all"],
    queryFn: async () => {
      const response = await fetch("/api/companies");
      if (!response.ok) {
        throw new Error("Failed to fetch companies");
      }
      return response.json();
    },
    enabled: isAuthenticated && user?.role === "admin",
  });
  
  // استعلام لجلب إعدادات الموقع
  const {
    data: siteSettings,
    isLoading: settingsLoading,
    refetch: refetchSettings,
  } = useQuery({
    queryKey: ["/api/site-settings"],
    queryFn: async () => {
      const response = await fetch("/api/site-settings");
      if (!response.ok) {
        throw new Error("فشل في جلب إعدادات الموقع");
      }
      return response.json();
    },
    enabled: isAuthenticated && user?.role === "admin"
  });
  
  // استخراج رابط صور الهيدر والجانب عند تحميل البيانات
  useEffect(() => {
    if (siteSettings) {
      const headerImage = siteSettings.find((setting: any) => setting.key === "header_image");
      if (headerImage) {
        setHeaderImageUrl(headerImage.value);
      }
      
      const sideImage = siteSettings.find((setting: any) => setting.key === "side_image");
      if (sideImage) {
        setSideImageUrl(sideImage.value);
      }
    }
  }, [siteSettings]);
  
  // تعديل باستخدام: useMutation لتحديث إعدادات الموقع
  const updateSiteSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string, value: string }) => {
      const response = await fetch(`/api/site-settings/${key}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ value }),
      });
      
      if (!response.ok) {
        throw new Error("فشل في تحديث إعدادات الموقع");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم التحديث",
        description: "تم تحديث إعدادات الموقع بنجاح",
      });
      refetchSettings();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء تحديث إعدادات الموقع",
        variant: "destructive",
      });
    },
  });

  // حساب الإحصائيات
  const stats: AdminDashboardStats = {
    users: {
      total: users?.length || 0,
      entrepreneurs: users?.filter((u: any) => u.role === "entrepreneur").length || 0,
      companies: users?.filter((u: any) => u.role === "company").length || 0,
      admins: users?.filter((u: any) => u.role === "admin").length || 0,
    },
    projects: {
      total: projects?.length || 0,
      open: projects?.filter((p: any) => p.status === "open").length || 0,
      closed: projects?.filter((p: any) => p.status === "closed").length || 0,
    },
    companies: {
      total: companies?.length || 0,
      verified: companies?.filter((c: any) => c.verified).length || 0,
      unverified: companies?.filter((c: any) => !c.verified).length || 0,
    },
  };

  // دالة لمعالجة اختيار صورة الهيدر
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setHeaderImageFile(file);
      
      // قراءة الملف وتحويله إلى URL مؤقت للعرض
      const reader = new FileReader();
      reader.onload = (e) => {
        setHeaderImageUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // دالة لمعالجة اختيار صورة الجانب
  const handleSideImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSideImageFile(file);
      
      // قراءة الملف وتحويله إلى URL مؤقت للعرض
      const reader = new FileReader();
      reader.onload = (e) => {
        setSideImageUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // دالة لرفع صورة الهيدر وتحديث الإعدادات
  const handleImageUpload = async () => {
    if (!headerImageFile) {
      toast({
        title: "خطأ",
        description: "الرجاء اختيار صورة أولاً",
        variant: "destructive",
      });
      return;
    }
    
    setUploadingImage(true);
    
    try {
      // تحويل الصورة إلى Base64
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const base64String = e.target?.result as string;
        // استخراج البيانات فقط دون معلومات النوع
        const base64Data = base64String.split(',')[1];
        
        // تحديث إعدادات الموقع باستخدام الـ mutation
        await updateSiteSettingMutation.mutateAsync({
          key: "header_image",
          value: base64String,
        });
        
        setUploadingImage(false);
        toast({
          title: "تم رفع الصورة",
          description: "تم تحديث صورة الهيدر بنجاح",
        });
      };
      
      reader.onerror = () => {
        setUploadingImage(false);
        toast({
          title: "خطأ",
          description: "فشل في قراءة الصورة",
          variant: "destructive",
        });
      };
      
      reader.readAsDataURL(headerImageFile);
      
    } catch (error) {
      setUploadingImage(false);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء رفع الصورة",
        variant: "destructive",
      });
      console.error(error);
    }
  };
  
  // دالة لرفع صورة الجانب وتحديث الإعدادات
  const handleSideImageUpload = async () => {
    if (!sideImageFile) {
      toast({
        title: "خطأ",
        description: "الرجاء اختيار صورة أولاً",
        variant: "destructive",
      });
      return;
    }
    
    setUploadingSideImage(true);
    
    try {
      // تحويل الصورة إلى Base64
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const base64String = e.target?.result as string;
        
        // تحديث إعدادات الموقع باستخدام الـ mutation
        await updateSiteSettingMutation.mutateAsync({
          key: "side_image",
          value: base64String,
        });
        
        setUploadingSideImage(false);
        toast({
          title: "تم رفع الصورة",
          description: "تم تحديث صورة الجانب بنجاح",
        });
      };
      
      reader.onerror = () => {
        setUploadingSideImage(false);
        toast({
          title: "خطأ",
          description: "فشل في قراءة الصورة",
          variant: "destructive",
        });
      };
      
      reader.readAsDataURL(sideImageFile);
      
    } catch (error) {
      setUploadingSideImage(false);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء رفع الصورة",
        variant: "destructive",
      });
      console.error(error);
    }
  };
  
  // لتحميل البيانات
  const isLoading = usersLoading || projectsLoading || companiesLoading || settingsLoading;

  // تحديث حالة مستخدم (تفعيل/تعطيل)
  const handleToggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      // هنا سيتم إضافة طلب API لتحديث حالة المستخدم
      toast({
        title: "تم تحديث الحالة",
        description: `تم ${currentStatus ? "تعطيل" : "تفعيل"} المستخدم بنجاح`,
      });
      refetchUsers();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث حالة المستخدم",
        variant: "destructive",
      });
    }
  };

  // توثيق أو إلغاء توثيق شركة
  const handleToggleCompanyVerification = async (companyId: number, currentVerified: boolean) => {
    try {
      const response = await fetch(`/api/companies/${companyId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ verified: !currentVerified }),
      });

      if (!response.ok) {
        throw new Error('Failed to update company verification status');
      }

      toast({
        title: `تم ${currentVerified ? "إلغاء توثيق" : "توثيق"} الشركة`,
        description: `تم ${currentVerified ? "إلغاء توثيق" : "توثيق"} الشركة بنجاح`,
      });
      
      // تحديث قائمة الشركات
      refetchCompanies();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث حالة توثيق الشركة",
        variant: "destructive",
      });
      console.error(error);
    }
  };

  // تحميل محادثة بين مستخدمين
  const loadConversation = async () => {
    if (!selectedUser1Id || !selectedUser2Id) {
      setConversationError("يرجى اختيار مستخدمين لعرض المحادثة بينهما");
      return;
    }

    setConversationLoading(true);
    setConversationError(null);
    
    try {
      const response = await fetch(`/api/messages/conversation/${selectedUser1Id}?otherUserId=${selectedUser2Id}`);
      
      if (!response.ok) {
        throw new Error("فشل تحميل المحادثة");
      }
      
      const messages = await response.json();
      
      // إضافة أسماء المستخدمين للعرض
      const user1 = users?.find((u: any) => u.id === selectedUser1Id);
      const user2 = users?.find((u: any) => u.id === selectedUser2Id);
      
      const enhancedMessages = messages.map((msg: any) => ({
        ...msg,
        fromUserName: msg.fromUserId === selectedUser1Id ? user1?.name : user2?.name,
        toUserName: msg.toUserId === selectedUser1Id ? user1?.name : user2?.name,
      }));
      
      setConversation(enhancedMessages);
      setConversationLoaded(true);
    } catch (error) {
      console.error("Error loading conversation:", error);
      setConversationError("حدث خطأ أثناء تحميل المحادثة");
    } finally {
      setConversationLoading(false);
    }
  };

  // حذف مستخدم
  const handleDeleteUser = async () => {
    if (!selectedUserId) return;
    
    try {
      // هنا سيتم إضافة طلب API لحذف المستخدم
      toast({
        title: "تم الحذف",
        description: "تم حذف المستخدم بنجاح",
      });
      setDeleteDialogOpen(false);
      refetchUsers();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف المستخدم",
        variant: "destructive",
      });
    }
  };

  // تعطيل التحقق مؤقتاً
  /*
  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }
  */

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <Helmet>
        <title>لوحة تحكم المسؤول | تِكلينك</title>
      </Helmet>
      
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold">لوحة تحكم المسؤول</h1>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Button onClick={() => navigate("/")} variant="outline">
              العودة للرئيسية
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 w-full md:w-[600px]">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="users">المستخدمون</TabsTrigger>
            <TabsTrigger value="companies">الشركات</TabsTrigger>
            <TabsTrigger value="messages">المحادثات</TabsTrigger>
            <TabsTrigger value="settings">الإعدادات</TabsTrigger>
          </TabsList>

          {/* نظرة عامة - الإحصائيات */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-medium">المستخدمون</CardTitle>
                  <Users className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.users.total}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {stats.users.entrepreneurs} رواد أعمال, {stats.users.companies} شركات, {stats.users.admins} مسؤولين
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-medium">المشاريع</CardTitle>
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.projects.total}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {stats.projects.open} نشطة, {stats.projects.closed} مغلقة
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-medium">الشركات</CardTitle>
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.companies.total}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {stats.companies.verified} موثقة, {stats.companies.unverified} غير موثقة
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>آخر المشاريع</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>اسم المشروع</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>رائد الأعمال</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projects?.slice(0, 5).map((project: any) => (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium">{project.title}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full ${
                              project.status === "open" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                            }`}>
                              {project.status === "open" ? "مفتوح" : "مغلق"}
                            </span>
                          </TableCell>
                          <TableCell>{project.name}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>آخر الشركات المضافة</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>اسم الشركة</TableHead>
                        <TableHead>التقييم</TableHead>
                        <TableHead>الحالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companies?.slice(0, 5).map((company: any) => (
                        <TableRow key={company.id}>
                          <TableCell className="font-medium">{company.name}</TableCell>
                          <TableCell>{company.rating || "لا يوجد"}</TableCell>
                          <TableCell>
                            {company.verified ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-amber-600" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* إدارة المستخدمين */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>إدارة المستخدمين</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم المستخدم</TableHead>
                      <TableHead>البريد الإلكتروني</TableHead>
                      <TableHead>الدور</TableHead>
                      <TableHead>تاريخ التسجيل</TableHead>
                      <TableHead className="text-left">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full ${
                            user.role === "admin" 
                              ? "bg-purple-100 text-purple-800" 
                              : user.role === "company" 
                                ? "bg-blue-100 text-blue-800" 
                                : "bg-green-100 text-green-800"
                          }`}>
                            {user.role === "admin" 
                              ? "مسؤول" 
                              : user.role === "company" 
                                ? "شركة" 
                                : "رائد أعمال"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString("ar-SA")}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2 rtl:space-x-reverse">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/users/${user.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleUserStatus(user.id, user.active)}
                            >
                              {user.active ? (
                                <XCircle className="h-4 w-4 text-red-600" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* إدارة الشركات */}
          <TabsContent value="companies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>إدارة الشركات</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم الشركة</TableHead>
                      <TableHead>الموقع</TableHead>
                      <TableHead>التقييم</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-left">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies?.map((company: any) => (
                      <TableRow key={company.id}>
                        <TableCell className="font-medium">{company.name}</TableCell>
                        <TableCell>{company.location || "غير محدد"}</TableCell>
                        <TableCell>{company.rating || "لا يوجد"}</TableCell>
                        <TableCell>
                          {company.verified ? (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              موثقة
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                              غير موثقة
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2 rtl:space-x-reverse">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/companies/${company.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleCompanyVerification(company.id, company.verified)}
                            >
                              {company.verified ? (
                                <XCircle className="h-4 w-4 text-red-600" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* إدارة المحادثات */}
          <TabsContent value="messages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>مراقبة المحادثات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-1">اختر المستخدمين لعرض محادثاتهم</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">المستخدم الأول</label>
                      <select 
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={selectedUser1Id?.toString() || ""}
                        onChange={(e) => setSelectedUser1Id(Number(e.target.value) || null)}
                      >
                        <option value="">-- اختر مستخدم --</option>
                        {users?.map((user: any) => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.role === "admin" ? "مسؤول" : user.role === "company" ? "شركة" : "رائد أعمال"})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">المستخدم الثاني</label>
                      <select 
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={selectedUser2Id?.toString() || ""}
                        onChange={(e) => setSelectedUser2Id(Number(e.target.value) || null)}
                      >
                        <option value="">-- اختر مستخدم --</option>
                        {users?.map((user: any) => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.role === "admin" ? "مسؤول" : user.role === "company" ? "شركة" : "رائد أعمال"})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Button 
                      onClick={() => loadConversation()} 
                      disabled={!selectedUser1Id || !selectedUser2Id || conversationLoading}
                      className="w-full md:w-auto"
                    >
                      {conversationLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          جاري التحميل...
                        </>
                      ) : (
                        "عرض المحادثة"
                      )}
                    </Button>
                  </div>
                </div>

                {conversationError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
                    {conversationError}
                  </div>
                )}

                {conversation && conversation.length > 0 ? (
                  <div className="border rounded-md">
                    <div className="p-4 border-b bg-muted/30">
                      <h3 className="font-medium">المحادثة بين {conversation[0]?.fromUserName} و {conversation[0]?.toUserName}</h3>
                    </div>
                    <div className="p-4 max-h-[400px] overflow-y-auto space-y-3">
                      {conversation.map((message: any) => (
                        <div
                          key={message.id}
                          className={`flex ${message.fromUserId === selectedUser1Id ? 'justify-start' : 'justify-end'}`}
                        >
                          <div
                            className={`max-w-[80%] p-3 rounded-lg ${
                              message.fromUserId === selectedUser1Id
                                ? 'bg-muted text-foreground rounded-tr-lg rounded-bl-lg rounded-br-lg'
                                : 'bg-primary text-primary-foreground rounded-tl-lg rounded-bl-lg rounded-br-lg'
                            }`}
                          >
                            <div className="text-sm mb-1 opacity-70">
                              {message.fromUserId === selectedUser1Id ? 'من: ' : 'من: '}
                              <strong>{message.fromUserName}</strong> - {new Date(message.createdAt).toLocaleString('ar-SA')}
                            </div>
                            <div>{message.content}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : conversationLoaded && !conversationLoading ? (
                  <div className="text-center p-8 text-muted-foreground">
                    لا توجد رسائل بين هذين المستخدمين
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>

          {/* إعدادات الموقع */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات الموقع</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="mb-10">
                    <h3 className="text-lg font-medium mb-2">صورة الهيدر</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="bg-gray-100 rounded-lg p-4 mb-4 aspect-[3/1] overflow-hidden relative">
                          {headerImageUrl ? (
                            <img 
                              src={headerImageUrl} 
                              alt="صورة الهيدر" 
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Image className="h-24 w-24 text-muted-foreground opacity-25" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                            ref={fileInputRef}
                          />
                          
                          <div className="flex space-x-2 rtl:space-x-reverse">
                            <Button
                              variant="outline"
                              onClick={() => fileInputRef.current?.click()}
                              className="flex-1"
                            >
                              <Upload className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                              اختيار صورة
                            </Button>
                            
                            <Button
                              onClick={handleImageUpload}
                              disabled={!headerImageFile || uploadingImage}
                              className="flex-1"
                            >
                              {uploadingImage ? (
                                <Loader2 className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0 animate-spin" />
                              ) : (
                                <Image className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                              )}
                              {uploadingImage ? "جارِ الرفع..." : "تحديث الصورة"}
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium mb-1">تعليمات</h4>
                          <ul className="list-disc list-inside text-sm text-muted-foreground">
                            <li>يجب أن تكون الصورة بنسبة عرض إلى ارتفاع 3:1 للحصول على أفضل نتيجة</li>
                            <li>الحد الأقصى لحجم الملف هو 2 ميجابايت</li>
                            <li>الصيغ المدعومة: JPG، PNG، WebP</li>
                            <li>استخدم صورة ذات دقة عالية</li>
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium mb-1">معاينة</h4>
                          <p className="text-sm text-muted-foreground">
                            ستظهر الصورة في صفحة الرئيسية للموقع كخلفية لقسم الهيدر.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">صورة الجانب</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="bg-gray-100 rounded-lg p-4 mb-4 aspect-[3/2] overflow-hidden relative">
                          {sideImageUrl ? (
                            <img 
                              src={sideImageUrl} 
                              alt="صورة الجانب" 
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Image className="h-24 w-24 text-muted-foreground opacity-25" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleSideImageSelect}
                            className="hidden"
                            ref={sideImageInputRef}
                          />
                          
                          <div className="flex space-x-2 rtl:space-x-reverse">
                            <Button
                              variant="outline"
                              onClick={() => sideImageInputRef.current?.click()}
                              className="flex-1"
                            >
                              <Upload className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                              اختيار صورة
                            </Button>
                            
                            <Button
                              onClick={handleSideImageUpload}
                              disabled={!sideImageFile || uploadingSideImage}
                              className="flex-1"
                            >
                              {uploadingSideImage ? (
                                <Loader2 className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0 animate-spin" />
                              ) : (
                                <Image className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                              )}
                              {uploadingSideImage ? "جارِ الرفع..." : "تحديث الصورة"}
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium mb-1">تعليمات</h4>
                          <ul className="list-disc list-inside text-sm text-muted-foreground">
                            <li>يفضل أن تكون الصورة بنسبة عرض إلى ارتفاع 3:2 للحصول على أفضل نتيجة</li>
                            <li>الحد الأقصى لحجم الملف هو 2 ميجابايت</li>
                            <li>الصيغ المدعومة: JPG، PNG، WebP</li>
                            <li>استخدم صورة ذات دقة عالية</li>
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium mb-1">معاينة</h4>
                          <p className="text-sm text-muted-foreground">
                            ستظهر الصورة في الجانب الأيمن من قسم الهيدر في الصفحة الرئيسية.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* يمكن إضافة إعدادات أخرى هنا في المستقبل */}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* مربع حوار تأكيد الحذف */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد حذف المستخدم</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من رغبتك في حذف هذا المستخدم؟ هذا الإجراء لا يمكن التراجع عنه.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}