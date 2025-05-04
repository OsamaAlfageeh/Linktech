import SEO from "@/components/seo/SEO";
import { Link } from "wouter";

const SitemapPage = () => {
  return (
    <>
      <SEO 
        title="خريطة الموقع"
        description="استعرض جميع صفحات موقع لينكتك - المنصة الرائدة لربط رواد الأعمال بشركات البرمجة في المملكة العربية السعودية"
        keywords="خريطة الموقع, لينكتك, منصة برمجية, شركات برمجة, خدمات تقنية, تطوير برمجيات"
      />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">خريطة الموقع</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* الصفحات الرئيسية */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
              <h2 className="text-xl font-bold mb-4 border-b pb-2 border-neutral-200">الصفحات الرئيسية</h2>
              <ul className="space-y-2 text-primary">
                <li><Link href="/" className="hover:underline">الرئيسية</Link></li>
                <li><Link href="/about" className="hover:underline">من نحن</Link></li>
                <li><Link href="/how-it-works" className="hover:underline">كيف يعمل</Link></li>
                <li><Link href="/projects" className="hover:underline">المشاريع</Link></li>
                <li><Link href="/contact" className="hover:underline">اتصل بنا</Link></li>
              </ul>
            </div>
            
            {/* صفحات المساعدة والدعم */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
              <h2 className="text-xl font-bold mb-4 border-b pb-2 border-neutral-200">المساعدة والدعم</h2>
              <ul className="space-y-2 text-primary">
                <li><Link href="/terms" className="hover:underline">شروط الاستخدام</Link></li>
                <li><Link href="/privacy" className="hover:underline">سياسة الخصوصية</Link></li>
                <li><Link href="/faq" className="hover:underline">الأسئلة الشائعة</Link></li>
              </ul>
            </div>
            
            {/* صفحات المستخدمين */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
              <h2 className="text-xl font-bold mb-4 border-b pb-2 border-neutral-200">صفحات المستخدمين</h2>
              <ul className="space-y-2 text-primary">
                <li><Link href="/auth/login" className="hover:underline">تسجيل الدخول</Link></li>
                <li><Link href="/auth/register" className="hover:underline">إنشاء حساب جديد</Link></li>
                <li><Link href="/auth/reset-password" className="hover:underline">إعادة تعيين كلمة المرور</Link></li>
              </ul>
            </div>
            
            {/* الحسابات والتصنيفات */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
              <h2 className="text-xl font-bold mb-4 border-b pb-2 border-neutral-200">لوحات التحكم</h2>
              <ul className="space-y-2 text-primary">
                <li><Link href="/dashboard/entrepreneur" className="hover:underline">لوحة تحكم رائد الأعمال</Link></li>
                <li><Link href="/dashboard/company" className="hover:underline">لوحة تحكم الشركة</Link></li>
                <li><Link href="/messages" className="hover:underline">الرسائل</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 p-6 bg-blue-50 rounded-xl">
            <h2 className="text-xl font-bold mb-4">معلومات إضافية</h2>
            <p className="text-neutral-700 mb-4">
              بالإضافة إلى الصفحات المذكورة أعلاه، يتضمن الموقع صفحات خاصة بالمشاريع الفردية وصفحات ملفات الشركات، والتي يمكن الوصول إليها من خلال تصفح المشاريع أو البحث عن الشركات.
            </p>
            <p className="text-neutral-700">
              يمكن لمحركات البحث الوصول إلى <a href="/sitemap.xml" className="text-primary hover:underline" target="_blank">خريطة الموقع بصيغة XML</a> للحصول على قائمة كاملة بجميع الصفحات.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SitemapPage;