import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Bell, BellRing } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import UnreadIndicator from "./UnreadIndicator";

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
  const { data: notifications = [], refetch } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
          {unreadCount > 0 && (
            <UnreadIndicator count={unreadCount} />
          )}
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
                onClick={() => {
                  if (notification.actionUrl) {
                    window.location.href = notification.actionUrl;
                  }
                }}
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