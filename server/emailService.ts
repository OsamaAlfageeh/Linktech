/**
 * خدمة البريد الإلكتروني باستخدام MailerSend
 * تقدم وظائف لإرسال رسائل البريد الإلكتروني مثل إعادة تعيين كلمة المرور والإشعارات
 */

import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";

if (!process.env.MAILERSEND_API_KEY) {
  console.error("خطأ: لم يتم توفير مفتاح API لـ MailerSend");
  throw new Error("MAILERSEND_API_KEY environment variable is not set");
}

// إنشاء مثيل جديد من MailerSend باستخدام مفتاح API
const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

// معلومات المرسل الافتراضية
const defaultSender = new Sender("support@techlink.sa", "منصة تكلينك");

/**
 * إرسال بريد إلكتروني لإعادة تعيين كلمة المرور
 * @param email البريد الإلكتروني للمستلم
 * @param name اسم المستلم
 * @param resetToken رمز إعادة التعيين
 * @param resetLink رابط إعادة تعيين كلمة المرور
 * @returns وعد يحل عند نجاح الإرسال أو يرفض عند الفشل
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetToken: string,
  resetLink: string
): Promise<boolean> {
  try {
    const recipients = [new Recipient(email, name)];

    // بناء قالب البريد الإلكتروني
    const emailParams = new EmailParams()
      .setFrom(defaultSender)
      .setTo(recipients)
      .setReplyTo(defaultSender)
      .setSubject("إعادة تعيين كلمة المرور لمنصة تكلينك")
      .setHtml(`
        <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #10B981;">إعادة تعيين كلمة المرور</h2>
          <p>مرحباً ${name}،</p>
          <p>لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك في منصة تكلينك.</p>
          <p>إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد الإلكتروني.</p>
          <p>لإعادة تعيين كلمة المرور الخاصة بك، يرجى الضغط على الرابط أدناه:</p>
          <p style="margin: 20px 0;">
            <a 
              href="${resetLink}" 
              style="background-color: #10B981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;"
            >
              إعادة تعيين كلمة المرور
            </a>
          </p>
          <p>أو يمكنك نسخ ولصق الرابط التالي في متصفحك:</p>
          <p style="margin: 20px 0;">
            <a href="${resetLink}" style="color: #10B981;">${resetLink}</a>
          </p>
          <p>يرجى ملاحظة أن رابط إعادة تعيين كلمة المرور صالح لمدة 24 ساعة فقط.</p>
          <p>إذا كنت بحاجة إلى مساعدة إضافية، يرجى الاتصال بفريق الدعم الخاص بنا.</p>
          <p style="margin-top: 30px;">مع أطيب التحيات،<br>فريق منصة تكلينك</p>
        </div>
      `)
      .setText(`
        إعادة تعيين كلمة المرور
        
        مرحباً ${name}،
        
        لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك في منصة تكلينك.
        
        إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد الإلكتروني.
        
        لإعادة تعيين كلمة المرور الخاصة بك، يرجى زيارة الرابط التالي:
        ${resetLink}
        
        يرجى ملاحظة أن رابط إعادة تعيين كلمة المرور صالح لمدة 24 ساعة فقط.
        
        إذا كنت بحاجة إلى مساعدة إضافية، يرجى الاتصال بفريق الدعم الخاص بنا.
        
        مع أطيب التحيات،
        فريق منصة تكلينك
      `);

    // إرسال البريد الإلكتروني
    const response = await mailerSend.email.send(emailParams);
    console.log("تم إرسال بريد إعادة تعيين كلمة المرور بنجاح إلى:", email);
    console.log("رمز إعادة التعيين:", resetToken);
    return true;
  } catch (error) {
    console.error("خطأ في إرسال بريد إعادة تعيين كلمة المرور:", error);
    return false;
  }
}

/**
 * إرسال بريد إلكتروني للترحيب بالمستخدم الجديد
 * @param email البريد الإلكتروني للمستلم
 * @param name اسم المستلم
 * @returns وعد يحل عند نجاح الإرسال أو يرفض عند الفشل
 */
export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<boolean> {
  try {
    const recipients = [new Recipient(email, name)];

    // بناء قالب البريد الإلكتروني
    const emailParams = new EmailParams()
      .setFrom(defaultSender)
      .setTo(recipients)
      .setReplyTo(defaultSender)
      .setSubject("مرحباً بك في منصة تكلينك")
      .setHtml(`
        <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #10B981;">مرحباً بك في منصة تكلينك</h2>
          <p>مرحباً ${name}،</p>
          <p>نشكرك على التسجيل في منصة تكلينك! نحن سعداء بانضمامك إلينا.</p>
          <p>منصة تكلينك هي المكان المثالي للربط بين رواد الأعمال وشركات البرمجة لتحقيق المشاريع التقنية بنجاح.</p>
          <p>يمكنك الآن:</p>
          <ul style="list-style-type: none; padding-right: 20px;">
            <li>✅ استكشاف المشاريع المتاحة</li>
            <li>✅ التواصل مع أفضل المطورين</li>
            <li>✅ إدارة مشاريعك بكفاءة</li>
          </ul>
          <p style="margin: 20px 0;">
            <a 
              href="https://techlink.sa/dashboard" 
              style="background-color: #10B981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;"
            >
              الذهاب إلى لوحة التحكم
            </a>
          </p>
          <p>إذا كان لديك أي أسئلة أو استفسارات، لا تتردد في التواصل معنا.</p>
          <p style="margin-top: 30px;">مع أطيب التحيات،<br>فريق منصة تكلينك</p>
        </div>
      `)
      .setText(`
        مرحباً بك في منصة تكلينك
        
        مرحباً ${name}،
        
        نشكرك على التسجيل في منصة تكلينك! نحن سعداء بانضمامك إلينا.
        
        منصة تكلينك هي المكان المثالي للربط بين رواد الأعمال وشركات البرمجة لتحقيق المشاريع التقنية بنجاح.
        
        يمكنك الآن:
        - استكشاف المشاريع المتاحة
        - التواصل مع أفضل المطورين
        - إدارة مشاريعك بكفاءة
        
        للذهاب إلى لوحة التحكم، يرجى زيارة الرابط التالي:
        https://techlink.sa/dashboard
        
        إذا كان لديك أي أسئلة أو استفسارات، لا تتردد في التواصل معنا.
        
        مع أطيب التحيات،
        فريق منصة تكلينك
      `);

    // إرسال البريد الإلكتروني
    const response = await mailerSend.email.send(emailParams);
    console.log("تم إرسال بريد الترحيب بنجاح إلى:", email);
    return true;
  } catch (error) {
    console.error("خطأ في إرسال بريد الترحيب:", error);
    return false;
  }
}

/**
 * إرسال إشعار بعرض جديد على مشروع
 * @param email البريد الإلكتروني للمستلم
 * @param name اسم المستلم
 * @param projectName اسم المشروع
 * @param companyName اسم الشركة التي قدمت العرض
 * @param offerAmount قيمة العرض
 * @param projectLink رابط صفحة المشروع
 * @returns وعد يحل عند نجاح الإرسال أو يرفض عند الفشل
 */
export async function sendNewOfferNotification(
  email: string,
  name: string,
  projectName: string,
  companyName: string,
  offerAmount: number,
  projectLink: string
): Promise<boolean> {
  try {
    const recipients = [new Recipient(email, name)];

    // بناء قالب البريد الإلكتروني
    const emailParams = new EmailParams()
      .setFrom(defaultSender)
      .setTo(recipients)
      .setReplyTo(defaultSender)
      .setSubject(`عرض جديد على مشروعك: ${projectName}`)
      .setHtml(`
        <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #10B981;">عرض جديد على مشروعك</h2>
          <p>مرحباً ${name}،</p>
          <p>تهانينا! لقد تلقيت عرضاً جديداً على مشروعك <strong>${projectName}</strong>.</p>
          <p><strong>تفاصيل العرض:</strong></p>
          <ul style="list-style-type: none; padding-right: 20px;">
            <li>🏢 <strong>الشركة:</strong> ${companyName}</li>
            <li>💰 <strong>قيمة العرض:</strong> ${offerAmount} ريال سعودي</li>
          </ul>
          <p>يمكنك الاطلاع على تفاصيل العرض ومراجعته من خلال الرابط أدناه:</p>
          <p style="margin: 20px 0;">
            <a 
              href="${projectLink}" 
              style="background-color: #10B981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;"
            >
              عرض التفاصيل
            </a>
          </p>
          <p>نرجو مراجعة العرض في أقرب وقت ممكن.</p>
          <p style="margin-top: 30px;">مع أطيب التحيات،<br>فريق منصة تكلينك</p>
        </div>
      `)
      .setText(`
        عرض جديد على مشروعك
        
        مرحباً ${name}،
        
        تهانينا! لقد تلقيت عرضاً جديداً على مشروعك "${projectName}".
        
        تفاصيل العرض:
        - الشركة: ${companyName}
        - قيمة العرض: ${offerAmount} ريال سعودي
        
        يمكنك الاطلاع على تفاصيل العرض ومراجعته من خلال الرابط أدناه:
        ${projectLink}
        
        نرجو مراجعة العرض في أقرب وقت ممكن.
        
        مع أطيب التحيات،
        فريق منصة تكلينك
      `);

    // إرسال البريد الإلكتروني
    const response = await mailerSend.email.send(emailParams);
    console.log("تم إرسال إشعار العرض الجديد بنجاح إلى:", email);
    return true;
  } catch (error) {
    console.error("خطأ في إرسال إشعار العرض الجديد:", error);
    return false;
  }
}