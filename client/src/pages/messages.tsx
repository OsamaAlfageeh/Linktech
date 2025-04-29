import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Helmet } from 'react-helmet';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Send, AlertTriangle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { formatDate, getInitials } from '@/lib/utils';
import { User } from '../App';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface MessageProps {
  auth: {
    user: User;
    isAuthenticated: boolean;
  };
}

interface Message {
  id: number;
  content: string;
  fromUserId: number;
  toUserId: number;
  projectId: number | null;
  read: boolean;
  createdAt: string;
  fromUser?: {
    name: string;
    avatar: string | null;
  };
  toUser?: {
    name: string;
    avatar: string | null;
  };
}

interface Conversation {
  otherUserId: number;
  otherUserName: string;
  otherUserAvatar: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

const Messages: React.FC<MessageProps> = ({ auth }) => {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [projectId, setProjectId] = useState<number | null>(null);
  const { toast } = useToast();
  const [wsConnected, setWsConnected] = useState(false);
  const [wsError, setWsError] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  
  // إنشاء اتصال WebSocket
  useEffect(() => {
    if (!auth.isAuthenticated || !auth.user?.id) return;
    
    // تنظيف الاتصال السابق إذا وجد
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    // تكوين WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    
    // مراقبة الأحداث
    ws.onopen = () => {
      console.log('اتصال WebSocket مفتوح');
      setWsConnected(true);
      setWsError(false);
      
      // إرسال رسالة المصادقة
      ws.send(JSON.stringify({
        type: 'auth',
        userId: auth.user.id
      }));
    };
    
    ws.onclose = () => {
      console.log('انقطع اتصال WebSocket');
      setWsConnected(false);
    };
    
    ws.onerror = (error) => {
      console.error('خطأ في اتصال WebSocket:', error);
      setWsError(true);
      setWsConnected(false);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('رسالة WebSocket جديدة:', data);
        
        // إذا كانت رسالة جديدة
        if (data.type === 'new_message') {
          // تحديث المحادثات
          queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
          
          // إذا كان المستخدم يعرض نفس المحادثة، قم بتحديثها
          if (selectedConversation === data.message.fromUserId) {
            queryClient.invalidateQueries({ 
              queryKey: ['/api/messages/conversation', selectedConversation] 
            });
            
            // أضف الرسالة إلى المحادثة المحلية مباشرة
            setLocalMessages(prev => [...prev, data.message]);
            
            // عرض إشعار صغير
            toast({
              title: 'رسالة جديدة',
              description: `${data.message.fromUser?.name || 'مستخدم'}: ${data.message.content}`,
            });
          }
        }
        
        // إذا كانت رسالة مرسلة بنجاح
        if (data.type === 'message_sent') {
          // تحديث المحادثات
          queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
        }
      } catch (error) {
        console.error('خطأ في معالجة رسالة WebSocket:', error);
      }
    };
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [auth.isAuthenticated, auth.user?.id, queryClient]);
  
  // جلب جميع الرسائل للمستخدم الحالي
  const { data: messagesData, isLoading: messagesLoading, error: messagesError } = useQuery({
    queryKey: ['/api/messages'],
    enabled: auth.isAuthenticated,
    refetchInterval: 10000, // إعادة جلب البيانات كل 10 ثوانٍ كنسخة احتياطية
  });

  // جلب المحادثة المحددة
  const { data: conversationData, isLoading: conversationLoading } = useQuery<Message[]>({
    queryKey: ['/api/messages/conversation', selectedConversation],
    enabled: !!selectedConversation && auth.isAuthenticated,
    refetchInterval: wsConnected ? undefined : 5000, // استخدام الاستطلاع فقط إذا كان WebSocket غير متصل
  });
  
  // حالة محلية لتخزين الرسائل غير المحفوظة
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  
  // إرسال رسالة جديدة
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string; toUserId: number; projectId: number | null }) => {
      const response = await apiRequest('POST', '/api/messages', data);
      return await response.json();
    },
    onSuccess: (newMessage) => {
      console.log("رسالة جديدة تم إرسالها:", newMessage);
      
      // تفريغ حقل الرسالة
      setNewMessage('');
      
      // إضافة الرسالة الجديدة إلى الرسائل المحلية
      const tempMessage: Message = {
        ...newMessage,
        // إضافة معلومات المستخدم المرسل (أنت)
        fromUser: {
          name: auth.user.name || auth.user.username,
          avatar: auth.user.avatar
        }
      };
      
      setLocalMessages(prev => [...prev, tempMessage]);
      
      // تحديث قائمة المحادثات والمحادثة الحالية
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/conversation', selectedConversation] });
      
      toast({
        title: "تم إرسال الرسالة",
        description: "تم إرسال رسالتك بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "فشل إرسال الرسالة",
        description: "حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  });

  // استخدام معلمات URL لبدء محادثة
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const userIdParam = urlParams.get('userId');
      const projectIdParam = urlParams.get('projectId');

      if (userIdParam) {
        const userId = parseInt(userIdParam);
        if (!isNaN(userId)) {
          console.log("تم تحديد محادثة مع المستخدم:", userId);
          setSelectedConversation(userId);
        }
      }

      if (projectIdParam) {
        const projId = parseInt(projectIdParam);
        if (!isNaN(projId)) {
          console.log("المحادثة بخصوص المشروع:", projId);
          setProjectId(projId);
        }
      }
    }
  }, []);
  
  // متغير للتأكد من إرسال رسالة واحدة فقط عند بدء محادثة جديدة
  const [sentWelcomeMessage, setSentWelcomeMessage] = useState(false);
  
  // إرسال رسالة ترحيبية مرة واحدة فقط عند وجود معرف المستخدم ومعرف المشروع في URL
  useEffect(() => {
    // عدم إرسال رسالة إذا كان المستخدم غير مسجل الدخول أو سبق إرسال رسالة أو لا توجد معلمات كافية
    if (
      !auth.isAuthenticated || 
      !selectedConversation || 
      !projectId || 
      sentWelcomeMessage || 
      !conversationData
    ) {
      return;
    }
    
    // التحقق إذا كانت المحادثة فارغة
    const conversation = Array.isArray(conversationData) ? conversationData : [];
    if (conversation.length === 0) {
      console.log("محادثة جديدة، إرسال رسالة ترحيبية...");
      
      // تعيين متغير لتجنب إرسال رسائل متكررة
      setSentWelcomeMessage(true);
      
      // إرسال الرسالة بعد تأخير قصير
      setTimeout(() => {
        sendMessageMutation.mutate({
          content: "مرحبًا، أنا مهتم بالتحدث معك بخصوص المشروع.",
          toUserId: selectedConversation,
          projectId: projectId
        });
      }, 1000);
    } else {
      // إذا كانت توجد رسائل بالفعل، لا نحتاج لإرسال رسالة ترحيبية
      setSentWelcomeMessage(true);
    }
  }, [auth.isAuthenticated, selectedConversation, projectId, conversationData, sendMessageMutation, sentWelcomeMessage]);

  const { data: usersData, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users/all'],
    enabled: auth.isAuthenticated && auth.user?.role === 'admin',
  });

  // تحويل الرسائل إلى محادثات
  const conversations: Conversation[] = [];
  // في حال كانت هناك رسائل, نقوم بتحويلها إلى محادثات
  
  if (!auth.isAuthenticated) {
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

  if (messagesLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    // إذا كان WebSocket متصل، استخدمه
    if (wsRef.current && wsConnected && wsRef.current.readyState === WebSocket.OPEN) {
      // إنشاء معرّف مؤقت للرسالة (سيتم استبداله بالمعرّف الحقيقي من الخادم)
      const tempId = Date.now();
      
      // إنشاء رسالة مؤقتة للعرض المباشر
      const tempMessage: Message = {
        id: tempId,
        content: newMessage,
        fromUserId: auth.user.id,
        toUserId: selectedConversation,
        projectId: projectId,
        read: false,
        createdAt: new Date().toISOString(),
        fromUser: {
          name: auth.user.name || auth.user.username,
          avatar: auth.user.avatar
        }
      };
      
      // إضافة الرسالة المؤقتة للعرض
      setLocalMessages(prev => [...prev, tempMessage]);
      
      // تفريغ حقل الرسالة
      setNewMessage('');
      
      // إرسال الرسالة عبر WebSocket
      wsRef.current.send(JSON.stringify({
        type: 'message',
        content: newMessage,
        toUserId: selectedConversation,
        projectId: projectId
      }));
      
      console.log('تم إرسال الرسالة عبر WebSocket');
    } else {
      // استخدام الطريقة التقليدية كنسخة احتياطية
      console.log('استخدام الطريقة التقليدية لإرسال الرسالة (WebSocket غير متصل)');
      sendMessageMutation.mutate({
        content: newMessage,
        toUserId: selectedConversation,
        projectId: projectId
      });
    }
  };

  // معالجة بيانات الرسائل لعرض المحادثات
  if (messagesData && Array.isArray(messagesData)) {
    // إنشاء قاموس للمستخدمين الآخرين وآخر الرسائل
    const conversationsMap = new Map<number, Conversation>();
    
    messagesData.forEach((message: Message) => {
      // تحديد المستخدم الآخر (المرسل أو المستقبل)
      const isFromCurrentUser = message.fromUserId === auth.user.id;
      const otherUserId = isFromCurrentUser ? message.toUserId : message.fromUserId;
      const otherUserName = isFromCurrentUser 
        ? (message.toUser?.name || "مستخدم") 
        : (message.fromUser?.name || "مستخدم");
      const otherUserAvatar = isFromCurrentUser 
        ? message.toUser?.avatar || null 
        : message.fromUser?.avatar || null;
      
      // إذا لم تكن هناك محادثة مع هذا المستخدم بعد، أضف واحدة جديدة
      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          otherUserId,
          otherUserName,
          otherUserAvatar,
          lastMessage: message.content,
          lastMessageTime: message.createdAt,
          unreadCount: (!isFromCurrentUser && !message.read) ? 1 : 0
        });
      } else {
        // تحديث المحادثة الموجودة إذا كانت الرسالة أحدث
        const conversation = conversationsMap.get(otherUserId)!;
        const messageTime = new Date(message.createdAt);
        const lastMessageTime = new Date(conversation.lastMessageTime);
        
        if (messageTime > lastMessageTime) {
          conversation.lastMessage = message.content;
          conversation.lastMessageTime = message.createdAt;
        }
        
        // زيادة عدد الرسائل غير المقروءة
        if (!isFromCurrentUser && !message.read) {
          conversation.unreadCount++;
        }
      }
    });
    
    // تحويل القاموس إلى مصفوفة وترتيبها حسب وقت آخر رسالة (الأحدث أولاً)
    conversations.push(...Array.from(conversationsMap.values())
      .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()));
  }

  return (
    <div className="container mx-auto p-4">
      <Helmet>
        <title>الرسائل | تِكلينك</title>
      </Helmet>
      
      <div className="flex flex-col md:flex-row h-[80vh] gap-4">
        {/* قائمة المحادثات */}
        <Card className="md:w-1/3 h-full overflow-hidden flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>المحادثات</CardTitle>
            </div>
            <div className="mt-2">
              <Input 
                placeholder="بحث في المحادثات..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-grow overflow-y-auto space-y-2 p-3">
            {conversations.length > 0 ? (
              conversations.map((conv) => (
                <div 
                  key={conv.otherUserId}
                  className={`p-3 rounded-lg cursor-pointer hover:bg-accent ${selectedConversation === conv.otherUserId ? 'bg-accent' : ''}`}
                  onClick={() => setSelectedConversation(conv.otherUserId)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={conv.otherUserAvatar || undefined} alt={conv.otherUserName} />
                      <AvatarFallback>{getInitials(conv.otherUserName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-center">
                        <p className="font-medium truncate">{conv.otherUserName}</p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(new Date(conv.lastMessageTime))}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-xs text-white font-semibold">{conv.unreadCount}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <p className="text-muted-foreground mb-4">ليس لديك أي محادثات حالية</p>
                <p className="text-sm text-muted-foreground">
                  يمكنك بدء محادثة من صفحة تفاصيل أي مشروع تهتم به
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* منطقة المحادثة */}
        <Card className="md:w-2/3 h-full overflow-hidden flex flex-col">
          {selectedConversation ? (
            <>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={conversations.find(c => c.otherUserId === selectedConversation)?.otherUserAvatar || undefined} />
                    <AvatarFallback>
                      {getInitials(conversations.find(c => c.otherUserId === selectedConversation)?.otherUserName || "مستخدم")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-grow">
                    <CardTitle className="text-lg">
                      {conversations.find(c => c.otherUserId === selectedConversation)?.otherUserName || "مستخدم"}
                    </CardTitle>
                  </div>
                  
                  {/* مؤشر حالة الاتصال */}
                  <div className="flex items-center text-xs gap-1 text-muted-foreground">
                    {wsConnected ? (
                      <>
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <span>متصل</span>
                      </>
                    ) : wsError ? (
                      <>
                        <AlertTriangle className="h-3 w-3 text-amber-500" />
                        <span>غير متصل</span>
                      </>
                    ) : (
                      <>
                        <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                        <span>جاري الاتصال...</span>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent 
                className="flex-grow overflow-y-auto p-4 space-y-4"
                ref={(el) => {
                  // التمرير إلى آخر الرسائل
                  if (el && !conversationLoading && 
                      (conversationData?.length || localMessages.length)) {
                    setTimeout(() => {
                      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
                    }, 100);
                  }
                }}
              >
                {conversationLoading && !(conversationData?.length || localMessages.length) ? (
                  <div className="h-full flex justify-center items-center">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : (
                  // دمج الرسائل من الخادم مع الرسائل المحلية المؤقتة
                  [...(conversationData as Message[] || []), 
                   ...localMessages.filter(msg => 
                     msg.toUserId === selectedConversation || 
                     msg.fromUserId === selectedConversation
                   )
                  ].map((message: Message) => (
                    <div 
                      key={message.id}
                      className={`flex ${message.fromUserId === auth.user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.fromUserId === auth.user.id 
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs mt-1 opacity-70">{formatDate(new Date(message.createdAt))}</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
              
              <div className="p-3 border-t">
                <form 
                  className="flex gap-2" 
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                >
                  <Textarea 
                    placeholder="اكتب رسالتك هنا..."
                    className="min-h-[60px]"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      // ارسال الرسالة عند الضغط على Enter (بدون Shift)
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (newMessage.trim()) {
                          sendMessage();
                        }
                      }
                    }}
                  />
                  <Button 
                    type="submit"
                    className="shrink-0"
                    disabled={!newMessage.trim()}
                  >
                    <Send className="h-4 w-4 ml-2" />
                    إرسال
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <h3 className="text-lg font-semibold mb-2">لم يتم تحديد محادثة</h3>
              <p className="text-muted-foreground mb-4">يرجى اختيار محادثة من القائمة على اليمين</p>
              <Link href="/projects">
                <Button variant="outline">
                  استعرض المشاريع
                </Button>
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Messages;