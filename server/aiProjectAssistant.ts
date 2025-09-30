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
 * إنشاء تقرير PDF للمشروع
 */
export async function generateProjectReportPDF(analysis: ProjectAnalysisResult, projectIdea: string): Promise<Buffer> {
  try {
    const PdfPrinter = (await import('pdfmake/src/printer')).default;
    const path = await import('path');
    const fs = await import('fs');
    
    // تحميل الخط العربي
    const fontPath = path.join(process.cwd(), 'assets', 'fonts', 'Cairo-Regular.ttf');
    
    // التحقق من وجود الخط
    if (!fs.existsSync(fontPath)) {
      console.error('Font file not found:', fontPath);
      throw new Error('Font file not found');
    }
    
    const fonts = {
      Cairo: {
        normal: fontPath,
        bold: fontPath,
        italics: fontPath,
        bolditalics: fontPath
      }
    };

    const printer = new PdfPrinter(fonts);

  // تحديد أولوية الميزات
  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'essential': return 'أساسي';
      case 'important': return 'مهم';
      case 'nice-to-have': return 'مرغوب فيه';
      default: return priority;
    }
  };

  const getComplexityText = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'بسيط';
      case 'medium': return 'متوسط';
      case 'complex': return 'معقد';
      default: return complexity;
    }
  };

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    defaultStyle: {
      font: 'Cairo',
      fontSize: 12,
      lineHeight: 1.5
    },
    content: [
      // Header
      {
        text: 'تحليل مشروع تقني مفصل',
        style: 'header',
        alignment: 'center',
        margin: [0, 0, 0, 30]
      },
      
      // Project Idea
      {
        text: 'فكرة المشروع',
        style: 'sectionHeader',
        margin: [0, 0, 0, 10]
      },
      {
        text: projectIdea,
        style: 'bodyText',
        margin: [0, 0, 0, 20]
      },

      // Project Type and Complexity
      {
        columns: [
          {
            text: [
              { text: 'نوع المشروع: ', style: 'label' },
              { text: analysis.projectType, style: 'value' }
            ],
            width: '50%'
          },
          {
            text: [
              { text: 'مستوى التعقيد: ', style: 'label' },
              { text: getComplexityText(analysis.technicalComplexity), style: 'value' }
            ],
            width: '50%'
          }
        ],
        margin: [0, 0, 0, 15]
      },

      // Cost and Duration
      {
        columns: [
          {
            text: [
              { text: 'التكلفة المتوقعة: ', style: 'label' },
              { text: `من ${analysis.estimatedCostRange.min.toLocaleString('ar-SA')} إلى ${analysis.estimatedCostRange.max.toLocaleString('ar-SA')} ريال سعودي`, style: 'value' }
            ],
            width: '50%'
          },
          {
            text: [
              { text: 'المدة الإجمالية: ', style: 'label' },
              { text: `${analysis.estimatedDuration.development + analysis.estimatedDuration.testing + analysis.estimatedDuration.deployment} أسبوع`, style: 'value' }
            ],
            width: '50%'
          }
        ],
        margin: [0, 0, 0, 20]
      },

      // Recommended Technologies
      {
        text: 'التقنيات الموصى بها',
        style: 'sectionHeader',
        margin: [0, 0, 0, 10]
      },
      {
        ul: analysis.recommendedTechnologies,
        style: 'bodyText',
        margin: [0, 0, 0, 20]
      },

      // Project Phases
      {
        text: 'مراحل المشروع',
        style: 'sectionHeader',
        margin: [0, 0, 0, 10]
      },
      ...analysis.projectPhases.map(phase => ({
        text: [
          { text: phase.name, style: 'phaseTitle' },
          { text: `\n${phase.description}`, style: 'bodyText' },
          { text: `\nالمدة: ${phase.duration} أسبوع | التكلفة: ${phase.cost.toLocaleString('ar-SA')} ريال`, style: 'phaseDetails' }
        ],
        margin: [0, 0, 0, 15]
      })),

      // Features by Priority
      {
        text: 'الميزات الأساسية',
        style: 'sectionHeader',
        margin: [0, 20, 0, 10]
      },
      {
        ul: analysis.features.filter(f => f.priority === 'essential').map(f => f.name),
        style: 'bodyText',
        margin: [0, 0, 0, 15]
      },

      // Risk Assessment
      {
        text: 'تقييم المخاطر',
        style: 'sectionHeader',
        margin: [0, 20, 0, 10]
      },
      
      {
        text: 'المخاطر التقنية',
        style: 'subsectionHeader',
        margin: [0, 0, 0, 5]
      },
      {
        ul: analysis.riskAssessment.technicalRisks,
        style: 'bodyText',
        margin: [0, 0, 0, 10]
      },

      {
        text: 'مخاطر الجدولة الزمنية',
        style: 'subsectionHeader',
        margin: [0, 0, 0, 5]
      },
      {
        ul: analysis.riskAssessment.timelineRisks,
        style: 'bodyText',
        margin: [0, 0, 0, 10]
      },

      {
        text: 'مخاطر الميزانية',
        style: 'subsectionHeader',
        margin: [0, 0, 0, 5]
      },
      {
        ul: analysis.riskAssessment.budgetRisks,
        style: 'bodyText',
        margin: [0, 0, 0, 10]
      },

      {
        text: 'استراتيجيات التخفيف',
        style: 'subsectionHeader',
        margin: [0, 0, 0, 5]
      },
      {
        ul: analysis.riskAssessment.mitigationStrategies,
        style: 'bodyText',
        margin: [0, 0, 0, 15]
      },

      // Maintenance Requirements
      {
        text: 'متطلبات الصيانة',
        style: 'sectionHeader',
        margin: [0, 20, 0, 10]
      },
      {
        columns: [
          {
            text: [
              { text: 'التكرار: ', style: 'label' },
              { text: analysis.maintenanceRequirements.frequency, style: 'value' }
            ],
            width: '33%'
          },
          {
            text: [
              { text: 'التكلفة الشهرية: ', style: 'label' },
              { text: `${analysis.maintenanceRequirements.estimatedMonthlyCost.toLocaleString('ar-SA')} ريال`, style: 'value' }
            ],
            width: '33%'
          },
          {
            text: [
              { text: 'المهارات المطلوبة: ', style: 'label' },
              { text: analysis.maintenanceRequirements.requiredSkills.join(', '), style: 'value' }
            ],
            width: '34%'
          }
        ],
        margin: [0, 0, 0, 20]
      },

      // Footer
      {
        text: `تم إنشاء هذا التقرير في ${new Date().toLocaleDateString('ar-SA')} بواسطة منصة لينكتك`,
        style: 'footer',
        alignment: 'center',
        margin: [0, 30, 0, 0]
      }
    ],
    styles: {
      header: {
        fontSize: 24,
        bold: true,
        color: '#1f2937'
      },
      sectionHeader: {
        fontSize: 16,
        bold: true,
        color: '#374151',
        margin: [0, 10, 0, 5]
      },
      subsectionHeader: {
        fontSize: 14,
        bold: true,
        color: '#4b5563'
      },
      bodyText: {
        fontSize: 12,
        color: '#374151'
      },
      label: {
        fontSize: 12,
        bold: true,
        color: '#6b7280'
      },
      value: {
        fontSize: 12,
        color: '#1f2937'
      },
      phaseTitle: {
        fontSize: 14,
        bold: true,
        color: '#1f2937'
      },
      phaseDetails: {
        fontSize: 11,
        color: '#6b7280',
        italics: true
      },
      footer: {
        fontSize: 10,
        color: '#9ca3af'
      }
    }
  };

    return new Promise((resolve, reject) => {
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const chunks: Buffer[] = [];

      pdfDoc.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      pdfDoc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        console.log('PDF generated successfully, size:', pdfBuffer.length);
        resolve(pdfBuffer);
      });

      pdfDoc.on('error', (error: Error) => {
        console.error('PDF generation error:', error);
        reject(error);
      });

      pdfDoc.end();
    });
  } catch (error) {
    console.error('Error in generateProjectReportPDF:', error);
    throw error;
  }
}