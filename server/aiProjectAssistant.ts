/**
 * مساعد الذكاء الاصطناعي للمشاريع
 * يحلل أفكار المشاريع ويقدم توصيات تقنية وتسعيرية دقيقة
 */

import Anthropic from '@anthropic-ai/sdk';

// the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025. Use this by default unless user has already selected claude-3-7-sonnet-20250219
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ProjectAnalysisInput {
  projectIdea: string;
  businessSize: 'individual' | 'small' | 'medium' | 'enterprise';
  expectedUsers?: number;
  budget: 'low' | 'medium' | 'high' | 'custom';
  timeline: 'urgent' | 'normal' | 'flexible';
  integrationNeeds?: string[];
  securityRequirements: 'basic' | 'standard' | 'high';
  specificRequirements?: string;
}

export interface ProjectAnalysisResult {
  projectType: string;
  technicalComplexity: 'simple' | 'medium' | 'complex';
  recommendedTechnologies: string[];
  estimatedCostRange: {
    min: number;
    max: number;
    currency: 'SAR';
  };
  estimatedDuration: {
    development: number; // أسابيع
    testing: number;
    deployment: number;
  };
  projectPhases: Array<{
    name: string;
    description: string;
    duration: number; // أسابيع
    cost: number;
  }>;
  features: Array<{
    name: string;
    priority: 'essential' | 'important' | 'nice-to-have';
    complexity: 'low' | 'medium' | 'high';
  }>;
  riskAssessment: {
    technicalRisks: string[];
    timelineRisks: string[];
    budgetRisks: string[];
    mitigationStrategies: string[];
  };
  scalabilityConsiderations: string[];
  maintenanceRequirements: {
    frequency: string;
    estimatedMonthlyCost: number;
    requiredSkills: string[];
  };
  competitorAnalysis?: {
    similarSolutions: string[];
    differentiationOpportunities: string[];
  };
}

// قوالب المشاريع الأساسية مع التسعير
const PROJECT_TEMPLATES = {
  'simple_website': {
    basePrice: 8000,
    complexity: 1.0,
    estimatedDays: 14,
    technologies: ['HTML', 'CSS', 'JavaScript', 'PHP/WordPress']
  },
  'business_website': {
    basePrice: 15000,
    complexity: 1.5,
    estimatedDays: 28,
    technologies: ['React', 'Node.js', 'PostgreSQL', 'Tailwind CSS']
  },
  'ecommerce_simple': {
    basePrice: 25000,
    complexity: 2.0,
    estimatedDays: 42,
    technologies: ['React', 'Node.js', 'PostgreSQL', 'Stripe', 'Redis']
  },
  'ecommerce_enterprise': {
    basePrice: 80000,
    complexity: 3.5,
    estimatedDays: 120,
    technologies: ['Microservices', 'React', 'Node.js', 'PostgreSQL', 'Redis', 'CDN', 'Load Balancing']
  },
  'mobile_app_simple': {
    basePrice: 30000,
    complexity: 2.2,
    estimatedDays: 56,
    technologies: ['React Native', 'Node.js', 'PostgreSQL', 'Firebase']
  },
  'mobile_app_complex': {
    basePrice: 60000,
    complexity: 3.0,
    estimatedDays: 84,
    technologies: ['React Native', 'Node.js', 'PostgreSQL', 'Redis', 'Push Notifications', 'Analytics']
  },
  'web_application': {
    basePrice: 35000,
    complexity: 2.5,
    estimatedDays: 70,
    technologies: ['React', 'Node.js', 'PostgreSQL', 'Authentication', 'Real-time features']
  },
  'ai_integration': {
    basePrice: 50000,
    complexity: 3.2,
    estimatedDays: 90,
    technologies: ['Python', 'TensorFlow/PyTorch', 'APIs', 'Cloud Services', 'React']
  }
};

// عوامل تعديل السعر حسب حجم العمل
const BUSINESS_SIZE_MULTIPLIERS = {
  individual: 1.0,
  small: 1.3,
  medium: 1.8,
  enterprise: 2.5
};

// عوامل تعديل السعر حسب متطلبات الأمان
const SECURITY_MULTIPLIERS = {
  basic: 1.0,
  standard: 1.2,
  high: 1.5
};

// عوامل تعديل السعر حسب الجدولة الزمنية
const TIMELINE_MULTIPLIERS = {
  urgent: 1.4,
  normal: 1.0,
  flexible: 0.9
};

/**
 * تحليل فكرة المشروع باستخدام الذكاء الاصطناعي
 */
export async function analyzeProject(input: ProjectAnalysisInput): Promise<ProjectAnalysisResult> {
  const prompt = `تحليل فكرة المشروع التقني:

فكرة المشروع: ${input.projectIdea}
حجم العمل: ${input.businessSize}
عدد المستخدمين المتوقع: ${input.expectedUsers || 'غير محدد'}
الميزانية: ${input.budget}
الجدولة الزمنية: ${input.timeline}
متطلبات الأمان: ${input.securityRequirements}
احتياجات التكامل: ${input.integrationNeeds?.join(', ') || 'لا توجد'}
متطلبات إضافية: ${input.specificRequirements || 'لا توجد'}

قم بالرد بصيغة JSON صحيحة فقط، بدون أي نص إضافي أو markdown. البنية المطلوبة:

{
  "projectType": "نوع المشروع",
  "technicalComplexity": "simple | medium | complex",
  "recommendedTechnologies": ["تقنية1", "تقنية2"],
  "features": [
    {
      "name": "اسم الميزة",
      "priority": "essential | important | nice-to-have",
      "complexity": "low | medium | high"
    }
  ],
  "riskAssessment": {
    "technicalRisks": ["مخاطر تقنية"],
    "timelineRisks": ["مخاطر زمنية"],
    "budgetRisks": ["مخاطر ميزانية"],
    "mitigationStrategies": ["استراتيجيات التخفيف"]
  },
  "scalabilityConsiderations": ["اعتبارات التوسع"],
  "competitorAnalysis": {
    "similarSolutions": ["حلول مشابهة"],
    "differentiationOpportunities": ["فرص التميز"]
  }
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from AI');
    }
    
    // استخراج JSON من markdown إذا كان موجوداً
    let jsonText = content.text;
    const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    } else {
      // إزالة أي markdown formatting آخر
      jsonText = jsonText.replace(/```[\s\S]*?```/g, '').trim();
    }
    
    const aiAnalysis = JSON.parse(jsonText);
    
    // تحديد القالب المناسب بناءً على تحليل AI
    const projectTemplate = determineProjectTemplate(aiAnalysis.projectType, input);
    
    // حساب التكلفة المتقدمة
    const costAnalysis = calculateAdvancedCost(projectTemplate, input, aiAnalysis);
    
    // دمج تحليل AI مع حسابات التكلفة
    const result: ProjectAnalysisResult = {
      ...aiAnalysis,
      estimatedCostRange: costAnalysis.costRange,
      estimatedDuration: costAnalysis.duration,
      projectPhases: costAnalysis.phases,
      maintenanceRequirements: {
        frequency: 'شهرياً',
        estimatedMonthlyCost: Math.round(costAnalysis.costRange.max * 0.05), // 5% من التكلفة الإجمالية
        requiredSkills: aiAnalysis.recommendedTechnologies.slice(0, 3)
      }
    };

    return result;
  } catch (error) {
    console.error('خطأ في تحليل المشروع:', error);
    throw new Error('فشل في تحليل المشروع. يرجى المحاولة مرة أخرى.');
  }
}

/**
 * تحديد القالب المناسب للمشروع
 */
function determineProjectTemplate(projectType: string, input: ProjectAnalysisInput) {
  const normalizedType = projectType.toLowerCase();
  
  if (normalizedType.includes('متجر') || normalizedType.includes('تجارة')) {
    return input.businessSize === 'enterprise' ? 
      PROJECT_TEMPLATES.ecommerce_enterprise : 
      PROJECT_TEMPLATES.ecommerce_simple;
  }
  
  if (normalizedType.includes('تطبيق') && normalizedType.includes('جوال')) {
    return input.expectedUsers && input.expectedUsers > 10000 ?
      PROJECT_TEMPLATES.mobile_app_complex :
      PROJECT_TEMPLATES.mobile_app_simple;
  }
  
  if (normalizedType.includes('ذكاء') || normalizedType.includes('ai')) {
    return PROJECT_TEMPLATES.ai_integration;
  }
  
  if (normalizedType.includes('نظام') || normalizedType.includes('إدارة')) {
    return PROJECT_TEMPLATES.web_application;
  }
  
  if (normalizedType.includes('موقع')) {
    return input.businessSize === 'individual' ?
      PROJECT_TEMPLATES.simple_website :
      PROJECT_TEMPLATES.business_website;
  }
  
  // افتراضي
  return PROJECT_TEMPLATES.business_website;
}

/**
 * حساب التكلفة المتقدم بناءً على عدة عوامل
 */
function calculateAdvancedCost(template: any, input: ProjectAnalysisInput, aiAnalysis: any) {
  let basePrice = template.basePrice;
  
  // تطبيق المضاعفات
  const businessMultiplier = BUSINESS_SIZE_MULTIPLIERS[input.businessSize];
  const securityMultiplier = SECURITY_MULTIPLIERS[input.securityRequirements];
  const timelineMultiplier = TIMELINE_MULTIPLIERS[input.timeline];
  
  // عامل التعقيد الإضافي
  const complexityMultiplier = aiAnalysis.technicalComplexity === 'complex' ? 1.5 :
                              aiAnalysis.technicalComplexity === 'medium' ? 1.2 : 1.0;
  
  // عامل عدد المستخدمين
  const userScaleMultiplier = input.expectedUsers ? 
    (input.expectedUsers > 100000 ? 2.0 :
     input.expectedUsers > 10000 ? 1.5 :
     input.expectedUsers > 1000 ? 1.2 : 1.0) : 1.0;
  
  // عامل التكامل
  const integrationMultiplier = input.integrationNeeds && input.integrationNeeds.length > 0 ?
    1 + (input.integrationNeeds.length * 0.1) : 1.0;
  
  const totalMultiplier = businessMultiplier * securityMultiplier * timelineMultiplier * 
                         complexityMultiplier * userScaleMultiplier * integrationMultiplier;
  
  const finalPrice = Math.round(basePrice * totalMultiplier);
  
  // حساب المراحل والمدة
  const baseDuration = template.estimatedDays;
  const adjustedDuration = Math.round(baseDuration * complexityMultiplier * userScaleMultiplier);
  
  const phases = [
    {
      name: 'التخطيط والتصميم',
      description: 'تحليل المتطلبات وتصميم واجهات المستخدم',
      duration: Math.round(adjustedDuration * 0.25 / 7), // تحويل لأسابيع
      cost: Math.round(finalPrice * 0.25)
    },
    {
      name: 'التطوير الأساسي',
      description: 'برمجة الوظائف الرئيسية وقواعد البيانات',
      duration: Math.round(adjustedDuration * 0.45 / 7),
      cost: Math.round(finalPrice * 0.45)
    },
    {
      name: 'الاختبار والمراجعة',
      description: 'اختبار شامل وإصلاح الأخطاء',
      duration: Math.round(adjustedDuration * 0.20 / 7),
      cost: Math.round(finalPrice * 0.20)
    },
    {
      name: 'النشر والتدريب',
      description: 'نشر التطبيق وتدريب المستخدمين',
      duration: Math.round(adjustedDuration * 0.10 / 7),
      cost: Math.round(finalPrice * 0.10)
    }
  ];
  
  return {
    costRange: {
      min: Math.round(finalPrice * 0.85),
      max: Math.round(finalPrice * 1.15),
      currency: 'SAR' as const
    },
    duration: {
      development: Math.round(adjustedDuration * 0.7 / 7),
      testing: Math.round(adjustedDuration * 0.2 / 7),
      deployment: Math.round(adjustedDuration * 0.1 / 7)
    },
    phases
  };
}

/**
 * إنشاء تقرير مفصل للمشروع
 */
export function generateProjectReport(analysis: ProjectAnalysisResult): string {
  return `
# تحليل مشروع تقني مفصل

## نوع المشروع
${analysis.projectType}

## مستوى التعقيد
${analysis.technicalComplexity}

## التقنيات الموصى بها
${analysis.recommendedTechnologies.map(tech => `• ${tech}`).join('\n')}

## التكلفة المتوقعة
من ${analysis.estimatedCostRange.min.toLocaleString('ar-SA')} إلى ${analysis.estimatedCostRange.max.toLocaleString('ar-SA')} ريال سعودي

## المدة الزمنية
• التطوير: ${analysis.estimatedDuration.development} أسبوع
• الاختبار: ${analysis.estimatedDuration.testing} أسبوع  
• النشر: ${analysis.estimatedDuration.deployment} أسبوع

## مراحل المشروع
${analysis.projectPhases.map(phase => 
  `### ${phase.name}
  ${phase.description}
  المدة: ${phase.duration} أسبوع
  التكلفة: ${phase.cost.toLocaleString('ar-SA')} ريال`
).join('\n\n')}

## الميزات الأساسية
${analysis.features.filter(f => f.priority === 'essential').map(f => `• ${f.name}`).join('\n')}

## تقييم المخاطر
### المخاطر التقنية
${analysis.riskAssessment.technicalRisks.map(risk => `• ${risk}`).join('\n')}

### مخاطر الجدولة الزمنية
${analysis.riskAssessment.timelineRisks.map(risk => `• ${risk}`).join('\n')}

### مخاطر الميزانية
${analysis.riskAssessment.budgetRisks.map(risk => `• ${risk}`).join('\n')}

## استراتيجيات التخفيف
${analysis.riskAssessment.mitigationStrategies.map(strategy => `• ${strategy}`).join('\n')}

## متطلبات الصيانة
• التكرار: ${analysis.maintenanceRequirements.frequency}
• التكلفة الشهرية: ${analysis.maintenanceRequirements.estimatedMonthlyCost.toLocaleString('ar-SA')} ريال
• المهارات المطلوبة: ${analysis.maintenanceRequirements.requiredSkills.join(', ')}
`;
}

/**
 * إنشاء تقرير PDF للمشروع - نسخة محسنة باستخدام Puppeteer
 */
export async function generateProjectReportPDF(analysis: ProjectAnalysisResult, projectIdea: string): Promise<Buffer> {
  const puppeteer = (await import('puppeteer')).default;

  // ===== إنشاء HTML بالعربي =====
  const generateHTML = (analysis: any, projectIdea: string): string => {
    return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Cairo', sans-serif;
      direction: rtl;
      padding: 40px;
      line-height: 1.8;
      color: #333;
    }
    
    h1 {
      font-size: 28px;
      font-weight: 700;
      text-align: center;
      margin-bottom: 40px;
      color: #1a1a1a;
    }
    
    h2 {
      font-size: 20px;
      font-weight: 700;
      margin-top: 25px;
      margin-bottom: 15px;
      color: #2c3e50;
      border-bottom: 2px solid #3498db;
      padding-bottom: 8px;
    }
    
    h3 {
      font-size: 16px;
      font-weight: 700;
      margin-top: 18px;
      margin-bottom: 10px;
      color: #34495e;
    }
    
    p, li {
      font-size: 14px;
      margin-bottom: 10px;
      text-align: right;
    }
    
    ul {
      list-style-type: disc;
      padding-right: 25px;
      margin-bottom: 15px;
    }
    
    .section {
      margin-bottom: 25px;
      page-break-inside: avoid;
    }
    
    .phase {
      background: #f8f9fa;
      padding: 15px;
      margin-bottom: 15px;
      border-right: 4px solid #3498db;
      border-radius: 4px;
    }
    
    .cost-info {
      background: #e8f4f8;
      padding: 12px;
      border-radius: 4px;
      margin: 10px 0;
    }
    
    .risk-category {
      margin-bottom: 15px;
    }
    
    @media print {
      body {
        padding: 20px;
      }
      
      .section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <h1>تحليل مشروع تقني مفصل</h1>
  
  <div class="section">
    <h2>فكرة المشروع</h2>
    <p>${projectIdea || 'غير محدد'}</p>
  </div>
  
  <div class="section">
    <h2>نوع المشروع</h2>
    <p>${analysis.projectType || 'غير محدد'}</p>
  </div>
  
  <div class="section">
    <h2>مستوى التعقيد</h2>
    <p>${
      {
        'simple': 'بسيط',
        'medium': 'متوسط',
        'complex': 'معقد',
        'low': 'منخفض',
        'high': 'مرتفع'
      }[analysis.technicalComplexity] || analysis.technicalComplexity
    }</p>
  </div>
  
  ${analysis.estimatedCostRange ? `
  <div class="section">
    <h2>التكلفة المتوقعة</h2>
    <div class="cost-info">
      <p>من ${analysis.estimatedCostRange.min.toLocaleString('ar-SA')} إلى ${analysis.estimatedCostRange.max.toLocaleString('ar-SA')} ${analysis.estimatedCostRange.currency}</p>
    </div>
  </div>
  ` : ''}
  
  ${analysis.estimatedDuration ? `
  <div class="section">
    <h2>المدة الزمنية</h2>
    <ul>
      <li>التطوير: ${analysis.estimatedDuration.development} أسبوع</li>
      <li>الاختبار: ${analysis.estimatedDuration.testing} أسبوع</li>
      <li>النشر: ${analysis.estimatedDuration.deployment} أسبوع</li>
    </ul>
  </div>
  ` : ''}
  
  ${analysis.recommendedTechnologies?.length > 0 ? `
  <div class="section">
    <h2>التقنيات الموصى بها</h2>
    <ul>
      ${analysis.recommendedTechnologies.map((tech: string) => `<li>${tech}</li>`).join('')}
    </ul>
  </div>
  ` : ''}
  
  ${analysis.projectPhases?.length > 0 ? `
  <div class="section">
    <h2>مراحل المشروع</h2>
    ${analysis.projectPhases.map((phase: any) => `
      <div class="phase">
        <h3>${phase.name || ''}</h3>
        <p>${phase.description || ''}</p>
        <p><strong>التكلفة:</strong> ${phase.cost.toLocaleString('ar-SA')} ريال</p>
        <p><strong>المدة:</strong> ${phase.duration} أسبوع</p>
      </div>
    `).join('')}
  </div>
  ` : ''}
  
  ${analysis.features?.length > 0 ? `
  <div class="section">
    <h2>المزايا الأساسية</h2>
    <ul>
      ${analysis.features.filter(f => f.priority === 'essential').map((feature: any) => `<li>${feature.name}</li>`).join('')}
    </ul>
  </div>
  ` : ''}
  
  ${analysis.riskAssessment ? `
  <div class="section">
    <h2>تقييم المخاطر</h2>
    
    ${analysis.riskAssessment.technicalRisks?.length > 0 ? `
    <div class="risk-category">
      <h3>المخاطر التقنية</h3>
      <ul>
        ${analysis.riskAssessment.technicalRisks.map((risk: string) => `<li>${risk}</li>`).join('')}
      </ul>
    </div>
    ` : ''}
    
    ${analysis.riskAssessment.timelineRisks?.length > 0 ? `
    <div class="risk-category">
      <h3>مخاطر الجدولة الزمنية</h3>
      <ul>
        ${analysis.riskAssessment.timelineRisks.map((risk: string) => `<li>${risk}</li>`).join('')}
      </ul>
    </div>
    ` : ''}
    
    ${analysis.riskAssessment.budgetRisks?.length > 0 ? `
    <div class="risk-category">
      <h3>مخاطر الميزانية</h3>
      <ul>
        ${analysis.riskAssessment.budgetRisks.map((risk: string) => `<li>${risk}</li>`).join('')}
      </ul>
    </div>
    ` : ''}
  </div>
  ` : ''}
  
  ${analysis.riskAssessment?.mitigationStrategies?.length > 0 ? `
  <div class="section">
    <h2>استراتيجيات التخفيف</h2>
    <ul>
      ${analysis.riskAssessment.mitigationStrategies.map((strategy: string) => `<li>${strategy}</li>`).join('')}
    </ul>
  </div>
  ` : ''}
  
  ${analysis.maintenanceRequirements ? `
  <div class="section">
    <h2>متطلبات الصيانة</h2>
    <ul>
      <li>التكرار: ${analysis.maintenanceRequirements.frequency}</li>
      <li>التكلفة الشهرية: ${analysis.maintenanceRequirements.estimatedMonthlyCost.toLocaleString('ar-SA')} ريال</li>
    </ul>
  </div>
  ` : ''}
  
  ${analysis.maintenanceRequirements?.requiredSkills?.length > 0 ? `
  <div class="section">
    <h2>المهارات المطلوبة</h2>
    <ul>
      ${analysis.maintenanceRequirements.requiredSkills.map((skill: string) => `<li>${skill}</li>`).join('')}
    </ul>
  </div>
  ` : ''}
  
  <div class="section">
    <p style="text-align: center; font-size: 12px; color: #666; margin-top: 40px;">
      تم إنشاء هذا التقرير في ${new Date().toLocaleDateString('ar-SA')} بواسطة منصة لينكتك
    </p>
  </div>
</body>
</html>
    `;
  };

  // ===== تحويل HTML إلى PDF =====
  let browser;
  
  try {
    // إنشاء HTML
    const html = generateHTML(analysis, projectIdea);
    
    // فتح المتصفح
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // تحميل HTML
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // إنشاء PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });
    
    await browser.close();
    
    console.log('✓ تم إنشاء PDF بنجاح باستخدام Puppeteer!');
    return pdfBuffer;
    
  } catch (error) {
    if (browser) await browser.close();
    console.error('خطأ في إنشاء PDF:', error);
    throw error;
  }
}