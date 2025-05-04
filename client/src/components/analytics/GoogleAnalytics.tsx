import { useEffect } from 'react';
import { useLocation } from 'wouter';

interface GoogleAnalyticsProps {
  measurementId: string;
}

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

/**
 * مكون Google Analytics
 * يقوم بتتبع مشاهدات الصفحات وإرسالها إلى Google Analytics
 * 
 * @param measurementId معرف القياس من Google Analytics (يبدأ بـ G-)
 */
export default function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  const [location] = useLocation();

  useEffect(() => {
    // التحقق من وجود رمز التتبع
    if (!measurementId) {
      console.warn('Google Analytics: رمز التتبع غير موجود');
      return;
    }

    const addGoogleAnalytics = () => {
      if (typeof window === 'undefined') return;

      // التحقق من عدم وجود سكريبت Google Analytics مسبقاً
      if (!window.gtag) {
        // تهيئة طبقة البيانات
        window.dataLayer = window.dataLayer || [];
        window.gtag = function gtag() {
          window.dataLayer.push(arguments);
        };
        window.gtag('js', new Date());
        window.gtag('config', measurementId, {
          send_page_view: false // سنتعامل مع مشاهدات الصفحات يدويًا
        });

        // إضافة سكريبت Google Analytics
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
        document.head.appendChild(script);
      }
    };

    addGoogleAnalytics();
  }, [measurementId]);

  // تتبع مشاهدات الصفحات عندما يتغير المسار
  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag && measurementId) {
      window.gtag('event', 'page_view', {
        page_path: location,
        page_title: document.title,
        page_location: window.location.href
      });
    }
  }, [location, measurementId]);

  // لا يعرض هذا المكون أي شيء، فهو يعمل فقط في الخلفية
  return null;
}

/**
 * مكون Google Search Console Verification
 * يضيف رمز التحقق من ملكية الموقع لـ Google Search Console
 * 
 * @param verificationId رمز التحقق من Google Search Console
 */
export function GoogleSearchConsoleVerification({ verificationId }: { verificationId: string }) {
  useEffect(() => {
    // التحقق من وجود رمز التحقق
    if (!verificationId) {
      console.warn('Google Search Console: رمز التحقق غير موجود');
      return;
    }

    // إضافة وسم تحقق Google Search Console إلى رأس الصفحة
    const meta = document.createElement('meta');
    meta.name = 'google-site-verification';
    meta.content = verificationId;
    document.head.appendChild(meta);

    // تنظيف عند تفكيك المكون
    return () => {
      const metaTag = document.querySelector('meta[name="google-site-verification"]');
      if (metaTag) {
        metaTag.remove();
      }
    };
  }, [verificationId]);

  // لا يعرض هذا المكون أي شيء، فهو يعمل فقط في الخلفية
  return null;
}

/**
 * وظيفة مساعدة لتتبع الأحداث المخصصة
 * 
 * @param eventName اسم الحدث
 * @param parameters معلمات الحدث
 */
export function trackEvent(eventName: string, parameters?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters);
  }
}