import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type Testimonial = {
  id: number;
  userId: number;
  content: string;
  role: string;
  companyName?: string;
  userTitle?: string;
  rating: number;
  avatar?: string;
  name?: string;
};

const TestimonialSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm p-8 border border-neutral-200">
    <div className="flex items-center mb-6">
      <Skeleton className="w-14 h-14 rounded-full mr-4" />
      <div>
        <Skeleton className="h-5 w-32 mb-1" />
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
    <Skeleton className="h-24 w-full mb-4" />
    <div className="flex">
      <Skeleton className="h-5 w-20" />
    </div>
  </div>
);

const Testimonials = () => {
  const { data: testimonials, isLoading, error } = useQuery<Testimonial[]>({
    queryKey: ['/api/testimonials'],
  });

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="fill-amber-500 text-amber-500 h-4 w-4" />);
    }
    
    if (hasHalfStar) {
      stars.push(
        <svg key="half" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
          <defs>
            <linearGradient id="halfFill">
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" fill="url(#halfFill)" stroke="currentColor" />
        </svg>
      );
    }
    
    const remainingStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="text-amber-500 h-4 w-4" />);
    }
    
    return stars;
  };

  return (
    <section className="py-16 bg-neutral-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl font-bold text-neutral-800">آراء عملائنا</h2>
          <p className="mt-4 text-lg text-neutral-600 max-w-3xl mx-auto">
            تجارب حقيقية من رواد الأعمال وشركات البرمجة في منصتنا
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {isLoading ? (
            <>
              <TestimonialSkeleton />
              <TestimonialSkeleton />
            </>
          ) : error ? (
            <div className="col-span-2 text-center py-8">
              <p className="text-neutral-600">حدث خطأ أثناء تحميل الآراء. حاول مرة أخرى لاحقاً.</p>
            </div>
          ) : testimonials && testimonials.length > 0 ? (
            testimonials.slice(0, 2).map((testimonial) => (
              <div key={testimonial.id} className="bg-white rounded-xl shadow-sm p-8 border border-neutral-200">
                <div className="flex items-center mb-6">
                  <Avatar className="w-14 h-14 mr-4">
                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                    <AvatarFallback>{getInitials(testimonial.name || "")}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-heading font-semibold text-lg">{testimonial.name}</h4>
                    <p className="text-neutral-600 text-sm">
                      {testimonial.role === 'entrepreneur' 
                        ? testimonial.userTitle 
                        : `${testimonial.userTitle} - ${testimonial.companyName}`}
                    </p>
                  </div>
                </div>
                <p className="text-neutral-700 mb-4">"{testimonial.content}"</p>
                <div className="flex text-amber-500">
                  {renderStars(testimonial.rating)}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-8">
              <p className="text-neutral-600">لا توجد آراء متاحة حالياً.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
