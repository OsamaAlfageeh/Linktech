import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

// صفحة وسيطة للتوجيه المباشر
export default function Redirect() {
  // إزالة setLocation لتجنب التداخل مع إعادة التوجيه
  const [location] = useLocation();

  useEffect(() => {
    // إضافة تأخير قبل إعادة التوجيه
    const redirectTimeout = setTimeout(() => {
      // استخراج المسار المطلوب من المعلمات (params)
      const params = new URLSearchParams(window.location.search);
      const to = params.get("to");
      
      console.log("صفحة التوجيه: الوجهة المطلوبة هي", to);

      try {
        // معالجة مختلف المسارات المحتملة باستخدام التوجيه المباشر
        if (to === "admin") {
          console.log("جاري التوجيه إلى لوحة المسؤول");
          window.location.replace("/dashboard/admin");
        } else if (to === "entrepreneur") {
          console.log("جاري التوجيه إلى لوحة رائد الأعمال");
          window.location.replace("/dashboard/entrepreneur");
        } else if (to === "company") {
          console.log("جاري التوجيه إلى لوحة الشركة");
          window.location.replace("/dashboard/company");
        } else {
          console.log("توجيه إلى الصفحة الرئيسية (المسار غير معروف)");
          window.location.replace("/");
        }
      } catch (error) {
        console.error("حدث خطأ أثناء التوجيه:", error);
        // في حالة الخطأ، توجيه إلى الصفحة الرئيسية
        window.location.replace("/");
      }
    }, 1500); // تأخير 1.5 ثانية
    
    // تنظيف المؤقت عند إلغاء تحميل المكون
    return () => clearTimeout(redirectTimeout);
  }, []);

  return (
    <div dir="rtl" className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center bg-white p-8 rounded-xl shadow-sm">
        <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-6" />
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          جاري التوجيه...
        </h2>
        <p className="text-gray-600">
          سيتم توجيهك تلقائياً خلال لحظات، يرجى الانتظار
        </p>
      </div>
    </div>
  );
}