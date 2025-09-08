import React from 'react';

interface OrganizationStructuredDataProps {
  name: string;
  url: string;
  logo: string;
  description: string;
}

interface ProjectStructuredDataProps {
  name: string;
  description: string;
  datePublished: string;
  author: string;
  category?: string;
}

interface WebpageStructuredDataProps {
  name: string;
  description: string;
  url: string;
}

interface BreadcrumbStructuredDataProps {
  items: Array<{name: string; url: string}>;
}

interface FAQStructuredDataProps {
  questions: Array<{
    question: string;
    answer: string;
  }>;
}

/**
 * مكون لإضافة البيانات المنظمة للمنظمة/الشركة
 * يساعد محركات البحث في فهم معلومات المنصة
 */
export const OrganizationStructuredData: React.FC<OrganizationStructuredDataProps> = ({ 
  name, 
  url, 
  logo, 
  description 
}) => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo,
    description,
    sameAs: [
      'https://twitter.com/linktech_sa',
      'https://facebook.com/linktech_sa',
      'https://linkedin.com/company/linktech_sa'
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
};

/**
 * مكون لإضافة البيانات المنظمة للمشاريع
 * يساعد محركات البحث في فهم محتوى المشروع
 */
export const ProjectStructuredData: React.FC<ProjectStructuredDataProps> = ({ 
  name, 
  description, 
  datePublished, 
  author,
  category
}) => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Project',
    name,
    description,
    datePublished,
    author: {
      '@type': 'Person',
      name: author
    },
    ...(category && { category })
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
};

/**
 * مكون لإضافة البيانات المنظمة للصفحة
 * يساعد محركات البحث في فهم محتوى الصفحة
 */
export const WebpageStructuredData: React.FC<WebpageStructuredDataProps> = ({ 
  name, 
  description, 
  url 
}) => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    description,
    url
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
};

/**
 * مكون لإضافة بيانات منظمة لمسار التنقل
 * يساعد محركات البحث في فهم تسلسل التنقل في الموقع
 */
export const BreadcrumbStructuredData: React.FC<BreadcrumbStructuredDataProps> = ({ items }) => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
};

/**
 * مكون لإضافة بيانات منظمة لصفحة الاتصال
 * يساعد محركات البحث في فهم معلومات الاتصال
 */
export const ContactPageStructuredData: React.FC<{url: string}> = ({ url }) => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    url,
    description: 'صفحة الاتصال بمنصة لينكتك - تواصل معنا لأي استفسارات',
    mainEntity: {
      '@type': 'Organization',
      name: 'لينكتك',
      email: 'contact@linktech.app',
      telephone: '+966000000000',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'SA',
        addressLocality: 'الرياض',
        addressRegion: 'الرياض'
      }
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
};

/**
 * مكون لإضافة بيانات منظمة للأسئلة الشائعة
 * يساعد محركات البحث في فهم الأسئلة والأجوبة المتوفرة
 */
export const FAQStructuredData: React.FC<FAQStructuredDataProps> = ({ questions }) => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map(q => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer
      }
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
};