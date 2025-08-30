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

  // Remove all spaces, dashes, and special characters except +
  const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
  
  // STRICT VALIDATION FOR SADIQ API COMPATIBILITY
  // Only accept: +966XXXXXXXX (exactly 8 digits) or 00966XXXXXXXX (exactly 8 digits)
  
  // Pattern 1: +966 followed by exactly 8 digits (mobile: 5XXXXXXX or landline: 1XXXXXXX)
  const sadiqFormat1 = /^\+966[15]\d{7}$/;
  
  // Pattern 2: 00966 followed by exactly 8 digits  
  const sadiqFormat2 = /^00966[15]\d{7}$/;
  
  // Check +966 format (8 digits after +966)
  if (sadiqFormat1.test(cleanPhone)) {
    return {
      isValid: true,
      message: `رقم صحيح متوافق مع صادق: ${cleanPhone}`,
      formattedValue: cleanPhone
    };
  }
  
  // Check 00966 format (8 digits after 00966) - convert to +966
  if (sadiqFormat2.test(cleanPhone)) {
    const converted = '+966' + cleanPhone.substring(5); // Remove '00966' and add '+966'
    return {
      isValid: true,
      message: `تم تحويل الرقم إلى صيغة صادق: ${converted}`,
      formattedValue: converted
    };
  }
  
  // Reject local format - must use country code
  if (cleanPhone.startsWith('05') || cleanPhone.startsWith('01')) {
    return {
      isValid: false,
      message: 'يجب استخدام الرقم مع رمز البلد (+966). الأرقام المحلية (05..., 01...) غير مقبولة مع صادق'
    };
  }
  
  return { 
    isValid: false, 
    message: 'يجب إدخال رقم هاتف سعودي صحيح مع رمز البلد: +96651234567 (جوال) أو +96611234567 (أرضي). يجب أن يكون بالضبط 8 أرقام بعد +966. لا يُقبل الأرقام المحلية (05..., 01...)'
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