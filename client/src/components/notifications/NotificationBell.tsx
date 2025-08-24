import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Bell, BellRing } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import UnreadIndicator from "./UnreadIndicator";
import { apiRequest } from "@/lib/queryClient";

interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  content: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
  metadata?: any;
}

interface NotificationBellProps {
  className?: string;
}

const NotificationBell = ({ className = "" }: NotificationBellProps) => {
  const queryClient = useQueryClient();
  const { data: notifications = [], refetch } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Mutation to mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return await apiRequest(`/api/notifications/${notificationId}/read`, {
        method: "POST",
      });
    },
    onSuccess: (_, notificationId) => {
      // Update the cache immediately to reflect the read status
      queryClient.setQueryData(["/api/notifications"], (oldData: Notification[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        );
      });
    },
    onError: (error) => {
      console.error("Failed to mark notification as read:", error);
      // Optionally show a toast notification here
    }
  });

  // Mutation to mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/notifications/mark-all-read", {
        method: "POST",
      });
    },
    onSuccess: () => {
      // Update the cache to mark all notifications as read
      queryClient.setQueryData(["/api/notifications"], (oldData: Notification[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(notification => ({ ...notification, isRead: true }));
      });
    },
    onError: (error) => {
      console.error("Failed to mark all notifications as read:", error);
    }
  });

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    
    // Navigate if there's an action URL
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `منذ ${days} يوم`;
    if (hours > 0) return `منذ ${hours} ساعة`;
    if (minutes > 0) return `منذ ${minutes} دقيقة`;
    return "الآن";
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'nda_request':
        return '📄';
      case 'nda_completed':
        return '✅';
      case 'offer_received':
        return '💰';
      case 'project_update':
        return '🔄';
      default:
        return '📢';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`relative p-2 text-gray-600 hover:text-primary rounded-full hover:bg-gray-100 ${className}`}
        >
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <UnreadIndicator 
              count={unreadCount} 
              className="absolute -top-1 -right-1"
            />
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold">الإشعارات</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  disabled={markAllAsReadMutation.isPending}
                  className="text-xs h-6 px-2"
                >
                  {markAllAsReadMutation.isPending ? "..." : "تعيين الكل كمقروء"}
                </Button>
                <UnreadIndicator count={unreadCount} />
              </>
            )}
          </div>
        </div>
        
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">لا توجد إشعارات</p>
            </div>
          ) : (
            notifications.slice(0, 10).map((notification) => (
              <div
                key={notification.id}
                className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-r-4 ${
                  notification.isRead ? 'border-transparent' : 'border-primary bg-blue-50/30'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      notification.isRead ? 'text-gray-700' : 'text-gray-900'
                    }`}>
                      {notification.title}
                    </p>
                    <p className={`text-xs mt-1 line-clamp-2 ${
                      notification.isRead ? 'text-gray-500' : 'text-gray-600'
                    }`}>
                      {notification.content}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTimeAgo(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        
        {notifications.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-100 text-center">
            <Link href="/notifications" className="text-xs text-primary hover:underline">
              عرض كافة الإشعارات
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;