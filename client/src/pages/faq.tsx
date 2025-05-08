import { useState } from "react";
import { Link } from "wouter";
import { ChevronDown, ChevronUp, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SEO from "@/components/seo/SEO";
import { WebpageStructuredData, BreadcrumbStructuredData, FAQStructuredData } from "@/components/seo/StructuredData";

// تعريف نوع البيانات للأسئلة الشائعة
type FAQCategory = {
  id: string;
  title: string;
  questions: {
    id: string;
    question: string;
    answer: string;
  }[];
};

// مكون السؤال الفردي مع إمكانية التوسعة
const FAQItem = ({ 
  question, 
  answer, 
  isOpen, 
  toggleOpen 
}: { 
  question: string; 
  answer: string; 
  isOpen: boolean; 
  toggleOpen: () => void 
}) => {
  return (
    <div className="border-b border-neutral-200 last:border-0">
      <button
        onClick={toggleOpen}
        className="flex items-center justify-between w-full py-4 text-right text-lg font-medium hover:text-primary"
      >
        <span>{question}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 flex-shrink-0" />
        )}
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-96 mb-4" : "max-h-0"
        }`}
      >
        <div className="text-neutral-600 text-base" dangerouslySetInnerHTML={{ __html: answer }} />
      </div>
    </div>
  );
};

const FAQPage = () => {
  // بيانات الأسئلة الشائعة مجمعة حسب الفئات
  const faqData: FAQCategory[] = [
    {
      id: "general",
      title: "أسئلة عامة",
      questions: [
        {
          id: "what-is-linktech",
          question: "ما هي منصة لينكتك؟",
          answer: "لينكتك هي منصة تربط بين رواد الأعمال وشركات البرمجة لتنفيذ المشاريع التقنية بكفاءة وسهولة. توفر المنصة بيئة آمنة للتواصل والتعاقد، مع ضمان جودة العمل وحماية حقوق جميع الأطراف."
        },
        {
          id: "how-to-register",
          question: "كيف يمكنني التسجيل في المنصة؟",
          answer: "التسجيل في منصة لينكتك سهل ومجاني. ما عليك سوى النقر على زر 'إنشاء حساب' في الصفحة الرئيسية، ثم اختيار نوع الحساب (رائد أعمال أو شركة برمجة)، وإدخال بياناتك الأساسية، والموافقة على شروط الاستخدام."
        },
        {
          id: "account-types",
          question: "ما هي أنواع الحسابات المتاحة؟",
          answer: "تتوفر نوعان من الحسابات في منصة لينكتك:<br><br>1. <strong>حساب رائد أعمال:</strong> مخصص لأصحاب الأفكار والمشاريع التقنية الذين يبحثون عن شركات لتنفيذ مشاريعهم.<br><br>2. <strong>حساب شركة برمجة:</strong> مخصص للشركات المتخصصة في تطوير البرمجيات والتي ترغب في الحصول على مشاريع وعملاء جدد."
        },
        {
          id: "service-costs",
          question: "هل استخدام المنصة مجاني؟",
          answer: "التسجيل في المنصة وإنشاء حساب مجاني تماماً. تقوم المنصة بتحصيل عمولة بنسبة 2.5% فقط عند إتمام التعاقد بين رائد الأعمال والشركة. لا توجد أي رسوم خفية أو تكاليف إضافية."
        },
      ]
    },
    {
      id: "entrepreneur",
      title: "أسئلة رواد الأعمال",
      questions: [
        {
          id: "post-project",
          question: "كيف يمكنني نشر مشروعي على المنصة؟",
          answer: "بعد تسجيل الدخول كرائد أعمال، انتقل إلى لوحة التحكم واختر 'إضافة مشروع جديد'. قم بتعبئة نموذج المشروع بالتفاصيل المطلوبة مثل العنوان والوصف والميزانية والمهارات المطلوبة. بعد المراجعة السريعة، سيتم نشر مشروعك ليظهر للشركات المتخصصة."
        },
        {
          id: "project-visibility",
          question: "من يمكنه رؤية تفاصيل مشروعي؟",
          answer: "تفاصيل مشروعك تظهر للشركات المسجلة في المنصة، ولكن معلومات الاتصال الخاصة بك تبقى سرية. يمكن للشركات التواصل معك فقط من خلال نظام المراسلة داخل المنصة حتى تقبل أحد العروض وتتم عملية الدفع."
        },
        {
          id: "choosing-company",
          question: "كيف أختار الشركة المناسبة لمشروعي؟",
          answer: "بعد نشر مشروعك، ستتلقى عروضاً من الشركات المهتمة. يمكنك مقارنة العروض بناءً على السعر، المدة الزمنية، تقييمات الشركة، وملفها التعريفي. يمكنك أيضاً التواصل مع الشركات عبر نظام المراسلة لمناقشة التفاصيل قبل اختيار الشركة المناسبة."
        },
        {
          id: "project-payment",
          question: "كيف تتم عملية الدفع؟",
          answer: "عند اختيار إحدى الشركات، تقوم بدفع 2.5% من قيمة المشروع كعربون من خلال بوابات الدفع المتوفرة في المنصة. يتم الاحتفاظ بهذا المبلغ لدينا كضمان حتى اكتمال المشروع. بعد ذلك، يمكنك التواصل المباشر مع الشركة والاتفاق على طريقة دفع باقي المبلغ."
        },
        {
          id: "project-disputes",
          question: "ماذا لو لم أكن راضياً عن نتائج المشروع؟",
          answer: "توفر المنصة نظام لحل النزاعات. في حال وجود خلاف مع الشركة المنفذة، يمكنك تقديم شكوى مفصلة، وسيقوم فريق لينكتك بالتوسط لإيجاد حل يرضي الطرفين. في حالات عدم التزام الشركة بشروط التعاقد، يمكن استرداد العربون المدفوع."
        },
      ]
    },
    {
      id: "companies",
      title: "أسئلة الشركات",
      questions: [
        {
          id: "company-profile",
          question: "كيف يمكنني إنشاء ملف تعريفي مميز لشركتي؟",
          answer: "بعد التسجيل كشركة، انتقل إلى صفحة الملف الشخصي وقم بإضافة المعلومات التالية:<br><br>- شعار الشركة وصورة الغلاف<br>- وصف تفصيلي عن الشركة وخبراتها<br>- مجالات التخصص والمهارات التقنية<br>- نماذج من الأعمال السابقة<br>- معلومات التواصل<br><br>كلما كان ملفك التعريفي مكتملاً وواضحاً، زادت فرصك في الظهور في نتائج البحث وجذب المزيد من المشاريع."
        },
        {
          id: "finding-projects",
          question: "كيف يمكنني العثور على مشاريع تناسب تخصص شركتي؟",
          answer: "يمكنك البحث عن المشاريع من خلال:<br><br>1. تصفح قائمة المشاريع في لوحة التحكم<br>2. استخدام فلاتر البحث للعثور على مشاريع تناسب تخصصاتك<br>3. الاشتراك في إشعارات المشاريع الجديدة التي تتناسب مع مهاراتك<br>4. مراجعة المشاريع الموصى بها من قبل النظام بناءً على ملفك التعريفي"
        },
        {
          id: "submitting-offers",
          question: "كيف أقدم عرض سعر على مشروع؟",
          answer: "لتقديم عرض على مشروع، انتقل إلى صفحة تفاصيل المشروع واضغط على زر 'تقديم عرض'. قم بملء نموذج العرض متضمناً السعر المقترح، المدة الزمنية، ووصف لكيفية تنفيذك للمشروع. حاول تقديم عرض تنافسي ومفصل يوضح قيمتك المضافة للمشروع."
        },
        {
          id: "company-verification",
          question: "كيف يمكنني توثيق شركتي على المنصة؟",
          answer: "لتوثيق شركتك، انتقل إلى إعدادات الحساب واختر 'طلب توثيق'. ستحتاج إلى تقديم المستندات التالية:<br><br>- السجل التجاري ساري المفعول<br>- شهادة ضريبة القيمة المضافة (إن وجدت)<br>- ما يثبت ملكية الموقع الإلكتروني للشركة<br><br>بعد مراجعة المستندات، ستحصل شركتك على علامة التوثيق التي تزيد من مصداقيتك على المنصة."
        },
        {
          id: "commission-calculation",
          question: "كيف يتم احتساب عمولة المنصة؟",
          answer: "تبلغ عمولة المنصة 10% من قيمة المشروع، يتم خصمها من العربون المدفوع عند قبول العرض. مثال: إذا كانت قيمة المشروع 10,000 ريال، فإن العربون سيكون 1,000 ريال، وهو ما يمثل عمولة المنصة."
        },
      ]
    },
    {
      id: "technical",
      title: "أسئلة تقنية",
      questions: [
        {
          id: "account-security",
          question: "كيف تضمن المنصة أمان بياناتي؟",
          answer: "نحن نطبق أعلى معايير الأمان لحماية بياناتك:<br><br>- تشفير SSL لجميع الاتصالات<br>- تشفير البيانات الحساسة في قواعد البيانات<br>- إجراءات المصادقة الثنائية<br>- مراقبة مستمرة للنشاطات المشبوهة<br>- تحديثات دورية لأنظمة الحماية"
        },
        {
          id: "data-privacy",
          question: "كيف تتعامل المنصة مع خصوصية البيانات؟",
          answer: "نلتزم بحماية خصوصية بياناتك الشخصية وفقاً لسياسة الخصوصية الخاصة بنا. لا نشارك بياناتك مع أي طرف ثالث دون موافقتك، ونستخدم البيانات فقط للأغراض المحددة في سياسة الخصوصية. يمكنك الاطلاع على السياسة الكاملة في صفحة <a href='/privacy' class='text-primary hover:underline'>سياسة الخصوصية</a>."
        },
        {
          id: "supported-browsers",
          question: "ما هي المتصفحات المدعومة؟",
          answer: "المنصة متوافقة مع جميع المتصفحات الحديثة، بما في ذلك:<br><br>- Google Chrome (الإصدار 60 وما فوق)<br>- Mozilla Firefox (الإصدار 55 وما فوق)<br>- Safari (الإصدار 10 وما فوق)<br>- Microsoft Edge (الإصدار 80 وما فوق)<br><br>للحصول على أفضل تجربة، نوصي باستخدام أحدث إصدار من المتصفحات المذكورة."
        },
        {
          id: "mobile-app",
          question: "هل هناك تطبيق للهواتف الذكية؟",
          answer: "نعم، نوفر تطبيقات للهواتف الذكية على نظامي iOS وAndroid. يمكنك تحميل التطبيق من متجر التطبيقات الخاص بجهازك. يتيح لك التطبيق متابعة مشاريعك، والتواصل مع العملاء أو الشركات، وتلقي إشعارات فورية بالمستجدات."
        },
      ]
    },
    {
      id: "support",
      title: "الدعم والمساعدة",
      questions: [
        {
          id: "contact-support",
          question: "كيف يمكنني التواصل مع فريق الدعم؟",
          answer: "يمكنك التواصل مع فريق دعم لينكتك من خلال:<br><br>- البريد الإلكتروني: support@linktech.app<br>- نموذج الاتصال في صفحة <a href='/contact' class='text-primary hover:underline'>اتصل بنا</a><br>- الدردشة المباشرة في الموقع (متاحة من الساعة 9 صباحاً حتى 9 مساءً)<br>- الاتصال المباشر: +966 53 123 4567 (من الأحد إلى الخميس، 9 صباحاً - 5 مساءً)"
        },
        {
          id: "response-time",
          question: "ما هو وقت الاستجابة المتوقع للدعم الفني؟",
          answer: "نسعى لتقديم دعم سريع وفعال. وقت الاستجابة المتوقع:<br><br>- الدردشة المباشرة: فوري خلال ساعات العمل<br>- البريد الإلكتروني: خلال 24 ساعة عمل<br>- نموذج الاتصال: خلال 24-48 ساعة عمل<br><br>في الحالات الطارئة، يمكنك تحديد أولوية طلبك كـ 'عاجل' للحصول على استجابة أسرع."
        },
        {
          id: "tutorials",
          question: "هل توجد شروحات لاستخدام المنصة؟",
          answer: "نعم، نوفر مجموعة من الأدلة والشروحات لمساعدتك على استخدام المنصة بكفاءة:<br><br>- دليل المستخدم الشامل<br>- مكتبة فيديوهات توضيحية<br>- مدونة مع نصائح وإرشادات<br>- أسئلة شائعة مفصلة<br><br>يمكنك الوصول إلى هذه الموارد من خلال قسم 'مركز المساعدة' في القائمة الرئيسية."
        },
      ]
    },
  ];

  // حالة للبحث وتتبع الأسئلة المفتوحة
  const [searchQuery, setSearchQuery] = useState("");
  const [openQuestionIds, setOpenQuestionIds] = useState<string[]>([]);

  // تبديل حالة سؤال (مفتوح/مغلق)
  const toggleQuestion = (questionId: string) => {
    setOpenQuestionIds((prevIds) =>
      prevIds.includes(questionId)
        ? prevIds.filter((id) => id !== questionId)
        : [...prevIds, questionId]
    );
  };

  // فلترة الأسئلة حسب البحث
  const filteredFAQs = searchQuery
    ? faqData.map((category) => ({
        ...category,
        questions: category.questions.filter(
          (q) =>
            q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.answer.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter((category) => category.questions.length > 0)
    : faqData;

  // إعداد هيكل البيانات للـ Schema.org FAQ Page
  const faqStructuredData = {
    questions: faqData.flatMap(category => 
      category.questions.map(q => ({
        question: q.question,
        answer: q.answer.replace(/<\/?[^>]+(>|$)/g, ""), // إزالة وسوم HTML للحصول على نص بسيط
      }))
    )
  };

  return (
    <>
      <SEO
        title="الأسئلة الشائعة | لينكتك"
        description="تعرف على إجابات الأسئلة الشائعة حول منصة لينكتك لربط رواد الأعمال بشركات البرمجة. معلومات حول التسجيل، إنشاء المشاريع، تقديم العروض، وآلية عمل المنصة."
        keywords="أسئلة شائعة, لينكتك, مساعدة, دعم فني, إرشادات, شرح, منصة برمجة, رواد أعمال, شركات تقنية"
      >
        <WebpageStructuredData
          name="الأسئلة الشائعة | لينكتك"
          description="تعرف على إجابات الأسئلة الشائعة حول منصة لينكتك لربط رواد الأعمال بشركات البرمجة"
          url="https://linktech.app/faq"
        />
        <BreadcrumbStructuredData
          items={[
            { name: "الرئيسية", url: "https://linktech.app/" },
            { name: "الأسئلة الشائعة", url: "https://linktech.app/faq" }
          ]}
        />
        <FAQStructuredData questions={faqStructuredData.questions} />
      </SEO>

      <div className="container mx-auto px-4 py-12">
        <div className="mb-6">
          <Link href="/" className="text-primary hover:text-primary-dark inline-flex items-center">
            <ArrowLeft className="ml-1 h-4 w-4 rtl-flip" />
            العودة إلى الرئيسية
          </Link>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <nav className="flex text-sm text-neutral-600 mb-6" aria-label="التنقل التسلسلي">
            <ol className="flex rtl space-x-2 space-x-reverse">
              <li><Link href="/" className="hover:text-primary hover:underline">الرئيسية</Link></li>
              <li className="before:content-['/'] before:mx-2 font-semibold">الأسئلة الشائعة</li>
            </ol>
          </nav>

          <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">الأسئلة الشائعة</h1>
          <p className="text-neutral-600 text-center mb-8">
            تعرف على إجابات الأسئلة الأكثر شيوعاً حول منصة لينكتك وكيفية استخدامها
          </p>

          {/* مربع البحث */}
          <div className="relative mb-10">
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <Search className="h-5 w-5 text-neutral-400" />
            </div>
            <Input
              type="text"
              placeholder="ابحث في الأسئلة الشائعة..."
              className="pr-10 text-right"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* إذا لم تكن هناك نتائج للبحث */}
          {filteredFAQs.length === 0 && (
            <div className="text-center py-10">
              <p className="text-lg text-neutral-600 mb-4">لا توجد نتائج مطابقة لـ "{searchQuery}"</p>
              <Button
                variant="outline"
                onClick={() => setSearchQuery("")}
              >
                مسح البحث
              </Button>
            </div>
          )}

          {/* عرض الأسئلة حسب الفئات */}
          <div className="space-y-10">
            {filteredFAQs.map((category) => (
              <div key={category.id}>
                <h2 className="text-2xl font-bold mb-6 border-b border-neutral-200 pb-2">
                  {category.title}
                </h2>
                <div className="space-y-2">
                  {category.questions.map((item) => (
                    <FAQItem
                      key={item.id}
                      question={item.question}
                      answer={item.answer}
                      isOpen={openQuestionIds.includes(item.id)}
                      toggleOpen={() => toggleQuestion(item.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* قسم التواصل للمزيد من المساعدة */}
          <div className="mt-16 bg-neutral-50 p-6 md:p-8 rounded-xl text-center">
            <h2 className="text-2xl font-bold mb-3">لم تجد إجابة لسؤالك؟</h2>
            <p className="text-neutral-600 mb-6">
              فريق الدعم الفني جاهز للإجابة على جميع استفساراتك
            </p>
            <Button asChild>
              <Link href="/contact">
                تواصل معنا
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FAQPage;