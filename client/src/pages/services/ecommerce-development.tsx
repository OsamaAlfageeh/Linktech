import StaticPageLayout from "@/components/seo/StaticPageLayout";
import ServiceSchema from "@/components/seo/ServiceSchema";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  ShoppingCart,
  CreditCard,
  BarChart3,
  Truck,
  Package,
  Search,
  Shield,
  Globe,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";

const EcommerceDevelopmentPage = () => {
  return (
    <StaticPageLayout
      title="تصميم متجر إلكتروني احترافي | خدمات تطوير المتاجر الإلكترونية - لينكتك"
      description="خدمات تصميم وتطوير متاجر إلكترونية احترافية بأحدث التقنيات. نقدم حلول متكاملة للتجارة الإلكترونية تشمل سلة المشتريات، بوابات الدفع الآمنة، وإدارة المخزون."
      keywords="تصميم متجر إلكتروني, تطوير متاجر إلكترونية, تجارة إلكترونية, إنشاء متجر أونلاين, برمجة متاجر, متاجر ووردبريس, شوبيفاي, ماجنتو, تطوير متجر احترافي"
      breadcrumbs={[
        { name: "الرئيسية", url: "/" },
        { name: "الخدمات", url: "/services" },
        { name: "تصميم متجر إلكتروني", url: "/services/ecommerce-development" }
      ]}
      structuredData={
        <ServiceSchema
          name="خدمات تصميم وتطوير المتاجر الإلكترونية"
          description="تطوير متاجر إلكترونية احترافية متكاملة مع أنظمة دفع آمنة وإدارة مخزون"
          url="https://linktech.app/services/ecommerce-development"
          provider="لينكتك"
          providerUrl="https://linktech.app"
          imageUrl="https://linktech.app/images/ecommerce-development.jpg"
          serviceArea="المملكة العربية السعودية"
        />
      }
    >
      <div className="space-y-12">
        {/* القسم الرئيسي */}
        <section className="text-center mb-16">
          <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-l from-primary to-primary/80">تصميم متجر إلكتروني</span>
            <br />احترافي ومتكامل
          </h1>
          <p className="text-lg md:text-xl text-neutral-600 mb-8 max-w-3xl mx-auto">
            نقدم خدمات تطوير متاجر إلكترونية احترافية بأحدث التقنيات مع أنظمة دفع آمنة وإدارة مخزون وتجربة تسوق سلسة
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
        
        {/* ميزات متاجرنا */}
        <section className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
            المميزات الرئيسية لمتاجرنا الإلكترونية
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-neutral-50 p-6 rounded-xl flex flex-col items-start">
              <div className="bg-primary/10 p-3 rounded-lg flex items-center justify-center mb-4">
                <ShoppingCart className="text-primary h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">سلة مشتريات متطورة</h3>
              <p className="text-neutral-600">
                سلة مشتريات سهلة الاستخدام مع إمكانية إضافة وحذف وتعديل المنتجات بسلاسة
              </p>
            </div>
            
            <div className="bg-neutral-50 p-6 rounded-xl flex flex-col items-start">
              <div className="bg-primary/10 p-3 rounded-lg flex items-center justify-center mb-4">
                <CreditCard className="text-primary h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">بوابات دفع متعددة</h3>
              <p className="text-neutral-600">
                تكامل مع مختلف بوابات الدفع المحلية والعالمية مثل مدى ومدفوعات وفيزا وماستركارد
              </p>
            </div>
            
            <div className="bg-neutral-50 p-6 rounded-xl flex flex-col items-start">
              <div className="bg-primary/10 p-3 rounded-lg flex items-center justify-center mb-4">
                <Package className="text-primary h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">إدارة المخزون</h3>
              <p className="text-neutral-600">
                نظام متكامل لإدارة المخزون والمنتجات بسهولة مع تحديث تلقائي عند البيع
              </p>
            </div>
            
            <div className="bg-neutral-50 p-6 rounded-xl flex flex-col items-start">
              <div className="bg-primary/10 p-3 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="text-primary h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">تقارير وإحصائيات</h3>
              <p className="text-neutral-600">
                لوحة تحكم ذكية مع تقارير تحليلية شاملة لمتابعة المبيعات والأرباح وسلوك المستخدمين
              </p>
            </div>
            
            <div className="bg-neutral-50 p-6 rounded-xl flex flex-col items-start">
              <div className="bg-primary/10 p-3 rounded-lg flex items-center justify-center mb-4">
                <Truck className="text-primary h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">إدارة الشحن والتوصيل</h3>
              <p className="text-neutral-600">
                تكامل مع شركات الشحن المحلية والدولية مع إمكانية تتبع الشحنات مباشرة من المتجر
              </p>
            </div>
            
            <div className="bg-neutral-50 p-6 rounded-xl flex flex-col items-start">
              <div className="bg-primary/10 p-3 rounded-lg flex items-center justify-center mb-4">
                <Search className="text-primary h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">تحسين محركات البحث</h3>
              <p className="text-neutral-600">
                تهيئة المتجر لمحركات البحث لضمان ظهوره في النتائج الأولى وجذب المزيد من العملاء
              </p>
            </div>
          </div>
        </section>
        
        {/* أنواع المتاجر */}
        <section className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center">أنواع المتاجر الإلكترونية</h2>
          <p className="text-center text-neutral-600 mb-8">
            نقدم حلول متاجر إلكترونية متعددة تناسب مختلف القطاعات والاحتياجات
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="border border-neutral-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-xl mb-3 text-primary">متاجر البيع بالتجزئة</h3>
              <p className="text-neutral-600 mb-4">
                متاجر إلكترونية لبيع المنتجات المادية مثل الملابس والإلكترونيات والأثاث وغيرها، مع إدارة مخزون متقدمة.
              </p>
              <Link href="/contact?store=retail" className="text-primary hover:text-primary-dark inline-flex items-center">
                طلب هذا النوع من المتاجر
                <ArrowLeft className="h-4 w-4 mr-1 rtl-flip" />
              </Link>
            </div>
            
            <div className="border border-neutral-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-xl mb-3 text-primary">متاجر المنتجات الرقمية</h3>
              <p className="text-neutral-600 mb-4">
                متاجر لبيع المنتجات الرقمية مثل الكتب الإلكترونية والدورات والبرامج، مع تسليم آلي للمنتجات بعد الشراء.
              </p>
              <Link href="/contact?store=digital" className="text-primary hover:text-primary-dark inline-flex items-center">
                طلب هذا النوع من المتاجر
                <ArrowLeft className="h-4 w-4 mr-1 rtl-flip" />
              </Link>
            </div>
            
            <div className="border border-neutral-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-xl mb-3 text-primary">متاجر الاشتراكات</h3>
              <p className="text-neutral-600 mb-4">
                متاجر تعتمد على نموذج الاشتراكات الشهرية أو السنوية مع إدارة متكاملة للاشتراكات والتجديد التلقائي.
              </p>
              <Link href="/contact?store=subscription" className="text-primary hover:text-primary-dark inline-flex items-center">
                طلب هذا النوع من المتاجر
                <ArrowLeft className="h-4 w-4 mr-1 rtl-flip" />
              </Link>
            </div>
            
            <div className="border border-neutral-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-xl mb-3 text-primary">منصات التجارة الإلكترونية</h3>
              <p className="text-neutral-600 mb-4">
                منصات متكاملة تتيح لعدة بائعين عرض منتجاتهم وبيعها، مثل أمازون وأكسايت، مع نظام عمولات وإدارة بائعين.
              </p>
              <Link href="/contact?store=marketplace" className="text-primary hover:text-primary-dark inline-flex items-center">
                طلب هذا النوع من المتاجر
                <ArrowLeft className="h-4 w-4 mr-1 rtl-flip" />
              </Link>
            </div>
          </div>
        </section>
        
        {/* منصات التطوير */}
        <section className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
            منصات تطوير المتاجر الإلكترونية
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-neutral-200 rounded-xl p-6 hover:shadow-md transition-shadow text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">WP</span>
              </div>
              <h3 className="font-bold text-xl mb-2">ووردبريس / ووكومرس</h3>
              <p className="text-neutral-600 mb-3">
                منصة مفتوحة المصدر تتميز بالمرونة والتخصيص مع آلاف الإضافات المتاحة.
              </p>
              <ul className="text-sm text-neutral-600 space-y-1 mb-4 text-right">
                <li className="flex items-center gap-1">
                  <CheckCircle className="text-primary h-4 w-4 flex-shrink-0" />
                  <span>مناسبة للمتاجر الصغيرة والمتوسطة</span>
                </li>
                <li className="flex items-center gap-1">
                  <CheckCircle className="text-primary h-4 w-4 flex-shrink-0" />
                  <span>سهولة الإدارة والتحديث</span>
                </li>
                <li className="flex items-center gap-1">
                  <CheckCircle className="text-primary h-4 w-4 flex-shrink-0" />
                  <span>تكلفة تطوير منخفضة نسبياً</span>
                </li>
              </ul>
            </div>
            
            <div className="border border-neutral-200 rounded-xl p-6 hover:shadow-md transition-shadow text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-green-600">M</span>
              </div>
              <h3 className="font-bold text-xl mb-2">ماجنتو</h3>
              <p className="text-neutral-600 mb-3">
                منصة قوية للتجارة الإلكترونية مناسبة للشركات الكبيرة والمتاجر ذات الحجم الكبير.
              </p>
              <ul className="text-sm text-neutral-600 space-y-1 mb-4 text-right">
                <li className="flex items-center gap-1">
                  <CheckCircle className="text-primary h-4 w-4 flex-shrink-0" />
                  <span>قدرات متقدمة لإدارة المخزون</span>
                </li>
                <li className="flex items-center gap-1">
                  <CheckCircle className="text-primary h-4 w-4 flex-shrink-0" />
                  <span>مناسبة للمتاجر ذات الضغط العالي</span>
                </li>
                <li className="flex items-center gap-1">
                  <CheckCircle className="text-primary h-4 w-4 flex-shrink-0" />
                  <span>خيارات تخصيص لا محدودة</span>
                </li>
              </ul>
            </div>
            
            <div className="border border-neutral-200 rounded-xl p-6 hover:shadow-md transition-shadow text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-purple-600">CS</span>
              </div>
              <h3 className="font-bold text-xl mb-2">حلول مخصصة</h3>
              <p className="text-neutral-600 mb-3">
                تطوير متجر إلكتروني مخصص من الصفر يلبي جميع احتياجاتك الخاصة.
              </p>
              <ul className="text-sm text-neutral-600 space-y-1 mb-4 text-right">
                <li className="flex items-center gap-1">
                  <CheckCircle className="text-primary h-4 w-4 flex-shrink-0" />
                  <span>تخصيص كامل حسب الاحتياجات</span>
                </li>
                <li className="flex items-center gap-1">
                  <CheckCircle className="text-primary h-4 w-4 flex-shrink-0" />
                  <span>مناسبة للمتطلبات المعقدة</span>
                </li>
                <li className="flex items-center gap-1">
                  <CheckCircle className="text-primary h-4 w-4 flex-shrink-0" />
                  <span>أداء أفضل وتحكم كامل</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <p className="text-neutral-600 mb-4">
              لست متأكداً من المنصة المناسبة لمتجرك؟ تواصل معنا للحصول على استشارة مجانية لاختيار الحل الأنسب لك.
            </p>
            <Button asChild>
              <Link href="/contact">
                تواصل معنا للمساعدة
              </Link>
            </Button>
          </div>
        </section>
        
        {/* ميزاتنا التنافسية */}
        <section className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
            لماذا تختار خدماتنا لتطوير متجرك الإلكتروني؟
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full flex-shrink-0">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-xl mb-2">تصميم متجاوب</h3>
                <p className="text-neutral-600">
                  متاجرنا الإلكترونية متوافقة مع جميع الأجهزة (الجوال، التابلت، الكمبيوتر) لتقديم تجربة تصفح مثالية.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full flex-shrink-0">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-xl mb-2">أمان متقدم</h3>
                <p className="text-neutral-600">
                  نطبق أعلى معايير الأمان في متاجرنا مع شهادات SSL وحماية للبيانات وتأمين لعمليات الدفع.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full flex-shrink-0">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-xl mb-2">محسنة لمحركات البحث</h3>
                <p className="text-neutral-600">
                  نبني متاجرنا بهيكلة SEO مثالية تساعد في ظهور متجرك في نتائج البحث وزيادة المبيعات العضوية.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full flex-shrink-0">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-xl mb-2">تحليلات متقدمة</h3>
                <p className="text-neutral-600">
                  لوحة تحكم ذكية تعرض تحليلات المبيعات وسلوك المستخدمين والمنتجات الأكثر مبيعاً لاتخاذ قرارات أفضل.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* خطوات العمل */}
        <section className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
            خطوات تصميم وتطوير متجرك الإلكتروني
          </h2>
          
          <div className="space-y-8 md:space-y-0 md:grid md:grid-cols-5 md:gap-6">
            <div className="flex md:flex-col items-center justify-start md:text-center">
              <div className="bg-primary text-white font-bold rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 md:mb-4">1</div>
              <div className="mr-4 md:mr-0">
                <h3 className="font-bold text-lg mb-1">تحليل المتطلبات</h3>
                <p className="text-neutral-600 text-sm">تحديد احتياجاتك وأهداف متجرك</p>
              </div>
            </div>
            
            <div className="hidden md:block border-t-2 border-dashed border-neutral-300 self-center"></div>
            
            <div className="flex md:flex-col items-center justify-start md:text-center">
              <div className="bg-primary text-white font-bold rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 md:mb-4">2</div>
              <div className="mr-4 md:mr-0">
                <h3 className="font-bold text-lg mb-1">التصميم</h3>
                <p className="text-neutral-600 text-sm">تصميم واجهة المتجر وتجربة المستخدم</p>
              </div>
            </div>
            
            <div className="hidden md:block border-t-2 border-dashed border-neutral-300 self-center"></div>
            
            <div className="flex md:flex-col items-center justify-start md:text-center">
              <div className="bg-primary text-white font-bold rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 md:mb-4">3</div>
              <div className="mr-4 md:mr-0">
                <h3 className="font-bold text-lg mb-1">التطوير</h3>
                <p className="text-neutral-600 text-sm">برمجة المتجر وتكامل أنظمة الدفع</p>
              </div>
            </div>
            
            <div className="hidden md:block border-t-2 border-dashed border-neutral-300 self-center"></div>
            
            <div className="flex md:flex-col items-center justify-start md:text-center">
              <div className="bg-primary text-white font-bold rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 md:mb-4">4</div>
              <div className="mr-4 md:mr-0">
                <h3 className="font-bold text-lg mb-1">الاختبار</h3>
                <p className="text-neutral-600 text-sm">اختبار شامل للوظائف وتجربة المستخدم</p>
              </div>
            </div>
            
            <div className="hidden md:block border-t-2 border-dashed border-neutral-300 self-center"></div>
            
            <div className="flex md:flex-col items-center justify-start md:text-center">
              <div className="bg-primary text-white font-bold rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 md:mb-4">5</div>
              <div className="mr-4 md:mr-0">
                <h3 className="font-bold text-lg mb-1">الإطلاق والدعم</h3>
                <p className="text-neutral-600 text-sm">إطلاق المتجر والدعم المستمر</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* الباقات والأسعار */}
        <section className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center">باقاتنا وأسعارنا</h2>
          <p className="text-center text-neutral-600 mb-8">
            نقدم باقات متنوعة تناسب مختلف الاحتياجات والميزانيات
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-neutral-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-xl mb-1">الباقة الأساسية</h3>
              <p className="text-neutral-600 text-sm mb-4">للمشاريع الصغيرة والبداية</p>
              <div className="text-3xl font-bold mb-4 text-primary">تبدأ من 6,000 ر.س.</div>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>متجر ووردبريس/ووكومرس أساسي</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>تصميم متجاوب مع الأجهزة</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>بوابة دفع واحدة</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>دعم فني لمدة شهر</span>
                </li>
              </ul>
              
              <Button asChild className="w-full">
                <Link href="/contact?ecommerce=basic">
                  طلب هذه الباقة
                </Link>
              </Button>
            </div>
            
            <div className="border-2 border-primary rounded-xl p-6 shadow-md relative">
              <div className="absolute -top-4 right-4 bg-primary text-white text-sm py-1 px-3 rounded-full">الأكثر شيوعاً</div>
              <h3 className="font-bold text-xl mb-1">الباقة الاحترافية</h3>
              <p className="text-neutral-600 text-sm mb-4">للمتاجر المتوسطة والشركات</p>
              <div className="text-3xl font-bold mb-4 text-primary">تبدأ من 15,000 ر.س.</div>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>متجر ووكومرس أو ماجنتو متقدم</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>تصميم احترافي وحصري</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>تكامل مع عدة بوابات دفع</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>إدارة مخزون متقدمة</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>تحسين محركات البحث</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>دعم فني لمدة 3 أشهر</span>
                </li>
              </ul>
              
              <Button asChild className="w-full">
                <Link href="/contact?ecommerce=professional">
                  طلب هذه الباقة
                </Link>
              </Button>
            </div>
            
            <div className="border border-neutral-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-xl mb-1">الباقة المتقدمة</h3>
              <p className="text-neutral-600 text-sm mb-4">للمشاريع الكبيرة والمنصات</p>
              <div className="text-3xl font-bold mb-4 text-primary">تبدأ من 30,000 ر.س.</div>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>متجر مخصص بالكامل</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>نظام متعدد البائعين</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>جميع بوابات الدفع المحلية والعالمية</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>تكامل API مع الأنظمة الأخرى</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>تقارير وتحليلات متقدمة</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-primary h-5 w-5 flex-shrink-0" />
                  <span>دعم فني لمدة 6 أشهر</span>
                </li>
              </ul>
              
              <Button asChild className="w-full">
                <Link href="/contact?ecommerce=premium">
                  طلب هذه الباقة
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <p className="text-neutral-600 mb-4">
              تبحث عن حل مخصص لمتجرك؟ تواصل معنا للحصول على عرض سعر مخصص يناسب احتياجاتك.
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
            جاهز لبدء متجرك الإلكتروني؟
          </h2>
          <p className="mb-8 text-white/90 max-w-3xl mx-auto">
            تواصل معنا اليوم لمناقشة مشروع متجرك الإلكتروني والحصول على استشارة مجانية. فريقنا جاهز لمساعدتك.
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

export default EcommerceDevelopmentPage;