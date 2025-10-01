import React from 'react';
import { Helmet } from 'react-helmet';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'profile' | 'book';
  ogUrl?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  canonicalUrl?: string;
  children?: React.ReactNode;
}

/**
 * مكون لإدارة العلامات الوصفية لمحسنات محركات البحث (SEO)
 * مهم: استخدم هذا المكون في جميع الصفحات لضمان تحسين الظهور في نتائج البحث
 */
const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  ogImage = 'https://linktech.app/favicon.png',
  ogType = 'website',
  ogUrl,
  noIndex = false,
  noFollow = false,
  canonicalUrl,
  children
}) => {
  const fullTitle = `${title} | لينكتك - منصة ربط رواد الأعمال بشركات البرمجة`;
  const robots = `${noIndex ? 'noindex' : 'index'}, ${noFollow ? 'nofollow' : 'follow'}`;
  const currentUrl = ogUrl || (typeof window !== 'undefined' ? window.location.href : '');

  return (
    <Helmet>
      {/* العلامات الأساسية */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={robots} />
      
      {/* علامات Open Graph للمشاركة على وسائل التواصل الاجتماعي */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content="ar_SA" />
      <meta property="og:site_name" content="لينكتك" />

      {/* علامات Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@linktech_sa" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* علامات أخرى مهمة */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="Arabic" />
      <meta name="revisit-after" content="7 days" />
      <meta name="author" content="لينكتك" />

      {/* الرابط القانوني (Canonical URL) لتجنب محتوى مكرر */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* روابط بديلة متعددة اللغات */}
      <link rel="alternate" href={currentUrl} hrefLang="ar-sa" />
      <link rel="alternate" href={currentUrl} hrefLang="x-default" />

      {/* هيكلة إضافية من المستدعي */}
      {children}
    </Helmet>
  );
};

export default SEO;