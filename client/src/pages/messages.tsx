import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Send, 
  Search, 
  MessageCircle, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Loader2,
  ArrowLeft
} from 'lucide-react';

// تعريف الأنواع
interface Message {
  id: number;
  content: string;
  fromUserId: number;
  toUserId: number;
  projectId?: number;
  read: boolean;
  createdAt: string;
  fromUser?: {
    name: string;
    avatar?: string;
  };
  toUser?: {
    name: string;
    avatar?: string;
  };
  project?: {
    id: number;
    title: string;
  };
}

interface Conversation {
  id: number;
  otherUserId: number;
  otherUser: {
    name: string;
    avatar?: string;
  };
  lastMessage: Message;
  unreadCount: number;
  projectId?: number;
  project?: {
    id: number;
    title: string;
  };
}

const formatDate = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'الآن';
  if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays < 7) return `منذ ${diffDays} يوم`;
  
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

interface User {
  id: number;
  username: string;
  name?: string;
  email?: string;
  avatar?: string;
  role?: string;
}

interface MessageProps {
  auth: {
    user: User;
    isAuthenticated: boolean;
  };
}

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const Messages: React.FC<MessageProps> = ({ auth }) => {
  // التحقق من وجود المستخدم أولاً
  if (!auth || !auth.user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">يجب تسجيل الدخول</h2>
              <p className="mb-4">يرجى تسجيل الدخول للوصول إلى الرسائل الخاصة بك.</p>
              <Button onClick={() => window.location.href = '/auth/login'}>
                تسجيل الدخول
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // استخلاص userId من المسار إذا تم تعيينه
  const [, params] = useLocation();
  const userId = window.location.pathname.includes('/messages/') 
    ? parseInt(window.location.pathname.split('/messages/')[1]) 
    : null;
  
  const [selectedConversation, setSelectedConversation] = useState<number | null>(userId);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [projectId, setProjectId] = useState<number | null>(
    new URLSearchParams(window.location.search).get('projectId') 
      ? parseInt(new URLSearchParams(window.location.search).get('projectId') || '0')
      : null
  );
  const { toast } = useToast();
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  
  const queryClient = useQueryClient();

  // جلب جميع الرسائل للمستخدم الحالي
  const { data: messagesData, isLoading: messagesLoading, error: messagesError, refetch: refetchMessages } = useQuery({
    queryKey: ['/api/messages'],
    queryFn: async () => {
      const response = await fetch('/api/messages', { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('غير مصرح - يرجى تسجيل الدخول مرة أخرى');
        }
        throw new Error('فشل في جلب الرسائل');
      }
      return response.json();
    },
    enabled: auth.isAuthenticated && !!auth.user?.id,
    refetchInterval: 5000, // تحديث كل 5 ثوان
    retry: 2,
    retryDelay: 1000,
  });

  // جلب المحادثة المحددة
  const { data: conversationData, isLoading: conversationLoading, error: conversationError, refetch: refetchConversation } = useQuery<Message[]>({
    queryKey: ['/api/messages/conversation', selectedConversation, projectId],
    queryFn: async () => {
      if (!selectedConversation || !auth.isAuthenticated) return [];
      
      const url = projectId 
        ? `/api/messages/conversation/${selectedConversation}?projectId=${projectId}`
        : `/api/messages/conversation/${selectedConversation}`;
      
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('غير مصرح');
        }
        throw new Error('فشل في جلب المحادثة');
      }
      return response.json();
    },
    enabled: !!selectedConversation && auth.isAuthenticated,
    refetchInterval: 3000, // تحديث كل 3 ثوان
    retry: 2,
    retryDelay: 1000,
  });

  // إرسال رسالة
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, toUserId, projectId }: { content: string; toUserId: number; projectId?: number | null }) => {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          content,
          toUserId,
          projectId
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      return response.json();
    },
    onSuccess: (newMessage) => {
      setNewMessage('');
      
      // إزالة الرسالة المؤقتة وإضافة الرسالة الحقيقية
      setLocalMessages(prev => prev.filter(msg => 
        !(msg.id > 1000000000000) // إزالة الرسائل المؤقتة بناءً على الوقت
      ));
      
      // تحديث البيانات
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/conversation', selectedConversation] });
      
      toast({
        title: "تم إرسال الرسالة",
        description: "تم إرسال رسالتك بنجاح",
      });
    },
    onError: (error: any) => {
      console.error('خطأ في إرسال الرسالة:', error);
      
      // إزالة الرسالة المؤقتة في حالة الخطأ
      setLocalMessages(prev => prev.filter(msg => 
        !(msg.id > 1000000000000)
      ));
      
      if (error?.violations?.includes('معلومات_اتصال_محظورة')) {
        toast({
          title: "محتوى غير مسموح",
          description: "لا يمكن مشاركة معلومات الاتصال مثل أرقام الهواتف أو الإيميلات في الرسائل",
          variant: "destructive",
        });
      } else {
        toast({
          title: "فشل إرسال الرسالة",
          description: error?.message || "حدث خطأ أثناء إرسال رسالتك، يرجى المحاولة مرة أخرى",
          variant: "destructive",
        });
      }
    }
  });

  // تحويل الرسائل إلى محادثات
  const conversations: Conversation[] = useMemo(() => {
    if (!messagesData || !Array.isArray(messagesData) || messagesData.length === 0) {
      return [];
    }

    const conversationsMap = new Map<string, Conversation>();
    
    messagesData.forEach((message: Message) => {
      const otherUserId = message.fromUserId === auth.user.id ? message.toUserId : message.fromUserId;
      const otherUser = message.fromUserId === auth.user.id ? message.toUser : message.fromUser;
      
      if (!otherUser || !otherUserId) return;
      
      const conversationKey = `${Math.min(auth.user.id, otherUserId)}-${Math.max(auth.user.id, otherUserId)}-${message.projectId || 'no-project'}`;
      
      if (!conversationsMap.has(conversationKey)) {
        conversationsMap.set(conversationKey, {
          id: otherUserId,
          otherUserId,
          otherUser,
          lastMessage: message,
          unreadCount: message.toUserId === auth.user.id && !message.read ? 1 : 0,
          projectId: message.projectId,
          project: message.project
        });
      } else {
        const existingConversation = conversationsMap.get(conversationKey)!;
        if (new Date(message.createdAt) > new Date(existingConversation.lastMessage.createdAt)) {
          conversationsMap.set(conversationKey, {
            ...existingConversation,
            lastMessage: message,
            unreadCount: existingConversation.unreadCount + (message.toUserId === auth.user.id && !message.read ? 1 : 0)
          });
        } else {
          conversationsMap.set(conversationKey, {
            ...existingConversation,
            unreadCount: existingConversation.unreadCount + (message.toUserId === auth.user.id && !message.read ? 1 : 0)
          });
        }
      }
    });
    
    return Array.from(conversationsMap.values())
      .sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());
  }, [messagesData, auth.user]);

  // عرض رسالة خطأ إذا فشل تحميل الرسائل
  if (messagesError) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">مشكلة في الاتصال</h2>
              <p className="mb-4 text-red-600">{messagesError.message}</p>
              <Button onClick={() => refetchMessages()}>
                إعادة المحاولة
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (messagesLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="mr-2">جاري تحميل المحادثات...</span>
      </div>
    );
  }

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedConversation || sendMessageMutation.isPending) return;
    
    // إضافة رسالة مؤقتة للعرض المباشر
    const tempMessage: Message = {
      id: Date.now() as any,
      content: newMessage,
      fromUserId: auth.user.id,
      toUserId: selectedConversation,
      projectId: projectId,
      read: false,
      createdAt: new Date().toISOString(),
      fromUser: {
        name: auth.user.name || auth.user.username,
        avatar: auth.user.avatar || null
      }
    };
    
    setLocalMessages(prev => [...prev, tempMessage]);
    
    sendMessageMutation.mutate({
      content: newMessage,
      toUserId: selectedConversation,
      projectId: projectId
    });
  };

  // تصفية المحادثات حسب البحث
  const filteredConversations = conversations.filter(conversation =>
    conversation.otherUser?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversation.project?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4 h-screen flex flex-col">
      <Helmet>
        <title>الرسائل | لينكتك</title>
      </Helmet>
      
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-blue-800">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        <div>
          <p className="font-medium">نظام المحادثات المحسن</p>
          <p className="text-sm">يتم تحديث الرسائل تلقائياً كل 3 ثوان لضمان أفضل أداء واستقرار.</p>
        </div>
      </div>
      
      <div className="flex-grow flex gap-4 overflow-hidden">
        {/* قائمة المحادثات */}
        <Card className={`md:w-1/3 h-full overflow-hidden flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg md:text-xl">المحادثات</CardTitle>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث في المحادثات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-grow overflow-y-auto p-0">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conversation) => (
                <div 
                  key={`${conversation.otherUserId}-${conversation.projectId || 'no-project'}`}
                  className={`p-3 border-b cursor-pointer hover:bg-accent transition-colors ${
                    selectedConversation === conversation.otherUserId ? 'bg-accent' : ''
                  }`}
                  onClick={() => setSelectedConversation(conversation.otherUserId)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={conversation.otherUser?.avatar || undefined} alt="صورة المستخدم" />
                      <AvatarFallback>
                        {getInitials(conversation.otherUser?.name || "مستخدم")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium truncate">{conversation.otherUser?.name || "مستخدم"}</h3>
                        <div className="flex items-center gap-1">
                          {conversation.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse hidden md:block" title="النظام متصل"></div>
                        </div>
                      </div>
                      {conversation.project?.title && (
                        <p className="text-xs text-muted-foreground truncate">
                          مشروع: {conversation.project.title}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.lastMessage.content}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(new Date(conversation.lastMessage.createdAt))}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <MessageCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2 md:mb-4 text-sm md:text-base">ليس لديك أي محادثات حالية</p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  يمكنك بدء محادثة من صفحة تفاصيل أي مشروع تهتم به
                </p>
                <Button 
                  className="mt-4"
                  onClick={() => window.location.href = '/projects'}
                >
                  تصفح المشاريع
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* منطقة المحادثة */}
        <Card className={`md:w-2/3 h-full overflow-hidden flex flex-col ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
          {selectedConversation ? (
            <>
              <CardHeader className="pb-2 md:pb-3 border-b">
                <div className="flex items-center gap-2 md:gap-3">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="md:hidden" 
                    onClick={() => setSelectedConversation(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>

                  <Avatar className="h-8 w-8 md:h-10 md:w-10">
                    <AvatarImage src={conversations.find(c => c.otherUserId === selectedConversation)?.otherUser?.avatar || undefined} alt="صورة المستخدم" />
                    <AvatarFallback>
                      {getInitials(conversations.find(c => c.otherUserId === selectedConversation)?.otherUser?.name || "مستخدم")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-grow">
                    <CardTitle className="text-base md:text-lg truncate">
                      {conversations.find(c => c.otherUserId === selectedConversation)?.otherUser?.name || "مستخدم"}
                    </CardTitle>
                    {conversations.find(c => c.otherUserId === selectedConversation)?.project?.title && (
                      <p className="text-xs md:text-sm text-muted-foreground truncate">
                        مشروع: {conversations.find(c => c.otherUserId === selectedConversation)?.project?.title}
                      </p>
                    )}
                  </div>
                  
                  {/* مؤشر حالة الاتصال */}
                  <div className="flex items-center text-xs gap-1 text-muted-foreground">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="hidden md:inline">متصل</span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent 
                className="flex-grow overflow-y-auto p-2 md:p-4 space-y-2 md:space-y-4"
                ref={(el) => {
                  if (el && !conversationLoading && 
                      ((conversationData && Array.isArray(conversationData) && conversationData.length > 0) || localMessages.length > 0)) {
                    setTimeout(() => {
                      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
                    }, 100);
                  }
                }}
              >
                {conversationError ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="text-center">
                      <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                      <p className="text-red-600 mb-2">خطأ في تحميل المحادثة</p>
                      <Button size="sm" onClick={() => refetchConversation()}>
                        إعادة المحاولة
                      </Button>
                    </div>
                  </div>
                ) : conversationLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="mr-2">جاري تحميل الرسائل...</span>
                  </div>
                ) : (
                  [...(Array.isArray(conversationData) ? conversationData : []), ...localMessages]
                    .filter((message, index, array) => 
                      array.findIndex(m => m.id === message.id) === index
                    )
                    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                    .map((message, index) => (
                    <div 
                      key={`message-${message.id}-${index}`}
                      className={`flex ${message.fromUserId === auth.user.id ? 'justify-end' : 'justify-start'} mb-2 md:mb-3`}
                    >
                      <div className={`max-w-xs md:max-w-md lg:max-w-lg px-3 md:px-4 py-2 md:py-3 rounded-lg ${
                        message.fromUserId === auth.user.id 
                          ? 'bg-primary text-primary-foreground ml-2 md:ml-4' 
                          : 'bg-muted mr-2 md:mr-4'
                      }`}>
                        <p className="text-sm md:text-base break-words whitespace-pre-wrap">{message.content}</p>
                        <div className="flex justify-between items-center mt-1 md:mt-2">
                          <p className="text-xs opacity-70">
                            {formatDate(new Date(message.createdAt))}
                          </p>
                          {message.fromUserId === auth.user.id && (
                            <div className="text-xs opacity-70">
                              {message.read ? '✓✓' : '✓'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
              
              <div className="p-3 md:p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="اكتب رسالتك..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    disabled={sendMessageMutation.isPending}
                    className="flex-grow"
                  />
                  <Button 
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    size="icon"
                  >
                    {sendMessageMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs md:text-sm text-amber-800">
                  <p className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                    <span>لا يمكن مشاركة معلومات الاتصال في الرسائل. ستتمكن من التواصل المباشر بعد قبول العرض ودفع العمولة.</span>
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">اختر محادثة لبدء المراسلة</h3>
              <p className="text-muted-foreground">
                اختر محادثة من القائمة الجانبية لعرض الرسائل والرد عليها
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Messages;