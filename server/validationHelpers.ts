// Server-side validation helpers for phone numbers and emails
// Matches the client-side validation logic from client/src/lib/validation.ts

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  formattedValue?: string;
}

export function validatePhoneNumber(phone: string): ValidationResult {
  if (!phone) {
    return { isValid: false, message: 'رقم الهاتف مطلوب' };
  }

  // إزالة المسافات والأحرف غير الرقمية باستثناء + 
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  
  // التحقق من الأرقام السعودية
  if (cleanPhone.match(/^05\d{8}$/)) {
    // تنسيق الرقم السعودي المحلي إلى دولي
    const formattedPhone = `+966${cleanPhone.substring(1)}`;
    return { 
      isValid: true, 
      message: 'تم تنسيق الرقم إلى الصيغة الدولية',
      formattedValue: formattedPhone
    };
  }
  
  if (cleanPhone.match(/^01\d{8}$/)) {
    // تنسيق رقم الأرضي السعودي
    const formattedPhone = `+966${cleanPhone.substring(1)}`;
    return { 
      isValid: true, 
      message: 'تم تنسيق الرقم إلى الصيغة الدولية',
      formattedValue: formattedPhone
    };
  }
  
  // التحقق من الأرقام الدولية
  if (cleanPhone.match(/^\+966[15]\d{8}$/)) {
    return { 
      isValid: true, 
      message: 'رقم سعودي صحيح',
      formattedValue: cleanPhone
    };
  }
  
  // التحقق من صيغة الأرقام الدولية العامة
  if (cleanPhone.match(/^\+\d{10,15}$/)) {
    return { 
      isValid: true, 
      message: 'رقم دولي صحيح',
      formattedValue: cleanPhone
    };
  }
  
  return { 
    isValid: false, 
    message: 'صيغة رقم الهاتف غير صحيحة. يرجى إدخال رقم سعودي (05xxxxxxxx) أو رقم دولي (+966xxxxxxxxx)'
  };
}

export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { isValid: false, message: 'البريد الإلكتروني مطلوب' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'صيغة البريد الإلكتروني غير صحيحة' };
  }
  
  return { isValid: true, message: 'البريد الإلكتروني صحيح' };
}

export function validateName(name: string): ValidationResult {
  if (!name) {
    return { isValid: false, message: 'الاسم مطلوب' };
  }
  
  if (name.length < 2) {
    return { isValid: false, message: 'الاسم يجب أن يكون حرفين على الأقل' };
  }
  
  if (name.length > 100) {
    return { isValid: false, message: 'الاسم طويل جداً' };
  }
  
  return { isValid: true, message: 'الاسم صحيح' };
}