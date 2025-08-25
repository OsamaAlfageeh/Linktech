import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Shield, FileCheck, FileText, Lock, User, Phone, Mail, Users } from "lucide-react";

interface NdaDialogProps {
  projectId: number;
  projectTitle: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (ndaId: number) => void;
}

interface ContactFormData {
  companyRep: {
    name: string;
    email: string;
    phone: string;
  };
  entrepreneur: {
    name: string;
    email: string;
    phone: string;
  };
}

export function NdaDialog({
  projectId,
  projectTitle,
  isOpen,
  onOpenChange,
  onSuccess,
}: NdaDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [agreed, setAgreed] = useState(false);
  const [step, setStep] = useState<'contact-info' | 'agreement'>('contact-info');
  
  // Get current user info
  const { data: auth } = useQuery<any>({
    queryKey: ['/api/auth/user'],
  });

  // Contact form state - always collect both parties' info
  const [contactForm, setContactForm] = useState<ContactFormData>({
    companyRep: {
      name: auth?.user?.name || '',
      email: auth?.user?.email || '',
      phone: ''
    },
    entrepreneur: {
      name: '',
      email: '',
      phone: ''
    }
  });

  // Reset form when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setStep('contact-info');
      setAgreed(false);
      setContactForm({
        companyRep: {
          name: auth?.user?.name || '',
          email: auth?.user?.email || '',
          phone: ''
        },
        entrepreneur: {
          name: '',
          email: '',
          phone: ''
        }
      });
    }
  }, [isOpen, auth?.user]);

  // Create NDA with contact information
  const createNdaMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const response = await apiRequest("POST", `/api/projects/${projectId}/nda`, {
        entrepreneur: data.entrepreneur,
        companyRep: data.companyRep
      });
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/nda`] });
      
      toast({
        title: "تم إنشاء اتفاقية عدم الإفصاح",
        description: "تم إرسال الاتفاقية للتوقيع الإلكتروني عبر منصة صادق.",
      });

      onOpenChange(false);
      onSuccess?.(data.id);
    },
    onError: (error) => {
      toast({
        title: "حدث خطأ",
        description: error.message || "لم نتمكن من إنشاء اتفاقية عدم الإفصاح.",
        variant: "destructive",
      });
    },
  });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all required fields
    const { companyRep, entrepreneur } = contactForm;
    
    if (!companyRep.name || !companyRep.email || !companyRep.phone) {
      toast({
        title: "معلومات مطلوبة",
        description: "يرجى إكمال جميع معلومات ممثل الشركة.",
        variant: "destructive",
      });
      return;
    }

    if (!entrepreneur.name || !entrepreneur.email || !entrepreneur.phone) {
      toast({
        title: "معلومات مطلوبة", 
        description: "يرجى إكمال جميع معلومات رائد الأعمال.",
        variant: "destructive",
      });
      return;
    }

    // Move to agreement step
    setStep('agreement');
  };

  const handleAgreementSubmit = () => {
    if (!agreed) {
      toast({
        title: "موافقة مطلوبة",
        description: "يرجى الموافقة على شروط اتفاقية عدم الإفصاح.",
        variant: "destructive",
      });
      return;
    }

    createNdaMutation.mutate(contactForm);
  };

  const handleInputChange = (
    party: 'companyRep' | 'entrepreneur',
    field: 'name' | 'email' | 'phone',
    value: string
  ) => {
    setContactForm(prev => ({
      ...prev,
      [party]: {
        ...prev[party],
        [field]: value
      }
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            اتفاقية عدم الإفصاح - {projectTitle}
          </DialogTitle>
          <DialogDescription>
            {step === 'contact-info' 
              ? 'يرجى إدخال معلومات الاتصال لكلا الطرفين لإتمام عملية توقيع اتفاقية عدم الإفصاح'
              : 'يرجى مراجعة والموافقة على شروط اتفاقية عدم الإفصاح'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'contact-info' && (
          <form onSubmit={handleContactSubmit} className="space-y-6">
            {/* Company Representative Info */}
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="flex items-center mb-3">
                  <User className="h-5 w-5 text-blue-600 ml-2" />
                  <h3 className="font-medium text-blue-800">معلومات ممثل الشركة</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="company-name">الاسم الكامل *</Label>
                    <Input
                      id="company-name"
                      value={contactForm.companyRep.name}
                      onChange={(e) => handleInputChange('companyRep', 'name', e.target.value)}
                      placeholder="اسم ممثل الشركة"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company-email">البريد الإلكتروني *</Label>
                      <div className="relative">
                        <Mail className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="company-email"
                          type="email"
                          value={contactForm.companyRep.email}
                          onChange={(e) => handleInputChange('companyRep', 'email', e.target.value)}
                          placeholder="company@example.com"
                          className="pr-10"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="company-phone">رقم الهاتف *</Label>
                      <div className="relative">
                        <Phone className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="company-phone"
                          type="tel"
                          value={contactForm.companyRep.phone}
                          onChange={(e) => handleInputChange('companyRep', 'phone', e.target.value)}
                          placeholder="05xxxxxxxx"
                          className="pr-10"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Entrepreneur Info */}
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <div className="flex items-center mb-3">
                  <Users className="h-5 w-5 text-green-600 ml-2" />
                  <h3 className="font-medium text-green-800">معلومات رائد الأعمال</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="entrepreneur-name">الاسم الكامل *</Label>
                    <Input
                      id="entrepreneur-name"
                      value={contactForm.entrepreneur.name}
                      onChange={(e) => handleInputChange('entrepreneur', 'name', e.target.value)}
                      placeholder="اسم رائد الأعمال"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="entrepreneur-email">البريد الإلكتروني *</Label>
                      <div className="relative">
                        <Mail className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="entrepreneur-email"
                          type="email"
                          value={contactForm.entrepreneur.email}
                          onChange={(e) => handleInputChange('entrepreneur', 'email', e.target.value)}
                          placeholder="entrepreneur@example.com"
                          className="pr-10"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="entrepreneur-phone">رقم الهاتف *</Label>
                      <div className="relative">
                        <Phone className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="entrepreneur-phone"
                          type="tel"
                          value={contactForm.entrepreneur.phone}
                          onChange={(e) => handleInputChange('entrepreneur', 'phone', e.target.value)}
                          placeholder="05xxxxxxxx"
                          className="pr-10"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                إلغاء
              </Button>
              <Button type="submit">
                المتابعة إلى الاتفاقية
              </Button>
            </DialogFooter>
          </form>
        )}

        {step === 'agreement' && (
          <div className="space-y-6">
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <div className="flex items-start">
                <Shield className="h-5 w-5 text-amber-600 mt-0.5 ml-3 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-amber-800 mb-2">اتفاقية عدم الإفصاح</h3>
                  <p className="text-sm text-amber-700 mb-3">
                    بالموافقة على هذه الاتفاقية، فإنك تتعهد بعدم الكشف عن أي معلومات سرية 
                    أو مملوكة تتعلق بمشروع "{projectTitle}".
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="font-medium text-gray-800 mb-3">الأطراف المشاركة:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">ممثل الشركة:</span>
                  <span className="font-medium">{contactForm.companyRep.name} - {contactForm.companyRep.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">رائد الأعمال:</span>
                  <span className="font-medium">{contactForm.entrepreneur.name} - {contactForm.entrepreneur.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">المشروع:</span>
                  <span className="font-medium">{projectTitle}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="agree"
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(checked as boolean)}
                />
                <Label htmlFor="agree" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  أوافق على شروط اتفاقية عدم الإفصاح وألتزم بعدم الكشف عن المعلومات السرية
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('contact-info')}
              >
                العودة
              </Button>
              <Button
                onClick={handleAgreementSubmit}
                disabled={!agreed || createNdaMutation.isPending}
              >
                {createNdaMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4 ml-2" />
                    إنشاء اتفاقية عدم الإفصاح
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}