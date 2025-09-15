import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Mail, MessageSquare, DollarSign, Loader2 } from 'lucide-react';
import { useAuth } from "@/App";

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  messageNotifications: boolean;
  offerNotifications: boolean;
  systemNotifications: boolean;
}

const Settings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    messageNotifications: true,
    offerNotifications: true,
    systemNotifications: true,
  });

  // جلب إعدادات الإشعارات الحالية
  const { data: userSettings, isLoading } = useQuery({
    queryKey: ['user-settings'],
    queryFn: async () => {
      const response = await fetch('/api/user/settings', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      return response.json();
    },
    enabled: !!user
  });

  // تحديث الإعدادات عند جلب البيانات
  React.useEffect(() => {
    if (userSettings) {
      setSettings({
        emailNotifications: userSettings.emailNotifications ?? true,
        pushNotifications: userSettings.pushNotifications ?? true,
        messageNotifications: userSettings.messageNotifications ?? true,
        offerNotifications: userSettings.offerNotifications ?? true,
        systemNotifications: userSettings.systemNotifications ?? true,
      });
    }
  }, [userSettings]);

  // حفظ الإعدادات
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: NotificationSettings) => {
      const response = await fetch('/api/user/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newSettings),
      });
      
      if (!response.ok) {
        throw new Error('فشل في حفظ الإعدادات');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم حفظ الإعدادات",
        description: "تم تحديث إعدادات الإشعارات بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في حفظ الإعدادات",
        description: error.message || "حدث خطأ أثناء حفظ الإعدادات",
        variant: "destructive",
      });
    },
  });

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
  };

  const handleSave = () => {
    saveSettingsMutation.mutate(settings);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
      <Helmet>
        <title>إعدادات الحساب | لينكتك</title>
      </Helmet>

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">إعدادات الحساب</h1>
        <p className="text-neutral-600">إدارة تفضيلات الإشعارات وإعدادات الحساب</p>
      </div>

      <div className="space-y-6">
        {/* إعدادات الإشعارات */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              إعدادات الإشعارات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* إشعارات البريد الإلكتروني */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  إشعارات البريد الإلكتروني
                </Label>
                <p className="text-sm text-neutral-500">
                  استقبال الإشعارات عبر البريد الإلكتروني
                </p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(value) => handleSettingChange('emailNotifications', value)}
              />
            </div>

            <Separator />

            {/* إشعارات الرسائل */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  إشعارات الرسائل
                </Label>
                <p className="text-sm text-neutral-500">
                  إشعارات عند استقبال رسائل جديدة
                </p>
              </div>
              <Switch
                checked={settings.messageNotifications}
                onCheckedChange={(value) => handleSettingChange('messageNotifications', value)}
              />
            </div>

            <Separator />

            {/* إشعارات العروض */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  إشعارات العروض
                </Label>
                <p className="text-sm text-neutral-500">
                  إشعارات حول العروض والمقترحات الجديدة
                </p>
              </div>
              <Switch
                checked={settings.offerNotifications}
                onCheckedChange={(value) => handleSettingChange('offerNotifications', value)}
              />
            </div>

            <Separator />

            {/* إشعارات النظام */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  إشعارات النظام
                </Label>
                <p className="text-sm text-neutral-500">
                  إشعارات النظام والتحديثات المهمة
                </p>
              </div>
              <Switch
                checked={settings.systemNotifications}
                onCheckedChange={(value) => handleSettingChange('systemNotifications', value)}
              />
            </div>

            <div className="pt-4">
              <Button 
                onClick={handleSave}
                disabled={saveSettingsMutation.isPending}
                className="w-full sm:w-auto"
              >
                {saveSettingsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  'حفظ الإعدادات'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* معلومات إضافية */}
        <Card>
          <CardHeader>
            <CardTitle>معلومات مهمة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-neutral-600">
              <p>
                • يمكنك تخصيص أنواع الإشعارات التي تريد استقبالها حسب تفضيلاتك
              </p>
              <p>
                • إشعارات النظام مهمة لأمان حسابك ولا يمكن إيقافها بالكامل
              </p>
              <p>
                • ستستمر في استقبال الإشعارات المهمة المتعلقة بأمان الحساب حتى لو تم إيقاف الإشعارات
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;