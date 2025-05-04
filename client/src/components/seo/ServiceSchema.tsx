import { Helmet } from "react-helmet";

interface ServiceSchemaProps {
  name: string;
  description: string;
  url: string;
  provider: string;
  providerUrl: string;
  imageUrl?: string;
  serviceArea?: string;
  price?: {
    amount: number;
    currency: string;
  };
}

/**
 * مكون ServiceSchema 
 * ينشئ بيانات منظمة لنوع Service حسب معايير schema.org
 * لتحسين ظهور معلومات الخدمة في نتائج البحث
 */
const ServiceSchema = ({
  name,
  description,
  url,
  provider,
  providerUrl,
  imageUrl,
  serviceArea = "المملكة العربية السعودية",
  price
}: ServiceSchemaProps) => {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": name,
    "description": description,
    "url": url,
    "provider": {
      "@type": "Organization",
      "name": provider,
      "url": providerUrl
    },
    "areaServed": serviceArea,
    ...(imageUrl && { "image": imageUrl }),
    ...(price && {
      "offers": {
        "@type": "Offer",
        "price": price.amount,
        "priceCurrency": price.currency
      }
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

export default ServiceSchema;