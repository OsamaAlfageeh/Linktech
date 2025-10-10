import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  LayoutDashboard,
  Building,
  MessagesSquare,
  AlertCircle,
  Edit,
  Star,
  MapPin,
  Globe,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

type CompanyProfile = {
  id: number;
  userId: number;
  description: string;
  logo?: string;
  coverPhoto?: string;
  website?: string;
  location?: string;
  skills: string[];
  rating?: number;
  reviewCount?: number;
  // معلومات شخصية إضافية
  fullName?: string;
  nationalId?: string;
  phone?: string;
  birthDate?: string;
  address?: string;
  commercialRegistry?: string;
};

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string;
};

type CompanyDashboardProps = {
  auth: {
    user: User;
    isAuthenticated: boolean;
    isCompany: boolean;
  };
};

// Profile update form schema
const profileSchema = z.object({
  description: z.string().min(20, "وصف الشركة مطلوب ويجب أن يكون مفصلاً (20 حرف على الأقل)"),
  skills: z.string().min(1, "التخصصات والمهارات مطلوبة"),
  website: z.string().optional(),
  location: z.string().optional(),
  email: z.string().email("البريد الإلكتروني غير صالح").min(1, "البريد الإلكتروني مطلوب"),
});

// Personal info form schema
const personalInfoSchema = z.object({
  fullName: z.string().min(3, "الاسم الكامل مطلوب (3 أحرف على الأقل)"),
  nationalId: z.string().min(10, "رقم الهوية الوطنية مطلوب (10 أرقام على الأقل)"),
  phone: z.string().min(10, "رقم الجوال مطلوب (10 أرقام على الأقل)"),
  birthDate: z.string().min(1, "تاريخ الميلاد مطلوب"),
  address: z.string().min(10, "العنوان الوطني مطلوب (10 أحرف على الأقل)"),
  commercialRegistry: z.string().min(10, "رقم السجل التجاري مطلوب (10 أرقام على الأقل)"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PersonalInfoFormValues = z.infer<typeof personalInfoSchema>;

const CompanyDashboard = ({ auth }: CompanyDashboardProps) => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPersonalInfoMode, setIsPersonalInfoMode] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // قراءة معلمة التبويب من URL عند تحميل الصفحة
  useEffect(() => {
    // الحصول على معلمات URL
    const searchParams = new URLSearchParams(window.location.search);
    const tabParam = searchParams.get('tab');
    
    // تحديث التبويب النشط إذا كان موجودًا في URL
    if (tabParam && ['dashboard', 'profile', 'messages'].includes(tabParam)) {
      setActiveTab(tabParam);
      
      // إذا كان التبويب هو profile، قد نحتاج لضبط وضع التعديل
      if (tabParam === 'profile') {
        setIsEditMode(true);
      }
    }
  }, []);

  // Fetch company profile
  const {
    data: profile,
    isLoading: isLoadingProfile,
    error: profileError,
    refetch: refetchProfile
  } = useQuery<CompanyProfile>({
    queryKey: [`/api/companies/user/${auth.user?.id}`],
    enabled: !!auth.user?.id,
    staleTime: 0, // دائماً اعتبر البيانات قديمة لضمان التحديث عند الطلب
  });

  // Form for updating the profile
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      description: "",
      skills: "",
      website: "",
      location: "",
    },
  });
  
  // نموذج البيانات الشخصية
  const personalInfoForm = useForm<PersonalInfoFormValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      fullName: "",
      nationalId: "",
      phone: "",
      birthDate: "",
      address: "",
      commercialRegistry: "",
    },
  });
  
  // تحديث البيانات الشخصية (نسخة 1)
  const updatePersonalInfoMutation1 = useMutation({
    mutationFn: async (data: PersonalInfoFormValues) => {
      if (!profile?.id) throw new Error("Profile ID is missing");
      
      console.log('Sending personal info update to server:', JSON.stringify(data));
      
      // في الواقع، سنستخدم نفس نقطة النهاية لتحديث ملف الشركة ولكن نضيف البيانات الشخصية
      const response = await apiRequest("PATCH", `/api/companies/${profile.id}`, data);
      const result = await response.json();
      console.log('Server response:', JSON.stringify(result));
      return result;
    },
    onSuccess: async (data) => {
      console.log('تم استلام بيانات شخصية محدثة من الخادم:', JSON.stringify(data));
      
      // تحديث البيانات في الكاش
      queryClient.setQueryData([`/api/companies/user/${auth.user?.id}`], (oldData: any) => {
        return { ...oldData, ...data };
      });
      
      // إعادة تحميل البيانات
      try {
        await refetchProfile();
        console.log('تم إعادة تحميل بيانات الملف بنجاح');
      } catch (error) {
        console.error('خطأ في إعادة تحميل بيانات الملف:', error);
      }
      
      toast({
        title: "تم تحديث البيانات الشخصية بنجاح",
        description: "تم تحديث بياناتك الشخصية المطلوبة لاتفاقيات عدم الإفصاح بنجاح.",
      });
      
      setIsPersonalInfoMode(false);
    },
    onError: (error) => {
      toast({
        title: "حدث خطأ",
        description: "لم نتمكن من تحديث البيانات الشخصية، يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    },
  });

  // Set form values when profile data is loaded
  useEffect(() => {
    if (profile) {
      form.setValue("description", profile.description);
      form.setValue("skills", profile.skills.join(", "));
      form.setValue("website", profile.website || "");
      form.setValue("location", profile.location || "");
      form.setValue("email", auth.user?.email || "");
      
      // ضبط قيم البيانات الشخصية إذا كانت موجودة
      personalInfoForm.setValue("fullName", profile.fullName || "");
      personalInfoForm.setValue("nationalId", profile.nationalId || "");
      personalInfoForm.setValue("phone", profile.phone || "");
      personalInfoForm.setValue("birthDate", profile.birthDate || "");
      personalInfoForm.setValue("address", profile.address || "");
    }
  }, [profile, form, personalInfoForm, auth.user?.email]);

  // Update profile mutation
  // تحديث بيانات الملف الشخصي للشركة
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      if (!profile?.id) throw new Error("Profile ID is missing");
      
      const skills = data.skills.split(",").map((skill) => skill.trim()).filter(skill => skill !== "");
      const { email, ...profileData } = data;
      const updatedProfileData = {
        ...profileData,
        skills,
      };
      
      console.log('Sending update to server:', JSON.stringify(updatedProfileData));
      console.log('Profile ID:', profile.id);
      
      // Update company profile
      const profileResponse = await apiRequest("PATCH", `/api/companies/${profile.id}`, updatedProfileData);
      const profileResult = await profileResponse.json();
      
      // Update user email if it changed
      if (email && email !== auth.user?.email) {
        console.log('Updating user email:', email);
        const userResponse = await apiRequest("PATCH", `/api/users/${auth.user?.id}`, { email });
        
        if (!userResponse.ok) {
          throw new Error("Failed to update email");
        }
        
        // Refresh auth data to reflect email change
        await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      }
      
      console.log('Server response:', JSON.stringify(profileResult));
      return profileResult;
    },
    onSuccess: async (data) => {
      console.log('تم استلام بيانات محدثة من الخادم:', JSON.stringify(data));
      
      // 1. إلغاء صحة البيانات في الكاش لإجبار إعادة التحميل
      await queryClient.invalidateQueries({
        queryKey: [`/api/companies/user/${auth.user?.id}`]
      });
      
      // 2. إعادة تحميل البيانات من الخادم مباشرة للتأكد من تحديث الواجهة
      try {
        await refetchProfile();
        console.log('تم إعادة تحميل بيانات الملف بنجاح');
      } catch (error) {
        console.error('خطأ في إعادة تحميل بيانات الملف:', error);
      }
      
      toast({
        title: "تم تحديث الملف بنجاح",
        description: "تم تحديث بيانات شركتك بنجاح.",
      });
      
      setIsEditMode(false);
    },
    onError: (error) => {
      toast({
        title: "حدث خطأ",
        description: "لم نتمكن من تحديث بيانات الشركة، يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    },
  });

  // تحديث البيانات الشخصية (نسخة محسنة)
  const updatePersonalInfoMutation2 = useMutation({
    mutationFn: async (data: PersonalInfoFormValues) => {
      if (!profile?.id) throw new Error("Profile ID is missing");
      
      console.log('Sending personal info update to server:', JSON.stringify(data));
      console.log('Profile ID:', profile.id);
      
      // استخدام نقطة النهاية العادية لتحديث ملف الشركة مع البيانات الشخصية
      const response = await apiRequest("PATCH", `/api/companies/${profile.id}`, data);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`فشل في تحديث البيانات: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Server response:', JSON.stringify(result));
      return result;
    },
    onSuccess: async (data) => {
      console.log('تم استلام بيانات شخصية محدثة من الخادم:', JSON.stringify(data));
      
      // إلغاء صحة جميع الاستعلامات المتعلقة بالشركة
      await queryClient.invalidateQueries({
        queryKey: [`/api/companies/user/${auth.user?.id}`]
      });
      
      // حذف البيانات من الكاش تماماً لإجبار إعادة التحميل
      queryClient.removeQueries({
        queryKey: [`/api/companies/user/${auth.user?.id}`]
      });
      
      // إعادة تحميل البيانات فوراً
      setTimeout(async () => {
        try {
          const freshData = await refetchProfile();
          console.log('=== تم إعادة تحميل بيانات الملف بعد التحديث ===');
          console.log('البيانات الجديدة:', freshData);
          console.log('حالة البيانات الشخصية بعد التحديث:', {
            fullName: freshData?.data?.fullName,
            nationalId: freshData?.data?.nationalId,
            phone: freshData?.data?.phone,
            birthDate: freshData?.data?.birthDate,
            address: freshData?.data?.address
          });
        } catch (error) {
          console.error('خطأ في إعادة تحميل بيانات الملف:', error);
        }
        
        // إجبار إعادة تحديث البيانات بدلاً من إعادة تحميل الصفحة
        setTimeout(async () => {
          try {
            await queryClient.invalidateQueries({
              queryKey: [`/api/companies/user/${auth.user?.id}`],
              exact: true
            });
            await refetchProfile();
          } catch (error) {
            console.error('خطأ في إعادة تحميل البيانات:', error);
            // في حالة فشل إعادة التحميل، نعيد تحميل الصفحة كحل احتياطي
            window.location.reload();
          }
        }, 500);
      }, 100);
      
      toast({
        title: "تم تحديث البيانات الشخصية بنجاح",
        description: "سيتم إعادة تحميل الصفحة لعرض التحديثات.",
      });
      
      setIsPersonalInfoMode(false);
    },
    onError: (error) => {
      toast({
        title: "حدث خطأ",
        description: "لم نتمكن من تحديث البيانات الشخصية، يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };
  
  const onSubmitPersonalInfo = (data: PersonalInfoFormValues) => {
    updatePersonalInfoMutation2.mutate(data);
  };

  // فحص اكتمال البيانات الشخصية بدقة أكبر
  const isPersonalInfoComplete = useMemo(() => {
    if (!profile) return false;
    
    const requiredFields = ['fullName', 'nationalId', 'phone', 'birthDate', 'address', 'commercialRegistry'];
    const isComplete = requiredFields.every(field => {
      const value = profile[field as keyof typeof profile];
      return value && typeof value === 'string' && value.trim() !== "";
    });

    console.log('Personal Info Completion Check:', {
      profile: !!profile,
      fullName: profile?.fullName,
      nationalId: profile?.nationalId,
      phone: profile?.phone,
      birthDate: profile?.birthDate,
      address: profile?.address,
      isComplete
    });

    return isComplete;
  }, [profile]);

  // Redirect if not authenticated or not a company
  useEffect(() => {
    if (!auth.isAuthenticated || !auth.isCompany) {
      navigate("/");
    }
  }, [auth, navigate]);

  if (!auth.isAuthenticated || !auth.isCompany) {
    return null;
  }

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="fill-amber-500 text-amber-500 h-4 w-4" />);
    }
    
    if (hasHalfStar) {
      stars.push(
        <svg key="half" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
          <defs>
            <linearGradient id="halfFill">
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" fill="url(#halfFill)" stroke="currentColor" />
        </svg>
      );
    }
    
    const remainingStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="text-amber-500 h-4 w-4" />);
    }
    
    return stars;
  };

  return (
    <>
      <Helmet>
        <title>لوحة التحكم | لينكتك</title>
        <meta name="description" content="لوحة تحكم شركة البرمجة في منصة لينكتك" />
      </Helmet>

      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-heading mb-2">لوحة التحكم</h1>
          <p className="text-neutral-600">إدارة ملف شركتك والتواصل مع العملاء</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8" dir="rtl">
          <TabsList className="bg-neutral-100 p-1 flex-row-reverse">
            <TabsTrigger value="dashboard" className="flex items-center">
              <LayoutDashboard className="ml-2 h-4 w-4" />
              <span>الرئيسية</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center">
              <Building className="ml-2 h-4 w-4" />
              <span>ملف الشركة</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center">
              <MessagesSquare className="ml-2 h-4 w-4" />
              <span>الرسائل</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Overview */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>التقييم</CardTitle>
                  <CardDescription>متوسط تقييم الشركة</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingProfile ? (
                    <Skeleton className="h-10 w-10" />
                  ) : profile ? (
                    <div className="flex items-center">
                      <div className="text-3xl font-bold ml-2">
                        {profile.rating?.toFixed(1) || "0.0"}
                      </div>
                      <div className="flex text-amber-500">
                        {renderStars(profile.rating || 0)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-3xl font-bold">0.0</div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>المراجعات</CardTitle>
                  <CardDescription>عدد مراجعات العملاء</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingProfile ? (
                    <Skeleton className="h-10 w-10" />
                  ) : (
                    <div className="text-3xl font-bold">
                      {profile?.reviewCount || 0}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>التخصصات</CardTitle>
                  <CardDescription>عدد التخصصات</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingProfile ? (
                    <Skeleton className="h-10 w-10" />
                  ) : (
                    <div className="text-3xl font-bold">
                      {profile?.skills.length || 0}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>ملخص الشركة</CardTitle>
                <CardDescription>نظرة عامة على ملف شركتك</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingProfile ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-16 w-16 rounded-lg" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-20 w-full" />
                    <div className="flex flex-wrap gap-2">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </div>
                  </div>
                ) : profileError ? (
                  <div className="text-center p-4">
                    <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p>حدث خطأ أثناء تحميل بيانات الشركة</p>
                    <Button 
                      onClick={() => queryClient.invalidateQueries({queryKey: [`/api/companies/user/${auth.user?.id}`]})}
                      variant="outline"
                      className="mt-2"
                    >
                      إعادة المحاولة
                    </Button>
                  </div>
                ) : profile ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16 rounded-lg">
                        <AvatarImage src={auth.user.avatar} />
                        <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                          {getInitials(auth.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-semibold">{auth.user.name}</h3>
                        <div className="flex items-center text-sm text-neutral-600">
                          <div className="flex text-amber-500 ml-1">
                            {renderStars(profile.rating || 0)}
                          </div>
                          <span>({profile.rating?.toFixed(1) || "0.0"}) - {profile.reviewCount} مراجعة</span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-neutral-700">{profile.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {profile.skills.map((skill, index) => (
                        <Badge key={index} variant="outline" className="bg-neutral-100 text-neutral-700">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-4">
                      {profile.location && (
                        <div className="flex items-center text-neutral-700">
                          <MapPin className="ml-1 h-4 w-4 text-neutral-500" />
                          <span>{profile.location}</span>
                        </div>
                      )}
                      
                      {profile.website && (
                        <div className="flex items-center text-neutral-700">
                          <Globe className="ml-1 h-4 w-4 text-neutral-500" />
                          <a 
                            href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {profile.website.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-4 border-t flex justify-between">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          // استخدام نظام التنقل wouter للحفاظ على حالة التطبيق وتجنب تحميل الصفحة بالكامل
                          navigate(`/companies/${profile.id}`);
                        }}
                      >
                        عرض الملف العام
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => {
                          setActiveTab("profile");
                          setIsEditMode(true);
                        }}
                      >
                        <Edit className="ml-2 h-4 w-4" />
                        تعديل الملف
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <p className="text-neutral-600 mb-4">لم يتم العثور على ملف للشركة</p>
                    <Button onClick={() => setActiveTab("profile")}>
                      إنشاء ملف الشركة
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>ملف الشركة</CardTitle>
                  <CardDescription>إدارة معلومات وتفاصيل شركتك</CardDescription>
                </div>
                {profile && !isEditMode && (
                  <Button variant="outline" onClick={() => setIsEditMode(true)}>
                    <Edit className="ml-2 h-4 w-4" />
                    تعديل
                  </Button>
                )}
              </CardHeader>
              <CardContent className="pt-6">
                {isLoadingProfile ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                ) : profileError ? (
                  <div className="text-center p-4">
                    <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p>حدث خطأ أثناء تحميل بيانات الشركة</p>
                    <Button 
                      onClick={() => queryClient.invalidateQueries({queryKey: [`/api/companies/user/${auth.user?.id}`]})}
                      variant="outline"
                      className="mt-2"
                    >
                      إعادة المحاولة
                    </Button>
                  </div>
                ) : isEditMode ? (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>البريد الإلكتروني</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="company@example.com" 
                                {...field} 
                              />
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
                            <FormLabel>وصف الشركة</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="قدم وصفاً مفصلاً عن شركتك وخدماتها وخبراتها"
                                {...field}
                                rows={5}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="skills"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>التخصصات والمهارات</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="مثال: تطبيقات الويب، تطبيقات الجوال، الذكاء الاصطناعي (مفصولة بفواصل)"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="website"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>الموقع الإلكتروني</FormLabel>
                              <FormControl>
                                <Input placeholder="example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>الموقع الجغرافي</FormLabel>
                              <FormControl>
                                <Input placeholder="مثال: الرياض، السعودية" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-4 space-x-reverse">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditMode(false)}
                        >
                          إلغاء
                        </Button>
                        <Button 
                          type="submit"
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : profile ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500 mb-1">وصف الشركة</h3>
                      <p className="text-neutral-700 whitespace-pre-line">{profile.description}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500 mb-1">التخصصات والمهارات</h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.map((skill, index) => (
                          <Badge key={index} variant="outline" className="bg-neutral-100 text-neutral-700">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-neutral-500 mb-1">الموقع الإلكتروني</h3>
                        {profile.website ? (
                          <a
                            href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {profile.website}
                          </a>
                        ) : (
                          <p className="text-neutral-500">غير متوفر</p>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-neutral-500 mb-1">الموقع الجغرافي</h3>
                        {profile.location ? (
                          <p className="text-neutral-700">{profile.location}</p>
                        ) : (
                          <p className="text-neutral-500">غير متوفر</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <p className="text-neutral-600 mb-4">لا يوجد ملف للشركة، قم بإنشاء ملف الشركة الآن</p>
                    <Button onClick={() => setIsEditMode(true)}>
                      إنشاء ملف الشركة
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Personal Information for NDA */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>البيانات الشخصية لوثائق عدم الإفصاح</CardTitle>
                  <CardDescription>معلومات مطلوبة لتوقيع اتفاقيات عدم الإفصاح مع أصحاب المشاريع</CardDescription>
                </div>
                {profile && !isPersonalInfoMode && (
                  <Button variant="outline" onClick={() => setIsPersonalInfoMode(true)}>
                    <Edit className="ml-2 h-4 w-4" />
                    تعديل البيانات الشخصية
                  </Button>
                )}
              </CardHeader>
              <CardContent className="pt-6">
                {isLoadingProfile ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                ) : profileError ? (
                  <div className="text-center p-4">
                    <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p>حدث خطأ أثناء تحميل البيانات الشخصية</p>
                    <Button 
                      onClick={() => queryClient.invalidateQueries({queryKey: [`/api/companies/user/${auth.user?.id}`]})}
                      variant="outline"
                      className="mt-2"
                    >
                      إعادة المحاولة
                    </Button>
                  </div>
                ) : isPersonalInfoMode ? (
                  <Form {...personalInfoForm}>
                    <form onSubmit={personalInfoForm.handleSubmit(onSubmitPersonalInfo)} className="space-y-6">
                      <FormField
                        control={personalInfoForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الاسم الكامل للمفوض بالتوقيع *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="أدخل الاسم الكامل كما هو في الهوية الوطنية"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={personalInfoForm.control}
                          name="nationalId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>رقم الهوية الوطنية *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="1234567890"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={personalInfoForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>رقم الجوال *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="05xxxxxxxx"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={personalInfoForm.control}
                          name="birthDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>تاريخ الميلاد *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={personalInfoForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>العنوان الوطني *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="مثال: الرياض، حي النخيل، شارع الملك فهد"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={personalInfoForm.control}
                          name="commercialRegistry"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>رقم السجل التجاري *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="مثال: 1010123456"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <AlertCircle className="h-5 w-5 text-amber-600 ml-2" />
                          <div className="text-sm text-amber-800">
                            <p className="font-medium mb-1">ملاحظة مهمة:</p>
                            <p>هذه البيانات مطلوبة لإنشاء وتوقيع اتفاقيات عدم الإفصاح مع أصحاب المشاريع. تأكد من صحة البيانات لأنها ستظهر في المستندات القانونية.</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-4 space-x-reverse">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsPersonalInfoMode(false)}
                        >
                          إلغاء
                        </Button>
                        <Button 
                          type="submit"
                          disabled={updatePersonalInfoMutation2.isPending}
                        >
                          {updatePersonalInfoMutation2.isPending ? "جاري الحفظ..." : "حفظ البيانات الشخصية"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : profile ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-neutral-500 mb-1">الاسم الكامل</h3>
                        {profile.fullName ? (
                          <p className="text-neutral-700">{profile.fullName}</p>
                        ) : (
                          <p className="text-red-500">غير مكتمل - مطلوب لتوقيع NDA</p>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-neutral-500 mb-1">رقم الهوية الوطنية</h3>
                        {profile.nationalId ? (
                          <p className="text-neutral-700">{profile.nationalId}</p>
                        ) : (
                          <p className="text-red-500">غير مكتمل - مطلوب لتوقيع NDA</p>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-neutral-500 mb-1">رقم الجوال</h3>
                        {profile.phone ? (
                          <p className="text-neutral-700">{profile.phone}</p>
                        ) : (
                          <p className="text-red-500">غير مكتمل - مطلوب لتوقيع NDA</p>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-neutral-500 mb-1">تاريخ الميلاد</h3>
                        {profile.birthDate ? (
                          <p className="text-neutral-700">{new Date(profile.birthDate).toLocaleDateString('ar-SA')}</p>
                        ) : (
                          <p className="text-red-500">غير مكتمل - مطلوب لتوقيع NDA</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500 mb-1">العنوان الوطني</h3>
                      {profile.address ? (
                        <p className="text-neutral-700">{profile.address}</p>
                      ) : (
                        <p className="text-red-500">غير مكتمل - مطلوب لتوقيع NDA</p>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500 mb-1">رقم السجل التجاري</h3>
                      {profile.commercialRegistry ? (
                        <p className="text-neutral-700">{profile.commercialRegistry}</p>
                      ) : (
                        <p className="text-red-500">غير مكتمل - مطلوب لتوقيع NDA</p>
                      )}
                    </div>
                    
                    {!isPersonalInfoComplete && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <AlertCircle className="h-5 w-5 text-red-600 ml-2" />
                          <div className="text-sm text-red-800">
                            <p className="font-medium mb-1">بيانات ناقصة:</p>
                            <p>لا يمكنك توقيع اتفاقيات عدم الإفصاح حتى تكمل جميع البيانات الشخصية المطلوبة.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <p className="text-neutral-600 mb-4">قم بإكمال البيانات الشخصية المطلوبة لتوقيع اتفاقيات عدم الإفصاح</p>
                    <Button onClick={() => setIsPersonalInfoMode(true)}>
                      إضافة البيانات الشخصية
                    </Button>
                  </div>
                )}

                {/* NDA Section - عرض قسم توقيع اتفاقيات عدم الإفصاح عند اكتمال البيانات */}
                {isPersonalInfoComplete && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center mb-3">
                      <div className="h-5 w-5 bg-green-600 rounded-full flex items-center justify-center ml-2">
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-green-800">البيانات الشخصية مكتملة</h3>
                    </div>
                    <p className="text-green-700 mb-4">
                      تم إكمال جميع البيانات الشخصية المطلوبة. يمكنك الآن توقيع اتفاقيات عدم الإفصاح مع المشاريع.
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-green-600">
                        <svg className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        متاح للتوقيع على اتفاقيات عدم الإفصاح
                      </div>
                      <Button 
                        onClick={() => navigate("/projects")}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <svg className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        استعراض المشاريع لتوقيع NDA
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>الرسائل</CardTitle>
                <CardDescription>تواصل مع العملاء المهتمين بخدماتك</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center p-8">
                  <p className="text-neutral-600 mb-4">لمتابعة محادثاتك مع العملاء وأصحاب المشاريع</p>
                  <Button 
                    onClick={() => {
                      // استخدام نظام التنقل wouter للحفاظ على حالة التطبيق وتجنب تحميل الصفحة بالكامل
                      navigate("/messages");
                    }}
                  >
                    <MessagesSquare className="ml-2 h-4 w-4" />
                    الانتقال إلى صفحة الرسائل
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default CompanyDashboard;
