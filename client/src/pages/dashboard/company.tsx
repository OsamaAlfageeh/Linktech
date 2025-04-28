import { useState, useEffect } from "react";
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
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const CompanyDashboard = ({ auth }: CompanyDashboardProps) => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isEditMode, setIsEditMode] = useState(false);

  // Fetch company profile
  const {
    data: profile,
    isLoading: isLoadingProfile,
    error: profileError,
  } = useQuery<CompanyProfile>({
    queryKey: [`/api/companies/user/${auth.user?.id}`],
    queryFn: async () => {
      const response = await fetch(`/api/companies`);
      if (!response.ok) throw new Error("Failed to fetch company profiles");
      const profiles = await response.json();
      // Find the profile for the current user
      const userProfile = profiles.find((p: any) => p.userId === auth.user?.id);
      if (!userProfile) throw new Error("Company profile not found");
      return userProfile;
    },
    enabled: !!auth.user?.id,
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

  // Set form values when profile data is loaded
  useEffect(() => {
    if (profile) {
      form.setValue("description", profile.description);
      form.setValue("skills", profile.skills.join(", "));
      form.setValue("website", profile.website || "");
      form.setValue("location", profile.location || "");
    }
  }, [profile, form]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      if (!profile?.id) throw new Error("Profile ID is missing");
      
      const skills = data.skills.split(",").map((skill) => skill.trim());
      const profileData = {
        ...data,
        skills,
      };
      
      const response = await apiRequest("PATCH", `/api/companies/${profile.id}`, profileData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: [`/api/companies/user/${auth.user?.id}`]});
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

  const onSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

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
        <title>لوحة التحكم | تِكلينك</title>
        <meta name="description" content="لوحة تحكم شركة البرمجة في منصة تِكلينك" />
      </Helmet>

      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-heading mb-2">لوحة التحكم</h1>
          <p className="text-neutral-600">إدارة ملف شركتك والتواصل مع العملاء</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-neutral-100 p-1">
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
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/companies/${profile.id}`}>
                          عرض الملف العام
                        </Link>
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
                  <Button asChild>
                    <Link href="/messages">
                      <MessagesSquare className="ml-2 h-4 w-4" />
                      الانتقال إلى صفحة الرسائل
                    </Link>
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
