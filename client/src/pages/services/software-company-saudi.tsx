import StaticPageLayout from "@/components/seo/StaticPageLayout";
import ServiceSchema from "@/components/seo/ServiceSchema";
import LazyImage from "@/components/ui/lazy-image";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Code,
  Cpu,
  Users,
  Trophy,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Star
} from "lucide-react";

const SoftwareCompanySaudiPage = () => {
  return (
    <StaticPageLayout
      title="أفضل شركة برمجة في السعودية | لينكتك"
      description="نقدم خدمات برمجية متكاملة في المملكة العربية السعودية مع فريق من المطورين المحترفين. احصل على حلول برمجية مخصصة تناسب احتياجات عملك."
      keywords="شركة برمجة, شركة برمجة في السعودية, تطوير برمجيات, برمجة تطبيقات, برمجة مواقع, شركة برمجة في الرياض, شركة برمجة في جدة"
      breadcrumbs={[
        { name: "الرئيسية", url: "/" },
        { name: "الخدمات", url: "/services" },
        { name: "شركة برمجة في السعودية", url: "/services/software-company-saudi" }
      ]}
      structuredData={
        <ServiceSchema
          name="خدمات تطوير البرمجيات"
          description="نقدم خدمات برمجية متكاملة في المملكة العربية السعودية مع فريق من المطورين المحترفين"
          url="https://linktech.app/services/software-company-saudi"
          provider="لينكتك"
          providerUrl="https://linktech.app"
          imageUrl="https://linktech.app/images/software-development-service.jpg"
          serviceArea="المملكة العربية السعودية"
        />
      }
    >
      <div className="space-y-12">
        {/* القسم الرئيسي */}
        <section className="text-center mb-16">
          <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-l from-primary to-primary/80">أفضل شركة برمجة</span>
            <br />في المملكة العربية السعودية
          </h1>
          <p className="text-lg md:text-xl text-neutral-600 mb-8 max-w-3xl mx-auto">
            نقدم حلول تقنية مبتكرة وخدمات برمجية متكاملة تناسب احتياجات الشركات والمؤسسات في جميع أنحاء المملكة
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/contact">
                تواصل معنا الآن
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/services">
                استعرض خدماتنا
              </Link>
            </Button>
          </div>
        </section>
        
        {/* لماذا نحن */}
        <section className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
            لماذا نحن الخيار الأفضل لمشروعك؟
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-neutral-50 p-6 rounded-xl">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Code className="text-primary h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">خبرة تقنية واسعة</h3>
              <p className="text-neutral-600">
                فريقنا يتمتع بخبرة تزيد عن 10 سنوات في مجال تطوير البرمجيات وتقديم حلول تقنية متكاملة
              </p>
            </div>
            
            <div className="bg-neutral-50 p-6 rounded-xl">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Cpu className="text-primary h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">أحدث التقنيات</h3>
              <p className="text-neutral-600">
                نستخدم أحدث التقنيات والأدوات البرمجية لتقديم حلول عصرية تواكب التطورات التكنولوجية
              </p>
            </div>
            
            <div className="bg-neutral-50 p-6 rounded-xl">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Users className="text-primary h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">فريق متخصص</h3>
              <p className="text-neutral-600">
                يضم فريقنا نخبة من المطورين والمصممين وخبراء تجربة المستخدم لتقديم منتجات عالية الجودة
              </p>
            </div>
            
            <div className="bg-neutral-50 p-6 rounded-xl">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Trophy className="text-primary h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">سجل حافل بالنجاحات</h3>
              <p className="text-neutral-600">
                حققنا نجاحات متعددة مع عملائنا في مختلف القطاعات وأنجزنا مئات المشاريع بكفاءة عالية
              </p>
            </div>
          </div>
        </section>
        
        {/* خدماتنا */}
        <section className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center">خدماتنا البرمجية</h2>
          <p className="text-center text-neutral-600 mb-8">
            نقدم مجموعة متكاملة من الخدمات البرمجية لتلبية احتياجات عملائنا
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="border border-neutral-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-xl mb-3 text-primary">تطوير تطبيقات الجوال</h3>
              <p className="text-neutral-600 mb-4">
                تصميم وتطوير تطبيقات احترافية لأنظمة iOS وAndroid مع واجهات مستخدم سلسة وأداء عالي
              </p>
              <Link href="/services/mobile-app-development" className="text-primary hover:text-primary-dark inline-flex items-center">
                المزيد من التفاصيل
                <ArrowLeft className="h-4 w-4 mr-1 rtl-flip" />
              </Link>
            </div>
            
            <div className="border border-neutral-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-xl mb-3 text-primary">تطوير المواقع الإلكترونية</h3>
              <p className="text-neutral-600 mb-4">
                تصميم وبرمجة مواقع إلكترونية عصرية ومتجاوبة مع جميع الأجهزة ومحسنة لمحركات البحث
              </p>
              <Link href="/services/website-development" className="text-primary hover:text-primary-dark inline-flex items-center">
                المزيد من التفاصيل
                <ArrowLeft className="h-4 w-4 mr-1 rtl-flip" />
              </Link>
            </div>
            
            <div className="border border-neutral-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-xl mb-3 text-primary">تطوير المتاجر الإلكترونية</h3>
              <p className="text-neutral-600 mb-4">
                إنشاء متاجر إلكترونية متكاملة مع أنظمة دفع آمنة وإدارة مخزون وتجربة تسوق سلسة
              </p>
              <Link href="/services/ecommerce-development" className="text-primary hover:text-primary-dark inline-flex items-center">
                المزيد من التفاصيل
                <ArrowLeft className="h-4 w-4 mr-1 rtl-flip" />
              </Link>
            </div>
            
            <div className="border border-neutral-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-xl mb-3 text-primary">تطوير الأنظمة الإدارية</h3>
              <p className="text-neutral-600 mb-4">
                تصميم أنظمة إدارية مخصصة لتحسين سير العمل وزيادة الإنتاجية وإدارة الموارد بكفاءة
              </p>
              <Link href="/services/management-systems" className="text-primary hover:text-primary-dark inline-flex items-center">
                المزيد من التفاصيل
                <ArrowLeft className="h-4 w-4 mr-1 rtl-flip" />
              </Link>
            </div>
          </div>
          
          <div className="text-center">
            <Button asChild>
              <Link href="/services">
                عرض جميع الخدمات
                <ArrowLeft className="mr-2 rtl-flip" />
              </Link>
            </Button>
          </div>
        </section>
        
        {/* منهجية العمل */}
        <section className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
            منهجيتنا في تنفيذ المشاريع
          </h2>
          
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="bg-primary text-white font-bold rounded-full w-10 h-10 flex-shrink-0 flex items-center justify-center">1</div>
              <div>
                <h3 className="font-bold text-xl mb-2">تحليل المتطلبات</h3>
                <p className="text-neutral-600">
                  نبدأ بفهم متطلبات عملك واحتياجاتك بشكل دقيق من خلال جلسات استماع وتحليل شامل للأهداف والتحديات
                </p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="bg-primary text-white font-bold rounded-full w-10 h-10 flex-shrink-0 flex items-center justify-center">2</div>
              <div>
                <h3 className="font-bold text-xl mb-2">التصميم والتخطيط</h3>
                <p className="text-neutral-600">
                  نقوم بتصميم حلول مخصصة وخطة عمل تفصيلية تناسب أهدافك وميزانيتك مع وضع جدول زمني واضح للتنفيذ
                </p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="bg-primary text-white font-bold rounded-full w-10 h-10 flex-shrink-0 flex items-center justify-center">3</div>
              <div>
                <h3 className="font-bold text-xl mb-2">التطوير والاختبار</h3>
                <p className="text-neutral-600">
                  ينفذ فريقنا المشروع باستخدام أحدث التقنيات مع إجراء اختبارات مستمرة لضمان الجودة والأداء الأمثل
                </p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="bg-primary text-white font-bold rounded-full w-10 h-10 flex-shrink-0 flex items-center justify-center">4</div>
              <div>
                <h3 className="font-bold text-xl mb-2">الإطلاق والدعم</h3>
                <p className="text-neutral-600">
                  نقوم بإطلاق المشروع مع تقديم الدعم الفني المستمر والصيانة والتحسينات اللازمة لضمان استمرارية النجاح
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* قسم المزايا */}
        <section className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-6">
                مزايا التعامل معنا
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-primary mt-1 h-5 w-5 flex-shrink-0" />
                  <p className="text-neutral-700">
                    <span className="font-bold">حلول مخصصة</span> - نصمم حلولاً برمجية تناسب احتياجات عملك الخاصة
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-primary mt-1 h-5 w-5 flex-shrink-0" />
                  <p className="text-neutral-700">
                    <span className="font-bold">فريق سعودي</span> - نفتخر بفريقنا من المطورين السعوديين ذوي الكفاءة العالية
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-primary mt-1 h-5 w-5 flex-shrink-0" />
                  <p className="text-neutral-700">
                    <span className="font-bold">دعم فني مستمر</span> - نقدم دعماً فنياً على مدار الساعة لضمان استمرارية عمل أنظمتك
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-primary mt-1 h-5 w-5 flex-shrink-0" />
                  <p className="text-neutral-700">
                    <span className="font-bold">أسعار تنافسية</span> - نقدم خدمات عالية الجودة بأسعار تناسب مختلف الميزانيات
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-primary mt-1 h-5 w-5 flex-shrink-0" />
                  <p className="text-neutral-700">
                    <span className="font-bold">الالتزام بالمواعيد</span> - نحرص على تسليم المشاريع في الوقت المحدد دون تأخير
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-neutral-50 p-6 rounded-xl">
              <h3 className="font-bold text-xl mb-4 text-center">آراء عملائنا</h3>
              
              <div className="space-y-6">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex items-center gap-1 text-amber-500 mb-2">
                    <Star className="fill-amber-500 h-4 w-4" />
                    <Star className="fill-amber-500 h-4 w-4" />
                    <Star className="fill-amber-500 h-4 w-4" />
                    <Star className="fill-amber-500 h-4 w-4" />
                    <Star className="fill-amber-500 h-4 w-4" />
                  </div>
                  <p className="text-neutral-700 mb-3">
                    "تعاملت مع شركة لينكتك لتطوير تطبيق لشركتي، وكانت التجربة ممتازة من حيث الاحترافية وجودة العمل والالتزام بالمواعيد."
                  </p>
                  <p className="font-bold">محمد السعيد</p>
                  <p className="text-sm text-neutral-500">مدير شركة تكنولوجيا</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex items-center gap-1 text-amber-500 mb-2">
                    <Star className="fill-amber-500 h-4 w-4" />
                    <Star className="fill-amber-500 h-4 w-4" />
                    <Star className="fill-amber-500 h-4 w-4" />
                    <Star className="fill-amber-500 h-4 w-4" />
                    <Star className="fill-amber-500 h-4 w-4" />
                  </div>
                  <p className="text-neutral-700 mb-3">
                    "ساعدتنا لينكتك في تطوير متجرنا الإلكتروني بشكل احترافي، وقد ساهم ذلك في زيادة مبيعاتنا بنسبة 40% خلال الأشهر الستة الأولى."
                  </p>
                  <p className="font-bold">سارة الأحمد</p>
                  <p className="text-sm text-neutral-500">صاحبة متجر إلكتروني</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* قسم الدعوة للعمل */}
        <section className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            هل أنت جاهز لتحويل فكرتك إلى واقع؟
          </h2>
          <p className="mb-8 text-white/90 max-w-3xl mx-auto">
            تواصل معنا اليوم لمناقشة مشروعك والحصول على استشارة مجانية. فريقنا جاهز لمساعدتك في تحقيق أهدافك التقنية.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary">
              <Link href="/contact">
                تواصل معنا الآن
              </Link>
            </Button>
            
            <Button asChild size="lg" variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20">
              <Link href="/services">
                استعرض خدماتنا
              </Link>
            </Button>
          </div>
        </section>
        
        {/* الأسئلة الشائعة */}
        <section className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
            الأسئلة الشائعة
          </h2>
          
          <div className="space-y-6">
            <div className="border-b border-neutral-200 pb-4">
              <h3 className="font-bold text-xl mb-2">كم تستغرق عملية تطوير التطبيق أو الموقع؟</h3>
              <p className="text-neutral-600">
                تختلف مدة التطوير حسب تعقيد المشروع ومتطلباته. عادة، تستغرق المشاريع الصغيرة من 4-8 أسابيع، بينما قد تستغرق المشاريع المتوسطة والكبيرة من 2-6 أشهر. نقدم لك جدولاً زمنياً دقيقاً بعد دراسة متطلباتك.
              </p>
            </div>
            
            <div className="border-b border-neutral-200 pb-4">
              <h3 className="font-bold text-xl mb-2">ما هي تكلفة تطوير تطبيق أو موقع إلكتروني؟</h3>
              <p className="text-neutral-600">
                تعتمد التكلفة على حجم المشروع وتعقيده والميزات المطلوبة. نحن نقدم أسعاراً تنافسية تناسب مختلف الميزانيات، ونعمل معك لتحديد الحل الأمثل الذي يحقق أهدافك ضمن ميزانيتك المتاحة.
              </p>
            </div>
            
            <div className="border-b border-neutral-200 pb-4">
              <h3 className="font-bold text-xl mb-2">هل تقدمون خدمات الصيانة والدعم بعد إطلاق المشروع؟</h3>
              <p className="text-neutral-600">
                نعم، نقدم خدمات الصيانة والدعم الفني المستمر لجميع مشاريعنا. لدينا باقات دعم مختلفة تشمل التحديثات الدورية وإصلاح الأخطاء وتحسين الأداء لضمان استمرارية عمل مشروعك بكفاءة.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-xl mb-2">هل يمكنكم تطوير مشروع موجود مسبقاً؟</h3>
              <p className="text-neutral-600">
                نعم، يمكننا العمل على تطوير وتحسين المشاريع الموجودة مسبقاً. نقوم بتقييم المشروع الحالي وتحديد نقاط القوة والضعف، ثم نضع خطة لتطويره وتحسينه بما يتناسب مع احتياجاتك.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <Link href="/faq" className="text-primary hover:text-primary-dark inline-flex items-center">
              عرض جميع الأسئلة الشائعة
              <ArrowLeft className="mr-1 h-4 w-4 rtl-flip" />
            </Link>
          </div>
        </section>
      </div>
    </StaticPageLayout>
  );
};

export default SoftwareCompanySaudiPage;