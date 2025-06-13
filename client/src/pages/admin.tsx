import React from "react";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Users, Briefcase, Building2, BarChart3, TrendingUp } from "lucide-react";
import { QuickVisitStats } from "@/components/analytics/VisitStatsCard";
import { 
  VisitChart, 
  TopPagesChart, 
  DeviceStatsChart, 
  BrowserStatsChart 
} from "@/components/analytics/VisitChart";
import { Skeleton } from "@/components/ui/skeleton";

// صفحة مسؤول بسيطة بدون تصاريح ومباشرة
const AdminSimplePage = () => {
  const [, navigate] = useLocation();

  // جلب الإحصائيات السريعة للزيارات
  const { data: quickStats, isLoading: quickStatsLoading } = useQuery({
    queryKey: ['/api/admin/quick-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/quick-stats', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('فشل في جلب الإحصائيات السريعة');
      }
      return response.json();
    },
    retry: false
  });

  // جلب إحصائيات الزيارات التفصيلية
  const { data: visitStats, isLoading: visitStatsLoading } = useQuery({
    queryKey: ['/api/admin/visit-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/visit-stats?days=7', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('فشل في جلب إحصائيات الزيارات');
      }
      return response.json();
    },
    retry: false
  });

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <Helmet>
        <title>لوحة المسؤول | لينكتك</title>
      </Helmet>
      
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold">لوحة المسؤول المبسطة</h1>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Button onClick={() => navigate("/")} variant="outline">
              العودة للرئيسية
            </Button>
          </div>
        </div>
        
        {/* إحصائيات الزيارات السريعة */}
        {quickStatsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-20" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : quickStats ? (
          <QuickVisitStats stats={quickStats} />
        ) : (
          <div className="mb-6">
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <BarChart3 className="h-5 w-5 text-yellow-600 ml-2" />
                  <span className="text-yellow-800">
                    لا توجد بيانات زيارات متاحة حالياً. قم بتسجيل الدخول كمسؤول لعرض الإحصائيات.
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">المستخدمون</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">7</div>
              <div className="text-xs text-muted-foreground mt-1">
                3 رواد أعمال, 3 شركات, 1 مسؤول
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">المشاريع</CardTitle>
              <Briefcase className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">5</div>
              <div className="text-xs text-muted-foreground mt-1">
                3 نشطة, 2 مغلقة
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">الشركات</CardTitle>
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">3</div>
              <div className="text-xs text-muted-foreground mt-1">
                2 موثقة, 1 غير موثقة
              </div>
            </CardContent>
          </Card>
        </div>

        {/* الرسوم البيانية التفصيلية للزيارات */}
        {visitStatsLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[300px] w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : visitStats ? (
          <div className="space-y-6 mb-6">
            {/* الرسم البياني للزيارات اليومية */}
            <VisitChart data={visitStats.dailyStats} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* أكثر الصفحات زيارة */}
              <TopPagesChart data={visitStats.topPages} />
              
              {/* توزيع الأجهزة */}
              <DeviceStatsChart data={visitStats.deviceStats} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* المتصفحات الأكثر استخداماً */}
              <BrowserStatsChart data={visitStats.browserStats} />
              
              {/* معلومات إضافية */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center">
                    <TrendingUp className="ml-2 h-5 w-5 text-blue-600" />
                    ملخص الإحصائيات
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {visitStats.totalVisits.toLocaleString('ar-SA')}
                      </div>
                      <div className="text-sm text-blue-700">إجمالي الزيارات</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {visitStats.uniqueVisitors.toLocaleString('ar-SA')}
                      </div>
                      <div className="text-sm text-green-700">زوار فريدون</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {visitStats.pageViews.toLocaleString('ar-SA')}
                      </div>
                      <div className="text-sm text-purple-700">مشاهدات الصفحات</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {Math.round(visitStats.avgTimeSpent / 60)}
                      </div>
                      <div className="text-sm text-orange-700">دقائق متوسط البقاء</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>معلومات هامة</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-700 mb-4">
              تم إنشاء هذه الصفحة المبسطة للتحقق من مشكلة التوجيه فقط. الصفحة الكاملة للمسؤول متاحة في المسار:
            </p>
            <div className="flex justify-center">
              <Button 
                onClick={() => navigate("/dashboard/admin")}
                className="w-full max-w-md"
              >
                الذهاب إلى لوحة المسؤول الكاملة
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSimplePage;