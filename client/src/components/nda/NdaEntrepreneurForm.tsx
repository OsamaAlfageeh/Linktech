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
import { Shield, FileCheck, Users, Phone, Mail } from "lucide-react";

interface NdaEntrepreneurFormProps {
  ndaId: number;
  projectTitle: string;
  companyName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface EntrepreneurFormData {
  name: string;
  email: string;
  phone: string;
}

// Phone number validation
const validatePhoneNumber = (phone: string): { isValid: boolean; message?: string } => {
  if (!phone.trim()) {
    return { isValid: false, message: "رقم الهاتف مطلوب" };
  }

  // Remove spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Check for valid international format
  if (cleaned.match(/^\+\d{1,4}\d{7,14}$/)) {
    // Saudi numbers are preferred for Sadiq integration
    if (cleaned.startsWith('+966')) {
      return { isValid: true };
    }
    // Other international numbers
    return { 
      isValid: true, 
      message: "ملاحظة: أرقام السعودية (+966) مفضلة لضمان أفضل توافق مع منصة صادق" 
    };
  }
  
  // Check for Saudi domestic format (05xxxxxxxx)
  if (cleaned.match(/^05\d{8}$/)) {
    return { isValid: true };
  }
  
  // Invalid format
  return { 
    isValid: false, 
    message: "تنسيق غير صحيح. استخدم +966xxxxxxxx أو 05xxxxxxxx للأرقام السعودية" 
  };
};

export function NdaEntrepreneurForm({
  ndaId,
  projectTitle,
  companyName,
  isOpen,
  onOpenChange,
  onSuccess,
}: NdaEntrepreneurFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [agreed, setAgreed] = useState(false);
  const [step, setStep] = useState<'contact-info' | 'agreement'>('contact-info');
  const [phoneValidation, setPhoneValidation] = useState<{ isValid: boolean; message?: string }>({ isValid: true });
  
  // Get current user info
  const { data: auth } = useQuery<any>({
    queryKey: ['/api/auth/user'],
  });

  // Entrepreneur contact form state
  const [contactForm, setContactForm] = useState<EntrepreneurFormData>({
    name: auth?.user?.name || '',
    email: auth?.user?.email || '',
    phone: ''
  });

  // Reset form when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setStep('contact-info');
      setAgreed(false);
      setContactForm({
        name: auth?.user?.name || '',
        email: auth?.user?.email || '',
        phone: ''
      });
    }
  }, [isOpen, auth?.user]);

  // Complete NDA with entrepreneur contact info
  const completeNdaMutation = useMutation({
    mutationFn: async (data: EntrepreneurFormData) => {
      const response = await apiRequest("POST", `/api/nda/${ndaId}/complete`, {
        entrepreneur: data
      });
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: [`/api/nda/${ndaId}`] });
      
      toast({
        title: "تم إكمال طلب اتفاقية عدم الإفصاح",
        description: "تم إرسال الاتفاقية للتوقيع الإلكتروني عبر منصة صادق.",
      });

      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "حدث خطأ",
        description: error.message || "لم نتمكن من إكمال طلب اتفاقية عدم الإفصاح.",
        variant: "destructive",
      });
    },
  });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate entrepreneur fields
    if (!contactForm.name || !contactForm.email || !contactForm.phone) {
      toast({
        title: "معلومات مطلوبة",
        description: "يرجى إكمال جميع معلوماتك الشخصية.",
        variant: "destructive",
      });
      return;
    }

    // Validate phone number format
    const phoneCheck = validatePhoneNumber(contactForm.phone);
    if (!phoneCheck.isValid) {
      toast({
        title: "تنسيق رقم الهاتف غير صحيح",
        description: phoneCheck.message,
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

    completeNdaMutation.mutate(contactForm);
  };

  const handleInputChange = (
    field: 'name' | 'email' | 'phone',
    value: string
  ) => {
    setContactForm(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Validate phone number in real-time
    if (field === 'phone') {
      const validation = validatePhoneNumber(value);
      setPhoneValidation(validation);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            إكمال اتفاقية عدم الإفصاح - {projectTitle}
          </DialogTitle>
          <DialogDescription>
            {step === 'contact-info' 
              ? 'يرجى إدخال معلومات الاتصال الخاصة بك لإتمام طلب اتفاقية عدم الإفصاح'
              : 'يرجى مراجعة والموافقة على شروط اتفاقية عدم الإفصاح'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'contact-info' && (
          <form onSubmit={handleContactSubmit} className="space-y-6">
            {/* Company info (read-only display) */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex items-center mb-3">
                <Shield className="h-5 w-5 text-blue-600 ml-2" />
                <h3 className="font-medium text-blue-800">طلب من شركة</h3>
              </div>
              <p className="text-sm text-blue-700">
                شركة <strong>{companyName}</strong> طلبت توقيع اتفاقية عدم إفصاح لمشروعك "{projectTitle}".
              </p>
            </div>

            {/* Entrepreneur Info */}
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <div className="flex items-center mb-3">
                  <Users className="h-5 w-5 text-green-600 ml-2" />
                  <h3 className="font-medium text-green-800">معلوماتك الشخصية</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="entrepreneur-name">الاسم الكامل *</Label>
                    <Input
                      id="entrepreneur-name"
                      value={contactForm.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="اسمك الكامل"
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
                          value={contactForm.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="your@email.com"
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
                          value={contactForm.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="+966xxxxxxxx أو 05xxxxxxxx"
                          className={`pr-10 ${
                            contactForm.phone && !phoneValidation.isValid 
                              ? 'border-red-500 focus:border-red-500' 
                              : phoneValidation.message && phoneValidation.isValid
                              ? 'border-yellow-500 focus:border-yellow-500'
                              : ''
                          }`}
                          required
                        />
                      </div>
                      {contactForm.phone && phoneValidation.message && (
                        <p className={`text-sm mt-1 ${
                          phoneValidation.isValid ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {phoneValidation.message}
                        </p>
                      )}
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
                    أو مملوكة تتعلق بمشروع "{projectTitle}" مع شركة {companyName}.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="font-medium text-gray-800 mb-3">معلومات الاتفاقية:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">الشركة الطالبة:</span>
                  <span className="font-medium">{companyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">رائد الأعمال:</span>
                  <span className="font-medium">{contactForm.name} - {contactForm.email}</span>
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
                disabled={!agreed || completeNdaMutation.isPending}
              >
                {completeNdaMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                    جاري الإكمال...
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4 ml-2" />
                    إكمال اتفاقية عدم الإفصاح
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