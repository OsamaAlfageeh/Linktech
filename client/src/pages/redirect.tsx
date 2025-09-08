import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

type Props = {
  to?: string;
};

// صفحة وسيطة للتوجيه المباشر
export default function Redirect({ to }: Props) {
  // استخدام useLocation للتنقل
  const [_, navigate] = useLocation();

  useEffect(() => {
    // إضافة تأخير قبل إعادة التوجيه
    const redirectTimeout = setTimeout(() => {
      // إذا تم تمرير الوجهة كخاصية، استخدمها، وإلا فاستخراج من المعلمات (params)
      const params = new URLSearchParams(window.location.search);
      const destination = to || params.get("to");
      
      console.log("صفحة التوجيه: الوجهة المطلوبة هي", destination);

      try {
        // معالجة مختلف المسارات المحتملة باستخدام التوجيه المباشر
        if (destination === "admin") {
          console.log("جاري التوجيه إلى لوحة المسؤول");
          navigate("/dashboard/admin");
        } else if (destination === "entrepreneur") {
          console.log("جاري التوجيه إلى لوحة رائد الأعمال");
          navigate("/dashboard/entrepreneur");
        } else if (destination === "company") {
          console.log("جاري التوجيه إلى لوحة الشركة");
          navigate("/dashboard/company");
        } else {
          console.log("توجيه إلى الصفحة الرئيسية (المسار غير معروف)");
          navigate("/");
        }
      } catch (error) {
        console.error("حدث خطأ أثناء التوجيه:", error);
        // في حالة الخطأ، توجيه إلى الصفحة الرئيسية
        navigate("/");
      }
    }, 1500); // تأخير 1.5 ثانية
    
    // تنظيف المؤقت عند إلغاء تحميل المكون
    return () => clearTimeout(redirectTimeout);
  }, [navigate, to]);

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