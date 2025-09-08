import { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * هذا المكون يعيد تعيين السكرول إلى الأعلى عند الانتقال بين الصفحات
 * يستخدم useLocation من wouter للاستماع لتغييرات المسار
 */
export default function ScrollToTop() {
  const [location] = useLocation();
  
  useEffect(() => {
    // عند تغيير المسار، نمرر السكرول إلى أعلى الصفحة
    window.scrollTo(0, 0);
  }, [location]);

  return null; // هذا المكون لا يعرض أي محتوى في DOM
}