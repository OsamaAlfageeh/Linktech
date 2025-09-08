import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

interface FeaturedClient {
  id: number;
  name: string;
  logo: string;
  website?: string;
  description?: string;
  category?: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const FeaturedClients = () => {
  const { data: clients, isLoading, error } = useQuery<FeaturedClient[]>({
    queryKey: ['/api/featured-clients'],
    refetchOnWindowFocus: false,
    staleTime: 300000, // 5 minutes
  });

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="h-8 bg-gray-200 rounded-lg w-64 mx-auto mb-4 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded-lg w-96 mx-auto animate-pulse"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || !clients || clients.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            عملاء نفخر بهم
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            يثق بنا أبرز العملاء في المملكة العربية السعودية لتنفيذ مشاريعهم التقنية المتطورة
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {clients.map((client, index) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 border border-gray-100">
                <div className="flex items-center justify-center h-16 mb-4">
                  {client.logo ? (
                    <img
                      src={client.logo}
                      alt={client.name}
                      className="max-h-full max-w-full object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                      {client.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">
                    {client.name}
                  </h3>
                  {client.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {client.description}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-12"
        >
          <p className="text-gray-600 text-sm">
            انضم إلى مئات العملاء الذين يثقون بخدماتنا المتميزة
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedClients;