import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Helmet } from "react-helmet";

// كمبوننت لعرض عميل مميز واحد
const PremiumClientCard = ({ client }: { client: any }) => {
  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="p-6">
        <div className="mb-4 flex justify-center">
          <img 
            src={client.logo} 
            alt={client.name} 
            className="h-24 w-auto object-contain"
          />
        </div>
        <h3 className="text-xl font-bold text-primary text-center mb-2">{client.name}</h3>
        <p className="text-gray-600 dark:text-gray-300 text-center mb-4">{client.description}</p>
        {client.website && (
          <div className="text-center">
            <a 
              href={client.website} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm text-primary hover:underline"
            >
              زيارة الموقع
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

const PremiumClients = () => {
  // جلب بيانات العملاء المميزين من API
  const { data: clients, isLoading, error } = useQuery({
    queryKey: ['/api/premium-clients'],
    staleTime: 60000 // تخزين البيانات لمدة دقيقة
  });

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <Helmet>
        <title>عملاء التميز | لينكتك</title>
        <meta name="description" content="تعرف على عملاء التميز والمشاريع المميزة في منصة لينكتك" />
      </Helmet>
      
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-primary mb-4">عملاء التميز</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          نفتخر بخدمة نخبة من العملاء المميزين والمؤسسات الرائدة التي تثق بمنصة لينكتك لتنفيذ مشاريعها التقنية
        </p>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">
          <p>عذراً، حدث خطأ أثناء تحميل بيانات العملاء المميزين</p>
        </div>
      ) : clients && clients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {clients.map((client: any) => (
            <PremiumClientCard key={client.id} client={client} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="text-xl font-medium mb-2">لا يوجد عملاء مميزين حالياً</h3>
          <p className="text-gray-500 dark:text-gray-400">
            سيتم إضافة عملائنا المميزين قريباً، يرجى العودة لاحقاً
          </p>
        </div>
      )}
      
      <div className="mt-16 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 p-8 rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">هل ترغب بالانضمام إلى قائمة عملاء التميز؟</h2>
          <p className="mb-6 max-w-2xl mx-auto">
            إذا كنت تملك مشروعاً مميزاً أو مؤسسة رائدة وترغب بالانضمام إلى عملاء التميز في منصة لينكتك، نرحب بالتواصل معنا
          </p>
          <a 
            href="/contact" 
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            تواصل معنا
          </a>
        </div>
      </div>
    </div>
  );
};

export default PremiumClients;