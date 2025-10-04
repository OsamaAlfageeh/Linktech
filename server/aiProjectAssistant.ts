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
 * إنشاء تقرير PDF للمشروع - نسخة محسنة باستخدام jsPDF مع دعم الخط العربي
 */
export async function generateProjectReportPDF(analysis: ProjectAnalysisResult, projectIdea: string): Promise<Buffer> {
  const { jsPDF } = await import('jspdf');
  const fs = await import('fs');
  const path = await import('path');
  
  try {
    // إنشاء مستند PDF جديد
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // تحميل الخط العربي - محاولة عدة مصادر
    let fontLoaded = false;
    const fontPaths = [
      path.join(process.cwd(), 'assets', 'fonts', 'Cairo-Regular.ttf'),
      path.join(process.cwd(), 'server', 'fonts', 'Cairo-Regular.ttf'),
      path.join(process.cwd(), 'public', 'fonts', 'Cairo-Regular.ttf')
    ];
    
    for (const fontPath of fontPaths) {
      try {
        if (fs.existsSync(fontPath)) {
          console.log(`محاولة تحميل الخط من: ${fontPath}`);
          const fontData = fs.readFileSync(fontPath);
          const arabicFont = fontData.toString('base64');
          
          doc.addFileToVFS('Cairo-Regular.ttf', arabicFont);
          doc.addFont('Cairo-Regular.ttf', 'Cairo', 'normal');
          doc.setFont('Cairo', 'normal');
          fontLoaded = true;
          
          console.log('✓ تم تحميل الخط العربي بنجاح');
          break;
        }
      } catch (fontError) {
        console.warn(`تحذير: فشل في تحميل الخط من ${fontPath}:`, fontError);
      }
    }
    
    if (!fontLoaded) {
      console.warn('تحذير: لم يتم العثور على أي خط عربي، سيتم استخدام الخط الافتراضي');
    }
    
    // متغيرات التخطيط
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const margin = 20;
    const lineHeight = 7;
    let currentY = margin;
    
    // تفعيل الكتابة من اليمين لليسار
    doc.setR2L(true);

    // إعدادات المستند
    doc.setProperties({
      title: 'تحليل مشروع تقني',
      subject: 'تقرير تحليل مشروع',
      author: 'منصة لينكتك',
      creator: 'Linktech Platform'
    });

    // دالة لإضافة نص مع دعم RTL محسن
    const addText = (text: string, fontSize: number = 12, isBold: boolean = false, color: string = '#000000') => {
      if (currentY > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
        if (fontLoaded) {
          doc.setFont('Cairo', 'normal');
        }
        doc.setR2L(true);
      }
      
      doc.setFontSize(fontSize);
      
      // استخدام الخط العربي إذا كان متاحاً
      if (fontLoaded) {
        doc.setFont('Cairo', 'normal');
      } else {
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      }
      
      doc.setTextColor(color);
      
      // تطبيع النص العربي
      const normalizedText = text.normalize('NFC');
      
      // تقسيم النص يدوياً للعربية بدلاً من splitTextToSize
      const maxWidth = pageWidth - (margin * 2);
      const words = normalizedText.split(' ');
      let currentLine = '';
      const lines: string[] = [];
      
      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const textWidth = doc.getTextWidth(testLine);
        
        if (textWidth > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      
      if (currentLine) {
        lines.push(currentLine);
      }
      
      lines.forEach((line: string) => {
        if (currentY > pageHeight - margin) {
          doc.addPage();
          currentY = margin;
          if (fontLoaded) {
            doc.setFont('Cairo', 'normal');
          }
          doc.setR2L(true);
        }
        
        // استخدام محاذاة اليمين للنص العربي مع خيارات RTL محسنة
        try {
          doc.text(line, pageWidth - margin, currentY, { 
            align: 'right',
            isInputRtl: true,
            isOutputRtl: true,
            isInputVisual: false,
            isOutputVisual: false
          });
        } catch (textError) {
          console.warn('تحذير: فشل في إضافة النص، محاولة بدون خيارات RTL:', textError);
          // Fallback: إضافة النص بدون خيارات RTL
          doc.text(line, pageWidth - margin, currentY, { align: 'right' });
        }
        currentY += lineHeight;
      });
      
      currentY += 3; // مسافة إضافية بعد النص
    };

    // دالة لإضافة عنوان رئيسي
    const addTitle = (title: string) => {
      currentY += 10;
      addText(title, 18, true, '#2c3e50');
      currentY += 5;
    };

    // دالة لإضافة عنوان فرعي
    const addSubtitle = (subtitle: string) => {
      currentY += 8;
      addText(subtitle, 14, true, '#34495e');
      currentY += 3;
    };

    // دالة لإضافة قائمة
    const addList = (items: string[]) => {
      items.forEach((item, index) => {
        addText(`• ${item}`, 11, false, '#333333');
      });
    };

    // دالة لإضافة معلومات التكلفة
    const addCostInfo = (label: string, value: string) => {
      addText(`${label}: ${value}`, 12, true, '#2c3e50');
    };

    // ===== بداية إنشاء المحتوى =====
    
    // العنوان الرئيسي
    addTitle('تحليل مشروع تقني مفصل');
    
    // فكرة المشروع
    addSubtitle('فكرة المشروع');
    addText(projectIdea || 'غير محدد');
    
    // نوع المشروع
    addSubtitle('نوع المشروع');
    addText(analysis.projectType || 'غير محدد');
    
    // مستوى التعقيد
    addSubtitle('مستوى التعقيد');
    const complexityMap: { [key: string]: string } = {
      'simple': 'بسيط',
      'medium': 'متوسط', 
      'complex': 'معقد',
      'low': 'منخفض',
      'high': 'مرتفع'
    };
    addText(complexityMap[analysis.technicalComplexity] || analysis.technicalComplexity);
    
    // التكلفة المتوقعة
    if (analysis.estimatedCostRange) {
      addSubtitle('التكلفة المتوقعة');
      addCostInfo('النطاق', `من ${analysis.estimatedCostRange.min.toLocaleString('ar-SA')} إلى ${analysis.estimatedCostRange.max.toLocaleString('ar-SA')} ${analysis.estimatedCostRange.currency}`);
    }
    
    // المدة الزمنية
    if (analysis.estimatedDuration) {
      addSubtitle('المدة الزمنية');
      addText(`التطوير: ${analysis.estimatedDuration.development} أسبوع`);
      addText(`الاختبار: ${analysis.estimatedDuration.testing} أسبوع`);
      addText(`النشر: ${analysis.estimatedDuration.deployment} أسبوع`);
    }
    
    // التقنيات الموصى بها
    if (analysis.recommendedTechnologies?.length > 0) {
      addSubtitle('التقنيات الموصى بها');
      addList(analysis.recommendedTechnologies);
    }
    
    // مراحل المشروع
    if (analysis.projectPhases?.length > 0) {
      addSubtitle('مراحل المشروع');
      analysis.projectPhases.forEach((phase, index) => {
        addText(`${index + 1}. ${phase.name || ''}`, 12, true);
        addText(phase.description || '');
        addCostInfo('التكلفة', `${phase.cost.toLocaleString('ar-SA')} ريال`);
        addCostInfo('المدة', `${phase.duration} أسبوع`);
        currentY += 5;
      });
    }
    
    // المزايا الأساسية
    if (analysis.features?.length > 0) {
      addSubtitle('المزايا الأساسية');
      const essentialFeatures = analysis.features.filter(f => f.priority === 'essential');
      addList(essentialFeatures.map(f => f.name));
    }
    
    // تقييم المخاطر
    if (analysis.riskAssessment) {
      addSubtitle('تقييم المخاطر');
      
      if (analysis.riskAssessment.technicalRisks?.length > 0) {
        addText('المخاطر التقنية:', 12, true);
        addList(analysis.riskAssessment.technicalRisks);
      }
      
      if (analysis.riskAssessment.timelineRisks?.length > 0) {
        addText('مخاطر الجدولة الزمنية:', 12, true);
        addList(analysis.riskAssessment.timelineRisks);
      }
      
      if (analysis.riskAssessment.budgetRisks?.length > 0) {
        addText('مخاطر الميزانية:', 12, true);
        addList(analysis.riskAssessment.budgetRisks);
      }
      
      if (analysis.riskAssessment.mitigationStrategies?.length > 0) {
        addText('استراتيجيات التخفيف:', 12, true);
        addList(analysis.riskAssessment.mitigationStrategies);
      }
    }
    
    // متطلبات الصيانة
    if (analysis.maintenanceRequirements) {
      addSubtitle('متطلبات الصيانة');
      addCostInfo('التكرار', analysis.maintenanceRequirements.frequency);
      addCostInfo('التكلفة الشهرية', `${analysis.maintenanceRequirements.estimatedMonthlyCost.toLocaleString('ar-SA')} ريال`);
      
      if (analysis.maintenanceRequirements.requiredSkills?.length > 0) {
        addText('المهارات المطلوبة:', 12, true);
        addList(analysis.maintenanceRequirements.requiredSkills);
      }
    }
    
    // تذييل التقرير
    currentY = pageHeight - 20;
    addText(`تم إنشاء هذا التقرير في ${new Date().toLocaleDateString('ar-SA')} بواسطة منصة لينكتك`, 10, false, '#666666');
    
    // تحويل إلى Buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    
    console.log('✓ تم إنشاء PDF بنجاح باستخدام jsPDF!');
    return pdfBuffer;
    
  } catch (error) {
    console.error('خطأ في إنشاء PDF:', error);
    
    // Fallback: استخدام HTML-to-PDF مع دعم أفضل للعربية
    console.log('محاولة إنشاء PDF باستخدام الطريقة البديلة...');
    try {
      return await generateProjectReportPDFFallback(analysis, projectIdea);
    } catch (fallbackError) {
      console.error('فشل في الطريقة البديلة أيضاً:', fallbackError);
      
      // Fallback نهائي: إنشاء PDF بسيط بدون خطوط عربية
      console.log('محاولة إنشاء PDF بسيط...');
      return await generateSimplePDF(analysis, projectIdea);
    }
  }
}

/**
 * طريقة بديلة لإنشاء PDF مع دعم أفضل للعربية
 */
async function generateProjectReportPDFFallback(analysis: ProjectAnalysisResult, projectIdea: string): Promise<Buffer> {
  const { jsPDF } = await import('jspdf');
  
  try {
    // إنشاء HTML محسن للعربية
    const htmlContent = generateArabicHTML(analysis, projectIdea);
    
    // إنشاء PDF من HTML
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // إضافة HTML إلى PDF مع دعم RTL
    doc.html(htmlContent, {
      callback: function (doc) {
        // تم إنشاء PDF
      },
      x: 15,
      y: 15,
      width: 180,
      windowWidth: 650,
      html2canvas: {
        scale: 0.5
      }
    });

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    console.log('✓ تم إنشاء PDF بنجاح باستخدام الطريقة البديلة!');
    return pdfBuffer;
    
  } catch (error) {
    console.error('خطأ في الطريقة البديلة:', error);
    throw new Error(`فشل في إنشاء التقرير PDF: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
  }
}

/**
 * إنشاء PDF بسيط بدون خطوط عربية (Fallback نهائي)
 */
async function generateSimplePDF(analysis: ProjectAnalysisResult, projectIdea: string): Promise<Buffer> {
  const { jsPDF } = await import('jspdf');
  
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    let currentY = margin;

    // إضافة النص باللغة الإنجليزية لتجنب مشاكل الخطوط
    const addSimpleText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
      if (currentY > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
      }
      
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      
      const lines = doc.splitTextToSize(text, pageWidth - (margin * 2));
      lines.forEach((line: string) => {
        if (currentY > pageHeight - margin) {
          doc.addPage();
          currentY = margin;
        }
        doc.text(line, margin, currentY);
        currentY += 6;
      });
      currentY += 3;
    };

    // إضافة المحتوى
    addSimpleText('Technical Project Analysis Report', 18, true);
    addSimpleText(`Project Idea: ${projectIdea}`, 14, true);
    addSimpleText(`Project Type: ${analysis.projectType}`, 12);
    addSimpleText(`Technical Complexity: ${analysis.technicalComplexity}`, 12);
    
    if (analysis.estimatedCostRange) {
      addSimpleText(`Estimated Cost: ${analysis.estimatedCostRange.min} - ${analysis.estimatedCostRange.max} ${analysis.estimatedCostRange.currency}`, 12);
    }
    
    if (analysis.recommendedTechnologies?.length > 0) {
      addSimpleText('Recommended Technologies:', 12, true);
      analysis.recommendedTechnologies.forEach(tech => {
        addSimpleText(`• ${tech}`, 10);
      });
    }
    
    if (analysis.projectPhases?.length > 0) {
      addSimpleText('Project Phases:', 12, true);
      analysis.projectPhases.forEach((phase, index) => {
        addSimpleText(`${index + 1}. ${phase.name}`, 10);
        addSimpleText(`   Description: ${phase.description}`, 10);
        addSimpleText(`   Duration: ${phase.duration} weeks`, 10);
        addSimpleText(`   Cost: ${phase.cost} SAR`, 10);
      });
    }

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    console.log('✓ تم إنشاء PDF بسيط بنجاح!');
    return pdfBuffer;
    
  } catch (error) {
    console.error('خطأ في إنشاء PDF البسيط:', error);
    throw new Error(`فشل في إنشاء التقرير PDF: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
  }
}

/**
 * إنشاء HTML محسن للعربية
 */
function generateArabicHTML(analysis: ProjectAnalysisResult, projectIdea: string): string {
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
        
        * {
          font-feature-settings: "liga" 1, "calt" 1;
          text-rendering: optimizeLegibility;
        }
        
        body {
          font-family: 'Cairo', 'Amiri', Arial, sans-serif;
          direction: rtl;
          text-align: right;
          line-height: 1.8;
          color: #333;
          margin: 0;
          padding: 20px;
          font-size: 16px;
          unicode-bidi: bidi-override;
        }
        
        h1 {
          font-size: 24px;
          font-weight: bold;
          color: #2c3e50;
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #3498db;
          padding-bottom: 10px;
        }
        
        h2 {
          font-size: 18px;
          font-weight: bold;
          color: #34495e;
          margin-top: 25px;
          margin-bottom: 15px;
          border-right: 4px solid #3498db;
          padding-right: 10px;
        }
        
        h3 {
          font-size: 16px;
          font-weight: bold;
          color: #2c3e50;
          margin-top: 20px;
          margin-bottom: 10px;
        }
        
        p {
          font-size: 14px;
          margin-bottom: 10px;
          text-align: right;
          font-feature-settings: "liga" 1, "calt" 1;
          text-rendering: optimizeLegibility;
        }
        
        ul {
          margin-right: 20px;
          margin-bottom: 15px;
        }
        
        li {
          font-size: 14px;
          margin-bottom: 5px;
        }
        
        .section {
          margin-bottom: 20px;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 5px;
        }
        
        .cost-info {
          background-color: #e8f4f8;
          padding: 10px;
          border-radius: 5px;
          margin: 10px 0;
        }
        
        .phase {
          background-color: #fff;
          border: 1px solid #ddd;
          padding: 15px;
          margin-bottom: 10px;
          border-radius: 5px;
        }
        
        .footer {
          text-align: center;
          font-size: 12px;
          color: #666;
          margin-top: 30px;
          border-top: 1px solid #ddd;
          padding-top: 10px;
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
        <h3>المخاطر التقنية</h3>
        <ul>
          ${analysis.riskAssessment.technicalRisks.map((risk: string) => `<li>${risk}</li>`).join('')}
        </ul>
        ` : ''}
        
        ${analysis.riskAssessment.timelineRisks?.length > 0 ? `
        <h3>مخاطر الجدولة الزمنية</h3>
        <ul>
          ${analysis.riskAssessment.timelineRisks.map((risk: string) => `<li>${risk}</li>`).join('')}
        </ul>
        ` : ''}
        
        ${analysis.riskAssessment.budgetRisks?.length > 0 ? `
        <h3>مخاطر الميزانية</h3>
        <ul>
          ${analysis.riskAssessment.budgetRisks.map((risk: string) => `<li>${risk}</li>`).join('')}
        </ul>
        ` : ''}
        
        ${analysis.riskAssessment.mitigationStrategies?.length > 0 ? `
        <h3>استراتيجيات التخفيف</h3>
        <ul>
          ${analysis.riskAssessment.mitigationStrategies.map((strategy: string) => `<li>${strategy}</li>`).join('')}
        </ul>
        ` : ''}
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
      
      <div class="footer">
        <p>تم إنشاء هذا التقرير في ${new Date().toLocaleDateString('ar-SA')} بواسطة منصة لينكتك</p>
      </div>
    </body>
    </html>
  `;
}