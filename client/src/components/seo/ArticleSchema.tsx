import { Helmet } from "react-helmet";

interface ArticleSchemaProps {
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  datePublished: string;
  dateModified?: string;
  authorName: string;
  authorUrl?: string;
  publisherName: string;
  publisherLogo: string;
  keywords?: string[];
  categoryName?: string;
}

/**
 * مكون ArticleSchema 
 * ينشئ بيانات منظمة لنوع Article حسب معايير schema.org
 * لتحسين ظهور المقالات في نتائج البحث
 */
const ArticleSchema = ({
  title,
  description,
  url,
  imageUrl,
  datePublished,
  dateModified,
  authorName,
  authorUrl,
  publisherName,
  publisherLogo,
  keywords,
  categoryName
}: ArticleSchemaProps) => {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url
    },
    "headline": title,
    "description": description,
    "image": imageUrl,
    "author": {
      "@type": "Person",
      "name": authorName,
      ...(authorUrl && { "url": authorUrl })
    },
    "publisher": {
      "@type": "Organization",
      "name": publisherName,
      "logo": {
        "@type": "ImageObject",
        "url": publisherLogo
      }
    },
    "datePublished": datePublished,
    "dateModified": dateModified || datePublished,
    ...(keywords && { "keywords": keywords.join(", ") }),
    ...(categoryName && { 
      "articleSection": categoryName
    })
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
    </Helmet>
  );
};

export default ArticleSchema;