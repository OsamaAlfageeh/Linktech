import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, CheckCircle, AlertCircle, Clock, Banknote, CalendarDays, MessageSquare, X } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface Offer {
  id: number;
  projectId: number;
  companyId: number;
  amount: string;
  duration: string;
  description: string;
  status: string;
  depositPaid: boolean;
  depositAmount: string | null;
  depositDate: string | null;
  contactRevealed: boolean;
  createdAt: string;
  companyName?: string;
  companyLogo?: string;
  companyVerified?: boolean;
  companyRating?: number;
  companyEmail?: string;
  companyUsername?: string;
  companyContactRevealed?: boolean;
}

type Project = {
  id: number;
  title: string;
  description: string;
  budget: string;
  duration: string;
  skills: string[];
  status: string;
  highlightStatus?: string;
  userId: number;
  createdAt: string;
  requiresNda?: boolean;
  ndaId?: number;
  selectedOfferId?: number | null;
}

interface ProjectExecutionStatusProps {
  projectId: number;
}

export function ProjectExecutionStatus({ projectId }: ProjectExecutionStatusProps) {
  const { toast } = useToast();

  // جلب تفاصيل المشروع
  const { data: project, isLoading: isProjectLoading } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
    enabled: Boolean(projectId),
  });

  // جلب العروض الخاصة بالمشروع
  const { data: offers, isLoading: isOffersLoading, error } = useQuery<Offer[]>({
    queryKey: [`/api/projects/${projectId}/offers`],
    enabled: Boolean(projectId),
    staleTime: 0,
  });

  // التحقق من حالة التحميل
  if (isProjectLoading || isOffersLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="mr-2">جاري تحميل البيانات...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-6 text-destructive">
        <AlertCircle className="h-6 w-6 ml-2" />
        <span>حدث خطأ أثناء تحميل العروض</span>
      </div>
    );
  }

  // إذا كان المشروع غير متاح أو لا يوجد عروض
  if (!project || !offers || offers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>حالة المشروع: {project && project.status === "in-progress" ? "قيد التنفيذ" : "مكتمل"}</CardTitle>
          <CardDescription>
            {project && project.status === "in-progress" 
              ? "المشروع قيد التنفيذ حالياً. يمكنك متابعة التقدم وإدارة المشروع من لوحة التحكم الخاصة بك." 
              : "المشروع مكتمل. يمكنك الاطلاع على سجل المشروع من لوحة التحكم الخاصة بك."}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/dashboard/entrepreneur?tab=projects">
            <Button variant="outline">الذهاب للوحة التحكم</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  // الحصول على العرض المقبول
  const acceptedOffer = offers.find(offer => 
    offer.status === 'accepted' && offer.depositPaid === true
  );

  // الحصول على العروض المرفوضة أو غير المختارة
  const otherOffers = offers.filter(offer => 
    offer.status === 'rejected' || 
    (acceptedOffer ? offer.id !== acceptedOffer.id : offer.status !== 'accepted')
  );

  return (
    <Card className="border-2 border-primary/10">
      <CardHeader className="bg-primary/5">
        <CardTitle className="text-xl text-primary">حالة المشروع: قيد التنفيذ</CardTitle>
        <CardDescription>
          المشروع قيد التنفيذ حالياً. يمكنك متابعة التقدم وإدارة المشروع من لوحة التحكم الخاصة بك.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6">
        {acceptedOffer ? (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">الشركة المنفذة للمشروع</h3>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center">
                <Avatar className="h-12 w-12 ml-3">
                  <AvatarImage src={acceptedOffer.companyLogo} alt={acceptedOffer.companyName || ""} />
                  <AvatarFallback>{acceptedOffer.companyName?.charAt(0) || "ش"}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center">
                    <h4 className="font-bold text-lg">{acceptedOffer.companyName}</h4>
                    {acceptedOffer.companyVerified && <CheckCircle className="text-primary h-4 w-4 mr-1" />}
                  </div>
                  {acceptedOffer.companyRating && (
                    <div className="flex items-center mt-1">
                      <span className="ml-1">{acceptedOffer.companyRating}</span>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={`text-sm ${i < Math.floor(acceptedOffer.companyRating || 0) ? 'text-yellow-500' : 'text-gray-300'}`}>★</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-3 bg-white rounded-lg border border-green-100">
                  <div className="flex items-center">
                    <Banknote className="h-5 w-5 ml-2 text-green-600" />
                    <span className="font-bold ml-1">قيمة العقد:</span>
                  </div>
                  <div className="mt-1 text-center font-medium">
                    {acceptedOffer.amount} ريال
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-green-100">
                  <div className="flex items-center">
                    <CalendarDays className="h-5 w-5 ml-2 text-green-600" />
                    <span className="font-bold ml-1">مدة التنفيذ:</span>
                  </div>
                  <div className="mt-1 text-center font-medium">
                    {acceptedOffer.duration}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-white rounded-lg border border-green-100">
                <h5 className="font-bold text-green-800 mb-2">معلومات التواصل:</h5>
                <div className="grid gap-2">
                  {acceptedOffer.companyEmail && (
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <span className="font-semibold ml-2">البريد الإلكتروني:</span>
                      </div>
                      <div className="mt-1 w-full overflow-hidden text-ellipsis">
                        <a href={`mailto:${acceptedOffer.companyEmail}`} className="text-primary hover:underline break-all">
                          {acceptedOffer.companyEmail}
                        </a>
                      </div>
                    </div>
                  )}
                  {acceptedOffer.companyUsername && (
                    <div className="mt-3 w-full">
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => window.location.href = `/messages?userId=${acceptedOffer.companyUsername}`}
                      >
                        <MessageSquare className="ml-2 h-4 w-4" />
                        التواصل عبر الرسائل
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 text-center">
            <p className="text-yellow-600">
              لم يتم اختيار أي شركة لتنفيذ المشروع بعد
            </p>
          </div>
        )}
        
        {otherOffers.length > 0 && (
          <div className="mt-8">
            <Accordion type="single" collapsible>
              <AccordionItem value="other-offers">
                <AccordionTrigger className="text-lg font-semibold">
                  العروض الأخرى ({otherOffers.length})
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-4 mt-2">
                    {otherOffers.map((offer: Offer) => (
                      <div key={offer.id} className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 ml-2">
                              <AvatarImage src={offer.companyLogo} alt={offer.companyName || ""} />
                              <AvatarFallback>{offer.companyName?.charAt(0) || "C"}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center">
                                <h4 className="font-bold">{offer.companyName || "شركة"}</h4>
                                {offer.companyVerified && <CheckCircle className="text-primary h-3 w-3 mr-1" />}
                              </div>
                            </div>
                          </div>
                          <Badge variant="secondary">
                            {offer.status === 'rejected' ? 'مرفوض' : 'غير مقبول'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                          <div className="flex items-center">
                            <Banknote className="h-4 w-4 ml-1 text-neutral-600" />
                            <span className="font-medium ml-1">العرض:</span>
                            <span>{offer.amount} ريال</span>
                          </div>
                          <div className="flex items-center">
                            <CalendarDays className="h-4 w-4 ml-1 text-neutral-600" />
                            <span className="font-medium ml-1">المدة:</span>
                            <span>{offer.duration}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="bg-primary/5 flex justify-center">
        <Link href="/dashboard/entrepreneur?tab=projects">
          <Button variant="default">
            الذهاب للوحة التحكم
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}