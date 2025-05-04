import { useState, useEffect } from "react";
import { Link, useParams, useLocation } from "wouter";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { 
  Calendar, 
  User, 
  Clock, 
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  Link as LinkIcon, 
  ArrowLeft,
  MessageCircle,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LazyImage } from "@/components/ui/lazy-image";
import SEO from "@/components/seo/SEO";
import ArticleSchema from "@/components/seo/ArticleSchema";
import { BreadcrumbStructuredData } from "@/components/seo/StructuredData";

// نفس بيانات المقالات المستخدمة في صفحة الفهرس
const DUMMY_POSTS = [
  {
    id: 1,
    title: "كيف تختار شركة برمجة موثوقة لمشروعك التقني",
    slug: "how-to-choose-reliable-development-company",
    excerpt: "دليل شامل لاختيار شركة برمجة موثوقة لتنفيذ مشروعك التقني بنجاح، مع النصائح والمعايير الأساسية التي يجب مراعاتها",
    content: `
      <p>تعتبر عملية اختيار شركة برمجة مناسبة لتنفيذ مشروعك التقني من أهم الخطوات التي ستؤثر على نجاح مشروعك بشكل مباشر. في هذا المقال، سنستعرض الخطوات والمعايير الأساسية التي يجب عليك مراعاتها عند اختيار شركة برمجة موثوقة.</p>
      
      <h2>حدد احتياجات مشروعك بوضوح</h2>
      <p>قبل البدء في البحث عن شركة برمجة، من الضروري أن تكون لديك رؤية واضحة عن مشروعك وأهدافه. حدد المتطلبات الفنية والوظيفية بشكل دقيق، وضع ميزانية تقديرية وجدولًا زمنيًا متوقعًا للتنفيذ.</p>
      
      <h2>ابحث عن الخبرة في مجال مشروعك</h2>
      <p>تأكد من أن الشركة لديها خبرة سابقة في تنفيذ مشاريع مشابهة لمشروعك. اطلب الاطلاع على حالات دراسية ومشاريع سابقة في نفس المجال، واستفسر عن التحديات التي واجهتها وكيف تمكنت من حلها.</p>
      
      <h2>تحقق من سمعة الشركة</h2>
      <p>ابحث عن تقييمات وآراء العملاء السابقين. يمكنك الاطلاع على منصات التقييم مثل Clutch وGoodFirms، أو طلب التواصل مع عملاء سابقين للشركة للتحقق من جودة العمل ومستوى الالتزام بالمواعيد.</p>
      
      <h2>تأكد من التواصل الفعال</h2>
      <p>التواصل الجيد من أهم عوامل نجاح المشروع. تأكد من أن الشركة لديها آليات واضحة للتواصل، وأنها تستجيب بسرعة لاستفساراتك خلال مرحلة المناقشات الأولية.</p>
      
      <h2>اسأل عن منهجية العمل</h2>
      <p>استفسر عن منهجية التطوير التي تتبعها الشركة (مثل Agile أو Waterfall)، وكيف سيتم إشراكك في مراحل التطوير المختلفة، وطريقة إدارة المشروع وتوزيع المهام.</p>
      
      <h2>ناقش حقوق الملكية والأمان</h2>
      <p>تأكد من وضوح الاتفاقيات المتعلقة بحقوق الملكية الفكرية للمشروع، وكيف سيتم حماية بيانات المشروع، وما هي إجراءات الأمان المتبعة لحماية الكود والبيانات.</p>
      
      <h2>قارن العروض بعناية</h2>
      <p>لا تختر العرض الأرخص دائمًا. قارن بين العروض من حيث الجودة والمدة الزمنية والتكلفة والدعم ما بعد التنفيذ. اختر العرض الذي يقدم أفضل قيمة مقابل المال.</p>
      
      <h2>تحقق من سياسة الدعم والصيانة</h2>
      <p>استفسر عن خدمات الدعم الفني والصيانة بعد إطلاق المشروع. هل هناك فترة ضمان؟ ما هي تكلفة التحديثات والصيانة المستقبلية؟</p>
      
      <h2>خاتمة</h2>
      <p>اختيار شركة البرمجة المناسبة يتطلب وقتًا وجهدًا في البحث والتقييم، لكنه استثمار يستحق العناء لضمان نجاح مشروعك التقني. من خلال اتباع النصائح السابقة، ستتمكن من اتخاذ قرار مدروس واختيار الشريك المناسب لتنفيذ رؤيتك التقنية.</p>
    `,
    featuredImage: "https://picsum.photos/id/1/800/400",
    publishedAt: "2023-08-15T09:30:00",
    author: {
      name: "محمد أحمد",
      slug: "mohamed-ahmed",
      avatar: "https://i.pravatar.cc/150?img=33",
      bio: "مطور برمجيات ومستشار تقني بخبرة 10 سنوات في مجال تطوير الويب وتطبيقات الجوال"
    },
    category: {
      name: "نصائح تقنية",
      slug: "tech-tips"
    },
    tags: ["شركات برمجة", "مشاريع تقنية", "اختيار المطور"],
    readTime: 7, // الوقت التقديري للقراءة بالدقائق
    viewsCount: 1250,
    commentsCount: 8,
    relatedPosts: [3, 5, 6]
  },
  {
    id: 2,
    title: "10 اتجاهات تقنية ستغير مستقبل تطوير البرمجيات في 2024",
    slug: "tech-trends-2024",
    excerpt: "استعراض لأهم 10 اتجاهات تقنية من المتوقع أن تحدث تغييرات جذرية في مجال تطوير البرمجيات خلال العام القادم",
    content: "...",
    featuredImage: "https://picsum.photos/id/2/800/400",
    publishedAt: "2023-09-20T10:15:00",
    author: {
      name: "سارة العتيبي",
      slug: "sara-alotaibi",
      avatar: "https://i.pravatar.cc/150?img=32",
      bio: "باحثة في مجال الذكاء الاصطناعي وكاتبة متخصصة في التقنيات الناشئة"
    },
    category: {
      name: "اتجاهات تقنية",
      slug: "tech-trends"
    },
    tags: ["تطوير البرمجيات", "تقنيات جديدة", "اتجاهات"],
    readTime: 10,
    viewsCount: 2400,
    commentsCount: 15,
    relatedPosts: [1, 5, 6]
  },
  {
    id: 3,
    title: "دليل شامل لإطلاق متجرك الإلكتروني بنجاح",
    slug: "ecommerce-launch-guide",
    excerpt: "خطوات عملية لإطلاق متجر إلكتروني ناجح من الصفر، بدءًا من اختيار المنصة وحتى استراتيجيات التسويق",
    content: "...",
    featuredImage: "https://picsum.photos/id/3/800/400",
    publishedAt: "2023-10-05T14:20:00",
    author: {
      name: "خالد الفهد",
      slug: "khaled-alfahd",
      avatar: "https://i.pravatar.cc/150?img=12",
      bio: "مستشار في التجارة الإلكترونية والتسويق الرقمي مع خبرة في إدارة المشاريع التقنية"
    },
    category: {
      name: "التجارة الإلكترونية",
      slug: "ecommerce"
    },
    tags: ["متاجر إلكترونية", "تجارة إلكترونية", "دليل عملي"],
    readTime: 12,
    viewsCount: 1800,
    commentsCount: 6,
    relatedPosts: [1, 4, 5]
  },
  {
    id: 4,
    title: "أهمية تطبيقات الجوال لنمو الأعمال التجارية",
    slug: "mobile-apps-business-growth",
    excerpt: "كيف يمكن لتطبيقات الهاتف المحمول أن تساهم في نمو الأعمال التجارية وتعزيز تواصلها مع العملاء بشكل أكثر فعالية",
    content: "...",
    featuredImage: "https://picsum.photos/id/4/800/400",
    publishedAt: "2023-10-18T11:45:00",
    author: {
      name: "نورة الشمري",
      slug: "noura-alshammari",
      avatar: "https://i.pravatar.cc/150?img=29",
      bio: "مطورة تطبيقات ومستشارة في استراتيجيات الأعمال الرقمية"
    },
    category: {
      name: "تطبيقات الجوال",
      slug: "mobile-apps"
    },
    tags: ["تطبيقات الجوال", "تطوير الأعمال", "تسويق رقمي"],
    readTime: 8,
    viewsCount: 1500,
    commentsCount: 4,
    relatedPosts: [3, 5, 6]
  },
  {
    id: 5,
    title: "5 أخطاء شائعة يجب تجنبها عند تطوير موقعك الإلكتروني",
    slug: "common-website-development-mistakes",
    excerpt: "تعرف على الأخطاء الشائعة التي يقع فيها أصحاب المشاريع عند تطوير مواقعهم الإلكترونية وكيفية تجنبها لتحسين أداء الموقع",
    content: "...",
    featuredImage: "https://picsum.photos/id/5/800/400",
    publishedAt: "2023-11-02T13:10:00",
    author: {
      name: "أحمد السعيد",
      slug: "ahmed-alsaeed",
      avatar: "https://i.pravatar.cc/150?img=11",
      bio: "مطور ويب بخبرة 8 سنوات في تصميم وتطوير المواقع الإلكترونية وتحسين تجربة المستخدم"
    },
    category: {
      name: "تطوير الويب",
      slug: "web-development"
    },
    tags: ["تطوير مواقع", "أخطاء شائعة", "تحسين الأداء"],
    readTime: 6,
    viewsCount: 1900,
    commentsCount: 12,
    relatedPosts: [1, 3, 6]
  },
  {
    id: 6,
    title: "كيفية اختيار أفضل استراتيجية لتسويق تطبيقك",
    slug: "app-marketing-strategy",
    excerpt: "دليل شامل لاختيار استراتيجية التسويق المناسبة لتطبيقك الجديد لتحقيق أقصى انتشار وتحميلات بين المستخدمين المستهدفين",
    content: "...",
    featuredImage: "https://picsum.photos/id/6/800/400",
    publishedAt: "2023-11-15T15:30:00",
    author: {
      name: "محمد أحمد",
      slug: "mohamed-ahmed",
      avatar: "https://i.pravatar.cc/150?img=33",
      bio: "مطور برمجيات ومستشار تقني بخبرة 10 سنوات في مجال تطوير الويب وتطبيقات الجوال"
    },
    category: {
      name: "تسويق رقمي",
      slug: "digital-marketing"
    },
    tags: ["تسويق التطبيقات", "استراتيجيات تسويقية", "التحميلات"],
    readTime: 9,
    viewsCount: 1350,
    commentsCount: 5,
    relatedPosts: [1, 2, 4]
  }
];

// بيانات التعليقات
const DUMMY_COMMENTS = [
  {
    id: 1,
    postId: 1,
    author: "أحمد خالد",
    avatar: "https://i.pravatar.cc/150?img=1",
    content: "مقال رائع ومفيد جدًا! لقد ساعدني كثيرًا في اختيار شركة مناسبة لمشروعي. أتمنى لو كان هناك المزيد من التفاصيل حول كيفية التفاوض على السعر.",
    createdAt: "2023-08-16T14:30:00",
    likes: 5
  },
  {
    id: 2,
    postId: 1,
    author: "سارة الأحمد",
    avatar: "https://i.pravatar.cc/150?img=2",
    content: "شكرا على هذه المعلومات القيمة. هل يمكنك تقديم نصائح إضافية حول كيفية التعامل مع الشركات الأجنبية مقارنة بالشركات المحلية؟",
    createdAt: "2023-08-17T10:20:00",
    likes: 3
  },
  {
    id: 3,
    postId: 1,
    author: "فهد المالكي",
    avatar: "https://i.pravatar.cc/150?img=3",
    content: "اتبعت هذه النصائح وتمكنت من العثور على شركة مناسبة. النقطة المتعلقة بالتحقق من المشاريع السابقة كانت مفيدة بشكل خاص!",
    createdAt: "2023-08-20T18:45:00",
    likes: 7
  }
];

// هذا هو مكون تعليق فردي
const CommentItem = ({ comment }: { comment: typeof DUMMY_COMMENTS[0] }) => {
  return (
    <div className="border-b border-neutral-200 pb-6 mb-6 last:border-0 last:mb-0 last:pb-0">
      <div className="flex items-start gap-4">
        <img
          src={comment.avatar}
          alt={comment.author}
          className="w-10 h-10 rounded-full"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold">{comment.author}</h4>
            <span className="text-xs text-neutral-500">
              {format(new Date(comment.createdAt), 'dd MMMM yyyy', { locale: ar })}
            </span>
          </div>
          <p className="text-neutral-700">{comment.content}</p>
        </div>
      </div>
    </div>
  );
};

// مكون نموذج التعليق
const CommentForm = () => {
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // هنا سيتم إرسال التعليق إلى الخادم
    alert(`تم استلام تعليقك بنجاح!`);
    setComment("");
    setName("");
    setEmail("");
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-xl font-bold mb-4">إضافة تعليق</h3>
      <div className="space-y-4">
        <Textarea
          placeholder="اكتب تعليقك هنا..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-32"
          required
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="الاسم"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            type="email"
            placeholder="البريد الإلكتروني"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>
      <Button type="submit" className="flex items-center gap-2">
        <Send className="h-4 w-4" />
        إرسال التعليق
      </Button>
    </form>
  );
};

// مكون بطاقة مقال ذات صلة
const RelatedPostCard = ({ post }: { post: typeof DUMMY_POSTS[0] }) => {
  return (
    <article className="bg-white rounded-lg overflow-hidden border border-neutral-200 hover:shadow-md transition-shadow">
      <Link href={`/blog/${post.slug}`} className="block">
        <div className="h-40 overflow-hidden">
          <LazyImage
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-full object-cover transition-transform hover:scale-105"
          />
        </div>
      </Link>
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 line-clamp-2">
          <Link href={`/blog/${post.slug}`} className="hover:text-primary">
            {post.title}
          </Link>
        </h3>
        <div className="flex items-center text-sm text-neutral-500">
          <Calendar className="h-4 w-4 ml-1" />
          <span>{format(new Date(post.publishedAt), 'dd MMMM yyyy', { locale: ar })}</span>
        </div>
      </div>
    </article>
  );
};

const BlogPostPage = () => {
  const [, setLocation] = useLocation();
  const { slug } = useParams();
  const [post, setPost] = useState<typeof DUMMY_POSTS[0] | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<typeof DUMMY_POSTS>([]);
  const [comments, setComments] = useState<typeof DUMMY_COMMENTS>([]);
  
  // محاكاة جلب البيانات
  useEffect(() => {
    // البحث عن المقال
    const foundPost = DUMMY_POSTS.find(p => p.slug === slug);
    if (foundPost) {
      setPost(foundPost);
      
      // جلب المقالات ذات الصلة
      const related = DUMMY_POSTS.filter(p => 
        foundPost.relatedPosts.includes(p.id)
      );
      setRelatedPosts(related);
      
      // جلب التعليقات
      const postComments = DUMMY_COMMENTS.filter(c => c.postId === foundPost.id);
      setComments(postComments);
    } else {
      // إذا لم يتم العثور على المقال، توجيه المستخدم إلى صفحة 404
      setLocation("/not-found");
    }
  }, [slug, setLocation]);
  
  if (!post) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="جاري التحميل..."/>
      </div>
    );
  }
  
  return (
    <>
      <SEO
        title={post.title + " | مدونة لينكتك"}
        description={post.excerpt}
        keywords={post.tags.join(", ")}
        ogImage={post.featuredImage}
      >
        <ArticleSchema
          title={post.title}
          description={post.excerpt}
          url={`https://linktech.app/blog/${post.slug}`}
          imageUrl={post.featuredImage}
          datePublished={post.publishedAt}
          authorName={post.author.name}
          authorUrl={`https://linktech.app/blog/author/${post.author.slug}`}
          publisherName="لينكتك"
          publisherLogo="https://linktech.app/images/logo.svg"
          keywords={post.tags}
          categoryName={post.category.name}
        />
        <BreadcrumbStructuredData
          items={[
            { name: "الرئيسية", url: "https://linktech.app/" },
            { name: "المدونة", url: "https://linktech.app/blog" },
            { name: post.title, url: `https://linktech.app/blog/${post.slug}` }
          ]}
        />
      </SEO>

      <div className="container mx-auto px-4 py-12">
        <div className="mb-6">
          <Link href="/blog" className="text-primary hover:text-primary-dark inline-flex items-center">
            <ArrowLeft className="ml-1 h-4 w-4 rtl-flip" />
            العودة إلى المدونة
          </Link>
        </div>
        
        <div className="max-w-4xl mx-auto">
          {/* التنقل التسلسلي */}
          <nav className="flex text-sm text-neutral-600 mb-6" aria-label="التنقل التسلسلي">
            <ol className="flex rtl space-x-2 space-x-reverse">
              <li><Link href="/" className="hover:text-primary hover:underline">الرئيسية</Link></li>
              <li className="before:content-['/'] before:mx-2"><Link href="/blog" className="hover:text-primary hover:underline">المدونة</Link></li>
              <li className="before:content-['/'] before:mx-2 font-semibold">{post.title}</li>
            </ol>
          </nav>
          
          {/* عنوان المقال */}
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {post.title}
          </h1>
          
          {/* معلومات المقال */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 mb-6 text-sm text-neutral-600">
            <div className="flex items-center">
              <User className="h-4 w-4 ml-1" />
              <Link href={`/blog/author/${post.author.slug}`} className="hover:text-primary">
                {post.author.name}
              </Link>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 ml-1" />
              <span>{format(new Date(post.publishedAt), 'dd MMMM yyyy', { locale: ar })}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 ml-1" />
              <span>{post.readTime} دقائق للقراءة</span>
            </div>
            <div className="flex items-center">
              <MessageCircle className="h-4 w-4 ml-1" />
              <span>{post.commentsCount} تعليقات</span>
            </div>
          </div>
          
          {/* الفئة والوسوم */}
          <div className="flex flex-wrap gap-2 mb-8">
            <Link href={`/blog/category/${post.category.slug}`}>
              <Badge className="bg-primary/10 text-primary border-primary/30 hover:bg-primary/20">
                {post.category.name}
              </Badge>
            </Link>
            {post.tags.map((tag, index) => (
              <Link key={index} href={`/blog/tag/${tag.replace(/ /g, '-')}`}>
                <Badge variant="outline" className="hover:border-primary hover:text-primary">
                  {tag}
                </Badge>
              </Link>
            ))}
          </div>
          
          {/* صورة المقال */}
          <div className="mb-8 rounded-xl overflow-hidden">
            <LazyImage
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-auto"
            />
          </div>
          
          {/* محتوى المقال */}
          <div className="prose prose-lg max-w-none mb-10 blog-content" dangerouslySetInnerHTML={{ __html: post.content }} />
          
          {/* أزرار المشاركة */}
          <div className="border-t border-b border-neutral-200 py-6 mb-10">
            <div className="flex items-center justify-between">
              <span className="font-bold">مشاركة المقال:</span>
              <div className="flex gap-3">
                <button className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center hover:bg-primary/10 transition-colors">
                  <Facebook className="h-5 w-5 text-neutral-700" />
                </button>
                <button className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center hover:bg-primary/10 transition-colors">
                  <Twitter className="h-5 w-5 text-neutral-700" />
                </button>
                <button className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center hover:bg-primary/10 transition-colors">
                  <Linkedin className="h-5 w-5 text-neutral-700" />
                </button>
                <button className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center hover:bg-primary/10 transition-colors">
                  <LinkIcon className="h-5 w-5 text-neutral-700" />
                </button>
              </div>
            </div>
          </div>
          
          {/* معلومات الكاتب */}
          <div className="bg-neutral-50 rounded-xl p-6 mb-10 flex flex-col md:flex-row gap-4 items-center md:items-start">
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-20 h-20 rounded-full"
            />
            <div>
              <h3 className="font-bold text-xl mb-2">{post.author.name}</h3>
              <p className="text-neutral-600 mb-4">{post.author.bio}</p>
              <Link href={`/blog/author/${post.author.slug}`} className="text-primary hover:text-primary-dark inline-flex items-center">
                عرض جميع المقالات
                <ArrowLeft className="mr-1 h-4 w-4 rtl-flip" />
              </Link>
            </div>
          </div>
          
          {/* المقالات ذات الصلة */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6 pb-2 border-b border-neutral-200">مقالات ذات صلة</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((post) => (
                <RelatedPostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
          
          {/* قسم التعليقات */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-6 pb-2 border-b border-neutral-200">
              التعليقات ({comments.length})
            </h2>
            
            {comments.length > 0 ? (
              <div className="mb-10">
                {comments.map((comment) => (
                  <CommentItem key={comment.id} comment={comment} />
                ))}
              </div>
            ) : (
              <p className="text-neutral-600 mb-10">لا توجد تعليقات حتى الآن. كن أول من يعلق!</p>
            )}
            
            <CommentForm />
          </div>
        </div>
      </div>
    </>
  );
};

export default BlogPostPage;