import React from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Code, 
  Shield, 
  Clock, 
  Users, 
  Trophy,
  CheckCircle,
  ArrowLeft,
  Star,
  Globe,
  Smartphone,
  Database,
  Cloud,
  Zap,
  Target,
  HeadphonesIcon,
  Award
} from 'lucide-react';
import { Link } from 'wouter';

const CompaniesLanding = () => {
  const services = [
    {
      icon: <Globe className="h-8 w-8 text-blue-500" />,
      title: "تطوير المواقع الإلكترونية",
      description: "مواقع متجاوبة وسريعة باستخدام أحدث التقنيات",
      features: ["تصميم متجاوب", "سرعة عالية", "SEO محسن", "لوحة تحكم"]
    },
    {
      icon: <Smartphone className="h-8 w-8 text-green-500" />,
      title: "تطبيقات الهاتف المحمول",
      description: "تطبيقات iOS و Android بجودة عالية وأداء ممتاز",
      features: ["نظامين iOS/Android", "واجهة سهلة", "أمان عالي", "تحديثات دورية"]
    },
    {
      icon: <Database className="h-8 w-8 text-purple-500" />,
      title: "أنظمة إدارة البيانات",
      description: "حلول ذكية لإدارة وتحليل البيانات بكفاءة",
      features: ["قواعد بيانات متقدمة", "تحليلات ذكية", "تقارير تفصيلية", "نسخ احتياطي"]
    },
    {
      icon: <Cloud className="h-8 w-8 text-orange-500" />,
      title: "الحلول السحابية",
      description: "بنية تحتية سحابية آمنة وقابلة للتوسع",
      features: ["استضافة سحابية", "حماية متقدمة", "نسخ احتياطي", "دعم فني 24/7"]
    }
  ];

  const benefits = [
    {
      icon: <Shield className="h-6 w-6 text-green-500" />,
      title: "أمان وموثوقية",
      description: "جميع الشركات معتمدة ومراجعة بعناية"
    },
    {
      icon: <Clock className="h-6 w-6 text-blue-500" />,
      title: "توفير الوقت",
      description: "عملية سريعة ومباشرة للعثور على الشركة المناسبة"
    },
    {
      icon: <Trophy className="h-6 w-6 text-purple-500" />,
      title: "جودة عالية",
      description: "شركات ذات خبرة مثبتة ومشاريع ناجحة"
    },
    {
      icon: <HeadphonesIcon className="h-6 w-6 text-orange-500" />,
      title: "دعم متكامل",
      description: "مساعدة في كل مرحلة من مراحل المشروع"
    }
  ];

  const testimonials = [
    {
      name: "شركة الرياض للتجارة",
      role: "مدير التقنية",
      content: "وجدنا الشريك التقني المثالي لتطوير منصتنا الإلكترونية. النتائج فاقت توقعاتنا.",
      rating: 5
    },
    {
      name: "مؤسسة النخبة الطبية",
      role: "المدير التنفيذي",
      content: "تطبيق إدارة المرضى الذي طوروه لنا وفر علينا الكثير من الوقت والجهد.",
      rating: 5
    },
    {
      name: "معهد التعليم المتقدم",
      role: "مدير التطوير",
      content: "منصة التعلم الإلكتروني التي حصلنا عليها من هنا غيرت طريقة عملنا بالكامل.",
      rating: 5
    }
  ];

  const stats = [
    { number: "500+", label: "شركة معتمدة" },
    { number: "2000+", label: "مشروع منجز" },
    { number: "98%", label: "رضا العملاء" },
    { number: "24/7", label: "دعم فني" }
  ];

  return (
    <>
      <Helmet>
        <title>خدمات البرمجة للشركات والمؤسسات - لينكتك</title>
        <meta name="description" content="احصل على أفضل خدمات تطوير البرمجيات لشركتك من شركات متخصصة ومعتمدة. تطوير مواقع، تطبيقات، أنظمة إدارة وحلول تقنية متكاملة." />
        <meta name="keywords" content="خدمات برمجة للشركات, تطوير مواقع للشركات, تطبيقات الشركات, أنظمة إدارة, حلول تقنية" />
      </Helmet>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-40 h-40 bg-blue-300 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-white/20 text-white border-white/30">
              للشركات والمؤسسات
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              حلول برمجية متكاملة
              <br />
              <span className="text-blue-300">لنمو أعمالك</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 leading-relaxed">
              احصل على أفضل الحلول التقنية من شركات البرمجة المعتمدة. 
              من تطوير المواقع إلى التطبيقات والأنظمة المتقدمة.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50 px-8 py-4 text-lg">
                  ابدأ مشروعك الآن
                  <ArrowLeft className="h-5 w-5 mr-2" />
                </Button>
              </Link>
              <Link href="/projects">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg">
                  تصفح المشاريع
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              خدماتنا التقنية
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              نوفر لك مجموعة شاملة من الخدمات التقنية لتلبية جميع احتياجات شركتك الرقمية
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    {service.icon}
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    {service.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              لماذا تختار منصتنا؟
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              نوفر لك بيئة آمنة وموثوقة للعثور على أفضل شركات البرمجة
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center bg-white p-8 rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center mx-auto mb-4">
                  {benefit.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-gray-600 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              كيف نعمل معك؟
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              عملية بسيطة ومباشرة من الفكرة إلى التنفيذ
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "اشرح مشروعك",
                description: "صف احتياجاتك وأهدافك بوضوح"
              },
              {
                step: "2", 
                title: "احصل على عروض",
                description: "تلقى عروض من أفضل الشركات المختصة"
              },
              {
                step: "3",
                title: "اختر الشريك",
                description: "قارن واختر الشركة الأنسب لمشروعك"
              },
              {
                step: "4",
                title: "ابدأ التنفيذ",
                description: "راقب التقدم واحصل على النتائج"
              }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-2xl mx-auto mb-6">
                  {item.step}
                </div>
                <h3 className="font-bold text-gray-900 mb-3 text-lg">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              ما يقوله عملاؤنا
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              آراء الشركات التي وثقت بنا واختارت خدماتنا
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg bg-white">
                <CardContent className="p-8">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <div className="font-bold text-gray-900">{testimonial.name}</div>
                    <div className="text-gray-600 text-sm">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            جاهز لبدء مشروعك التقني؟
          </h2>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            انضم إلى مئات الشركات التي وثقت بنا لتطوير حلولها التقنية
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg">
                ابدأ الآن مجاناً
                <ArrowLeft className="h-5 w-5 mr-2" />
              </Button>
            </Link>
            <Link href="/projects">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg">
                تصفح الشركات
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default CompaniesLanding;