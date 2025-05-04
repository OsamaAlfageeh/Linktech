import StaticPageLayout from "@/components/seo/StaticPageLayout";
import { OrganizationStructuredData } from "@/components/seo/StructuredData";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Smartphone, Globe, ShoppingCart, LayoutDashboard, Search, Code, Server, HeadphonesIcon } from "lucide-react";

const ServiceCard = ({ 
  title, 
  description, 
  icon: Icon, 
  href 
}: { 
  title: string; 
  description: string; 
  icon: React.ElementType; 
  href: string 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col h-full border border-neutral-100 hover:shadow-md hover:border-primary/20 transition-all duration-300">
      <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
        <Icon className="text-primary h-6 w-6" />
      </div>
      <h3 className="font-bold text-xl mb-3">{title}</h3>
      <p className="text-neutral-600 mb-4 flex-grow">{description}</p>
      <Link 
        href={href} 
        className="inline-flex items-center text-primary hover:text-primary-dark font-medium mt-auto"
      >
        التفاصيل والأسعار
        <ArrowLeft className="mr-1 h-4 w-4 rtl-flip" />
      </Link>
    </div>
  );
};

const ServicesPage = () => {
  return (
    <StaticPageLayout
      title="خدماتنا البرمجية | شركة برمجة في السعودية - لينكتك"
      description="تعرف على خدماتنا البرمجية المتكاملة لتطوير تطبيقات الجوال والمواقع الإلكترونية والمتاجر الإلكترونية والأنظمة المخصصة بأفضل التقنيات وأعلى معايير الجودة."
      keywords="خدمات برمجية, تطوير تطبيقات, برمجة مواقع, متاجر إلكترونية, أنظمة إدارية, تحسين محركات البحث, تطوير برمجيات, استضافة سحابية"
      breadcrumbs={[
        { name: "الرئيسية", url: "/" },
        { name: "خدماتنا", url: "/services" }
      ]}
      structuredData={
        <OrganizationStructuredData
          name="لينكتك"
          url="https://linktech.app"
          logo="https://linktech.app/images/logo.svg"
          description="منصة تربط بين رواد الأعمال وشركات البرمجة لتنفيذ المشاريع التقنية بكفاءة وسهولة"
        />
      }
    >
      <div className="space-y-12">
        {/* قسم الخدمات الرئيسي */}
        <section className="text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            خدماتنا البرمجية الاحترافية
          </h1>
          <p className="text-lg md:text-xl text-neutral-600 mb-10 max-w-3xl mx-auto">
            نقدم مجموعة متكاملة من الخدمات البرمجية التي تساعدك على تحقيق أهدافك التقنية وتطوير أعمالك بأحدث التقنيات
          </p>
        </section>

        {/* قائمة الخدمات */}
        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ServiceCard
            title="تطوير تطبيقات الجوال"
            description="تصميم وتطوير تطبيقات احترافية لأنظمة iOS وAndroid مع واجهات مستخدم سلسة وأداء عالي"
            icon={Smartphone}
            href="/services/mobile-app-development"
          />
          
          <ServiceCard
            title="تطوير المواقع الإلكترونية"
            description="تصميم وبرمجة مواقع إلكترونية عصرية ومتجاوبة مع جميع الأجهزة ومحسنة لمحركات البحث"
            icon={Globe}
            href="/services/website-development"
          />
          
          <ServiceCard
            title="تطوير المتاجر الإلكترونية"
            description="إنشاء متاجر إلكترونية متكاملة مع أنظمة دفع آمنة وإدارة مخزون وتجربة تسوق سلسة"
            icon={ShoppingCart}
            href="/services/ecommerce-development"
          />
          
          <ServiceCard
            title="تطوير الأنظمة الإدارية"
            description="تصميم أنظمة إدارية مخصصة لتحسين سير العمل وزيادة الإنتاجية وإدارة الموارد بكفاءة"
            icon={LayoutDashboard}
            href="/services/management-systems"
          />
          
          <ServiceCard
            title="خدمات تحسين محركات البحث"
            description="تحسين ظهور موقعك في نتائج البحث وزيادة الزيارات العضوية من خلال استراتيجيات SEO متكاملة"
            icon={Search}
            href="/services/seo-services"
          />
          
          <ServiceCard
            title="خدمات برمجية مخصصة"
            description="تطوير حلول برمجية مخصصة تناسب احتياجات عملك الخاصة وتعالج تحديات فريدة"
            icon={Code}
            href="/services/custom-software-development"
          />
          
          <ServiceCard
            title="خدمات الاستضافة السحابية"
            description="استضافة تطبيقاتك ومواقعك على خوادم سحابية آمنة وعالية الأداء مع دعم فني على مدار الساعة"
            icon={Server}
            href="/services/cloud-hosting"
          />
          
          <ServiceCard
            title="خدمات الدعم الفني"
            description="دعم فني متكامل لمشاريعك البرمجية مع باقات صيانة وتحديث دورية لضمان استمرارية العمل"
            icon={HeadphonesIcon}
            href="/services/technical-support"
          />

          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6 flex flex-col justify-center items-center text-center border border-primary/20">
            <h3 className="font-bold text-xl mb-3">لم تجد ما تبحث عنه؟</h3>
            <p className="text-neutral-600 mb-6">
              تواصل معنا للحصول على خدمة مخصصة تناسب احتياجات مشروعك الخاصة
            </p>
            <Button asChild>
              <Link href="/contact">
                تواصل معنا الآن
              </Link>
            </Button>
          </div>
        </section>
        
        {/* قسم المميزات */}
        <section className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
            لماذا تختار خدماتنا؟
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-neutral-50 p-6 rounded-xl">
              <h3 className="font-bold text-xl mb-3 text-primary">خبرة واسعة</h3>
              <p className="text-neutral-600">
                نمتلك خبرة تزيد عن 10 سنوات في مجال تطوير البرمجيات مع مئات المشاريع الناجحة
              </p>
            </div>
            
            <div className="bg-neutral-50 p-6 rounded-xl">
              <h3 className="font-bold text-xl mb-3 text-primary">فريق محترف</h3>
              <p className="text-neutral-600">
                يضم فريقنا نخبة من المطورين والمصممين وخبراء تجربة المستخدم لتقديم أفضل النتائج
              </p>
            </div>
            
            <div className="bg-neutral-50 p-6 rounded-xl">
              <h3 className="font-bold text-xl mb-3 text-primary">تقنيات حديثة</h3>
              <p className="text-neutral-600">
                نستخدم أحدث التقنيات والأدوات البرمجية لتقديم حلول عصرية تواكب التطورات التكنولوجية
              </p>
            </div>
            
            <div className="bg-neutral-50 p-6 rounded-xl">
              <h3 className="font-bold text-xl mb-3 text-primary">جودة عالية</h3>
              <p className="text-neutral-600">
                نلتزم بأعلى معايير الجودة في جميع مشاريعنا مع اختبارات شاملة لضمان الأداء الأمثل
              </p>
            </div>
            
            <div className="bg-neutral-50 p-6 rounded-xl">
              <h3 className="font-bold text-xl mb-3 text-primary">دعم مستمر</h3>
              <p className="text-neutral-600">
                نقدم دعماً فنياً متواصلاً لمشاريعنا مع استجابة سريعة لأي استفسارات أو تحديثات
              </p>
            </div>
            
            <div className="bg-neutral-50 p-6 rounded-xl">
              <h3 className="font-bold text-xl mb-3 text-primary">أسعار تنافسية</h3>
              <p className="text-neutral-600">
                نقدم خدمات عالية الجودة بأسعار تنافسية تناسب مختلف الميزانيات مع خطط دفع مرنة
              </p>
            </div>
          </div>
        </section>
        
        {/* قسم الدعوة للعمل */}
        <section className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            جاهزون لبدء مشروعك التقني؟
          </h2>
          <p className="mb-8 text-white/90 max-w-3xl mx-auto">
            تواصل معنا اليوم لمناقشة متطلبات مشروعك والحصول على استشارة مجانية. فريقنا جاهز لتحويل أفكارك إلى واقع.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary">
              <Link href="/contact">
                تواصل معنا الآن
              </Link>
            </Button>
            
            <Button asChild size="lg" variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20">
              <Link href="/about">
                تعرف علينا أكثر
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </StaticPageLayout>
  );
};

export default ServicesPage;