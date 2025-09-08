import { Project, CompanyProfile } from '@shared/schema';
import { storage } from './storage';
import { calculateJaccardSimilarity } from './recommendation';

/**
 * محرك التوصيات المعتمد على الذكاء الاصطناعي
 * يقوم بتحليل المشاريع وملفات الشركات لتقديم توصيات أكثر دقة
 */

/**
 * نموذج التحليل النصي البسيط لاستخراج الكلمات المفتاحية
 * @param text النص المراد تحليله
 * @returns مصفوفة من الكلمات المفتاحية
 */
function extractKeywords(text: string): string[] {
  if (!text) return [];
  
  // قائمة الكلمات العامة التي يتم استبعادها
  const stopWords = new Set([
    'في', 'من', 'على', 'أن', 'إلى', 'عن', 'مع', 'هذا', 'هذه', 'ذلك', 'تلك',
    'التي', 'الذي', 'كان', 'كانت', 'مثل', 'عند', 'عندما', 'لكن', 'و', 'أو', 'ثم', 'أي',
    'a', 'an', 'the', 'in', 'on', 'at', 'of', 'to', 'for', 'with', 'by', 'is', 'are', 'was', 'were'
  ]);

  // تنظيف النص واستخراج الكلمات
  const words = text.toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '') // إزالة علامات الترقيم والرموز الخاصة
    .split(/\s+/) // تقسيم النص إلى كلمات
    .filter(word => 
      word.length > 2 && !stopWords.has(word)
    ); // استبعاد الكلمات القصيرة والكلمات العامة
  
  // عدد تكرار كل كلمة
  const wordFrequency: Record<string, number> = {};
  for (const word of words) {
    wordFrequency[word] = (wordFrequency[word] || 0) + 1;
  }
  
  // ترتيب الكلمات حسب التكرار
  const sortedWords = Object.entries(wordFrequency)
    .sort(([, freqA], [, freqB]) => freqB - freqA)
    .slice(0, 20) // أخذ أعلى 20 كلمة
    .map(([word]) => word);
  
  return sortedWords;
}

/**
 * استخراج الكيانات المهمة من النص باستخدام قواعد بسيطة
 * @param text النص المراد تحليله
 * @returns الكيانات المستخرجة مصنفة حسب النوع
 */
function extractEntities(text: string): {
  technologies: string[];
  domains: string[];
  features: string[];
} {
  // قائمة بالتقنيات الشائعة
  const commonTechnologies = [
    'react', 'angular', 'vue', 'javascript', 'typescript', 'python', 'django', 'flask',
    'nodejs', 'express', 'php', 'laravel', 'ruby', 'rails', 'java', 'spring', 'dotnet',
    'ios', 'android', 'flutter', 'react native', 'swift', 'kotlin', 'رياكت', 'أندرويد', 'آيفون'
  ];
  
  // قائمة بالمجالات الشائعة
  const commonDomains = [
    'تجارة إلكترونية', 'طبي', 'صحي', 'تعليمي', 'مالي', 'سياحة', 'عقارات', 'توصيل',
    'ecommerce', 'medical', 'health', 'education', 'finance', 'travel', 'real estate',
    'delivery', 'social media', 'وسائط اجتماعية', 'تسويق', 'marketing'
  ];
  
  // قائمة بالميزات الشائعة
  const commonFeatures = [
    'تسجيل دخول', 'دفع', 'خرائط', 'إشعارات', 'تقارير', 'تحليلات',
    'login', 'payment', 'maps', 'notifications', 'reports', 'analytics',
    'chat', 'محادثة', 'دردشة', 'مباشر', 'live', 'فيديو', 'video'
  ];
  
  const lowerText = text.toLowerCase();
  
  // البحث عن التطابقات
  const technologies = commonTechnologies.filter(tech => 
    lowerText.includes(tech.toLowerCase())
  );
  
  const domains = commonDomains.filter(domain => 
    lowerText.includes(domain.toLowerCase())
  );
  
  const features = commonFeatures.filter(feature => 
    lowerText.includes(feature.toLowerCase())
  );
  
  return { technologies, domains, features };
}

/**
 * تحليل مشروع واستخراج الخصائص الإضافية منه
 * @param project المشروع المراد تحليله
 * @returns المشروع المحلل مع خصائصه الإضافية المستخرجة
 */
export function analyzeProject(project: Project): Project & {
  extractedKeywords: string[];
  extractedTechnologies: string[];
  extractedDomains: string[];
  extractedFeatures: string[];
} {
  // دمج العنوان والوصف للتحليل
  const combinedText = `${project.title} ${project.description}`;
  
  // استخراج الكلمات المفتاحية
  const extractedKeywords = extractKeywords(combinedText);
  
  // استخراج الكيانات
  const { technologies, domains, features } = extractEntities(combinedText);
  
  return {
    ...project,
    extractedKeywords,
    extractedTechnologies: technologies,
    extractedDomains: domains,
    extractedFeatures: features
  };
}

/**
 * تحليل ملف شركة واستخراج الخصائص الإضافية منه
 * @param company ملف الشركة المراد تحليله
 * @returns ملف الشركة المحلل مع خصائصه الإضافية المستخرجة
 */
export function analyzeCompany(company: CompanyProfile): CompanyProfile & {
  extractedKeywords: string[];
  extractedTechnologies: string[];
  extractedDomains: string[];
  extractedExpertise: string[];
} {
  // استخراج الكلمات المفتاحية من الوصف
  const extractedKeywords = extractKeywords(company.description || '');
  
  // استخراج الكيانات
  const { technologies, domains, features } = extractEntities(company.description || '');
  
  return {
    ...company,
    extractedKeywords,
    extractedTechnologies: technologies,
    extractedDomains: domains,
    extractedExpertise: features
  };
}

/**
 * حساب درجة التطابق المعززة بين مشروع وشركة
 * يأخذ في الاعتبار المهارات المعلنة والكلمات المفتاحية المستخرجة والكيانات المحددة
 * @param project المشروع المراد مطابقته
 * @param company الشركة المراد مطابقتها
 * @returns درجة التطابق من 0 إلى 1
 */
export function calculateEnhancedMatchScore(
  analyzedProject: ReturnType<typeof analyzeProject>,
  analyzedCompany: ReturnType<typeof analyzeCompany>
): {
  totalScore: number;
  breakdown: {
    skillsScore: number;
    keywordsScore: number;
    technologiesScore: number;
    domainsScore: number;
    featuresScore: number;
  };
} {
  // حساب تطابق المهارات المعلنة (30% من الدرجة الكلية)
  const skillsScore = calculateJaccardSimilarity(
    analyzedProject.skills, 
    analyzedCompany.skills
  );
  
  // حساب تطابق الكلمات المفتاحية المستخرجة (20% من الدرجة الكلية)
  const keywordsScore = calculateJaccardSimilarity(
    analyzedProject.extractedKeywords,
    analyzedCompany.extractedKeywords
  );
  
  // حساب تطابق التقنيات (25% من الدرجة الكلية)
  const technologiesScore = calculateJaccardSimilarity(
    analyzedProject.extractedTechnologies,
    analyzedCompany.extractedTechnologies
  );
  
  // حساب تطابق المجالات (15% من الدرجة الكلية)
  const domainsScore = calculateJaccardSimilarity(
    analyzedProject.extractedDomains,
    analyzedCompany.extractedDomains
  );
  
  // حساب تطابق الميزات والخبرات (10% من الدرجة الكلية)
  const featuresScore = calculateJaccardSimilarity(
    analyzedProject.extractedFeatures,
    analyzedCompany.extractedExpertise
  );
  
  // حساب الدرجة الكلية (مرجحة)
  const totalScore = 
    (skillsScore * 0.3) + 
    (keywordsScore * 0.2) + 
    (technologiesScore * 0.25) + 
    (domainsScore * 0.15) + 
    (featuresScore * 0.1);
  
  return {
    totalScore,
    breakdown: {
      skillsScore,
      keywordsScore,
      technologiesScore,
      domainsScore,
      featuresScore
    }
  };
}

/**
 * الحصول على الشركات المناسبة لمشروع باستخدام التحليل المعزز
 * @param projectId معرف المشروع
 * @param limit عدد النتائج المطلوبة
 * @returns قائمة الشركات الموصى بها مع درجة التطابق ومعلومات التفصيل
 */
export async function getEnhancedRecommendationsForProject(
  projectId: number,
  limit: number = 5
): Promise<Array<{
  company: CompanyProfile;
  matchScore: number;
  matchDetails: {
    skillsScore: number;
    keywordsScore: number;
    technologiesScore: number;
    domainsScore: number;
    featuresScore: number;
  };
}>> {
  // الحصول على معلومات المشروع
  const project = await storage.getProject(projectId);
  if (!project) {
    return [];
  }
  
  // تحليل المشروع
  const analyzedProject = analyzeProject(project);
  
  // الحصول على جميع الشركات
  const allCompanies = await storage.getCompanyProfiles();
  
  // تحليل كل شركة وحساب درجة التطابق
  const scoredCompanies = await Promise.all(
    allCompanies.map(async (company) => {
      // تحليل الشركة
      const analyzedCompany = analyzeCompany(company);
      
      // حساب درجة التطابق المعززة
      const { totalScore, breakdown } = calculateEnhancedMatchScore(
        analyzedProject,
        analyzedCompany
      );
      
      // عامل إضافي: درجة تقييم الشركة (إذا كانت متوفرة)
      const ratingFactor = (company.rating || 0) / 5; // تطبيع التقييم إلى مقياس من 0 إلى 1
      
      // الصيغة النهائية للتقييم: 90% درجة التطابق + 10% درجة تقييم الشركة
      const matchScore = (totalScore * 0.9) + (ratingFactor * 0.1);
      
      return {
        company,
        matchScore,
        matchDetails: breakdown
      };
    })
  );
  
  // ترتيب الشركات حسب درجة التطابق والاكتفاء بالعدد المطلوب
  return scoredCompanies
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}

/**
 * الحصول على المشاريع المناسبة لشركة باستخدام التحليل المعزز
 * @param companyId معرف الشركة
 * @param limit عدد النتائج المطلوبة
 * @returns قائمة المشاريع الموصى بها مع درجة التطابق ومعلومات التفصيل
 */
export async function getEnhancedRecommendationsForCompany(
  companyId: number,
  limit: number = 5
): Promise<Array<{
  project: Project;
  matchScore: number;
  matchDetails: {
    skillsScore: number;
    keywordsScore: number;
    technologiesScore: number;
    domainsScore: number;
    featuresScore: number;
  };
}>> {
  // الحصول على معلومات الشركة
  const company = await storage.getCompanyProfile(companyId);
  if (!company) {
    return [];
  }
  
  // تحليل الشركة
  const analyzedCompany = analyzeCompany(company);
  
  // الحصول على جميع المشاريع
  const allProjects = await storage.getProjects();
  
  // تحليل كل مشروع وحساب درجة التطابق
  const scoredProjects = await Promise.all(
    allProjects.map(async (project) => {
      // تحليل المشروع
      const analyzedProject = analyzeProject(project);
      
      // حساب درجة التطابق المعززة
      const { totalScore, breakdown } = calculateEnhancedMatchScore(
        analyzedProject,
        analyzedCompany
      );
      
      return {
        project,
        matchScore: totalScore,
        matchDetails: breakdown
      };
    })
  );
  
  // ترتيب المشاريع حسب درجة التطابق والاكتفاء بالعدد المطلوب
  return scoredProjects
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}

/**
 * الحصول على المشاريع المشابهة لمشروع معين باستخدام التحليل المعزز
 * @param projectId معرف المشروع
 * @param limit عدد النتائج المطلوبة
 * @returns قائمة المشاريع المشابهة مع درجة التشابه
 */
export async function getEnhancedSimilarProjects(
  projectId: number,
  limit: number = 3
): Promise<Array<{
  project: Project;
  similarityScore: number;
  similarityDetails: {
    skillsScore: number;
    keywordsScore: number;
    technologiesScore: number;
    domainsScore: number;
    featuresScore: number;
  };
}>> {
  // الحصول على معلومات المشروع
  const project = await storage.getProject(projectId);
  if (!project) {
    return [];
  }
  
  // تحليل المشروع
  const analyzedSourceProject = analyzeProject(project);
  
  // الحصول على جميع المشاريع
  const allProjects = await storage.getProjects();
  
  // تحليل التشابه مع كل مشروع آخر
  const similarProjects = await Promise.all(
    allProjects
      .filter(p => p.id !== projectId) // استبعاد المشروع نفسه
      .map(async (otherProject) => {
        // تحليل المشروع الآخر
        const analyzedOtherProject = analyzeProject(otherProject);
        
        // حساب تشابه المهارات (35%)
        const skillsScore = calculateJaccardSimilarity(
          analyzedSourceProject.skills,
          analyzedOtherProject.skills
        );
        
        // حساب تشابه الكلمات المفتاحية (25%)
        const keywordsScore = calculateJaccardSimilarity(
          analyzedSourceProject.extractedKeywords,
          analyzedOtherProject.extractedKeywords
        );
        
        // حساب تشابه التقنيات (20%)
        const technologiesScore = calculateJaccardSimilarity(
          analyzedSourceProject.extractedTechnologies,
          analyzedOtherProject.extractedTechnologies
        );
        
        // حساب تشابه المجالات (15%)
        const domainsScore = calculateJaccardSimilarity(
          analyzedSourceProject.extractedDomains,
          analyzedOtherProject.extractedDomains
        );
        
        // حساب تشابه الميزات (5%)
        const featuresScore = calculateJaccardSimilarity(
          analyzedSourceProject.extractedFeatures,
          analyzedOtherProject.extractedFeatures
        );
        
        // حساب درجة التشابه الكلية
        const similarityScore = 
          (skillsScore * 0.35) + 
          (keywordsScore * 0.25) + 
          (technologiesScore * 0.2) + 
          (domainsScore * 0.15) + 
          (featuresScore * 0.05);
        
        return {
          project: otherProject,
          similarityScore,
          similarityDetails: {
            skillsScore,
            keywordsScore,
            technologiesScore,
            domainsScore,
            featuresScore
          }
        };
      })
  );
  
  // ترتيب المشاريع حسب درجة التشابه والاكتفاء بالعدد المطلوب
  return similarProjects
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, limit);
}

/**
 * اكتشاف المجالات الشائعة من المشاريع
 * مفيد لتحليل اتجاهات السوق وعرض فئات رئيسية
 */
export async function discoverProjectDomains(): Promise<Array<{
  domain: string;
  count: number;
  averageBudget: string;
}>> {
  // الحصول على جميع المشاريع
  const allProjects = await storage.getProjects();
  
  // تحليل كل المشاريع
  const analyzedProjects = allProjects.map(project => analyzeProject(project));
  
  // تجميع المجالات
  const domainData: Record<string, {count: number; budgetSum: number}> = {};
  
  for (const project of analyzedProjects) {
    for (const domain of project.extractedDomains) {
      if (!domainData[domain]) {
        domainData[domain] = { count: 0, budgetSum: 0 };
      }
      
      domainData[domain].count += 1;
      
      // محاولة استخراج الميزانية كرقم
      const budgetNumber = parseInt(project.budget.replace(/[^\d]/g, ''));
      if (!isNaN(budgetNumber)) {
        domainData[domain].budgetSum += budgetNumber;
      }
    }
  }
  
  // تحويل البيانات إلى المصفوفة النهائية
  const domains = Object.entries(domainData)
    .map(([domain, data]) => ({
      domain,
      count: data.count,
      averageBudget: data.count > 0 
        ? Math.round(data.budgetSum / data.count).toLocaleString() + ' ريال'
        : '0 ريال'
    }))
    .sort((a, b) => b.count - a.count);
  
  return domains;
}

/**
 * اكتشاف التقنيات الشائعة من المشاريع
 * مفيد لتحليل الطلب على التقنيات المختلفة
 */
export async function discoverTrendingTechnologies(): Promise<Array<{
  technology: string;
  projectCount: number;
  companies: number; // عدد الشركات التي تدعم هذه التقنية
}>> {
  // الحصول على جميع المشاريع والشركات
  const allProjects = await storage.getProjects();
  const allCompanies = await storage.getCompanyProfiles();
  
  // تحليل المشاريع والشركات
  const analyzedProjects = allProjects.map(project => analyzeProject(project));
  const analyzedCompanies = allCompanies.map(company => analyzeCompany(company));
  
  // حساب تكرار التقنيات في المشاريع
  const techProjectCount: Record<string, number> = {};
  for (const project of analyzedProjects) {
    for (const tech of project.extractedTechnologies) {
      techProjectCount[tech] = (techProjectCount[tech] || 0) + 1;
    }
  }
  
  // حساب عدد الشركات لكل تقنية
  const techCompanyCount: Record<string, number> = {};
  for (const company of analyzedCompanies) {
    for (const tech of company.extractedTechnologies) {
      techCompanyCount[tech] = (techCompanyCount[tech] || 0) + 1;
    }
  }
  
  // دمج البيانات
  const techData = Object.keys({ ...techProjectCount, ...techCompanyCount })
    .map(tech => ({
      technology: tech,
      projectCount: techProjectCount[tech] || 0,
      companies: techCompanyCount[tech] || 0
    }))
    .sort((a, b) => b.projectCount - a.projectCount);
  
  return techData;
}