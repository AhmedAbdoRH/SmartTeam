import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface ProductImageSliderProps {
  mainImageUrl: string | null;
  additionalImages: string[];
}

export default function ProductImageSlider({ mainImageUrl, additionalImages }: ProductImageSliderProps) {
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    // Combine main image with additional images
    if (mainImageUrl) {
      setImages([mainImageUrl, ...additionalImages]);
    } else {
      setImages(additionalImages);
    }
  }, [mainImageUrl, additionalImages]);

  if (images.length === 0) {
    return (
      <div className="h-96 bg-gray-200 flex items-center justify-center">
        <span className="text-gray-500">لا توجد صور متاحة</span>
      </div>
    );
  }

  return (
    <Swiper
      modules={[Navigation, Pagination, Autoplay]}
      spaceBetween={10}
      slidesPerView={1}
      navigation
      pagination={{ clickable: true }}
      autoplay={{
        delay: 3000,
        disableOnInteraction: false,
      }}
      className="h-96"
    >
      {images.map((imageUrl, index) => (
        <SwiperSlide key={index}>
          <img
            src={imageUrl}
            alt={`Product ${index + 1}`}
            className="w-full h-full object-cover rounded-lg"
          />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
