import { Link } from "wouter";

type CTASectionProps = {
  auth: {
    isAuthenticated: boolean;
  };
};

const CTASection = ({ auth }: CTASectionProps) => {
  return (
    <section className="py-16 bg-slate-900 text-white relative overflow-hidden">
      {/* أشكال زخرفية متحركة في الخلفية */}
      <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-primary/20 blur-3xl animate-blob"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-accent/10 blur-3xl animate-blob animation-delay-2000"></div>
      <div className="absolute top-1/3 right-1/4 w-40 h-40 rounded-full bg-primary/15 blur-3xl animate-blob animation-delay-4000"></div>
      
      {/* خطوط زخرفية */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-16 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
        <div className="absolute bottom-16 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent/30 to-transparent"></div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-5xl font-bold mb-6 text-amber-300">
            ابدأ رحلتك التقنية اليوم
          </h2>
          <p className="text-gray-100 text-lg md:text-xl mb-8 font-medium max-w-xl mx-auto">
            سواء كنت رائد أعمال تبحث عن تنفيذ فكرتك أو شركة برمجة تبحث عن عملاء جدد، انضم إلينا الآن وكن جزءاً من منصتنا.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 sm:space-x-reverse">
            <Link 
              href={auth.isAuthenticated ? "/projects" : "/auth/register"} 
              className="bg-white text-primary hover:bg-white/90 font-bold rounded-lg px-8 py-4 text-center transition-all duration-300 hover:shadow-xl shadow-md hover:-translate-y-1 text-lg"
            >
              {auth.isAuthenticated ? "استكشف المشاريع" : "أنشئ حسابك مجاناً"}
            </Link>
            <Link 
              href="/auth/register" 
              className="bg-accent hover:bg-accent-dark text-white font-bold rounded-lg px-8 py-4 text-center border border-accent/30 transition-all duration-300 hover:shadow-lg shadow-md hover:-translate-y-1 text-lg"
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
