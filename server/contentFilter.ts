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
    // كشف أنماط الأرقام المشفرة
    /\b[0٠]?[5٥][0٠\s-]*[5٥6٦7٧8٨9٩][0٠\s-]*\d[\s0-9٠١٢٣٤٥٦٧٨٩-]{7,}\b/g, // أرقام سعودية مع احتمال استخدام أرقام عربية
    /\b[0٠]?[5٥][\s-]*\d{8}\b/g, // الرقم السعودي مع مسافات أو شرطات
  ],
  
  // عناوين البريد الإلكتروني
  emails: [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    // أنماط مخفية للبريد الإلكتروني
    /\b[A-Za-z0-9._%+-]+\s*[\[\(]at[\]\)]\s*[A-Za-z0-9.-]+\s*[\[\(]dot[\]\)]\s*[A-Za-z]{2,}\b/gi, // example [at] domain [dot] com
    /\b[A-Za-z0-9._%+-]+\s*\{\{at\}\}\s*[A-Za-z0-9.-]+\s*\{\{dot\}\}\s*[A-Za-z]{2,}\b/gi, // example{{at}}domain{{dot}}com
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
    // معرفات مواقع تواصل مخفية
    /\b(انستا|انستغرام|تويتر|تلغرام|تلجرام|فيسبوك|سناب|لينكد)[\s:]+[a-zA-Z0-9_.]{3,30}\b/g, // الاسم بالعربي متبوع بالمعرف
  ],

  // روابط مواقع خارجية (استثناء المواقع المعروفة مثل github.com, youtube.com)
  externalLinks: [
    /\b(https?:\/\/|www\.)[a-zA-Z0-9][-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?![-a-zA-Z0-9()@:%_\+.~#?&//=]*(?:github\.com|youtube\.com))/g,
  ],
  
  // كلمات مفتاحية تشير إلى محاولة مشاركة معلومات الاتصال
  contactKeywords: [
    /\b(اتصل\s+ب|اتصلوا\s+ب|اتصال|للتواصل|تواصل\s+مع|تواصلوا\s+مع|واتساب|واتس\s+اب|الواتس|جوال|رقم|موبايل|تلفون|هاتف|ارقام|ايميل|ايميلي|بريدي|الالكتروني|الإلكتروني|انستغرام|انستقرام|سناب|سناب\s+شات|اضفني)\b/g,
    /\b(call\s+me|contact\s+me|reach\s+me|my\s+number|my\s+email|my\s+whatsapp|my\s+snap|my\s+insta|my\s+handle)\b/gi
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
  
  // التحقق من الكلمات المفتاحية التي تشير إلى محاولة مشاركة معلومات الاتصال
  for (const pattern of contentFilters.contactKeywords) {
    if (pattern.test(text)) {
      violations.push('محاولة_مشاركة_معلومات_اتصال');
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