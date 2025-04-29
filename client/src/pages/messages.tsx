import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Send, Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  const [isNewMessageDialogOpen, setIsNewMessageDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newRecipientId, setNewRecipientId] = useState<number | null>(null);
  const [projectId, setProjectId] = useState<number | null>(null);
  const { toast } = useToast();

  // استخدام معلمات URL
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

  // جلب جميع الرسائل للمستخدم الحالي
  const { data: messagesData, isLoading: messagesLoading, error: messagesError } = useQuery({
    queryKey: ['/api/messages'],
    enabled: auth.isAuthenticated,
  });

  // جلب المحادثة المحددة
  const { data: conversationData, isLoading: conversationLoading } = useQuery({
    queryKey: ['/api/messages/conversation', selectedConversation],
    enabled: !!selectedConversation && auth.isAuthenticated,
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users/all'],
    enabled: auth.isAuthenticated && auth.user?.role === 'admin',
  });

  // إرسال رسالة جديدة
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string; toUserId: number; projectId: number | null }) => {
      const response = await apiRequest('POST', '/api/messages', data);
      return await response.json();
    },
    onSuccess: () => {
      setNewMessage('');
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
    
    sendMessageMutation.mutate({
      content: newMessage,
      toUserId: selectedConversation,
      projectId: projectId
    });
  };

  const startNewConversation = () => {
    // منطق بدء محادثة جديدة
    console.log('Starting new conversation with user ID:', newRecipientId);
    setIsNewMessageDialogOpen(false);
  };

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
              <Dialog open={isNewMessageDialogOpen} onOpenChange={setIsNewMessageDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>رسالة جديدة</DialogTitle>
                    <DialogDescription>اختر مستخدمًا لبدء محادثة معه</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">المستخدمون:</p>
                      {usersLoading ? (
                        <div className="flex justify-center">
                          <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                      ) : (
                        <div className="max-h-60 overflow-y-auto space-y-2">
                          {usersData?.map((user: User) => (
                            <div 
                              key={user.id}
                              className={`p-2 rounded flex items-center gap-2 cursor-pointer ${newRecipientId === user.id ? 'bg-primary/10' : 'hover:bg-muted'}`}
                              onClick={() => setNewRecipientId(user.id)}
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{user.name}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button onClick={startNewConversation} disabled={!newRecipientId}>
                      بدء محادثة
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
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
                <Button onClick={() => setIsNewMessageDialogOpen(true)} variant="outline">
                  بدء محادثة جديدة
                </Button>
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
                  <div>
                    <CardTitle className="text-lg">
                      {conversations.find(c => c.otherUserId === selectedConversation)?.otherUserName || "مستخدم"}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-grow overflow-y-auto p-4 space-y-4">
                {conversationLoading ? (
                  <div className="h-full flex justify-center items-center">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : (
                  conversationData?.map((message: Message) => (
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
                <div className="flex gap-2">
                  <Textarea 
                    placeholder="اكتب رسالتك هنا..."
                    className="min-h-[60px]"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <Button 
                    className="shrink-0"
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <Send className="h-4 w-4 ml-2" />
                    إرسال
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <h3 className="text-lg font-semibold mb-2">لم يتم تحديد محادثة</h3>
              <p className="text-muted-foreground mb-4">اختر محادثة من القائمة أو ابدأ محادثة جديدة</p>
              <Button onClick={() => setIsNewMessageDialogOpen(true)} variant="outline">
                بدء محادثة جديدة
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Messages;