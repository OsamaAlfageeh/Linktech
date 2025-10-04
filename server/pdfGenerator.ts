/**
 * PDF Generator using @react-pdf/renderer for perfect Arabic support
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, pdf } from '@react-pdf/renderer';

// Register Arabic fonts
Font.register({
  family: 'Cairo',
  src: 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap'
});

Font.register({
  family: 'Amiri',
  src: 'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap'
});

// Create styles for Arabic PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Cairo',
    direction: 'rtl',
    textAlign: 'right'
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    color: '#1a56db',
    fontWeight: 'bold',
    borderBottom: '2px solid #1a56db',
    paddingBottom: 10
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 5
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 10,
    borderRight: '4px solid #1e40af',
    paddingRight: 10
  },
  text: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 1.6,
    color: '#333333'
  },
  boldText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2c3e50'
  },
  list: {
    marginRight: 20,
    marginBottom: 10
  },
  listItem: {
    fontSize: 12,
    marginBottom: 5,
    color: '#333333'
  },
  phase: {
    backgroundColor: '#ffffff',
    border: '1px solid #ddd',
    padding: 15,
    marginBottom: 10,
    borderRadius: 5
  },
  phaseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8
  },
  phaseDescription: {
    fontSize: 12,
    marginBottom: 8,
    color: '#666666'
  },
  costInfo: {
    backgroundColor: '#e8f4f8',
    padding: 10,
    borderRadius: 5,
    margin: 10,
    textAlign: 'center'
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#666666',
    borderTop: '1px solid #ddd',
    paddingTop: 10
  }
});

// Arabic PDF Document Component
const ArabicPDFDocument = ({ data }: { data: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Title */}
      <Text style={styles.title}>تحليل مشروع تقني مفصل</Text>
      
      {/* Project Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>معلومات المشروع</Text>
        <Text style={styles.text}>اسم المشروع: {data.projectName || 'غير محدد'}</Text>
        <Text style={styles.text}>نوع المشروع: {data.projectType || 'غير محدد'}</Text>
        <Text style={styles.text}>مستوى التعقيد: {data.technicalComplexity || 'غير محدد'}</Text>
      </View>

      {/* Cost Information */}
      {data.estimatedCostRange && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>التكلفة المتوقعة</Text>
          <View style={styles.costInfo}>
            <Text style={styles.boldText}>
              من {data.estimatedCostRange.min?.toLocaleString('ar-SA')} إلى {data.estimatedCostRange.max?.toLocaleString('ar-SA')} {data.estimatedCostRange.currency}
            </Text>
          </View>
        </View>
      )}

      {/* Duration */}
      {data.estimatedDuration && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>المدة الزمنية</Text>
          <Text style={styles.text}>التطوير: {data.estimatedDuration.development} أسبوع</Text>
          <Text style={styles.text}>الاختبار: {data.estimatedDuration.testing} أسبوع</Text>
          <Text style={styles.text}>النشر: {data.estimatedDuration.deployment} أسبوع</Text>
        </View>
      )}

      {/* Technologies */}
      {data.recommendedTechnologies && data.recommendedTechnologies.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>التقنيات الموصى بها</Text>
          <View style={styles.list}>
            {data.recommendedTechnologies.map((tech: string, index: number) => (
              <Text key={index} style={styles.listItem}>• {tech}</Text>
            ))}
          </View>
        </View>
      )}

      {/* Project Phases */}
      {data.projectPhases && data.projectPhases.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>مراحل المشروع</Text>
          {data.projectPhases.map((phase: any, index: number) => (
            <View key={index} style={styles.phase}>
              <Text style={styles.phaseTitle}>{index + 1}. {phase.name}</Text>
              <Text style={styles.phaseDescription}>{phase.description}</Text>
              <Text style={styles.text}>التكلفة: {phase.cost?.toLocaleString('ar-SA')} ريال</Text>
              <Text style={styles.text}>المدة: {phase.duration} أسبوع</Text>
            </View>
          ))}
        </View>
      )}

      {/* Features */}
      {data.features && data.features.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>المزايا الأساسية</Text>
          <View style={styles.list}>
            {data.features
              .filter((f: any) => f.priority === 'essential')
              .map((feature: any, index: number) => (
                <Text key={index} style={styles.listItem}>• {feature.name}</Text>
              ))}
          </View>
        </View>
      )}

      {/* Risk Assessment */}
      {data.riskAssessment && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>تقييم المخاطر</Text>
          
          {data.riskAssessment.technicalRisks && data.riskAssessment.technicalRisks.length > 0 && (
            <>
              <Text style={styles.boldText}>المخاطر التقنية:</Text>
              <View style={styles.list}>
                {data.riskAssessment.technicalRisks.map((risk: string, index: number) => (
                  <Text key={index} style={styles.listItem}>• {risk}</Text>
                ))}
              </View>
            </>
          )}
          
          {data.riskAssessment.timelineRisks && data.riskAssessment.timelineRisks.length > 0 && (
            <>
              <Text style={styles.boldText}>مخاطر الجدولة الزمنية:</Text>
              <View style={styles.list}>
                {data.riskAssessment.timelineRisks.map((risk: string, index: number) => (
                  <Text key={index} style={styles.listItem}>• {risk}</Text>
                ))}
              </View>
            </>
          )}
          
          {data.riskAssessment.budgetRisks && data.riskAssessment.budgetRisks.length > 0 && (
            <>
              <Text style={styles.boldText}>مخاطر الميزانية:</Text>
              <View style={styles.list}>
                {data.riskAssessment.budgetRisks.map((risk: string, index: number) => (
                  <Text key={index} style={styles.listItem}>• {risk}</Text>
                ))}
              </View>
            </>
          )}
          
          {data.riskAssessment.mitigationStrategies && data.riskAssessment.mitigationStrategies.length > 0 && (
            <>
              <Text style={styles.boldText}>استراتيجيات التخفيف:</Text>
              <View style={styles.list}>
                {data.riskAssessment.mitigationStrategies.map((strategy: string, index: number) => (
                  <Text key={index} style={styles.listItem}>• {strategy}</Text>
                ))}
              </View>
            </>
          )}
        </View>
      )}

      {/* Maintenance Requirements */}
      {data.maintenanceRequirements && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>متطلبات الصيانة</Text>
          <Text style={styles.text}>التكرار: {data.maintenanceRequirements.frequency}</Text>
          <Text style={styles.text}>التكلفة الشهرية: {data.maintenanceRequirements.estimatedMonthlyCost?.toLocaleString('ar-SA')} ريال</Text>
          
          {data.maintenanceRequirements.requiredSkills && data.maintenanceRequirements.requiredSkills.length > 0 && (
            <>
              <Text style={styles.boldText}>المهارات المطلوبة:</Text>
              <View style={styles.list}>
                {data.maintenanceRequirements.requiredSkills.map((skill: string, index: number) => (
                  <Text key={index} style={styles.listItem}>• {skill}</Text>
                ))}
              </View>
            </>
          )}
        </View>
      )}

      {/* Footer */}
      <Text style={styles.footer}>
        تم إنشاء هذا التقرير في {new Date().toLocaleDateString('ar-SA')} بواسطة منصة لينكتك
      </Text>
    </Page>
  </Document>
);

/**
 * Generate Arabic PDF using @react-pdf/renderer
 */
export async function generateArabicPDF(data: any): Promise<Buffer> {
  try {
    console.log('🚀 بدء توليد PDF بالعربية باستخدام @react-pdf/renderer...');
    
    const pdfStream = await pdf(<ArabicPDFDocument data={data} />).toBuffer();
    
    console.log('✅ تم إنشاء PDF بنجاح! الحجم:', pdfStream.length, 'بايت');
    return pdfStream;
    
  } catch (error) {
    console.error('❌ خطأ في توليد PDF:', error);
    throw new Error(`فشل في إنشاء التقرير PDF: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
  }
}

/**
 * Save PDF to server file system
 */
export async function saveArabicPDF(data: any, outputPath: string): Promise<void> {
  try {
    const pdfBuffer = await generateArabicPDF(data);
    
    const fs = await import('fs');
    const path = await import('path');
    
    // Create directory if it doesn't exist
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, pdfBuffer);
    console.log('✅ تم حفظ PDF في:', outputPath);
    
  } catch (error) {
    console.error('❌ خطأ في حفظ PDF:', error);
    throw error;
  }
}

/**
 * Send PDF as HTTP response
 */
export async function sendPDFResponse(data: any, res: any): Promise<void> {
  try {
    const pdfBuffer = await generateArabicPDF(data);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="project-analysis.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
    console.log('✅ تم إرسال PDF بنجاح');
    
  } catch (error) {
    console.error('❌ خطأ في إرسال PDF:', error);
    throw error;
  }
}
