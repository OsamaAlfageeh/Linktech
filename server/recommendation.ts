import { Project, CompanyProfile, type User } from '@shared/schema';
import { storage } from './storage';

/**
 * وحدة التوصية بالمشاريع
 * تقوم بتحليل المشاريع والشركات وتقديم توصيات باستخدام خوارزميات مطابقة
 */

/**
 * حساب درجة التطابق بين المهارات
 * @param skills1 المهارات الأولى (مهارات المشروع)
 * @param skills2 المهارات الثانية (مهارات الشركة)
 * @returns درجة التطابق من 0 إلى 1
 */
export function calculateSkillMatch(skills1: string[] | null, skills2: string[] | null): number {
  if (!skills1 || !skills2 || skills1.length === 0 || skills2.length === 0) {
    return 0;
  }

  // تحويل المصفوفات إلى أحرف صغيرة للمقارنة
  const skills1Lower = skills1.map(s => s.toLowerCase());
  const skills2Lower = skills2.map(s => s.toLowerCase());
  
  // حساب عدد المهارات المشتركة
  let matchCount = 0;
  for (const skill of skills1Lower) {
    if (skills2Lower.includes(skill)) {
      matchCount++;
    }
  }

  // إنشاء مجموعة فريدة من كل المهارات
  const unionSet = new Set<string>();
  for (const skill of skills1Lower) {
    unionSet.add(skill);
  }
  for (const skill of skills2Lower) {
    unionSet.add(skill);
  }
  
  // نحسب متوسط الملاءمة بقسمة عدد المهارات المشتركة على مجموع المهارات الفريدة
  return matchCount / unionSet.size;
}

/**
 * حساب تشابه جاكارد بين مجموعتين من المهارات
 * جيد للمقارنة بين مجموعات مختلفة الحجم
 */
export function calculateJaccardSimilarity(skills1: string[] | null, skills2: string[] | null): number {
  if (!skills1 || !skills2 || skills1.length === 0 || skills2.length === 0) {
    return 0;
  }

  // تحويل المصفوفات إلى أحرف صغيرة للمقارنة
  const skills1Lower = skills1.map(s => s.toLowerCase());
  const skills2Lower = skills2.map(s => s.toLowerCase());
  
  // حساب حجم التقاطع (عدد العناصر المشتركة)
  let intersectionCount = 0;
  for (const skill of skills1Lower) {
    if (skills2Lower.includes(skill)) {
      intersectionCount++;
    }
  }
  
  // إنشاء مصفوفة للاتحاد بدون تكرار
  const unionSet = new Set<string>();
  for (const skill of skills1Lower) {
    unionSet.add(skill);
  }
  for (const skill of skills2Lower) {
    unionSet.add(skill);
  }
  
  // معامل تشابه جاكارد
  return intersectionCount / unionSet.size;
}

/**
 * البحث عن المشاريع المناسبة لشركة معينة
 * @param companyId معرف الشركة
 * @param limit عدد النتائج المطلوبة
 * @returns قائمة المشاريع الموصى بها مع درجة التطابق
 */
export async function getRecommendedProjectsForCompany(
  companyId: number,
  limit: number = 5
): Promise<Array<{project: Project, matchScore: number}>> {
  // الحصول على معلومات الشركة
  const company = await storage.getCompanyProfile(companyId);
  if (!company) {
    return [];
  }

  // الحصول على جميع المشاريع
  const allProjects = await storage.getProjects();
  
  // حساب درجة التطابق لكل مشروع
  const scoredProjects = allProjects.map(project => {
    const skillMatchScore = calculateJaccardSimilarity(company.skills, project.skills);
    
    // يمكن توسيع المعايير هنا بإضافة عوامل أخرى للتقييم
    const matchScore = skillMatchScore;
    
    return {
      project,
      matchScore
    };
  });
  
  // ترتيب المشاريع حسب درجة التطابق والاكتفاء بالعدد المطلوب
  return scoredProjects
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}

/**
 * البحث عن الشركات المناسبة لمشروع معين
 * @param projectId معرف المشروع
 * @param limit عدد النتائج المطلوبة
 * @returns قائمة الشركات الموصى بها مع درجة التطابق
 */
export async function getRecommendedCompaniesForProject(
  projectId: number,
  limit: number = 5
): Promise<Array<{company: CompanyProfile, matchScore: number}>> {
  // الحصول على معلومات المشروع
  const project = await storage.getProject(projectId);
  if (!project) {
    return [];
  }

  // الحصول على جميع الشركات
  const allCompanies = await storage.getCompanyProfiles();
  
  // حساب درجة التطابق لكل شركة
  const scoredCompanies = allCompanies.map(company => {
    const skillMatchScore = calculateJaccardSimilarity(project.skills, company.skills);
    
    // عوامل إضافية للتقييم
    const ratingFactor = (company.rating || 0) / 5; // تطبيع التقييم إلى مقياس من 0 إلى 1
    
    // الصيغة النهائية للتقييم: 70% تطابق المهارات + 30% تقييم الشركة
    const matchScore = (skillMatchScore * 0.7) + (ratingFactor * 0.3);
    
    return {
      company,
      matchScore
    };
  });
  
  // ترتيب الشركات حسب درجة التطابق والاكتفاء بالعدد المطلوب
  return scoredCompanies
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}

/**
 * البحث عن المشاريع المشابهة لمشروع معين
 * مفيد لاقتراح "مشاريع مشابهة" على صفحة المشروع
 */
export async function getSimilarProjects(
  projectId: number,
  limit: number = 3
): Promise<Array<{project: Project, similarityScore: number}>> {
  const project = await storage.getProject(projectId);
  if (!project) {
    return [];
  }

  const allProjects = await storage.getProjects();
  
  const similarities = allProjects
    .filter(p => p.id !== projectId) // استبعاد المشروع نفسه
    .map(otherProject => {
      const skillSimilarity = calculateJaccardSimilarity(project.skills, otherProject.skills);
      
      return {
        project: otherProject,
        similarityScore: skillSimilarity
      };
    });
  
  return similarities
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, limit);
}

/**
 * الحصول على المشاريع الاتجاهية (الأكثر طلباً)
 * يمكن استخدامها لعرض المشاريع الشائعة على الصفحة الرئيسية
 */
export async function getTrendingProjects(limit: number = 5): Promise<Project[]> {
  const allProjects = await storage.getProjects();
  
  // يمكن تعزيز هذه الوظيفة بمقاييس حقيقية مثل عدد المشاهدات أو الطلبات
  // هنا نعتمد على الحالة فقط للتوضيح
  
  const trending = allProjects
    .filter(project => project.highlightStatus === 'عالي الطلب');
  
  // إذا كان عدد المشاريع "عالية الطلب" أقل من المطلوب، نضيف مشاريع "جديدة"
  if (trending.length < limit) {
    const newProjects = allProjects
      .filter(project => project.highlightStatus === 'جديد' && !trending.includes(project));
    
    trending.push(...newProjects.slice(0, limit - trending.length));
  }
  
  // إذا استمر النقص، نضيف أي مشاريع أخرى
  if (trending.length < limit) {
    const otherProjects = allProjects
      .filter(project => !trending.includes(project));
    
    trending.push(...otherProjects.slice(0, limit - trending.length));
  }
  
  return trending.slice(0, limit);
}