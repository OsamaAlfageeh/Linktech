/**
 * وحدة تصفية المحتوى
 * تستخدم للتحقق من المحتوى وحظر إرسال معلومات التواصل في المحادثات
 */

/**
 * تعبيرات منتظمة للكشف عن أنماط معلومات التواصل الشائعة
 */
const contentFilters = {
  // أرقام الهواتف بصيغ مختلفة
  phoneNumbers: [
    /\b\d{10}\b/g, // 5551234567
    /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, // 555-123-4567 or 555.123.4567 or 555 123 4567
    /\b\(\d{3}\)[-.\s]?\d{3}[-.\s]?\d{4}\b/g, // (555)-123-4567
    /\b\+?\d{1,3}[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, // +1-555-123-4567 or +966555123456
    /\b\+?\d{1,3}[-.\s]?\d{9,10}\b/g, // +1-5551234567 or +9665551234567
    /\b05\d{8}\b/g, // 05xxxxxxxx (Saudi format)
    /\b5\d{8}\b/g, // 5xxxxxxxx (Saudi format without leading 0)
    /\+?\d{4,15}\b/g, // أي رقم بين 4 و15 رقم متتالي مع احتمال وجود + في البداية 
  ],
  
  // عناوين البريد الإلكتروني
  emails: [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g
  ],
  
  // حسابات مواقع التواصل الاجتماعي
  socialAccounts: [
    /\b(wa\.me|whatsapp\.com|t\.me|telegram\.me)\/[a-zA-Z0-9_\.]+\b/g, // واتساب وتليجرام
    /\b@[a-zA-Z0-9_.]{1,30}\b/g, // معرفات تويتر وإنستجرام
    /\b(instagram\.com|twitter\.com|x\.com|facebook\.com|fb\.com|snap\.chat|snapchat\.com)\/[a-zA-Z0-9_.]+\b/g, // روابط مواقع التواصل
    /\btwitter\.com\/[a-zA-Z0-9_]{1,15}\b/g,
    /\binstagram\.com\/[a-zA-Z0-9_.]{1,30}\b/g,
    /\bfacebook\.com\/[a-zA-Z0-9.]{5,50}\b/g,
    /\bsnapchat\.com\/add\/[a-zA-Z0-9_.]{3,15}\b/g,
    /\blinkedin\.com\/in\/[a-zA-Z0-9_-]{5,30}\b/g,
  ],

  // روابط مواقع خارجية (استثناء المواقع المعروفة مثل github.com, youtube.com)
  externalLinks: [
    /\b(https?:\/\/|www\.)[a-zA-Z0-9][-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?![-a-zA-Z0-9()@:%_\+.~#?&//=]*(?:github\.com|youtube\.com))/g,
  ]
};

/**
 * التحقق من نص ما إذا كان يحتوي على معلومات تواصل محظورة
 * @param text النص المراد فحصه
 * @returns حالة النص (آمن أم لا) ونوع المعلومات المحظورة إن وجدت
 */
export function checkMessageForProhibitedContent(text: string): { safe: boolean; violations?: string[] } {
  if (!text || typeof text !== 'string') {
    return { safe: true };
  }

  const violations: string[] = [];

  // التحقق من أرقام الهواتف
  for (const pattern of contentFilters.phoneNumbers) {
    if (pattern.test(text)) {
      violations.push('رقم_هاتف');
      break;
    }
  }

  // التحقق من البريد الإلكتروني
  for (const pattern of contentFilters.emails) {
    if (pattern.test(text)) {
      violations.push('بريد_إلكتروني');
      break;
    }
  }

  // التحقق من حسابات التواصل الاجتماعي
  for (const pattern of contentFilters.socialAccounts) {
    if (pattern.test(text)) {
      violations.push('حساب_تواصل_اجتماعي');
      break;
    }
  }

  // التحقق من الروابط الخارجية
  for (const pattern of contentFilters.externalLinks) {
    if (pattern.test(text)) {
      violations.push('رابط_خارجي');
      break;
    }
  }

  return {
    safe: violations.length === 0,
    violations: violations.length > 0 ? violations : undefined
  };
}

/**
 * تنظيف محتوى الرسالة من المعلومات المحظورة
 * @param text محتوى الرسالة الأصلي
 * @returns محتوى منظف أو تحذير إذا كان المحتوى محظوراً
 */
export function sanitizeMessageContent(text: string): string {
  const checkResult = checkMessageForProhibitedContent(text);
  
  if (!checkResult.safe) {
    const violationTypes = checkResult.violations?.join('، ');
    return `[تم حظر هذه الرسالة لأنها تحتوي على: ${violationTypes}]`;
  }
  
  return text;
}