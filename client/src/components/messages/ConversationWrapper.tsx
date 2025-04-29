import React from 'react';
import { Loader2 } from 'lucide-react';
import { Message } from '../../interfaces/messageTypes';

interface ConversationWrapperProps {
  conversationLoading: boolean;
  conversationData: Message[] | undefined;
  localMessages: Message[];
  selectedConversation: number | null;
  userId: number;
}

// دالة لتنسيق التاريخ
export const formatDate = (date: Date): string => {
  // القيم الافتراضية للتاريخ الحالي
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // التحقق إذا كان اليوم
  if (date >= today) {
    return `اليوم ${date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // التحقق إذا كان أمس
  if (date >= yesterday && date < today) {
    return `أمس ${date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // إذا كان قديماً، أظهر التاريخ كاملاً
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const ConversationWrapper: React.FC<ConversationWrapperProps> = ({
  conversationLoading,
  conversationData,
  localMessages,
  selectedConversation,
  userId
}) => {
  // تأكد من أن البيانات موجودة قبل عرضها
  const hasData = Array.isArray(conversationData) && conversationData.length > 0;
  const hasLocalMessages = localMessages && localMessages.length > 0;
  const isLoading = conversationLoading && !hasData && !hasLocalMessages;

  if (isLoading) {
    return (
      <div className="h-full flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // دمج الرسائل من الخادم مع الرسائل المحلية المؤقتة
  const allMessages = [
    ...(Array.isArray(conversationData) ? conversationData : []),
    ...localMessages.filter(msg => 
      msg.toUserId === selectedConversation || 
      msg.fromUserId === selectedConversation
    )
  ];

  if (allMessages.length === 0) {
    return (
      <div className="h-full flex justify-center items-center text-center p-4">
        <div>
          <p className="text-muted-foreground mb-2">لا توجد رسائل في هذه المحادثة</p>
          <p className="text-sm text-muted-foreground">ابدأ بإرسال رسالة!</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {allMessages.map((message) => (
        <div 
          key={message.id}
          className={`flex ${message.fromUserId === userId ? 'justify-end' : 'justify-start'}`}
        >
          <div 
            className={`max-w-[80%] p-3 rounded-lg ${
              message.fromUserId === userId 
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            }`}
          >
            <p className="text-sm">{message.content}</p>
            <p className="text-xs mt-1 opacity-70">{formatDate(new Date(message.createdAt))}</p>
          </div>
        </div>
      ))}
    </>
  );
};

export default ConversationWrapper;