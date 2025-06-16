import HeroSection from "@/components/home/HeroSection";
import HowItWorks from "@/components/home/HowItWorks";
import FeaturedProjects from "@/components/home/FeaturedProjects";
import CompanyPromotionSection from "@/components/home/TopCompanies";
import Testimonials from "@/components/home/Testimonials";
import CTASection from "@/components/home/CTASection";
import OfficialCompaniesSection from "@/components/home/OfficialCompaniesSection";
import AIAssistantSection from "@/components/home/AIAssistantSection";
import { TrendingProjects } from "@/components/recommendations";
import SEO from "@/components/seo/SEO";
import { OrganizationStructuredData, WebpageStructuredData } from "@/components/seo/StructuredData";

type HomeProps = {
  auth: {
    isAuthenticated: boolean;
    isCompany: boolean;
    isEntrepreneur: boolean;
  };
};

const Home = ({ auth }: HomeProps) => {
  return (
    <>
      <SEO 
        title="منصة ربط شركات البرمجة ورواد الأعمال"
        description="منصة تربط بين رواد الأعمال وشركات البرمجة لتنفيذ المشاريع التقنية بكفاءة وسهولة. ابحث عن أفضل الشركات التقنية لتنفيذ مشروعك بكل أمان."
        keywords="منصة برمجة, شركات تطوير برمجيات, مشاريع تقنية, تطوير مواقع, تطوير تطبيقات, رواد أعمال, ربط شركات البرمجة, تقنية, برمجة, تطوير"
        ogType="website"
        ogImage="https://linktech.app/images/linktech-social-card.png"
      >
        <OrganizationStructuredData 
          name="لينكتك"
          url="https://linktech.app"
          logo="https://linktech.app/images/logo.svg"
          description="منصة تربط بين رواد الأعمال وشركات البرمجة لتنفيذ المشاريع التقنية بكفاءة وسهولة"
        />
        <WebpageStructuredData
          name="لينكتك - منصة ربط شركات البرمجة ورواد الأعمال"
          description="منصة تربط بين رواد الأعمال وشركات البرمجة لتنفيذ المشاريع التقنية بكفاءة وسهولة. ابحث عن أفضل الشركات التقنية لتنفيذ مشروعك بكل أمان."
          url="https://linktech.app"
        />
      </SEO>
      
      <HeroSection auth={auth} />
      <OfficialCompaniesSection />
      <AIAssistantSection auth={auth} />
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
