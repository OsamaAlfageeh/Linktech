import { Request } from 'express';
import { db } from './db';
import { visitStats, dailyStats } from '../shared/schema';
import { eq, sql, desc, and, gte } from 'drizzle-orm';

interface VisitData {
  pageUrl: string;
  pageTitle?: string;
  userAgent?: string;
  referrer?: string;
  userId?: number;
  sessionId?: string;
}

/**
 * تسجيل زيارة جديدة
 */
export async function trackVisit(req: Request, visitData: VisitData): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const userAgent = req.get('User-Agent') || visitData.userAgent || '';
    const ipAddress = getClientIP(req);
    
    // استخراج معلومات المتصفح والجهاز
    const deviceInfo = parseUserAgent(userAgent);
    
    // تسجيل الزيارة التفصيلية
    await db.insert(visitStats).values({
      date: today,
      pageUrl: visitData.pageUrl,
      pageTitle: visitData.pageTitle,
      userAgent: userAgent,
      ipAddress: ipAddress,
      referrer: visitData.referrer || req.get('Referer'),
      sessionId: visitData.sessionId,
      userId: visitData.userId,
      deviceType: deviceInfo.deviceType,
      browserName: deviceInfo.browserName,
      isUniqueVisitor: await isUniqueVisitor(ipAddress, visitData.sessionId),
    });

    // تحديث الإحصائيات اليومية
    await updateDailyStats(today, visitData.pageUrl, deviceInfo);
    
  } catch (error) {
    console.error('خطأ في تسجيل الزيارة:', error);
  }
}

/**
 * الحصول على عنوان IP الحقيقي للعميل
 */
function getClientIP(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    req.headers['x-real-ip'] as string ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

/**
 * تحليل User Agent لاستخراج معلومات المتصفح والجهاز
 */
function parseUserAgent(userAgent: string): { deviceType: string; browserName: string } {
  const ua = userAgent.toLowerCase();
  
  let deviceType = 'desktop';
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    deviceType = 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    deviceType = 'tablet';
  }
  
  let browserName = 'unknown';
  if (ua.includes('chrome') && !ua.includes('edg')) {
    browserName = 'Chrome';
  } else if (ua.includes('firefox')) {
    browserName = 'Firefox';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browserName = 'Safari';
  } else if (ua.includes('edg')) {
    browserName = 'Edge';
  } else if (ua.includes('opera')) {
    browserName = 'Opera';
  }
  
  return { deviceType, browserName };
}

/**
 * التحقق من كون الزائر جديد أم لا
 */
async function isUniqueVisitor(ipAddress: string, sessionId?: string): Promise<boolean> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const existing = await db
      .select()
      .from(visitStats)
      .where(
        and(
          eq(visitStats.date, today),
          eq(visitStats.ipAddress, ipAddress)
        )
      )
      .limit(1);
    
    return existing.length === 0;
  } catch {
    return false;
  }
}

/**
 * تحديث الإحصائيات اليومية المجمعة
 */
async function updateDailyStats(
  date: string, 
  pageUrl: string, 
  deviceInfo: { deviceType: string; browserName: string }
): Promise<void> {
  try {
    // البحث عن الإحصائية اليومية الموجودة
    const existing = await db
      .select()
      .from(dailyStats)
      .where(eq(dailyStats.date, date))
      .limit(1);

    if (existing.length > 0) {
      // تحديث الإحصائية الموجودة
      const current = existing[0];
      
      // تحديث إحصائيات الصفحات
      const topPages = (current.topPages as any[]) || [];
      const pageIndex = topPages.findIndex((p: any) => p.url === pageUrl);
      if (pageIndex >= 0) {
        topPages[pageIndex].views += 1;
      } else {
        topPages.push({ url: pageUrl, views: 1 });
      }
      topPages.sort((a: any, b: any) => b.views - a.views);
      
      // تحديث إحصائيات الأجهزة
      const deviceStats = (current.deviceStats as any) || { desktop: 0, mobile: 0, tablet: 0 };
      deviceStats[deviceInfo.deviceType] = (deviceStats[deviceInfo.deviceType] || 0) + 1;
      
      // تحديث إحصائيات المتصفحات
      const browserStats = (current.browserStats as any) || {};
      browserStats[deviceInfo.browserName] = (browserStats[deviceInfo.browserName] || 0) + 1;

      await db
        .update(dailyStats)
        .set({
          totalVisits: current.totalVisits + 1,
          pageViews: current.pageViews + 1,
          topPages: topPages.slice(0, 10),
          deviceStats: deviceStats,
          browserStats: browserStats,
          updatedAt: new Date(),
        })
        .where(eq(dailyStats.date, date));
    } else {
      // إنشاء إحصائية يومية جديدة
      await db.insert(dailyStats).values({
        date: date,
        totalVisits: 1,
        pageViews: 1,
        uniqueVisitors: 1,
        topPages: [{ url: pageUrl, views: 1 }],
        deviceStats: { [deviceInfo.deviceType]: 1 },
        browserStats: { [deviceInfo.browserName]: 1 },
      });
    }
  } catch (error) {
    console.error('خطأ في تحديث الإحصائيات اليومية:', error);
  }
}

/**
 * الحصول على إحصائيات الزيارات لفترة محددة
 */
export async function getVisitStats(days: number = 7): Promise<{
  totalVisits: number;
  uniqueVisitors: number;
  pageViews: number;
  avgTimeSpent: number;
  topPages: Array<{ url: string; views: number }>;
  deviceStats: Record<string, number>;
  browserStats: Record<string, number>;
  dailyStats: Array<{
    date: string;
    visits: number;
    uniqueVisitors: number;
  }>;
}> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    // الحصول على الإحصائيات اليومية
    const dailyData = await db
      .select()
      .from(dailyStats)
      .where(gte(dailyStats.date, startDateStr))
      .orderBy(desc(dailyStats.date));

    // حساب الإجماليات
    const totals = dailyData.reduce(
      (acc, day) => ({
        totalVisits: acc.totalVisits + (day.totalVisits || 0),
        uniqueVisitors: acc.uniqueVisitors + (day.uniqueVisitors || 0),
        pageViews: acc.pageViews + (day.pageViews || 0),
        avgTimeSpent: acc.avgTimeSpent + (day.avgTimeSpent || 0),
      }),
      { totalVisits: 0, uniqueVisitors: 0, pageViews: 0, avgTimeSpent: 0 }
    );

    // جمع أهم الصفحات
    const allPages: Record<string, number> = {};
    const allDevices: Record<string, number> = {};
    const allBrowsers: Record<string, number> = {};

    dailyData.forEach(day => {
      // معالجة أهم الصفحات
      const pages = (day.topPages as any[]) || [];
      pages.forEach((page: any) => {
        allPages[page.url] = (allPages[page.url] || 0) + page.views;
      });

      // معالجة إحصائيات الأجهزة
      const devices = (day.deviceStats as any) || {};
      Object.entries(devices).forEach(([device, count]) => {
        allDevices[device] = (allDevices[device] || 0) + (count as number);
      });

      // معالجة إحصائيات المتصفحات
      const browsers = (day.browserStats as any) || {};
      Object.entries(browsers).forEach(([browser, count]) => {
        allBrowsers[browser] = (allBrowsers[browser] || 0) + (count as number);
      });
    });

    // ترتيب أهم الصفحات
    const topPagesArray = Object.entries(allPages)
      .map(([url, views]) => ({ url, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    return {
      totalVisits: totals.totalVisits,
      uniqueVisitors: totals.uniqueVisitors,
      pageViews: totals.pageViews,
      avgTimeSpent: dailyData.length > 0 ? Math.round(totals.avgTimeSpent / dailyData.length) : 0,
      topPages: topPagesArray,
      deviceStats: allDevices,
      browserStats: allBrowsers,
      dailyStats: dailyData.map(day => ({
        date: day.date,
        visits: day.totalVisits || 0,
        uniqueVisitors: day.uniqueVisitors || 0,
      })),
    };
  } catch (error) {
    console.error('خطأ في الحصول على إحصائيات الزيارات:', error);
    return {
      totalVisits: 0,
      uniqueVisitors: 0,
      pageViews: 0,
      avgTimeSpent: 0,
      topPages: [],
      deviceStats: {},
      browserStats: {},
      dailyStats: [],
    };
  }
}

/**
 * الحصول على إحصائيات سريعة للوحة التحكم
 */
export async function getQuickStats(): Promise<{
  todayVisits: number;
  yesterdayVisits: number;
  thisWeekVisits: number;
  thisMonthVisits: number;
  growthRate: number;
}> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const monthAgoStr = monthAgo.toISOString().split('T')[0];

    // الحصول على إحصائيات اليوم
    const todayStats = await db
      .select()
      .from(dailyStats)
      .where(eq(dailyStats.date, today))
      .limit(1);

    // الحصول على إحصائيات الأمس
    const yesterdayStats = await db
      .select()
      .from(dailyStats)
      .where(eq(dailyStats.date, yesterdayStr))
      .limit(1);

    // الحصول على إحصائيات الأسبوع
    const weekStats = await db
      .select({
        totalVisits: sql<number>`sum(${dailyStats.totalVisits})`,
      })
      .from(dailyStats)
      .where(gte(dailyStats.date, weekAgoStr));

    // الحصول على إحصائيات الشهر
    const monthStats = await db
      .select({
        totalVisits: sql<number>`sum(${dailyStats.totalVisits})`,
      })
      .from(dailyStats)
      .where(gte(dailyStats.date, monthAgoStr));

    const todayVisits = todayStats[0]?.totalVisits || 0;
    const yesterdayVisits = yesterdayStats[0]?.totalVisits || 0;
    const thisWeekVisits = weekStats[0]?.totalVisits || 0;
    const thisMonthVisits = monthStats[0]?.totalVisits || 0;

    // حساب معدل النمو (مقارنة اليوم بالأمس)
    const growthRate = yesterdayVisits > 0 
      ? Math.round(((todayVisits - yesterdayVisits) / yesterdayVisits) * 100)
      : 0;

    return {
      todayVisits,
      yesterdayVisits,
      thisWeekVisits,
      thisMonthVisits,
      growthRate,
    };
  } catch (error) {
    console.error('خطأ في الحصول على الإحصائيات السريعة:', error);
    return {
      todayVisits: 0,
      yesterdayVisits: 0,
      thisWeekVisits: 0,
      thisMonthVisits: 0,
      growthRate: 0,
    };
  }
}