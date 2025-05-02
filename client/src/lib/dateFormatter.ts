import moment from 'moment';
import 'moment-hijri';

// إضافة دعم للتاريخ الهجري إلى moment.js
declare module 'moment' {
  interface Moment {
    format(format?: string): string;
    iYear(): number;
    iMonth(): number;
    iDate(): number;
    iDayOfYear(): number;
    iWeek(): number;
    iWeekday(): number;
    iDayOfYear(): number;
    toISOString(): string;
    fromNow(): string;
  }
}

/**
 * تحويل التاريخ ليعرض بصيغة جميلة باللغة العربية
 * @param date التاريخ بأي صيغة يقبلها moment
 * @returns نص التاريخ بصيغة مقروءة
 */
export function formatDate(date: string | Date): string {
  const momentDate = moment(date);
  const gregorianDate = momentDate.format('D MMMM YYYY');
  
  // تحويل التاريخ إلى هجري
  const hijriDate = (momentDate as any).format('iD iMMMM iYYYY');
  
  return `${gregorianDate} م / ${hijriDate} هـ`;
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