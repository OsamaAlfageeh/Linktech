import crypto from 'crypto';
import { sendNotificationEmail } from './emailService';

// Temporary storage for OTP codes (in production, use Redis or similar)
interface OTPData {
  email: string;
  code: string;
  userData: any;
  expiresAt: Date;
  attempts: number;
}

// In-memory storage for OTP codes
const otpStorage = new Map<string, OTPData>();

// OTP configuration
const OTP_EXPIRY_MINUTES = 10; // OTP expires in 10 minutes
const MAX_ATTEMPTS = 3; // Maximum verification attempts

/**
 * Generate a 6-digit OTP code
 */
function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Store OTP data temporarily
 */
function storeOTP(email: string, userData: any): string {
  const code = generateOTP();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  
  otpStorage.set(email, {
    email,
    code,
    userData,
    expiresAt,
    attempts: 0
  });
  
  return code;
}

/**
 * Verify OTP code
 */
function verifyOTP(email: string, code: string): { valid: boolean; userData?: any; error?: string } {
  const otpData = otpStorage.get(email);
  
  if (!otpData) {
    return { valid: false, error: 'OTP not found or expired' };
  }
  
  // Check if OTP has expired
  if (new Date() > otpData.expiresAt) {
    otpStorage.delete(email);
    return { valid: false, error: 'OTP has expired' };
  }
  
  // Check if maximum attempts exceeded
  if (otpData.attempts >= MAX_ATTEMPTS) {
    otpStorage.delete(email);
    return { valid: false, error: 'Maximum verification attempts exceeded' };
  }
  
  // Increment attempts
  otpData.attempts++;
  
  // Check if code matches
  if (otpData.code !== code) {
    if (otpData.attempts >= MAX_ATTEMPTS) {
      otpStorage.delete(email);
    }
    return { valid: false, error: 'Invalid OTP code' };
  }
  
  // OTP is valid, get user data and clean up
  const userData = otpData.userData;
  otpStorage.delete(email);
  
  return { valid: true, userData };
}

/**
 * Send OTP verification email
 */
export async function sendOTPVerificationEmail(email: string, userData: any): Promise<{ success: boolean; otp?: string; error?: string }> {
  try {
    console.log('Sending OTP to:', email);
    // Store OTP data
    const otp = storeOTP(email, userData);
    console.log('Generated OTP:', otp);
    
    // Send email with OTP
    const emailSent = await sendNotificationEmail(
      email,
      userData.name || userData.username,
      'verification',
      'تأكيد البريد الإلكتروني - منصة لينكتك',
      `مرحباً ${userData.name || userData.username}،

تم إرسال رمز التحقق إلى بريدك الإلكتروني لإكمال عملية التسجيل في منصة لينكتك.

رمز التحقق: ${otp}

يرجى إدخال هذا الرمز في صفحة التسجيل لإكمال عملية إنشاء حسابك.

ملاحظة: هذا الرمز صالح لمدة ${OTP_EXPIRY_MINUTES} دقائق فقط.

مع تحيات،
فريق منصة لينكتك`
    );
    
    console.log('Email sent result:', emailSent);
    
    if (emailSent) {
      return { success: true, otp };
    } else {
      return { success: false, error: 'Failed to send verification email' };
    }
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Verify OTP code
 */
export function verifyOTPCode(email: string, code: string): { valid: boolean; userData?: any; error?: string } {
  return verifyOTP(email, code);
}

/**
 * Clean up expired OTPs (call this periodically)
 */
export function cleanupExpiredOTPs(): void {
  const now = new Date();
  for (const [email, otpData] of otpStorage.entries()) {
    if (now > otpData.expiresAt) {
      otpStorage.delete(email);
    }
  }
}

/**
 * Get OTP status for debugging
 */
export function getOTPStatus(email: string): { exists: boolean; attempts: number; expiresAt?: Date } {
  const otpData = otpStorage.get(email);
  if (!otpData) {
    return { exists: false, attempts: 0 };
  }
  
  return {
    exists: true,
    attempts: otpData.attempts,
    expiresAt: otpData.expiresAt
  };
}

/**
 * Resend OTP for existing email
 */
export async function resendOTPVerificationEmail(email: string): Promise<{ success: boolean; otp?: string; error?: string }> {
  try {
    console.log('Resending OTP to:', email);
    
    // Get existing OTP data
    const existingOtpData = otpStorage.get(email);
    if (!existingOtpData) {
      return { success: false, error: 'No pending OTP found for this email' };
    }
    
    // Generate new OTP and update storage
    const newOtp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    
    otpStorage.set(email, {
      ...existingOtpData,
      code: newOtp,
      expiresAt,
      attempts: 0 // Reset attempts
    });
    
    console.log('Generated new OTP:', newOtp);
    
    // Send email with new OTP
    const emailSent = await sendNotificationEmail(
      email,
      existingOtpData.userData.name || existingOtpData.userData.username,
      'verification',
      'تأكيد البريد الإلكتروني - منصة لينكتك',
      `مرحباً ${existingOtpData.userData.name || existingOtpData.userData.username}،

تم إرسال رمز التحقق الجديد إلى بريدك الإلكتروني لإكمال عملية التسجيل في منصة لينكتك.

رمز التحقق: ${newOtp}

يرجى إدخال هذا الرمز في صفحة التسجيل لإكمال عملية إنشاء حسابك.

ملاحظة: هذا الرمز صالح لمدة ${OTP_EXPIRY_MINUTES} دقائق فقط.

مع تحيات،
فريق منصة لينكتك`
    );
    
    console.log('Email resent result:', emailSent);
    
    if (emailSent) {
      return { success: true, otp: newOtp };
    } else {
      return { success: false, error: 'Failed to resend verification email' };
    }
  } catch (error) {
    console.error('Error resending OTP email:', error);
    return { success: false, error: 'Internal server error' };
  }
}

// Clean up expired OTPs every 5 minutes
setInterval(cleanupExpiredOTPs, 5 * 60 * 1000);
