import moment from 'moment';

// تحويل التاريخ الميلادي إلى هجري
function gregorianToHijri(gregorianDate: Date): { day: number; month: number; year: number } {
  // خوارزمية تحويل تقريبية من الميلادي إلى الهجري
  const gYear = gregorianDate.getFullYear();
  const gMonth = gregorianDate.getMonth() + 1;
  const gDay = gregorianDate.getDate();
  
  // حساب عدد الأيام منذ بداية التقويم الميلادي
  const a = Math.floor((14 - gMonth) / 12);
  const y = gYear - a;
  const m = gMonth + 12 * a - 3;
  const jd = gDay + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + 1721119;
  
  // تحويل إلى التاريخ الهجري
  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) + Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const hMonth = Math.floor((24 * l3) / 709);
  const hDay = l3 - Math.floor((709 * hMonth) / 24);
  const hYear = 30 * n + j - 30;
  
  return {
    day: Math.max(1, Math.min(30, hDay)),
    month: Math.max(1, Math.min(12, hMonth)),
    year: Math.max(1, hYear)
  };
}

// أسماء الشهور العربية
const arabicMonths = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const hijriMonths = [
  'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 'جمادى الآخرة',
  'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
];

/**
 * تحويل التاريخ ليعرض بصيغة جميلة باللغة العربية
 * @param date التاريخ بأي صيغة يقبلها moment
 * @returns نص التاريخ بصيغة مقروءة
 */
export function formatDate(date: string | Date): string {
  try {
    const momentDate = moment(date);
    
    // التأكد من صحة التاريخ
    if (!momentDate.isValid()) {
      console.log('❌ Invalid date:', date);
      return 'تاريخ غير صحيح';
    }
    
    console.log('📅 Input date:', date);
    console.log('📅 Moment date:', momentDate.toDate());
    
    // التاريخ الميلادي
    const gregorianDay = momentDate.date();
    const gregorianMonth = arabicMonths[momentDate.month()];
    const gregorianYear = momentDate.year();
    
    console.log('📅 Gregorian:', { day: gregorianDay, month: gregorianMonth, year: gregorianYear });
    
    // التاريخ الهجري باستخدام خوارزمية التحويل
    const hijriDate = gregorianToHijri(momentDate.toDate());
    const hijriDay = hijriDate.day;
    const hijriMonthIndex = hijriDate.month - 1; // تحويل إلى فهرس المصفوفة
    const hijriMonth = hijriMonths[hijriMonthIndex] || hijriMonths[0];
    const hijriYear = hijriDate.year;
    
    console.log('📅 Hijri raw:', hijriDate);
    console.log('📅 Hijri formatted:', { day: hijriDay, month: hijriMonth, year: hijriYear, monthIndex: hijriMonthIndex });
    
    const result = `في ${gregorianDay} ${gregorianMonth} ${gregorianYear}م الموافق ${hijriDay} ${hijriMonth} ${hijriYear}هـ`;
    console.log('📅 Final result:', result);
    
    return result;
  } catch (error) {
    console.error('Error formatting date:', error);
    // في حالة الخطأ، نعرض التاريخ الميلادي فقط
    try {
      const momentDate = moment(date);
      if (!momentDate.isValid()) {
        return 'تاريخ غير صحيح';
      }
      const gregorianDay = momentDate.date();
      const gregorianMonth = arabicMonths[momentDate.month()];
      const gregorianYear = momentDate.year();
      return `${gregorianDay} ${gregorianMonth} ${gregorianYear}م`;
    } catch {
      return 'تاريخ غير متاح';
    }
  }
}

/**
 * تنسيق التاريخ ليعرض "منذ كذا" باللغة العربية
 * مثلا: منذ 3 أيام، منذ 5 ساعات، الخ
 * @param date التاريخ المراد تنسيقه
 * @returns النص الذي يمثل المدة منذ التاريخ
 */
export function formatTimeAgo(date: string | Date): string {
  moment.locale('ar');
  return moment(date).fromNow();
}

/**
 * الحصول على تاريخ بصيغة مختصرة
 * @param date التاريخ المراد تنسيقه
 * @returns التاريخ بصيغة مختصرة (يوم-شهر-سنة)
 */
export function formatShortDate(date: string | Date): string {
  const momentDate = moment(date);
  return momentDate.format('YYYY/MM/DD');
}