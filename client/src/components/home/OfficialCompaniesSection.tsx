import { CheckCircle, Shield, Briefcase, Award } from "lucide-react";

const OfficialCompaniesSection = () => {
  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center justify-center bg-primary text-white px-4 py-1 rounded-full mb-4">
            <Shield className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">100% موثوقية</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            شركات سعودية رسمية ومعتمدة
          </h2>
          <p className="text-lg text-gray-700">
            جميع الشركات على منصتنا هي شركات سعودية مسجلة رسمياً بسجل تجاري موثق، مما يضمن تعاملات آمنة وموثوقة بنسبة 100%.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Briefcase className="text-primary w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">سجل تجاري رسمي</h3>
            <p className="text-gray-600">
              نتحقق من كل شركة على المنصة للتأكد من امتلاكها سجل تجاري ساري المفعول صادر من وزارة التجارة السعودية.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="bg-emerald-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="text-emerald-600 w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">توثيق الشركات</h3>
            <p className="text-gray-600">
              نمنح شارة التوثيق للشركات بعد التحقق من هويتها ومستنداتها الرسمية، مما يضمن أنك تتعامل مع كيانات حقيقية ومرخصة.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="bg-amber-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Award className="text-amber-600 w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">ضمان العقود والمدفوعات</h3>
            <p className="text-gray-600">
              نقدم نظام وساطة آمن يحمي حقوق جميع الأطراف، مع توثيق العقود والمدفوعات بطريقة تضمن إتمام المشاريع بثقة وشفافية.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OfficialCompaniesSection;