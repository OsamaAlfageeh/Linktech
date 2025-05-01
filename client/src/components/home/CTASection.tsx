import { Link } from "wouter";

type CTASectionProps = {
  auth: {
    isAuthenticated: boolean;
  };
};

const CTASection = ({ auth }: CTASectionProps) => {
  return (
    <section className="py-16 bg-gradient-to-r from-[hsl(160,84%,39%)] to-[hsl(161,94%,30%)] text-white relative overflow-hidden">
      {/* أشكال زخرفية متحركة في الخلفية */}
      <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-white/5 blur-3xl animate-blob"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-white/5 blur-3xl animate-blob animation-delay-2000"></div>
      <div className="absolute top-1/3 right-1/4 w-40 h-40 rounded-full bg-white/5 blur-3xl animate-blob animation-delay-4000"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6 shimmer inline-block">ابدأ رحلتك التقنية اليوم</h2>
          <p className="text-white/90 text-lg mb-8 fade-in">
            سواء كنت رائد أعمال تبحث عن تنفيذ فكرتك أو شركة برمجة تبحث عن عملاء جدد، انضم إلينا الآن وكن جزءاً من منصتنا.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 sm:space-x-reverse">
            <Link 
              href={auth.isAuthenticated ? "/projects" : "/auth/register"} 
              className="bg-white text-[hsl(160,84%,39%)] hover:bg-neutral-100 font-medium rounded-lg px-8 py-3 text-center transition-all duration-300 hover:shadow-xl hover-button-scale floating-button"
            >
              {auth.isAuthenticated ? "استكشف المشاريع" : "أنشئ حسابك مجاناً"}
            </Link>
            <Link 
              href="/auth/register" 
              className="bg-[hsla(160,84%,30%,0.3)] text-white hover:bg-[hsla(160,84%,30%,0.5)] font-medium rounded-lg px-8 py-3 text-center border border-white/30 transition-all duration-300 hover:border-white hover:shadow-lg hover-button-scale"
            >
              ابدأ رحلتك التقنية اليوم
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
