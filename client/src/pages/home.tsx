import HeroSection from "@/components/home/HeroSection";
import HowItWorks from "@/components/home/HowItWorks";
import FeaturedProjects from "@/components/home/FeaturedProjects";
import CompanyPromotionSection from "@/components/home/TopCompanies";
import Testimonials from "@/components/home/Testimonials";
import CTASection from "@/components/home/CTASection";
import OfficialCompaniesSection from "@/components/home/OfficialCompaniesSection";
import { TrendingProjects } from "@/components/recommendations";
import { Helmet } from "react-helmet";

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
      <Helmet>
        <title>تِكلينك | منصة ربط شركات البرمجة ورواد الأعمال</title>
        <meta name="description" content="منصة تربط بين رواد الأعمال وشركات البرمجة لتنفيذ المشاريع التقنية بكفاءة وسهولة" />
      </Helmet>
      
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
