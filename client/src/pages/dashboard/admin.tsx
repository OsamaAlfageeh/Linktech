import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { queryClient } from "@/lib/queryClient";
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
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  FileText, 
  Settings, 
  MessageSquare,
  BarChart,
  AlertCircle,
  Search,
  ChevronDown,
  RefreshCw,
  Calendar,
  Banknote,
  Trash2,
  Edit,
  Eye
} from "lucide-react";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  username: string;
  createdAt: string;
};

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

type Company = {
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
  name?: string;
  username?: string;
};

type AdminDashboardProps = {
  auth: {
    user: {
      id: number;
      name: string;
      email: string;
      role: string;
    };
    isAuthenticated: boolean;
  };
};

const AdminDashboard = ({ auth }: AdminDashboardProps) => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Fetch users
  const {
    data: users,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Fetch projects
  const {
    data: projects,
    isLoading: isLoadingProjects,
    error: projectsError,
  } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  // Fetch companies
  const {
    data: companies,
    isLoading: isLoadingCompanies,
    error: companiesError,
  } = useQuery<Company[]>({
    queryKey: ['/api/companies'],
  });

  // Check if the user is authenticated and an admin
  useEffect(() => {
    if (!auth.isAuthenticated || auth.user?.role !== 'admin') {
      navigate("/");
      toast({
        title: "غير مصرح",
        description: "يجب أن تكون مسؤولاً للوصول إلى لوحة التحكم",
        variant: "destructive",
      });
    }
  }, [auth, navigate, toast]);

  // إذا كان المستخدم غير مسجل دخول أو ليس مسؤولاً، لا تعرض المحتوى
  if (!auth.isAuthenticated || auth.user?.role !== 'admin') {
    return null;
  }

  // إحصائيات عامة
  const totalUsers = users?.length || 0;
  const totalProjects = projects?.length || 0;
  const totalCompanies = companies?.length || 0;
  const openProjects = projects?.filter(p => p.status === "open").length || 0;
  const closedProjects = projects?.filter(p => p.status !== "open").length || 0;
  const entrepreneurs = users?.filter(u => u.role === "entrepreneur").length || 0;
  const companyUsers = users?.filter(u => u.role === "company").length || 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    }).format(date);
  };

  return (
    <>
      <Helmet>
        <title>لوحة التحكم الإدارية | تِكلينك</title>
        <meta name="description" content="لوحة تحكم المسؤول في منصة تِكلينك" />
      </Helmet>

      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-heading mb-2">لوحة التحكم الإدارية</h1>
          <p className="text-neutral-600">مرحباً بك {auth.user?.name}، مراقبة وإدارة المنصة</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-neutral-100 p-1">
            <TabsTrigger value="dashboard" className="flex items-center">
              <LayoutDashboard className="ml-2 h-4 w-4" />
              <span>الرئيسية</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center">
              <Users className="ml-2 h-4 w-4" />
              <span>المستخدمين</span>
            </TabsTrigger>
            <TabsTrigger value="companies" className="flex items-center">
              <Building2 className="ml-2 h-4 w-4" />
              <span>الشركات</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center">
              <FileText className="ml-2 h-4 w-4" />
              <span>المشاريع</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center">
              <Settings className="ml-2 h-4 w-4" />
              <span>الإعدادات</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Overview */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>المستخدمين</CardTitle>
                  <CardDescription>إجمالي عدد المستخدمين</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingUsers ? (
                    <Skeleton className="h-10 w-10" />
                  ) : (
                    <div className="text-3xl font-bold">
                      {totalUsers}
                    </div>
                  )}
                  <div className="mt-2 flex items-center text-sm">
                    <div className="flex-1">
                      <span className="text-neutral-600">رواد أعمال:</span>
                      <span className="font-semibold mr-1">{entrepreneurs}</span>
                    </div>
                    <div className="flex-1">
                      <span className="text-neutral-600">شركات:</span>
                      <span className="font-semibold mr-1">{companyUsers}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>المشاريع</CardTitle>
                  <CardDescription>إجمالي عدد المشاريع</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingProjects ? (
                    <Skeleton className="h-10 w-10" />
                  ) : (
                    <div className="text-3xl font-bold">
                      {totalProjects}
                    </div>
                  )}
                  <div className="mt-2 flex items-center text-sm">
                    <div className="flex-1">
                      <span className="text-neutral-600">مفتوحة:</span>
                      <span className="font-semibold mr-1">{openProjects}</span>
                    </div>
                    <div className="flex-1">
                      <span className="text-neutral-600">مغلقة:</span>
                      <span className="font-semibold mr-1">{closedProjects}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>الشركات</CardTitle>
                  <CardDescription>إجمالي عدد الشركات</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingCompanies ? (
                    <Skeleton className="h-10 w-10" />
                  ) : (
                    <div className="text-3xl font-bold">
                      {totalCompanies}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>نسبة المشاريع</CardTitle>
                  <CardDescription>نسبة المشاريع المفتوحة للمغلقة</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingProjects ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <>
                      <div className="text-sm mb-2 flex justify-between">
                        <span>المفتوحة: {openProjects}</span>
                        <span>المغلقة: {closedProjects}</span>
                      </div>
                      <Progress value={totalProjects > 0 ? (openProjects / totalProjects) * 100 : 0} />
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>أحدث المستخدمين</CardTitle>
                  <CardDescription>آخر المستخدمين المسجلين</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingUsers ? (
                    <div className="space-y-4">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : usersError ? (
                    <div className="text-center p-4">
                      <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                      <p>حدث خطأ أثناء تحميل المستخدمين</p>
                    </div>
                  ) : users && users.length > 0 ? (
                    <div className="space-y-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>المستخدم</TableHead>
                            <TableHead>نوع الحساب</TableHead>
                            <TableHead>تاريخ التسجيل</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.slice(0, 5).map((user) => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">{user.name}</TableCell>
                              <TableCell>
                                <Badge variant={user.role === "entrepreneur" ? "outline" : "secondary"}>
                                  {user.role === "entrepreneur" ? "رائد أعمال" : user.role === "company" ? "شركة" : "مسؤول"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-neutral-600">{formatDate(user.createdAt)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <div className="text-center">
                        <Button variant="outline" onClick={() => setActiveTab("users")}>
                          عرض جميع المستخدمين
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-4">
                      <p className="text-neutral-600">لا يوجد مستخدمين بعد</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>أحدث المشاريع</CardTitle>
                  <CardDescription>آخر المشاريع المضافة</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingProjects ? (
                    <div className="space-y-4">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : projectsError ? (
                    <div className="text-center p-4">
                      <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                      <p>حدث خطأ أثناء تحميل المشاريع</p>
                    </div>
                  ) : projects && projects.length > 0 ? (
                    <div className="space-y-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>عنوان المشروع</TableHead>
                            <TableHead>الحالة</TableHead>
                            <TableHead>تاريخ الإضافة</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {projects.slice(0, 5).map((project) => (
                            <TableRow key={project.id}>
                              <TableCell className="font-medium">{project.title}</TableCell>
                              <TableCell>
                                <Badge variant={project.status === "open" ? "outline" : "secondary"}>
                                  {project.status === "open" ? "مفتوح" : "مغلق"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-neutral-600">{formatDate(project.createdAt)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <div className="text-center">
                        <Button variant="outline" onClick={() => setActiveTab("projects")}>
                          عرض جميع المشاريع
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-4">
                      <p className="text-neutral-600">لا يوجد مشاريع بعد</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle>المستخدمين</CardTitle>
                  <CardDescription>إدارة حسابات المستخدمين</CardDescription>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => queryClient.invalidateQueries({queryKey: ['/api/users']})}
                    className="transition-all duration-300 hover:shadow-md"
                  >
                    <RefreshCw className="ml-2 h-4 w-4" />
                    تحديث
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : usersError ? (
                  <div className="text-center p-8">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-lg font-semibold mb-2">حدث خطأ أثناء تحميل المستخدمين</p>
                    <p className="text-neutral-600 mb-4">لم نتمكن من جلب بيانات المستخدمين. يرجى المحاولة مرة أخرى.</p>
                    <Button onClick={() => queryClient.invalidateQueries({queryKey: ['/api/users']})}>
                      إعادة المحاولة
                    </Button>
                  </div>
                ) : users && users.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>المعرف</TableHead>
                        <TableHead>الاسم</TableHead>
                        <TableHead>البريد الإلكتروني</TableHead>
                        <TableHead>اسم المستخدم</TableHead>
                        <TableHead>نوع الحساب</TableHead>
                        <TableHead>تاريخ التسجيل</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.id}</TableCell>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === "entrepreneur" ? "outline" : user.role === "company" ? "secondary" : "default"}>
                              {user.role === "entrepreneur" ? "رائد أعمال" : user.role === "company" ? "شركة" : "مسؤول"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-neutral-600">{formatDate(user.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2 space-x-reverse">
                              <Button size="sm" variant="ghost">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center p-8">
                    <p className="text-neutral-600">لا يوجد مستخدمين</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Companies Tab */}
          <TabsContent value="companies" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle>الشركات</CardTitle>
                  <CardDescription>إدارة الشركات المسجلة</CardDescription>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => queryClient.invalidateQueries({queryKey: ['/api/companies']})}
                    className="transition-all duration-300 hover:shadow-md"
                  >
                    <RefreshCw className="ml-2 h-4 w-4" />
                    تحديث
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingCompanies ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : companiesError ? (
                  <div className="text-center p-8">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-lg font-semibold mb-2">حدث خطأ أثناء تحميل الشركات</p>
                    <p className="text-neutral-600 mb-4">لم نتمكن من جلب بيانات الشركات. يرجى المحاولة مرة أخرى.</p>
                    <Button onClick={() => queryClient.invalidateQueries({queryKey: ['/api/companies']})}>
                      إعادة المحاولة
                    </Button>
                  </div>
                ) : companies && companies.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>المعرف</TableHead>
                        <TableHead>اسم الشركة</TableHead>
                        <TableHead>الموقع</TableHead>
                        <TableHead>التقييم</TableHead>
                        <TableHead>المهارات</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companies.map((company) => (
                        <TableRow key={company.id}>
                          <TableCell>{company.id}</TableCell>
                          <TableCell className="font-medium">{company.name || 'غير محدد'}</TableCell>
                          <TableCell>{company.location || 'غير محدد'}</TableCell>
                          <TableCell>{company.rating || 0} ({company.reviewCount || 0})</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {company.skills.slice(0, 2).map((skill, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {company.skills.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{company.skills.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2 space-x-reverse">
                              <Button size="sm" variant="ghost">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center p-8">
                    <p className="text-neutral-600">لا توجد شركات مسجلة</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle>المشاريع</CardTitle>
                  <CardDescription>إدارة المشاريع على المنصة</CardDescription>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => queryClient.invalidateQueries({queryKey: ['/api/projects']})}
                    className="transition-all duration-300 hover:shadow-md"
                  >
                    <RefreshCw className="ml-2 h-4 w-4" />
                    تحديث
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingProjects ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : projectsError ? (
                  <div className="text-center p-8">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-lg font-semibold mb-2">حدث خطأ أثناء تحميل المشاريع</p>
                    <p className="text-neutral-600 mb-4">لم نتمكن من جلب بيانات المشاريع. يرجى المحاولة مرة أخرى.</p>
                    <Button onClick={() => queryClient.invalidateQueries({queryKey: ['/api/projects']})}>
                      إعادة المحاولة
                    </Button>
                  </div>
                ) : projects && projects.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>المعرف</TableHead>
                        <TableHead>العنوان</TableHead>
                        <TableHead>رائد الأعمال</TableHead>
                        <TableHead>الميزانية</TableHead>
                        <TableHead>المدة</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>تاريخ الإنشاء</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projects.map((project) => (
                        <TableRow key={project.id}>
                          <TableCell>{project.id}</TableCell>
                          <TableCell className="font-medium">{project.title}</TableCell>
                          <TableCell>{project.userId}</TableCell>
                          <TableCell>{project.budget}</TableCell>
                          <TableCell>{project.duration}</TableCell>
                          <TableCell>
                            <Badge variant={project.status === "open" ? "outline" : "secondary"}>
                              {project.status === "open" ? "مفتوح" : "مغلق"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-neutral-600">{formatDate(project.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2 space-x-reverse">
                              <Button size="sm" variant="ghost">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center p-8">
                    <p className="text-neutral-600">لا توجد مشاريع</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات المنصة</CardTitle>
                <CardDescription>تخصيص إعدادات المنصة</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-600">قريباً</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default AdminDashboard;