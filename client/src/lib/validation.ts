// Expert-level validation utilities for NDA forms

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  formattedValue?: string;
}

/**
 * Comprehensive phone number validation for Saudi and international numbers
 * Supports Sadiq API requirements
 */
export function validatePhoneNumber(phone: string): ValidationResult {
  if (!phone) {
    return { isValid: false, message: 'رقم الهاتف مطلوب' };
  }

  // Remove all spaces, dashes, and special characters except +
  const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
  
  // STRICT VALIDATION FOR SADIQ API COMPATIBILITY
  // Only accept: +966XXXXXXXXX (exactly 9 digits) or 00966XXXXXXXXX (exactly 9 digits)
  
  // Pattern 1: +966 followed by exactly 9 digits (mobile: 5XXXXXXXX or landline: 1XXXXXXXX)
  const sadiqFormat1 = /^\+966[15]\d{8}$/;
  
  // Pattern 2: 00966 followed by exactly 9 digits  
  const sadiqFormat2 = /^00966[15]\d{8}$/
  
  // Check +966 format (9 digits after +966)
  if (sadiqFormat1.test(cleanPhone)) {
    return {
      isValid: true,
      message: `رقم صحيح متوافق مع صادق: ${cleanPhone}`,
      formattedValue: cleanPhone
    };
  }
  
  // Check 00966 format (9 digits after 00966) - convert to +966
  if (sadiqFormat2.test(cleanPhone)) {
    const converted = '+966' + cleanPhone.substring(5); // Remove '00966' and add '+966'
    return {
      isValid: true,
      message: `تم تحويل الرقم إلى صيغة صادق: ${converted}`,
      formattedValue: converted
    };
  }
  
  // Specific error messages for common mistakes
  if (cleanPhone.startsWith('+966') && !/^\+966[15]\d{8}$/.test(cleanPhone)) {
    return {
      isValid: false,
      message: 'رقم +966 يجب أن يكون متبوعاً بـ 9 أرقام بالضبط (مثال: +966512345678)'
    };
  }
  
  if (cleanPhone.startsWith('00966') && !/^00966[15]\d{8}$/.test(cleanPhone)) {
    return {
      isValid: false,
      message: 'رقم 00966 يجب أن يكون متبوعاً بـ 9 أرقام بالضبط (مثال: 00966512345678)'
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
    message: 'يجب إدخال رقم هاتف سعودي صحيح مع رمز البلد:\n• +966512345678 أو 00966512345678\n• يجب أن يكون بالضبط 9 أرقام بعد +966 أو 0096\n• لا يُقبل الأرقام المحلية (05..., 01...)'
  };
}

/**
 * Comprehensive email validation
 */
export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { isValid: false, message: 'البريد الإلكتروني مطلوب' };
  }

  // Basic email pattern
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!emailPattern.test(email)) {
    return {
      isValid: false,
      message: 'تنسيق البريد الإلكتروني غير صحيح'
    };
  }
  
  // Check for common issues
  if (email.includes('..')) {
    return {
      isValid: false,
      message: 'البريد الإلكتروني لا يجب أن يحتوي على نقطتين متتاليتين'
    };
  }
  
  if (email.startsWith('.') || email.endsWith('.')) {
    return {
      isValid: false,
      message: 'البريد الإلكتروني لا يجب أن يبدأ أو ينتهي بنقطة'
    };
  }
  
  if (email.length > 254) {
    return {
      isValid: false,
      message: 'البريد الإلكتروني طويل جداً (أكثر من 254 حرف)'
    };
  }
  
  const localPart = email.split('@')[0];
  if (localPart.length > 64) {
    return {
      isValid: false,
      message: 'الجزء المحلي من البريد الإلكتروني طويل جداً'
    };
  }
  
  return {
    isValid: true,
    message: 'البريد الإلكتروني صحيح',
    formattedValue: email.toLowerCase()
  };
}

/**
 * Validate name field
 */
export function validateName(name: string): ValidationResult {
  if (!name) {
    return { isValid: false, message: 'الاسم مطلوب' };
  }
  
  if (name.trim().length < 2) {
    return {
      isValid: false,
      message: 'الاسم يجب أن يحتوي على حرفين على الأقل'
    };
  }
  
  if (name.trim().length > 100) {
    return {
      isValid: false,
      message: 'الاسم طويل جداً (أكثر من 100 حرف)'
    };
  }
  
  // Check for basic name pattern (letters, spaces, some Arabic chars)
  const namePattern = /^[\u0600-\u06FFa-zA-Z\s\-\.]+$/;
  if (!namePattern.test(name)) {
    return {
      isValid: false,
      message: 'الاسم يجب أن يحتوي على أحرف وأرقام ومسافات فقط'
    };
  }
  
  return {
    isValid: true,
    message: 'الاسم صحيح',
    formattedValue: name.trim()
  };
}

/**
 * Validate all contact form fields
 */
export function validateContactForm(form: {
  name: string;
  email: string;
  phone: string;
}): {
  isValid: boolean;
  errors: Record<string, string>;
  formattedData?: { name: string; email: string; phone: string };
} {
  const nameValidation = validateName(form.name);
  const emailValidation = validateEmail(form.email);
  const phoneValidation = validatePhoneNumber(form.phone);
  
  const errors: Record<string, string> = {};
  
  if (!nameValidation.isValid) {
    errors.name = nameValidation.message || '';
  }
  
  if (!emailValidation.isValid) {
    errors.email = emailValidation.message || '';
  }
  
  if (!phoneValidation.isValid) {
    errors.phone = phoneValidation.message || '';
  }
  
  const isValid = Object.keys(errors).length === 0;
  
  return {
    isValid,
    errors,
    formattedData: isValid ? {
      name: nameValidation.formattedValue || form.name,
      email: emailValidation.formattedValue || form.email,
      phone: phoneValidation.formattedValue || form.phone
    } : undefined
  };
}