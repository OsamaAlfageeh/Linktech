import StaticPageLayout from "@/components/seo/StaticPageLayout";
import ServiceSchema from "@/components/seo/ServiceSchema";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Code,
  Terminal,
  Settings,
  Database,
  Server,
  Cloud,
  ShieldCheck,
  FileCode,
  CheckCircle,
  ArrowLeft,
  BarChart,
  Layers,
} from "lucide-react";

const SoftwareDevelopmentPage = () => {
  return (
    <StaticPageLayout
      title="خدمات تطوير برمجيات احترافية | حلول برمجية متكاملة - لينكتك"
      description="نقدم خدمات تطوير برمجيات احترافية تشمل برمجة التطبيقات، تطوير الأنظمة المخصصة، تكامل الخدمات، وتطوير واجهات API. فريق متخصص من المطورين ذوي الخبرة لتلبية احتياجات عملك."
      keywords="تطوير برمجيات, خدمات برمجية, تطوير أنظمة مخصصة, برمجة تطبيقات, تطوير API, تكامل خدمات, حلول برمجية, شركة برمجة, تطوير نظام, برمجة مخصصة"
      breadcrumbs={[
        { name: "الرئيسية", url: "/" },
        { name: "الخدمات", url: "/services" },
        { name: "خدمات تطوير برمجيات", url: "/services/software-development" }
      ]}
      structuredData={
        <ServiceSchema
          name="خدمات تطوير البرمجيات"
          description="خدمات تطوير برمجيات احترافية تشمل برمجة التطبيقات، تطوير الأنظمة المخصصة، وتكامل الخدمات"
          url="https://linktech.app/services/software-development"
          provider="لينكتك"
          providerUrl="https://linktech.app"
          imageUrl="https://linktech.app/images/software-development.jpg"
          serviceArea="المملكة العربية السعودية"
        />
      }
    >
      <div className="space-y-12">
        {/* القسم الرئيسي */}
        <section className="text-center mb-16">
          <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-l from-primary to-primary/80">خدمات تطوير برمجيات</span>
            <br />احترافية وحلول متكاملة
          </h1>
          <p className="text-lg md:text-xl text-neutral-600 mb-8 max-w-3xl mx-auto">
            نقدم خدمات برمجية متكاملة لتلبية احتياجات عملك، بدءاً من تطوير التطبيقات إلى أنظمة الشركات المعقدة
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
        
        {/* الخدمات البرمجية */}
        <section className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
            خدماتنا البرمجية المتكاملة
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-neutral-50 p-6 rounded-xl flex flex-col items-start h-full">
              <div className="bg-primary/10 p-3 rounded-lg flex items-center justify-center mb-4">
                <Code className="text-primary h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">تطوير التطبيقات</h3>
              <p className="text-neutral-600">
                تطوير تطبيقات احترافية لمختلف المنصات (ويب، جوال، سطح المكتب) بأحدث التقنيات والمعايير.
              </p>
            </div>
            
            <div className="bg-neutral-50 p-6 rounded-xl flex flex-col items-start h-full">
              <div className="bg-primary/10 p-3 rounded-lg flex items-center justify-center mb-4">
                <Settings className="text-primary h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">أنظمة مخصصة</h3>
              <p className="text-neutral-600">
                تطوير أنظمة برمجية مخصصة تناسب احتياجات عملك الفريدة وتساعد في أتمتة العمليات وزيادة الإنتاجية.
              </p>
            </div>
            
            <div className="bg-neutral-50 p-6 rounded-xl flex flex-col items-start h-full">
              <div className="bg-primary/10 p-3 rounded-lg flex items-center justify-center mb-4">
                <Database className="text-primary h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">قواعد البيانات</h3>
              <p className="text-neutral-600">
                تصميم وتطوير وتحسين قواعد البيانات لضمان أداء أمثل وتخزين آمن وفعال للبيانات.
              </p>
            </div>
            
            <div className="bg-neutral-50 p-6 rounded-xl flex flex-col items-start h-full">
              <div className="bg-primary/10 p-3 rounded-lg flex items-center justify-center mb-4">
                <FileCode className="text-primary h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">تطوير واجهات API</h3>
              <p className="text-neutral-600">
                تصميم وتطوير واجهات برمجة التطبيقات (APIs) التي تسمح بالتكامل السلس بين الأنظمة المختلفة.
              </p>
            </div>
            
            <div className="bg-neutral-50 p-6 rounded-xl flex flex-col items-start h-full">
              <div className="bg-primary/10 p-3 rounded-lg flex items-center justify-center mb-4">
                <Server className="text-primary h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">تطوير البنية التحتية</h3>
              <p className="text-neutral-600">
                تصميم وتنفيذ حلول البنية التحتية التقنية لضمان توفر الخدمات وقابلية التوسع والأداء العالي.
              </p>
            </div>
            
            <div className="bg-neutral-50 p-6 rounded-xl flex flex-col items-start h-full">
              <div className="bg-primary/10 p-3 rounded-lg flex items-center justify-center mb-4">
                <Cloud className="text-primary h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">حلول سحابية</h3>
              <p className="text-neutral-600">
                تطوير وترحيل التطبيقات للعمل على منصات الحوسبة السحابية مثل AWS وAzure وGoogle Cloud.
              </p>
            </div>
          </div>
        </section>
        
        {/* التكنولوجيا التي نستخدمها */}
        <section className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center">التقنيات التي نستخدمها</h2>
          <p className="text-center text-neutral-600 mb-8">
            نستخدم أحدث التقنيات والأدوات البرمجية لتقديم حلول متطورة وقابلة للتوسع
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="text-center">
              <div className="bg-neutral-50 h-16 w-16 mx-auto mb-2 rounded-full flex items-center justify-center">
                <Terminal className="h-8 w-8 text-black" />
              </div>
              <h3 className="font-bold">Frontend</h3>
              <p className="text-sm text-neutral-600">React.js, Angular, Vue.js</p>
            </div>
            
            <div className="text-center">
              <div className="bg-neutral-50 h-16 w-16 mx-auto mb-2 rounded-full flex items-center justify-center">
                <Server className="h-8 w-8 text-black" />
              </div>
              <h3 className="font-bold">Backend</h3>
              <p className="text-sm text-neutral-600">Node.js, Django, Laravel</p>
            </div>
            
            <div className="text-center">
              <div className="bg-neutral-50 h-16 w-16 mx-auto mb-2 rounded-full flex items-center justify-center">
                <Layers className="h-8 w-8 text-black" />
              </div>
              <h3 className="font-bold">Mobile</h3>
              <p className="text-sm text-neutral-600">React Native, Flutter, Swift</p>
            </div>
            
            <div className="text-center">
              <div className="bg-neutral-50 h-16 w-16 mx-auto mb-2 rounded-full flex items-center justify-center">
                <Database className="h-8 w-8 text-black" />
              </div>
              <h3 className="font-bold">Database</h3>
              <p className="text-sm text-neutral-600">PostgreSQL, MongoDB, MySQL</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="bg-neutral-50 h-16 w-16 mx-auto mb-2 rounded-full flex items-center justify-center">
                <Cloud className="h-8 w-8 text-black" />
              </div>
              <h3 className="font-bold">Cloud</h3>
              <p className="text-sm text-neutral-600">AWS, Azure, Google Cloud</p>
            </div>
            
            <div className="text-center">
              <div className="bg-neutral-50 h-16 w-16 mx-auto mb-2 rounded-full flex items-center justify-center">
                <Code className="h-8 w-8 text-black" />
              </div>
              <h3 className="font-bold">DevOps</h3>
              <p className="text-sm text-neutral-600">Docker, Kubernetes, CI/CD</p>
            </div>
            
            <div className="text-center">
              <div className="bg-neutral-50 h-16 w-16 mx-auto mb-2 rounded-full flex items-center justify-center">
                <BarChart className="h-8 w-8 text-black" />
              </div>
              <h3 className="font-bold">Analytics</h3>
              <p className="text-sm text-neutral-600">Elasticsearch, Kibana, Grafana</p>
            </div>
            
            <div className="text-center">
              <div className="bg-neutral-50 h-16 w-16 mx-auto mb-2 rounded-full flex items-center justify-center">
                <ShieldCheck className="h-8 w-8 text-black" />
              </div>
              <h3 className="font-bold">Security</h3>
              <p className="text-sm text-neutral-600">OAuth, JWT, HTTPS/SSL</p>
            </div>
          </div>
        </section>
        
        {/* منهجية العمل */}
        <section className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
            منهجيتنا في تطوير البرمجيات
          </h2>
          
          <div className="space-y-8 md:space-y-0 md:grid md:grid-cols-4 md:gap-6">
            <div className="flex md:flex-col items-center justify-start md:text-center">
              <div className="bg-primary text-white font-bold rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 md:mb-4">1</div>
              <div className="mr-4 md:mr-0">
                <h3 className="font-bold text-lg mb-1">تحليل وتخطيط</h3>
                <p className="text-neutral-600 text-sm">فهم متطلباتك وتحديد الحلول المناسبة</p>
              </div>
            </div>
            
            <div className="hidden md:block border-t-2 border-dashed border-neutral-300 self-center"></div>
            
            <div className="flex md:flex-col items-center justify-start md:text-center">
              <div className="bg-primary text-white font-bold rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 md:mb-4">2</div>
              <div className="mr-4 md:mr-0">
                <h3 className="font-bold text-lg mb-1">تصميم وتطوير</h3>
                <p className="text-neutral-600 text-sm">تصميم وتطوير الحلول البرمجية</p>
              </div>
            </div>
            
            <div className="hidden md:block border-t-2 border-dashed border-neutral-300 self-center"></div>
            
            <div className="flex md:flex-col items-center justify-start md:text-center">
              <div className="bg-primary text-white font-bold rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 md:mb-4">3</div>
              <div className="mr-4 md:mr-0">
                <h3 className="font-bold text-lg mb-1">اختبار وضمان الجودة</h3>
                <p className="text-neutral-600 text-sm">اختبارات شاملة لضمان جودة المنتج</p>
              </div>
            </div>
            
            <div className="hidden md:block border-t-2 border-dashed border-neutral-300 self-center"></div>
            
            <div className="flex md:flex-col items-center justify-start md:text-center">
              <div className="bg-primary text-white font-bold rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 md:mb-4">4</div>
              <div className="mr-4 md:mr-0">
                <h3 className="font-bold text-lg mb-1">النشر والدعم</h3>
                <p className="text-neutral-600 text-sm">نشر الحلول وتقديم الدعم المستمر</p>
              </div>
            </div>
          </div>
          
          <div className="mt-12">
            <h3 className="font-bold text-xl mb-4 text-center">نموذج التطوير الذي نتبعه</h3>
            <p className="text-neutral-600 text-center mb-6">
              نعتمد نموذج Agile في تطوير البرمجيات مما يسمح لنا بالمرونة والتكيف مع المتطلبات المتغيرة وتقديم قيمة مستمرة
            </p>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-neutral-50 p-4 rounded-lg">
                <h4 className="font-bold text-center mb-2">سرعة التطوير</h4>
                <p className="text-sm text-neutral-600 text-center">
                  تسليم أجزاء من المشروع بشكل دوري ومتكرر (Sprints) مما يتيح رؤية نتائج سريعة
                </p>
              </div>
              
              <div className="bg-neutral-50 p-4 rounded-lg">
                <h4 className="font-bold text-center mb-2">المرونة والتكيف</h4>
                <p className="text-sm text-neutral-600 text-center">
                  القدرة على التكيف مع المتطلبات المتغيرة وتعديل الخطط بناء على التغذية الراجعة
                </p>
              </div>
              
              <div className="bg-neutral-50 p-4 rounded-lg">
                <h4 className="font-bold text-center mb-2">مشاركة العميل</h4>
                <p className="text-sm text-neutral-600 text-center">
                  إشراك العميل في جميع مراحل التطوير لضمان تلبية التوقعات وتحقيق النتائج المرجوة
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* المزايا */}
        <section className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
            لماذا تختار خدماتنا في تطوير البرمجيات؟
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-xl mb-2">خبرة واسعة</h3>
                <p className="text-neutral-600">
                  فريق من المطورين ذوي الخبرة في مختلف التقنيات والصناعات، مما يضمن تقديم حلول مناسبة لاحتياجاتك.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-xl mb-2">حلول مخصصة</h3>
                <p className="text-neutral-600">
                  نطور حلولاً مخصصة تماماً لاحتياجات عملك الفريدة بدلاً من الاعتماد على الحلول الجاهزة غير المرنة.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-xl mb-2">جودة عالية</h3>
                <p className="text-neutral-600">
                  نلتزم بأعلى معايير الجودة في جميع مراحل التطوير مع اختبارات شاملة لضمان منتج نهائي خالٍ من الأخطاء.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-xl mb-2">التزام بالمواعيد</h3>
                <p className="text-neutral-600">
                  نحرص على تسليم المشاريع في الوقت المحدد مع الحفاظ على الجودة والمتطلبات المتفق عليها.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-xl mb-2">دعم فني متميز</h3>
                <p className="text-neutral-600">
                  نقدم دعماً فنياً متميزاً بعد إطلاق المشروع لضمان استمرارية عمل الأنظمة بكفاءة وحل أي مشكلات.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-xl mb-2">قابلية التوسع</h3>
                <p className="text-neutral-600">
                  نصمم حلولنا بطريقة تسمح بالتوسع المستقبلي ومواكبة نمو أعمالك دون الحاجة لإعادة بناء الأنظمة.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* الباقات والأسعار */}
        <section className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center">نماذج التعاقد والأسعار</h2>
          <p className="text-center text-neutral-600 mb-8">
            نقدم نماذج تعاقد مرنة تناسب احتياجات مختلف المشاريع والميزانيات
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-neutral-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-xl mb-1">المشروع الكامل</h3>
              <p className="text-neutral-600 text-sm mb-4">تطوير مشروع كامل بنطاق وميزانية محددين</p>
              <div className="mb-4">
                <span className="text-primary font-bold">الميزات:</span>
                <ul className="mt-2 space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="text-primary h-4 w-4 flex-shrink-0" />
                    <span className="text-neutral-600 text-sm">تكلفة ثابتة ومحددة مسبقاً</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="text-primary h-4 w-4 flex-shrink-0" />
                    <span className="text-neutral-600 text-sm">نطاق عمل واضح ومحدد</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="text-primary h-4 w-4 flex-shrink-0" />
                    <span className="text-neutral-600 text-sm">جدول زمني محدد للتسليم</span>
                  </li>
                </ul>
              </div>
              <div className="text-center bg-neutral-50 p-3 rounded-lg mb-4">
                <span className="block text-sm text-neutral-600">يبدأ من</span>
                <span className="text-2xl font-bold text-primary">20,000 ر.س.</span>
              </div>
              <Button asChild className="w-full">
                <Link href="/contact?model=fixed">
                  طلب عرض سعر
                </Link>
              </Button>
            </div>
            
            <div className="border-2 border-primary rounded-xl p-6 shadow-md relative">
              <div className="absolute -top-4 right-4 bg-primary text-white text-sm py-1 px-3 rounded-full">الأكثر شيوعاً</div>
              <h3 className="font-bold text-xl mb-1">نموذج الساعات</h3>
              <p className="text-neutral-600 text-sm mb-4">الدفع بناءً على ساعات العمل الفعلية</p>
              <div className="mb-4">
                <span className="text-primary font-bold">الميزات:</span>
                <ul className="mt-2 space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="text-primary h-4 w-4 flex-shrink-0" />
                    <span className="text-neutral-600 text-sm">مرونة في تغيير النطاق والمتطلبات</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="text-primary h-4 w-4 flex-shrink-0" />
                    <span className="text-neutral-600 text-sm">تحكم أكبر في المشروع</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="text-primary h-4 w-4 flex-shrink-0" />
                    <span className="text-neutral-600 text-sm">تقارير دورية عن التقدم والساعات</span>
                  </li>
                </ul>
              </div>
              <div className="text-center bg-neutral-50 p-3 rounded-lg mb-4">
                <span className="block text-sm text-neutral-600">سعر الساعة</span>
                <span className="text-2xl font-bold text-primary">250 - 350 ر.س.</span>
              </div>
              <Button asChild className="w-full">
                <Link href="/contact?model=hourly">
                  طلب عرض سعر
                </Link>
              </Button>
            </div>
            
            <div className="border border-neutral-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-xl mb-1">الفريق المخصص</h3>
              <p className="text-neutral-600 text-sm mb-4">فريق متكامل لمشاريع طويلة الأمد</p>
              <div className="mb-4">
                <span className="text-primary font-bold">الميزات:</span>
                <ul className="mt-2 space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="text-primary h-4 w-4 flex-shrink-0" />
                    <span className="text-neutral-600 text-sm">فريق متكامل من المتخصصين</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="text-primary h-4 w-4 flex-shrink-0" />
                    <span className="text-neutral-600 text-sm">مناسب للمشاريع طويلة الأمد</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="text-primary h-4 w-4 flex-shrink-0" />
                    <span className="text-neutral-600 text-sm">تكلفة شهرية ثابتة</span>
                  </li>
                </ul>
              </div>
              <div className="text-center bg-neutral-50 p-3 rounded-lg mb-4">
                <span className="block text-sm text-neutral-600">شهرياً (للفريق)</span>
                <span className="text-2xl font-bold text-primary">بدءاً من 30,000 ر.س.</span>
              </div>
              <Button asChild className="w-full">
                <Link href="/contact?model=dedicated">
                  طلب عرض سعر
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <p className="text-neutral-600 mb-4">
              هل تحتاج إلى نموذج تعاقد مخصص؟ تواصل معنا لمناقشة احتياجاتك وتصميم نموذج يناسبك.
            </p>
            <Link href="/contact" className="text-primary hover:text-primary-dark inline-flex items-center font-medium">
              تواصل معنا للحصول على نموذج مخصص
              <ArrowLeft className="mr-1 h-4 w-4 rtl-flip" />
            </Link>
          </div>
        </section>
        
        {/* قسم الدعوة للعمل */}
        <section className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            جاهز لبدء مشروعك البرمجي؟
          </h2>
          <p className="mb-8 text-white/90 max-w-3xl mx-auto">
            تواصل معنا اليوم لمناقشة احتياجاتك البرمجية والحصول على استشارة مجانية. فريقنا جاهز لتحويل أفكارك إلى واقع.
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

export default SoftwareDevelopmentPage;