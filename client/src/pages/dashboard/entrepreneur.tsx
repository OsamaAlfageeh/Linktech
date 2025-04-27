import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  LayoutDashboard,
  FileEdit,
  MessagesSquare,
  PlusCircle,
  X,
  AlertCircle,
  Calendar,
  Clock,
  Banknote,
} from "lucide-react";

type Project = {
  id: number;
  title: string;
  description: string;
  budget: string;
  duration: string;
  skills: string[];
  status: string;
  highlightStatus?: string;
  userId: number;
  createdAt: string;
};

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type EntrepreneurDashboardProps = {
  auth: {
    user: User;
    isAuthenticated: boolean;
    isEntrepreneur: boolean;
  };
};

// Create project form schema
const projectSchema = z.object({
  title: z.string().min(5, "عنوان المشروع مطلوب ويجب أن يكون أكثر من 5 أحرف"),
  description: z.string().min(20, "وصف المشروع مطلوب ويجب أن يكون مفصلاً (20 حرف على الأقل)"),
  budget: z.string().min(1, "الميزانية المتوقعة مطلوبة"),
  duration: z.string().min(1, "المدة المتوقعة مطلوبة"),
  skills: z.string().min(1, "المهارات المطلوبة مطلوبة"),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

const EntrepreneurDashboard = ({ auth }: EntrepreneurDashboardProps) => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Check if URL has a query parameter for creating a project
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("action") === "create-project") {
      setActiveTab("projects");
      setIsCreateDialogOpen(true);
      // Clean up the URL
      navigate("/dashboard/entrepreneur", { replace: true });
    }
  }, [navigate]);

  // Fetch projects for this entrepreneur
  const {
    data: projects,
    isLoading: isLoadingProjects,
    error: projectsError,
  } = useQuery<Project[]>({
    queryKey: [`/api/users/${auth.user?.id}/projects`],
    enabled: !!auth.user?.id,
  });

  // Form for creating a new project
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      description: "",
      budget: "",
      duration: "",
      skills: "",
    },
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormValues) => {
      const skills = data.skills.split(",").map((skill) => skill.trim());
      const projectData = {
        ...data,
        skills,
      };
      
      const response = await apiRequest("POST", "/api/projects", projectData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: [`/api/users/${auth.user?.id}/projects`]});
      toast({
        title: "تم إنشاء المشروع بنجاح",
        description: "تم نشر مشروعك وأصبح متاحاً للشركات للاطلاع عليه.",
      });
      form.reset();
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "حدث خطأ",
        description: "لم نتمكن من إنشاء المشروع، يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProjectFormValues) => {
    createProjectMutation.mutate(data);
  };

  // If user is not authenticated or not an entrepreneur, redirect to home
  useEffect(() => {
    if (!auth.isAuthenticated || !auth.isEntrepreneur) {
      navigate("/");
    }
  }, [auth, navigate]);

  if (!auth.isAuthenticated || !auth.isEntrepreneur) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>لوحة التحكم | تِكلينك</title>
        <meta name="description" content="لوحة تحكم رائد الأعمال في منصة تِكلينك" />
      </Helmet>

      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-heading mb-2">لوحة التحكم</h1>
          <p className="text-neutral-600">إدارة مشاريعك ومتابعة تطورها</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-neutral-100 p-1">
            <TabsTrigger value="dashboard" className="flex items-center">
              <LayoutDashboard className="ml-2 h-4 w-4" />
              <span>الرئيسية</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center">
              <FileEdit className="ml-2 h-4 w-4" />
              <span>المشاريع</span>
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
                  <CardTitle>المشاريع النشطة</CardTitle>
                  <CardDescription>المشاريع المفتوحة حالياً</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingProjects ? (
                    <Skeleton className="h-10 w-10" />
                  ) : (
                    <div className="text-3xl font-bold">
                      {projects?.filter(p => p.status === "open").length || 0}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>المشاريع المنجزة</CardTitle>
                  <CardDescription>المشاريع التي تم إنجازها</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingProjects ? (
                    <Skeleton className="h-10 w-10" />
                  ) : (
                    <div className="text-3xl font-bold">
                      {projects?.filter(p => p.status !== "open").length || 0}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>مجموع المشاريع</CardTitle>
                  <CardDescription>إجمالي عدد المشاريع</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingProjects ? (
                    <Skeleton className="h-10 w-10" />
                  ) : (
                    <div className="text-3xl font-bold">
                      {projects?.length || 0}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>أحدث المشاريع</CardTitle>
                <CardDescription>آخر المشاريع التي قمت بإضافتها</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingProjects ? (
                  <div className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : projectsError ? (
                  <div className="text-center p-4">
                    <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p>حدث خطأ أثناء تحميل المشاريع</p>
                  </div>
                ) : projects && projects.length > 0 ? (
                  <div className="space-y-4">
                    {projects.slice(0, 3).map((project) => (
                      <div key={project.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <Link href={`/projects/${project.id}`} className="text-lg font-semibold text-primary hover:underline">
                              {project.title}
                            </Link>
                            <div className="flex items-center text-sm text-neutral-600">
                              <Clock className="ml-1 h-3 w-3" />
                              <span>{formatDate(project.createdAt)}</span>
                            </div>
                          </div>
                          <Badge variant={project.status === "open" ? "outline" : "secondary"}>
                            {project.status === "open" ? "مفتوح" : "مغلق"}
                          </Badge>
                        </div>
                        <p className="text-neutral-600 line-clamp-2 text-sm mb-2">{project.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-neutral-600 flex items-center">
                            <Banknote className="ml-1 h-3 w-3 text-[hsl(160,84%,39%)]" />
                            {project.budget}
                          </span>
                          <span className="text-sm text-neutral-600 flex items-center">
                            <Calendar className="ml-1 h-3 w-3" />
                            {project.duration}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div className="text-center">
                      <Button variant="outline" asChild>
                        <Link href="#" onClick={() => setActiveTab("projects")}>
                          عرض جميع المشاريع
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <p className="text-neutral-600 mb-4">ليس لديك أي مشاريع بعد</p>
                    <Button onClick={() => {
                      setActiveTab("projects");
                      setIsCreateDialogOpen(true);
                    }}>
                      <PlusCircle className="ml-2 h-4 w-4" />
                      إنشاء مشروع جديد
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold font-heading">مشاريعي</h2>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="ml-2 h-4 w-4" />
                    إضافة مشروع جديد
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>إنشاء مشروع جديد</DialogTitle>
                    <DialogDescription>
                      أضف تفاصيل مشروعك ليتمكن المطورون من الاطلاع عليه وتقديم عروضهم.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>عنوان المشروع</FormLabel>
                            <FormControl>
                              <Input placeholder="مثال: تطبيق متجر إلكتروني" {...field} />
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
                            <FormLabel>وصف المشروع</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="اشرح تفاصيل مشروعك، متطلباته، وأهدافه" 
                                {...field} 
                                rows={5}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="budget"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>الميزانية المتوقعة</FormLabel>
                              <FormControl>
                                <Input placeholder="مثال: 5,000 - 10,000 ريال" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="duration"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>المدة المتوقعة</FormLabel>
                              <FormControl>
                                <Input placeholder="مثال: 2-3 أشهر" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="skills"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>المهارات المطلوبة</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="مثال: React, Node.js, تصميم واجهات (مفصولة بفواصل)" 
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-4 space-x-reverse">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCreateDialogOpen(false)}
                        >
                          إلغاء
                        </Button>
                        <Button 
                          type="submit"
                          disabled={createProjectMutation.isPending}
                        >
                          {createProjectMutation.isPending ? "جاري الإنشاء..." : "إنشاء المشروع"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {isLoadingProjects ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : projectsError ? (
              <Card>
                <CardContent className="text-center p-8">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <p className="text-lg font-semibold mb-2">حدث خطأ أثناء تحميل المشاريع</p>
                  <p className="text-neutral-600 mb-4">لم نتمكن من جلب بيانات مشاريعك. يرجى المحاولة مرة أخرى.</p>
                  <Button onClick={() => queryClient.invalidateQueries({queryKey: [`/api/users/${auth.user?.id}/projects`]})}>
                    إعادة المحاولة
                  </Button>
                </CardContent>
              </Card>
            ) : projects && projects.length > 0 ? (
              <div className="space-y-4">
                {projects.map((project) => (
                  <Card key={project.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <Link href={`/projects/${project.id}`} className="text-lg font-semibold text-primary hover:underline">
                              {project.title}
                            </Link>
                            {project.highlightStatus && (
                              <Badge className="mr-2 bg-accent text-white">{project.highlightStatus}</Badge>
                            )}
                          </div>
                          <div className="flex items-center text-sm text-neutral-600">
                            <Clock className="ml-1 h-3 w-3" />
                            <span>{formatDate(project.createdAt)}</span>
                          </div>
                        </div>
                        <Badge variant={project.status === "open" ? "outline" : "secondary"}>
                          {project.status === "open" ? "مفتوح" : "مغلق"}
                        </Badge>
                      </div>
                      <p className="text-neutral-600 my-3">{project.description.substring(0, 150)}...</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {project.skills.map((skill, index) => (
                          <Badge key={index} variant="outline" className="bg-neutral-100 text-neutral-700">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <div className="flex space-x-4 space-x-reverse">
                          <span className="text-sm text-neutral-600 flex items-center">
                            <Banknote className="ml-1 h-4 w-4 text-[hsl(160,84%,39%)]" />
                            {project.budget}
                          </span>
                          <span className="text-sm text-neutral-600 flex items-center">
                            <Calendar className="ml-1 h-4 w-4" />
                            {project.duration}
                          </span>
                        </div>
                        <div className="flex space-x-2 space-x-reverse">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/projects/${project.id}`}>
                              عرض التفاصيل
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/messages?projectId=${project.id}`}>
                              الرسائل
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center p-8">
                  <p className="text-neutral-600 mb-4">ليس لديك أي مشاريع حالياً</p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <PlusCircle className="ml-2 h-4 w-4" />
                    إنشاء مشروع جديد
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>الرسائل</CardTitle>
                <CardDescription>تواصل مع شركات البرمجة المهتمة بمشاريعك</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center p-8">
                  <p className="text-neutral-600 mb-4">لمتابعة محادثاتك مع شركات البرمجة</p>
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

export default EntrepreneurDashboard;
