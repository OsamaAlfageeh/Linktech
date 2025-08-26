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
  
  // Saudi phone number patterns
  const saudiMobile = /^(\+966|0966|966)?[5]\d{8}$/; // 05xxxxxxxx or +966xxxxxxxx
  const saudiLandline = /^(\+966|0966|966)?[1][1-9]\d{7}$/; // 011xxxxxxx or +966xxxxxxxx
  
  // International phone number pattern (basic)
  const international = /^\+[1-9]\d{6,14}$/;
  
  // Check Saudi mobile numbers
  if (saudiMobile.test(cleanPhone)) {
    let formatted: string;
    
    if (cleanPhone.startsWith('+966')) {
      formatted = cleanPhone;
    } else if (cleanPhone.startsWith('0966')) {
      formatted = '+' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('966')) {
      formatted = '+' + cleanPhone;
    } else if (cleanPhone.startsWith('05')) {
      formatted = '+966' + cleanPhone.substring(1);
    } else {
      formatted = '+966' + cleanPhone;
    }
    
    return {
      isValid: true,
      message: `رقم جوال سعودي صحيح: ${formatted}`,
      formattedValue: formatted
    };
  }
  
  // Check Saudi landline numbers
  if (saudiLandline.test(cleanPhone)) {
    let formatted: string;
    
    if (cleanPhone.startsWith('+966')) {
      formatted = cleanPhone;
    } else if (cleanPhone.startsWith('0966')) {
      formatted = '+' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('966')) {
      formatted = '+' + cleanPhone;
    } else if (cleanPhone.startsWith('01')) {
      formatted = '+966' + cleanPhone.substring(1);
    } else {
      formatted = '+966' + cleanPhone;
    }
    
    return {
      isValid: true,
      message: `رقم هاتف أرضي سعودي صحيح: ${formatted}`,
      formattedValue: formatted
    };
  }
  
  // Check international numbers
  if (international.test(cleanPhone)) {
    return {
      isValid: true,
      message: `رقم هاتف دولي صحيح: ${cleanPhone}`,
      formattedValue: cleanPhone
    };
  }
  
  // Common error cases with helpful messages
  if (cleanPhone.startsWith('05') && cleanPhone.length !== 10) {
    return {
      isValid: false,
      message: 'أرقام الجوال السعودية يجب أن تكون 10 أرقام (05xxxxxxxx)'
    };
  }
  
  if (cleanPhone.startsWith('01') && cleanPhone.length !== 10) {
    return {
      isValid: false,
      message: 'أرقام الهاتف الأرضي السعودية يجب أن تكون 10 أرقام (01xxxxxxxx)'
    };
  }
  
  if (cleanPhone.startsWith('+966') && (cleanPhone.length < 13 || cleanPhone.length > 13)) {
    return {
      isValid: false,
      message: 'أرقام الهاتف السعودية بالصيغة الدولية يجب أن تكون +966xxxxxxxxx'
    };
  }
  
  if (cleanPhone.startsWith('+') && cleanPhone.length < 8) {
    return {
      isValid: false,
      message: 'رقم الهاتف الدولي قصير جداً'
    };
  }
  
  if (cleanPhone.startsWith('+') && cleanPhone.length > 16) {
    return {
      isValid: false,
      message: 'رقم الهاتف الدولي طويل جداً'
    };
  }
  
  return {
    isValid: false,
    message: 'تنسيق رقم الهاتف غير صحيح. استخدم: 05xxxxxxxx أو +966xxxxxxxxx'
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