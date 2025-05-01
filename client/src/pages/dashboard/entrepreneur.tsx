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
import { DropzoneUploader, type UploadedFile } from "@/components/ui/dropzone-uploader";

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
  Loader2,
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
  attachments?: UploadedFile[];
  requiresNda?: boolean;
  ndaId?: number;
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
  requiresNda: z.boolean().optional().default(false),
  status: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

const EntrepreneurDashboard = ({ auth }: EntrepreneurDashboardProps) => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editProjectId, setEditProjectId] = useState<number | null>(null);
  const [projectAttachments, setProjectAttachments] = useState<UploadedFile[]>([]);
  const [editProjectAttachments, setEditProjectAttachments] = useState<UploadedFile[]>([]);

  // Check URL query parameters for actions (create or edit project)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get("action");
    const tab = urlParams.get("tab");
    
    // Set the active tab based on URL parameter
    if (tab) {
      setActiveTab(tab);
    }
    
    if (action === "create-project") {
      setActiveTab("projects");
      setIsCreateDialogOpen(true);
      // Clean up the URL
      navigate("/dashboard/entrepreneur", { replace: true });
    } 
    else if (action === "edit" && urlParams.get("projectId")) {
      // Handle project editing
      const projectId = parseInt(urlParams.get("projectId") || "0");
      if (projectId > 0) {
        setActiveTab("projects");
        setEditProjectId(projectId);
        setIsEditDialogOpen(true);
        // Don't clean up URL yet to allow refresh during edit
      }
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
      requiresNda: false,
    },
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormValues) => {
      const skills = data.skills.split(",").map((skill) => skill.trim());
      const projectData = {
        ...data,
        skills,
        attachments: projectAttachments.length > 0 ? projectAttachments : undefined,
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
      setProjectAttachments([]);
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
  
  const handleAttachmentsChange = (files: UploadedFile[]) => {
    setProjectAttachments(files);
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
        <title>لوحة التحكم | لينكتك</title>
        <meta name="description" content="لوحة تحكم رائد الأعمال في منصة لينكتك" />
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
                  <Button className="hover-button-scale transition-all duration-300 hover:shadow-md">
                    <PlusCircle className="ml-2 h-4 w-4" />
                    إضافة مشروع جديد
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
                      
                      <div className="space-y-2">
                        <FormLabel>المرفقات (اختياري)</FormLabel>
                        <DropzoneUploader 
                          onChange={handleAttachmentsChange}
                          onFilesChange={handleAttachmentsChange}
                          initialFiles={projectAttachments}
                          maxFiles={5}
                          acceptedFileTypes={{
                            'image/jpeg': ['.jpg', '.jpeg'],
                            'image/png': ['.png'],
                            'image/gif': ['.gif'],
                            'application/pdf': ['.pdf'],
                            'application/msword': ['.doc', '.docx'],
                            'application/vnd.ms-excel': ['.xls', '.xlsx'],
                          }}
                        />
                        <p className="text-xs text-neutral-500">
                          يمكنك إرفاق صور توضيحية أو مستندات لتوضيح متطلبات المشروع بشكل أفضل.
                        </p>
                      </div>
                      
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
                          className="hover-button-scale transition-all duration-300 hover:shadow-md"
                        >
                          {createProjectMutation.isPending ? (
                            <div className="flex items-center justify-center">
                              <svg className="animate-spin ml-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>جاري الإنشاء...</span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="ml-1.5 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              <span>إنشاء المشروع</span>
                            </div>
                          )}
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
                  <Button 
                    onClick={() => queryClient.invalidateQueries({queryKey: [`/api/users/${auth.user?.id}/projects`]})}
                    className="hover-button-scale transition-all duration-300 pulse-effect"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="ml-1.5 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
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
                  <Button 
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="hover-button-scale transition-all duration-300 hover:shadow-md float-animation"
                  >
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
                  <Button 
                    asChild
                    className="hover-button-scale transition-all duration-300 hover:shadow-md"
                  >
                    <Link href="/messages" className="flex items-center">
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

// EditProjectForm component for editing projects
interface EditProjectFormProps {
  projectId: number;
  onClose: () => void;
  onSuccess: () => void;
}

const EditProjectForm = ({ projectId, onClose, onSuccess }: EditProjectFormProps) => {
  const { toast } = useToast();
  const [editAttachments, setEditAttachments] = useState<UploadedFile[]>([]);
  const [loadingProject, setLoadingProject] = useState(true);
  
  // Edit form
  const editForm = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      description: "",
      budget: "",
      duration: "",
      skills: "",
      status: "open" // Default status
    },
  });
  
  // Fetch the specific project to edit
  const { data: project } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !!projectId,
  });

  // Handle project data once it's loaded
  useEffect(() => {
    if (project) {
      setLoadingProject(false);
      // If project has attachments, set them
      if (project.attachments) {
        setEditAttachments(project.attachments as UploadedFile[]);
      }
      
      // Set form default values from project data
      editForm.reset({
        title: project.title,
        description: project.description,
        budget: project.budget,
        duration: project.duration,
        skills: project.skills.join(", "), // Convert array to comma-separated string
        status: project.status
      });
    }
  }, [project, editForm]);

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormValues) => {
      const skills = data.skills.split(",").map((skill) => skill.trim());
      const projectData = {
        ...data,
        skills,
        attachments: editAttachments.length > 0 ? editAttachments : undefined,
      };
      
      const response = await apiRequest("PATCH", `/api/projects/${projectId}`, projectData);
      return response.json();
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "حدث خطأ",
        description: "لم نتمكن من تحديث المشروع، يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    },
  });

  const handleEditSubmit = (data: ProjectFormValues) => {
    updateProjectMutation.mutate(data);
  };
  
  const handleEditAttachmentsChange = (files: UploadedFile[]) => {
    setEditAttachments(files);
  };

  if (loadingProject) {
    return (
      <div className="py-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
        <p>جاري تحميل بيانات المشروع...</p>
      </div>
    );
  }

  return (
    <Form {...editForm}>
      <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-6">
        <FormField
          control={editForm.control}
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
          control={editForm.control}
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
            control={editForm.control}
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
            control={editForm.control}
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
          control={editForm.control}
          name="skills"
          render={({ field }) => (
            <FormItem>
              <FormLabel>المهارات المطلوبة</FormLabel>
              <FormControl>
                <Input 
                  placeholder="أدخل المهارات مفصولة بفواصل, مثال: React, Node.js, تصميم واجهات" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={editForm.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>حالة المشروع</FormLabel>
              <div className="flex items-center space-x-4 space-x-reverse">
                <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                  <input 
                    type="radio" 
                    name="status"
                    className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                    value="open"
                    checked={field.value === "open"}
                    onChange={() => field.onChange("open")}
                  />
                  <span className="mr-2">مفتوح</span>
                </label>
                <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                  <input 
                    type="radio" 
                    name="status"
                    className="w-4 h-4 text-neutral-500 border-gray-300 focus:ring-neutral-500"
                    value="closed"
                    checked={field.value === "closed"}
                    onChange={() => field.onChange("closed")}
                  />
                  <span className="mr-2">مغلق</span>
                </label>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div>
          <div className="mb-2">
            <FormLabel>مرفقات المشروع (اختياري)</FormLabel>
            <p className="text-sm text-neutral-500 mb-2">
              يمكنك إرفاق صور، وثائق، أو أي ملفات أخرى متعلقة بمشروعك
            </p>
          </div>
          <DropzoneUploader 
            onFilesChange={handleEditAttachmentsChange} 
            maxFiles={5}
            initialFiles={editAttachments}
            acceptedFileTypes={{
              'image/jpeg': ['.jpg', '.jpeg'],
              'image/png': ['.png'],
              'image/gif': ['.gif'],
              'application/pdf': ['.pdf'],
              'application/msword': ['.doc', '.docx'],
              'application/vnd.ms-excel': ['.xls', '.xlsx'],
            }}
          />
        </div>
        <div className="flex justify-end space-x-2 space-x-reverse">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            إلغاء
          </Button>
          <Button type="submit" disabled={updateProjectMutation.isPending}>
            {updateProjectMutation.isPending ? (
              <>
                <span className="ml-2 inline-block animate-spin">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </span>
                جاري التحديث...
              </>
            ) : (
              "تحديث المشروع"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default EntrepreneurDashboard;
