import { Link } from "wouter";
import { 
  Code, 
  Users, 
  Search, 
  CheckCircle, 
  DollarSign, 
  Zap, 
  Shield, 
  Award, 
  TrendingUp 
} from "lucide-react";
import { Button } from "@/components/ui/button";

const CompanyPromotionSection = () => {
  return (
    <section className="py-16 bg-gradient-to-b from-white to-neutral-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="font-heading text-3xl font-bold text-neutral-800">
            شركات البرمجة والمطورين
          </h2>
          <p className="mt-4 text-lg text-neutral-600 leading-relaxed">
            انضم إلى منصة لنكتك واحصل على عملاء جدد لشركتك أو فريق التطوير الخاص بك. نحن نوفر فرصًا مميزة لتنمية أعمالك وزيادة إيراداتك.
          </p>
        </div>

        {/* الميزات والفوائد في بطاقات */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
            <div className="bg-primary/10 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
              <Search className="text-primary h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">فرص مشاريع متنوعة</h3>
            <p className="text-neutral-600">الوصول إلى مئات المشاريع المتنوعة من رواد أعمال وشركات ناشئة في مختلف المجالات التقنية.</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
            <div className="bg-accent/10 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
              <Shield className="text-accent h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">حماية كاملة للمدفوعات</h3>
            <p className="text-neutral-600">نظام مدفوعات آمن يضمن حقوقك المالية ويسهل عملية تحصيل المستحقات عند إنجاز المشاريع.</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
            <div className="bg-green-100 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
              <Award className="text-green-600 h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">بناء سمعة قوية</h3>
            <p className="text-neutral-600">تعزيز مكانة شركتك عبر نظام تقييمات مفصل وتوصيات العملاء التي تزيد من مصداقيتك وفرص عملك.</p>
          </div>
        </div>

        {/* إحصائيات مؤثرة */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-white rounded-lg border border-neutral-200 p-6 text-center transform transition-all hover:bg-primary-50 hover:shadow hover:border-primary/30">
            <h3 className="text-3xl font-bold text-primary">+٢٥٪</h3>
            <p className="text-neutral-600 mt-1">زيادة في العملاء</p>
          </div>
          <div className="bg-white rounded-lg border border-neutral-200 p-6 text-center transform transition-all hover:bg-primary-50 hover:shadow hover:border-primary/30">
            <h3 className="text-3xl font-bold text-primary">-٤٠٪</h3>
            <p className="text-neutral-600 mt-1">خفض تكاليف التسويق</p>
          </div>
          <div className="bg-white rounded-lg border border-neutral-200 p-6 text-center transform transition-all hover:bg-primary-50 hover:shadow hover:border-primary/30">
            <h3 className="text-3xl font-bold text-primary">٣٠+</h3>
            <p className="text-neutral-600 mt-1">مشروع شهرياً</p>
          </div>
          <div className="bg-white rounded-lg border border-neutral-200 p-6 text-center transform transition-all hover:bg-primary-50 hover:shadow hover:border-primary/30">
            <h3 className="text-3xl font-bold text-primary">١٠٠٪</h3>
            <p className="text-neutral-600 mt-1">رضا العملاء</p>
          </div>
        </div>

        {/* قسم كيف يعمل */}
        <div className="bg-white rounded-xl shadow-md border border-neutral-200 p-8 mb-12">
          <h3 className="text-2xl font-bold mb-6 text-center">كيف تبدأ في الحصول على مشاريع جديدة؟</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="bg-neutral-100 rounded-full w-16 h-16 flex items-center justify-center mb-4 relative">
                <Users className="h-8 w-8 text-primary" />
                <span className="absolute -top-2 -right-2 bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">١</span>
              </div>
              <h4 className="text-lg font-semibold mb-2">أنشئ حساب شركة</h4>
              <p className="text-neutral-600">سجل كشركة أو مطور مستقل وأكمل ملفك الشخصي بالمهارات والخبرات.</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="bg-neutral-100 rounded-full w-16 h-16 flex items-center justify-center mb-4 relative">
                <Search className="h-8 w-8 text-primary" />
                <span className="absolute -top-2 -right-2 bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">٢</span>
              </div>
              <h4 className="text-lg font-semibold mb-2">تصفح المشاريع</h4>
              <p className="text-neutral-600">ابحث عن المشاريع التي تناسب مهاراتك واطلع على تفاصيلها الكاملة.</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="bg-neutral-100 rounded-full w-16 h-16 flex items-center justify-center mb-4 relative">
                <CheckCircle className="h-8 w-8 text-primary" />
                <span className="absolute -top-2 -right-2 bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">٣</span>
              </div>
              <h4 className="text-lg font-semibold mb-2">قدم عروضك</h4>
              <p className="text-neutral-600">أرسل عرضك المميز وتواصل مع أصحاب المشاريع لتحويلهم إلى عملاء.</p>
            </div>
          </div>
        </div>

        {/* زر الحث على العمل */}
        <div className="text-center">
          <Link href="/auth/register">
            <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:from-primary-dark hover:to-accent/90 text-white font-semibold rounded-lg px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-lg">
              <Code className="ml-2 h-5 w-5" />
              سجل الآن كشركة برمجة
            </Button>
          </Link>
          <p className="mt-4 text-neutral-500">انضم إلى مئات الشركات التي تنمو أعمالها معنا</p>
        </div>
      </div>
    </section>
  );
};

export default CompanyPromotionSection;
