import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search, Building, MapPin, Phone, Mail, Globe, Users, Calendar, DollarSign } from "lucide-react";

// Schema for commercial registry input
const wathqTestSchema = z.object({
  crNumber: z.string().min(10, "رقم السجل التجاري مطلوب (10 أرقام على الأقل)"),
});

type WathqTestFormValues = z.infer<typeof wathqTestSchema>;

interface WathqResponse {
  success: boolean;
  data?: {
    crNumber: string;
    crNationalNumber: string;
    companyName: string;
    status: string;
    entityType: string;
    formType: string;
    registrationDate: string;
    capital: string | number;
    currency: string;
    city: string;
    phone?: string;
    email?: string;
    website?: string;
    activities: any[];
    partners: any[];
    management: any[];
    isActive: boolean;
    isLiquidation: boolean;
    hasEcommerce: boolean;
    fullResponse: any;
  };
  error?: string;
  message?: string;
}

export default function TestWathqPage() {
  const { toast } = useToast();
  const [response, setResponse] = useState<WathqResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<WathqTestFormValues>({
    resolver: zodResolver(wathqTestSchema),
    defaultValues: {
      crNumber: "",
    },
  });

  // Test Wathq API mutation
  const testWathqMutation = useMutation({
    mutationFn: async (data: WathqTestFormValues) => {
      const response = await apiRequest("POST", "/api/test/wathq", {
        crNumber: data.crNumber,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setResponse(data);
      if (data.success) {
        toast({
          title: "تم التحقق بنجاح",
          description: `تم العثور على الشركة: ${data.data?.companyName}`,
        });
      } else {
        toast({
          title: "فشل في التحقق",
          description: data.error || "حدث خطأ غير متوقع",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الاتصال",
        description: error.message || "فشل في الاتصال بالخادم",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: WathqTestFormValues) => {
    setIsLoading(true);
    testWathqMutation.mutate(data, {
      onSettled: () => {
        setIsLoading(false);
      },
    });
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          اختبار خدمة وثيق - التحقق من السجل التجاري
        </h1>
        <p className="text-gray-600">
          أدخل رقم السجل التجاري للتحقق من معلومات الشركة عبر منصة وثيق
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              اختبار السجل التجاري
            </CardTitle>
            <CardDescription>
              أدخل رقم السجل التجاري للتحقق من معلومات الشركة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="crNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم السجل التجاري</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="مثال: 1010962095"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      جاري التحقق...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      التحقق من السجل التجاري
                    </>
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">أرقام تجريبية للاختبار:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 1010962095 (شركة تجريبية)</li>
                <li>• 4030010781 (شركة تجريبية)</li>
                <li>• 7000850920 (شركة تجريبية)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Response Display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              نتيجة التحقق
            </CardTitle>
            <CardDescription>
              معلومات الشركة المستلمة من وثيق
            </CardDescription>
          </CardHeader>
          <CardContent>
            {response ? (
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <Badge variant={response.success ? "default" : "destructive"}>
                      {response.success ? "تم التحقق بنجاح" : "فشل في التحقق"}
                    </Badge>
                    {response.data?.isActive && (
                      <Badge variant="secondary">نشط</Badge>
                    )}
                  </div>

                  {response.success && response.data ? (
                    <div className="space-y-4">
                      {/* Basic Info */}
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">اسم الشركة:</span>
                          <span className="text-gray-700">{response.data.companyName}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="font-medium">رقم السجل:</span>
                          <span className="text-gray-700">{response.data.crNumber}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="font-medium">الحالة:</span>
                          <Badge variant={response.data.isActive ? "default" : "secondary"}>
                            {response.data.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="font-medium">نوع الشركة:</span>
                          <span className="text-gray-700">{response.data.entityType} - {response.data.formType}</span>
                        </div>
                      </div>

                      <Separator />

                      {/* Contact Info */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">معلومات الاتصال</h4>
                        <div className="grid grid-cols-1 gap-2">
                          {response.data.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">{response.data.phone}</span>
                            </div>
                          )}
                          {response.data.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">{response.data.email}</span>
                            </div>
                          )}
                          {response.data.website && (
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">{response.data.website}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{response.data.city}</span>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Financial Info */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">المعلومات المالية</h4>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            رأس المال: {response.data.capital} {response.data.currency}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            تاريخ التأسيس: {response.data.registrationDate}
                          </span>
                        </div>
                      </div>

                      <Separator />

                      {/* Partners */}
                      {response.data.partners && response.data.partners.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            الشركاء ({response.data.partners.length})
                          </h4>
                          <div className="space-y-1">
                            {response.data.partners.slice(0, 3).map((partner: any, index: number) => (
                              <div key={index} className="text-sm text-gray-600">
                                • {partner.name} ({partner.partnership?.[0]?.name || 'شريك'})
                              </div>
                            ))}
                            {response.data.partners.length > 3 && (
                              <div className="text-sm text-gray-500">
                                و {response.data.partners.length - 3} شريك آخر
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <Separator />

                      {/* Full Response */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">الاستجابة الكاملة من وثيق</h4>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <pre className="text-xs text-gray-600 overflow-auto max-h-40">
                            {JSON.stringify(response.data.fullResponse, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-red-600">
                      <p className="font-medium">خطأ في التحقق:</p>
                      <p className="text-sm">{response.error}</p>
                      {response.message && (
                        <p className="text-sm mt-1">{response.message}</p>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>أدخل رقم السجل التجاري لبدء التحقق</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


