import { PencilLine, Handshake, Rocket } from "lucide-react";

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl font-bold text-neutral-800">كيف تعمل المنصة</h2>
          <p className="mt-4 text-lg text-neutral-600 max-w-3xl mx-auto">
            عملية سهلة وبسيطة لربط المشاريع التقنية بأفضل شركات البرمجة
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          {/* Step 1 */}
          <div className="bg-neutral-50 rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-primary-light text-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <PencilLine className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-heading font-semibold mb-3">1. أنشئ مشروعك</h3>
            <p className="text-neutral-600">
              حدد تفاصيل مشروعك التقني، والميزانية المتوقعة، والجدول الزمني المطلوب.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-neutral-50 rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-primary-light text-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Handshake className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-heading font-semibold mb-3">2. تواصل مع الشركات</h3>
            <p className="text-neutral-600">
              استقبل عروض من شركات البرمجة المهتمة، وقارن بينها، واختر الأنسب لك.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-neutral-50 rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-primary-light text-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Rocket className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-heading font-semibold mb-3">3. أطلق مشروعك</h3>
            <p className="text-neutral-600">
              ابدأ العمل مع الشركة المختارة، وتابع التقدم، واستلم مشروعك النهائي.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
