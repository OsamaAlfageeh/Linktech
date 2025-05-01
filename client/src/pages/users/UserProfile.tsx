import React from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, MailIcon, User2Icon } from "lucide-react";
import { getInitials, formatDate } from "@/lib/utils";

const UserProfile = () => {
  const { id } = useParams();
  const userId = parseInt(id || "0");

  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/users", userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        throw new Error("فشل في جلب بيانات المستخدم");
      }
      return response.json();
    },
    enabled: !!userId && !isNaN(userId),
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container mx-auto p-6">
        <Card className="bg-destructive/10 border-destructive/30 mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-destructive mb-2">خطأ في تحميل بيانات المستخدم</h2>
            <p className="text-neutral-700">لم نتمكن من العثور على المستخدم المطلوب.</p>
          </CardContent>
        </Card>
        <Button variant="outline" onClick={() => window.history.back()}>
          العودة للخلف
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <Helmet>
        <title>{user.name} | لينكتك</title>
      </Helmet>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>معلومات الشخصية</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-bold mb-1">{user.name}</h2>
              <p className="text-neutral-500 mb-3">{user.username}</p>
              
              <div className="w-full space-y-2 mt-2">
                <div className="flex items-center p-2 rounded-md border border-neutral-200 bg-neutral-50">
                  <MailIcon className="h-4 w-4 text-neutral-500 mr-2 rtl:ml-2 rtl:mr-0" />
                  <span className="text-sm">{user.email}</span>
                </div>
                <div className="flex items-center p-2 rounded-md border border-neutral-200 bg-neutral-50">
                  <User2Icon className="h-4 w-4 text-neutral-500 mr-2 rtl:ml-2 rtl:mr-0" />
                  <span className="text-sm">{user.role === "admin" ? "مسؤول" : user.role === "company" ? "شركة" : "رائد أعمال"}</span>
                </div>
              </div>
              
              <div className="w-full mt-4 pt-4 border-t border-neutral-200">
                <p className="text-sm text-neutral-500">تاريخ الانضمام</p>
                <p className="font-medium">{formatDate(new Date(user.createdAt))}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>الملف الشخصي</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">معلومات إضافية</h3>
                  <p className="text-neutral-600">
                    هذا المستخدم لديه دور <span className="font-medium">{user.role === "admin" ? "مسؤول" : user.role === "company" ? "شركة" : "رائد أعمال"}</span> في المنصة.
                  </p>
                </div>

                {user.role === "company" && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">معلومات الشركة</h3>
                    <p className="text-neutral-600">
                      لعرض المزيد من المعلومات عن الشركة، يرجى زيارة صفحة الشركة المرتبطة بهذا الحساب.
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-2"
                      onClick={() => window.location.href = `/companies/${user.id}`}
                    >
                      عرض صفحة الشركة
                    </Button>
                  </div>
                )}

                {user.role === "entrepreneur" && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">المشاريع</h3>
                    <p className="text-neutral-600">
                      لعرض مشاريع رائد الأعمال، يرجى زيارة صفحة المشاريع الخاصة به.
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-2"
                      onClick={() => window.location.href = `/projects?userId=${user.id}`}
                    >
                      عرض المشاريع
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <Button variant="outline" onClick={() => window.history.back()}>
          العودة للخلف
        </Button>
      </div>
    </div>
  );
};

export default UserProfile;