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
import { validatePhoneNumber, validateEmail, validateName, validateContactForm } from '@/lib/validation';

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
  const [emailValidation, setEmailValidation] = useState<{ isValid: boolean; message?: string }>({ isValid: true });
  const [nameValidation, setNameValidation] = useState<{ isValid: boolean; message?: string }>({ isValid: true });
  
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
    
    // Comprehensive validation using expert validation system
    const validation = validateContactForm(contactForm);
    
    if (!validation.isValid) {
      // Update validation states for UI feedback
      setNameValidation(validation.errors.name ? { isValid: false, message: validation.errors.name } : { isValid: true });
      setEmailValidation(validation.errors.email ? { isValid: false, message: validation.errors.email } : { isValid: true });
      setPhoneValidation(validation.errors.phone ? { isValid: false, message: validation.errors.phone } : { isValid: true });
      
      // Show first error as toast
      const firstError = Object.values(validation.errors)[0];
      toast({
        title: "بيانات غير صحيحة",
        description: firstError,
        variant: "destructive",
      });
      return;
    }

    // All validations passed, use formatted data
    if (validation.formattedData) {
      setContactForm(validation.formattedData);
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
    
    // Enhanced real-time validation for all fields
    if (field === 'name') {
      const validation = validateName(value);
      setNameValidation(validation);
    } else if (field === 'email') {
      const validation = validateEmail(value);
      setEmailValidation(validation);
    } else if (field === 'phone') {
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
                      className={`${
                        contactForm.name && !nameValidation.isValid 
                          ? 'border-red-500 focus:border-red-500' 
                          : nameValidation.message && nameValidation.isValid
                          ? 'border-green-500 focus:border-green-500'
                          : ''
                      }`}
                      required
                    />
                    {contactForm.name && nameValidation.message && (
                      <p className={`text-sm mt-1 ${
                        nameValidation.isValid ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {nameValidation.message}
                      </p>
                    )}
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
                          className={`pr-10 ${
                            contactForm.email && !emailValidation.isValid 
                              ? 'border-red-500 focus:border-red-500' 
                              : emailValidation.message && emailValidation.isValid
                              ? 'border-green-500 focus:border-green-500'
                              : ''
                          }`}
                          required
                        />
                      </div>
                      {contactForm.email && emailValidation.message && (
                        <p className={`text-sm mt-1 ${
                          emailValidation.isValid ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {emailValidation.message}
                        </p>
                      )}
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
                              ? 'border-green-500 focus:border-green-500'
                              : ''
                          }`}
                          required
                        />
                      </div>
                      {contactForm.phone && phoneValidation.message && (
                        <p className={`text-sm mt-1 ${
                          phoneValidation.isValid ? 'text-green-600' : 'text-red-600'
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