import { ReactNode } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import SEO from "@/components/seo/SEO";
import { WebpageStructuredData, BreadcrumbStructuredData } from "@/components/seo/StructuredData";

interface StaticPageLayoutProps {
  title: string;
  description: string;
  keywords: string;
  breadcrumbs: Array<{ name: string; url: string }>;
  children: ReactNode;
  canonicalUrl?: string;
  structuredData?: ReactNode;
}

const StaticPageLayout = ({
  title,
  description,
  keywords,
  breadcrumbs,
  children,
  canonicalUrl,
  structuredData
}: StaticPageLayoutProps) => {
  // الصفحة الأخيرة في التسلسل هي الصفحة الحالية
  const currentPage = breadcrumbs[breadcrumbs.length - 1];
  
  // استخراج اسم الصفحة من عنوان الصفحة (إزالة اسم الموقع إذا كان موجوداً)
  const pageName = currentPage.name.split('|')[0].trim();
  
  // بناء URL كامل
  const fullUrl = canonicalUrl || `https://linktech.app${currentPage.url}`;

  return (
    <>
      <SEO
        title={title}
        description={description}
        keywords={keywords}
        canonicalUrl={fullUrl}
      >
        <WebpageStructuredData
          name={pageName}
          description={description}
          url={fullUrl}
        />
        <BreadcrumbStructuredData items={breadcrumbs} />
        {structuredData}
      </SEO>

      <div className="container mx-auto px-4 py-12">
        <div className="mb-6">
          <Link href="/" className="text-primary hover:text-primary-dark inline-flex items-center">
            <ArrowLeft className="ml-1 h-4 w-4 rtl-flip" />
            العودة إلى الرئيسية
          </Link>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <nav className="flex text-sm text-neutral-600 mb-6" aria-label="التنقل التسلسلي">
            <ol className="flex rtl space-x-2 space-x-reverse">
              {breadcrumbs.map((item, index) => (
                <li key={index}>
                  {index < breadcrumbs.length - 1 ? (
                    <>
                      <Link href={item.url} className="hover:text-primary hover:underline">
                        {item.name}
                      </Link>
                      <span className="mx-2">/</span>
                    </>
                  ) : (
                    <span className="font-semibold">{item.name}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          {children}
        </div>
      </div>
    </>
  );
};

export default StaticPageLayout;