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
 * إنشاء تقرير PDF للمشروع - نسخة مبسطة
 */
export async function generateProjectReportPDF(analysis: ProjectAnalysisResult, projectIdea: string): Promise<Buffer> {
  try {
    const PDFDocument = (await import('pdfkit')).default;
    const path = await import('path');
    const fs = await import('fs');
    
    // إنشاء مستند PDF جديد
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      }
    });

    // تحميل الخط العربي
    const fontPath = path.join(process.cwd(), 'assets', 'fonts', 'Cairo-Regular.ttf');
    
    // التحقق من وجود الخط
    if (fs.existsSync(fontPath)) {
      console.log('Loading Arabic font from:', fontPath);
      doc.registerFont('Arabic', fontPath);
    } else {
      console.warn('Arabic font not found, using default font');
    }

    // إنشاء buffer لتخزين PDF
    const chunks: Buffer[] = [];
    
    doc.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    return new Promise((resolve, reject) => {
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        console.log('PDF generated successfully, size:', pdfBuffer.length);
        resolve(pdfBuffer);
      });

      doc.on('error', (error: Error) => {
        console.error('PDF generation error:', error);
        reject(error);
      });

      // إضافة المحتوى
      if (fs.existsSync(fontPath)) {
        doc.font('Arabic');
      }
      doc.fontSize(20).text('تحليل مشروع تقني مفصل', { align: 'center' });
      doc.moveDown(2);

      // فكرة المشروع
      doc.fontSize(16).text('فكرة المشروع', { underline: true });
      doc.fontSize(12).text(projectIdea);
      doc.moveDown(1);

      // نوع المشروع
      doc.fontSize(16).text('نوع المشروع', { underline: true });
      doc.fontSize(12).text(analysis.projectType);
      doc.moveDown(1);

      // مستوى التعقيد
      doc.fontSize(16).text('مستوى التعقيد', { underline: true });
      doc.fontSize(12).text(analysis.technicalComplexity);
      doc.moveDown(1);

      // التكلفة المتوقعة
      doc.fontSize(16).text('التكلفة المتوقعة', { underline: true });
      doc.fontSize(12).text(`من ${analysis.estimatedCostRange.min.toLocaleString('ar-SA')} إلى ${analysis.estimatedCostRange.max.toLocaleString('ar-SA')} ريال سعودي`);
      doc.moveDown(1);

      // المدة الزمنية
      doc.fontSize(16).text('المدة الزمنية', { underline: true });
      doc.fontSize(12).text(`التطوير: ${analysis.estimatedDuration.development} أسبوع`);
      doc.fontSize(12).text(`الاختبار: ${analysis.estimatedDuration.testing} أسبوع`);
      doc.fontSize(12).text(`النشر: ${analysis.estimatedDuration.deployment} أسبوع`);
      doc.moveDown(1);

      // التقنيات الموصى بها
      doc.fontSize(16).text('التقنيات الموصى بها', { underline: true });
      analysis.recommendedTechnologies.forEach(tech => {
        doc.fontSize(12).text(`• ${tech}`);
      });
      doc.moveDown(1);

      // مراحل المشروع
      doc.fontSize(16).text('مراحل المشروع', { underline: true });
      analysis.projectPhases.forEach(phase => {
        doc.fontSize(14).text(phase.name, { underline: true });
        doc.fontSize(12).text(phase.description);
        doc.fontSize(11).text(`المدة: ${phase.duration} أسبوع | التكلفة: ${phase.cost.toLocaleString('ar-SA')} ريال`);
        doc.moveDown(0.5);
      });

      // الميزات الأساسية
      doc.fontSize(16).text('الميزات الأساسية', { underline: true });
      analysis.features.filter(f => f.priority === 'essential').forEach(feature => {
        doc.fontSize(12).text(`• ${feature.name}`);
      });
      doc.moveDown(1);

      // تقييم المخاطر
      doc.fontSize(16).text('تقييم المخاطر', { underline: true });
      
      doc.fontSize(14).text('المخاطر التقنية', { underline: true });
      analysis.riskAssessment.technicalRisks.forEach(risk => {
        doc.fontSize(12).text(`• ${risk}`);
      });
      doc.moveDown(0.5);

      doc.fontSize(14).text('مخاطر الجدولة الزمنية', { underline: true });
      analysis.riskAssessment.timelineRisks.forEach(risk => {
        doc.fontSize(12).text(`• ${risk}`);
      });
      doc.moveDown(0.5);

      doc.fontSize(14).text('مخاطر الميزانية', { underline: true });
      analysis.riskAssessment.budgetRisks.forEach(risk => {
        doc.fontSize(12).text(`• ${risk}`);
      });
      doc.moveDown(0.5);

      doc.fontSize(14).text('استراتيجيات التخفيف', { underline: true });
      analysis.riskAssessment.mitigationStrategies.forEach(strategy => {
        doc.fontSize(12).text(`• ${strategy}`);
      });
      doc.moveDown(1);

      // متطلبات الصيانة
      doc.fontSize(16).text('متطلبات الصيانة', { underline: true });
      doc.fontSize(12).text(`التكرار: ${analysis.maintenanceRequirements.frequency}`);
      doc.fontSize(12).text(`التكلفة الشهرية: ${analysis.maintenanceRequirements.estimatedMonthlyCost.toLocaleString('ar-SA')} ريال`);
      doc.fontSize(12).text(`المهارات المطلوبة: ${analysis.maintenanceRequirements.requiredSkills.join(', ')}`);
      doc.moveDown(2);

      // Footer
      doc.fontSize(10).text(`تم إنشاء هذا التقرير في ${new Date().toLocaleDateString('ar-SA')} بواسطة منصة لينكتك`, { align: 'center' });

      // إنهاء المستند
      doc.end();
    });
  } catch (error) {
    console.error('Error in generateProjectReportPDF:', error);
    throw error;
  }
}