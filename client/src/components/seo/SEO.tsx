import { Helmet } from "react-helmet";

interface SEOProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogType?: string;
  ogImage?: string;
  ogImageAlt?: string;
  twitterCard?: "summary" | "summary_large_image" | "app" | "player";
  keywords?: string;
  noIndex?: boolean;
  structuredData?: object;
  langDirection?: "rtl" | "ltr";
  langCode?: string;
}

/**
 * مكون موحد لتحسين SEO يستخدم في جميع صفحات الموقع
 * 
 * هذا المكون يتيح توحيد إعدادات علامات meta وتحسين الفهرسة من محركات البحث
 */
const SEO = ({
  title,
  description,
  canonicalUrl,
  ogType = "website",
  ogImage,
  ogImageAlt,
  twitterCard = "summary_large_image",
  keywords,
  noIndex = false,
  structuredData,
  langDirection = "rtl",
  langCode = "ar",
}: SEOProps) => {
  const siteUrl = "https://linktech.app";
  const fullTitle = `${title} | لينكتك`;
  const defaultImage = `${siteUrl}/images/linktech-social-share.png`;
  const imageUrl = ogImage || defaultImage;
  const defaultCanonical = typeof window !== "undefined" ? window.location.href : "";
  const canonical = canonicalUrl || defaultCanonical;

  return (
    <Helmet>
      {/* العنوان الأساسي */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      
      {/* علامات للروبوتات */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}
      
      {/* الكلمات المفتاحية */}
      {keywords && <meta name="keywords" content={keywords} />}
      
      {/* علامات الكانونيكال */}
      <link rel="canonical" href={canonical} />
      
      {/* علامات Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="لينكتك" />
      <meta property="og:locale" content="ar_SA" />
      <meta property="og:image" content={imageUrl} />
      {ogImageAlt && <meta property="og:image:alt" content={ogImageAlt} />}
      
      {/* علامات تويتر */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      {ogImageAlt && <meta name="twitter:image:alt" content={ogImageAlt} />}
      
      {/* إعدادات اللغة */}
      <html lang={langCode} dir={langDirection} />
      
      {/* البيانات المنظمة */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
      
      {/* إضافة تلميحات للروبوتات للتنقل السريع باللغة العربية */}
      <meta name="format-detection" content="telephone=no" />
      <meta name="theme-color" content="#007A5A" />
    </Helmet>
  );
};

export default SEO;