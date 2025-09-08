import { Helmet } from "react-helmet";

/**
 * مكون ArticleSchema لإضافة البيانات المنظمة للمقالات
 * يحسن ظهور المقالات في نتائج محركات البحث عن طريق إضافة الوصف الهيكلي
 * مع معلومات المؤلف وتواريخ النشر والتعديل
 */
interface ArticleSchemaProps {
  title: string;
  description: string;
  image?: string;
  url: string;
  authorName: string;
  publishDate: string; // ISO format date string: YYYY-MM-DD
  modifiedDate?: string; // ISO format date string: YYYY-MM-DD
  categoryName?: string;
  tags?: string[];
  siteUrl?: string;
  siteName?: string;
  logoUrl?: string;
}

const ArticleSchema = ({
  title,
  description,
  image,
  url,
  authorName,
  publishDate,
  modifiedDate,
  categoryName,
  tags = [],
  siteUrl = "https://linktech.app",
  siteName = "لينكتك - منصة لربط رواد الأعمال بشركات التطوير التقني",
  logoUrl = "https://linktech.app/logo.png"
}: ArticleSchemaProps) => {
  // إنشاء الوصف الهيكلي للمقال وفق معايير Schema.org
  const articleSchema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": description,
    "image": image,
    "datePublished": publishDate,
    "dateModified": modifiedDate || publishDate,
    "author": {
      "@type": "Person",
      "name": authorName
    },
    "publisher": {
      "@type": "Organization",
      "name": siteName,
      "logo": {
        "@type": "ImageObject",
        "url": logoUrl
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url
    },
    "url": url
  };

  // إضافة الفئة إذا كانت متوفرة
  if (categoryName) {
    articleSchema.articleSection = categoryName;
  }

  // إضافة الوسوم إذا كانت متوفرة
  if (tags.length > 0) {
    articleSchema.keywords = tags.join(",");
  }

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(articleSchema)}
      </script>
    </Helmet>
  );
};

export default ArticleSchema;