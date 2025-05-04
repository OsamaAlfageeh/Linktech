import StaticPageLayout from "@/components/seo/StaticPageLayout";
import ServiceSchema from "@/components/seo/ServiceSchema";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Smartphone,
  Monitor,
  Layers,
  BarChart,
  Shield,
  Code,
  Settings,
  Clock,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";

const CustomAppDevelopmentPage = () => {
  return (
    <StaticPageLayout
      title="برمجة تطبيقات حسب الطلب | خدمات التطوير المخصصة - لينكتك"
      description="خدمات برمجة تطبيقات مخصصة حسب الطلب لجميع المنصات. نقوم بتطوير تطبيقات جوال وويب وسطح مكتب احترافية تلبي احتياجات عملك الفريدة بأحدث التقنيات."
      keywords="برمجة تطبيقات, تطوير تطبيقات حسب الطلب, تطبيقات مخصصة, برمجة تطبيقات الجوال, تطبيقات iOS, تطبيقات أندرويد, تطوير برمجيات, تطبيقات ويب"
      breadcrumbs={[
        { name: "الرئيسية", url: "/" },
        { name: "الخدمات", url: "/services" },
        { name: "برمجة تطبيقات حسب الطلب", url: "/services/custom-app-development" }
      ]}
      structuredData={
        <ServiceSchema
          name="برمجة تطبيقات حسب الطلب"
          description="خدمات برمجة تطبيقات مخصصة لجميع المنصات بأحدث التقنيات والمعايير العالمية"
          url="https://linktech.app/services/custom-app-development"
          provider="لينكتك"
          providerUrl="https://linktech.app"
          imageUrl="https://linktech.app/images/custom-app-development.jpg"
          serviceArea="المملكة العربية السعودية"
        />
      }
    >
      <div className="space-y-12">
        {/* القسم الرئيسي */}
        <section className="text-center mb-16">
          <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-l from-primary to-primary/80">برمجة تطبيقات</span>
            <br />حسب الطلب لجميع المنصات
          </h1>
          <p className="text-lg md:text-xl text-neutral-600 mb-8 max-w-3xl mx-auto">
            نقدم خدمات تطوير تطبيقات مخصصة تماماً لاحتياجات عملك، تجمع بين التصميم المميز والوظائف المتقدمة والأداء العالي
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/contact">
                احصل على عرض سعر
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/services">
                استعرض خدماتنا
              </Link>
            </Button>
          </div>
        </section>
        
        {/* أنواع التطبيقات */}
        <section className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
            أنواع التطبيقات التي نطورها
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-neutral-50 p-6 rounded-xl flex flex-col items-start">
              <div className="bg-primary/10 p-3 rounded-lg flex items-center justify-center mb-4">
                <Smartphone className="text-primary h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">تطبيقات الجوال</h3>
              <p className="text-neutral-600">
                تطبيقات iOS وأندرويد بتصميم عصري وأداء عالي تناسب مختلف الاحتياجات
              </p>
            </div>
            
            <div className="bg-neutral-50 p-6 rounded-xl flex flex-col items-start">
              <div className="bg-primary/10 p-3 rounded-lg flex items-center justify-center mb-4">
                <Monitor className="text-primary h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">تطبيقات الويب</h3>
              <p className="text-neutral-600">
                تطبيقات ويب تفاعلية تعمل على مختلف المتصفحات مع تجربة مستخدم سلسة
              </p>
            </div>
            
            <div className="bg-neutral-50 p-6 rounded-xl flex flex-col items-start">
              <div className="bg-primary/10 p-3 rounded-lg flex items-center justify-center mb-4">
                <Settings className="text-primary h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">تطبيقات سطح المكتب</h3>
              <p className="text-neutral-600">
                تطبيقات سطح مكتب فعالة لأنظمة Windows وMac وLinux لاحتياجات الأعمال
              </p>
            </div>
            
            <div className="bg-neutral-50 p-6 rounded-xl flex flex-col items-start">
              <div className="bg-primary/10 p-3 rounded-lg flex items-center justify-center mb-4">
                <Layers className="text-primary h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">تطبيقات هجينة</h3>
              <p className="text-neutral-600">
                تطبيقات تعمل على منصات متعددة بكود واحد مما يوفر الوقت والتكلفة
              </p>
            </div>
            
            <div className="bg-neutral-50 p-6 rounded-xl flex flex-col items-start">
              <div className="bg-primary/10 p-3 rounded-lg flex items-center justify-center mb-4">
                <BarChart className="text-primary h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">تطبيقات لوحات التحكم</h3>
              <p className="text-neutral-600">
                أنظمة إدارة متكاملة مع لوحات تحكم ذكية وتقارير تحليلية متقدمة
              </p>
            </div>
            
            <div className="bg-neutral-50 p-6 rounded-xl flex flex-col items-start">
              <div className="bg-primary/10 p-3 rounded-lg flex items-center justify-center mb-4">
                <Shield className="text-primary h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">تطبيقات خاصة</h3>
              <p className="text-neutral-600">
                تطبيقات مخصصة للاستخدام الداخلي للشركات والمؤسسات بمعايير أمان عالية
              </p>
            </div>
          </div>
        </section>
        
        {/* مراحل التطوير */}
        <section className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
            مراحل تطوير التطبيقات المخصصة
          </h2>
          
          <div className="space-y-8 md:space-y-0 md:grid md:grid-cols-5 md:gap-6">
            <div className="flex md:flex-col items-center justify-start md:text-center">
              <div className="bg-primary text-white font-bold rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 md:mb-4">1</div>
              <div className="mr-4 md:mr-0">
                <h3 className="font-bold text-lg mb-1">تحليل المتطلبات</h3>
                <p className="text-neutral-600 text-sm">فهم أهدافك واحتياجاتك بدقة</p>
              </div>
            </div>
            
            <div className="hidden md:block border-t-2 border-dashed border-neutral-300 self-center"></div>
            
            <div className="flex md:flex-col items-center justify-start md:text-center">
              <div className="bg-primary text-white font-bold rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 md:mb-4">2</div>
              <div className="mr-4 md:mr-0">
                <h3 className="font-bold text-lg mb-1">التصميم والتخطيط</h3>
                <p className="text-neutral-600 text-sm">تصميم واجهات المستخدم وبنية التطبيق</p>
              </div>
            </div>
            
            <div className="hidden md:block border-t-2 border-dashed border-neutral-300 self-center"></div>
            
            <div className="flex md:flex-col items-center justify-start md:text-center">
              <div className="bg-primary text-white font-bold rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 md:mb-4">3</div>
              <div className="mr-4 md:mr-0">
                <h3 className="font-bold text-lg mb-1">التطوير</h3>
                <p className="text-neutral-600 text-sm">تطوير التطبيق وبناء الوظائف</p>
              </div>
            </div>
            
            <div className="hidden md:block border-t-2 border-dashed border-neutral-300 self-center"></div>
            
            <div className="flex md:flex-col items-center justify-start md:text-center">
              <div className="bg-primary text-white font-bold rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 md:mb-4">4</div>
              <div className="mr-4 md:mr-0">
                <h3 className="font-bold text-lg mb-1">الاختبار والضبط</h3>
                <p className="text-neutral-600 text-sm">اختبار شامل وتحسين الأداء</p>
              </div>
            </div>
            
            <div className="hidden md:block border-t-2 border-dashed border-neutral-300 self-center"></div>
            
            <div className="flex md:flex-col items-center justify-start md:text-center">
              <div className="bg-primary text-white font-bold rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 md:mb-4">5</div>
              <div className="mr-4 md:mr-0">
                <h3 className="font-bold text-lg mb-1">الإطلاق والدعم</h3>
                <p className="text-neutral-600 text-sm">نشر التطبيق والدعم المستمر</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* التقنيات */}
        <section className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center">التقنيات التي نستخدمها</h2>
          <p className="text-center text-neutral-600 mb-8">
            نعتمد على أحدث التقنيات والأطر البرمجية لتطوير تطبيقات قوية وقابلة للتطوير
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border border-neutral-200 rounded-lg p-4 text-center hover:border-primary/50 hover:shadow-sm transition-all">
              <h3 className="font-bold">React Native</h3>
              <p className="text-sm text-neutral-600">تطبيقات الجوال</p>
            </div>
            
            <div className="border border-neutral-200 rounded-lg p-4 text-center hover:border-primary/50 hover:shadow-sm transition-all">
              <h3 className="font-bold">Flutter</h3>
              <p className="text-sm text-neutral-600">تطبيقات الجوال</p>
            </div>
            
            <div className="border border-neutral-200 rounded-lg p-4 text-center hover:border-primary/50 hover:shadow-sm transition-all">
              <h3 className="font-bold">React.js</h3>
              <p className="text-sm text-neutral-600">تطبيقات الويب</p>
            </div>
            
            <div className="border border-neutral-200 rounded-lg p-4 text-center hover:border-primary/50 hover:shadow-sm transition-all">
              <h3 className="font-bold">Angular</h3>
              <p className="text-sm text-neutral-600">تطبيقات الويب</p>
            </div>
            
            <div className="border border-neutral-200 rounded-lg p-4 text-center hover:border-primary/50 hover:shadow-sm transition-all">
              <h3 className="font-bold">Node.js</h3>
              <p className="text-sm text-neutral-600">خلفية التطبيقات</p>
            </div>
            
            <div className="border border-neutral-200 rounded-lg p-4 text-center hover:border-primary/50 hover:shadow-sm transition-all">
              <h3 className="font-bold">Django</h3>
              <p className="text-sm text-neutral-600">خلفية التطبيقات</p>
            </div>
            
            <div className="border border-neutral-200 rounded-lg p-4 text-center hover:border-primary/50 hover:shadow-sm transition-all">
              <h3 className="font-bold">Electron</h3>
              <p className="text-sm text-neutral-600">تطبيقات سطح المكتب</p>
            </div>
            
            <div className="border border-neutral-200 rounded-lg p-4 text-center hover:border-primary/50 hover:shadow-sm transition-all">
              <h3 className="font-bold">Firebase</h3>
              <p className="text-sm text-neutral-600">خدمات سحابية</p>
            </div>
          </div>
        </section>
        
        {/* مزايا خدماتنا */}
        <section className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
            لماذا تختار خدماتنا في برمجة التطبيقات؟
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full flex-shrink-0">
                <Code className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-xl mb-2">حلول مخصصة بالكامل</h3>
                <p className="text-neutral-600">
                  نقوم بتطوير تطبيقات مصممة خصيصاً لتلبية احتياجاتك المحددة، وليست قوالب جاهزة أو حلول عامة.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full flex-shrink-0">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-xl mb-2">أمان وحماية متقدمة</h3>
                <p className="text-neutral-600">
                  نطبق أعلى معايير الأمان في تطبيقاتنا لحماية بياناتك ومعلومات مستخدميك من أي اختراقات.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full flex-shrink-0">
                <BarChart className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-xl mb-2">تقارير ولوحات تحكم</h3>
                <p className="text-neutral-600">
                  ندمج تحليلات وتقارير متقدمة في تطبيقاتنا تمكنك من متابعة الأداء واتخاذ قرارات مدروسة.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full flex-shrink-0">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-xl mb-2">التسليم في الموعد</h3>
                <p className="text-neutral-600">
                  نلتزم بالجداول الزمنية المتفق عليها مع العميل ونضمن تسليم المشروع في الوقت المحدد.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full flex-shrink-0">
                <Smartphone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-xl mb-2">تصميم سريع الاستجابة</h3>
                <p className="text-neutral-600">
                  نصمم تطبيقات متوافقة مع جميع أحجام الشاشات والأجهزة لتقديم تجربة مستخدم مثالية للجميع.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-xl mb-2">اختبار شامل</h3>
                <p className="text-neutral-600">
                  نجري اختبارات دقيقة وشاملة للتطبيق قبل إطلاقه لضمان خلوه من الأخطاء وعمله بكفاءة.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* الباقات والأسعار */}
        <section className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center">باقاتنا وأسعارنا</h2>
          <p className="text-center text-neutral-600 mb-8">
            نقدم باقات متنوعة تناسب مختلف الاحتياجات والميزانيات مع خطط دفع مرنة
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-neutral-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-xl mb-1">الباقة الأساسية</h3>
              <p className="text-neutral-600 text-sm mb-4">للشركات الناشئة والمشاريع الصغيرة</p>
              <div className="text-3xl font-bold mb-4 text-primary">تبدأ من 15,000 ر.س.</div>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>تطبيق أساسي بوظائف محددة</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>تصميم متجاوب مع جميع الأجهزة</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>منصة واحدة (iOS أو Android)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>دعم فني لمدة 3 أشهر</span>
                </li>
              </ul>
              
              <Button asChild className="w-full">
                <Link href="/contact?package=basic">
                  طلب هذه الباقة
                </Link>
              </Button>
            </div>
            
            <div className="border-2 border-primary rounded-xl p-6 shadow-md relative">
              <div className="absolute -top-4 right-4 bg-primary text-white text-sm py-1 px-3 rounded-full">الأكثر شيوعاً</div>
              <h3 className="font-bold text-xl mb-1">الباقة الاحترافية</h3>
              <p className="text-neutral-600 text-sm mb-4">للشركات المتوسطة والمشاريع المتقدمة</p>
              <div className="text-3xl font-bold mb-4 text-primary">تبدأ من 30,000 ر.س.</div>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>تطبيق متكامل بوظائف متقدمة</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>تصميم احترافي وتجربة مستخدم مميزة</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>منصتين (iOS وAndroid)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>لوحة تحكم وتقارير تحليلية</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>دعم فني لمدة 6 أشهر</span>
                </li>
              </ul>
              
              <Button asChild className="w-full">
                <Link href="/contact?package=pro">
                  طلب هذه الباقة
                </Link>
              </Button>
            </div>
            
            <div className="border border-neutral-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-xl mb-1">الباقة المتقدمة</h3>
              <p className="text-neutral-600 text-sm mb-4">للشركات الكبيرة والمشاريع المعقدة</p>
              <div className="text-3xl font-bold mb-4 text-primary">تبدأ من 50,000 ر.س.</div>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>تطبيق متكامل بوظائف مخصصة</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>تصميم فريد وحصري</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>جميع المنصات (iOS وAndroid وويب)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>لوحة تحكم متقدمة وتكامل API</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>دعم فني لمدة 12 شهر</span>
                </li>
              </ul>
              
              <Button asChild className="w-full">
                <Link href="/contact?package=premium">
                  طلب هذه الباقة
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <p className="text-neutral-600 mb-4">
              هل تبحث عن حل مخصص؟ تواصل معنا للحصول على عرض سعر مفصل يناسب احتياجاتك الخاصة.
            </p>
            <Link href="/contact" className="text-primary hover:text-primary-dark inline-flex items-center font-medium">
              تواصل معنا للحصول على عرض سعر مخصص
              <ArrowLeft className="mr-1 h-4 w-4 rtl-flip" />
            </Link>
          </div>
        </section>
        
        {/* قسم الدعوة للعمل */}
        <section className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            هل أنت جاهز لبدء مشروع تطبيقك؟
          </h2>
          <p className="mb-8 text-white/90 max-w-3xl mx-auto">
            تواصل معنا اليوم لمناقشة فكرتك والحصول على استشارة مجانية. فريقنا جاهز لتحويل رؤيتك إلى تطبيق ناجح.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary">
              <Link href="/contact">
                تواصل معنا الآن
              </Link>
            </Button>
            
            <Button asChild size="lg" variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20">
              <Link href="/portfolio">
                مشاريعنا السابقة
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </StaticPageLayout>
  );
};

export default CustomAppDevelopmentPage;