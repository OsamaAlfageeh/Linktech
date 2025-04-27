import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

// صفحة وسيطة للتوجيه المباشر
export default function Redirect() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // استخراج المسار المطلوب من المعلمات (params)
    const params = new URLSearchParams(window.location.search);
    const to = params.get("to");

    // معالجة مختلف المسارات المحتملة
    if (to === "admin") {
      window.location.href = "/dashboard/admin";
    } else if (to === "entrepreneur") {
      window.location.href = "/dashboard/entrepreneur";
    } else if (to === "company") {
      window.location.href = "/dashboard/company";
    } else {
      // التوجيه الافتراضي إلى الصفحة الرئيسية
      window.location.href = "/";
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <h2 className="text-lg font-medium text-gray-800">
        جاري توجيهك، يرجى الانتظار...
      </h2>
    </div>
  );
}