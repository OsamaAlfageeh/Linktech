import { useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Search, Calendar, User, Tag, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { LazyImage } from "@/components/ui/lazy-image";
import SEO from "@/components/seo/SEO";
import { WebpageStructuredData, BreadcrumbStructuredData } from "@/components/seo/StructuredData";

// هذه البيانات ستأتي من الخادم في التطبيق الحقيقي
const DUMMY_POSTS = [
  {
    id: 1,
    title: "كيف تختار شركة برمجة موثوقة لمشروعك التقني",
    slug: "how-to-choose-reliable-development-company",
    excerpt: "دليل شامل لاختيار شركة برمجة موثوقة لتنفيذ مشروعك التقني بنجاح، مع النصائح والمعايير الأساسية التي يجب مراعاتها",
    featuredImage: "https://picsum.photos/id/1/600/300",
    publishedAt: "2023-08-15T09:30:00",
    author: {
      name: "محمد أحمد",
      slug: "mohamed-ahmed"
    },
    category: {
      name: "نصائح تقنية",
      slug: "tech-tips"
    },
    tags: ["شركات برمجة", "مشاريع تقنية", "اختيار المطور"]
  },
  {
    id: 2,
    title: "10 اتجاهات تقنية ستغير مستقبل تطوير البرمجيات في 2024",
    slug: "tech-trends-2024",
    excerpt: "استعراض لأهم 10 اتجاهات تقنية من المتوقع أن تحدث تغييرات جذرية في مجال تطوير البرمجيات خلال العام القادم",
    featuredImage: "https://picsum.photos/id/2/600/300",
    publishedAt: "2023-09-20T10:15:00",
    author: {
      name: "سارة العتيبي",
      slug: "sara-alotaibi"
    },
    category: {
      name: "اتجاهات تقنية",
      slug: "tech-trends"
    },
    tags: ["تطوير البرمجيات", "تقنيات جديدة", "اتجاهات"]
  },
  {
    id: 3,
    title: "دليل شامل لإطلاق متجرك الإلكتروني بنجاح",
    slug: "ecommerce-launch-guide",
    excerpt: "خطوات عملية لإطلاق متجر إلكتروني ناجح من الصفر، بدءًا من اختيار المنصة وحتى استراتيجيات التسويق",
    featuredImage: "https://picsum.photos/id/3/600/300",
    publishedAt: "2023-10-05T14:20:00",
    author: {
      name: "خالد الفهد",
      slug: "khaled-alfahd"
    },
    category: {
      name: "التجارة الإلكترونية",
      slug: "ecommerce"
    },
    tags: ["متاجر إلكترونية", "تجارة إلكترونية", "دليل عملي"]
  },
  {
    id: 4,
    title: "أهمية تطبيقات الجوال لنمو الأعمال التجارية",
    slug: "mobile-apps-business-growth",
    excerpt: "كيف يمكن لتطبيقات الهاتف المحمول أن تساهم في نمو الأعمال التجارية وتعزيز تواصلها مع العملاء بشكل أكثر فعالية",
    featuredImage: "https://picsum.photos/id/4/600/300",
    publishedAt: "2023-10-18T11:45:00",
    author: {
      name: "نورة الشمري",
      slug: "noura-alshammari"
    },
    category: {
      name: "تطبيقات الجوال",
      slug: "mobile-apps"
    },
    tags: ["تطبيقات الجوال", "تطوير الأعمال", "تسويق رقمي"]
  },
  {
    id: 5,
    title: "5 أخطاء شائعة يجب تجنبها عند تطوير موقعك الإلكتروني",
    slug: "common-website-development-mistakes",
    excerpt: "تعرف على الأخطاء الشائعة التي يقع فيها أصحاب المشاريع عند تطوير مواقعهم الإلكترونية وكيفية تجنبها لتحسين أداء الموقع",
    featuredImage: "https://picsum.photos/id/5/600/300",
    publishedAt: "2023-11-02T13:10:00",
    author: {
      name: "أحمد السعيد",
      slug: "ahmed-alsaeed"
    },
    category: {
      name: "تطوير الويب",
      slug: "web-development"
    },
    tags: ["تطوير مواقع", "أخطاء شائعة", "تحسين الأداء"]
  },
  {
    id: 6,
    title: "كيفية اختيار أفضل استراتيجية لتسويق تطبيقك",
    slug: "app-marketing-strategy",
    excerpt: "دليل شامل لاختيار استراتيجية التسويق المناسبة لتطبيقك الجديد لتحقيق أقصى انتشار وتحميلات بين المستخدمين المستهدفين",
    featuredImage: "https://picsum.photos/id/6/600/300",
    publishedAt: "2023-11-15T15:30:00",
    author: {
      name: "محمد أحمد",
      slug: "mohamed-ahmed"
    },
    category: {
      name: "تسويق رقمي",
      slug: "digital-marketing"
    },
    tags: ["تسويق التطبيقات", "استراتيجيات تسويقية", "التحميلات"]
  }
];

// قائمة الفئات
const CATEGORIES = [
  { name: "نصائح تقنية", slug: "tech-tips", count: 8 },
  { name: "اتجاهات تقنية", slug: "tech-trends", count: 5 },
  { name: "التجارة الإلكترونية", slug: "ecommerce", count: 12 },
  { name: "تطبيقات الجوال", slug: "mobile-apps", count: 7 },
  { name: "تطوير الويب", slug: "web-development", count: 15 },
  { name: "تسويق رقمي", slug: "digital-marketing", count: 9 }
];

// قائمة بأشهر الوسوم
const POPULAR_TAGS = [
  { name: "تطوير البرمجيات", slug: "software-development", count: 18 },
  { name: "تطبيقات الجوال", slug: "mobile-apps", count: 14 },
  { name: "تجارة إلكترونية", slug: "ecommerce", count: 12 },
  { name: "الذكاء الاصطناعي", slug: "ai", count: 9 },
  { name: "تحسين محركات البحث", slug: "seo", count: 7 },
  { name: "تصميم واجهات", slug: "ui-design", count: 6 },
  { name: "تجربة المستخدم", slug: "ux", count: 5 },
  { name: "أمن المعلومات", slug: "cybersecurity", count: 4 }
];

// مكون بطاقة المقال
const BlogPostCard = ({ post }: { post: typeof DUMMY_POSTS[0] }) => {
  return (
    <article className="bg-white rounded-xl overflow-hidden border border-neutral-200 hover:shadow-md transition-shadow">
      <Link href={`/blog/${post.slug}`} className="block">
        <div className="h-48 overflow-hidden">
          <LazyImage
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-full object-cover transition-transform hover:scale-105"
          />
        </div>
      </Link>
      <div className="p-5">
        <div className="flex gap-2 mb-3">
          <Link href={`/blog/category/${post.category.slug}`}>
            <Badge variant="secondary" className="hover:bg-primary/10">
              {post.category.name}
            </Badge>
          </Link>
        </div>
        <h2 className="text-xl font-bold mb-2 line-clamp-2">
          <Link href={`/blog/${post.slug}`} className="hover:text-primary">
            {post.title}
          </Link>
        </h2>
        <p className="text-neutral-600 mb-4 line-clamp-2">
          {post.excerpt}
        </p>
        <div className="flex items-center justify-between text-sm text-neutral-500">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 ml-1" />
            <span>{format(new Date(post.publishedAt), 'dd MMMM yyyy', { locale: ar })}</span>
          </div>
          <div className="flex items-center">
            <User className="h-4 w-4 ml-1" />
            <Link href={`/blog/author/${post.author.slug}`} className="hover:text-primary">
              {post.author.name}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
};

const BlogIndexPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 6;
  
  // التصفية حسب البحث
  const filteredPosts = DUMMY_POSTS.filter(post => 
    searchQuery ? 
      post.title.includes(searchQuery) || 
      post.excerpt.includes(searchQuery) ||
      post.tags.some(tag => tag.includes(searchQuery))
    : true
  );
  
  // الحصول على مقالات الصفحة الحالية
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);
  
  // المقالات الأكثر شعبية
  const popularPosts = [...DUMMY_POSTS].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()).slice(0, 3);
  
  return (
    <>
      <SEO
        title="مدونة لينكتك - مقالات وأدلة في تطوير البرمجيات والتقنية"
        description="استكشف أحدث المقالات والأدلة في مجال تطوير البرمجيات، تطبيقات الجوال، التجارة الإلكترونية، والمزيد من المواضيع التقنية في مدونة لينكتك"
        keywords="مدونة تقنية, تطوير برمجيات, مقالات تقنية, دليل التقنية, تطبيقات الجوال, مدونة لينكتك"
      >
        <WebpageStructuredData
          name="مدونة لينكتك - مقالات وأدلة في تطوير البرمجيات والتقنية"
          description="استكشف أحدث المقالات والأدلة في مجال تطوير البرمجيات، تطبيقات الجوال، التجارة الإلكترونية، والمزيد من المواضيع التقنية"
          url="https://linktech.app/blog"
        />
        <BreadcrumbStructuredData
          items={[
            { name: "الرئيسية", url: "https://linktech.app/" },
            { name: "المدونة", url: "https://linktech.app/blog" }
          ]}
        />
      </SEO>

      <div className="container mx-auto px-4 py-12">
        <div className="mb-6">
          <Link href="/" className="text-primary hover:text-primary-dark inline-flex items-center">
            <ArrowLeft className="ml-1 h-4 w-4 rtl-flip" />
            العودة إلى الرئيسية
          </Link>
        </div>
        
        <div className="max-w-7xl mx-auto">
          {/* التنقل التسلسلي */}
          <nav className="flex text-sm text-neutral-600 mb-6" aria-label="التنقل التسلسلي">
            <ol className="flex rtl space-x-2 space-x-reverse">
              <li><Link href="/" className="hover:text-primary hover:underline">الرئيسية</Link></li>
              <li className="before:content-['/'] before:mx-2 font-semibold">المدونة</li>
            </ol>
          </nav>

          {/* عنوان الصفحة */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">مدونة لينكتك</h1>
            <p className="text-neutral-600 md:text-lg max-w-3xl mx-auto">
              مقالات تقنية حول تطوير البرمجيات، تطبيقات الجوال، التجارة الإلكترونية، وأحدث اتجاهات التكنولوجيا
            </p>
          </div>

          {/* القسم الرئيسي */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* المحتوى الرئيسي */}
            <div className="lg:col-span-2 space-y-8">
              {/* مربع البحث */}
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <Search className="h-5 w-5 text-neutral-400" />
                </div>
                <Input
                  type="text"
                  placeholder="ابحث في المدونة..."
                  className="pr-10 text-right"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* قائمة المقالات */}
              {currentPosts.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {currentPosts.map((post) => (
                    <BlogPostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 border border-dashed border-neutral-300 rounded-xl">
                  <p className="text-lg text-neutral-600 mb-4">لا توجد نتائج مطابقة لـ "{searchQuery}"</p>
                  <Button
                    variant="outline"
                    onClick={() => setSearchQuery("")}
                  >
                    مسح البحث
                  </Button>
                </div>
              )}

              {/* التنقل بين الصفحات */}
              {filteredPosts.length > postsPerPage && (
                <Pagination
                  totalItems={filteredPosts.length}
                  itemsPerPage={postsPerPage}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                />
              )}
            </div>

            {/* الشريط الجانبي */}
            <div className="space-y-8">
              {/* المقالات الشائعة */}
              <div className="bg-white p-6 rounded-xl border border-neutral-200">
                <h2 className="text-xl font-bold mb-4 pb-2 border-b border-neutral-200">أحدث المقالات</h2>
                <div className="space-y-4">
                  {popularPosts.map((post) => (
                    <div key={post.id} className="flex gap-3">
                      <Link href={`/blog/${post.slug}`} className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden">
                        <LazyImage
                          src={post.featuredImage}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </Link>
                      <div>
                        <h3 className="font-medium line-clamp-2 mb-1">
                          <Link href={`/blog/${post.slug}`} className="hover:text-primary">
                            {post.title}
                          </Link>
                        </h3>
                        <p className="text-xs text-neutral-500">
                          {format(new Date(post.publishedAt), 'dd MMMM yyyy', { locale: ar })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* الفئات */}
              <div className="bg-white p-6 rounded-xl border border-neutral-200">
                <h2 className="text-xl font-bold mb-4 pb-2 border-b border-neutral-200">الفئات</h2>
                <ul className="space-y-2">
                  {CATEGORIES.map((category) => (
                    <li key={category.slug}>
                      <Link
                        href={`/blog/category/${category.slug}`}
                        className="flex items-center justify-between hover:text-primary"
                      >
                        <span>{category.name}</span>
                        <span className="text-xs bg-neutral-100 px-2 py-1 rounded-full">
                          {category.count}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* الوسوم الشائعة */}
              <div className="bg-white p-6 rounded-xl border border-neutral-200">
                <h2 className="text-xl font-bold mb-4 pb-2 border-b border-neutral-200">الوسوم الشائعة</h2>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_TAGS.map((tag) => (
                    <Link key={tag.slug} href={`/blog/tag/${tag.slug}`}>
                      <Badge variant="outline" className="hover:border-primary hover:text-primary">
                        {tag.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>

              {/* دعوة للعمل */}
              <div className="bg-primary/10 p-6 rounded-xl border border-primary/20">
                <h2 className="text-lg font-bold mb-2">هل لديك مشروع تقني؟</h2>
                <p className="text-neutral-700 mb-4">
                  اطرح مشروعك واحصل على عروض من أفضل شركات البرمجة في المملكة
                </p>
                <Button asChild>
                  <Link href="/projects/create">
                    نشر مشروع جديد
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BlogIndexPage;