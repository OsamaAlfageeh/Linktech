import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { useLocation, Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Search,
  Send,
  ArrowLeft,
  MessageSquare,
  User,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getInitials } from "@/lib/utils";

type User = {
  id: number;
  username: string;
  email: string;
  role: string;
  name: string;
  avatar?: string;
};

type Message = {
  id: number;
  content: string;
  fromUserId: number;
  toUserId: number;
  projectId?: number;
  read: boolean;
  createdAt: string;
};

type Conversation = {
  userId: number;
  name: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  projectId?: number;
  projectTitle?: string;
};

type MessagesProps = {
  auth: {
    user: User;
    isAuthenticated: boolean;
  };
};

const Messages = ({ auth }: MessagesProps) => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [activeConversation, setActiveConversation] = useState<number | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<number | undefined>(undefined);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Parse URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get("userId");
    const projectId = params.get("projectId");

    if (userId) {
      setActiveConversation(parseInt(userId));
    }

    if (projectId) {
      setActiveProjectId(parseInt(projectId));
    }
  }, [location]);

  // Fetch messages for the current user
  const { data: messages, isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: ['/api/messages'],
    enabled: auth.isAuthenticated,
  });

  // Fetch active conversation messages
  const { 
    data: conversationMessages, 
    isLoading: isLoadingConversation,
    refetch: refetchConversation,
  } = useQuery<Message[]>({
    queryKey: ['/api/messages/conversation', activeConversation, activeProjectId],
    queryFn: async () => {
      const url = activeProjectId 
        ? `/api/messages/conversation/${activeConversation}?projectId=${activeProjectId}`
        : `/api/messages/conversation/${activeConversation}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch conversation');
      return res.json();
    },
    enabled: !!activeConversation && auth.isAuthenticated,
  });

  // Fetch all users for conversations
  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const res = await fetch('/api/users', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
    enabled: auth.isAuthenticated,
  });

  // Fetch all projects
  const { data: projects } = useQuery<any[]>({
    queryKey: ['/api/projects'],
    enabled: auth.isAuthenticated,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!activeConversation) throw new Error('No active conversation');
      
      const messageData = {
        content: newMessage,
        toUserId: activeConversation,
        projectId: activeProjectId,
      };
      
      const response = await apiRequest('POST', '/api/messages', messageData);
      return response.json();
    },
    onSuccess: () => {
      setNewMessage("");
      refetchConversation();
      queryClient.invalidateQueries({queryKey: ['/api/messages']});
    },
    onError: (error) => {
      toast({
        title: "فشل إرسال الرسالة",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء محاولة إرسال الرسالة",
        variant: "destructive",
      });
    },
  });

  // Handle sending new message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === "") return;
    sendMessageMutation.mutate();
  };

  // Mark message as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const response = await apiRequest('PATCH', `/api/messages/${messageId}/read`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['/api/messages']});
    },
  });

  // Process messages into conversations
  const getConversations = (): Conversation[] => {
    if (!messages || !users) return [];

    const conversations: Map<number, Conversation> = new Map();
    
    // Group messages by conversation partner
    messages.forEach(message => {
      const partnerId = message.fromUserId === auth.user.id ? message.toUserId : message.fromUserId;
      const partner = users.find(u => u.id === partnerId);
      
      if (!partner) return;
      
      // Find project details if projectId exists
      let projectTitle = undefined;
      if (message.projectId && projects) {
        const project = projects.find(p => p.id === message.projectId);
        if (project) {
          projectTitle = project.title;
        }
      }
      
      if (!conversations.has(partnerId)) {
        conversations.set(partnerId, {
          userId: partnerId,
          name: partner.name,
          avatar: partner.avatar,
          lastMessage: message.content,
          lastMessageTime: message.createdAt,
          unreadCount: message.fromUserId !== auth.user.id && !message.read ? 1 : 0,
          projectId: message.projectId,
          projectTitle,
        });
      } else {
        const existingConvo = conversations.get(partnerId)!;
        
        // Update last message if this one is newer
        const existingTime = new Date(existingConvo.lastMessageTime || "").getTime();
        const currentTime = new Date(message.createdAt).getTime();
        
        if (currentTime > existingTime) {
          existingConvo.lastMessage = message.content;
          existingConvo.lastMessageTime = message.createdAt;
          existingConvo.projectId = message.projectId;
          existingConvo.projectTitle = projectTitle;
        }
        
        // Increment unread count if necessary
        if (message.fromUserId !== auth.user.id && !message.read) {
          existingConvo.unreadCount += 1;
        }
        
        conversations.set(partnerId, existingConvo);
      }
    });
    
    return [...conversations.values()]
      .sort((a, b) => {
        const timeA = new Date(a.lastMessageTime || "").getTime();
        const timeB = new Date(b.lastMessageTime || "").getTime();
        return timeB - timeA; // Sort by newest first
      })
      .filter(convo => 
        searchQuery === "" || 
        convo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (convo.projectTitle && convo.projectTitle.toLowerCase().includes(searchQuery.toLowerCase()))
      );
  };

  // Mark messages as read when viewing a conversation
  useEffect(() => {
    if (conversationMessages && activeConversation) {
      const unreadMessages = conversationMessages
        .filter(m => m.fromUserId === activeConversation && !m.read)
        .map(m => m.id);
      
      unreadMessages.forEach(id => {
        markAsReadMutation.mutate(id);
      });
    }
  }, [conversationMessages, activeConversation]);

  // Get active conversation partner details
  const getActivePartner = () => {
    if (!activeConversation || !users) return null;
    return users.find(u => u.id === activeConversation) || null;
  };

  // Get active project details
  const getActiveProject = () => {
    if (!activeProjectId || !projects) return null;
    return projects.find(p => p.id === activeProjectId) || null;
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!auth.isAuthenticated) {
      navigate("/auth/login");
    }
  }, [auth, navigate]);

  if (!auth.isAuthenticated) {
    return null;
  }

  const conversations = getConversations();
  const activePartner = getActivePartner();
  const activeProject = getActiveProject();

  return (
    <>
      <Helmet>
        <title>الرسائل | تِكلينك</title>
        <meta name="description" content="تواصل مع شركات البرمجة ورواد الأعمال" />
      </Helmet>

      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-heading mb-2">الرسائل</h1>
          <p className="text-neutral-600">تواصل مع شركات البرمجة ورواد الأعمال</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="md:col-span-1">
            <Card className="h-[calc(80vh-4rem)]">
              <CardHeader className="pb-4">
                <CardTitle>المحادثات</CardTitle>
                <div className="relative mt-2">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <Input
                    placeholder="بحث..."
                    className="pl-3 pr-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(80vh-12rem)] rounded-md">
                  {isLoadingMessages ? (
                    <div className="space-y-2 p-4">
                      <ConversationSkeleton />
                      <ConversationSkeleton />
                      <ConversationSkeleton />
                    </div>
                  ) : conversations.length > 0 ? (
                    <div className="space-y-1 p-1">
                      {conversations.map((conversation) => (
                        <div
                          key={conversation.userId}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            activeConversation === conversation.userId
                              ? "bg-primary/10"
                              : "hover:bg-neutral-100"
                          }`}
                          onClick={() => {
                            setActiveConversation(conversation.userId);
                            setActiveProjectId(conversation.projectId);
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={conversation.avatar} />
                              <AvatarFallback>{getInitials(conversation.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <h3 className="font-medium truncate">{conversation.name}</h3>
                                {conversation.lastMessageTime && (
                                  <span className="text-xs text-neutral-500">
                                    {formatRelativeTime(conversation.lastMessageTime)}
                                  </span>
                                )}
                              </div>
                              {conversation.projectTitle && (
                                <div className="mt-1">
                                  <Badge variant="outline" className="text-xs font-normal">
                                    {conversation.projectTitle}
                                  </Badge>
                                </div>
                              )}
                              <p className="text-sm text-neutral-600 truncate mt-1">
                                {conversation.lastMessage}
                              </p>
                            </div>
                            {conversation.unreadCount > 0 && (
                              <Badge className="bg-primary text-white rounded-full h-5 min-w-5 flex items-center justify-center">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-8">
                      <MessageSquare className="h-10 w-10 text-neutral-400 mx-auto mb-3" />
                      <p className="text-neutral-600 mb-2">لا توجد محادثات</p>
                      <p className="text-neutral-500 text-sm">
                        ابدأ محادثة من خلال صفحة المشاريع أو الشركات
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Conversation Messages */}
          <div className="md:col-span-2">
            <Card className="h-[calc(80vh-4rem)] flex flex-col">
              {activeConversation ? (
                <>
                  <CardHeader className="pb-4 border-b">
                    {activePartner ? (
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 lg:hidden"
                          onClick={() => {
                            setActiveConversation(null);
                            setActiveProjectId(undefined);
                          }}
                        >
                          <ArrowLeft className="h-4 w-4 rtl-flip" />
                        </Button>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={activePartner.avatar} />
                          <AvatarFallback>{getInitials(activePartner.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{activePartner.name}</CardTitle>
                          {activeProject && (
                            <CardDescription>
                              بخصوص:{" "}
                              <Link
                                href={`/projects/${activeProject.id}`}
                                className="text-primary hover:underline"
                              >
                                {activeProject.title}
                              </Link>
                            </CardDescription>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="mr-3">
                          <Skeleton className="h-5 w-32" />
                        </div>
                      </div>
                    )}
                  </CardHeader>

                  <ScrollArea className="flex-1 p-4">
                    {isLoadingConversation ? (
                      <div className="space-y-4">
                        <MessageSkeleton isSent={false} />
                        <MessageSkeleton isSent={true} />
                        <MessageSkeleton isSent={false} />
                      </div>
                    ) : conversationMessages && conversationMessages.length > 0 ? (
                      <div className="space-y-4">
                        {conversationMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${
                              message.fromUserId === auth.user.id ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                message.fromUserId === auth.user.id
                                  ? "bg-primary text-white rounded-br-none"
                                  : "bg-neutral-100 text-neutral-800 rounded-bl-none"
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words">{message.content}</p>
                              <div
                                className={`text-xs mt-1 ${
                                  message.fromUserId === auth.user.id ? "text-white/70" : "text-neutral-500"
                                }`}
                              >
                                {formatRelativeTime(message.createdAt)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center p-8">
                          <MessageSquare className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                          <p className="text-neutral-600">ابدأ المحادثة مع {activePartner?.name}</p>
                        </div>
                      </div>
                    )}
                  </ScrollArea>

                  <div className="p-4 border-t mt-auto">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <Input
                        placeholder="اكتب رسالتك هنا..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="submit"
                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                      >
                        {sendMessageMutation.isPending ? (
                          "جاري الإرسال..."
                        ) : (
                          <>
                            <Send className="h-4 w-4 ml-2" />
                            إرسال
                          </>
                        )}
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center p-8">
                    <User className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">اختر محادثة</h3>
                    <p className="text-neutral-600 max-w-md">
                      اختر إحدى المحادثات من القائمة لعرض الرسائل أو ابدأ محادثة جديدة من صفحة المشاريع أو الشركات
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

const ConversationSkeleton = () => (
  <div className="flex items-start gap-3 p-3">
    <Skeleton className="h-10 w-10 rounded-full" />
    <div className="flex-1">
      <div className="flex justify-between items-start">
        <Skeleton className="h-5 w-24 mb-1" />
        <Skeleton className="h-4 w-10" />
      </div>
      <Skeleton className="h-4 w-full mt-1" />
    </div>
  </div>
);

const MessageSkeleton = ({ isSent }: { isSent: boolean }) => (
  <div className={`flex ${isSent ? "justify-end" : "justify-start"}`}>
    <Skeleton
      className={`h-16 w-2/3 rounded-lg ${
        isSent ? "rounded-br-none" : "rounded-bl-none"
      }`}
    />
  </div>
);

// Format relative time for messages
const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) {
    return "الآن";
  } else if (diffMins < 60) {
    return `منذ ${diffMins} دقيقة`;
  } else if (diffHours < 24) {
    return `منذ ${diffHours} ساعة`;
  } else if (diffDays < 7) {
    return `منذ ${diffDays} يوم`;
  } else {
    return formatDate(date);
  }
};

export default Messages;
