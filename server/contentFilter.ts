/**
 * وحدة تصفية المحتوى
 * تستخدم للتحقق من المحتوى وحظر إرسال معلومات التواصل في المحادثات
 * تتضمن حماية من محاولات تمرير معلومات الاتصال عبر رسائل متعددة
 */

// هيكل لتخزين الرسائل الأخيرة بين المستخدمين لكشف محاولات تجاوز الفلتر
interface ConversationHistory {
  userId1: number;
  userId2: number;
  messages: {
    content: string;
    timestamp: number;
  }[];
}

// تخزين تاريخ المحادثات للكشف عن محاولات تجاوز الفلتر
const conversationHistories: ConversationHistory[] = [];

// عدد الرسائل التي يتم الاحتفاظ بها في التاريخ (للمستخدمين المتحادثين)
const MESSAGE_HISTORY_LIMIT = 5;

// الحد الأقصى للوقت بين الرسائل لاعتبارها متسلسلة (بالمللي ثانية)
const MAX_SEQUENTIAL_MESSAGE_TIME = 60000; // دقيقة واحدة

/**
 * تعبيرات منتظمة للكشف عن أنماط معلومات التواصل الشائعة
 */
 
// قاموس تحويل الأرقام المكتوبة باللغة العربية إلى أرقام
const arabicWordsToDigits: Record<string, string> = {
  صفر: '0',
  زيرو: '0',
  واحد: '1',
  اثنين: '2',
  اثنان: '2',
  إثنين: '2',
  ثلاثة: '3',
  ثلاث: '3',
  ثلاثه: '3',
  اربعة: '4',
  اربع: '4',
  أربعة: '4',
  أربع: '4',
  خمسة: '5',
  خمس: '5',
  خمسه: '5',
  ستة: '6',
  ست: '6',
  سته: '6',
  سبعة: '7',
  سبع: '7',
  سبعه: '7',
  ثمانية: '8',
  ثمان: '8',
  ثمانيه: '8',
  تسعة: '9',
  تسع: '9',
  تسعه: '9'
};

// قاموس تحويل الأرقام العربية إلى الأرقام الإنجليزية
const arabicDigitsMap: Record<string, string> = {
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9'
};

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
 * تحويل الأرقام العربية (٠١٢٣٤٥٦٧٨٩) إلى أرقام إنجليزية (0123456789)
 * @param text النص المراد تحويله
 * @returns النص بعد تحويل الأرقام العربية إلى إنجليزية
 */
function convertArabicDigitsToEnglish(text: string): string {
  if (!text) return '';
  
  // تحويل كل رقم عربي إلى ما يقابله بالإنجليزية
  return text.replace(/[٠١٢٣٤٥٦٧٨٩]/g, (match) => {
    return arabicDigitsMap[match] || match;
  });
}

/**
 * تحويل الكلمات العربية التي تمثل أرقامًا إلى أرقام
 * @param text النص المراد فحصه
 * @returns نص بعد تحويل كلمات الأرقام العربية إلى أرقام فعلية
 */
function convertArabicWordsToDigits(text: string): string {
  // تحويل الأرقام العربية إلى إنجليزية أولاً
  const textWithEnglishDigits = convertArabicDigitsToEnglish(text);
  
  // تعديل النص لتسهيل التعرف على الكلمات
  // إزالة علامات الترقيم والمسافات المتعددة
  const processedText = textWithEnglishDigits.replace(/[.\-,،+\/\\]/g, ' ').replace(/\s+/g, ' ');
  
  // تقسيم النص إلى كلمات
  const words = processedText.split(/\s+/);
  let result = '';
  let consecutiveDigits = '';
  let digitCount = 0;
  
  for (let i = 0; i < words.length; i++) {
    // تطهير الكلمة من أي رموز غير مرغوب بها
    const word = words[i].trim().replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\w]/g, '');
    
    // البحث عن كلمة في قاموس تحويل الأرقام
    const digit = arabicWordsToDigits[word];
    
    if (digit) {
      consecutiveDigits += digit;
      digitCount++;
    } else {
      // فحص إذا كانت الكلمة تحتوي أرقام مباشرة (للتعامل مع حالات مثل "رقم5")
      const extractedDigits = word.match(/\d+/g);
      if (extractedDigits) {
        for (const num of extractedDigits) {
          consecutiveDigits += num;
          digitCount += num.length;
        }
      } else {
        // إذا كانت هناك مسافة أو فاصل ولدينا أرقام متتالية كافية، نضيفها للنتيجة
        if (consecutiveDigits.length >= 4) {
          // إذا كان لدينا رقم سعودي محتمل (يبدأ بـ "0" أو "5")
          if (consecutiveDigits.match(/^0?5/) && consecutiveDigits.length >= 9) {
            result += ' ' + consecutiveDigits + ' ';
          } 
          // أو إذا كان لدينا رقم طويل (5+ أرقام)
          else if (consecutiveDigits.length >= 5) {
            result += ' ' + consecutiveDigits + ' ';
          }
        }
        consecutiveDigits = '';
        digitCount = 0;
      }
    }
    
    // إذا وصلنا إلى 10 أو أكثر من الأرقام المتتالية، نضيفها للنتيجة ونبدأ من جديد
    if (consecutiveDigits.length >= 10) {
      result += ' ' + consecutiveDigits + ' ';
      consecutiveDigits = '';
      digitCount = 0;
    }
  }
  
  // التحقق من الأرقام المتبقية في النهاية
  if (consecutiveDigits.length >= 4) {
    // إذا كان لدينا رقم سعودي محتمل (يبدأ بـ "0" أو "5")
    if (consecutiveDigits.match(/^0?5/) && consecutiveDigits.length >= 9) {
      result += ' ' + consecutiveDigits + ' ';
    } 
    // أو إذا كان لدينا رقم طويل (5+ أرقام)
    else if (consecutiveDigits.length >= 5) {
      result += ' ' + consecutiveDigits + ' ';
    }
  }
  
  return result;
}

/**
 * البحث عن أنماط أرقام الهواتف السعودية في النص
 * @param text النص المراد فحصه
 * @returns هل يحتوي النص على نمط يشبه رقم هاتف سعودي
 */
function detectSaudiPhoneNumberPatterns(text: string): boolean {
  // التأكد من تحويل الأرقام العربية إلى إنجليزية
  const convertedText = convertArabicDigitsToEnglish(text);
  
  // أنماط مختلفة لأرقام الهواتف السعودية
  const patterns = [
    /\b[0٠]?[5٥]\d{8}\b/g, // 05xxxxxxxx or 5xxxxxxxx (يدعم الرقم 0 أو ٠ والرقم 5 أو ٥)
    /\b[0٠]?[5٥][\s-]?\d{4}[\s-]?\d{4}\b/g, // 05-xxxx-xxxx or 5 xxxx xxxx
    /\b\+9665\d{8}\b/g, // +9665xxxxxxxx
    /\b\+966[\s-]?[5٥][\s-]?\d{8}\b/g, // +966-5-xxxxxxxx or +966 5 xxxxxxxx
    /\b9665\d{8}\b/g, // 9665xxxxxxxx
    /\b966[\s-]?[5٥][\s-]?\d{8}\b/g, // 966-5-xxxxxxxx or 966 5 xxxxxxxx
    // أنماط تتضمن الأرقام العربية
    /\b[0٠]?[5٥][٠١٢٣٤٥٦٧٨٩]{8}\b/g, // ٠٥xxxxxxxx أو ٥xxxxxxxx بالأرقام العربية
    /\b[0٠]?[5٥][\s-]?[٠١٢٣٤٥٦٧٨٩]{4}[\s-]?[٠١٢٣٤٥٦٧٨٩]{4}\b/g, // ٠٥-xxxx-xxxx أو ٥ xxxx xxxx بالأرقام العربية
  ];
  
  // فحص النص الأصلي (قد يحتوي على أرقام عربية)
  for (const pattern of patterns) {
    if (pattern.test(text)) {
      return true;
    }
  }
  
  // فحص النص بعد تحويل الأرقام العربية إلى إنجليزية
  if (convertedText !== text) {
    const englishPatterns = [
      /\b0?5\d{8}\b/g, // 05xxxxxxxx or 5xxxxxxxx
      /\b0?5[\s-]?\d{4}[\s-]?\d{4}\b/g, // 05-xxxx-xxxx or 5 xxxx xxxx
      /\b\+9665\d{8}\b/g, // +9665xxxxxxxx
      /\b\+966[\s-]?5[\s-]?\d{8}\b/g, // +966-5-xxxxxxxx or +966 5 xxxxxxxx
      /\b9665\d{8}\b/g, // 9665xxxxxxxx
      /\b966[\s-]?5[\s-]?\d{8}\b/g // 966-5-xxxxxxxx or 966 5 xxxxxxxx
    ];
    
    for (const pattern of englishPatterns) {
      if (pattern.test(convertedText)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * التحقق من احتمالية أن يحتوي النص على رقم مخفي
 * هذه الدالة تقوم بفحوصات إضافية للنص للبحث عن أنماط غير عادية
 * مثل النصوص التي تحتوي على عدد كبير من الأرقام أو كلمات تمثل أرقام
 */
function detectSuspiciousNumberPatterns(text: string): boolean {
  // التأكد من تحويل الأرقام العربية إلى إنجليزية
  const convertedText = convertArabicDigitsToEnglish(text);
  
  // عدد الأرقام المتتالية الذي يعتبر مشبوهًا
  const SUSPICIOUS_DIGIT_COUNT = 5;
  
  // فحص إذا كان النص يحتوي على كلمات دالة على أرقام متبوعة بأرقام (عربية أو إنجليزية)
  const phoneKeywordsPattern = /\b(رقم|جوال|موبايل|هاتف|تلفون|اتصال|واتس|واتساب|whatsapp)[\s:]*[\d٠١٢٣٤٥٦٧٨٩]+/gi;
  if (phoneKeywordsPattern.test(text)) {
    return true;
  }
  
  // فحص إذا كان النص الأصلي يحتوي على أرقام عربية
  const arabicDigitCount = (text.match(/[٠١٢٣٤٥٦٧٨٩]/g) || []).length;
  
  // فحص إذا كان النص المحول يحتوي على أكثر من خمسة أرقام إنجليزية
  const englishDigitCount = (convertedText.match(/\d/g) || []).length;
  const totalDigitCount = englishDigitCount + arabicDigitCount - englishDigitCount; // نتجنب العد المزدوج
  
  if (totalDigitCount >= SUSPICIOUS_DIGIT_COUNT) {
    // فحص إضافي: إذا كانت هذه الأرقام تشكل نسبة كبيرة من النص
    const textLength = text.length;
    const digitRatio = totalDigitCount / textLength;
    
    // إذا كانت نسبة الأرقام أكثر من 15% من النص، فهذا مشبوه
    if (digitRatio > 0.15) {
      return true;
    }
  }
  
  return false;
}

/**
 * الحصول على سجل المحادثة بين مستخدمين أو إنشاء سجل جديد
 * @param userId1 معرف المستخدم الأول
 * @param userId2 معرف المستخدم الثاني
 * @returns سجل المحادثة
 */
function getOrCreateConversationHistory(userId1: number, userId2: number): ConversationHistory {
  // ترتيب المعرفات لضمان التناسق في البحث والتخزين
  const [smallerId, largerId] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
  
  // البحث عن سجل محادثة موجود
  let history = conversationHistories.find(
    h => h.userId1 === smallerId && h.userId2 === largerId
  );
  
  // إنشاء سجل جديد إذا لم يكن موجوداً
  if (!history) {
    history = { userId1: smallerId, userId2: largerId, messages: [] };
    conversationHistories.push(history);
  }
  
  return history;
}

/**
 * إضافة رسالة إلى سجل المحادثة
 * @param fromUserId معرف المرسل
 * @param toUserId معرف المستقبل
 * @param messageContent محتوى الرسالة
 */
export function addMessageToConversationHistory(fromUserId: number, toUserId: number, messageContent: string): void {
  const history = getOrCreateConversationHistory(fromUserId, toUserId);
  
  // إضافة الرسالة الجديدة
  history.messages.push({
    content: messageContent,
    timestamp: Date.now()
  });
  
  // الاحتفاظ فقط بالرسائل الحديثة حسب الحد المحدد
  if (history.messages.length > MESSAGE_HISTORY_LIMIT) {
    history.messages = history.messages.slice(history.messages.length - MESSAGE_HISTORY_LIMIT);
  }
}

/**
 * البحث عن أنماط مشبوهة في تسلسل الرسائل
 * مثل محاولة تقسيم رقم على عدة رسائل
 * @param fromUserId معرف المرسل
 * @param toUserId معرف المستقبل
 * @param currentMessage الرسالة الحالية
 * @returns إذا كان هناك نمط مشبوه
 */
function detectSuspiciousSequentialPatterns(fromUserId: number, toUserId: number, currentMessage: string): boolean {
  const history = getOrCreateConversationHistory(fromUserId, toUserId);
  
  // إذا لم يكن هناك رسائل سابقة، فلا يمكن أن يكون هناك نمط تسلسلي
  if (history.messages.length === 0) {
    return false;
  }
  
  // جمع الرسائل الأخيرة التي تم إرسالها في فترة زمنية متقاربة
  const now = Date.now();
  const recentMessages = history.messages.filter(
    msg => (now - msg.timestamp) <= MAX_SEQUENTIAL_MESSAGE_TIME
  );
  
  // إضافة الرسالة الحالية
  recentMessages.push({ content: currentMessage, timestamp: now });
  
  // إذا كان لدينا عدة رسائل متتالية، نقوم بفحصها
  if (recentMessages.length >= 2) {
    // استخراج الأرقام من جميع الرسائل
    let combinedText = recentMessages.map(msg => msg.content).join(' ');
    
    // تحويل كلمات الأرقام العربية إلى أرقام في النص المجمع
    const convertedCombinedText = convertArabicWordsToDigits(combinedText);
    
    // البحث عن أنماط أرقام الهواتف في النص المجمع
    if (detectSaudiPhoneNumberPatterns(combinedText) || 
        (convertedCombinedText.trim().length > 0 && detectSaudiPhoneNumberPatterns(convertedCombinedText))) {
      return true;
    }
    
    // البحث عن كميات كبيرة من الأرقام في الرسائل المجمعة
    if (detectSuspiciousNumberPatterns(combinedText) || 
        (convertedCombinedText.trim().length > 0 && detectSuspiciousNumberPatterns(convertedCombinedText))) {
      return true;
    }
    
    // البحث عن أجزاء من الأرقام التي تكمل بعضها
    const digits = combinedText.match(/\d+/g) || [];
    if (digits.length >= 2) {
      const combinedDigits = digits.join('');
      // التحقق إذا كان الناتج يشبه رقم هاتف (8-10 أرقام)
      if (combinedDigits.length >= 8 && combinedDigits.length <= 15) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * التحقق من نص ما إذا كان يحتوي على معلومات تواصل محظورة
 * @param text النص المراد فحصه
 * @param fromUserId معرف المرسل (اختياري - للتحقق من الأنماط المتسلسلة)
 * @param toUserId معرف المستقبل (اختياري - للتحقق من الأنماط المتسلسلة)
 * @returns حالة النص (آمن أم لا) ونوع المعلومات المحظورة إن وجدت
 */
export function checkMessageForProhibitedContent(
  text: string, 
  fromUserId?: number, 
  toUserId?: number
): { safe: boolean; violations?: string[] } {
  if (!text || typeof text !== 'string') {
    return { safe: true };
  }

  const violations: string[] = [];
  
  // تحويل الأرقام العربية إلى أرقام إنجليزية
  const textWithEnglishDigits = convertArabicDigitsToEnglish(text);
  
  // تحويل كلمات الأرقام العربية إلى أرقام
  const convertedText = convertArabicWordsToDigits(text);
  
  // طباعة النص المحول للتأكد من عمل الدالة
  console.log('النص المحول من الكلمات العربية:', convertedText);
  
  // التحقق من وجود أرقام عربية في النص الأصلي
  if (text !== textWithEnglishDigits) {
    console.log('النص يحتوي على أرقام عربية:', textWithEnglishDigits);
    
    // التحقق مباشرة إذا كان النص الأصلي يحتوي على أرقام عربية تشكل رقم هاتف
    if (detectSaudiPhoneNumberPatterns(text)) {
      violations.push('رقم_هاتف_عربي');
    }
  }
  
  // التحقق من أرقام الهواتف في النص الأصلي والنص المحول
  if (violations.length === 0) {
    // فحص النص الأصلي
    for (const pattern of contentFilters.phoneNumbers) {
      if (pattern.test(text)) {
        violations.push('رقم_هاتف');
        break;
      }
    }
    
    // فحص النص بعد تحويل الأرقام العربية إلى إنجليزية
    if (violations.length === 0 && text !== textWithEnglishDigits) {
      for (const pattern of contentFilters.phoneNumbers) {
        if (pattern.test(textWithEnglishDigits)) {
          violations.push('رقم_هاتف_أرقام_عربية');
          break;
        }
      }
    }
    
    // التحقق من أنماط أرقام الهواتف السعودية في النص المحول من كلمات عربية
    if (violations.length === 0 && convertedText.trim().length > 0) {
      if (detectSaudiPhoneNumberPatterns(convertedText)) {
        violations.push('رقم_هاتف_مكتوب_نصياً');
      }
      
      // نمط عام للأرقام الطويلة (5+ أرقام متتالية)
      const longNumberPattern = /\b\d{5,}\b/g;
      if (longNumberPattern.test(convertedText)) {
        violations.push('رقم_محتمل_مكتوب_نصياً');
      }
    }
  }
  
  // فحص إضافي للأنماط المشبوهة إذا لم نجد انتهاكات سابقة
  if (violations.length === 0) {
    if (detectSuspiciousNumberPatterns(text) || 
        detectSuspiciousNumberPatterns(textWithEnglishDigits) || 
        (convertedText.trim().length > 0 && detectSuspiciousNumberPatterns(convertedText))) {
      violations.push('نمط_مشبوه_محتمل_مشاركة_رقم');
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
  
  // التحقق من الأنماط المتسلسلة (إذا تم تقديم معرفات المستخدمين)
  if (fromUserId && toUserId) {
    if (detectSuspiciousSequentialPatterns(fromUserId, toUserId, text)) {
      violations.push('نمط_متسلسل_مشبوه');
      
      // طباعة إشعار (يمكن إزالته في الإنتاج)
      console.log(`تم اكتشاف نمط متسلسل مشبوه بين المستخدمين ${fromUserId} و ${toUserId}`);
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
 * @param fromUserId معرف المرسل (اختياري - للتحقق من الأنماط المتسلسلة)
 * @param toUserId معرف المستقبل (اختياري - للتحقق من الأنماط المتسلسلة)
 * @returns محتوى منظف أو تحذير إذا كان المحتوى محظوراً
 */
export function sanitizeMessageContent(text: string, fromUserId?: number, toUserId?: number): string {
  const checkResult = checkMessageForProhibitedContent(text, fromUserId, toUserId);
  
  if (!checkResult.safe) {
    const violationTypes = checkResult.violations?.join('، ');
    return `[تم حظر هذه الرسالة لأنها تحتوي على: ${violationTypes}]`;
  }
  
  return text;
}