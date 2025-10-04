/**
 * خدمة إنشاء PDF باستخدام @react-pdf/renderer مع دعم كامل للنصوص العربية
 * تستخدم خطوط عربية مخصصة و RTL support
 */

import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  Font,
  pdf 
} from '@react-pdf/renderer';
import fs from 'fs';
import path from 'path';
import { ProjectAnalysisResult } from './aiProjectAssistant';

// تسجيل الخط العربي
Font.register({
  family: 'Amiri',
  src: path.join(process.cwd(), 'assets', 'fonts', 'Amiri-Regular.ttf'),
});

Font.register({
  family: 'Cairo',
  src: path.join(process.cwd(), 'assets', 'fonts', 'Cairo-Regular.ttf'),
});

// تعريف الأنماط
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    padding: 40,
    fontFamily: 'Amiri',
    direction: 'rtl',
    textAlign: 'right',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#2196F3',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#FF9800',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
    color: '#333',
  },
  paragraph: {
    fontSize: 12,
    marginBottom: 5,
    lineHeight: 1.4,
  },
  listItem: {
    fontSize: 11,
    marginBottom: 3,
    paddingRight: 10,
  },
  costHighlight: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#4CAF50',
    marginVertical: 10,
  },
  riskText: {
    fontSize: 11,
    color: '#F44336',
  },
  successText: {
    fontSize: 11,
    color: '#4CAF50',
  },
  footer: {
    fontSize: 10,
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  column: {
    flex: 1,
    marginHorizontal: 5,
  }
});

// مكون تقرير المشروع
const ProjectReport: React.FC<{
  analysis: ProjectAnalysisResult;
  projectIdea: string;
}> = ({ analysis, projectIdea }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* العنوان الرئيسي */}
      <Text style={styles.title}>تقرير تحليل المشروع</Text>
      <Text style={styles.subtitle}>منصة لينكتك</Text>
      
      {/* معلومات المشروع الأساسية */}
      <Text style={styles.sectionHeader}>معلومات المشروع</Text>
      <Text style={styles.paragraph}>{projectIdea}</Text>
      
      {/* نوع المشروع والتعقيد */}
      <Text style={styles.sectionHeader}>نوع المشروع</Text>
      <Text style={styles.paragraph}>{analysis.projectType}</Text>
      
      <Text style={styles.sectionHeader}>مستوى التعقيد التقني</Text>
      <Text style={styles.paragraph}>
        {analysis.technicalComplexity === 'simple' ? 'بسيط' : 
         analysis.technicalComplexity === 'medium' ? 'متوسط' : 'معقد'}
      </Text>
      
      {/* التكلفة المقدرة */}
      <Text style={styles.sectionHeader}>التكلفة المقدرة</Text>
      <Text style={styles.costHighlight}>
        {analysis.estimatedCostRange.min.toLocaleString('ar-SA')} - {analysis.estimatedCostRange.max.toLocaleString('ar-SA')} ريال سعودي
      </Text>
      
      {/* المدة الزمنية */}
      <Text style={styles.sectionHeader}>المدة الزمنية المقدرة</Text>
      <View style={styles.row}>
        <Text style={styles.paragraph}>التطوير: {analysis.estimatedDuration.development} أسابيع</Text>
        <Text style={styles.paragraph}>الاختبار: {analysis.estimatedDuration.testing} أسابيع</Text>
        <Text style={styles.paragraph}>النشر: {analysis.estimatedDuration.deployment} أسابيع</Text>
      </View>
      
      {/* التقنيات الموصى بها */}
      <Text style={styles.sectionHeader}>التقنيات الموصى بها</Text>
      {analysis.recommendedTechnologies.map((tech, index) => (
        <Text key={index} style={styles.listItem}>• {tech}</Text>
      ))}
      
      {/* مراحل المشروع */}
      <Text style={styles.sectionHeader}>مراحل المشروع</Text>
      {analysis.projectPhases.map((phase, index) => (
        <View key={index}>
          <Text style={styles.paragraph}>
            {index + 1}. {phase.name}
          </Text>
          <Text style={styles.paragraph}>{phase.description}</Text>
          <Text style={styles.listItem}>
            المدة: {phase.duration} أسابيع | التكلفة: {phase.cost.toLocaleString('ar-SA')} ريال
          </Text>
        </View>
      ))}
      
      {/* الميزات المقترحة */}
      <Text style={styles.sectionHeader}>الميزات المقترحة</Text>
      {analysis.features.map((feature, index) => (
        <Text 
          key={index} 
          style={[
            styles.listItem,
            feature.priority === 'essential' ? styles.riskText : 
            feature.priority === 'important' ? { color: '#FF9800' } : styles.successText
          ]}
        >
          • {feature.name}
        </Text>
      ))}
      
      {/* تقييم المخاطر */}
      <Text style={styles.sectionHeader}>تقييم المخاطر</Text>
      <Text style={styles.paragraph}>المخاطر التقنية:</Text>
      {analysis.riskAssessment.technicalRisks.map((risk, index) => (
        <Text key={index} style={styles.riskText}>• {risk}</Text>
      ))}
      
      <Text style={styles.paragraph}>استراتيجيات التخفيف:</Text>
      {analysis.riskAssessment.mitigationStrategies.map((strategy, index) => (
        <Text key={index} style={styles.successText}>• {strategy}</Text>
      ))}
      
      {/* متطلبات الصيانة */}
      <Text style={styles.sectionHeader}>متطلبات الصيانة</Text>
      <View style={styles.row}>
        <Text style={styles.paragraph}>التكرار: {analysis.maintenanceRequirements.frequency}</Text>
        <Text style={styles.paragraph}>التكلفة الشهرية: {analysis.maintenanceRequirements.estimatedMonthlyCost.toLocaleString('ar-SA')} ريال</Text>
      </View>
      
      <Text style={styles.paragraph}>المهارات المطلوبة:</Text>
      {analysis.maintenanceRequirements.requiredSkills.map((skill, index) => (
        <Text key={index} style={styles.listItem}>• {skill}</Text>
      ))}
      
      {/* اعتبارات التوسع */}
      <Text style={styles.sectionHeader}>اعتبارات التوسع</Text>
      {analysis.scalabilityConsiderations.map((consideration, index) => (
        <Text key={index} style={styles.listItem}>• {consideration}</Text>
      ))}
      
      {/* تذييل التقرير */}
      <Text style={styles.footer}>
        تم إنشاء هذا التقرير بواسطة منصة لينكتك
      </Text>
      <Text style={styles.footer}>
        تاريخ الإنشاء: {new Date().toLocaleDateString('ar-SA')}
      </Text>
    </Page>
  </Document>
);

// مكون التقرير المبسط
const SimpleProjectReport: React.FC<{
  analysis: ProjectAnalysisResult;
  projectIdea: string;
}> = ({ analysis, projectIdea }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>ملخص تحليل المشروع</Text>
      <Text style={styles.paragraph}>{projectIdea}</Text>
      <Text style={styles.paragraph}>نوع المشروع: {analysis.projectType}</Text>
      <Text style={styles.paragraph}>
        التكلفة: {analysis.estimatedCostRange.min.toLocaleString('ar-SA')} - {analysis.estimatedCostRange.max.toLocaleString('ar-SA')} ريال
      </Text>
      <Text style={styles.paragraph}>
        المدة: {analysis.estimatedDuration.development + analysis.estimatedDuration.testing + analysis.estimatedDuration.deployment} أسابيع
      </Text>
      <Text style={styles.sectionHeader}>التقنيات الموصى بها:</Text>
      <Text style={styles.paragraph}>{analysis.recommendedTechnologies.join(', ')}</Text>
    </Page>
  </Document>
);

/**
 * إنشاء تقرير PDF مفصل للمشروع
 */
export async function generateProjectAnalysisPDF(
  analysis: ProjectAnalysisResult,
  projectIdea: string
): Promise<Buffer> {
  try {
    console.log('بدء إنشاء تقرير PDF باستخدام @react-pdf/renderer...');
    
    const blob = await pdf(<ProjectReport analysis={analysis} projectIdea={projectIdea} />).toBuffer();
    
    console.log('✓ تم إنشاء PDF بنجاح باستخدام @react-pdf/renderer!');
    return blob;
    
  } catch (error) {
    console.error('خطأ في إنشاء PDF:', error);
    throw error;
  }
}

/**
 * إنشاء تقرير PDF مبسط للمشروع
 */
export async function generateSimpleProjectReport(
  analysis: ProjectAnalysisResult, 
  projectIdea: string
): Promise<Buffer> {
  try {
    console.log('بدء إنشاء تقرير PDF مبسط...');
    
    const blob = await pdf(<SimpleProjectReport analysis={analysis} projectIdea={projectIdea} />).toBuffer();
    
    console.log('✓ تم إنشاء PDF المبسط بنجاح!');
    return blob;
    
  } catch (error) {
    console.error('خطأ في إنشاء PDF المبسط:', error);
    throw error;
  }
}
