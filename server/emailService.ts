import { MailerSend, EmailParams, Recipient, Sender } from "mailersend";

// التحقق من وجود مفتاح API لخدمة MailerSend
if (!process.env.MAILERSEND_API_KEY) {
  console.warn("تحذير: لم يتم تعيين MAILERSEND_API_KEY، لن يعمل إرسال البريد الإلكتروني");
}

// إنشاء مثيل من MailerSend باستخدام مفتاح API
const mailerSend = process.env.MAILERSEND_API_KEY 
  ? new MailerSend({ apiKey: process.env.MAILERSEND_API_KEY })
  : null;

// إعداد معلومات المرسل
// استخدام الدومين المسجل في حساب MailerSend
const sender = new Sender("noreply@test-q3enl6kkd8r42vwr.mlsender.net", "لينكتك");

/**
 * إرسال بريد إلكتروني لإعادة تعيين كلمة المرور
 * @param email البريد الإلكتروني للمستخدم
 * @param name اسم المستخدم
 * @param token رمز إعادة التعيين
 * @param resetLink رابط إعادة التعيين الكامل
 * @returns وعد بنجاح أو فشل العملية
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string,
  resetLink: string
): Promise<boolean> {
  // التحقق من وجود مثيل MailerSend
  if (!mailerSend) {
    console.error("تعذر إرسال البريد الإلكتروني: لم يتم تكوين MailerSend");
    return false;
  }

  try {
    const recipient = new Recipient(email, name);
    const recipients = [recipient];

    // بناء معلمات البريد الإلكتروني
    const emailParams = new EmailParams()
      .setFrom(sender)
      .setTo(recipients)
      .setSubject("إعادة تعيين كلمة المرور - منصة لينكتك")
      .setHtml(`
        <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #2563eb; margin: 0; font-size: 24px;">لينكتك</h1>
            <p style="font-size: 16px; margin-top: 5px;">منصة ربط رواد الأعمال بشركات البرمجة</p>
          </div>
          
          <div style="background-color: #ffffff; padding: 20px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <h2 style="color: #1f2937; margin-top: 0;">طلب إعادة تعيين كلمة المرور</h2>
            
            <p style="margin-bottom: 25px;">مرحباً ${name}،</p>
            
            <p>لقد تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك في منصة لينكتك. يرجى النقر على الزر أدناه لإعادة تعيين كلمة المرور الخاصة بك:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">إعادة تعيين كلمة المرور</a>
            </div>
            
            <p>أو يمكنك نسخ ولصق الرابط التالي في متصفحك:</p>
            <p style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; word-break: break-all;">${resetLink}</p>
            
            <p style="margin-top: 25px;">ينتهي هذا الرابط خلال 24 ساعة.</p>
            
            <p>إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد الإلكتروني أو الاتصال بفريق الدعم إذا كان لديك أي استفسارات.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; font-size: 14px; color: #666;">
              <p>مع تحيات،<br>فريق منصة لينكتك</p>
            </div>
          </div>
        </div>
      `)
      .setText(
        `مرحباً ${name}،
        
لقد تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك في منصة لينكتك.

لإعادة تعيين كلمة المرور الخاصة بك، يرجى زيارة الرابط التالي:
${resetLink}

ينتهي هذا الرابط خلال 24 ساعة.

إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد الإلكتروني أو الاتصال بفريق الدعم إذا كان لديك أي استفسارات.

مع تحيات،
فريق منصة لينكتك`
      );

    // إرسال البريد الإلكتروني
    const response = await mailerSend.email.send(emailParams);
    console.log("تم إرسال بريد إعادة تعيين كلمة المرور بنجاح:", response);
    return true;
  } catch (error) {
    console.error("فشل في إرسال بريد إعادة تعيين كلمة المرور:", error);
    return false;
  }
}

/**
 * إرسال إشعار بتغيير كلمة المرور
 * @param email البريد الإلكتروني للمستخدم
 * @param name اسم المستخدم
 * @returns وعد بنجاح أو فشل العملية
 */
export async function sendPasswordChangedNotification(
  email: string,
  name: string
): Promise<boolean> {
  // التحقق من وجود مثيل MailerSend
  if (!mailerSend) {
    console.error("تعذر إرسال البريد الإلكتروني: لم يتم تكوين MailerSend");
    return false;
  }

  try {
    const recipient = new Recipient(email, name);
    const recipients = [recipient];

    // بناء معلمات البريد الإلكتروني
    const emailParams = new EmailParams()
      .setFrom(sender)
      .setTo(recipients)
      .setSubject("تم تغيير كلمة المرور الخاصة بك - منصة لينكتك")
      .setHtml(`
        <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #2563eb; margin: 0; font-size: 24px;">لينكتك</h1>
            <p style="font-size: 16px; margin-top: 5px;">منصة ربط رواد الأعمال بشركات البرمجة</p>
          </div>
          
          <div style="background-color: #ffffff; padding: 20px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <h2 style="color: #1f2937; margin-top: 0;">تم تغيير كلمة المرور بنجاح</h2>
            
            <p style="margin-bottom: 25px;">مرحباً ${name}،</p>
            
            <p>نود إعلامك أنه تم تغيير كلمة المرور لحسابك في منصة لينكتك بنجاح.</p>
            
            <p>إذا لم تقم بتغيير كلمة المرور، يرجى الاتصال بفريق الدعم على الفور.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; font-size: 14px; color: #666;">
              <p>مع تحيات،<br>فريق منصة لينكتك</p>
            </div>
          </div>
        </div>
      `)
      .setText(
        `مرحباً ${name}،
        
نود إعلامك أنه تم تغيير كلمة المرور لحسابك في منصة لينكتك بنجاح.

إذا لم تقم بتغيير كلمة المرور، يرجى الاتصال بفريق الدعم على الفور.

مع تحيات،
فريق منصة لينكتك`
      );

    // إرسال البريد الإلكتروني
    const response = await mailerSend.email.send(emailParams);
    console.log("تم إرسال إشعار تغيير كلمة المرور بنجاح:", response);
    return true;
  } catch (error) {
    console.error("فشل في إرسال إشعار تغيير كلمة المرور:", error);
    return false;
  }
}

/**
 * إرسال بريد ترحيبي للمستخدم الجديد
 * @param email البريد الإلكتروني للمستخدم
 * @param name اسم المستخدم
 * @param userRole دور المستخدم (entrepreneur, company)
 * @returns وعد بنجاح أو فشل العملية
 */
export async function sendWelcomeEmail(
  email: string,
  name: string,
  userRole: string
): Promise<boolean> {
  // التحقق من وجود مثيل MailerSend
  if (!mailerSend) {
    console.error("تعذر إرسال البريد الإلكتروني: لم يتم تكوين MailerSend");
    return false;
  }

  try {
    const recipient = new Recipient(email, name);
    const recipients = [recipient];

    // تخصيص محتوى البريد الإلكتروني بناءً على دور المستخدم
    let roleSpecificContent = '';
    let roleSpecificText = '';
    let subject = "مرحباً بك في منصة لينكتك!";

    if (userRole === 'entrepreneur') {
      roleSpecificContent = `
        <p>نحن متحمسون لمساعدتك في تحويل أفكارك إلى مشاريع ناجحة. إليك بعض الخطوات للبدء:</p>
        <ul style="padding-right: 20px; margin-top: 10px;">
          <li>أكمل ملفك الشخصي لجعله جذاباً للشركات</li>
          <li>أنشئ مشروعك الأول وحدد تفاصيله بدقة</li>
          <li>تواصل مع الشركات التي تقدم عروضاً مناسبة</li>
        </ul>
      `;
      roleSpecificText = `
نحن متحمسون لمساعدتك في تحويل أفكارك إلى مشاريع ناجحة. إليك بعض الخطوات للبدء:
- أكمل ملفك الشخصي لجعله جذاباً للشركات
- أنشئ مشروعك الأول وحدد تفاصيله بدقة
- تواصل مع الشركات التي تقدم عروضاً مناسبة`;
    } else if (userRole === 'company') {
      roleSpecificContent = `
        <p>نحن متحمسون لانضمامك إلى شبكة شركات التطوير لدينا. إليك بعض الخطوات للبدء:</p>
        <ul style="padding-right: 20px; margin-top: 10px;">
          <li>أكمل ملف شركتك وأضف المهارات والتقنيات التي تتخصص بها</li>
          <li>استعرض المشاريع المتاحة وقدم عروضك المناسبة</li>
          <li>تواصل مع رواد الأعمال لمناقشة تفاصيل المشاريع</li>
        </ul>
      `;
      roleSpecificText = `
نحن متحمسون لانضمامك إلى شبكة شركات التطوير لدينا. إليك بعض الخطوات للبدء:
- أكمل ملف شركتك وأضف المهارات والتقنيات التي تتخصص بها
- استعرض المشاريع المتاحة وقدم عروضك المناسبة
- تواصل مع رواد الأعمال لمناقشة تفاصيل المشاريع`;
    } else {
      roleSpecificContent = `
        <p>نحن سعداء بانضمامك إلى منصتنا. استكشف الميزات المختلفة وتواصل معنا إذا كانت لديك أي أسئلة.</p>
      `;
      roleSpecificText = `
نحن سعداء بانضمامك إلى منصتنا. استكشف الميزات المختلفة وتواصل معنا إذا كانت لديك أي أسئلة.`;
    }

    // بناء معلمات البريد الإلكتروني
    const emailParams = new EmailParams()
      .setFrom(sender)
      .setTo(recipients)
      .setSubject(subject)
      .setHtml(`
        <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #2563eb; margin: 0; font-size: 24px;">لينكتك</h1>
            <p style="font-size: 16px; margin-top: 5px;">منصة ربط رواد الأعمال بشركات البرمجة</p>
          </div>
          
          <div style="background-color: #ffffff; padding: 20px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <h2 style="color: #1f2937; margin-top: 0;">مرحباً بك في منصة لينكتك</h2>
            
            <p style="margin-bottom: 25px;">مرحباً ${name}،</p>
            
            <p>شكراً لانضمامك إلى منصة لينكتك - المنصة الرائدة في ربط رواد الأعمال بشركات تطوير البرمجيات في المملكة العربية السعودية.</p>
            
            ${roleSpecificContent}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://linktech.sa/dashboard" style="background-color: #2563eb; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">الانتقال إلى لوحة التحكم</a>
            </div>
            
            <p>إذا كانت لديك أي استفسارات، لا تتردد في التواصل مع فريق الدعم لدينا.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; font-size: 14px; color: #666;">
              <p>مع تحيات،<br>فريق منصة لينكتك</p>
            </div>
          </div>
        </div>
      `)
      .setText(
        `مرحباً ${name}،
        
شكراً لانضمامك إلى منصة لينكتك - المنصة الرائدة في ربط رواد الأعمال بشركات تطوير البرمجيات في المملكة العربية السعودية.

${roleSpecificText}

إذا كانت لديك أي استفسارات، لا تتردد في التواصل مع فريق الدعم لدينا.

مع تحيات،
فريق منصة لينكتك`
      );

    // إرسال البريد الإلكتروني
    const response = await mailerSend.email.send(emailParams);
    console.log("تم إرسال بريد الترحيب بنجاح:", response);
    return true;
  } catch (error) {
    console.error("فشل في إرسال بريد الترحيب:", error);
    return false;
  }
}