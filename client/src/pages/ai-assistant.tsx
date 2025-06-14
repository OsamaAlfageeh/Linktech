import { useState } from "react";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Brain, 
  Lightbulb, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Users, 
  Shield, 
  Layers,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  FileText,
  Download
} from "lucide-react";

interface AnalysisResult {
  id?: number;
  projectType: string;
  technicalComplexity: string;
  recommendedTechnologies: string[];
  estimatedCostRange: {
    min: number;
    max: number;
    currency: string;
  };
  estimatedDuration: {
    development: number;
    testing: number;
    deployment: number;
  };
  projectPhases: Array<{
    name: string;
    description: string;
    duration: number;
    cost: number;
  }>;
  features: Array<{
    name: string;
    priority: string;
    complexity: string;
  }>;
  riskAssessment: {
    technicalRisks: string[];
    timelineRisks: string[];
    budgetRisks: string[];
    mitigationStrategies: string[];
  };
  scalabilityConsiderations: string[];
  maintenanceRequirements: {
    frequency: string;
    estimatedMonthlyCost: number;
    requiredSkills: string[];
  };
}

interface PreviousAnalysis {
  id: number;
  projectIdea: string;
  createdAt: string;
  status: string;
  estimatedCost: string;
  analysisResult: string;
}

interface AiAssistantPageProps {
  auth: {
    user: any;
    isAuthenticated: boolean;
    isEntrepreneur: boolean;
  };
}

const AiAssistantPage = ({ auth }: AiAssistantPageProps) => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showPreviousAnalyses, setShowPreviousAnalyses] = useState(false);
  
  const [formData, setFormData] = useState({
    projectIdea: "",
    businessSize: "",
    expectedUsers: "",
    budget: "",
    timeline: "",
    integrationNeeds: [] as string[],
    securityRequirements: "",
    specificRequirements: ""
  });

  // استعلام للحصول على التحليلات السابقة
  const { data: previousAnalyses, isLoading: loadingPrevious } = useQuery<PreviousAnalysis[]>({
    queryKey: ['/api/ai/my-analyses'],
    enabled: showPreviousAnalyses
  });

  const analyzeProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/ai/analyze-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze project');
      }
      
      return response.json();
    },
    onSuccess: (result: AnalysisResult) => {
      setAnalysisResult(result);
      setCurrentStep(3);
      toast({
        title: "تم التحليل بنجاح",
        description: "تم تحليل مشروعك وإنشاء التوصيات",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في التحليل",
        description: error.message || "حدث خطأ أثناء تحليل المشروع",
        variant: "destructive"
      });
    }
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addIntegrationNeed = (need: string) => {
    if (need && !formData.integrationNeeds.includes(need)) {
      setFormData(prev => ({
        ...prev,
        integrationNeeds: [...prev.integrationNeeds, need]
      }));
    }
  };

  const removeIntegrationNeed = (need: string) => {
    setFormData(prev => ({
      ...prev,
      integrationNeeds: prev.integrationNeeds.filter(n => n !== need)
    }));
  };

  const handleAnalyze = () => {
    if (!formData.projectIdea.trim()) {
      toast({
        title: "فكرة المشروع مطلوبة",
        description: "يرجى إدخال وصف لفكرة مشروعك",
        variant: "destructive"
      });
      return;
    }

    const analysisData = {
      ...formData,
      expectedUsers: formData.expectedUsers ? parseInt(formData.expectedUsers) : undefined
    };

    analyzeProjectMutation.mutate(analysisData);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'essential': return 'bg-red-100 text-red-800';
      case 'important': return 'bg-yellow-100 text-yellow-800';
      case 'nice-to-have': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'complex': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <Helmet>
        <title>مساعد الذكاء الاصطناعي للمشاريع | لينكتك</title>
        <meta name="description" content="احصل على تحليل تقني مفصل وتوصيات دقيقة لمشروعك باستخدام الذكاء الاصطناعي" />
      </Helmet>

      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Brain className="h-12 w-12 text-blue-600 ml-3" />
            <h1 className="text-4xl font-bold text-gray-900">مساعد الذكاء الاصطناعي</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            احصل على تحليل تقني مفصل وتوصيات دقيقة لمشروعك مع تقدير التكلفة والوقت المطلوب
          </p>
        </div>

        {/* أزرار التنقل */}
        <div className="flex gap-4 mb-6 max-w-md mx-auto">
          <Button 
            variant={!showPreviousAnalyses ? "default" : "outline"} 
            onClick={() => setShowPreviousAnalyses(false)}
            className="flex-1"
          >
            تحليل جديد
          </Button>
          <Button 
            variant={showPreviousAnalyses ? "default" : "outline"} 
            onClick={() => setShowPreviousAnalyses(true)}
            className="flex-1"
          >
            تحليلاتي السابقة
          </Button>
        </div>

        {/* عرض التحليلات السابقة */}
        {showPreviousAnalyses ? (
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>تحليلاتي السابقة</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPrevious ? (
                <p className="text-center py-8">جارٍ تحميل التحليلات...</p>
              ) : previousAnalyses && previousAnalyses.length > 0 ? (
                <div className="space-y-4">
                  {previousAnalyses.map((analysis: PreviousAnalysis) => (
                    <div key={analysis.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 cursor-pointer" onClick={() => {
                           try {
                             const parsedResult = JSON.parse(analysis.analysisResult);
                             setAnalysisResult({ ...parsedResult, id: analysis.id });
                             setCurrentStep(3);
                             setShowPreviousAnalyses(false);
                           } catch (error) {
                             toast({
                               title: "خطأ",
                               description: "فشل في تحميل التحليل",
                               variant: "destructive"
                             });
                           }
                         }}>
                          <h3 className="font-semibold text-lg mb-2">{analysis.projectIdea.substring(0, 100)}...</h3>
                          <p className="text-gray-600 text-sm mb-2">
                            تاريخ التحليل: {new Date(analysis.createdAt).toLocaleDateString('ar-SA')}
                          </p>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-xs">
                              {analysis.estimatedCost}
                            </Badge>
                            <Badge variant={analysis.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                              {analysis.status === 'completed' ? 'مكتمل' : 'قيد المعالجة'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                console.log('بدء تحميل التقرير للتحليل رقم:', analysis.id);
                                
                                // استخدام window.open لفتح الملف مباشرة
                                const downloadUrl = `/api/ai/analysis/${analysis.id}/report?download=1`;
                                console.log('فتح رابط التحميل:', downloadUrl);
                                
                                // فتح الرابط في نافذة جديدة لتجنب مشاكل CORS
                                const downloadWindow = window.open(downloadUrl, '_blank');
                                
                                if (!downloadWindow) {
                                  // إذا فشلت النافذة الجديدة، استخدم الطريقة التقليدية
                                  const a = document.createElement('a');
                                  a.style.display = 'none';
                                  a.href = downloadUrl;
                                  a.download = `project-analysis-${analysis.id}.md`;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                }
                                
                                toast({
                                  title: "تم التحميل بنجاح",
                                  description: "تم تحميل التقرير المفصل",
                                });
                              } catch (error) {
                                console.error('خطأ في تحميل التقرير:', error);
                                toast({
                                  title: "خطأ في التحميل",
                                  description: error instanceof Error ? error.message : "حدث خطأ أثناء تحميل التقرير",
                                  variant: "destructive"
                                });
                              }
                            }}
                          >
                            <Download className="h-4 w-4 ml-1" />
                            تحميل
                          </Button>
                          <ArrowRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">لا توجد تحليلات سابقة</p>
                  <p className="text-gray-400 text-sm mt-2">ابدأ بتحليل مشروعك الأول</p>
                  <Button 
                    onClick={() => setShowPreviousAnalyses(false)} 
                    className="mt-4"
                  >
                    تحليل مشروع جديد
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  1
                </div>
                <div className={`h-1 w-16 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  2
                </div>
                <div className={`h-1 w-16 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  3
                </div>
              </div>
            </div>

        {/* Step 1: Project Idea */}
        {currentStep === 1 && (
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <Lightbulb className="h-6 w-6 text-yellow-500 ml-3" />
                أخبرنا عن فكرة مشروعك
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="projectIdea" className="text-lg font-semibold">
                  وصف فكرة المشروع <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="projectIdea"
                  placeholder="اشرح فكرة مشروعك بالتفصيل. مثال: أريد تطبيق توصيل طعام يربط بين المطاعم والعملاء، يتضمن نظام طلبات وتتبع المندوبين ونظام دفع إلكتروني..."
                  value={formData.projectIdea}
                  onChange={(e) => handleInputChange('projectIdea', e.target.value)}
                  className="min-h-32 text-lg"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="businessSize" className="text-lg font-semibold">حجم العمل</Label>
                  <Select onValueChange={(value) => handleInputChange('businessSize', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر حجم عملك" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">فردي</SelectItem>
                      <SelectItem value="small">شركة صغيرة (2-10 موظفين)</SelectItem>
                      <SelectItem value="medium">شركة متوسطة (11-50 موظف)</SelectItem>
                      <SelectItem value="enterprise">مؤسسة كبيرة (50+ موظف)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="expectedUsers" className="text-lg font-semibold">عدد المستخدمين المتوقع</Label>
                  <Input
                    id="expectedUsers"
                    type="number"
                    placeholder="مثال: 1000"
                    value={formData.expectedUsers}
                    onChange={(e) => handleInputChange('expectedUsers', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setCurrentStep(2)} size="lg" className="px-8">
                  التالي
                  <ArrowRight className="h-4 w-4 mr-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Requirements */}
        {currentStep === 2 && (
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <Layers className="h-6 w-6 text-blue-500 ml-3" />
                متطلبات المشروع
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-lg font-semibold flex items-center">
                    <DollarSign className="h-4 w-4 ml-2" />
                    نطاق الميزانية
                  </Label>
                  <Select onValueChange={(value) => handleInputChange('budget', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نطاق ميزانيتك" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">منخفضة (أقل من 20,000 ريال)</SelectItem>
                      <SelectItem value="medium">متوسطة (20,000 - 50,000 ريال)</SelectItem>
                      <SelectItem value="high">عالية (أكثر من 50,000 ريال)</SelectItem>
                      <SelectItem value="custom">مخصصة (سنحددها بناءً على المتطلبات)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-lg font-semibold flex items-center">
                    <Clock className="h-4 w-4 ml-2" />
                    الجدولة الزمنية
                  </Label>
                  <Select onValueChange={(value) => handleInputChange('timeline', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الإطار الزمني المطلوب" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgent">عاجل (أسرع وقت ممكن)</SelectItem>
                      <SelectItem value="normal">عادي (وقت كافي للجودة)</SelectItem>
                      <SelectItem value="flexible">مرن (لا يوجد ضغط زمني)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-lg font-semibold flex items-center">
                    <Shield className="h-4 w-4 ml-2" />
                    متطلبات الأمان
                  </Label>
                  <Select onValueChange={(value) => handleInputChange('securityRequirements', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر مستوى الأمان المطلوب" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">أساسي (تشفير عادي)</SelectItem>
                      <SelectItem value="standard">معياري (حماية متوسطة)</SelectItem>
                      <SelectItem value="high">عالي (حماية قصوى)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-lg font-semibold">متطلبات إضافية أو تفاصيل خاصة</Label>
                <Textarea
                  placeholder="أي متطلبات خاصة، ميزات محددة، أو تفاصيل إضافية تريد إضافتها..."
                  value={formData.specificRequirements}
                  onChange={(e) => handleInputChange('specificRequirements', e.target.value)}
                  className="min-h-24"
                />
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  السابق
                </Button>
                <Button 
                  onClick={handleAnalyze} 
                  size="lg" 
                  className="px-8"
                  disabled={analyzeProjectMutation.isPending}
                >
                  {analyzeProjectMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2" />
                      جاري التحليل...
                    </>
                  ) : (
                    <>
                      تحليل المشروع
                      <Brain className="h-4 w-4 mr-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Analysis Results */}
        {currentStep === 3 && analysisResult && (
          <div className="space-y-6">
            {/* نظرة عامة */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-2xl">
                  <TrendingUp className="h-6 w-6 text-green-500 ml-3" />
                  نتائج التحليل
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-lg text-blue-900">نوع المشروع</h3>
                    <p className="text-2xl font-bold text-blue-600">{analysisResult.projectType}</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <h3 className="font-semibold text-lg text-yellow-900">التعقيد التقني</h3>
                    <Badge className={getComplexityColor(analysisResult.technicalComplexity)}>
                      {analysisResult.technicalComplexity}
                    </Badge>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <h3 className="font-semibold text-lg text-green-900">التكلفة المتوقعة</h3>
                    <p className="text-xl font-bold text-green-600">
                      {analysisResult.estimatedCostRange.min.toLocaleString('ar-SA')} - {analysisResult.estimatedCostRange.max.toLocaleString('ar-SA')} ريال
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* التقنيات الموصى بها */}
            <Card>
              <CardHeader>
                <CardTitle>التقنيات الموصى بها</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.recommendedTechnologies.map((tech, index) => (
                    <Badge key={index} variant="outline" className="text-sm">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* مراحل المشروع */}
            <Card>
              <CardHeader>
                <CardTitle>مراحل المشروع</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisResult.projectPhases.map((phase, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg">{phase.name}</h3>
                        <Badge variant="outline">{phase.duration} أسبوع</Badge>
                      </div>
                      <p className="text-gray-600 mb-2">{phase.description}</p>
                      <p className="font-semibold text-green-600">
                        {phase.cost.toLocaleString('ar-SA')} ريال
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* الميزات */}
            <Card>
              <CardHeader>
                <CardTitle>الميزات المقترحة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysisResult.features.map((feature, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium">{feature.name}</span>
                      <div className="flex gap-2">
                        <Badge className={getPriorityColor(feature.priority)}>
                          {feature.priority}
                        </Badge>
                        <Badge className={getComplexityColor(feature.complexity)}>
                          {feature.complexity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* تقييم المخاطر */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 ml-2" />
                  تقييم المخاطر
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3 text-red-600">المخاطر التقنية</h3>
                    <ul className="space-y-1">
                      {analysisResult.riskAssessment.technicalRisks.map((risk, index) => (
                        <li key={index} className="text-sm text-gray-600">• {risk}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3 text-blue-600">استراتيجيات التخفيف</h3>
                    <ul className="space-y-1">
                      {analysisResult.riskAssessment.mitigationStrategies.map((strategy, index) => (
                        <li key={index} className="text-sm text-gray-600">• {strategy}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* متطلبات الصيانة */}
            <Card>
              <CardHeader>
                <CardTitle>متطلبات الصيانة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold">التكرار</h4>
                    <p>{analysisResult.maintenanceRequirements.frequency}</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold">التكلفة الشهرية</h4>
                    <p>{analysisResult.maintenanceRequirements.estimatedMonthlyCost.toLocaleString('ar-SA')} ريال</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold">المهارات المطلوبة</h4>
                    <p>{analysisResult.maintenanceRequirements.requiredSkills.join(', ')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* الإجراءات */}
            <Card>
              <CardHeader>
                <CardTitle>الخطوات التالية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button onClick={() => navigate('/projects/create')} className="h-16">
                    <FileText className="h-5 w-5 ml-2" />
                    نشر المشروع للشركات
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-16"
                    onClick={async () => {
                      if (!analysisResult?.id) return;
                      
                      try {
                        console.log('بدء تحميل التقرير للتحليل رقم:', analysisResult.id);
                        
                        // استخدام window.open لفتح الملف مباشرة
                        const downloadUrl = `/api/ai/analysis/${analysisResult.id}/report?download=1`;
                        console.log('فتح رابط التحميل:', downloadUrl);
                        
                        // فتح الرابط في نافذة جديدة لتجنب مشاكل CORS
                        const downloadWindow = window.open(downloadUrl, '_blank');
                        
                        if (!downloadWindow) {
                          // إذا فشلت النافذة الجديدة، استخدم الطريقة التقليدية
                          const a = document.createElement('a');
                          a.style.display = 'none';
                          a.href = downloadUrl;
                          a.download = `project-analysis-${analysisResult.id || 'new'}.md`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                        }
                        
                        toast({
                          title: "بدء التحميل",
                          description: "جاري تحميل التقرير المفصل",
                        });
                      } catch (error) {
                        console.error('خطأ في تحميل التقرير:', error);
                        toast({
                          title: "خطأ في التحميل",
                          description: error instanceof Error ? error.message : "حدث خطأ أثناء تحميل التقرير",
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    <Download className="h-5 w-5 ml-2" />
                    تحميل التقرير المفصل
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <Button 
                variant="outline" 
                onClick={() => {
                  setCurrentStep(1);
                  setAnalysisResult(null);
                  setFormData({
                    projectIdea: "",
                    businessSize: "",
                    expectedUsers: "",
                    budget: "",
                    timeline: "",
                    integrationNeeds: [],
                    securityRequirements: "",
                    specificRequirements: ""
                  });
                }}
              >
                تحليل مشروع جديد
              </Button>
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
};

export default AiAssistantPage;