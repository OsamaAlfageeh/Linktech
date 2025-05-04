import { useState, useEffect, useRef } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  placeholder?: string;
  loadingClassname?: string;
}

/**
 * مكون لتحميل الصور بكسل لأسفل (lazy loading)
 * يعرض صورة بديلة أو نمط تحميل حتى تصبح الصورة الرئيسية جاهزة
 */
const LazyImage = ({
  src,
  alt,
  className = '',
  width,
  height,
  placeholder = '/images/placeholder.svg',
  loadingClassname = 'animate-pulse bg-neutral-200',
}: LazyImageProps) => {
  const [loading, setLoading] = useState(true);
  const [currentSrc, setCurrentSrc] = useState(placeholder);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // عند تغير src، أعد تعيين حالة التحميل
    setLoading(true);
    setCurrentSrc(placeholder);
  }, [src, placeholder]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        // عندما تصبح الصورة مرئية في العرض، قم بتحميل الصورة الحقيقية
        if (entry.isIntersecting) {
          const img = new Image();
          img.src = src;
          img.onload = () => {
            setCurrentSrc(src);
            setLoading(false);
          };
          img.onerror = () => {
            // في حالة فشل تحميل الصورة، استخدم الصورة البديلة
            setCurrentSrc(placeholder);
            setLoading(false);
          };
          // إلغاء المراقبة بعد بدء التحميل
          observer.disconnect();
        }
      });
    }, {
      rootMargin: '200px 0px', // تحميل الصورة قبل ظهورها بمسافة 200 بكسل
      threshold: 0.01 // تحميل الصورة عندما يصبح 1% منها مرئيًا
    });

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [src, placeholder]);

  return (
    <img
      ref={imgRef}
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      className={`${className} ${loading ? loadingClassname : ''}`}
      // وضع توجيهات تحميل الصور
      loading="lazy"
      decoding="async"
    />
  );
};

export default LazyImage;