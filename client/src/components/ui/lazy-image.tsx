import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  blurDataURL?: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  className?: string;
  wrapperClassName?: string;
  loadingClassname?: string;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
  decoding?: "async" | "sync" | "auto";
}

/**
 * مكون LazyImage للتحميل البطيء للصور
 * يستخدم Intersection Observer API لتحميل الصور فقط عندما تصبح مرئية في نافذة العرض
 * يوفر صورة placeholder أو تأثير تمويه للصور أثناء التحميل
 */
export function LazyImage({
  src,
  alt,
  placeholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Cpath d='M20 33.33c7.36 0 13.33-5.97 13.33-13.33S27.36 6.67 20 6.67 6.67 12.64 6.67 20 12.64 33.33 20 33.33zm0-4.44c-4.91 0-8.89-3.98-8.89-8.89S15.09 11.11 20 11.11 28.89 15.09 28.89 20 24.91 28.89 20 28.89z' fill='%23cccccc'/%3E%3C/svg%3E",
  blurDataURL,
  width,
  height,
  aspectRatio = "auto",
  className,
  wrapperClassName,
  loadingClassname,
  loading = "lazy",
  fetchPriority = "auto",
  decoding = "async",
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // إعداد Intersection Observer لتتبع رؤية الصورة
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsInView(true);
          // إلغاء المراقبة بعد دخول الصورة في العرض
          observer.disconnect();
        }
      },
      { rootMargin: "200px" } // بداية التحميل عندما تكون الصورة على بعد 200 بكسل من نافذة العرض
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  // تحديد أسلوب الحاوية بناءً على نسبة العرض إلى الارتفاع المحددة
  const wrapperStyle = {
    position: "relative" as const,
    width: "100%",
    paddingBottom:
      aspectRatio !== "auto"
        ? `calc(100% / (${aspectRatio.split(":")[0]} / ${
            aspectRatio.split(":")[1]
          }))`
        : undefined,
    height: aspectRatio === "auto" ? "auto" : undefined,
    overflow: "hidden" as const,
    background: blurDataURL
      ? `url(${blurDataURL}) no-repeat center center / cover`
      : undefined,
  };

  return (
    <div
      className={cn("relative overflow-hidden bg-neutral-100", wrapperClassName)}
      style={wrapperStyle}
    >
      {/* صورة مؤقتة أثناء التحميل */}
      {!isLoaded && (
        <div
          className={cn("absolute inset-0 flex items-center justify-center", loadingClassname)}
          aria-hidden="true"
        >
          <img
            src={placeholder}
            alt=""
            className="w-full h-full object-cover opacity-30"
          />
        </div>
      )}

      {/* الصورة الفعلية */}
      {isInView && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          width={width}
          height={height}
          onLoad={handleLoad}
          loading={loading}
          fetchPriority={fetchPriority}
          decoding={decoding}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
            className
          )}
          {...props}
        />
      )}
    </div>
  );
}