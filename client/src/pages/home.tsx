import HeroSection from "@/components/home/HeroSection";
import HowItWorks from "@/components/home/HowItWorks";
import FeaturedProjects from "@/components/home/FeaturedProjects";
import CompanyPromotionSection from "@/components/home/TopCompanies";
import Testimonials from "@/components/home/Testimonials";
import CTASection from "@/components/home/CTASection";
import OfficialCompaniesSection from "@/components/home/OfficialCompaniesSection";
import { TrendingProjects } from "@/components/recommendations";
import SEO from "@/components/seo/SEO";
import StructuredData, { createWebsiteSchema, createFAQSchema } from "@/components/seo/StructuredData";

type HomeProps = {
  auth: {
    isAuthenticated: boolean;
    isCompany: boolean;
    isEntrepreneur: boolean;
  };
};

const Home = ({ auth }: HomeProps) => {
  // إنشاء البيانات المنظمة للموقع
  const websiteSchema = createWebsiteSchema({
    url: "https://linktech.app",
    name: "لينكتك",
    description: "منصة تربط بين رواد الأعمال وشركات البرمجة لتنفيذ المشاريع التقنية بكفاءة وسهولة",
    inLanguage: "ar",
    organization: {
      name: "لينكتك",
      url: "https://linktech.app",
      logo: "https://linktech.app/logo.svg"
    }
  });

  // إنشاء بيانات الأسئلة الشائعة
  const faqSchema = createFAQSchema({
    questions: [
      {
        question: "كيف تساعدني منصة لينكتك في إيجاد شركة مناسبة لتنفيذ مشروعي؟",
        answer: "تقوم المنصة بمطابقة مشروعك مع أفضل الشركات المتخصصة في المجال التقني المطلوب باستخدام خوارزميات ذكية، وتحافظ على خصوصية بياناتك حتى تبدأ التعاون مع الشركة المناسبة."
      },
      {
        question: "هل يمكن للشركات الاطلاع على كافة تفاصيل مشروعي؟",
        answer: "لا، تظهر فقط المعلومات الأساسية للمشروع للشركات. التفاصيل الكاملة والمعلومات الحساسة تظل محمية حتى توقيع اتفاقية عدم الإفصاح (NDA)."
      },
      {
        question: "كيف أضمن جودة الشركات المسجلة في المنصة؟",
        answer: "تمر جميع الشركات بعملية توثيق شاملة تتحقق من هويتها القانونية وخبراتها. كما يمكنك الاطلاع على تقييمات العملاء السابقين والمشاريع المنجزة."
      }
    ]
  });

  return (
    <>
      <SEO 
        title="منصة ربط شركات البرمجة ورواد الأعمال"
        description="منصة تربط بين رواد الأعمال وشركات البرمجة لتنفيذ المشاريع التقنية بكفاءة وسهولة. ابحث عن أفضل الشركات التقنية لتنفيذ مشروعك بكل أمان."
        keywords="منصة برمجة, شركات تطوير برمجيات, مشاريع تقنية, تطوير مواقع, تطوير تطبيقات, رواد أعمال, ربط شركات البرمجة, تقنية, برمجة, تطوير"
        ogType="website"
        ogImage="https://linktech.app/images/linktech-social-card.png"
        ogImageAlt="منصة لينكتك - الجسر بين الأفكار والتنفيذ"
        structuredData={[websiteSchema, faqSchema]}
      />
      
      <HeroSection auth={auth} />
      <OfficialCompaniesSection />
      <HowItWorks />
      <div className="container mx-auto px-4 py-10">
        <TrendingProjects limit={3} />
      </div>
      <FeaturedProjects />
      <CompanyPromotionSection />
      <Testimonials />
      <CTASection auth={auth} />
    </>
  );
};

export default Home;
