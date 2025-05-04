import { Helmet } from "react-helmet";

interface StructuredDataProps {
  data: object;
}

/**
 * مكون لإضافة البيانات المنظمة (Structured Data) للصفحات
 * 
 * هذا المكون يستخدم لإضافة JSON-LD لصفحات الموقع لتحسين فهرسة محركات البحث للمحتوى
 */
const StructuredData = ({ data }: StructuredDataProps) => {
  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(data)}
      </script>
    </Helmet>
  );
};

export default StructuredData;

// مولدات البيانات المنظمة للأنواع المختلفة

/**
 * إنشاء بيانات منظمة لصفحة الشركة
 */
export const createOrganizationSchema = (companyData: {
  name: string;
  url: string;
  logo: string;
  description: string;
  email?: string;
  phone?: string;
  address?: {
    streetAddress?: string;
    addressLocality: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry: string;
  };
  socialProfiles?: {
    platform: string;
    url: string;
  }[];
}) => {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": companyData.name,
    "url": companyData.url,
    "logo": companyData.logo,
    "description": companyData.description,
  };

  if (companyData.email) {
    schema.email = companyData.email;
  }

  if (companyData.phone) {
    schema.telephone = companyData.phone;
  }

  if (companyData.address) {
    schema.address = {
      "@type": "PostalAddress",
      "addressLocality": companyData.address.addressLocality,
      "addressCountry": companyData.address.addressCountry,
    };

    if (companyData.address.streetAddress) {
      schema.address.streetAddress = companyData.address.streetAddress;
    }

    if (companyData.address.addressRegion) {
      schema.address.addressRegion = companyData.address.addressRegion;
    }

    if (companyData.address.postalCode) {
      schema.address.postalCode = companyData.address.postalCode;
    }
  }

  if (companyData.socialProfiles && companyData.socialProfiles.length > 0) {
    schema.sameAs = companyData.socialProfiles.map(profile => profile.url);
  }

  return schema;
};

/**
 * إنشاء بيانات منظمة لصفحة المشروع
 */
export const createProjectSchema = (projectData: {
  name: string;
  description: string;
  url: string;
  dateCreated: string;
  author: {
    name: string;
    url: string;
  };
  skills: string[];
  status: string;
}) => {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "name": projectData.name,
    "description": projectData.description,
    "url": projectData.url,
    "dateCreated": projectData.dateCreated,
    "author": {
      "@type": "Person",
      "name": projectData.author.name,
      "url": projectData.author.url
    },
    "keywords": projectData.skills.join(", "),
    "creativeWorkStatus": projectData.status
  };
};

/**
 * إنشاء بيانات منظمة لصفحة الملف الشخصي للمستخدم
 */
export const createPersonSchema = (personData: {
  name: string;
  url: string;
  image?: string;
  description?: string;
  jobTitle?: string;
  worksFor?: {
    name: string;
    url?: string;
  };
  location?: {
    addressLocality: string;
    addressCountry: string;
  };
  socialProfiles?: {
    platform: string;
    url: string;
  }[];
}) => {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": personData.name,
    "url": personData.url,
  };

  if (personData.image) {
    schema.image = personData.image;
  }

  if (personData.description) {
    schema.description = personData.description;
  }

  if (personData.jobTitle) {
    schema.jobTitle = personData.jobTitle;
  }

  if (personData.worksFor) {
    schema.worksFor = {
      "@type": "Organization",
      "name": personData.worksFor.name,
    };

    if (personData.worksFor.url) {
      schema.worksFor.url = personData.worksFor.url;
    }
  }

  if (personData.location) {
    schema.address = {
      "@type": "PostalAddress",
      "addressLocality": personData.location.addressLocality,
      "addressCountry": personData.location.addressCountry,
    };
  }

  if (personData.socialProfiles && personData.socialProfiles.length > 0) {
    schema.sameAs = personData.socialProfiles.map(profile => profile.url);
  }

  return schema;
};

/**
 * إنشاء بيانات منظمة لصفحة جهة الاتصال
 */
export const createContactPageSchema = (contactData: {
  url: string;
  name: string;
  email?: string;
  phone?: string;
  address?: {
    streetAddress?: string;
    addressLocality: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry: string;
  };
}) => {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "url": contactData.url,
    "name": contactData.name,
  };

  if (contactData.email) {
    schema.email = contactData.email;
  }

  if (contactData.phone) {
    schema.telephone = contactData.phone;
  }

  if (contactData.address) {
    schema.address = {
      "@type": "PostalAddress",
      "addressLocality": contactData.address.addressLocality,
      "addressCountry": contactData.address.addressCountry,
    };

    if (contactData.address.streetAddress) {
      schema.address.streetAddress = contactData.address.streetAddress;
    }

    if (contactData.address.addressRegion) {
      schema.address.addressRegion = contactData.address.addressRegion;
    }

    if (contactData.address.postalCode) {
      schema.address.postalCode = contactData.address.postalCode;
    }
  }

  return schema;
};

/**
 * إنشاء بيانات منظمة لموقع الويب بالكامل (للصفحة الرئيسية)
 */
export const createWebsiteSchema = (websiteData: {
  url: string;
  name: string;
  description: string;
  inLanguage: string;
  organization: {
    name: string;
    url: string;
    logo: string;
  };
}) => {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": websiteData.url,
    "name": websiteData.name,
    "description": websiteData.description,
    "inLanguage": websiteData.inLanguage,
    "publisher": {
      "@type": "Organization",
      "name": websiteData.organization.name,
      "url": websiteData.organization.url,
      "logo": {
        "@type": "ImageObject",
        "url": websiteData.organization.logo
      }
    }
  };
};

/**
 * إنشاء بيانات منظمة للأسئلة الشائعة
 */
export const createFAQSchema = (faqData: {
  questions: {
    question: string;
    answer: string;
  }[];
}) => {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqData.questions.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };
};

/**
 * إنشاء بيانات منظمة لروابط التنقل (BreadcrumbList)
 */
export const createBreadcrumbSchema = (breadcrumbData: {
  items: {
    name: string;
    url: string;
  }[];
}) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbData.items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
};