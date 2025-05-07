export interface Message {
  id: number;
  content: string;
  fromUserId: number;
  toUserId: number;
  projectId: number | null;
  read: boolean;
  createdAt: string;
  // حالة توصيل الرسالة: 
  // processing = جاري المعالجة، 
  // sent = تم الإرسال للخادم، 
  // delivered = تم التوصيل للمستلم، 
  // failed = فشل التوصيل
  deliveryStatus?: 'processing' | 'sent' | 'delivered' | 'failed';
  fromUser?: {
    name: string;
    avatar: string | null;
  };
  toUser?: {
    name: string;
    avatar: string | null;
  };
}

export interface Conversation {
  otherUserId: number;
  otherUserName: string;
  otherUserAvatar: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

// أنواع بيانات الرسائل والأخطاء للـ WebSocket
export interface WebSocketMessage {
  type: string;
  message?: Message;
  error?: ContentError;
  messageId?: number;
  tempMessageId?: string;
  deliveryStatus?: 'processing' | 'sent' | 'delivered' | 'failed';
  reason?: string;
}

export interface ContentError {
  message: string;
  violations?: string[];
}

// أنواع مخالفات المحتوى
export type ContentViolationType = 'رقم_هاتف' | 'بريد_إلكتروني' | 'حساب_تواصل_اجتماعي' | 'رابط_خارجي';