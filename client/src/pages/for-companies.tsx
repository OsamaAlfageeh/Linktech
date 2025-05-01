import { Helmet } from "react-helmet";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft, BriefcaseIcon, BuildingIcon, GraduationCapIcon, LockIcon, WalletIcon } from "lucide-react";
import { useAuth } from "../App";

export default function ForCompanies() {
  const [_, navigate] = useLocation();
  const auth = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      <Header auth={auth} />
      <Helmet>
        <title>للشركات - منصة تيك لينك</title>
      </Helmet>

      <div className="container mx-auto py-8 px-4 md:px-6">
        <Button
          variant="ghost"
          className="mb-6 flex items-center gap-2"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>العودة للرئيسية</span>
        </Button>

        <div className="mb-12 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            انضم إلى شبكة شركات البرمجة في تيك لينك
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            اكتشف كيف يمكن لمنصتنا أن تساعد شركتك على الوصول لمشاريع جديدة وفرص أعمال حقيقية
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card className="shadow-md hover:shadow-lg transition-shadow border-t-4 border-t-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BuildingIcon className="h-5 w-5 text-primary" />
                <span>كيف تعمل المنصة</span>
              </CardTitle>
              <CardDescription>
                دليل شامل لآلية عمل منصة تيك لينك للشركات
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2 text-primary">١. التسجيل وإنشاء ملف الشركة</h3>
                <p className="text-muted-foreground">
                  سجل في المنصة كشركة وأنشئ ملفك التعريفي مع إضافة كافة التفاصيل والمهارات التقنية للشركة. يبقى ملف شركتك مخفياً عن الزوار والمستخدمين العاديين.
                </p>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2 text-primary">٢. تصفح المشاريع المتاحة</h3>
                <p className="text-muted-foreground">
                  استعرض المشاريع المتاحة واختر ما يناسب خبرات شركتك وقدراتها التقنية. يمكنك استخدام محرك التوصيات الذكي للوصول للمشاريع الأكثر ملاءمة.
                </p>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2 text-primary">٣. تقديم عروض على المشاريع</h3>
                <p className="text-muted-foreground">
                  قدم عرضك المالي والزمني على المشاريع التي تهمك. يظهر عرضك للعميل مع تعمية معلومات شركتك (ستظهر مبهمة).
                </p>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2 text-primary">٤. التواصل والاتفاق النهائي</h3>
                <p className="text-muted-foreground">
                  عند قبول عرضك ودفع العميل للعربون، تُكشف معلومات التواصل لكلا الطرفين لبدء التواصل المباشر والاتفاق النهائي.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-md hover:shadow-lg transition-shadow border-t-4 border-t-purple-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <WalletIcon className="h-5 w-5 text-purple-600" />
                <span>نظام العمولات والمدفوعات</span>
              </CardTitle>
              <CardDescription>
                تفاصيل نظام العمولات والمدفوعات في منصة تيك لينك
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2 text-purple-600">عربون ١٠٪ من قيمة المشروع</h3>
                <p className="text-muted-foreground">
                  عند قبول عرضك، يدفع العميل عربوناً بقيمة ١٠٪ من إجمالي قيمة المشروع. هذا العربون ضمان لجدية العميل ومؤشر على الالتزام بالتعاقد.
                </p>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2 text-purple-600">خصم العربون من قيمة المشروع</h3>
                <p className="text-muted-foreground">
                  يتم خصم قيمة العربون المدفوع من القيمة الإجمالية للمشروع. فمثلاً، إذا كانت قيمة المشروع ١٠٠٠٠ ريال ودفع العميل عربوناً بقيمة ١٠٠٠ ريال، فإن المبلغ المتبقي للدفع هو ٩٠٠٠ ريال.
                </p>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2 text-purple-600">عمولة المنصة</h3>
                <p className="text-muted-foreground">
                  تعتبر قيمة العربون المدفوع هي عمولة المنصة. لا توجد رسوم إضافية على الشركات أو العملاء بعد ذلك. التعاقد والدفعات اللاحقة تتم مباشرة بين الطرفين.
                </p>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2 text-purple-600">سياسة إلغاء المشاريع</h3>
                <p className="text-muted-foreground">
                  في حالة إلغاء المشروع من قبل العميل بعد دفع العربون ولأسباب غير متعلقة بالشركة، تحتفظ المنصة بالعربون. وفي حال إلغاء المشروع من قبل الشركة، يُرد العربون للعميل.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-12">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LockIcon className="h-5 w-5 text-green-600" />
                <span>حماية خصوصية الشركات</span>
              </CardTitle>
              <CardDescription>
                كيف نحمي هوية شركتك وبياناتك في منصة تيك لينك
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-green-600">عدم ظهور الشركات للزوار</h3>
                  <p className="text-muted-foreground">
                    لا يستطيع الزوار أو المستخدمين العاديين رؤية قائمة الشركات المسجلة في المنصة. ملفات الشركات مخفية بالكامل.
                  </p>
                </div>
                
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-green-600">تعمية بيانات الشركة</h3>
                  <p className="text-muted-foreground">
                    عند تقديم عرض على مشروع، تظهر بيانات شركتك مبهمة للعميل (بدون اسم وتفاصيل). تظهر فقط التقييمات وسنوات الخبرة.
                  </p>
                </div>
                
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-green-600">كشف البيانات فقط بعد دفع العربون</h3>
                  <p className="text-muted-foreground">
                    تظهر بيانات التواصل الخاصة بالشركة للعميل فقط بعد موافقته على العرض ودفع العربون، مما يضمن جدية التعامل.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">الأسئلة الشائعة للشركات</h2>
          <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto">
            <AccordionItem value="item-1">
              <AccordionTrigger>كيف تضمن المنصة جدية العملاء؟</AccordionTrigger>
              <AccordionContent>
                تضمن المنصة جدية العملاء من خلال نظام العربون الذي يتطلب من العميل دفع 10% من قيمة المشروع قبل الكشف عن معلومات التواصل. يشير هذا الالتزام المالي إلى جدية العميل واهتمامه بالمضي قدماً في المشروع.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2">
              <AccordionTrigger>هل يمكنني رفض مشروع بعد قبول العرض من قبل العميل؟</AccordionTrigger>
              <AccordionContent>
                نعم، يمكنك رفض المشروع حتى بعد قبول العرض، لكن يجب أن يكون ذلك قبل بدء العمل الفعلي. في هذه الحالة، سيتم رد العربون للعميل، وقد يؤثر ذلك على تقييم شركتك في المنصة.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
              <AccordionTrigger>ما هي آلية الدفع بعد دفع العربون؟</AccordionTrigger>
              <AccordionContent>
                بعد دفع العربون وكشف بيانات التواصل، تتم جميع المعاملات المالية اللاحقة مباشرة بين شركتك والعميل دون تدخل المنصة. يمكنكما الاتفاق على جدول زمني للدفعات وطريقة الدفع المناسبة لكما.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4">
              <AccordionTrigger>هل هناك حد أقصى لعدد العروض التي يمكنني تقديمها؟</AccordionTrigger>
              <AccordionContent>
                لا، يمكنك تقديم عروض على أي عدد من المشاريع المتاحة في المنصة. ومع ذلك، ننصح بالتركيز على المشاريع التي تتناسب مع خبرات شركتك لزيادة فرص قبول عروضك.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-5">
              <AccordionTrigger>كيف يتم تقييم الشركات في المنصة؟</AccordionTrigger>
              <AccordionContent>
                يتم تقييم الشركات بناءً على تقييمات العملاء بعد انتهاء المشاريع. التقييمات تشمل جودة العمل، الالتزام بالمواعيد، والتواصل الفعال. التقييمات الإيجابية تزيد من فرص ظهور عروضك في المشاريع المستقبلية.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <div className="text-center">
          {auth.isAuthenticated ? (
            <Button 
              onClick={() => navigate("/projects")}
              className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white"
              size="lg"
            >
              <BriefcaseIcon className="h-5 w-5 ml-2" />
              تصفح المشاريع المتاحة
            </Button>
          ) : (
            <Button 
              onClick={() => navigate("/auth/register")}
              className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white"
              size="lg"
            >
              <GraduationCapIcon className="h-5 w-5 ml-2" />
              سجل الآن كشركة برمجة
            </Button>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}