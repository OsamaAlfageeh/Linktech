import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Users, Target, Shield, Sparkles, Code, Gem } from "lucide-react";

const AboutPage = () => {
  return (
    <>
      <Helmet>
        <title>من نحن | لينكتك</title>
        <meta name="description" content="تعرف على قصة لينكتك ورؤيتنا ورسالتنا في ربط أصحاب المشاريع مع الشركات التقنية في المملكة العربية السعودية" />
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">من نحن</h1>
          <p className="text-neutral-600 text-center mb-12 text-lg">
            نقوم ببناء جسر التواصل بين أصحاب الأفكار والشركات التقنية
          </p>
          
          {/* القصة */}
          <div className="bg-white rounded-xl shadow-md p-6 md:p-8 mb-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-primary/10 p-3 rounded-full">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">قصتنا</h2>
            </div>
            
            <div className="space-y-4 text-neutral-700">
              <p>
                بدأت قصة لينكتك من ملاحظة فجوة كبيرة في سوق التقنية السعودي - حيث يواجه أصحاب الأفكار والمشاريع صعوبة في العثور على شركات تطوير موثوقة تناسب احتياجاتهم، بينما تكافح شركات التطوير للوصول إلى العملاء المناسبين.
              </p>
              <p>
                تأسست منصتنا في عام 2023 على يد مجموعة من المتخصصين في مجال التقنية ممن عانوا شخصياً من هذه التحديات، وقرروا إيجاد حل يمكّن رواد الأعمال من تحويل أفكارهم إلى واقع، ويساعد الشركات التقنية على النمو وتوسيع قاعدة عملائها.
              </p>
              <p>
                اليوم، نفخر بأن لينكتك أصبحت المنصة الرائدة في المملكة العربية السعودية التي تجمع بين أصحاب المشاريع والشركات التقنية من خلال نظام توافق ذكي وآمن.
              </p>
            </div>
          </div>
          
          {/* الرؤية والرسالة */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">رؤيتنا</h2>
              </div>
              
              <p className="text-neutral-700">
                أن نصبح المنصة الأولى في الشرق الأوسط التي تمكّن الابتكار التقني من خلال ربط سلس بين أصحاب الأفكار الإبداعية والشركات التقنية المتخصصة، مما يساهم في تسريع التحول الرقمي وتحقيق رؤية المملكة 2030.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Gem className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">رسالتنا</h2>
              </div>
              
              <p className="text-neutral-700">
                توفير منصة آمنة وفعالة تسهل التعاون بين رواد الأعمال وشركات التطوير التقني، من خلال أدوات متطورة للتواصل والتوفيق الذكي، مما يضمن تحقيق نتائج ناجحة للجميع وتعزيز الاقتصاد الرقمي السعودي.
              </p>
            </div>
          </div>
          
          {/* قيمنا */}
          <div className="bg-white rounded-xl shadow-md p-6 md:p-8 mb-12">
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-primary/10 p-3 rounded-full">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">قيمنا</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold text-lg mb-2 text-primary">الثقة والشفافية</h3>
                <p className="text-neutral-700">
                  نحن نعمل بكل شفافية ونبني الثقة من خلال توفير معلومات دقيقة وصادقة لجميع الأطراف.
                </p>
              </div>
              
              <div>
                <h3 className="font-bold text-lg mb-2 text-primary">التميز والابتكار</h3>
                <p className="text-neutral-700">
                  نسعى دائماً إلى التميز في كل ما نقدمه، ونشجع الابتكار في مختلف مراحل العمل.
                </p>
              </div>
              
              <div>
                <h3 className="font-bold text-lg mb-2 text-primary">سهولة الاستخدام</h3>
                <p className="text-neutral-700">
                  نصمم منصتنا لتكون سهلة الاستخدام ومفهومة للجميع، مما يتيح تجربة مستخدم سلسة.
                </p>
              </div>
              
              <div>
                <h3 className="font-bold text-lg mb-2 text-primary">الأمان والحماية</h3>
                <p className="text-neutral-700">
                  نضع أمان البيانات وحماية خصوصية المستخدمين على رأس أولوياتنا.
                </p>
              </div>
            </div>
          </div>
          
          {/* فريقنا */}
          <div className="bg-white rounded-xl shadow-md p-6 md:p-8 mb-12">
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-primary/10 p-3 rounded-full">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">فريقنا</h2>
            </div>
            
            <p className="text-neutral-700 mb-8">
              يضم فريق لينكتك نخبة من المتخصصين في مجالات تطوير البرمجيات، وتجربة المستخدم، والذكاء الاصطناعي، وريادة الأعمال. نحن نجمع بين الخبرة العميقة والشغف بتمكين الابتكار التقني في المملكة العربية السعودية.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="bg-neutral-100 rounded-full h-24 w-24 mx-auto mb-4"></div>
                <h3 className="font-bold">أحمد الغامدي</h3>
                <p className="text-neutral-600 text-sm">المؤسس والرئيس التنفيذي</p>
              </div>
              
              <div>
                <div className="bg-neutral-100 rounded-full h-24 w-24 mx-auto mb-4"></div>
                <h3 className="font-bold">سارة العتيبي</h3>
                <p className="text-neutral-600 text-sm">مديرة العمليات</p>
              </div>
              
              <div>
                <div className="bg-neutral-100 rounded-full h-24 w-24 mx-auto mb-4"></div>
                <h3 className="font-bold">فهد الشمري</h3>
                <p className="text-neutral-600 text-sm">مدير تقني</p>
              </div>
              
              <div>
                <div className="bg-neutral-100 rounded-full h-24 w-24 mx-auto mb-4"></div>
                <h3 className="font-bold">نورة القحطاني</h3>
                <p className="text-neutral-600 text-sm">مديرة تسويق</p>
              </div>
            </div>
          </div>
          
          {/* التكنولوجيا */}
          <div className="bg-white rounded-xl shadow-md p-6 md:p-8 mb-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-primary/10 p-3 rounded-full">
                <Code className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">التكنولوجيا</h2>
            </div>
            
            <p className="text-neutral-700 mb-8">
              نستخدم أحدث التقنيات لبناء منصة موثوقة وآمنة وسريعة. تعتمد منصتنا على:
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="bg-neutral-50 p-4 rounded-lg text-center">
                <h3 className="font-bold mb-2">خوارزميات توافق ذكية</h3>
                <p className="text-neutral-600 text-sm">لمطابقة المشاريع مع الشركات المناسبة</p>
              </div>
              
              <div className="bg-neutral-50 p-4 rounded-lg text-center">
                <h3 className="font-bold mb-2">تشفير عالي المستوى</h3>
                <p className="text-neutral-600 text-sm">لحماية بيانات المستخدمين والمحادثات</p>
              </div>
              
              <div className="bg-neutral-50 p-4 rounded-lg text-center">
                <h3 className="font-bold mb-2">واجهة سهلة الاستخدام</h3>
                <p className="text-neutral-600 text-sm">مصممة للتجربة السلسة على جميع الأجهزة</p>
              </div>
            </div>
          </div>
          
          {/* دعوة للانضمام */}
          <div className="bg-gradient-to-r from-primary/90 to-primary/70 text-white rounded-xl shadow-md p-6 md:p-8">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">انضم إلينا اليوم</h2>
              <p className="mb-8 text-white/80">
                سواء كنت صاحب مشروع تبحث عن شركة مناسبة، أو شركة تطوير تبحث عن مشاريع جديدة، انضم إلينا اليوم واكتشف كيف يمكن للينكتك مساعدتك في تحقيق أهدافك.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" variant="secondary">
                  <Link href="/auth/register">
                    إنشاء حساب
                  </Link>
                </Button>
                
                <Button asChild size="lg" variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20">
                  <Link href="/contact">
                    تواصل معنا
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

export default AboutPage;