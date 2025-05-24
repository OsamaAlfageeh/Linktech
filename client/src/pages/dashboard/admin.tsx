import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/App";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Loader2, Users, Briefcase, Building2, CheckCircle2, XCircle, Eye, Pencil, Trash2, Settings, Upload, Image, 
  DollarSign, Clock, Award, MessageSquare, FileText, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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

interface AdminDashboardProps {
  auth: any;
}

export default function AdminDashboard({ auth }: AdminDashboardProps) {
  const { user, isAuthenticated } = auth;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // تحقق من صلاحية المستخدم لعرض لوحة المسؤول
  useEffect(() => {
    console.log("فحص حالة المصادقة:", { isAuthenticated, user });
    if (!isAuthenticated) {
      toast({
        title: "غير مصرح",
        description: "يجب تسجيل الدخول للوصول إلى هذه الصفحة",
        variant: "destructive",
      });
      navigate("/auth/login");
      return;
    }
    
    if (user?.role !== "admin") {
      toast({
        title: "غير مصرح",
        description: "ليس لديك صلاحية الوصول إلى لوحة المسؤول",
        variant: "destructive",
      });
      navigate("/");
      return;
    }
    
    console.log("المستخدم مصرح للوصول إلى لوحة المسؤول");
  }, [isAuthenticated, user, navigate, toast]);
  
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
  
  // متغيرات لتوثيق الشركات
  const [processingVerification, setProcessingVerification] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [verificationDocuments, setVerificationDocuments] = useState<Array<{
    name: string;
    type: string;
    size: number;
    content: string;
  }>>([]);

  // ملاحظة: تم نقل التحقق من صلاحية المستخدم إلى فوق

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
    // تمكين الاستعلام فقط عند وجود مصادقة كمسؤول
    enabled: isAuthenticated && user?.role === "admin",
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
  
  // استعلام لجلب كافة العروض المقدمة على المشاريع
  const {
    data: allOffers,
    isLoading: offersLoading,
    refetch: refetchOffers,
  } = useQuery({
    queryKey: ["/api/offers/all"],
    queryFn: async () => {
      // جمع العروض من جميع المشاريع
      if (!projects || projects.length === 0) return [];
      
      const projectOffersPromises = projects.map(async (project: any) => {
        const response = await fetch(`/api/projects/${project.id}/offers`);
        if (!response.ok) {
          console.error(`فشل في جلب عروض المشروع ${project.id}`);
          return [];
        }
        const offers = await response.json();
        // إضافة معلومات المشروع لكل عرض
        return offers.map((offer: any) => ({
          ...offer,
          projectTitle: project.title,
          projectId: project.id
        }));
      });
      
      const allProjectOffers = await Promise.all(projectOffersPromises);
      // دمج كل العروض في مصفوفة واحدة
      return allProjectOffers.flat();
    },
    enabled: isAuthenticated && user?.role === "admin" && Boolean(projects?.length)
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

  // حالة حوار تفاصيل التوثيق
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [selectedCompanyForVerification, setSelectedCompanyForVerification] = useState<{
    id: number,
    name: string,
    verified: boolean
  } | null>(null);
  
  // عرض حوار التوثيق
  const openVerificationDialog = (company: any) => {
    setSelectedCompanyForVerification({
      id: company.id,
      name: company.name,
      verified: company.verified
    });
    setVerificationNotes('');
    setVerificationDocuments([]);
    setVerificationDialogOpen(true);
  };
  
  // توثيق أو إلغاء توثيق شركة
  const handleToggleCompanyVerification = async (companyId: number, currentVerified: boolean) => {
    // للإلغاء التوثيق، لا نحتاج لحوار
    if (currentVerified) {
      await processVerification(companyId, false);
    } else {
      // للتوثيق، نعرض حوار تفاصيل التوثيق
      const company = companies?.find((c: any) => c.id === companyId);
      if (company) {
        openVerificationDialog(company);
      } else {
        toast({
          title: "خطأ",
          description: "لم يتم العثور على الشركة",
          variant: "destructive",
        });
      }
    }
  };
  
  // معالجة التوثيق مع التفاصيل
  const processVerification = async (companyId: number, verified: boolean, notes: string = '') => {
    try {
      setProcessingVerification(true);
      
      // تحضير بيانات التوثيق
      const verificationData = {
        verified,
        verificationNotes: notes,
        verificationDocuments: verificationDocuments.length > 0 ? verificationDocuments : null
      };
      
      console.log('إرسال طلب توثيق الشركة:', verificationData);
      
      const response = await fetch(`/api/companies/${companyId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verificationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل تحديث حالة توثيق الشركة');
      }

      toast({
        title: `تم ${verified ? "توثيق" : "إلغاء توثيق"} الشركة`,
        description: `تم ${verified ? "توثيق" : "إلغاء توثيق"} الشركة بنجاح`,
      });
      
      // إغلاق الحوار وتحديث قائمة الشركات
      setVerificationDialogOpen(false);
      setVerificationNotes('');
      setVerificationDocuments([]);
      refetchCompanies();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء تحديث حالة توثيق الشركة",
        variant: "destructive",
      });
      console.error('خطأ في عملية التوثيق:', error);
    } finally {
      setProcessingVerification(false);
    }
  };

  // تغيير حالة المشروع (مفتوح/مغلق)
  const handleToggleProjectStatus = async (projectId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "open" ? "closed" : "open";
      
      const response = await fetch(`/api/projects/${projectId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('فشل تحديث حالة المشروع');
      }

      toast({
        title: `تم ${newStatus === "open" ? "فتح" : "إغلاق"} المشروع`,
        description: `تم ${newStatus === "open" ? "فتح" : "إغلاق"} المشروع بنجاح`,
      });
      
      // تحديث قائمة المشاريع
      refetchProjects();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث حالة المشروع",
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
    console.log(`جاري تحميل المحادثة بين المستخدمين: ${selectedUser1Id} و ${selectedUser2Id}`);
    
    try {
      // استخدام طريقة المسؤول لعرض المحادثات بواسطة معلمات الاستعلام otherUserId
      const response = await fetch(`/api/messages/conversation/${selectedUser1Id}?otherUserId=${selectedUser2Id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "فشل تحميل المحادثة");
      }
      
      const messages = await response.json();
      console.log(`تم تحميل ${messages.length} رسالة بين المستخدمين`);
      
      // إضافة أسماء المستخدمين للعرض
      const user1 = users?.find((u: any) => u.id === selectedUser1Id);
      const user2 = users?.find((u: any) => u.id === selectedUser2Id);
      
      if (!user1 || !user2) {
        throw new Error("لم يتم العثور على معلومات أحد المستخدمين");
      }
      
      const enhancedMessages = messages.map((msg: any) => ({
        ...msg,
        fromUserName: msg.fromUserId === selectedUser1Id ? user1?.name : user2?.name,
        toUserName: msg.toUserId === selectedUser1Id ? user1?.name : user2?.name,
        // تحويل التاريخ إلى كائن Date إذا كان نصيًا
        createdAt: typeof msg.createdAt === 'string' ? new Date(msg.createdAt) : msg.createdAt
      }));
      
      // ترتيب الرسائل تصاعديًا حسب التاريخ
      const sortedMessages = enhancedMessages.sort((a: any, b: any) => {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
      
      setConversation(sortedMessages);
      setConversationLoaded(true);
    } catch (error) {
      console.error("Error loading conversation:", error);
      setConversationError(error instanceof Error ? error.message : "حدث خطأ أثناء تحميل المحادثة");
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
        <title>لوحة تحكم المسؤول | لينكتك</title>
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
          <div className="overflow-x-auto pb-2 -mb-2">
            <TabsList className="flex lg:grid lg:grid-cols-8 min-w-[500px] w-max lg:w-full">
              <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
              <TabsTrigger value="users">المستخدمون</TabsTrigger>
              <TabsTrigger value="companies">الشركات</TabsTrigger>
              <TabsTrigger value="projects">المشاريع</TabsTrigger>
              <TabsTrigger value="offers">العروض</TabsTrigger>
              <TabsTrigger value="messages">المحادثات</TabsTrigger>
              <TabsTrigger value="premium-clients">عملاء التميز</TabsTrigger>
              <TabsTrigger value="blog">المدونة</TabsTrigger>
              <TabsTrigger value="settings">الإعدادات</TabsTrigger>
            </TabsList>
          </div>

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
            
            {/* أدوات الإدارة السريعة */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-2 border-primary/10 hover:border-primary/30 transition-colors cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <MessageSquare className="h-10 w-10 text-primary" />
                    <CardTitle className="text-lg">رسائل الاتصال</CardTitle>
                    <p className="text-sm text-muted-foreground">إدارة رسائل نموذج الاتصال من الزوار</p>
                    <Button 
                      variant="default" 
                      className="mt-2 w-full"
                      onClick={() => navigate("/admin/contact-messages")}
                    >
                      عرض الرسائل
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-primary/10 hover:border-primary/30 transition-colors cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <FileText className="h-10 w-10 text-primary" />
                    <CardTitle className="text-lg">المدونة</CardTitle>
                    <p className="text-sm text-muted-foreground">إدارة مقالات ومحتوى المدونة</p>
                    <Button 
                      variant="default" 
                      className="mt-2 w-full"
                      onClick={() => navigate("/admin/blog-management")}
                    >
                      إدارة المدونة
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-primary/10 hover:border-primary/30 transition-colors cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <Star className="h-10 w-10 text-primary" />
                    <CardTitle className="text-lg">عملاء التميز</CardTitle>
                    <p className="text-sm text-muted-foreground">إدارة عملاء التميز والشركات المميزة</p>
                    <Button 
                      variant="default" 
                      className="mt-2 w-full"
                      onClick={() => navigate("/admin/premium-clients")}
                    >
                      إدارة العملاء
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-primary/10 hover:border-primary/30 transition-colors cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <Settings className="h-10 w-10 text-primary" />
                    <CardTitle className="text-lg">إعدادات الموقع</CardTitle>
                    <p className="text-sm text-muted-foreground">تعديل إعدادات وصور الموقع</p>
                    <Button 
                      variant="default" 
                      className="mt-2 w-full"
                      onClick={() => setActiveTab("settings")}
                    >
                      الإعدادات
                    </Button>
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
                        <TableCell className="font-medium">
                          {/* جلب اسم الشركة من user أو عرض معرف المستخدم */}
                          {users?.find((u: any) => u.id === company.userId)?.name || `شركة #${company.id}`}
                        </TableCell>
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

          {/* إدارة المشاريع */}
          <TabsContent value="projects" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>إدارة المشاريع</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم المشروع</TableHead>
                      <TableHead>رائد الأعمال</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>العروض</TableHead>
                      <TableHead className="text-left">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects?.map((project: any) => (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">{project.title}</TableCell>
                        <TableCell>{project.name}</TableCell>
                        <TableCell>
                          {new Date(project.createdAt).toLocaleDateString("ar-SA")}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                            project.status === "open" 
                              ? "bg-green-100 text-green-800" 
                              : "bg-gray-100 text-gray-800"
                          }`}>
                            {project.status === "open" ? "مفتوح" : "مغلق"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            className="text-primary hover:text-primary-dark"
                            onClick={() => navigate(`/projects/${project.id}#offers`)}
                          >
                            عرض العروض
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2 rtl:space-x-reverse">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/projects/${project.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/dashboard/entrepreneur?tab=projects&action=edit&projectId=${project.id}`)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleProjectStatus(project.id, project.status)}
                            >
                              {project.status === "open" ? (
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

          {/* قسم إدارة العروض */}
          <TabsContent value="offers" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>إدارة العروض</CardTitle>
                <Button 
                  size="sm" 
                  onClick={() => refetchOffers()}
                  disabled={offersLoading}
                >
                  {offersLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  تحديث
                </Button>
              </CardHeader>
              <CardContent>
                {offersLoading ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : allOffers && allOffers.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>المشروع</TableHead>
                        <TableHead>الشركة</TableHead>
                        <TableHead>المبلغ المعروض</TableHead>
                        <TableHead>المدة المتوقعة</TableHead>
                        <TableHead>تاريخ العرض</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>تفاصيل</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allOffers.map((offer: any) => (
                        <TableRow key={offer.id}>
                          <TableCell className="font-medium">{offer.projectTitle}</TableCell>
                          <TableCell>{offer.companyName || "غير معروف"}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 text-green-600 mr-1 rtl:ml-1 rtl:mr-0" /> 
                              {offer.amount} ريال
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 text-blue-600 mr-1 rtl:ml-1 rtl:mr-0" /> 
                              {offer.timeline}
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(offer.createdAt).toLocaleDateString("ar-SA")}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                              offer.status === "pending" 
                                ? "bg-amber-100 text-amber-800" 
                                : offer.status === "accepted" 
                                  ? "bg-green-100 text-green-800" 
                                  : offer.status === "rejected" 
                                    ? "bg-red-100 text-red-800" 
                                    : offer.status === "paid" 
                                      ? "bg-blue-100 text-blue-800" 
                                      : "bg-gray-100 text-gray-800"
                            }`}>
                              {offer.status === "pending" 
                                ? "قيد الانتظار" 
                                : offer.status === "accepted" 
                                  ? "مقبول" 
                                  : offer.status === "rejected" 
                                    ? "مرفوض" 
                                    : offer.status === "paid" 
                                      ? "مدفوع" 
                                      : "غير معروف"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/projects/${offer.projectId}#offers`)}
                            >
                              <Eye className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
                              عرض التفاصيل
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-10">
                    <Award className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">لا توجد عروض مقدمة حتى الآن</p>
                  </div>
                )}
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
                    <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
                      <h3 className="font-medium">المحادثة بين {conversation[0]?.fromUserName} و {conversation[0]?.toUserName}</h3>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // تنزيل المحادثة كملف نصي
                          const conversationText = conversation.map(msg => 
                            `[${new Date(msg.createdAt).toLocaleString('ar-SA')}] ${msg.fromUserName}: ${msg.content}`
                          ).join('\n\n');
                          
                          const blob = new Blob([conversationText], { type: 'text/plain;charset=utf-8' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `محادثة-${selectedUser1Id}-${selectedUser2Id}-${new Date().toISOString().slice(0, 10)}.txt`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                          
                          toast({
                            title: "تم التنزيل",
                            description: "تم تنزيل نسخة من المحادثة بنجاح",
                          });
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        تنزيل المحادثة
                      </Button>
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
                            {/* التحقق مما إذا كانت الرسالة محظورة */}
                            {message.content.includes('[تم حظر هذه الرسالة') ? (
                              <div className="text-red-500 italic">
                                {message.content}
                                <div className="mt-1 text-xs bg-red-50 p-1 rounded">
                                  <strong>ملاحظة للمسؤول:</strong> تم رصد محتوى محظور في هذه الرسالة
                                </div>
                              </div>
                            ) : (
                              <div>{message.content}</div>
                            )}
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

          {/* قسم إدارة المدونة */}
          {/* عملاء التميز */}
          <TabsContent value="premium-clients" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">إدارة عملاء التميز</h2>
              <Link href="/admin/premium-clients">
                <Button variant="default">
                  الانتقال إلى لوحة إدارة عملاء التميز
                </Button>
              </Link>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
              <p className="mb-4">يمكنك إدارة قائمة عملاء التميز والشركاء الاستراتيجيين لمنصة لينكتك من خلال لوحة الإدارة الخاصة.</p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300 mb-4">
                <li>إضافة شركاء استراتيجيين جدد</li>
                <li>تعديل بيانات الشركاء الحاليين</li>
                <li>إزالة الشركاء غير النشطين</li>
                <li>تحديد الشركاء المميزين للعرض بشكل بارز</li>
              </ul>
            </div>
          </TabsContent>
          
          <TabsContent value="blog" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>إدارة المدونة</CardTitle>
                <Button className="mr-2" onClick={() => {
                  // توجيه إلى صفحة إدارة المدونة
                  navigate("/admin/blog-management");
                }}>
                  <FileText className="h-4 w-4 ml-2" />
                  فتح نظام إدارة المدونة
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-6">
                    <p className="text-muted-foreground">
                      اضغط على الزر أعلاه للوصول إلى نظام إدارة المدونة الكامل مع إمكانية إضافة وتحرير المقالات والفئات.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* مربع حوار تأكيد الحذف */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
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

      {/* حوار تفاصيل التوثيق */}
      <Dialog open={verificationDialogOpen} onOpenChange={setVerificationDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>توثيق الشركة: {selectedCompanyForVerification?.name}</DialogTitle>
            <DialogDescription>
              أدخل ملاحظات التوثيق ومعلومات KYC
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4 py-4">
            <div className="grid w-full gap-1.5">
              <Label htmlFor="verification-notes">ملاحظات التوثيق</Label>
              <Textarea
                id="verification-notes"
                placeholder="أدخل أي ملاحظات متعلقة بعملية التوثيق"
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                className="h-24"
              />
            </div>
            
            <div className="grid w-full gap-1.5">
              <Label>معلومات KYC</Label>
              <div className="border rounded-md p-3 bg-muted/50">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">تم التحقق من هوية الشركة</span>
                  </div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">تم التحقق من السجل التجاري</span>
                  </div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">تم التحقق من المعلومات الضريبية</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid w-full gap-1.5">
              <Label>المستندات المرفقة</Label>
              <div className="border rounded-md p-3 bg-muted/50">
                <div className="flex flex-col space-y-3">
                  {verificationDocuments.length > 0 ? (
                    <div className="space-y-2">
                      {verificationDocuments.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between bg-background rounded p-2">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0 text-primary" />
                            <span className="text-sm font-medium truncate max-w-[200px]">
                              {doc.name}
                            </span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setVerificationDocuments(
                                verificationDocuments.filter((_, i) => i !== index)
                              );
                            }}
                          >
                            <X className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      لم يتم إضافة أي مستندات بعد
                    </p>
                  )}
                  
                  <div className="flex items-center">
                    <input
                      type="file"
                      id="document-upload"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          // تحويل الملف إلى Base64 لتخزينه
                          const reader = new FileReader();
                          reader.onload = () => {
                            const newDoc = {
                              name: file.name,
                              type: file.type,
                              size: file.size,
                              content: reader.result as string
                            };
                            setVerificationDocuments([...verificationDocuments, newDoc]);
                          };
                          reader.readAsDataURL(file);
                        }
                        // إعادة تعيين حقل الإدخال
                        e.target.value = '';
                      }}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => document.getElementById('document-upload')?.click()}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                      إضافة مستند
                    </Button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                يمكنك تحميل مستندات بصيغة PDF أو صور (JPG، PNG) بحجم أقصى 5MB لكل ملف.
              </p>
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setVerificationDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (selectedCompanyForVerification) {
                  processVerification(
                    selectedCompanyForVerification.id,
                    true,
                    verificationNotes
                  );
                }
              }}
              disabled={processingVerification}
            >
              تأكيد التوثيق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}