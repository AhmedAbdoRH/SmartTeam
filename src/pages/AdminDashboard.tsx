import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Category, Service, Banner, StoreSettings, Testimonial } from '../types/database'; // Added Testimonial type
import { Trash2, Edit, Plus, Save, X, Upload, ChevronDown, ChevronUp, Facebook, Instagram, Twitter, Palette, Store, Image, List, Package } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const lightGold = '#00BFFF';
const brownDark = '#3d2c1d';
const successGreen = '#228B22'; // Natural green color
const greenButtonClass = `bg-[${successGreen}] text-white px-6 py-2 rounded flex items-center gap-2 disabled:opacity-50`;
const greenTabClass = `bg-[${successGreen}] text-white shadow-lg border-b-4 border-[${successGreen}]`;
const greenTabInactiveClass = 'bg-black/20 text-white';

const STORE_SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

interface AdminDashboardProps {
  onSettingsUpdate?: () => void;
}

export default function AdminDashboard({ onSettingsUpdate }: AdminDashboardProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBannerImage, setUploadingBannerImage] = useState(false);
  const [editingService, setEditingService] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingBanner, setEditingBanner] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ id: string; type: 'category' | 'service' | 'banner' } | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'banners' | 'testimonials' | 'store'>('products');

  // Testimonials state
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [newTestimonial, setNewTestimonial] = useState({
    image_url: '',
    // is_active: true, // You may not need this field if it's not in your form
  });
  const [editingTestimonial, setEditingTestimonial] = useState<string | null>(null);
  const [uploadingTestimonialImage, setUploadingTestimonialImage] = useState(false);
  const [productsSubTab, setProductsSubTab] = useState<'services' | 'categories'>('services');
  const [bannersSubTab, setBannersSubTab] = useState<'text' | 'image'>('image');

  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [newService, setNewService] = useState({
    title: '',
    description: '',
    image_url: '',
    price: '',
    sale_price: '',
    category_id: '',
    gallery: [] as string[],
    is_featured: false,
    is_best_seller: false,
    remove_background: false,
  });
  const [newBanner, setNewBanner] = useState<Partial<Banner>>({
    type: 'text',
    title: '',
    description: '',
    image_url: ''
  });

  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    id: '',
    store_name: '',
    store_description: '',
    logo_url: '',
    favicon_url: '',
    og_image_url: '',
    meta_title: '',
    meta_description: '',
    keywords: [],
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    snapchat_url: '',
    tiktok_url: '',
    updated_at: '',
    show_testimonials: false // Added this property
  });
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingOgImage, setUploadingOgImage] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');

  const navigate = useNavigate();

  // جلب آراء العملاء من قاعدة البيانات
  const fetchTestimonials = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTestimonials(data || []);
    } catch (err: any) {
      toast.error('خطأ في جلب آراء العملاء: ' + err.message);
      setTestimonials([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        await checkAuth();
        await fetchData();
        await fetchStoreSettings();
        await fetchLogoUrl();
        await fetchTestimonials();
      } catch (err: any) {
        toast.error(`خطأ أثناء التهيئة: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);
  
  // UseEffect for showing toasts
  useEffect(() => {
    if (error) {
        toast.error(error);
        setError(null); // Reset error after showing
    }
  }, [error]);

  useEffect(() => {
    if (successMsg) {
        toast.success(successMsg);
        setSuccessMsg(null); // Reset success message after showing
    }
  }, [successMsg]);


  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/admin/login');
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false });
      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select(`*, category:categories(*)`)
        .order('created_at', { ascending: false });
      if (servicesError) throw servicesError;
      setServices(servicesData || []);

      const { data: bannersData, error: bannersError } = await supabase
        .from('banners')
        .select('*')
        .order('created_at', { ascending: false });
      if (bannersError) throw bannersError;
      setBanners(bannersData || []);
    } catch (err: any) {
      setError(`خطأ في جلب البيانات: ${err.message}`);
      setCategories([]);
      setServices([]);
      setBanners([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogoUrl = async () => {
    const { data } = supabase.storage.from('services').getPublicUrl('logo.svg');
    if (data?.publicUrl) {
      try {
        const response = await fetch(data.publicUrl, { method: 'HEAD' });
        if (response.ok) {
          setLogoUrl(`${data.publicUrl}?t=${new Date().getTime()}`);
        } else {
          setLogoUrl(null);
        }
      } catch (fetchError) {
        console.warn("لم يتم العثور على الشعار الحالي:", fetchError);
        setLogoUrl(null);
      }
    } else {
      setLogoUrl(null);
    }
  };

  const fetchStoreSettings = async () => {
    try {
      const { data: allRows, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('id', STORE_SETTINGS_ID);

      if (error) {
        setError(`خطأ في جلب إعدادات المتجر: ${error.message}`);
        return;
      }

      if (allRows && allRows.length > 0) {
        setStoreSettings(allRows[0]);
      } else {
        // Initialize with default values if no settings are found
        setStoreSettings({
          id: STORE_SETTINGS_ID,
          store_name: '',
          store_description: '',
          logo_url: '',
          favicon_url: '',
          og_image_url: '',
          meta_title: '',
          meta_description: '',
          keywords: [],
          facebook_url: '',
          instagram_url: '',
          twitter_url: '',
          snapchat_url: '',
          tiktok_url: '',
          updated_at: '',
          show_testimonials: false
        });
      }
    } catch (err: any) {
      setError(`خطأ في جلب إعدادات المتجر: ${err.message}`);
    }
  };

  const handleStoreSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('store_settings')
        .update({
          store_name: storeSettings.store_name,
          store_description: storeSettings.store_description,
          logo_url: storeSettings.logo_url,
          favicon_url: storeSettings.favicon_url,
          og_image_url: storeSettings.og_image_url,
          meta_title: storeSettings.meta_title,
          meta_description: storeSettings.meta_description,
          keywords: storeSettings.keywords,
          facebook_url: storeSettings.facebook_url,
          instagram_url: storeSettings.instagram_url,
          twitter_url: storeSettings.twitter_url,
          snapchat_url: storeSettings.snapchat_url,
          tiktok_url: storeSettings.tiktok_url
        })
        .eq('id', storeSettings.id);

      if (error) throw error;
      setSuccessMsg("تم تحديث إعدادات المتجر بنجاح!");
      onSettingsUpdate?.();
    } catch (err: any) {
      setError(`خطأ في تحديث إعدادات المتجر: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'favicon' | 'og_image'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    
    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('الرجاء اختيار ملف صورة صالح');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${type}_${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage.from('services').upload(fileName, file, {
        cacheControl: '0',
        upsert: true
      });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('services').getPublicUrl(fileName);

      setStoreSettings(prev => ({
        ...prev,
        [type === 'logo' ? 'logo_url' : type === 'favicon' ? 'favicon_url' : 'og_image_url']: publicUrl
      }));
      setSuccessMsg(`تم رفع ${type} بنجاح!`);

    } catch (err: any) {
      setError(`خطأ في رفع الصورة: ${err.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'favicon' | 'og_image' | 'service' | 'banner'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const uploadingStateSetters = {
      logo: setUploadingLogo,
      favicon: setUploadingFavicon,
      og_image: setUploadingOgImage,
      service: setUploadingImage,
      banner: setUploadingBannerImage
    };

    const setUploading = uploadingStateSetters[type];
    setUploading(true);
    
    try {
      if (!file.type.startsWith('image/')) throw new Error('الرجاء اختيار ملف صورة صالح');
      const maxSize = type === 'favicon' ? 0.5 * 1024 * 1024 : 2 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error(`حجم الصورة يجب أن لا يتجاوز ${maxSize / (1024 * 1024)} ميجابايت`);
      }
      const fileExt = file.name.split('.').pop();
      const fileName = type === 'logo' ? 'logo.svg' :
        type === 'favicon' ? 'favicon.png' :
        type === 'og_image' ? 'og-image.png' :
        `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from('services').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('services').getPublicUrl(filePath);

      let processedFile = file; // Initialize with the original file

      // If background removal is requested, process the image first
      if (type === 'service' && newService.remove_background) {
        try {
          const blob = await removeBackground(file);
          const newFileName = `removed_bg_${Date.now()}.png`;
          processedFile = new File([blob], newFileName, { type: 'image/png' });
        } catch (error) {
          toast.error("فشل في إزالة الخلفية قبل الرفع.");
          // Continue with original file if background removal fails
        }
      }
      if (type === 'logo') {
        setLogoUrl(publicUrl);
        setStoreSettings(prev => ({ ...prev, logo_url: publicUrl }));
      } else if (type === 'favicon') {
        setStoreSettings(prev => ({ ...prev, favicon_url: publicUrl }));
      } else if (type === 'og_image') {
        setStoreSettings(prev => ({ ...prev, og_image_url: publicUrl }));
      } else if (type === 'service') {
        setNewService(prev => ({ ...prev, image_url: publicUrl }));
      } else if (type === 'banner') {
        setNewBanner(prev => ({ ...prev, image_url: publicUrl }));
      }
      setSuccessMsg("تم رفع الصورة بنجاح!");
    } catch (err: any) {
      setError(`خطأ في رفع الصورة: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleAddKeyword = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && keywordInput.trim()) {
      e.preventDefault();
      setKeywords(prev => [...prev, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (indexToRemove: number) => {
    setKeywords(prev => prev.filter((_, index) => index !== indexToRemove));
  };
    
  // دالة لضغط وتصغير الصورة إذا تجاوزت 2 ميجا
  async function resizeImageIfNeeded(file: File, maxSizeMB = 2): Promise<File> {
    if (file.size <= maxSizeMB * 1024 * 1024) return file;
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        const reader = new FileReader();
        reader.onload = (e) => {
        img.onload = () => {
            let [w, h] = [img.width, img.height];
            // تصغير الأبعاد تدريجياً حتى يقل الحجم
            let quality = 0.92;
            const canvas = document.createElement('canvas');
            function process() {
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, w, h);
            canvas.toBlob(
                (blob) => {
                if (!blob) return reject(new Error('فشل ضغط الصورة'));
                if (blob.size <= maxSizeMB * 1024 * 1024 || (w < 300 || h < 300)) {
                    resolve(new File([blob], file.name, { type: file.type }));
                } else {
                    // قلل الأبعاد والجودة أكثر
                    w = Math.round(w * 0.85);
                    h = Math.round(h * 0.85);
                    quality -= 0.07;
                    process();
                }
                },
                file.type,
                quality
            );
            }
            process();
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'service' | 'banner' = 'service') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const uploadingState = type === 'service' ? setUploadingImage : setUploadingBannerImage;
    const setNewState = type === 'service' ? setNewService : setNewBanner;

    uploadingState(true);
    try {
      if (!file.type.startsWith('image/')) throw new Error('الرجاء اختيار ملف صورة صالح');
      
      let fileToUpload = await resizeImageIfNeeded(file, 2); // This will be the file we eventually upload

      // If background removal is requested (only for services)
      if (type === 'service' && newService.remove_background) {
        console.log('newService.remove_background is true');
        console.log('newService.remove_background is true');
        try {
          const blob = await removeBackground(fileToUpload); // Use the resized file for background removal
          console.log('Blob from removeBackground:', blob);
          const newFileName = `removed_bg_${Date.now()}.png`;
          fileToUpload = new File([blob], newFileName, { type: 'image/png' }); // Update fileToUpload with the background-removed image
          setSuccessMsg("تمت إزالة الخلفية بنجاح!"); // Message for successful background removal
        } catch (error) {
          toast.error("فشل في إزالة الخلفية. سيتم رفع الصورة الأصلية.");
          // Continue with original fileToUpload if background removal fails
        }
      }

      const fileExt = fileToUpload.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload the final processed file (either original resized or background-removed)
      const { error: uploadError } = await supabase.storage.from('services').upload(filePath, fileToUpload);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('services').getPublicUrl(filePath);
      
      setNewState(prev => ({ ...prev, image_url: publicUrl }));
      setSuccessMsg("تم رفع الصورة بنجاح!");

    } catch (err: any) {
      setError(`خطأ في رفع الصورة: ${err.message}`);
      setNewState(prev => ({ ...prev, image_url: '' }));
    } finally {
      uploadingState(false);
    }
  };

  const handleRemoveBackground = async (imageFile: File) => {
    try {
      const blob = await removeBackground(imageFile);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result?.toString().split(',')[1];
          resolve(base64data || null);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error: any) {
      toast.error(`فشل في إزالة الخلفية: ${error.message}`);
      return null;
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name.trim()) {
      setError("اسم القسم مطلوب.");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.from('categories').insert([newCategory]);
      if (error) throw error;
      setNewCategory({ name: '', description: '' });
      await fetchData();
      setSuccessMsg("تمت إضافة القسم بنجاح!");
    } catch (err: any) {
      setError(`خطأ في إضافة القسم: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category.id);
    setNewCategory({ name: category.name, description: category.description || '' });
    const formElement = document.getElementById('category-form');
    formElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !newCategory.name.trim()) {
      setError("اسم القسم مطلوب.");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('categories')
        .update({ name: newCategory.name, description: newCategory.description })
        .eq('id', editingCategory);
      if (error) throw error;

      setNewCategory({ name: '', description: '' });
      setEditingCategory(null);
      await fetchData();
      setSuccessMsg("تم تحديث القسم بنجاح!");
    } catch (err: any) {
      setError(`خطأ في تحديث القسم: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEditCategory = () => {
    setEditingCategory(null);
    setNewCategory({ name: '', description: '' });
  };

  const handleDeleteConfirmation = async () => {
    if (!deleteModal) return;

    setIsLoading(true);
    try {
      let message = "";
      if (deleteModal.type === 'category') {
        // First delete associated services
        await supabase.from('services').delete().eq('category_id', deleteModal.id);
        // Then delete the category
        await supabase.from('categories').delete().eq('id', deleteModal.id);
        message = "تم حذف القسم والمنتجات المرتبطة به.";
      } else if (deleteModal.type === 'service') {
        await supabase.from('services').delete().eq('id', deleteModal.id);
        message = "تم حذف المنتج بنجاح.";
      } else if (deleteModal.type === 'banner') {
        await supabase.from('banners').delete().eq('id', deleteModal.id);
        message = "تم حذف البانر بنجاح.";
      }

      setDeleteModal(null);
      await fetchData();
      setSuccessMsg(message);
    } catch (err: any) {
      setError(`خطأ أثناء الحذف: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = (id: string) => setDeleteModal({ id, type: 'category' });
  const handleDeleteService = (id: string) => setDeleteModal({ id, type: 'service' });
  const handleDeleteBanner = (id: string) => setDeleteModal({ id, type: 'banner' });
  
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !newService.title.trim()) {
        setError("يجب اختيار قسم وتحديد عنوان للمنتج.");
        return;
    }
    setIsLoading(true);
    try {
        const serviceToAdd = {
            ...newService,
            category_id: selectedCategory,
            sale_price: newService.sale_price || null,
            is_featured: newService.is_featured || false,
            is_best_seller: newService.is_best_seller || false
        };

        const { error } = await supabase.from('services').insert([serviceToAdd]);
        if (error) throw error;

        // Reset form
        setNewService({
            title: '',
            description: '',
            image_url: '',
            price: '',
            sale_price: '',
            category_id: '',
            gallery: [],
            is_featured: false,
            is_best_seller: false,
            remove_background: false,
        });
        setSelectedCategory('');
        await fetchData();
        setSuccessMsg('تمت إضافة المنتج بنجاح');
    } catch (err: any) {
        setError(`خطأ في إضافة المنتج: ${err.message}`);
    } finally {
        setIsLoading(false);
    }
  };


  const handleEditService = (service: Service) => {
    setEditingService(service.id);
    setNewService({
      title: service.title,
      description: service.description || '',
      image_url: service.image_url || '',
      price: service.price?.toString() || '',
      sale_price: service.sale_price?.toString() || '',
      category_id: service.category_id || '',
      gallery: Array.isArray(service.gallery) ? service.gallery : [],
      is_featured: service.is_featured || false,
      is_best_seller: service.is_best_seller || false,
      remove_background: false, // Reset this on edit
    });
    setSelectedCategory(service.category_id || '');
    const formElement = document.getElementById('service-form');
    formElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService || !selectedCategory || !newService.title.trim()) {
      setError("يجب اختيار قسم وتحديد عنوان للمنتج.");
      return;
    }
    setIsLoading(true);
    try {
      const serviceToUpdate = {
        title: newService.title,
        description: newService.description,
        image_url: newService.image_url,
        price: newService.price,
        sale_price: newService.sale_price || null,
        category_id: selectedCategory,
        gallery: Array.isArray(newService.gallery) ? newService.gallery : [],
        is_featured: newService.is_featured || false,
        is_best_seller: newService.is_best_seller || false
      };
      const { error } = await supabase
        .from('services')
        .update(serviceToUpdate)
        .eq('id', editingService);
      if (error) throw error;

      setNewService({ 
        title: '', 
        description: '', 
        image_url: '', 
        price: '', 
        sale_price: '', 
        category_id: '', 
        gallery: [],
        is_featured: false,
        is_best_seller: false,
        remove_background: false
      });
      setSelectedCategory('');
      setEditingService(null);
      await fetchData();
      setSuccessMsg("تم تحديث المنتج بنجاح!");
    } catch (err: any) {
      setError(`خطأ في تحديث المنتج: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingService(null);
    setNewService({ 
      title: '', 
      description: '', 
      image_url: '', 
      price: '', 
      sale_price: '', 
      category_id: '', 
      gallery: [],
      is_featured: false,
      is_best_seller: false,
      remove_background: false
    });
    setSelectedCategory('');
  };

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newBanner.type === 'text' && !newBanner.title?.trim()) {
      setError("عنوان البانر مطلوب للنوع النصي.");
      return;
    }
    if (newBanner.type === 'image' && !newBanner.image_url) {
      setError("صورة البانر مطلوبة للنوع المصور.");
      return;
    }
    setIsLoading(true);
    try {
      const bannerData = {
        type: newBanner.type,
        title: newBanner.title || null,
        description: newBanner.description || null,
        image_url: newBanner.image_url || null,
        is_active: true
      };

      const { error } = await supabase.from('banners').insert([bannerData]);
      if (error) throw error;

      setNewBanner({
        type: bannersSubTab, // Keep the current sub-tab type
        title: '',
        description: '',
        image_url: '',
      });
      await fetchData();
      setSuccessMsg("تمت إضافة البانر بنجاح!");
    } catch (err: any) {
      setError(`خطأ في إضافة البانر: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditBanner = (banner: Banner) => {
    setEditingBanner(banner.id);
    setNewBanner({
      type: banner.type,
      title: banner.title || '',
      description: banner.description || '',
      image_url: banner.image_url || '',
      is_active: banner.is_active
    });
    const formElement = document.getElementById('banner-form');
    formElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleUpdateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;

    if (newBanner.type === 'text' && !newBanner.title?.trim()) {
      setError("عنوان البانر مطلوب للنوع النصي.");
      return;
    }
    if (newBanner.type === 'image' && !newBanner.image_url) {
      setError("صورة البانر مطلوبة للنوع المصور.");
      return;
    }

    setIsLoading(true);
    try {
      const bannerData = {
        type: newBanner.type,
        title: newBanner.title || null,
        description: newBanner.description || null,
        image_url: newBanner.image_url || null,
        is_active: newBanner.is_active
      };

      const { error } = await supabase
        .from('banners')
        .update(bannerData)
        .eq('id', editingBanner);
      if (error) throw error;

      setNewBanner({
        type: bannersSubTab,
        title: '',
        description: '',
        image_url: '',
      });
      setEditingBanner(null);
      await fetchData();
      setSuccessMsg("تم تحديث البانر بنجاح!");
    } catch (err: any) {
      setError(`خطأ في تحديث البانر: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEditBanner = () => {
    setEditingBanner(null);
    setNewBanner({
      type: bannersSubTab,
      title: '',
      description: '',
      image_url: '',
    });
  };

  const handleLogout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setIsLoading(false);
    navigate('/admin/login');
  };

  const handleGalleryUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setUploadingImage(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        const processedFile = await resizeImageIfNeeded(file, 2);
        const fileExt = processedFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('services')
          .upload(fileName, processedFile, { upsert: true });
        if (uploadError) {
            toast.warn(`فشل رفع الصورة: ${file.name}`);
            continue;
        }
        const { data: { publicUrl } } = supabase.storage
          .from('services')
          .getPublicUrl(fileName);
        uploadedUrls.push(publicUrl);
      }
      setNewService(prev => {
        const gallery = [...(prev.gallery || []), ...uploadedUrls].filter(Boolean);
        const filteredGallery = Array.from(new Set(gallery)).filter(img => img !== prev.image_url);
        return { ...prev, gallery: filteredGallery };
      });
      if(uploadedUrls.length > 0) setSuccessMsg(`تم رفع ${uploadedUrls.length} صورة بنجاح!`);
    } catch (err: any) {
      setError(`خطأ في رفع الصور: ${err.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageUploadTestimonial = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingTestimonialImage(true);
    setIsLoading(true);
    try {
        if (!file.type.startsWith('image/')) throw new Error('الرجاء اختيار ملف صورة صالح');
        const processedFile = await resizeImageIfNeeded(file, 2);
        const fileExt = processedFile.name.split('.').pop();
        const fileName = `testimonial_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
            .from('testimonials')
            .upload(fileName, processedFile, { upsert: true });
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage.from('testimonials').getPublicUrl(fileName);
        
        // Insert the new testimonial with the public URL
        const { error: insertError } = await supabase
            .from('testimonials')
            .insert([{ image_url: publicUrl, is_active: true }]); // Assuming is_active is true by default
        if (insertError) throw insertError;
        
        setNewTestimonial({ image_url: '' }); // Reset form
        await fetchTestimonials(); // Refresh the list
        setSuccessMsg("تمت إضافة رأي العميل بنجاح!");
    } catch (err: any) {
        setError(`خطأ في رفع الصورة أو حفظ الرأي: ${err.message}`);
    } finally {
        setUploadingTestimonialImage(false);
        setIsLoading(false);
    }
  }

  if (isLoading && categories.length === 0 && services.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto"></div>
            <p className="text-xl mt-4">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-[Cairo] relative"
      style={{
        background: "linear-gradient(135deg, #232526 0%, #414345 100%)",
        color: "#fff"
      }}
      dir="rtl"
    >
      <ToastContainer 
        position="bottom-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={true}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastStyle={{ 
          backgroundColor: '#1f2937',
          color: '#fff',
          borderRadius: '8px',
          border: '1px solid #4b5563',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}
      />
      {deleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-white mb-4">تأكيد الحذف</h2>
            <p className="text-gray-300 mb-6">
              {deleteModal.type === 'category'
                ? 'هل أنت متأكد من حذف هذا القسم؟ سيتم حذف جميع المنتجات المرتبطة به بشكل نهائي.'
                : deleteModal.type === 'banner'
                ? 'هل أنت متأكد من حذف هذا البانر؟'
                : 'هل أنت متأكد من حذف هذا المنتج؟'}
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setDeleteModal(null)}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-500 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteConfirmation}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? 'جاري الحذف...' : 'تأكيد الحذف'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-black/60 backdrop-blur-sm shadow-lg sticky top-0 z-40 border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className={`text-2xl font-bold text-blue-400`}>لوحة التحكم</h1>
          {isLoading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>}
          <button
            onClick={handleLogout}
            className="bg-red-700 text-white px-4 py-2 rounded-md hover:bg-red-800 transition-colors font-semibold disabled:opacity-50"
            disabled={isLoading}
          >
            تسجيل خروج
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Side Tabs */}
          <div className="md:col-span-1 space-y-2">
            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition-all duration-300 transform
                ${activeTab === 'products'
                  ? 'bg-blue-500 text-white shadow-lg -translate-y-1'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'}`}
            >
              <Package className="h-5 w-5" />
              <span>إدارة المنتجات</span>
            </button>

            <button
              onClick={() => setActiveTab('banners')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition-all duration-300 transform
                ${activeTab === 'banners'
                  ? 'bg-blue-500 text-white shadow-lg -translate-y-1'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'}`}
            >
              <Image className="h-5 w-5" />
              <span>البانرات</span>
            </button>
            <button
              onClick={() => setActiveTab('testimonials')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition-all duration-300 transform
                ${activeTab === 'testimonials'
                  ? 'bg-blue-500 text-white shadow-lg -translate-y-1'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'}`}
            >
              <List className="h-5 w-5" />
              <span>آراء العملاء</span>
            </button>
            <button
              onClick={() => setActiveTab('store')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition-all duration-300 transform
                ${activeTab === 'store'
                  ? 'bg-blue-500 text-white shadow-lg -translate-y-1'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'}`}
            >
              <Store className="h-5 w-5" />
              <span>إعدادات المتجر</span>
            </button>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            {/* Header for Products, Banners, Testimonials, Store */}
            <div className="mb-8 p-6 bg-gray-800/50 border border-gray-700 rounded-lg shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            {activeTab === 'products' && <><Package className="w-7 h-7 text-blue-400" /> إدارة المنتجات</>}
                            {activeTab === 'banners' && <><Image className="w-7 h-7 text-blue-400" /> إدارة البانرات</>}
                            {activeTab === 'testimonials' && <><List className="w-7 h-7 text-blue-400" /> إدارة آراء العملاء</>}
                            {activeTab === 'store' && <><Store className="w-7 h-7 text-blue-400" /> إعدادات المتجر</>}
                        </h2>
                        <p className="text-gray-400 mt-1 text-sm">
                            {activeTab === 'products' && 'إدارة المنتجات والأقسام المرتبطة بها.'}
                            {activeTab === 'banners' && 'يمكنك إضافة بانر نصي أو صور.'}
                            {activeTab === 'testimonials' && 'إدارة وتعديل آراء وتقييمات العملاء.'}
                            {activeTab === 'store' && 'تعديل إعدادات المتجر والمعلومات العامة.'}
                        </p>
                    </div>
                     <div className="flex items-center gap-2 text-xs font-bold">
                        {activeTab === 'products' && <>
                            <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full">{services.length} منتج</span>
                            <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full">{categories.length} قسم</span>
                        </>}
                        {activeTab === 'banners' && <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full">{banners.length} بانر</span>}
                        {activeTab === 'testimonials' && <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full">{testimonials.length} رأي</span>}
                    </div>
                </div>
            </div>

            {activeTab === 'testimonials' && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white">إعدادات قسم آراء العملاء</h2>
                        <div className="flex items-center gap-3">
                            <label htmlFor="toggle-testimonials" className="text-white font-semibold cursor-pointer">إظهار القسم في الموقع</label>
                            <input
                                id="toggle-testimonials"
                                type="checkbox"
                                checked={!!storeSettings.show_testimonials}
                                onChange={async (e) => {
                                    const newValue = e.target.checked;
                                    setStoreSettings((prev) => ({ ...prev, show_testimonials: newValue }));
                                    try {
                                        setIsLoading(true);
                                        const { error } = await supabase
                                            .from('store_settings')
                                            .update({ show_testimonials: newValue })
                                            .eq('id', STORE_SETTINGS_ID);
                                        if (error) throw error;
                                        setSuccessMsg(newValue ? 'تم تفعيل قسم آراء العملاء' : 'تم إخفاء قسم آراء العملاء');
                                        localStorage.setItem('storeSettingsUpdated', Date.now().toString());
                                        if (onSettingsUpdate) onSettingsUpdate();
                                    } catch (err: any) {
                                        setError('خطأ في تحديث حالة قسم آراء العملاء: ' + err.message);
                                    } finally {
                                        setIsLoading(false);
                                    }
                                }}
                                className="w-5 h-5 accent-blue-500 cursor-pointer"
                            />
                        </div>
                    </div>
                    
                    <div className="mb-8">
                        <label htmlFor="testimonial-upload" className="w-full flex items-center justify-center gap-2 p-4 rounded-md border-2 border-dashed border-gray-600 cursor-pointer hover:bg-gray-700/50 hover:border-blue-500 transition-colors">
                            <Upload className="w-6 h-6 text-blue-400"/>
                            <span className="text-white font-semibold">
                                {uploadingTestimonialImage ? 'جاري الرفع...' : 'انقر هنا لرفع صورة رأي جديد'}
                            </span>
                        </label>
                        <input
                            type="file"
                            id="testimonial-upload"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUploadTestimonial}
                            disabled={uploadingTestimonialImage || isLoading}
                        />
                    </div>

                    <div className="space-y-3">
                        {isLoading && testimonials.length === 0 && <p className="text-gray-400 text-center mt-4">جاري تحميل الآراء...</p>}
                        {!isLoading && testimonials.length === 0 && <p className="text-gray-400 text-center mt-4">لا توجد آراء لعرضها.</p>}
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {testimonials.map((t: Testimonial) => (
                                <div key={t.id} className="relative group border border-gray-700 rounded-lg overflow-hidden">
                                    <img src={t.image_url} alt="testimonial" className="w-full h-40 object-cover bg-white" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <button
                                            className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                                            onClick={async () => {
                                                setIsLoading(true);
                                                try {
                                                    const { error } = await supabase.from('testimonials').delete().eq('id', t.id);
                                                    if (error) throw error;
                                                    await fetchTestimonials();
                                                    setSuccessMsg("تم حذف الرأي بنجاح.");
                                                } catch (err: any) {
                                                    setError('خطأ في حذف الرأي: ' + err.message);
                                                } finally {
                                                    setIsLoading(false);
                                                }
                                            }}
                                            disabled={isLoading}
                                        >
                                            <Trash2 size={20}/>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
            {activeTab === 'store' && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg shadow-lg">
                    <div className="p-6">
                        <form onSubmit={handleStoreSettingsUpdate} className="space-y-6">
                            {/* Social Media Links */}
                            <h3 className="text-lg font-semibold text-white border-b border-gray-600 pb-2">روابط التواصل الاجتماعي</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">رابط فيسبوك</label>
                                    <input
                                    type="url"
                                    value={storeSettings.facebook_url || ''}
                                    onChange={(e) => setStoreSettings({ ...storeSettings, facebook_url: e.target.value })}
                                    className="w-full p-2 rounded text-white bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="https://facebook.com/..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">رابط انستغرام</label>
                                    <input
                                    type="url"
                                    value={storeSettings.instagram_url || ''}
                                    onChange={(e) => setStoreSettings({ ...storeSettings, instagram_url: e.target.value })}
                                    className="w-full p-2 rounded text-white bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="https://instagram.com/..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">رابط تويتر</label>
                                    <input
                                    type="url"
                                    value={storeSettings.twitter_url || ''}
                                    onChange={(e) => setStoreSettings({ ...storeSettings, twitter_url: e.target.value })}
                                    className="w-full p-2 rounded text-white bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="https://twitter.com/..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">رابط سناب شات</label>
                                    <input
                                    type="url"
                                    value={storeSettings.snapchat_url || ''}
                                    onChange={(e) => setStoreSettings({ ...storeSettings, snapchat_url: e.target.value })}
                                    className="w-full p-2 rounded text-white bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="https://snapchat.com/..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">رابط تيك توك</label>
                                    <input
                                    type="url"
                                    value={storeSettings.tiktok_url || ''}
                                    onChange={(e) => setStoreSettings({ ...storeSettings, tiktok_url: e.target.value })}
                                    className="w-full p-2 rounded text-white bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="https://tiktok.com/..."
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-gray-700">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="bg-blue-600 text-white px-5 py-2.5 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-bold disabled:opacity-50"
                                >
                                    <Save className="w-5 h-5" />
                                    {isLoading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {activeTab === 'banners' && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg">
                <div className="p-6">
                  <div className="flex border-b border-gray-700 mb-6">
                    <button
                      onClick={() => {setBannersSubTab('image'); setNewBanner({type: 'image'})}}
                      className={`flex-1 py-2 font-bold transition-colors rounded-t-md ${ bannersSubTab === 'image' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                    >بانرات صور</button>
                    <button
                      onClick={() => {setBannersSubTab('text'); setNewBanner({type: 'text'})}}
                      className={`flex-1 py-2 font-bold transition-colors rounded-t-md ${ bannersSubTab === 'text' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                    >بانرات نصية</button>
                  </div>
                  
                  <form id="banner-form" onSubmit={editingBanner ? handleUpdateBanner : handleAddBanner} className="mb-10 space-y-4">
                    {bannersSubTab === 'text' && (
                      <>
                        <input
                          type="text"
                          placeholder="عنوان البانر"
                          value={newBanner.title || ''}
                          onChange={(e) => setNewBanner({ ...newBanner, type: 'text', title: e.target.value })}
                          className="w-full p-3 rounded text-white bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                          disabled={isLoading}
                        />
                        <textarea
                          placeholder="وصف البانر (اختياري)"
                          value={newBanner.description || ''}
                          onChange={(e) => setNewBanner({ ...newBanner, type: 'text', description: e.target.value })}
                          rows={3}
                          className="w-full p-3 rounded text-white bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={isLoading}
                        />
                      </>
                    )}
                    {bannersSubTab === 'image' && (
                      <div>
                        <label htmlFor="banner-image-upload" className={`w-full flex flex-col items-center justify-center p-4 rounded-md border-2 border-dashed border-gray-600 cursor-pointer hover:bg-gray-700/50 hover:border-blue-500 transition-colors ${uploadingBannerImage || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <Upload className={`w-8 h-8 mb-2 text-blue-400 ${uploadingBannerImage ? 'animate-pulse' : ''}`} />
                            <span className="text-white font-semibold">{uploadingBannerImage ? 'جاري رفع الصورة...' : (newBanner.image_url ? 'تغيير الصورة' : 'اختر صورة للبانر')}</span>
                            <span className="text-xs text-gray-400 mt-1">المقاس الموصى به: 1920x500 بكسل</span>
                        </label>
                         <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'banner')}
                          className="hidden"
                          id="banner-image-upload"
                          disabled={uploadingBannerImage || isLoading}
                        />
                        {newBanner.image_url && !uploadingBannerImage && (
                          <div className="mt-3 flex items-center justify-center gap-4 bg-gray-900/50 p-2 rounded border border-gray-700">
                            <img src={newBanner.image_url} alt="معاينة" className="w-24 h-auto object-cover rounded border border-gray-600" />
                            <span className="text-gray-400 text-xs">صورة البانر الحالية/الجديدة</span>
                            <button type="button" onClick={() => setNewBanner({...newBanner, image_url: ''})} className="text-red-500 hover:text-red-400 p-1" title="إزالة الصورة"><X size={16}/></button>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button type="submit" className="flex-grow bg-blue-600 text-white py-2.5 px-4 rounded-md font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50" disabled={isLoading}>
                        {editingBanner ? <><Save size={20} /> حفظ التعديلات</> : <><Plus size={20} /> إضافة بانر</>}
                      </button>
                      {editingBanner && (
                        <button type="button" onClick={handleCancelEditBanner} className="bg-gray-600 text-white px-4 py-2.5 rounded-md hover:bg-gray-700 flex items-center justify-center gap-2 font-bold" disabled={isLoading}>
                          <X size={20} /> إلغاء
                        </button>
                      )}
                    </div>
                  </form>
                  
                  <h3 className="text-lg font-semibold mb-4 text-white border-b border-gray-600 pb-2">البانرات الحالية</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {!isLoading && banners.filter(b => b.type === bannersSubTab).length === 0 && <div className="col-span-full text-gray-400 text-center py-8">لا توجد بانرات من هذا النوع.</div>}
                    
                    {banners.filter(b => b.type === bannersSubTab).map((banner) => (
                      <div key={banner.id} className={`relative group border border-gray-700 rounded-lg bg-gray-900/50 shadow-lg overflow-hidden ${editingBanner === banner.id ? `ring-2 ring-blue-500` : ''}`}>
                        {banner.type === 'image' && banner.image_url ? (
                          <img src={banner.image_url} alt={banner.title || 'صورة البانر'} className="w-full h-32 object-cover"/>
                        ) : (
                          <div className="p-4">
                            <h4 className="font-bold text-white text-lg truncate">{banner.title || 'بدون عنوان'}</h4>
                            {banner.description && <p className="text-gray-300 text-sm mt-1 line-clamp-2">{banner.description}</p>}
                          </div>
                        )}
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => !isLoading && handleEditBanner(banner)} title="تعديل" className="bg-blue-600 text-white p-2 rounded-full disabled:opacity-50" disabled={editingBanner === banner.id || isLoading}><Edit size={16} /></button>
                          <button onClick={() => !isLoading && handleDeleteBanner(banner.id)} title="حذف" className="bg-red-600 text-white p-2 rounded-full disabled:opacity-50" disabled={isLoading}><Trash2 size={16} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'products' && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg">
                <div className="p-6">
                  <div className="flex border-b border-gray-700 mb-6">
                    <button onClick={() => setProductsSubTab('services')} className={`flex-1 py-2 font-bold transition-colors rounded-t-md ${productsSubTab === 'services' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>المنتجات</button>
                    <button onClick={() => setProductsSubTab('categories')} className={`flex-1 py-2 font-bold transition-colors rounded-t-md ${productsSubTab === 'categories' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>الأقسام</button>
                  </div>

                  {productsSubTab === 'services' && (
                    <>
                      <form onSubmit={editingService ? handleUpdateService : handleAddService} className="mb-8 space-y-4" id="service-form">
                        <input type="text" placeholder="عنوان المنتج" value={newService.title} onChange={(e) => setNewService({ ...newService, title: e.target.value })} className="w-full p-3 rounded text-white bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" required disabled={isLoading}/>
                        <textarea placeholder="وصف المنتج (اختياري)" value={newService.description} onChange={(e) => setNewService({ ...newService, description: e.target.value })} rows={3} className="w-full p-3 rounded text-white bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={isLoading}/>
                        
                        <div>
                            <label htmlFor="image-upload" className={`w-full flex flex-col items-center justify-center p-4 rounded-md border-2 border-dashed border-gray-600 cursor-pointer hover:bg-gray-700/50 hover:border-blue-500 transition-colors ${uploadingImage || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <Upload className={`w-8 h-8 mb-2 text-blue-400 ${uploadingImage ? 'animate-pulse' : ''}`} />
                                <span className="text-white font-semibold">{uploadingImage ? 'جاري رفع الصورة...' : (newService.image_url ? 'تغيير الصورة الرئيسية' : 'اختر صورة المنتج الرئيسية')}</span>
                                <span className="text-xs text-gray-400 mt-1">المقاس الموصى به: أبعاد أفقية (5:4)</span>
                            </label>
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="image-upload" disabled={uploadingImage || isLoading}/>
                        </div>

                        {newService.image_url && !uploadingImage && (
                          <div className="mt-3 flex items-center justify-center gap-4 bg-gray-900/50 p-2 rounded border border-gray-700">
                            <img src={newService.image_url} alt="معاينة" className="w-16 h-16 object-cover rounded border border-gray-600" />
                            <span className="text-gray-400 text-xs">الصورة الحالية/الجديدة</span>
                            <button type="button" onClick={() => setNewService({...newService, image_url: ''})} className="text-red-500 hover:text-red-400 p-1" title="إزالة الصورة"><X size={16}/></button>
                          </div>
                        )}
                        
                        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full p-3 rounded text-white bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none" required disabled={isLoading || categories.length === 0}>
                          <option value="" disabled className="text-gray-400">-- اختر القسم --</option>
                          {categories.map((category) => (<option key={category.id} value={category.id} className="bg-gray-800 text-white">{category.name}</option>))}
                          {categories.length === 0 && <option disabled>لا توجد أقسام، يرجى إضافة قسم أولاً.</option>}
                        </select>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input type="text" placeholder="السعر الأصلي" value={newService.price} onChange={(e) => setNewService({ ...newService, price: e.target.value })} className="w-full p-3 rounded text-white bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={isLoading} required/>
                          <input type="text" placeholder="سعر التخفيض (اختياري)" value={newService.sale_price} onChange={(e) => setNewService({ ...newService, sale_price: e.target.value })} className="w-full p-3 rounded text-white bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={isLoading}/>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-2 p-2 bg-gray-700/50 rounded-md">
                                <input type="checkbox" id="is_featured" checked={newService.is_featured || false} onChange={(e) => setNewService({ ...newService, is_featured: e.target.checked })} className="h-4 w-4 accent-blue-500"/>
                                <label htmlFor="is_featured" className="text-white">أحدث العروض</label>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-gray-700/50 rounded-md">
                                <input type="checkbox" id="is_best_seller" checked={newService.is_best_seller || false} onChange={(e) => setNewService({ ...newService, is_best_seller: e.target.checked })} className="h-4 w-4 accent-blue-500"/>
                                <label htmlFor="is_best_seller" className="text-white">الأكثر مبيعًا</label>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-gray-700/50 rounded-md">
                                <input type="checkbox" id="remove_background" checked={newService.remove_background || false} onChange={(e) => setNewService({ ...newService, remove_background: e.target.checked })} className="h-4 w-4 accent-blue-500"/>
                                <label htmlFor="remove_background" className="text-white">إزالة الخلفية (AI)</label>
                            </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">صور إضافية للمنتج <span className="text-gray-400">(اختياري)</span></label>
                          <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" disabled={uploadingImage || isLoading}/>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {newService.gallery && newService.gallery.map((img, idx) => (
                              <div key={img} className="relative group">
                                <img src={img} alt={`صورة إضافية ${idx + 1}`} className="w-16 h-16 object-cover rounded border-2 border-gray-600"/>
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button type="button" className="text-white" onClick={() => setNewService(prev => ({ ...prev, gallery: prev.gallery.filter((g) => g !== img) }))} title="حذف الصورة">
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                          <button type="submit" className="flex-grow bg-blue-600 text-white py-2.5 px-4 rounded-md font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50" disabled={isLoading || (editingService ? false : !selectedCategory)}>
                            {editingService ? <><Save size={20} /> حفظ التعديلات</> : <><Plus size={20} /> إضافة المنتج</>}
                          </button>
                          {editingService && (
                            <button type="button" onClick={handleCancelEdit} className="bg-gray-600 text-white px-4 py-2.5 rounded-md hover:bg-gray-700 flex items-center justify-center gap-2 font-bold" disabled={isLoading}>
                              <X size={20} /> إلغاء
                            </button>
                          )}
                        </div>
                      </form>

                      <h3 className="text-lg font-semibold mb-4 text-white border-b border-gray-600 pb-2">المنتجات الحالية</h3>
                      <div className="space-y-3">
                        {services.map((service) => (
                          <div key={service.id} className={`p-4 rounded-md bg-gray-900/50 border border-gray-700 transition-all ${editingService === service.id ? 'ring-2 ring-blue-500' : ''}`}>
                            <div className="flex items-center gap-4">
                              {service.image_url && <img src={service.image_url} alt={service.title} className="w-16 h-16 object-cover rounded-md border border-gray-600 flex-shrink-0"/>}
                              <div className="flex-1 overflow-hidden">
                                <h4 className="font-bold text-white text-lg truncate">{service.title}</h4>
                                <div className="text-xs text-gray-400 mb-1">{service.category?.name || 'قسم غير محدد'}</div>
                                <div className="flex items-center gap-3 mt-1">
                                  {service.sale_price ? (
                                    <>
                                      <span className="font-semibold text-green-400">{service.sale_price}</span>
                                      <span className="text-sm text-gray-500 line-through">{service.price}</span>
                                    </>
                                  ) : (
                                    <span className="font-semibold text-green-400">{service.price}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => !isLoading && handleEditService(service)} title="تعديل" className="text-blue-400 hover:text-blue-300 p-2 disabled:opacity-50" disabled={editingService === service.id || isLoading}><Edit size={18} /></button>
                                <button onClick={() => !isLoading && handleDeleteService(service.id)} title="حذف" className="text-red-500 hover:text-red-400 p-2 disabled:opacity-50" disabled={isLoading}><Trash2 size={18} /></button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {productsSubTab === 'categories' && (
                    <>
                      <form onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory} className="mb-8 space-y-4" id="category-form">
                        <input type="text" placeholder="اسم القسم" value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} className="w-full p-3 rounded text-white bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" required disabled={isLoading}/>
                        <textarea placeholder="وصف القسم (اختياري)" value={newCategory.description} onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })} rows={3} className="w-full p-3 rounded text-white bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={isLoading}/>
                        <div className="flex gap-3">
                          <button type="submit" className="flex-grow bg-blue-600 text-white py-2.5 px-4 rounded-md font-bold hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50" disabled={isLoading}>
                            {editingCategory ? <><Save size={20} /> حفظ التعديلات</> : <><Plus size={20} /> إضافة قسم</>}
                          </button>
                          {editingCategory && (
                            <button type="button" onClick={handleCancelEditCategory} className="bg-gray-600 text-white px-4 py-2.5 rounded-md hover:bg-gray-700 flex items-center justify-center gap-2 font-bold" disabled={isLoading}>
                              <X size={20} /> إلغاء
                            </button>
                          )}
                        </div>
                      </form>

                      <h3 className="text-lg font-semibold mb-4 text-white border-b border-gray-600 pb-2">الأقسام الحالية</h3>
                      <div className="space-y-3">
                        {categories.map((category) => (
                          <div key={category.id} className={`p-4 rounded-md bg-gray-900/50 border border-gray-700 flex justify-between items-center transition-all ${editingCategory === category.id ? 'ring-2 ring-blue-500' : ''}`}>
                            <div className="flex-1 overflow-hidden">
                              <h4 className="font-bold text-white text-lg truncate">{category.name}</h4>
                              {category.description && <p className="text-gray-400 text-sm mt-1 line-clamp-2">{category.description}</p>}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => !isLoading && handleEditCategory(category)} title="تعديل" className="text-blue-400 hover:text-blue-300 p-2 disabled:opacity-50" disabled={editingCategory === category.id || isLoading}><Edit size={18} /></button>
                                <button onClick={() => !isLoading && handleDeleteCategory(category.id)} title="حذف" className="text-red-500 hover:text-red-400 p-2 disabled:opacity-50" disabled={isLoading}><Trash2 size={18} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <footer className="w-full flex justify-center py-8 mt-10">
        <button
          onClick={() => { window.location.href = '/'; }}
          className="bg-white/10 backdrop-blur-md text-white font-bold px-8 py-3 rounded-lg shadow-lg transition-colors border border-white/20 hover:bg-white/20"
        >
          ← العودة للصفحة الرئيسية
        </button>
      </footer>
    </div>
  );
}