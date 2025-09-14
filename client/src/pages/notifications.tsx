import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Helmet } from 'react-helmet';
import { Bell, Check, X, Clock, MessageCircle, FileText, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Notification {
  id: number;
  type: 'message' | 'project' | 'proposal' | 'payment' | 'system';
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  metadata?: {
    projectId?: number;
    userId?: number;
    amount?: number;
  };
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'message':
      return <MessageCircle className="h-5 w-5 text-blue-500" />;
    case 'project':
      return <FileText className="h-5 w-5 text-green-500" />;
    case 'proposal':
      return <Users className="h-5 w-5 text-purple-500" />;
    case 'payment':
      return <Clock className="h-5 w-5 text-orange-500" />;
    default:
      return <Bell className="h-5 w-5 text-gray-500" />;
  }
};

const getNotificationTypeLabel = (type: string) => {
  switch (type) {
    case 'message':
      return 'رسالة جديدة';
    case 'project':
      return 'مشروع';
    case 'proposal':
      return 'عرض';
    case 'payment':
      return 'دفع';
    default:
      return 'إشعار';
  }
};

const NotificationItem: React.FC<{ notification: Notification; onMarkAsRead: (id: number) => void }> = ({ 
  notification, 
  onMarkAsRead 
}) => {
  const formattedDate = format(new Date(notification.createdAt), 'PPP', { locale: ar });
  const formattedTime = format(new Date(notification.createdAt), 'p', { locale: ar });

  return (
    <Card className={`transition-all duration-200 ${notification.isRead ? 'bg-gray-50' : 'bg-white border-r-4 border-r-primary'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {getNotificationIcon(notification.type)}
            <div>
              <CardTitle className="text-base">{notification.title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {getNotificationTypeLabel(notification.type)}
                </Badge>
                {!notification.isRead && (
                  <Badge variant="default" className="text-xs">
                    جديد
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {!notification.isRead && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMarkAsRead(notification.id)}
              className="h-8 w-8 p-0"
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="text-sm leading-relaxed mb-3">
          {notification.content}
        </CardDescription>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{formattedDate} في {formattedTime}</span>
          {notification.actionUrl && (
            <Button 
              variant="link" 
              size="sm" 
              className="h-auto p-0 text-xs"
              onClick={() => window.location.href = notification.actionUrl!}
            >
              عرض التفاصيل
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const Notifications: React.FC = () => {
  const { data: notifications = [], isLoading, error } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    retry: false,
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to mark notification as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to mark all notifications as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  const handleMarkAsRead = (notificationId: number) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="text-center py-12">
          <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">خطأ في تحميل الإشعارات</h2>
          <p className="text-gray-600">حدث خطأ أثناء تحميل إشعاراتك. يرجى المحاولة مرة أخرى.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>الإشعارات - لينكتك</title>
        <meta name="description" content="إشعارات وتنبيهات المنصة" />
      </Helmet>

      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">الإشعارات</h1>
              <p className="text-gray-600">
                {unreadCount > 0 
                  ? `لديك ${unreadCount} إشعار غير مقروء` 
                  : 'جميع الإشعارات مقروءة'
                }
              </p>
            </div>
            {unreadCount > 0 && (
              <Button 
                onClick={handleMarkAllAsRead}
                variant="outline"
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                تعيين الكل كمقروء
              </Button>
            )}
          </div>

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">لا توجد إشعارات</h2>
              <p className="text-gray-600">ستظهر إشعاراتك هنا عند وصولها.</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                  />
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Notification Settings */}
          <Separator className="my-8" />
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">إعدادات الإشعارات</h3>
            <p className="text-gray-600 mb-4">
              يمكنك تخصيص أنواع الإشعارات التي تريد استلامها من خلال إعدادات حسابك.
            </p>
            <Button variant="outline" onClick={() => window.location.href = '/settings'}>
              إدارة الإعدادات
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Notifications;