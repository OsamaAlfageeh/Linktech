import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Building, Award, Briefcase, Globe, ExternalLink } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

// تعريف نوع بيانات عميل التميز
interface PremiumClient {
  id: number;
  name: string;
  logo: string;
  description: string;
  website: string | null;
  category: string;
  benefits: string[] | null;
  featured: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ترجمة تصنيفات العملاء المميزين
const categoryTranslations = {
  "government": "جهة حكومية",
  "nonprofit": "منظمة غير ربحية",
  "corporation": "شركة كبرى",
  "university": "جامعة",
  "startup": "شركة ناشئة",
  "partner": "شريك إستراتيجي",
  "other": "أخرى"
};

// مكون بطاقة عميل التميز
const PremiumClientCard = ({ client }: { client: PremiumClient }) => {
  // ترجمة التصنيف
  const categoryLabel = categoryTranslations[client.category as keyof typeof categoryTranslations] || client.category;
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="mb-2">{client.name}</CardTitle>
            <Badge variant={client.featured ? "default" : "outline"} className="mb-2">
              {categoryLabel}
            </Badge>
            {client.featured && (
              <Badge variant="secondary" className="mr-2 mb-2">
                <Award className="h-3 w-3 mr-1" /> عميل مميز
              </Badge>
            )}
          </div>
          <div className="w-16 h-16 overflow-hidden flex-shrink-0">
            <img 
              src={client.logo} 
              alt={`شعار ${client.name}`}
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground mb-4">{client.description}</p>
        
        {client.benefits && client.benefits.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">المزايا المقدمة:</h4>
            <ul className="text-sm text-muted-foreground list-disc list-inside">
              {client.benefits.map((benefit, index) => (
                <li key={index}>{benefit}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      {client.website && (
        <CardFooter className="pt-2 border-t">
          <a 
            href={client.website} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-primary flex items-center hover:underline"
          >
            <Globe className="h-4 w-4 mr-1" /> 
            زيارة الموقع الإلكتروني
            <ExternalLink className="h-3 w-3 mr-1" />
          </a>
        </CardFooter>
      )}
    </Card>
  );
};

// مكون تحميل البطاقات
const ClientCardSkeleton = () => (
  <Card className="h-full">
    <CardHeader className="pb-2">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-5 w-1/4 mb-2" />
        </div>
        <Skeleton className="w-16 h-16 rounded" />
      </div>
    </CardHeader>
    <CardContent>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-2" />
      <div className="mt-4">
        <Skeleton className="h-4 w-1/3 mb-2" />
        <Skeleton className="h-3 w-3/4 mb-1" />
        <Skeleton className="h-3 w-1/2 mb-1" />
      </div>
    </CardContent>
    <CardFooter className="pt-2 border-t">
      <Skeleton className="h-4 w-1/3" />
    </CardFooter>
  </Card>
);

// الصفحة الرئيسية لعملاء التميز
export default function PremiumClientsPage() {
  const { toast } = useToast();
  
  // استعلام لجلب عملاء التميز من الخادم
  const {
    data: clients,
    isLoading,
    error
  } = useQuery<PremiumClient[]>({
    queryKey: ["/api/premium-clients"],
    // نحن نريد عرض العملاء النشطين فقط افتراضيًا
    queryFn: async () => {
      const res = await fetch("/api/premium-clients?active=true");
      if (!res.ok) {
        throw new Error("فشل في جلب قائمة عملاء التميز");
      }
      return res.json();
    }
  });

  // معالجة حالة الخطأ
  if (error) {
    toast({
      title: "حدث خطأ",
      description: "فشل في تحميل قائمة عملاء التميز. يرجى المحاولة مرة أخرى لاحقًا.",
      variant: "destructive"
    });
  }

  // تصنيف العملاء حسب الفئة
  const groupedClients = clients?.reduce<Record<string, PremiumClient[]>>((acc, client) => {
    const category = client.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(client);
    return acc;
  }, {});

  // استخراج العملاء المميزين
  const featuredClients = clients?.filter(client => client.featured) || [];

  return (
    <Layout>
      <div className="container py-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-4">عملاء التميز</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            نفخر بالتعاون مع نخبة من المؤسسات والجهات الرائدة في المملكة العربية السعودية والتي تدعم رؤيتنا
            في تطوير بيئة التعاون التقني وتمكين رواد الأعمال والمطورين.
          </p>
        </div>

        <Tabs defaultValue="all" className="mb-8">
          <div className="flex justify-center mb-6">
            <TabsList>
              <TabsTrigger value="all">جميع العملاء</TabsTrigger>
              <TabsTrigger value="featured">عملاء مميزون</TabsTrigger>
              {groupedClients && Object.keys(groupedClients).map(category => (
                <TabsTrigger key={category} value={category}>
                  {categoryTranslations[category as keyof typeof categoryTranslations] || category}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                Array(6).fill(0).map((_, i) => <ClientCardSkeleton key={i} />)
              ) : clients && clients.length > 0 ? (
                clients.map(client => (
                  <PremiumClientCard key={client.id} client={client} />
                ))
              ) : (
                <div className="col-span-full text-center py-10">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium">لا يوجد عملاء حاليًا</p>
                  <p className="text-muted-foreground">سيتم إضافة عملاء التميز قريبًا</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="featured">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => <ClientCardSkeleton key={i} />)
              ) : featuredClients.length > 0 ? (
                featuredClients.map(client => (
                  <PremiumClientCard key={client.id} client={client} />
                ))
              ) : (
                <div className="col-span-full text-center py-10">
                  <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium">لا يوجد عملاء مميزين حاليًا</p>
                </div>
              )}
            </div>
          </TabsContent>

          {groupedClients && Object.entries(groupedClients).map(([category, categoryClients]) => (
            <TabsContent key={category} value={category}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryClients.map(client => (
                  <PremiumClientCard key={client.id} client={client} />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <Separator className="my-10" />

        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold mb-4">انضم إلى عملاء التميز</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            هل ترغب في الانضمام إلى شبكتنا من العملاء المميزين والاستفادة من المزايا الحصرية التي نقدمها؟
            تواصل معنا اليوم للحصول على المزيد من المعلومات حول برنامج عملاء التميز.
          </p>
          <div className="mt-6">
            <a
              href="mailto:partners@linktech.app"
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-md font-medium"
            >
              <Building className="h-4 w-4 mr-2 inline-block" />
              تواصل معنا
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
}