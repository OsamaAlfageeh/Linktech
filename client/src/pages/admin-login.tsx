import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Helmet } from "react-helmet";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export default function AdminLogin() {
  const [location, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // إنشاء مستخدم المسؤول
  const createAdminMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/create');
      if (!response.ok) {
        throw new Error('Failed to create admin account');
      }
      return await response.json();
    },
    onSuccess: (data) => {
      console.log('Admin account created:', data);
    },
    onError: (error) => {
      console.error('Error creating admin account:', error);
    }
  });

  // تسجيل دخول المسؤول
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/auth/user'], data);
      navigate("/dashboard/admin");
    },
    onError: (error: any) => {
      setError('خطأ في تسجيل الدخول. تأكد من اسم المستخدم وكلمة المرور.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('الرجاء إدخال اسم المستخدم وكلمة المرور');
      return;
    }
    
    loginMutation.mutate({ username, password });
  };

  const handleCreateAdmin = () => {
    createAdminMutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-zinc-950 to-slate-900 p-4">
      <Helmet>
        <title>تسجيل دخول المسؤول | تِكلينك</title>
      </Helmet>
      <Card className="w-full max-w-md bg-white/95 backdrop-blur shadow-xl rounded-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">تسجيل دخول المسؤول</CardTitle>
          <CardDescription>
            أدخل بيانات الدخول للوصول إلى لوحة تحكم المسؤول
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input
                id="username"
                type="text"
                placeholder="أدخل اسم المستخدم"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                placeholder="أدخل كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
              />
            </div>
            {error && (
              <div className="bg-red-50 p-3 rounded text-red-800 text-sm">
                {error}
              </div>
            )}

            <div className="text-sm text-neutral-500">
              <p>حساب المسؤول الافتراضي:</p>
              <p>اسم المستخدم: admin</p>
              <p>كلمة المرور: admin123</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button 
              type="submit" 
              className="w-full" 
              variant="default"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>
            <Button 
              type="button" 
              className="w-full" 
              variant="outline"
              onClick={handleCreateAdmin}
              disabled={createAdminMutation.isPending}
            >
              {createAdminMutation.isPending ? "جاري إنشاء الحساب..." : "إنشاء حساب مسؤول"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}