/**
 * Test script for Sadiq authentication service
 */

async function testSadiqAuth() {
  try {
    // Import the Sadiq authentication service
    const { sadiqAuth } = await import('./server/sadiqAuthService.ts');
    
    console.log('🧪 اختبار خدمة المصادقة مع صادق...\n');
    
    // Test getting access token
    const token = await sadiqAuth.getAccessToken();
    
    console.log('✅ تم الحصول على رمز الوصول بنجاح!');
    console.log(`📏 طول الرمز: ${token.length} حرف`);
    console.log(`🔍 بداية الرمز: ${token.substring(0, 50)}...`);
    console.log(`⏰ تم في: ${new Date().toLocaleString('ar-SA')}\n`);
    
    // Test token caching by making another request
    console.log('🔄 اختبار التخزين المؤقت للرمز...');
    const cachedToken = await sadiqAuth.getAccessToken();
    
    if (token === cachedToken) {
      console.log('✅ التخزين المؤقت يعمل بشكل صحيح - تم إرجاع نفس الرمز');
    } else {
      console.log('⚠️ تم إنشاء رمز جديد - قد يكون التخزين المؤقت لا يعمل');
    }
    
    console.log('\n🎉 جميع الاختبارات نجحت! خدمة صادق جاهزة للاستخدام.');
    
  } catch (error) {
    console.error('❌ فشل في اختبار صادق:', error.message);
    
    if (error.message.includes('email') || error.message.includes('password')) {
      console.error('💡 تأكد من إضافة SADIQ_EMAIL و SADIQ_PASSWORD في أسرار ريبليت');
    }
    
    if (error.message.includes('authentication failed')) {
      console.error('💡 تأكد من صحة بيانات تسجيل الدخول في صادق');
    }
    
    process.exit(1);
  }
}

// Run the test
testSadiqAuth();