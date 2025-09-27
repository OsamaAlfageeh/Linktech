import { db } from './db';
import { userAchievements, userActivities, badgeDefinitions } from '@shared/schema';
import type { User, UserAchievement, BadgeDefinition, UserActivity, InsertUserActivity } from '@shared/schema';
import { eq, and, gte } from 'drizzle-orm';
import { storage } from './storage';

/**
 * وحدة التلعيب (Gamification)
 * تتعامل مع النقاط والشارات والمستويات لتحفيز المستخدمين
 */

// تعريف أنواع النشاطات
export const ActivityTypes = {
  PROJECT_CREATED: 'project_created', // إنشاء مشروع جديد
  PROJECT_UPDATED: 'project_updated', // تحديث مشروع
  OFFER_SUBMITTED: 'offer_submitted', // تقديم عرض على مشروع
  OFFER_ACCEPTED: 'offer_accepted', // قبول عرض
  DEPOSIT_PAID: 'deposit_paid', // دفع عمولة المنصة
  MESSAGE_SENT: 'message_sent', // إرسال رسالة
  LOGIN_STREAK: 'login_streak', // سلسلة تسجيل دخول متتالية
  PROFILE_COMPLETED: 'profile_completed', // إكمال الملف الشخصي
  TESTIMONIAL_ADDED: 'testimonial_added', // إضافة تقييم
} as const;

/**
 * تعيين النقاط لكل نوع نشاط
 */
export const ActivityPoints: Record<string, number> = {
  [ActivityTypes.PROJECT_CREATED]: 20,
  [ActivityTypes.PROJECT_UPDATED]: 5,
  [ActivityTypes.OFFER_SUBMITTED]: 10,
  [ActivityTypes.OFFER_ACCEPTED]: 15,
  [ActivityTypes.DEPOSIT_PAID]: 25,
  [ActivityTypes.MESSAGE_SENT]: 2,
  [ActivityTypes.LOGIN_STREAK]: 5,
  [ActivityTypes.PROFILE_COMPLETED]: 30,
  [ActivityTypes.TESTIMONIAL_ADDED]: 20,
};

/**
 * معادلة حساب المستوى بناءً على النقاط
 * يمكن تعديلها لتعكس صعوبة كل مستوى
 */
export function calculateLevel(points: number): number {
  // زيادة تدريجية في صعوبة المستويات
  if (points < 50) return 1;
  if (points < 150) return 2;
  if (points < 300) return 3;
  if (points < 500) return 4;
  if (points < 750) return 5;
  if (points < 1000) return 6;
  if (points < 1500) return 7;
  if (points < 2500) return 8;
  if (points < 4000) return 9;
  return 10;
}

/**
 * الحصول على سجل إنجازات المستخدم أو إنشاء سجل جديد إذا لم يكن موجوداً
 */
export async function getOrCreateUserAchievement(userId: number): Promise<UserAchievement> {
  // البحث عن سجل الإنجازات الحالي
  const [existingAchievement] = await db
    .select()
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId));

  if (existingAchievement) {
    return existingAchievement;
  }

  // إنشاء سجل جديد إذا لم يكن موجوداً
  const [newAchievement] = await db
    .insert(userAchievements)
    .values({
      userId,
      pointsTotal: 0,
      level: 1,
      badges: [],
    })
    .returning();

  return newAchievement;
}

/**
 * تسجيل نشاط جديد للمستخدم وتحديث النقاط والمستوى
 */
export async function recordActivity(
  userId: number,
  activityType: string,
  referenceId?: number,
  customDescription?: string
): Promise<UserActivity> {
  // التحقق من وجود المستخدم
  const user = await storage.getUser(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // الحصول على سجل الإنجازات أو إنشاء واحد جديد
  const achievement = await getOrCreateUserAchievement(userId);
  
  // تحديد النقاط المكتسبة
  const pointsEarned = ActivityPoints[activityType] || 0;
  
  // إنشاء وصف النشاط
  let description = customDescription;
  if (!description) {
    description = generateActivityDescription(activityType, user, referenceId);
  }
  
  // تسجيل النشاط
  const [activity] = await db
    .insert(userActivities)
    .values({
      userId,
      activityType,
      referenceId,
      pointsEarned,
      description,
    })
    .returning();
  
  // تحديث إجمالي النقاط
  const newPointsTotal = achievement.pointsTotal + pointsEarned;
  
  // حساب المستوى الجديد بناءً على إجمالي النقاط
  const newLevel = calculateLevel(newPointsTotal);
  
  // تحقق من الشارات الجديدة المحتملة
  const currentBadges = achievement.badges || [];
  const newBadges = await checkForNewBadges(userId, newPointsTotal, newLevel);
  
  // دمج الشارات الحالية والجديدة (مع إزالة التكرار)
  const allBadges = [...new Set([...currentBadges, ...newBadges])];
  
  // تحديث سجل الإنجازات
  await db
    .update(userAchievements)
    .set({
      pointsTotal: newPointsTotal,
      level: newLevel,
      badges: allBadges,
      lastActive: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(userAchievements.userId, userId));
  
  // تحديث الإحصائيات الخاصة بنوع النشاط
  await updateActivitySpecificStats(userId, activityType, referenceId);
  
  return activity;
}

/**
 * إنشاء وصف تلقائي للنشاط
 */
function generateActivityDescription(
  activityType: string, 
  user: User, 
  referenceId?: number
): string {
  switch (activityType) {
    case ActivityTypes.PROJECT_CREATED:
      return `${user.name} قام بإنشاء مشروع جديد`;
    case ActivityTypes.OFFER_SUBMITTED:
      return `${user.name} قدم عرضاً على مشروع`;
    case ActivityTypes.OFFER_ACCEPTED:
      return `تم قبول عرض ${user.name}`;
    case ActivityTypes.DEPOSIT_PAID:
      return `${user.name} قام بدفع عمولة المنصة`;
    case ActivityTypes.MESSAGE_SENT:
      return `${user.name} تواصل مع مستخدم آخر`;
    case ActivityTypes.LOGIN_STREAK:
      return `${user.name} حافظ على تسجيل الدخول بانتظام`;
    case ActivityTypes.PROFILE_COMPLETED:
      return `${user.name} أكمل ملفه الشخصي`;
    case ActivityTypes.TESTIMONIAL_ADDED:
      return `${user.name} أضاف تقييماً جديداً`;
    default:
      return `${user.name} أكمل نشاطاً جديداً`;
  }
}

/**
 * تحديث الإحصائيات الخاصة بكل نوع نشاط
 */
async function updateActivitySpecificStats(
  userId: number, 
  activityType: string, 
  referenceId?: number
): Promise<void> {
  const achievement = await getOrCreateUserAchievement(userId);
  
  // تحديث الإحصائيات الخاصة بكل نوع نشاط
  const updates: Partial<UserAchievement> = {};
  
  switch (activityType) {
    case ActivityTypes.PROJECT_CREATED:
      updates.projectsPosted = (achievement.projectsPosted || 0) + 1;
      break;
    case ActivityTypes.OFFER_ACCEPTED:
      updates.offersAccepted = (achievement.offersAccepted || 0) + 1;
      break;
    case ActivityTypes.OFFER_SUBMITTED:
      // لا شيء هنا - نحن نتتبع العروض المستلمة للمشاريع وليس العروض المقدمة
      break;
    case ActivityTypes.LOGIN_STREAK:
      updates.streak = (achievement.streak || 0) + 1;
      break;
  }
  
  // إذا كان هناك تحديثات
  if (Object.keys(updates).length > 0) {
    await db
      .update(userAchievements)
      .set(updates)
      .where(eq(userAchievements.userId, userId));
  }
}

/**
 * التحقق من الشارات الجديدة المستحقة بناءً على النقاط والمستوى
 */
async function checkForNewBadges(
  userId: number, 
  points: number, 
  level: number
): Promise<string[]> {
  const newBadges: string[] = [];
  
  // الحصول على الشارات التي تتطلب نقاطًا أو مستوى معين
  const eligibleBadges = await db
    .select()
    .from(badgeDefinitions)
    .where(
      and(
        // الشارات التي تتطلب نقاطًا أقل من أو تساوي النقاط الحالية
        gte(points, badgeDefinitions.requiredPoints || 0),
        // و الشارات التي تتطلب مستوى أقل من أو يساوي المستوى الحالي
        gte(level, badgeDefinitions.requiredLevel || 0)
      )
    );
  
  // التحقق من الشارات المحتملة
  for (const badge of eligibleBadges) {
    // تحقق من الشروط الخاصة لكل شارة
    if (await checkBadgeSpecificRequirements(userId, badge)) {
      newBadges.push(badge.code);
    }
  }
  
  return newBadges;
}

/**
 * التحقق من الشروط الخاصة بكل شارة
 */
async function checkBadgeSpecificRequirements(
  userId: number, 
  badge: BadgeDefinition
): Promise<boolean> {
  const achievement = await getOrCreateUserAchievement(userId);
  
  // التحقق من شروط معينة إذا كان هناك
  if (badge.requiredProjects && (achievement.projectsPosted || 0) < badge.requiredProjects) {
    return false;
  }
  
  if (badge.requiredOffers && (achievement.offersAccepted || 0) < badge.requiredOffers) {
    return false;
  }
  
  // يمكن إضافة شروط إضافية هنا
  
  return true;
}

/**
 * الحصول على قائمة النشاطات الأخيرة للمستخدم
 */
export async function getUserRecentActivities(
  userId: number, 
  limit: number = 10
): Promise<UserActivity[]> {
  const activities = await db
    .select()
    .from(userActivities)
    .where(eq(userActivities.userId, userId))
    .orderBy(userActivities.createdAt)
    .limit(limit);
  
  return activities;
}

/**
 * الحصول على سجل إنجازات المستخدم مع تفاصيل الشارات
 */
export async function getUserAchievementDetails(userId: number): Promise<{
  achievement: UserAchievement;
  badgeDetails: BadgeDefinition[];
}> {
  const achievement = await getOrCreateUserAchievement(userId);
  
  // الحصول على تفاصيل الشارات
  const badgeCodes = achievement.badges || [];
  const badgeDetails = await Promise.all(
    badgeCodes.map(async (code) => {
      const [badge] = await db
        .select()
        .from(badgeDefinitions)
        .where(eq(badgeDefinitions.code, code));
      
      return badge;
    })
  );
  
  return {
    achievement,
    badgeDetails: badgeDetails.filter(Boolean), // إزالة القيم غير المعرفة
  };
}

/**
 * الحصول على قائمة أفضل المستخدمين حسب النقاط
 */
export async function getTopUsers(limit: number = 10): Promise<{
  userId: number;
  username: string;
  name: string;
  avatar: string | null;
  pointsTotal: number;
  level: number;
}[]> {
  const topAchievements = await db
    .select()
    .from(userAchievements)
    .orderBy(userAchievements.pointsTotal)
    .limit(limit);
  
  // الحصول على تفاصيل المستخدمين
  const topUsers = await Promise.all(
    topAchievements.map(async (achievement) => {
      const user = await storage.getUser(achievement.userId);
      
      return {
        userId: achievement.userId,
        username: user?.username || 'unknown',
        name: user?.name || 'Unknown User',
        avatar: user?.avatar || null,
        pointsTotal: achievement.pointsTotal,
        level: achievement.level,
      };
    })
  );
  
  return topUsers;
}

/**
 * تحديث سلسلة تسجيل الدخول للمستخدم
 */
export async function updateLoginStreak(userId: number): Promise<{
  streak: number;
  pointsEarned: number;
}> {
  const achievement = await getOrCreateUserAchievement(userId);
  
  // التحقق من آخر نشاط
  const lastActive = achievement.lastActive;
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  let streak = achievement.streak || 0;
  let pointsEarned = 0;
  
  if (lastActive) {
    const lastActiveDate = new Date(lastActive);
    
    // إذا كان آخر نشاط اليوم، لا نقوم بأي تحديث
    if (
      lastActiveDate.getDate() === now.getDate() &&
      lastActiveDate.getMonth() === now.getMonth() &&
      lastActiveDate.getFullYear() === now.getFullYear()
    ) {
      return { streak, pointsEarned: 0 };
    }
    
    // إذا كان آخر نشاط بالأمس، نزيد السلسلة
    if (
      lastActiveDate.getDate() === yesterday.getDate() &&
      lastActiveDate.getMonth() === yesterday.getMonth() &&
      lastActiveDate.getFullYear() === yesterday.getFullYear()
    ) {
      streak += 1;
      
      // نقاط إضافية للسلسلة
      if (streak % 7 === 0) { // مكافأة أسبوعية
        pointsEarned = ActivityPoints[ActivityTypes.LOGIN_STREAK] * 2;
      } else {
        pointsEarned = ActivityPoints[ActivityTypes.LOGIN_STREAK];
      }
      
      // تسجيل النشاط ونقاط السلسلة
      await recordActivity(
        userId, 
        ActivityTypes.LOGIN_STREAK, 
        undefined, 
        `تسجيل دخول لليوم ${streak} على التوالي`
      );
    } else {
      // إعادة ضبط السلسلة إذا انقطعت
      streak = 1;
    }
  } else {
    // أول تسجيل دخول
    streak = 1;
  }
  
  // تحديث السلسلة وتاريخ آخر نشاط
  await db
    .update(userAchievements)
    .set({
      streak,
      lastActive: now,
      updatedAt: now,
    })
    .where(eq(userAchievements.userId, userId));
  
  return { streak, pointsEarned };
}

/**
 * إنشاء تعريفات الشارات الافتراضية
 */
export async function seedDefaultBadges(): Promise<void> {
  const defaultBadges = [
    {
      code: "first_project",
      name: "منشئ المشاريع",
      description: "أنشأت أول مشروع لك",
      icon: "trending_up",
      requiredProjects: 1,
      category: "projects",
    },
    {
      code: "project_master",
      name: "خبير المشاريع",
      description: "أنشأت 5 مشاريع أو أكثر",
      icon: "diamond",
      requiredProjects: 5,
      category: "projects",
    },
    {
      code: "first_deal",
      name: "المتعاقد",
      description: "أبرمت أول صفقة",
      icon: "handshake",
      requiredOffers: 1,
      category: "deals",
    },
    {
      code: "level_5",
      name: "محترف",
      description: "وصلت إلى المستوى 5",
      icon: "star",
      requiredLevel: 5,
      category: "levels",
    },
    {
      code: "level_10",
      name: "خبير",
      description: "وصلت إلى المستوى 10",
      icon: "stars",
      requiredLevel: 10,
      category: "levels",
    },
    {
      code: "points_100",
      name: "متميز",
      description: "حصلت على 100 نقطة",
      icon: "local_fire_department",
      requiredPoints: 100,
      category: "points",
    },
    {
      code: "points_1000",
      name: "أسطورة",
      description: "حصلت على 1000 نقطة",
      icon: "workspace_premium",
      requiredPoints: 1000,
      category: "points",
    },
  ];
  
  // إضافة الشارات الافتراضية إذا لم تكن موجودة
  for (const badgeData of defaultBadges) {
    const [existingBadge] = await db
      .select()
      .from(badgeDefinitions)
      .where(eq(badgeDefinitions.code, badgeData.code));
    
    if (!existingBadge) {
      await db.insert(badgeDefinitions).values(badgeData);
    }
  }
}