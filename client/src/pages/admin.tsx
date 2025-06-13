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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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