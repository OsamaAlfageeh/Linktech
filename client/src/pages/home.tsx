
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
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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

      {/* زر المساعدة العائم */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          onClick={() => window.open('https://chat.openai.com', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes')}
          className="rounded-full w-14 h-14 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-110"
          title="فتح مساعد ChatGPT"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    </>
  );
};

export default Home;
