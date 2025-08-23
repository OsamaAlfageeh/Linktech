/**
 * Test complete NDA creation workflow with both parties data
 */

async function testCompleteNdaWorkflow() {
  console.log('🧪 اختبار سير العمل الكامل لاتفاقية عدم الإفصاح (طرفين) مع صادق\n');
  
  try {
    // Step 1: Test Sadiq authentication
    console.log('1️⃣ اختبار المصادقة الديناميكية مع صادق...');
    const { sadiqAuth } = await import('./server/sadiqAuthService.ts');
    
    let token;
    try {
      token = await sadiqAuth.getAccessToken();
      console.log(`✅ تم الحصول على رمز الوصول: ${token.substring(0, 30)}...`);
      console.log(`🔄 نوع المصادقة: ديناميكية (تتجدد مع كل جلسة)`);
    } catch (authError) {
      console.log('❌ فشل في الحصول على رمز الوصول:', authError.message.split('\n')[0]);
      console.log('\n💡 لاختبار النظام الكامل، يرجى إضافة SADIQ_ACCESS_TOKEN في الأسرار أو التأكد من بيانات SADIQ_EMAIL و SADIQ_PASSWORD');
      return;
    }

    // Step 2: Test PDF generation with real names
    console.log('\n2️⃣ اختبار إنشاء ملف PDF مع أسماء حقيقية لكلا الطرفين...');
    const { generateProjectNdaPdf } = await import('./server/generateNDA.ts');
    
    const testProjectData = {
      title: 'منصة التجارة الإلكترونية',
      description: 'منصة متكاملة للتجارة الإلكترونية مع نظام دفع آمن'
    };
    
    const testCompanyData = {
      name: 'شركة التقنيات المتقدمة',
      location: 'الرياض، المملكة العربية السعودية'
    };
    
    // بيانات حقيقية بدلاً من الرموز المؤقتة
    const testSigningData = {
      entrepreneur: 'أحمد محمد السعودي',
      companyRep: 'سارة علي التقنية'
    };
    
    const pdfBuffer = await generateProjectNdaPdf(testProjectData, testCompanyData, testSigningData);
    console.log(`✅ تم إنشاء ملف PDF مع أسماء حقيقية (${pdfBuffer.length} بايت)`);

    // Step 3: Test document upload to Sadiq
    console.log('\n3️⃣ اختبار رفع الوثيقة إلى صادق...');
    const base64Pdf = pdfBuffer.toString('base64');
    const fileName = `NDA-${testProjectData.title.replace(/\s+/g, '-')}-${Date.now()}.pdf`;
    const uploadResult = await sadiqAuth.uploadDocument(base64Pdf, fileName);
    console.log(`✅ تم رفع الوثيقة بنجاح - معرف الوثيقة: ${uploadResult.id}`);

    // Step 4: Test sending invitations with complete contact info
    console.log('\n4️⃣ اختبار إرسال دعوات التوقيع لكلا الطرفين...');
    const referenceNumber = `linktech-nda-${Date.now()}`;
    const invitationData = {
      referenceNumber,
      envelopeDocument: {
        documentId: uploadResult.id,
        signOrder: 0
      },
      signatories: [
        {
          fullName: 'أحمد محمد السعودي',
          email: 'ahmed.owner@example.com', 
          phoneNumber: '+966512345678',
          signOrder: 0,
          nationalId: '',
          gender: 'NONE'
        },
        {
          fullName: 'سارة علي التقنية',
          email: 'sara.company@example.com',
          phoneNumber: '+966523456789', 
          signOrder: 1,
          nationalId: '',
          gender: 'NONE'
        }
      ],
      requestFields: [],
      invitationMessage: `تم إنشاء اتفاقية عدم إفصاح للمشروع "${testProjectData.title}" عبر منصة لينكتك. يرجى المراجعة والتوقيع الإلكتروني لإكمال الاتفاقية.`
    };

    const invitationResult = await sadiqAuth.sendSigningInvitations(invitationData);
    console.log(`✅ تم إرسال الدعوات بنجاح - معرف المغلف: ${invitationResult.envelopeId}`);
    
    console.log(`📧 تم إرسال دعوات التوقيع إلى:`);
    console.log(`   - صاحب المشروع: ahmed.owner@example.com`);
    console.log(`   - ممثل الشركة: sara.company@example.com`);

    // Step 5: Test status checking
    console.log('\n5️⃣ اختبار التحقق من حالة المغلف...');
    try {
      const status = await sadiqAuth.checkEnvelopeStatus(referenceNumber);
      console.log(`✅ حالة المغلف: ${status.data?.status || 'غير محدد'}`);
    } catch (statusError) {
      console.log(`⚠️ لم يتم التمكن من التحقق من الحالة: ${statusError.message}`);
    }

    console.log('\n🎉 تم اختبار جميع خطوات سير العمل بنجاح!');
    console.log('\n📋 ملخص الاختبار النهائي:');
    console.log(`✅ المصادقة الديناميكية: نجحت`);
    console.log(`✅ إنشاء PDF مع بيانات حقيقية: ${pdfBuffer.length} بايت`);
    console.log(`✅ رفع الوثيقة لصادق: ${uploadResult.id}`);
    console.log(`✅ إرسال دعوات التوقيع لكلا الطرفين: ${invitationResult.envelopeId}`);
    console.log(`📝 الرقم المرجعي: ${referenceNumber}`);
    
    console.log('\n🚀 النظام جاهز للاستخدام مع البيانات الحقيقية!');
    
  } catch (error) {
    console.error('\n❌ خطأ في اختبار سير العمل:', error.message);
    console.error('تفاصيل الخطأ:', error.stack);
    
    if (error.message.includes('token') || error.message.includes('authentication')) {
      console.log('\n💡 تلميح: تأكد من إضافة SADIQ_ACCESS_TOKEN صالح أو صحة بيانات SADIQ_EMAIL و SADIQ_PASSWORD');
    }
  }
}

// Run the test
testCompleteNdaWorkflow();