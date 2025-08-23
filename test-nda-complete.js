/**
 * Test complete NDA creation workflow with Sadiq integration
 */

async function testCompleteNdaWorkflow() {
  console.log('🧪 اختبار سير العمل الكامل لاتفاقية عدم الإفصاح مع صادق\n');
  
  try {
    // Step 1: Test Sadiq authentication
    console.log('1️⃣ اختبار المصادقة مع صادق...');
    const { sadiqAuth } = await import('./server/sadiqAuthService.ts');
    
    let token;
    try {
      token = await sadiqAuth.getAccessToken();
      console.log(`✅ تم الحصول على رمز الوصول: ${token.substring(0, 30)}...`);
    } catch (authError) {
      console.log('❌ فشل في الحصول على رمز الوصول:', authError.message.split('\n')[0]);
      console.log('\n💡 لاختبار النظام الكامل، يرجى إضافة SADIQ_ACCESS_TOKEN في الأسرار');
      return;
    }

    // Step 2: Test PDF generation
    console.log('\n2️⃣ اختبار إنشاء ملف PDF لاتفاقية عدم الإفصاح...');
    const { generateProjectNdaPdf } = await import('./server/generateNDA.ts');
    
    const testProjectData = {
      title: 'تطبيق إدارة المشاريع',
      description: 'تطبيق ويب لإدارة المشاريع مع واجهة مستخدم عصرية'
    };
    
    const testCompanyData = {
      name: 'شركة لينكتك للتقنية',
      location: 'المملكة العربية السعودية'
    };
    
    const testSigningData = {
      entrepreneur: '[سيتم التحقق عبر نفاذ]',
      companyRep: '[سيتم التحقق عبر نفاذ]'
    };
    
    const pdfBuffer = await generateProjectNdaPdf(testProjectData, testCompanyData, testSigningData);
    console.log(`✅ تم إنشاء ملف PDF بنجاح (${pdfBuffer.length} بايت)`);

    // Step 3: Test document upload to Sadiq
    console.log('\n3️⃣ اختبار رفع الوثيقة إلى صادق...');
    const base64Pdf = pdfBuffer.toString('base64');
    const uploadResult = await sadiqAuth.uploadDocument(base64Pdf, 'test-nda.pdf');
    console.log(`✅ تم رفع الوثيقة بنجاح - معرف الوثيقة: ${uploadResult.id}`);

    // Step 4: Test sending invitations
    console.log('\n4️⃣ اختبار إرسال دعوات التوقيع...');
    const invitationData = {
      referenceNumber: `linktech-test-${Date.now()}`,
      envelopeDocument: {
        documentId: uploadResult.id,
        signOrder: 0
      },
      signatories: [
        {
          fullName: 'صاحب المشروع الاختباري',
          email: 'project-owner@example.com',
          phoneNumber: '+966500000001',
          signOrder: 0,
          nationalId: '',
          gender: 'NONE'
        },
        {
          fullName: 'ممثل الشركة الاختباري',
          email: 'company-rep@example.com',
          phoneNumber: '+966500000002',
          signOrder: 1,
          nationalId: '',
          gender: 'NONE'
        }
      ],
      requestFields: [],
      invitationMessage: 'اختبار إرسال دعوات التوقيع الإلكتروني من منصة لينكتك'
    };

    const invitationResult = await sadiqAuth.sendSigningInvitations(invitationData);
    console.log(`✅ تم إرسال الدعوات بنجاح - معرف المغلف: ${invitationResult.envelopeId}`);

    console.log('\n🎉 تم اختبار جميع خطوات سير العمل بنجاح!');
    console.log('\n📋 ملخص الاختبار:');
    console.log(`- رمز الوصول: متوفر`);
    console.log(`- ملف PDF: ${pdfBuffer.length} بايت`);
    console.log(`- معرف الوثيقة: ${uploadResult.id}`);
    console.log(`- معرف المغلف: ${invitationResult.envelopeId}`);
    console.log(`- الرقم المرجعي: ${invitationData.referenceNumber}`);
    
  } catch (error) {
    console.error('\n❌ خطأ في اختبار سير العمل:', error.message);
    
    if (error.message.includes('token') || error.message.includes('authentication')) {
      console.log('\n💡 تلميح: تأكد من إضافة SADIQ_ACCESS_TOKEN صالح في الأسرار');
    }
  }
}

// Run the test
testCompleteNdaWorkflow();