import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, RefreshCcw, Trash2, Edit, Check, X, Reply, AlertCircle, CheckCircle, Archive, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import AdminLayout from "@/components/layout/AdminLayout";
import SEO from "@/components/seo/SEO";

// تعريف نوع البيانات لرسائل الاتصال
interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: string;
  notes: string | null;
  reply: string | null;
  createdAt: string;
  messageDetails: {
    subject: string;
  } | null;
}

const ContactMessagesPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState("");
  const [notesText, setNotesText] = useState("");
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // استعلام لجلب رسائل الاتصال
  const { data: messages, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/contact-messages'],
    queryFn: async () => {
      const response = await fetch('/api/contact-messages', {
        credentials: 'include'
      });
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('يجب تسجيل الدخول كمدير للوصول إلى هذه الصفحة');
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل في تحميل رسائل الاتصال');
      }
      return response.json();
    },
    retry: 1,
  });

  // تحويل الرسائل حسب حالتها (الكل، جديد، مقروء، تم الرد، مؤرشف)
  const filteredMessages = messages ? messages.filter((message: ContactMessage) => {
    if (activeTab === "all") return true;
    if (activeTab === "new") return message.status === "new";
    if (activeTab === "read") return message.status === "read";
    if (activeTab === "replied") return message.status === "replied";
    if (activeTab === "archived") return message.status === "archived";
    return true;
  }) : [];

  // تحديث حالة الرسالة
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await fetch(`/api/contact-messages/${id}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error('فشل في تحديث حالة الرسالة');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contact-messages'] });
      toast({
        title: "تم تحديث الحالة",
        description: "تم تحديث حالة الرسالة بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ في تحديث الحالة",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء تحديث حالة الرسالة",
        variant: "destructive",
      });
    },
  });

  // إضافة ملاحظة للرسالة
  const addNotesMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
      const response = await fetch(`/api/contact-messages/${id}/notes`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      });
      
      if (!response.ok) {
        throw new Error('فشل في إضافة الملاحظة');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contact-messages'] });
      setIsNotesDialogOpen(false);
      setNotesText("");
      toast({
        title: "تمت إضافة الملاحظات",
        description: "تمت إضافة الملاحظات بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ في إضافة الملاحظات",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء إضافة الملاحظات",
        variant: "destructive",
      });
    },
  });



  // حذف الرسالة
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/contact-messages/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('فشل في حذف الرسالة');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contact-messages'] });
      setIsDeleteDialogOpen(false);
      toast({
        title: "تم حذف الرسالة",
        description: "تم حذف الرسالة بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ في حذف الرسالة", 
        description: error instanceof Error ? error.message : "حدث خطأ أثناء حذف الرسالة",
        variant: "destructive",
      });
    },
  });

  // الرد على الرسالة
  const replyMutation = useMutation({
    mutationFn: async ({ id, replyMessage }: { id: number; replyMessage: string }) => {
      const response = await fetch(`/api/contact-messages/${id}/reply`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ replyMessage }),
      });
      
      if (!response.ok) {
        throw new Error('فشل في إرسال الرد');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contact-messages'] });
      setIsReplyDialogOpen(false);
      setReplyText("");
      toast({
        title: "تم إرسال الرد",
        description: "تم إرسال الرد بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ في إرسال الرد",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء إرسال الرد",
        variant: "destructive",
      });
    },
  });

  // تعامل مع تغيير حالة الرسالة
  const handleStatusChange = (id: number, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  // تعامل مع إضافة ملاحظات
  const handleAddNotes = () => {
    if (selectedMessage && notesText.trim()) {
      addNotesMutation.mutate({ id: selectedMessage.id, notes: notesText });
    }
  };

  // تعامل مع الرد على الرسالة
  const handleReply = () => {
    if (selectedMessage && replyText.trim()) {
      replyMutation.mutate({ id: selectedMessage.id, replyMessage: replyText });
    }
  };

  // تعامل مع حذف الرسالة
  const handleDelete = () => {
    if (selectedMessage) {
      deleteMutation.mutate(selectedMessage.id);
    }
  };

  // استخراج لون شارة الحالة
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "new": return "default";
      case "read": return "secondary";
      case "replied": return "secondary";
      case "archived": return "outline";
      default: return "default";
    }
  };

  // استخراج نص حالة الرسالة بالعربية
  const getStatusText = (status: string) => {
    switch (status) {
      case "new": return "جديدة";
      case "read": return "مقروءة";
      case "replied": return "تم الرد";
      case "archived": return "مؤرشفة";
      default: return status;
    }
  };

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };

  return (
    <AdminLayout>
      <SEO
        title="إدارة رسائل الاتصال | لوحة التحكم | لينكتك"
        description="إدارة رسائل الاتصال الواردة من نموذج الاتصال في موقع لينكتك"
      />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">إدارة رسائل الاتصال</h1>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="ml-2 h-4 w-4" />
            )}
            تحديث
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={setActiveTab}
        className="mb-6"
      >
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="all">الكل</TabsTrigger>
          <TabsTrigger value="new">جديدة</TabsTrigger>
          <TabsTrigger value="read">مقروءة</TabsTrigger>
          <TabsTrigger value="replied">تم الرد</TabsTrigger>
          <TabsTrigger value="archived">مؤرشفة</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          {isLoading ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : isError ? (
            <div className="text-center p-12">
              <p className="text-destructive mb-4">حدث خطأ أثناء تحميل رسائل الاتصال</p>
              <Button onClick={() => refetch()} variant="outline">
                إعادة المحاولة
              </Button>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center p-12">
              <p className="text-muted-foreground">لا توجد رسائل {activeTab !== "all" ? `بحالة "${getStatusText(activeTab)}"` : ""}</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredMessages.map((message: ContactMessage) => (
                <Card key={message.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Badge variant={getStatusBadgeVariant(message.status)}>
                        {getStatusText(message.status)}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <span className="sr-only">إجراءات</span>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>إجراءات</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {message.status === "new" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(message.id, "read")}>
                              <Check className="ml-2 h-4 w-4" />
                              <span>تعليم كمقروءة</span>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedMessage(message);
                              setIsReplyDialogOpen(true);
                            }}
                          >
                            <Reply className="ml-2 h-4 w-4" />
                            <span>الرد</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedMessage(message);
                              setNotesText(message.notes || "");
                              setIsNotesDialogOpen(true);
                            }}
                          >
                            <Edit className="ml-2 h-4 w-4" />
                            <span>إضافة ملاحظات</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {message.status !== "archived" ? (
                            <DropdownMenuItem onClick={() => handleStatusChange(message.id, "archived")}>
                              <Archive className="ml-2 h-4 w-4" />
                              <span>أرشفة</span>
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleStatusChange(message.id, "read")}>
                              <Check className="ml-2 h-4 w-4" />
                              <span>إعادة تنشيط</span>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setSelectedMessage(message);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="ml-2 h-4 w-4" />
                            <span>حذف</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardTitle className="text-lg mt-2 mb-1">{message.name}</CardTitle>
                    <CardDescription className="flex items-center">
                      <Mail className="ml-1 h-3 w-3" />
                      {message.email}
                    </CardDescription>
                    {message.phone && (
                      <CardDescription className="flex items-center mt-1">
                        <span>هاتف: {message.phone}</span>
                      </CardDescription>
                    )}
                    <CardDescription className="flex items-center mt-1">
                      <span>موضوع: {message.messageDetails?.subject || "استفسار عام"}</span>
                    </CardDescription>
                    <CardDescription className="mt-1">
                      {formatDate(message.createdAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="max-h-24 overflow-y-auto mb-2">
                      <p className="text-sm">{message.message}</p>
                    </div>
                    {message.reply && (
                      <div className="mt-2 p-2 bg-muted rounded-md">
                        <p className="text-xs font-semibold">الرد:</p>
                        <p className="text-sm">{message.reply}</p>
                      </div>
                    )}
                    {message.notes && (
                      <div className="mt-2 p-2 bg-muted/50 rounded-md">
                        <p className="text-xs font-semibold">ملاحظات:</p>
                        <p className="text-sm">{message.notes}</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="pt-0 flex justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedMessage(message);
                        setIsReplyDialogOpen(true);
                      }}
                    >
                      <Reply className="ml-2 h-4 w-4" />
                      رد
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedMessage(message);
                        setNotesText(message.notes || "");
                        setIsNotesDialogOpen(true);
                      }}
                    >
                      <Edit className="ml-2 h-4 w-4" />
                      ملاحظات
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* مربع حوار الرد على الرسالة */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>الرد على رسالة</DialogTitle>
            <DialogDescription>
              إرسال رد إلى {selectedMessage?.name} على بريد {selectedMessage?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <div className="p-3 bg-muted rounded-md text-sm max-h-32 overflow-y-auto">
                {selectedMessage?.message}
              </div>
            </div>
            <div className="grid gap-2">
              <Textarea
                placeholder="اكتب رسالتك هنا..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={5}
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsReplyDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              onClick={handleReply}
              disabled={!replyText.trim() || replyMutation.isPending}
            >
              {replyMutation.isPending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Send className="ml-2 h-4 w-4" />
                  إرسال الرد
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* مربع حوار إضافة ملاحظات */}
      <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة ملاحظات</DialogTitle>
            <DialogDescription>
              إضافة ملاحظات داخلية للرسالة من {selectedMessage?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="اكتب ملاحظاتك هنا..."
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsNotesDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              onClick={handleAddNotes}
              disabled={!notesText.trim() || addNotesMutation.isPending}
            >
              {addNotesMutation.isPending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <CheckCircle className="ml-2 h-4 w-4" />
                  حفظ الملاحظات
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* مربع حوار حذف الرسالة */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من رغبتك في حذف هذه الرسالة نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-3 bg-destructive/10 rounded-md flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm">سيتم حذف الرسالة بشكل دائم من قاعدة البيانات.</p>
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الحذف...
                </>
              ) : (
                <>
                  <Trash2 className="ml-2 h-4 w-4" />
                  حذف نهائي
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default ContactMessagesPage;