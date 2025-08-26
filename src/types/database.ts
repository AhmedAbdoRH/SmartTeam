export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface ProductImage {
  id: string;
  image_url: string;
  created_at: string;
}

export interface Service {
  id: number;
  category_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  images?: ProductImage[]; // Array of product images
  images_urls?: string[]; // روابط صور متعددة
  price: string | null;
  sale_price: string | null; // السعر المخفض
  is_featured?: boolean; // أحدث العروض
  is_best_seller?: boolean; // الأكثر مبيعاً
  created_at: string;
  category?: Category;
  // For search results display
  displayImage?: string;
}

export interface Banner {
  id: string;
  type: 'image' | 'text';
  title: string | null;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface StoreSettings {
  id: string;
  store_name: string | null;
  store_description: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  og_image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  keywords: string[] | null;
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  theme_settings?: {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    backgroundGradient?: string;
    fontFamily?: string;
  } | null;
  updated_at: string;
}

// واجهة آراء العملاء (Testimonials)
export interface Testimonial {
  id: string;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}
