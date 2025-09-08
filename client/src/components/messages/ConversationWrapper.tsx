import React from 'react';
import { Loader2, Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';
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
        <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin text-primary" />
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

  // ترتيب الرسائل حسب التاريخ للتأكد من عرضها بشكل صحيح
  allMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (allMessages.length === 0) {
    return (
      <div className="h-full flex justify-center items-center text-center p-2 md:p-4">
        <div>
          <p className="text-muted-foreground mb-1 md:mb-2 text-sm md:text-base">لا توجد رسائل في هذه المحادثة</p>
          <p className="text-xs md:text-sm text-muted-foreground">ابدأ بإرسال رسالة!</p>
        </div>
      </div>
    );
  }

  // تجميع الرسائل حسب التاريخ للعرض بترتيب تاريخي
  const messagesByDate: { [date: string]: Message[] } = {};
  
  allMessages.forEach(message => {
    const messageDate = new Date(message.createdAt);
    const dateKey = messageDate.toLocaleDateString('ar-SA');
    
    if (!messagesByDate[dateKey]) {
      messagesByDate[dateKey] = [];
    }
    
    messagesByDate[dateKey].push(message);
  });

  return (
    <>
      {Object.entries(messagesByDate).map(([dateKey, messages]) => (
        <div key={dateKey} className="message-group">
          <div className="flex justify-center mb-2">
            <div className="bg-muted px-2 py-1 rounded-full">
              <span className="text-xs text-muted-foreground">
                {new Date(messages[0].createdAt).toLocaleDateString('ar-SA', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
          
          {messages.map((message) => (
            <div 
              key={message.id}
              className={`flex ${message.fromUserId === userId ? 'justify-end' : 'justify-start'} mb-2`}
            >
              <div 
                className={`max-w-[85%] p-2 md:p-3 rounded-lg text-sm ${
                  message.fromUserId === userId 
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-xs md:text-sm break-words">{message.content}</p>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-[10px] md:text-xs opacity-70">
                    {new Date(message.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  
                  {/* عرض حالة تسليم الرسالة فقط للرسائل المرسلة من المستخدم الحالي */}
                  {message.fromUserId === userId && (
                    <div className="flex items-center mr-1">
                      {message.deliveryStatus === 'delivered' ? (
                        <CheckCheck className="h-3 w-3 opacity-70" />
                      ) : message.deliveryStatus === 'sent' || message.read ? (
                        <Check className="h-3 w-3 opacity-70" />
                      ) : message.deliveryStatus === 'failed' ? (
                        <AlertCircle className="h-3 w-3 text-red-400" />
                      ) : message.deliveryStatus === 'processing' || !message.deliveryStatus ? (
                        <Clock className="h-3 w-3 opacity-50" />
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </>
  );
};

export default ConversationWrapper;