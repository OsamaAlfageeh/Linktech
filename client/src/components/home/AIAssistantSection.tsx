import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Zap, 
  Target, 
  TrendingUp, 
  FileText, 
  Calculator,
  Clock,
  Shield,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { Link } from 'wouter';

interface AIAssistantSectionProps {
  auth: {
    isAuthenticated: boolean;
    isEntrepreneur: boolean;
    isCompany: boolean;
  };
}

const AIAssistantSection: React.FC<AIAssistantSectionProps> = ({ auth }) => {
  const features = [
    {
      icon: <Brain className="h-6 w-6 text-blue-500" />,
      title: "تحليل ذكي للمشاريع",
      description: "يحلل المساعد الذكي فكرة مشروعك ويقدم تحليلاً تقنياً مفصلاً مع التوصيات المناسبة"
    },
    {
      icon: <Calculator className="h-6 w-6 text-green-500" />,
      title: "تقدير التكلفة الدقيق",
      description: "حساب تكلفة المشروع بناءً على التعقيد التقني والمتطلبات والوقت المتوقع للتنفيذ"
    },
    {
      icon: <Target className="h-6 w-6 text-purple-500" />,
      title: "اختيار التقنيات المناسبة",
      description: "توصيات ذكية لأفضل التقنيات والأدوات المناسبة لنوع مشروعك وأهدافك"
    },
    {
      icon: <Clock className="h-6 w-6 text-orange-500" />,
      title: "جدولة زمنية واقعية",
      description: "تقدير دقيق للوقت المطلوب مع تقسيم المشروع إلى مراحل قابلة للتنفيذ"
    },
    {
      icon: <Shield className="h-6 w-6 text-red-500" />,
      title: "تقييم المخاطر",
      description: "تحديد المخاطر التقنية والزمنية المحتملة مع استراتيجيات التخفيف منها"
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-indigo-500" />,
      title: "تحليل المنافسين",
      description: "دراسة السوق والحلول المشابهة مع تحديد فرص التميز والابتكار"
    }
  ];

  const benefits = [
    "توفير الوقت في مرحلة التخطيط",
    "تجنب الأخطاء التقنية المكلفة",
    "فهم أفضل لمتطلبات المشروع",
    "تحديد الميزانية بدقة",
    "اختيار الشركة المناسبة"
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 right-10 w-32 h-32 bg-blue-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-purple-400 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-indigo-400 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-blue-500" />
            <Badge variant="secondary" className="text-lg px-4 py-2">
              جديد
            </Badge>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            مساعد الذكاء الاصطناعي
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            احصل على تحليل ذكي ومفصل لفكرة مشروعك مع توصيات تقنية دقيقة وتقدير واقعي للتكلفة والوقت
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Left Column - Features */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-8">
              كيف يساعدك المساعد الذكي؟
            </h3>
            <div className="space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="flex gap-4 p-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex-shrink-0 w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">{feature.title}</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Benefits & CTA */}
          <div>
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  ابدأ مع المساعد الذكي
                </CardTitle>
                <CardDescription className="text-gray-600">
                  احصل على تحليل شامل لمشروعك في دقائق معدودة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">ما ستحصل عليه:</h4>
                  <ul className="space-y-3">
                    {benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {auth.isAuthenticated && auth.isEntrepreneur ? (
                  <Link href="/ai-assistant">
                    <Button size="lg" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                      <Zap className="h-5 w-5 ml-2" />
                      جرب المساعد الذكي مجاناً
                    </Button>
                  </Link>
                ) : (
                  <div className="space-y-3">
                    <Link href="/auth/register">
                      <Button size="lg" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                        سجل كرائد أعمال
                        <ArrowLeft className="h-5 w-5 mr-2" />
                      </Button>
                    </Link>
                    <p className="text-center text-sm text-gray-500">
                      المساعد الذكي متاح لرواد الأعمال المسجلين
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Process Steps */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
            كيف يعمل المساعد الذكي؟
          </h3>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "اكتب فكرة مشروعك", desc: "صف مشروعك بكلماتك الخاصة" },
              { step: "2", title: "حدد المتطلبات", desc: "اختر حجم العمل والميزانية والوقت" },
              { step: "3", title: "تحليل ذكي", desc: "يحلل المساعد مشروعك بالذكاء الاصطناعي" },
              { step: "4", title: "احصل على التقرير", desc: "تقرير مفصل مع التوصيات والتكلفة" }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                  {item.step}
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIAssistantSection;