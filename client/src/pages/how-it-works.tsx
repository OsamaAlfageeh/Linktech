import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CheckCircle2, ArrowLeft, ArrowRight } from "lucide-react";

const HowItWorksPage = () => {
  return (
    <>
      <Helmet>
        <title>كيف يعمل موقعنا | لينكتك</title>
        <meta name="description" content="تعرف على كيفية عمل منصتنا وكيف يمكن أن تساعد في ربط أصحاب المشاريع التقنية مع الشركات المتخصصة" />
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">كيف يعمل لينكتك</h1>
          
          <div className="bg-white rounded-xl shadow-md p-6 md:p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-primary">الخطوات البسيطة للتواصل والإنجاز</h2>
            
            <div className="space-y-10 my-10">
              {/* الخطوة 1 */}
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="bg-primary/10 rounded-full p-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">تسجيل وإنشاء حساب</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    قم بإنشاء حساب جديد كرائد أعمال أو شركة تطوير، وأكمل ملفك الشخصي بالمعلومات والمهارات المطلوبة لتعزيز فرص التوافق الناجح.
                  </p>
                </div>
              </div>
              
              {/* الخطوة 2 */}
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="bg-primary/10 rounded-full p-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">نشر مشروعك أو استعراض المشاريع</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    كصاحب فكرة أو مشروع، قم بإنشاء ونشر مشروعك مع وصف تفصيلي واضح للمتطلبات والميزانية.
                    كشركة تطوير، استعرض المشاريع المتاحة التي تتناسب مع خبراتك واهتماماتك.
                  </p>
                </div>
              </div>
              
              {/* الخطوة 3 */}
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="bg-primary/10 rounded-full p-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">تقديم العروض والتواصل</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    تقوم الشركات المهتمة بتقديم عروضها للمشروع مع تحديد التكلفة والمدة والمميزات.
                    يمكن لأصحاب المشاريع التواصل مع الشركات عبر نظام المراسلة المدمج في المنصة.
                  </p>
                </div>
              </div>
              
              {/* الخطوة 4 */}
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="bg-primary/10 rounded-full p-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">4</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">قبول العرض وبدء العمل</h3>
                  <p className="text-neutral-600 leading-relaxed">
                    عند اختيار العرض المناسب، يقوم صاحب المشروع بدفع عربون 10٪ من قيمة المشروع، ليتم الكشف عن بيانات التواصل المباشرة للشركة،
                    ويمكن للطرفين البدء في التعاون وتنفيذ المشروع خارج المنصة.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 md:p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-primary">مميزات لينكتك</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg mb-1">توافق ذكي</h3>
                  <p className="text-neutral-600">نظام توصيات مدعوم بالذكاء الاصطناعي يربط المشاريع بالشركات الأكثر ملاءمة.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg mb-1">تواصل آمن</h3>
                  <p className="text-neutral-600">نظام مراسلة مدمج مع خصوصية عالية وحماية لمعلومات الأطراف.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg mb-1">شفافية كاملة</h3>
                  <p className="text-neutral-600">عرض واضح للتكاليف والمدد الزمنية بدون رسوم خفية.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg mb-1">دعم مستمر</h3>
                  <p className="text-neutral-600">فريق دعم متخصص لحل جميع المشكلات ومساعدة الأطراف.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-primary/90 to-primary/70 text-white rounded-xl shadow-md p-6 md:p-8">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">ابدأ رحلتك الآن</h2>
              <p className="mb-8 text-white/80">
                سواء كنت صاحب مشروع تقني طموح أو شركة تطوير متخصصة، انضم إلينا اليوم واستفد من ميزات منصة لينكتك لتحقيق أهدافك.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" variant="secondary" className="group">
                  <Link href="/auth/register" className="flex items-center">
                    إنشاء حساب جديد
                    <ArrowLeft className="mr-2 h-5 w-5 transition-transform group-hover:-translate-x-1" />
                  </Link>
                </Button>
                
                <Button asChild size="lg" variant="outline" className="group bg-white/10 border-white/20 hover:bg-white/20">
                  <Link href="/projects" className="flex items-center">
                    استعراض المشاريع
                    <ArrowRight className="mr-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HowItWorksPage;