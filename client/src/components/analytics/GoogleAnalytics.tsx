import { useEffect } from 'react';
import { useLocation } from 'wouter';

interface GoogleAnalyticsProps {
  measurementId: string;
  anonymizeIp?: boolean;
}

/**
 * مكون Google Analytics
 * يقوم بتضمين سكربت Google Analytics وإرسال مشاهدات الصفحة
 * 
 * @param measurementId معرف القياس من Google Analytics (G-XXXXXXXX)
 * @param anonymizeIp تفعيل إخفاء عنوان IP (اختياري، افتراضي: true)
 */
export default function GoogleAnalytics({ 
  measurementId, 
  anonymizeIp = true 
}: GoogleAnalyticsProps) {
  const [location] = useLocation();
  
  // تضمين سكربت Google Analytics عند تحميل المكون
  useEffect(() => {
    // تخطي في بيئة التطوير المحلية
    if (window.location.hostname === 'localhost') {
      console.log('Google Analytics متوقف في بيئة التطوير المحلية');
      return;
    }

    if (!measurementId) {
      console.warn('لم يتم توفير معرف القياس لـ Google Analytics');
      return;
    }

    // تضمين السكربت إذا لم يكن موجوداً بالفعل
    if (!document.getElementById('google-analytics-script')) {
      const script = document.createElement('script');
      script.id = 'google-analytics-script';
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      script.async = true;
      document.head.appendChild(script);

      // تهيئة gtag
      window.dataLayer = window.dataLayer || [];
      function gtag(...args: any[]) {
        window.dataLayer.push(args);
      }
      
      gtag('js', new Date());
      
      // ضبط إعداد إخفاء عنوان IP إذا كان مطلوباً
      if (anonymizeIp) {
        gtag('config', measurementId, { 'anonymize_ip': true });
      } else {
        gtag('config', measurementId);
      }
    }
  }, [measurementId, anonymizeIp]);

  // إرسال مشاهدة صفحة عند تغيير المسار
  useEffect(() => {
    // تخطي في بيئة التطوير المحلية
    if (window.location.hostname === 'localhost') {
      return;
    }

    if (window.gtag && location) {
      window.gtag('config', measurementId, {
        'page_path': location,
        'anonymize_ip': anonymizeIp
      });
      
      console.log(`تم إرسال مشاهدة صفحة إلى Google Analytics للمسار: ${location}`);
    }
  }, [location, measurementId, anonymizeIp]);

  // هذا المكون غير مرئي في الواجهة
  return null;
}

// إضافة التعريف الشامل لـ gtag
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}