import { Link } from "wouter";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال البريد الإلكتروني",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await apiRequest("POST", "/api/newsletter/subscribe", { email });
      const data = await response.json();
      
      toast({
        title: "تم الاشتراك بنجاح",
        description: data.message || "شكراً لاشتراكك في نشرتنا البريدية!",
      });
      
      setEmail("");
    } catch (error) {
      console.error("خطأ في الاشتراك:", error);
      toast({
        title: "خطأ في الاشتراك",
        description: "حدث خطأ أثناء محاولة الاشتراك في النشرة البريدية. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-gray-300 pt-16 pb-8">
      <div className="container-modern">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* About */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">لـ</span>
              </div>
              <h3 className="font-heading text-white text-2xl font-bold">لينكتك</h3>
            </div>
            <p className="text-gray-400 leading-relaxed">منصة تربط بين رواد الأعمال وشركات البرمجة لتنفيذ المشاريع التقنية بكفاءة وسهولة في المملكة العربية السعودية.</p>
            <div className="flex gap-3 mt-6">
              {/* تويتر - Twitter */}
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 group">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
              {/* لينكد إن - LinkedIn */}
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-blue-700 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 group">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z"/>
                </svg>
              </a>
              {/* إنستجرام - Instagram */}
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-pink-600 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 group">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Links 1 */}
          <div>
            <h3 className="font-heading text-white text-lg font-bold mb-6">روابط سريعة</h3>
            <ul className="space-y-3">
              <li><Link href="/projects" className="text-gray-400 hover:text-white transition-all duration-200 hover:translate-x-1 flex items-center group">
                <span className="w-2 h-2 bg-primary rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                المشاريع
              </Link></li>
              <li><Link href="/how-it-works" className="text-gray-400 hover:text-white transition-all duration-200 hover:translate-x-1 flex items-center group">
                <span className="w-2 h-2 bg-primary rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                كيف يعمل
              </Link></li>
              <li><Link href="/help-center" className="text-gray-400 hover:text-white transition-all duration-200 hover:translate-x-1 flex items-center group">
                <span className="w-2 h-2 bg-primary rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                الأسئلة الشائعة
              </Link></li>
            </ul>
          </div>

          {/* Links 2 */}
          <div>
            <h3 className="font-heading text-white text-lg font-bold mb-6">الدعم</h3>
            <ul className="space-y-3">
              <li><Link href="/help-center" className="text-gray-400 hover:text-white transition-all duration-200 hover:translate-x-1 flex items-center group">
                <span className="w-2 h-2 bg-accent rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                مركز المساعدة
              </Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-white transition-all duration-200 hover:translate-x-1 flex items-center group">
                <span className="w-2 h-2 bg-accent rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                التواصل معنا
              </Link></li>
              <li><Link href="/terms" className="text-gray-400 hover:text-white transition-all duration-200 hover:translate-x-1 flex items-center group">
                <span className="w-2 h-2 bg-accent rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                الشروط والأحكام
              </Link></li>
              <li><Link href="/privacy" className="text-gray-400 hover:text-white transition-all duration-200 hover:translate-x-1 flex items-center group">
                <span className="w-2 h-2 bg-accent rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                سياسة الخصوصية
              </Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-heading text-white text-lg font-bold mb-6">النشرة الإخبارية</h3>
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></div>
                <span className="text-green-400 text-sm font-medium">آخر الأخبار</span>
              </div>
              <p className="text-gray-400 mb-4 text-sm">اشترك للحصول على آخر الأخبار والعروض الحصرية والتحديثات الأسبوعية.</p>
              <form className="space-y-3" onSubmit={handleNewsletterSubmit}>
                <div className="relative">
                  <input 
                    type="email" 
                    placeholder="البريد الإلكتروني" 
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-gradient-primary hover:shadow-lg text-white px-4 py-3 rounded-lg font-medium disabled:opacity-70 transition-all duration-200 flex items-center justify-center space-x-2 space-x-reverse"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>جاري الاشتراك...</span>
                    </>
                  ) : (
                    <>
                      <span>اشترك الآن</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-700 pt-6 text-center text-sm">
          <p>© {currentYear} لينكتك. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
