import React, { useEffect, useRef, useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Bell } from "lucide-react";
import { createNotificationSound } from './createNotificationSound';

interface MessageNotificationProps {
  websocket: WebSocket | null;
  onNewMessage?: (message: any) => void;
}

export const MessageNotification: React.FC<MessageNotificationProps> = ({ 
  websocket,
  onNewMessage
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    // إنشاء عنصر الصوت برمجياً (بدون الحاجة لملف خارجي)
    try {
      const soundUrl = createNotificationSound();
      const audio = new Audio(soundUrl);
      audio.preload = 'auto';
      audioRef.current = audio;
      
      return () => {
        // تنظيف عنصر الصوت عند إزالة المكون
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        
        // تحرير الموارد
        URL.revokeObjectURL(soundUrl);
      };
    } catch (error) {
      console.error('خطأ في إنشاء صوت التنبيه:', error);
      return () => {};
    }
  }, []);
  
  useEffect(() => {
    if (!websocket) return;
    
    const handleNewMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        // معالجة الرسائل الجديدة فقط
        if (data.type === 'new_message') {
          // استدعاء الدالة الخارجية لمعالجة الرسالة الجديدة
          if (onNewMessage) {
            onNewMessage(data.message);
          }
          
          // تشغيل صوت الإشعار
          if (audioRef.current) {
            audioRef.current.play().catch(err => {
              console.error('فشل تشغيل صوت الإشعار:', err);
            });
          }
          
          // عرض إشعار Toast
          toast({
            title: "رسالة جديدة",
            description: `رسالة جديدة من ${data.message.senderName || 'مستخدم'}`,
            action: (
              <Bell className="h-4 w-4" />
            )
          });
        }
      } catch (error) {
        console.error('خطأ في معالجة رسالة WebSocket:', error);
      }
    };
    
    // إضافة مستمع للرسائل الجديدة
    websocket.addEventListener('message', handleNewMessage);
    
    // تنظيف المستمع عند إزالة المكون
    return () => {
      websocket.removeEventListener('message', handleNewMessage);
    };
  }, [websocket, onNewMessage, toast]);
  
  // هذا المكون لا يعرض أي واجهة مستخدم
  return null;
};

export default MessageNotification;