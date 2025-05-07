import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, AlertTriangle, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link, useLocation } from 'wouter';
import { Message, Conversation, WebSocketMessage, ContentError } from '@/interfaces/messageTypes';
import ConversationWrapper, { formatDate } from '@/components/messages/ConversationWrapper';

// إضافة أنواع البيانات
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

// دالة مساعدة للحصول على الأحرف الأولى من اسم المستخدم
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const Messages: React.FC<MessageProps> = ({ auth }) => {
  // استخلاص userId من المسار إذا تم تعيينه
  const [, params] = useLocation();
  const userId = window.location.pathname.includes('/messages/') 
    ? parseInt(window.location.pathname.split('/messages/')[1]) 
    : null;
  
  const [selectedConversation, setSelectedConversation] = useState<number | null>(userId);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [projectId, setProjectId] = useState<number | null>(
    // قراءة معلمة المشروع من queryString إذا وجدت
    new URLSearchParams(window.location.search).get('projectId') 
      ? parseInt(new URLSearchParams(window.location.search).get('projectId') || '0')
      : null
  );
  const { toast } = useToast();
  const [wsConnected, setWsConnected] = useState(false);
  const [wsError, setWsError] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const [sentWelcomeMessage, setSentWelcomeMessage] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [wsReconnectAttempts, setWsReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;
  const reconnectInterval = 3000; // 3 ثوانٍ
  
  // تسجيل معلومات التنقيح
  useEffect(() => {
    console.log("صفحة الرسائل: المسار =", window.location.pathname);
    console.log("صفحة الرسائل: userId المستخلص =", userId);
    console.log("صفحة الرسائل: projectId المستخلص =", projectId);
  }, [userId, projectId]);

  // آلية الاتصال بـ WebSocket مع إعادة المحاولة
  useEffect(() => {
    if (!auth.isAuthenticated || !auth.user?.id) return;
    
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let isConnecting = false;

    const connectWebSocket = () => {
      // تجنب محاولات الاتصال المتزامنة
      if (isConnecting) return;
      isConnecting = true;

      // تنظيف الاتصال السابق إذا وجد
      if (wsRef.current) {
        try {
          // إغلاق الاتصال القديم بغض النظر عن حالته
          wsRef.current.close();
          wsRef.current = null;
        } catch (e) {
          console.log('خطأ عند إغلاق الاتصال القديم:', e);
        }
      }
      
      try {
        // تكوين WebSocket
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        console.log('محاولة الاتصال بـ WebSocket:', wsUrl);
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        
        // تحديد مهلة زمنية للاتصال
        const connectionTimeout = setTimeout(() => {
          if (ws.readyState !== WebSocket.OPEN) {
            console.log('انتهت مهلة الاتصال بـ WebSocket');
            ws.close();
          }
        }, 5000);
        
        // مراقبة الأحداث
        ws.onopen = () => {
          clearTimeout(connectionTimeout);
          isConnecting = false;
          console.log('تم فتح اتصال WebSocket بنجاح');
          setWsConnected(true);
          setWsError(false);
          setWsReconnectAttempts(0);
          
          // إرسال رسالة المصادقة
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(JSON.stringify({
                type: 'auth',
                userId: auth.user.id
              }));
            } catch (e) {
              console.error('WebSocket authentication error:', e);
              // Fallback to HTTP polling if WebSocket fails
              setWsReconnectAttempts(maxReconnectAttempts);
            }
          }
        };
        
        ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          isConnecting = false;
          console.log('انقطع اتصال WebSocket. كود:', event.code, 'سبب:', event.reason);
          setWsConnected(false);
          
          // فحص الكود والحالة قبل محاولة إعادة الاتصال
          const shouldRetry = [1000, 1001, 1006, 1011, 1012, 1013].includes(event.code);
          
          // محاولة إعادة الاتصال إذا لم نتجاوز الحد الأقصى وكان الكود قابل للإعادة
          if (wsReconnectAttempts < maxReconnectAttempts && shouldRetry) {
            // زيادة وقت الانتظار مع كل محاولة فاشلة
            const delay = reconnectInterval * (Math.pow(1.5, wsReconnectAttempts));
            console.log(`محاولة إعادة الاتصال (${wsReconnectAttempts + 1}/${maxReconnectAttempts}) بعد ${delay}ms`);
            
            reconnectTimer = setTimeout(() => {
              setWsReconnectAttempts(prev => prev + 1);
              connectWebSocket();
            }, delay);
          } else {
            // عند فشل إعادة الاتصال، نستخدم آلية الاسترجاع المؤقت
            console.log('تم الوصول للحد الأقصى من محاولات إعادة الاتصال. استخدام آلية الاسترجاع المؤقت.');
            setWsError(true);
          }
        };
        
        ws.onerror = (error) => {
          console.error('خطأ في اتصال WebSocket:', error);
          // لا نضبط الحالة هنا لأن onclose سيتم استدعاؤه تلقائياً
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
                
                // أضف الرسالة إلى المحادثة المحلية مؤقتاً
                setLocalMessages(prev => [...prev, data.message]);
                
                // عرض إشعار
                toast({
                  title: 'رسالة جديدة',
                  description: `${data.message.fromUser?.name || 'مستخدم'}: ${data.message.content}`,
                });
              } else {
                // إذا كان المستخدم يعرض محادثة أخرى، أظهر إشعار فقط
                toast({
                  title: 'رسالة جديدة',
                  description: `${data.message.fromUser?.name || 'مستخدم'} أرسل لك رسالة`,
                  variant: "default"
                });
              }
            }
            
            // إذا كانت رسالة مرسلة بنجاح
            if (data.type === 'message_sent' || data.type === 'message_ack') {
              console.log('تأكيد استلام الرسالة من الخادم:', data);
              
              // تحديث المحادثات
              queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
              
              if (selectedConversation) {
                queryClient.invalidateQueries({ 
                  queryKey: ['/api/messages/conversation', selectedConversation] 
                });
              }
              
              // حفظ المعرف الحقيقي للرسالة المرسلة مؤخرًا
              if (data.tempMessageId) {
                console.log('تحديث معرف الرسالة المؤقتة:', data.tempMessageId, 'إلى المعرف الدائم:', data.message?.id);
                
                // تحديث الرسائل المحلية المؤقتة
                setLocalMessages(prev => prev.map(msg => {
                  // إذا كان هناك معرف مؤقت وتم العثور على تطابق
                  if (data.tempMessageId && msg.id === data.tempMessageId) {
                    return { ...data.message, fromUser: msg.fromUser }; // استخدام معلومات المرسل من الرسالة المؤقتة
                  }
                  return msg;
                }));
              }
            }
            
            // إذا تم توصيل الرسالة للمستلم
            if (data.type === 'message_delivered') {
              console.log('تم توصيل الرسالة للمستلم:', data);
              
              // تحديث حالة الرسالة في الواجهة إلى "تم التوصيل"
              if (data.tempMessageId) {
                setLocalMessages(prev => prev.map(msg => {
                  if (msg.id === data.tempMessageId || msg.id === data.messageId) {
                    return { ...msg, deliveryStatus: 'delivered' };
                  }
                  return msg;
                }));
              }
            }
            
            // إذا فشل تسليم الرسالة
            if (data.type === 'message_delivery_failed') {
              console.log('فشل تسليم الرسالة:', data);
              
              // تحديث حالة الرسالة في الواجهة إلى "فشل"
              if (data.messageId) {
                setLocalMessages(prev => prev.map(msg => {
                  if (msg.id === data.messageId || msg.id === data.tempMessageId) {
                    return { ...msg, deliveryStatus: 'failed' };
                  }
                  return msg;
                }));
                
                // إظهار إشعار للمستخدم
                toast({
                  title: 'لم يتم تسليم الرسالة',
                  description: 'المستلم غير متصل حاليًا. سيتم تسليم الرسالة عندما يتصل المستلم.',
                  variant: "default"
                });
              }
            }
            
            // إذا كان هناك خطأ في محتوى الرسالة (وجود معلومات اتصال محظورة)
            if (data.type === 'message_error' && data.error) {
              console.log('خطأ في محتوى الرسالة:', data.error);
              
              // تحديث الرسائل المحلية المؤقتة لإزالة الرسالة المرفوضة
              const tempId = data.tempMessageId;
              if (tempId) {
                setLocalMessages(prev => prev.filter(msg => msg.id !== tempId));
              }
              
              // إظهار رسالة خطأ للمستخدم
              toast({
                title: 'لم يتم إرسال الرسالة',
                description: data.error.message || 'الرسالة تحتوي على محتوى غير مسموح به',
                variant: "destructive",
              });
              
              // عرض تفاصيل المخالفة للمستخدم
              if (data.error.violations && data.error.violations.length > 0) {
                const violations = data.error.violations.join('، ');
                toast({
                  title: 'تفاصيل المخالفة',
                  description: `نوع المخالفة: ${violations}. لا يمكن مشاركة معلومات الاتصال عبر المنصة. سيتم الكشف عن معلومات التواصل بعد دفع العمولة عند قبول العرض.`,
                  variant: "destructive",
                });
              }
            }
          } catch (error) {
            console.error('خطأ في معالجة رسالة WebSocket:', error);
          }
        };
      } catch (error) {
        console.error('خطأ أثناء إنشاء اتصال WebSocket:', error);
        setWsError(true);
        setWsConnected(false);
      }
    };
    
    // بدء الاتصال
    connectWebSocket();
    
    // تنظيف عند إلغاء التحميل
    return () => {
      clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [auth.isAuthenticated, auth.user?.id, wsReconnectAttempts]);
  
  // جلب جميع الرسائل للمستخدم الحالي
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/messages'],
    enabled: auth.isAuthenticated,
    refetchInterval: 10000, // إعادة جلب البيانات كل 10 ثوانٍ كنسخة احتياطية
  });

  // جلب المحادثة المحددة
  const { data: conversationData, isLoading: conversationLoading } = useQuery<Message[]>({
    queryKey: ['/api/messages/conversation', selectedConversation],
    queryFn: async () => {
      if (!selectedConversation || !auth.isAuthenticated) return [];
      try {
        console.log('جاري جلب بيانات المحادثة للمستخدم:', selectedConversation);
        const response = await apiRequest('GET', `/api/messages/conversation/${selectedConversation}`);
        if (!response.ok) {
          throw new Error(`Error fetching conversation: ${response.status}`);
        }
        const data = await response.json();
        console.log('تم استلام بيانات المحادثة:', data);
        return data;
      } catch (error) {
        console.error('خطأ في جلب بيانات المحادثة:', error);
        return [];
      }
    },
    enabled: !!selectedConversation && auth.isAuthenticated,
    refetchInterval: wsConnected ? undefined : 5000, // استخدام الاستطلاع فقط إذا كان WebSocket غير متصل
  });
  
  // تم نقل هذا إلى الأعلى
  
  // تنظيف الرسائل المحلية عند تغيير المحادثة
  useEffect(() => {
    setLocalMessages([]);
  }, [selectedConversation]);
  
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
          avatar: auth.user.avatar || null
        }
      };
      
      // إضافة الرسالة المؤقتة للعرض مؤقتاً حتى تظهر من قاعدة البيانات
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

  // استخدام معلمات URL لبدء محادثة أو استعادة المحادثة السابقة من التخزين المحلي
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const userIdParam = urlParams.get('userId');
      const projectIdParam = urlParams.get('projectId');
      
      // التحقق من وجود معلمات في URL
      if (userIdParam) {
        const userId = parseInt(userIdParam);
        if (!isNaN(userId)) {
          console.log("تم تحديد محادثة مع المستخدم:", userId);
          setSelectedConversation(userId);
          
          // حفظ معرف المستخدم في التخزين المحلي
          localStorage.setItem('lastConversationUserId', userId.toString());
        }
      } else {
        // إذا لم توجد معلمات URL، استعادة المحادثة الأخيرة من التخزين المحلي
        const lastConversationUserId = localStorage.getItem('lastConversationUserId');
        if (lastConversationUserId) {
          const userId = parseInt(lastConversationUserId);
          if (!isNaN(userId)) {
            console.log("استعادة المحادثة الأخيرة مع المستخدم:", userId);
            setSelectedConversation(userId);
          }
        }
      }

      if (projectIdParam) {
        const projId = parseInt(projectIdParam);
        if (!isNaN(projId)) {
          console.log("المحادثة بخصوص المشروع:", projId);
          setProjectId(projId);
          
          // حفظ معرف المشروع في التخزين المحلي
          localStorage.setItem('lastConversationProjectId', projId.toString());
        }
      } else {
        // استعادة معرف المشروع من التخزين المحلي
        const lastProjectId = localStorage.getItem('lastConversationProjectId');
        if (lastProjectId) {
          const projId = parseInt(lastProjectId);
          if (!isNaN(projId)) {
            console.log("استعادة معرف المشروع الأخير:", projId);
            setProjectId(projId);
          }
        }
      }
    }
  }, []);
  
  // تم نقل هذا المتغير إلى الأعلى مع باقي المتغيرات
  
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
      
      // إنشاء معرّف مؤقت للرسالة الترحيبية
      const welcomeTempId = Date.now();
      
      // إنشاء رسالة ترحيبية مؤقتة للعرض المباشر
      const welcomeTempMessage: Message = {
        id: welcomeTempId as unknown as number,
        content: "مرحبًا، أنا مهتم بالتحدث معك بخصوص المشروع.",
        fromUserId: auth.user.id,
        toUserId: selectedConversation,
        projectId: projectId,
        read: false,
        createdAt: new Date().toISOString(),
        deliveryStatus: 'processing',
        fromUser: {
          name: auth.user.name || auth.user.username,
          avatar: auth.user.avatar || null
        }
      };
      
      // إضافة الرسالة الترحيبية المؤقتة للعرض المباشر
      setLocalMessages(prev => [...prev, welcomeTempMessage]);
      
      // إرسال الرسالة بعد تأخير قصير
      setTimeout(() => {
        sendMessageMutation.mutate({
          content: "مرحبًا، أنا مهتم بالتحدث معك بخصوص المشروع.",
          toUserId: selectedConversation,
          projectId: projectId
        }, {
          onSuccess: () => {
            // تحديث حالة الرسالة الترحيبية المؤقتة إلى "تم الإرسال"
            setLocalMessages(prev => prev.map(msg => {
              if (msg.id === welcomeTempId) {
                return { ...msg, deliveryStatus: 'sent' };
              }
              return msg;
            }));
          },
          onError: () => {
            // تحديث حالة الرسالة الترحيبية المؤقتة إلى "فشل الإرسال"
            setLocalMessages(prev => prev.map(msg => {
              if (msg.id === welcomeTempId) {
                return { ...msg, deliveryStatus: 'failed' };
              }
              return msg;
            }));
          }
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
        id: tempId as unknown as number,
        content: newMessage,
        fromUserId: auth.user.id,
        toUserId: selectedConversation,
        projectId: projectId,
        read: false,
        createdAt: new Date().toISOString(),
        // إضافة حالة "جاري المعالجة" للرسالة المؤقتة
        deliveryStatus: 'processing',
        fromUser: {
          name: auth.user.name || auth.user.username,
          avatar: auth.user.avatar || null
        }
      };
      
      // إضافة الرسالة المؤقتة للعرض مؤقتاً حتى تظهر من قاعدة البيانات
      setLocalMessages(prev => [...prev, tempMessage]);
      
      // تفريغ حقل الرسالة
      setNewMessage('');
      
      // إرسال الرسالة عبر WebSocket مع معرف مؤقت للتتبع
      wsRef.current.send(JSON.stringify({
        type: 'message',
        content: newMessage,
        toUserId: selectedConversation,
        projectId: projectId,
        tempMessageId: tempId
      }));
      
      console.log('تم إرسال الرسالة عبر WebSocket');
    } else {
      // استخدام الطريقة التقليدية كنسخة احتياطية
      console.log('استخدام الطريقة التقليدية لإرسال الرسالة (WebSocket غير متصل)');
      
      // إنشاء معرّف مؤقت للرسالة عند استخدام الطريقة التقليدية
      const fallbackTempId = Date.now();
      
      // إنشاء رسالة مؤقتة للعرض المباشر
      const fallbackTempMessage: Message = {
        id: fallbackTempId as unknown as number,
        content: newMessage,
        fromUserId: auth.user.id,
        toUserId: selectedConversation,
        projectId: projectId,
        read: false,
        createdAt: new Date().toISOString(),
        // إضافة حالة "جاري المعالجة" للرسالة المؤقتة
        deliveryStatus: 'processing',
        fromUser: {
          name: auth.user.name || auth.user.username,
          avatar: auth.user.avatar || null
        }
      };
      
      // إضافة الرسالة المؤقتة للعرض المباشر
      setLocalMessages(prev => [...prev, fallbackTempMessage]);
      
      // تفريغ حقل الرسالة
      setNewMessage('');
      
      // إرسال الرسالة باستخدام API التقليدي
      sendMessageMutation.mutate({
        content: newMessage,
        toUserId: selectedConversation,
        projectId: projectId
      }, {
        onSuccess: () => {
          // تحديث حالة الرسالة المؤقتة إلى "تم الإرسال"
          setLocalMessages(prev => prev.map(msg => {
            if (msg.id === fallbackTempId) {
              return { ...msg, deliveryStatus: 'sent' };
            }
            return msg;
          }));
          
          // تحديث قائمة المحادثات
          queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
          queryClient.invalidateQueries({ queryKey: ['/api/messages/conversation', selectedConversation] });
        },
        onError: () => {
          // تحديث حالة الرسالة المؤقتة إلى "فشل الإرسال"
          setLocalMessages(prev => prev.map(msg => {
            if (msg.id === fallbackTempId) {
              return { ...msg, deliveryStatus: 'failed' };
            }
            return msg;
          }));
          
          toast({
            title: "فشل إرسال الرسالة",
            description: "حدث خطأ أثناء إرسال رسالتك، يرجى المحاولة مرة أخرى",
            variant: "destructive",
          });
        }
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
        <title>الرسائل | لينكتك</title>
      </Helmet>
      
      {wsError && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-800">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <div>
            <p className="font-medium">فشل الاتصال بنظام المراسلة الفوري</p>
            <p className="text-sm">يتم استخدام النظام الاحتياطي للرسائل. سيتم تحديث الرسائل كل 5 ثوانٍ بدلاً من الرسائل الفورية.</p>
          </div>
        </div>
      )}
      
      {/* وضع التنقل للأجهزة الصغيرة فقط */}
      <div className="md:hidden flex justify-center mb-4 gap-2">
        <Button
          variant={!selectedConversation ? "default" : "outline"}
          className="w-1/2"
          onClick={() => setSelectedConversation(null)}
        >
          جميع المحادثات
        </Button>
        <Button
          variant={selectedConversation ? "default" : "outline"}
          className="w-1/2"
          disabled={!selectedConversation}
        >
          المحادثة الحالية
        </Button>
      </div>

      <div className="flex flex-col md:flex-row h-[75vh] sm:h-[80vh] gap-4">
        {/* قائمة المحادثات - تظهر دائماً في الشاشات الكبيرة، وتختفي في الشاشات الصغيرة عند اختيار محادثة */}
        <Card className={`md:w-1/3 h-full overflow-hidden flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
          <CardHeader className="pb-2 md:pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg md:text-xl">المحادثات</CardTitle>
              <div className="md:hidden">
                <span className="text-xs text-muted-foreground">{conversations.length} محادثة</span>
              </div>
            </div>
            <div className="mt-2">
              <Input 
                placeholder="بحث في المحادثات..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-sm md:text-base"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-grow overflow-y-auto space-y-1 md:space-y-2 p-2 md:p-3">
            {conversations.length > 0 ? (
              conversations
                .filter(conv => 
                  searchTerm === "" || 
                  conv.otherUserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((conv) => (
                <div 
                  key={conv.otherUserId}
                  className={`p-2 md:p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors ${selectedConversation === conv.otherUserId ? 'bg-accent' : 'bg-card'}`}
                  onClick={() => setSelectedConversation(conv.otherUserId)}
                >
                  <div className="flex items-start gap-2 md:gap-3">
                    <Avatar className="h-8 w-8 md:h-10 md:w-10">
                      <AvatarImage src={conv.otherUserAvatar || undefined} alt={conv.otherUserName} />
                      <AvatarFallback>{getInitials(conv.otherUserName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-center">
                        <p className="font-medium truncate text-sm md:text-base">{conv.otherUserName}</p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(new Date(conv.lastMessageTime))}</span>
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-xs text-white font-semibold">{conv.unreadCount}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <p className="text-muted-foreground mb-2 md:mb-4 text-sm md:text-base">ليس لديك أي محادثات حالية</p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  يمكنك بدء محادثة من صفحة تفاصيل أي مشروع تهتم به
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* منطقة المحادثة - تظهر دائماً في الشاشات الكبيرة، وتظهر فقط عند اختيار محادثة في الشاشات الصغيرة */}
        <Card className={`md:w-2/3 h-full overflow-hidden flex flex-col ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
          {selectedConversation ? (
            <>
              <CardHeader className="pb-2 md:pb-3 border-b">
                <div className="flex items-center gap-2 md:gap-3">
                  {/* زر الرجوع للمحادثات في الأجهزة الصغيرة */}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="md:hidden" 
                    onClick={() => setSelectedConversation(null)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m15 18-6-6 6-6"/>
                    </svg>
                  </Button>

                  <Avatar className="h-8 w-8 md:h-10 md:w-10">
                    <AvatarImage src={conversations.find(c => c.otherUserId === selectedConversation)?.otherUserAvatar || undefined} alt="صورة المستخدم" />
                    <AvatarFallback>
                      {getInitials(conversations.find(c => c.otherUserId === selectedConversation)?.otherUserName || "مستخدم")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-grow">
                    <CardTitle className="text-base md:text-lg truncate">
                      {conversations.find(c => c.otherUserId === selectedConversation)?.otherUserName || "مستخدم"}
                    </CardTitle>
                  </div>
                  
                  {/* مؤشر حالة الاتصال */}
                  <div className="flex items-center text-xs gap-1 text-muted-foreground">
                    {wsConnected ? (
                      <>
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <span className="hidden md:inline">متصل</span>
                      </>
                    ) : wsError ? (
                      <>
                        <AlertTriangle className="h-3 w-3 text-amber-500" />
                        <span className="hidden md:inline">غير متصل</span>
                      </>
                    ) : (
                      <>
                        <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
                        <span className="hidden md:inline">جاري الاتصال...</span>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent 
                className="flex-grow overflow-y-auto p-2 md:p-4 space-y-2 md:space-y-4"
                ref={(el) => {
                  // التمرير إلى آخر الرسائل
                  if (el && !conversationLoading && 
                      ((conversationData && Array.isArray(conversationData) && conversationData.length > 0) || localMessages.length > 0)) {
                    setTimeout(() => {
                      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
                    }, 100);
                  }
                }}
              >
                <ConversationWrapper 
                  conversationLoading={conversationLoading} 
                  conversationData={conversationData} 
                  localMessages={localMessages} 
                  selectedConversation={selectedConversation} 
                  userId={auth.user?.id || 0} 
                />
              </CardContent>
              
              <div className="p-2 md:p-3 border-t">
                <form 
                  className="flex gap-2" 
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                >
                  <Textarea 
                    placeholder="اكتب رسالتك هنا..."
                    className="min-h-[50px] md:min-h-[60px] text-sm md:text-base"
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
                    size="sm"
                    disabled={!newMessage.trim()}
                  >
                    <Send className="h-4 w-4 md:ml-2" />
                    <span className="hidden md:inline">إرسال</span>
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <div className="mb-4">
                <Send className="h-10 w-10 md:h-12 md:w-12 mx-auto text-muted-foreground opacity-20" />
              </div>
              <h3 className="text-lg md:text-xl font-medium mb-2">اختر محادثة</h3>
              <p className="text-sm md:text-base text-muted-foreground">
                اختر محادثة من القائمة لعرض الرسائل
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Messages;
