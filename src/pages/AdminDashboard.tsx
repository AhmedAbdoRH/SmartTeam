import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Category, Service, Banner, StoreSettings } from '../types/database';
import { Trash2, Edit, Plus, Save, X, Upload, ChevronDown, ChevronUp, Facebook, Instagram, Twitter, Palette, Store, Image, List, Package } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const lightGold = '#FFD700';
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
  const [activeTab, setActiveTab] = useState<'store' | 'banners' | 'products' | 'theme' | 'testimonials'>('products');

  // Testimonials state
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [newTestimonial, setNewTestimonial] = useState({
    image_url: '',
    is_active: true,
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
    updated_at: ''
  });
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingOgImage, setUploadingOgImage] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');

  const [themeSettings, setThemeSettings] = useState({
    primaryColor: '#FFD700',
    secondaryColor: '#3d2c1d',
    backgroundType: 'solid', // 'solid' or 'gradient'
    backgroundColor: '#1a1a1a',
    gradientStartColor: '#FFD700',
    gradientEndColor: '#3d2c1d',
    gradientAngle: 135,
    backgroundGradient: '',
    fontFamily: 'Cairo',
  });
  const [savingTheme, setSavingTheme] = useState(false);

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
        await fetchThemeSettings();
        await fetchTestimonials();
        applyThemeSettings(themeSettings);
      } catch (err: any) {
        toast.error(`خطأ أثناء التهيئة: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

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
      toast.error(`خطأ في جلب البيانات: ${err.message}`);
      setCategories([]);
      setServices([]);
      setBanners([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogoUrl = async () => {
    const { data } = supabase.storage.from('services').getPublicUrl('logo.png');
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
          updated_at: ''
        });
      }
    } catch (err: any) {
      setError(`خطأ في جلب إعدادات المتجر: ${err.message}`);
    }
  };

  const fetchThemeSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('theme_settings')
        .eq('id', STORE_SETTINGS_ID)
        .single();
      if (error) return;
      if (data?.theme_settings) {
        const t = data.theme_settings;
        // استنتاج نوع الخلفية من القيم المخزنة
        let backgroundType = 'solid';
        if (t.backgroundGradient && t.backgroundGradient !== '') backgroundType = 'gradient';
        setThemeSettings({
          ...t,
          backgroundType,
          gradientStartColor: t.gradientStartColor || '#FFD700',
          gradientEndColor: t.gradientEndColor || '#3d2c1d',
          gradientAngle: t.gradientAngle || 135,
        });
      }
    } catch {}
  };

  const handleThemeSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTheme(true);
    try {
      // خزّن فقط الخاصية المناسبة حسب نوع الخلفية
      let toSave = { ...themeSettings };
      if (themeSettings.backgroundType === 'solid') {
        toSave.backgroundGradient = '';
      } else if (themeSettings.backgroundType === 'gradient') {
        toSave.backgroundGradient = `linear-gradient(${themeSettings.gradientAngle}deg, ${themeSettings.gradientStartColor}, ${themeSettings.gradientEndColor})`;
        toSave.backgroundColor = '';
      }
      // لا تخزن backgroundType في القاعدة
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { backgroundType, ...dbTheme } = toSave;
      const { error } = await supabase
        .from('store_settings')
        .update({ theme_settings: dbTheme })
        .eq('id', STORE_SETTINGS_ID);
      if (error) throw error;
      setSuccessMsg('تم حفظ إعدادات المظهر بنجاح');
      applyThemeSettings(dbTheme);
      // تحديث بيانات storeSettings محلياً حتى تظهر التغييرات مباشرة
      setStoreSettings(prev => ({
        ...prev,
        theme_settings: dbTheme
      }));
      // إعلام التطبيق الرئيسي لإعادة تحميل الإعدادات
      if (onSettingsUpdate) onSettingsUpdate();
    } catch (err: any) {
      setError('خطأ في حفظ إعدادات المظهر: ' + err.message);
    } finally {
      setSavingTheme(false);
    }
  };

  const applyThemeSettings = (settings: typeof themeSettings) => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', settings.primaryColor);
    root.style.setProperty('--secondary-color', settings.secondaryColor);
    root.style.setProperty('--font-family', settings.fontFamily);
    if (settings.backgroundType === 'gradient' && settings.backgroundGradient) {
      root.style.setProperty('--background-gradient', settings.backgroundGradient);
      root.style.setProperty('--background-color', '');
    } else {
      root.style.setProperty('--background-gradient', '');
      root.style.setProperty('--background-color', settings.backgroundColor);
    }
  };

  const handleStoreSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

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
    setError(null);

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
    setError(null);

    try {
      if (!file.type.startsWith('image/')) throw new Error('الرجاء اختيار ملف صورة صالح');
      const maxSize = type === 'favicon' ? 0.5 * 1024 * 1024 : 2 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error(`حجم الصورة يجب أن لا يتجاوز ${maxSize / (1024 * 1024)} ميجابايت`);
      }
      const fileExt = file.name.split('.').pop();
      const fileName = type === 'logo' ? 'logo.png' :
        type === 'favicon' ? 'favicon.png' :
        type === 'og_image' ? 'og-image.png' :
        `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from('services').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('services').getPublicUrl(filePath);
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'service' | 'banner' = 'service') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const uploadingState = type === 'service' ? setUploadingImage : setUploadingBannerImage;
    const setNewState = type === 'service' ? setNewService : setNewBanner;

    uploadingState(true);
    setError(null);
    try {
      if (!file.type.startsWith('image/')) throw new Error('الرجاء اختيار ملف صورة صالح');
      // ضغط/تصغير إذا لزم الأمر
      const processedFile = await resizeImageIfNeeded(file, 2);

      const fileExt = processedFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from('services').upload(filePath, processedFile);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('services').getPublicUrl(filePath);
      setNewState(prev => ({ ...prev, image_url: publicUrl }));

    } catch (err: any) {
      setError(`خطأ في رفع الصورة: ${err.message}`);
      setNewState(prev => ({ ...prev, image_url: '' }));
    } finally {
      uploadingState(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name.trim()) {
      setError("اسم القسم مطلوب.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.from('categories').insert([newCategory]);
      if (error) throw error;
      setNewCategory({ name: '', description: '' });
      await fetchData();
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
    setError(null);
    try {
      const { error } = await supabase
        .from('categories')
        .update({ name: newCategory.name, description: newCategory.description })
        .eq('id', editingCategory);
      if (error) throw error;

      setNewCategory({ name: '', description: '' });
      setEditingCategory(null);
      await fetchData();
    } catch (err: any) {
      setError(`خطأ في تحديث القسم: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEditCategory = () => {
    setEditingCategory(null);
    setNewCategory({ name: '', description: '' });
    setError(null);
  };

  const handleDeleteConfirmation = async () => {
    if (!deleteModal) return;

    setIsLoading(true);
    setError(null);
    try {
      if (deleteModal.type === 'category') {
        await supabase.from('services').delete().eq('category_id', deleteModal.id);
        await supabase.from('categories').delete().eq('id', deleteModal.id);
      } else if (deleteModal.type === 'service') {
        await supabase.from('services').delete().eq('id', deleteModal.id);
      } else if (deleteModal.type === 'banner') {
        await supabase.from('banners').delete().eq('id', deleteModal.id);
      }

      setDeleteModal(null);
      await fetchData();
    } catch (err: any) {
      setError(`خطأ أثناء الحذف: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = (id: string) => {
    setDeleteModal({ id, type: 'category' });
  };

  const handleDeleteService = (id: string) => {
    setDeleteModal({ id, type: 'service' });
  };

  const handleDeleteBanner = (id: string) => {
    setDeleteModal({ id, type: 'banner' });
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !newService.title.trim()) {
      setError("يجب اختيار قسم وتحديد عنوان للمنتج.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const serviceToAdd = {
        ...newService,
        category_id: selectedCategory,
        sale_price: newService.sale_price || null,
        is_featured: newService.is_featured || false,
        is_best_seller: newService.is_best_seller || false
      };
      
      console.log('Adding service:', serviceToAdd); // Debug log
      
      const { data, error } = await supabase
        .from('services')
        .insert([serviceToAdd])
        .select();
        
      if (error) throw error;
      
      console.log('Service added successfully:', data); // Debug log

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
        is_best_seller: false
      });
      setSelectedCategory(null);
      await fetchData();
      setSuccessMsg('تمت إضافة المنتج بنجاح');
    } catch (err: any) {
      console.error('Error adding service:', err); // Debug log
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
      price: service.price || '',
      sale_price: service.sale_price || '',
      category_id: service.category_id || '',
      gallery: Array.isArray(service.gallery) ? service.gallery : [],
      is_featured: service.is_featured || false,
      is_best_seller: service.is_best_seller || false
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
    setError(null);
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
        is_best_seller: false
      });
      setSelectedCategory('');
      setEditingService(null);
      await fetchData();
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
      is_best_seller: false
    });
    setSelectedCategory('');
    setError(null);
  };

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newBanner.type === 'text' && !newBanner.title.trim()) {
      setError("عنوان البانر مطلوب للنوع النصي.");
      return;
    }
    if (newBanner.type === 'image' && !newBanner.image_url) {
      setError("صورة البانر مطلوبة للنوع المصور.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Only include fields that exist in the Banner type
      const bannerData = {
        type: newBanner.type,
        title: newBanner.title || null,
        description: newBanner.description || null,
        image_url: newBanner.image_url || null,
        is_active: true
      };

      const { data, error } = await supabase
        .from('banners')
        .insert([bannerData])
        .select()
        .single();
      if (error) throw error;

      setNewBanner({
        type: 'text',
        title: '',
        description: '',
        image_url: '',
        is_active: true
      });
      await fetchData();
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

    if (newBanner.type === 'text' && !newBanner.title.trim()) {
      setError("عنوان البانر مطلوب للنوع النصي.");
      return;
    }
    if (newBanner.type === 'image' && !newBanner.image_url) {
      setError("صورة البانر مطلوبة للنوع المصور.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Only include fields that exist in the Banner type
      const bannerData = {
        type: newBanner.type,
        title: newBanner.title || null,
        description: newBanner.description || null,
        image_url: newBanner.image_url || null,
        is_active: true
      };

      const { error } = await supabase
        .from('banners')
        .update(bannerData)
        .eq('id', editingBanner);
      if (error) throw error;

      setNewBanner({
        type: 'text',
        title: '',
        description: '',
        image_url: '',
        is_active: true
      });
      setEditingBanner(null);
      await fetchData();
    } catch (err: any) {
      setError(`خطأ في تحديث البانر: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEditBanner = () => {
    setEditingBanner(null);
    setNewBanner({
      type: 'text',
      title: '',
      description: '',
      image_url: '',
      is_active: true
    });
    setError(null);
  };

  const handleLogout = async () => {
    setIsLoading(true);
    setError(null);
    await supabase.auth.signOut();
    setIsLoading(false);
    navigate('/admin/login');
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

  const handleGalleryUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setUploadingImage(true);
    setError(null);
    try {
      const uploadedUrls: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        // ضغط/تصغير إذا لزم الأمر
        const processedFile = await resizeImageIfNeeded(file, 2);
        const fileExt = processedFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('services')
          .upload(fileName, processedFile, { upsert: true });
        if (uploadError) continue;
        const { data: { publicUrl } } = supabase.storage
          .from('services')
          .getPublicUrl(fileName);
        uploadedUrls.push(publicUrl);
      }
      setNewService(prev => {
        // Remove duplicates and main image from gallery if present
        const gallery = [...(prev.gallery || []), ...uploadedUrls].filter(Boolean);
        const filteredGallery = Array.from(new Set(gallery)).filter(img => img !== prev.image_url);
        return {
          ...prev,
          gallery: filteredGallery,
        };
      });
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
    setError(null);
    try {
      if (!file.type.startsWith('image/')) throw new Error('الرجاء اختيار ملف صورة صالح');
      // ضغط/تصغير إذا لزم الأمر
      const processedFile = await resizeImageIfNeeded(file, 2);
      const fileExt = processedFile.name.split('.').pop();
      const fileName = `testimonial_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('testimonials')
        .upload(fileName, processedFile, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('testimonials').getPublicUrl(fileName);
      // حفظ الرأي مباشرة بعد رفع الصورة
      setIsLoading(true);
      const { error } = await supabase
        .from('testimonials')
        .insert([{ image_url: publicUrl }]);
      if (error) throw error;
      setNewTestimonial({ image_url: '' });
      await fetchTestimonials();
    } catch (err: any) {
      setError(`خطأ في رفع الصورة أو حفظ الرأي: ${err.message}`);
    } finally {
      setUploadingTestimonialImage(false);
      setIsLoading(false);
    }
  }

  if (isLoading && categories.length === 0 && services.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-4 md:p-8 relative">
        <ToastContainer 
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          rtl={true}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
          toastStyle={{ 
            backgroundColor: '#1a1a1a',
            color: '#fff',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
        />
        <div className="text-xl animate-pulse">جاري التحميل...</div>
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
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={true}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastStyle={{ 
          backgroundColor: '#1a1a1a',
          color: '#fff',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}
      />
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h2 className="text-lg font-bold text-gray-800 mb-4">تأكيد الحذف</h2>
            <p className="text-gray-600 mb-6">
              {deleteModal.type === 'category'
                ? 'هل أنت متأكد من حذف هذا القسم؟ سيتم حذف جميع المنتجات المرتبطة به.'
                : deleteModal.type === 'banner'
                ? 'هل أنت متأكد من حذف هذا البانر؟'
                : 'هل أنت متأكد من حذف هذا المنتج؟'}
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setDeleteModal(null)}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition"
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteConfirmation}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                disabled={isLoading}
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-black/60 backdrop-blur-sm shadow-lg sticky top-0 z-50 border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className={`text-2xl font-bold text-[${lightGold}]`}>لوحة التحكم</h1>
          {isLoading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[${lightGold}]"></div>}
          <button
            onClick={handleLogout}
            className="bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800 transition-colors font-semibold disabled:opacity-50"
            disabled={isLoading}
          >
            تسجيل خروج
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Error and success messages are now shown using toast notifications */}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Side Tabs */}
          <div className="space-y-2">
            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg font-bold transition-colors
                ${activeTab === 'products'
                  ? 'bg-yellow-400 text-black shadow-lg border-2 border-yellow-500'
                  : 'bg-[#232526] text-yellow-300 hover:bg-yellow-500/10 hover:text-yellow-400 border-2 border-transparent'}
                `}
            >
              <Package className="h-5 w-5" />
              <span>إدارة المنتجات</span>
            </button>
            <button
              onClick={() => setActiveTab('store')}
              className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg font-bold transition-colors
                ${activeTab === 'store'
                  ? 'bg-yellow-400 text-black shadow-lg border-2 border-yellow-500'
                  : 'bg-[#232526] text-yellow-300 hover:bg-yellow-500/10 hover:text-yellow-400 border-2 border-transparent'}
                `}
            >
              <Store className="h-5 w-5" />
              <span>إعدادات المتجر</span>
            </button>
            <button
              onClick={() => setActiveTab('banners')}
              className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg font-bold transition-colors
                ${activeTab === 'banners'
                  ? 'bg-yellow-400 text-black shadow-lg border-2 border-yellow-500'
                  : 'bg-[#232526] text-yellow-300 hover:bg-yellow-500/10 hover:text-yellow-400 border-2 border-transparent'}
                `}
            >
              <Image className="h-5 w-5" />
              <span>البانرات</span>
            </button>
            <button
              onClick={() => setActiveTab('theme')}
              className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg font-bold transition-colors
                ${activeTab === 'theme'
                  ? 'bg-yellow-400 text-black shadow-lg border-2 border-yellow-500'
                  : 'bg-[#232526] text-yellow-300 hover:bg-yellow-500/10 hover:text-yellow-400 border-2 border-transparent'}
                `}
            >
              <Palette className="h-5 w-5" />
              <span>تخصيص المظهر</span>
            </button>
            <button
              onClick={() => setActiveTab('testimonials')}
              className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg font-bold transition-colors
                ${activeTab === 'testimonials'
                  ? 'bg-yellow-400 text-black shadow-lg border-2 border-yellow-500'
                  : 'bg-[#232526] text-yellow-300 hover:bg-yellow-500/10 hover:text-yellow-400 border-2 border-transparent'}
                `}
            >
              <List className="h-5 w-5" />
              <span>آراء العملاء</span>
            </button>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            {/* --- Tab Header for all tabs --- */}
            {(activeTab === 'banners' || activeTab === 'products' || activeTab === 'store' || activeTab === 'theme') && (
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-8 py-6 bg-gradient-to-r from-yellow-400/20 via-yellow-100/10 to-yellow-400/10 border-b border-yellow-400/20 mb-8 rounded-2xl">
                <div>
                  <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
                    {activeTab === 'banners' && <Image className="w-7 h-7 text-yellow-400" />}
                    {activeTab === 'products' && <Package className="w-7 h-7 text-yellow-400" />}
                    {activeTab === 'store' && <Store className="w-7 h-7 text-yellow-400" />}
                    {activeTab === 'theme' && <Palette className="w-7 h-7 text-yellow-400" />}
                    {activeTab === 'banners' && 'إدارة البانرات'}
                    {activeTab === 'products' && 'إدارة المنتجات'}
                    {activeTab === 'store' && 'إعدادات المتجر'}
                    {activeTab === 'theme' && 'تخصيص المظهر'}
                  </h2>
                  {activeTab === 'banners' && (
                    <p className="text-gray-200 mt-1 text-sm text-center">يمكنك إضافة بانر نصي أو صور</p>
                  )}
                  {activeTab === 'products' && (
                    <p className="text-gray-200 mt-1 text-sm">إدارة المنتجات والأقسام المرتبطة بها</p>
                  )}
                  {activeTab === 'store' && (
                    <p className="text-gray-200 mt-1 text-sm">تعديل إعدادات المتجر والمعلومات العامة</p>
                  )}
                  {activeTab === 'theme' && (
                    <p className="text-gray-200 mt-1 text-sm">تخصيص ألوان وخطوط وخلفية الموقع</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {activeTab === 'banners' && (
                    <span className="inline-flex items-center gap-1 bg-yellow-400/20 text-yellow-300 px-3 py-1 rounded-full text-xs font-bold">
                      <Image className="w-4 h-4" /> {banners.length} بانر
                    </span>
                  )}
                  {activeTab === 'products' && (
                    <>
                      <span className="inline-flex items-center gap-1 bg-yellow-400/20 text-yellow-300 px-3 py-1 rounded-full text-xs font-bold">
                        <Package className="w-4 h-4" /> {services.length} منتج
                      </span>
                      <span className="inline-flex items-center gap-1 bg-blue-400/20 text-blue-300 px-3 py-1 rounded-full text-xs font-bold">
                        <List className="w-4 h-4" /> {categories.length} قسم
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'testimonials' && (
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-8 py-6 bg-gradient-to-r from-yellow-400/20 via-yellow-100/10 to-yellow-400/10 border-b border-yellow-400/20 mb-8 rounded-2xl">
                <div>
                  <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
                    <List className="w-7 h-7 text-yellow-400" />
                    إدارة آراء العملاء
                  </h2>
                  <p className="text-gray-200 mt-1 text-sm">إدارة وتعديل آراء وتقييمات العملاء</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center gap-1 bg-yellow-400/20 text-yellow-300 px-3 py-1 rounded-full text-xs font-bold">
                    <List className="w-4 h-4" /> {testimonials.length} رأي
                  </span>
                </div>
              </div>
            )}

            {activeTab === 'testimonials' && (
  <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-white">إعدادات قسم آراء العملاء</h2>
      <div className="flex items-center gap-2">
        <label htmlFor="toggle-testimonials" className="text-white font-bold">إظهار قسم آراء العملاء</label>
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
              // Trigger a storage event for App.tsx to re-fetch settings
              localStorage.setItem('storeSettingsUpdated', Date.now().toString());
              if (onSettingsUpdate) onSettingsUpdate();
            } catch (err: any) {
              setError('خطأ في تحديث حالة قسم آراء العملاء: ' + err.message);
            } finally {
              setIsLoading(false);
            }
          }}
          className="w-6 h-6 accent-yellow-400 cursor-pointer"
        />
      </div>
    </div>

                <form
                  className="space-y-4 mb-8"
                  onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
                    e.preventDefault();
                    setIsLoading(true);
                    setError(null);
                    try {
                      if (editingTestimonial) {
                        // تحديث صورة رأي
                        const { error } = await supabase
                          .from('testimonials')
                          .update({ image_url: newTestimonial.image_url })
                          .eq('id', editingTestimonial);
                        if (error) throw error;
                        setEditingTestimonial(null);
                      } else {
                        // إضافة صورة رأي جديدة
                        const { error } = await supabase
                          .from('testimonials')
                          .insert([{ image_url: newTestimonial.image_url }]);
                        if (error) throw error;
                      }
                      setNewTestimonial({ image_url: '' });
                      await fetchTestimonials();
                    } catch (err: any) {
                      setError('خطأ في حفظ الرأي: ' + err.message);
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="flex-1 p-3 rounded border border-gray-600 bg-black/40 text-white cursor-pointer"
                    onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingTestimonialImage(true);
                      setError(null);
                      try {
                        if (!file.type.startsWith('image/')) throw new Error('الرجاء اختيار ملف صورة صالح');
                        // ضغط/تصغير إذا لزم الأمر
                        const processedFile = await resizeImageIfNeeded(file, 2);
                        const fileExt = processedFile.name.split('.').pop();
                        const fileName = `testimonial_${Date.now()}.${fileExt}`;
                        const { error: uploadError } = await supabase.storage
                          .from('testimonials')
                          .upload(fileName, processedFile, { upsert: true });
                        if (uploadError) throw uploadError;
                        const { data: { publicUrl } } = supabase.storage.from('testimonials').getPublicUrl(fileName);
                        // حفظ الرأي مباشرة بعد رفع الصورة
                        setIsLoading(true);
                        const { error } = await supabase
                          .from('testimonials')
                          .insert([{ image_url: publicUrl }]);
                        if (error) throw error;
                        setNewTestimonial({ image_url: '' });
                        await fetchTestimonials();
                      } catch (err: any) {
                        setError(`خطأ في رفع الصورة أو حفظ الرأي: ${err.message}`);
                      } finally {
                        setUploadingTestimonialImage(false);
                        setIsLoading(false);
                      }
                    }}
                  />
                  {/* لا يوجد أي أزرار أو عناصر إضافية */}
                </form>
                <div className="space-y-3">
                  {isLoading && <p className="text-gray-400 text-center mt-4">جاري تحميل الآراء...</p>}
                  {!isLoading && testimonials.length === 0 && <p className="text-gray-400 text-center mt-4">لا توجد آراء لعرضها.</p>}
                  {!isLoading && testimonials.map((t: Testimonial) => (
                    <div key={t.id} className="flex items-center gap-4 border border-gray-700/50 p-2 rounded-lg bg-gradient-to-r from-gray-800/40 to-gray-900/30">
                      <img src={t.image_url} alt="testimonial" className="w-32 h-20 object-cover rounded-2xl bg-white" />
                      <button
                        className="bg-red-700 text-white px-3 py-1 rounded"
                        onClick={async () => {
                          setIsLoading(true);
                          setError(null);
                          try {
                            const { error } = await supabase
                              .from('testimonials')
                              .delete()
                              .eq('id', t.id);
                            if (error) throw error;
                            await fetchTestimonials();
                          } catch (err: any) {
                            setError('خطأ في حذف الرأي: ' + err.message);
                          } finally {
                            setIsLoading(false);
                          }
                        }}
                      >حذف</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'theme' && (
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
                <h2 className="text-xl font-bold mb-6 text-white">تخصيص المظهر</h2>
                <form onSubmit={handleThemeSettingsSave} className="space-y-6 max-w-lg mx-auto">
                  <div>
                    <label className="block mb-1 text-gray-300 font-medium">اللون الأساسي</label>
                    <input
                      type="color"
                      value={themeSettings.primaryColor}
                      onChange={e => setThemeSettings(s => ({ ...s, primaryColor: e.target.value }))}
                      className="w-16 h-10 border-none rounded"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-gray-300 font-medium">اللون الثانوي</label>
                    <input
                      type="color"
                      value={themeSettings.secondaryColor}
                      onChange={e => setThemeSettings(s => ({ ...s, secondaryColor: e.target.value }))}
                      className="w-16 h-10 border-none rounded"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-gray-300 font-medium">خلفية الموقع</label>
                    <div className="flex gap-4 mb-2">
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          name="backgroundType"
                          value="solid"
                          checked={themeSettings.backgroundType === 'solid'}
                          onChange={() => setThemeSettings(s => ({
                            ...s,
                            backgroundType: 'solid',
                            backgroundGradient: '',
                          }))}
                        />
                        لون ثابت
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          name="backgroundType"
                          value="gradient"
                          checked={themeSettings.backgroundType === 'gradient'}
                          onChange={() => setThemeSettings(s => ({
                            ...s,
                            backgroundType: 'gradient',
                            backgroundGradient: `linear-gradient(${s.gradientAngle}deg, ${s.gradientStartColor}, ${s.gradientEndColor})`,
                          }))}
                        />
                        تدرج لوني
                      </label>
                    </div>
                    {themeSettings.backgroundType === 'solid' && (
                      <div>
                        <input
                          type="color"
                          value={themeSettings.backgroundColor}
                          onChange={e => setThemeSettings(s => ({
                            ...s,
                            backgroundColor: e.target.value,
                            backgroundGradient: '',
                          }))}
                          className="w-16 h-10 border-none rounded"
                        />
                        <span className="ml-2 text-xs text-gray-400">اختر لون الخلفية الثابت</span>
                      </div>
                    )}
                    {themeSettings.backgroundType === 'gradient' && (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-400">البداية</label>
                          <input
                            type="color"
                            value={themeSettings.gradientStartColor}
                            onChange={e => setThemeSettings(s => {
                              const gradient = `linear-gradient(${s.gradientAngle}deg, ${e.target.value}, ${s.gradientEndColor})`;
                              return {
                                ...s,
                                gradientStartColor: e.target.value,
                                backgroundGradient: gradient,
                              };
                            })}
                            className="w-10 h-8 border-none rounded"
                          />
                          <label className="text-xs text-gray-400">النهاية</label>
                          <input
                            type="color"
                            value={themeSettings.gradientEndColor}
                            onChange={e => setThemeSettings(s => {
                              const gradient = `linear-gradient(${s.gradientAngle}deg, ${s.gradientStartColor}, ${e.target.value})`;
                              return {
                                ...s,
                                gradientEndColor: e.target.value,
                                backgroundGradient: gradient,
                              };
                            })}
                            className="w-10 h-8 border-none rounded"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mr-2">زاوية التدرج</label>
                          <input
                            type="number"
                            value={themeSettings.gradientAngle}
                            onChange={e => setThemeSettings(s => {
                              const angle = parseInt(e.target.value, 10) || 0;
                              const gradient = `linear-gradient(${angle}deg, ${s.gradientStartColor}, ${s.gradientEndColor})`;
                              return {
                                ...s,
                                gradientAngle: angle,
                                backgroundGradient: gradient,
                              };
                            })}
                            className="w-20 p-1 rounded bg-black/30 text-white border border-white/10"
                            min="0"
                            max="360"
                          />
                        </div>
                        <span className="text-xs text-gray-400">اختر ألوان وزاوية التدرج</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block mb-1 text-gray-300 font-medium">الخط الرئيسي</label>
                    <select
                      value={themeSettings.fontFamily}
                      onChange={e => setThemeSettings(s => ({ ...s, fontFamily: e.target.value }))}
                      className="w-full p-2 rounded bg-black/30 text-white border border-white/10"
                    >
                      <option value="Cairo">Cairo</option>
                      <option value="Tajawal">Tajawal</option>
                      <option value="Arial">Arial</option>
                      <option value="Tahoma">Tahoma</option>
                    </select>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="bg-[var(--primary-color,#34C759)] text-white px-6 py-2 rounded hover:bg-[var(--primary-color,#34C759)] transition-colors flex items-center gap-2 disabled:opacity-50"
                      disabled={savingTheme}
                    >
                      <Save className="w-5 h-5" />
                      حفظ إعدادات المظهر
                    </button>
                  </div>
                </form>
                <div className="mt-8">
                  <h3 className="text-lg font-bold mb-2 text-gray-200">معاينة مباشرة</h3>
                  <div
                    className="rounded-lg p-6"
                    style={{
                      background:
                        themeSettings.backgroundType === 'gradient'
                          ? themeSettings.backgroundGradient
                          : themeSettings.backgroundColor,
                      color: themeSettings.primaryColor,
                      fontFamily: themeSettings.fontFamily,
                      border: `2px solid ${themeSettings.secondaryColor}`
                    }}
                  >
                    <span style={{ color: themeSettings.primaryColor, fontWeight: 'bold' }}>عنوان رئيسي</span>
                    <p style={{ color: themeSettings.secondaryColor }}>هذا مثال على نص ثانوي</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'store' && (
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/40 border border-white/10 overflow-hidden">
                <div className="p-6 border-t border-white/10">
                  <form onSubmit={handleStoreSettingsUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-1">اسم المتجر</label>
                        <input
                          type="text"
                          value={storeSettings.store_name || ''}
                          onChange={(e) => setStoreSettings({ ...storeSettings, store_name: e.target.value })}
                          className="w-full p-3 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#34C759] focus:border-transparent bg-black/20 backdrop-blur-sm border border-white/10"
                          placeholder="اسم المتجر"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white mb-1">وصف المتجر</label>
                        <input
                          type="text"
                          value={storeSettings.store_description || ''}
                          onChange={(e) => setStoreSettings({ ...storeSettings, store_description: e.target.value })}
                          className="w-full p-3 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#34C759] focus:border-transparent bg-black/20 backdrop-blur-sm border border-white/10"
                          placeholder="وصف المتجر"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Logo Upload */}
                      <div>
                        <label className="block text-sm font-medium text-white mb-1">شعار المتجر</label>
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleSettingsImageUpload(e, 'logo')}
                            className="hidden"
                            id="logo-upload"
                          />
                          <label
                            htmlFor="logo-upload"
                            className="w-full flex items-center justify-center px-4 py-2 rounded cursor-pointer transition-colors text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#34C759] focus:border-transparent bg-black/20 backdrop-blur-sm border border-white/10 hover:bg-black/30"
                          >
                            <Upload className="w-5 h-5 ml-2" />
                            {storeSettings.logo_url ? 'تغيير الشعار' : 'رفع الشعار'}
                          </label>
                          {storeSettings.logo_url && (
                            <img
                              src={storeSettings.logo_url}
                              alt="الشعار"
                              className="mt-2 h-16 w-auto object-contain"
                            />
                          )}
                        </div>
                      </div>

                      {/* Favicon Upload */}
                      <div>
                        <label className="block text-sm font-medium text-white mb-1">أيقونة المتصفح</label>
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleSettingsImageUpload(e, 'favicon')}
                            className="hidden"
                            id="favicon-upload"
                          />
                          <label
                            htmlFor="favicon-upload"
                            className="w-full flex items-center justify-center px-4 py-2 rounded cursor-pointer transition-colors text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#34C759] focus:border-transparent bg-black/20 backdrop-blur-sm border border-white/10 hover:bg-black/30"
                          >
                            <Upload className="w-5 h-5 ml-2" />
                            {storeSettings.favicon_url ? 'تغيير الأيقونة' : 'رفع الأيقونة'}
                          </label>
                          {storeSettings.favicon_url && (
                            <img
                              src={storeSettings.favicon_url}
                              alt="أيقونة المتصفح"
                              className="mt-2 h-8 w-8 object-contain"
                            />
                          )}
                        </div>
                      </div>

                      {/* OG Image Upload */}
                      <div>
                        <label className="block text-sm font-medium text-white mb-1">صورة المشاركة</label>
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleSettingsImageUpload(e, 'og_image')}
                            className="hidden"
                            id="og-image-upload"
                          />
                          <label
                            htmlFor="og-image-upload"
                            className="w-full flex items-center justify-center px-4 py-2 rounded cursor-pointer transition-colors text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#34C759] focus:border-transparent bg-black/20 backdrop-blur-sm border border-white/10 hover:bg-black/30"
                          >
                            <Upload className="w-5 h-5 ml-2" />
                            {storeSettings.og_image_url ? 'تغيير الصورة' : 'رفع الصورة'}
                          </label>
                          {storeSettings.og_image_url && (
                            <img
                              src={storeSettings.og_image_url}
                              alt="صورة المشاركة"
                              className="mt-2 h-16 w-auto object-contain"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-1">عنوان الصفحة</label>
                        <input
                          type="text"
                          value={storeSettings.meta_title || ''}
                          onChange={(e) => setStoreSettings({ ...storeSettings, meta_title: e.target.value })}
                          className="w-full p-3 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#34C759] focus:border-transparent bg-black/20 backdrop-blur-sm border border-white/10"
                          placeholder="عنوان الصفحة"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white mb-1">وصف الصفحة</label>
                        <input
                          type="text"
                          value={storeSettings.meta_description || ''}
                          onChange={(e) => setStoreSettings({ ...storeSettings, meta_description: e.target.value })}
                          className="w-full p-3 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#34C759] focus:border-transparent bg-black/20 backdrop-blur-sm border border-white/10"
                          placeholder="وصف الصفحة"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-1">الكلمات المفتاحية (مفصولة بفواصل)</label>
                      <input
                        type="text"
                        value={storeSettings.keywords?.join(', ') || ''}
                        onChange={(e) => setStoreSettings({ ...storeSettings, keywords: e.target.value.split(',').map(k => k.trim()) })}
                        className="w-full p-3 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#34C759] focus:border-transparent bg-black/20 backdrop-blur-sm border border-white/10"
                        placeholder="كلمة1, كلمة2, كلمة3"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-1">رابط فيسبوك</label>
                        <input
                          type="url"
                          value={storeSettings.facebook_url || ''}
                          onChange={(e) => setStoreSettings({ ...storeSettings, facebook_url: e.target.value })}
                          className="w-full p-3 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#34C759] focus:border-transparent bg-black/20 backdrop-blur-sm border border-white/10"
                          placeholder="https://facebook.com/..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white mb-1">رابط انستغرام</label>
                        <input
                          type="url"
                          value={storeSettings.instagram_url || ''}
                          onChange={(e) => setStoreSettings({ ...storeSettings, instagram_url: e.target.value })}
                          className="w-full p-3 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#34C759] focus:border-transparent bg-black/20 backdrop-blur-sm border border-white/10"
                          placeholder="https://instagram.com/..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white mb-1">رابط تويتر</label>
                        <input
                          type="url"
                          value={storeSettings.twitter_url || ''}
                          onChange={(e) => setStoreSettings({ ...storeSettings, twitter_url: e.target.value })}
                          className="w-full p-3 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#34C759] focus:border-transparent bg-black/20 backdrop-blur-sm border border-white/10"
                          placeholder="https://twitter.com/..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white mb-1">رابط سناب شات</label>
                        <input
                          type="url"
                          value={storeSettings.snapchat_url || ''}
                          onChange={(e) => setStoreSettings({ ...storeSettings, snapchat_url: e.target.value })}
                          className="w-full p-3 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#34C759] focus:border-transparent bg-black/20 backdrop-blur-sm border border-white/10"
                          placeholder="https://snapchat.com/..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white mb-1">رابط تيك توك</label>
                        <input
                          type="url"
                          value={storeSettings.tiktok_url || ''}
                          onChange={(e) => setStoreSettings({ ...storeSettings, tiktok_url: e.target.value })}
                          className="w-full p-3 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#34C759] focus:border-transparent bg-black/20 backdrop-blur-sm border border-white/10"
                          placeholder="https://tiktok.com/..."
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-[#34C759] text-white px-4 py-2.5 rounded hover:bg-[#34C759] transition-colors flex items-center justify-center gap-2 font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/30 focus:ring-[#34C759]"
                      >
                        <Save className="w-5 h-5" />
                        حفظ الاعدادات
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* --- Banners Tab --- */}
            {activeTab === 'banners' && (
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/40 border border-white/10 overflow-hidden">
                <div className="p-8">
                  {/* Sub Tabs for banners */}
                  <div className="flex mb-8 gap-2">
                    <button
                      onClick={() => setBannersSubTab('image')}
                      className={`flex-1 py-2 rounded-t-lg font-bold ${
                        bannersSubTab === 'image'
                          ? 'bg-[#34C759] text-white shadow-lg border-b-4 border-[#34C759]'
                          : 'bg-black/20 text-white hover:bg-[#34C759]/10 hover:text-[#34C759]'
                      }`}
                    >
                      بانرات صور
                    </button>
                    <button
                      onClick={() => setBannersSubTab('text')}
                      className={`flex-1 py-2 rounded-t-lg font-bold transition-colors ${
                        bannersSubTab === 'text'
                          ? 'bg-[#34C759] text-white shadow-lg border-b-4 border-[#34C759]'
                          : 'bg-black/20 text-white hover:bg-[#34C759]/10 hover:text-[#34C759]'
                      }`}
                    >
                      بانرات نصية
                    </button>
                  </div>
                  {/* Banner Form */}
                  <form onSubmit={editingBanner ? handleUpdateBanner : handleAddBanner} className="mb-10 space-y-4">
                    {/* نوع البانر يتم التحكم فيه من التاب الفرعي */}
                    <input type="hidden" value={bannersSubTab} />
                    {/* اجعل نوع البانر حسب التاب الفرعي */}
                    {bannersSubTab === 'text' && (
                      <>
                        <input
                          type="text"
                          placeholder="عنوان البانر"
                          value={newBanner.type === 'text' ? newBanner.title : ''}
                          onChange={(e) => setNewBanner({ ...newBanner, type: 'text', title: e.target.value })}
                          className={`w-full p-3 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#34C759] focus:border-transparent bg-black/20 backdrop-blur-sm border border-white/10 disabled:opacity-50`}
                          required
                          disabled={isLoading}
                        />
                        <textarea
                          placeholder="وصف البانر"
                          value={newBanner.type === 'text' ? newBanner.description : ''}
                          onChange={(e) => setNewBanner({ ...newBanner, type: 'text', description: e.target.value })}
                          rows={3}
                          className={`w-full p-3 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#34C759] focus:border-transparent bg-black/20 backdrop-blur-sm border border-white/10 disabled:opacity-50`}
                          disabled={isLoading}
                        />
                      </>
                    )}
                    {bannersSubTab === 'image' && (
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => { setNewBanner({ ...newBanner, type: 'image' }); handleImageUpload(e, 'banner'); }}
                          className="hidden"
                          id="banner-image-upload"
                          disabled={uploadingBannerImage || isLoading}
                        />
                        <label
                          htmlFor="banner-image-upload"
                          className={`w-full flex items-center justify-center px-4 py-2.5 rounded cursor-pointer transition-colors text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/30 focus:ring-[#34C759] focus:border-transparent bg-black/20 backdrop-blur-sm border border-white/10 hover:bg-black/30 ${uploadingBannerImage || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <Upload className={`w-5 h-5 ml-2 text-[#34C759] ${uploadingBannerImage ? 'animate-pulse' : ''}`} />
                          <label className="image-upload-label" style={{ textAlign: 'center' }}>
  <span style={{ fontSize: '1.2em', fontWeight: 'bold' }}>
    {uploadingBannerImage ? 'جاري رفع الصورة...' : (newBanner.image_url ? 'تغيير الصورة' : 'اختر صورة للبانر')}
  </span>
  <div style={{ lineHeight: '1.2' }}> {/* Adjust lineHeight for tighter spacing */}
    <span style={{ fontSize: '0.8em', color: '#777', fontWeight: 'bold' }}>
      المقاس المناسب
    </span>
    <br />
    <span style={{ fontSize: '0.8em', color: '#777', fontWeight: 'bold' }}>
      1920px عرض × 500px ارتفاع
    </span>
  </div>
</label>                        </label>
                        {newBanner.type === 'image' && newBanner.image_url && !uploadingBannerImage && (
                          <div className="mt-3 flex items-center justify-center gap-4 bg-black/10 p-2 rounded border border-white/10">
                            <img
                              src={newBanner.image_url}
                              alt="معاينة"
                              className="w-16 h-16 object-cover rounded border border-gray-700"
                            />
                            <span className="text-gray-400 text-xs">صورة البانر الحالية/الجديدة</span>
                            <button type="button" onClick={() => setNewBanner({...newBanner, image_url: ''})} className="text-red-500 hover:text-red-400 p-1" title="إزالة الصورة">
                              <X size={16}/>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        className={`flex-grow bg-[#34C759] text-white py-2.5 px-4 rounded hover:bg-[#34C759] transition-colors flex items-center justify-center gap-2 font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/30 focus:ring-[#34C759] disabled:opacity-50 disabled:cursor-not-allowed`}
                        disabled={isLoading}
                      >
                        {editingBanner ? (
                          <> <Save size={20} /> حفظ التعديلات </>
                        ) : (
                          <> <Plus size={20} /> إضافة بانر </>
                        )}
                      </button>
                      {editingBanner && (
                        <button
                          type="button"
                          onClick={handleCancelEditBanner}
                          className="bg-gray-600 text-white px-4 py-2.5 rounded hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/30 focus:ring-gray-500 disabled:opacity-50"
                          disabled={isLoading}
                        >
                          <X size={20} /> إلغاء
                        </button>
                      )}
                    </div>
                  </form>
                  {/* Banner List */}
                  <h3 className="text-lg font-semibold mb-6 text-white border-b border-gray-700 pb-2 flex items-center gap-2">
                    <List className="w-5 h-5 text-yellow-400" />
                    البانرات الحالية
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {!isLoading && banners.filter(b => b.type === bannersSubTab).length === 0 && (
                      <div className="col-span-full text-gray-400 text-center mt-4">لا توجد بانرات لعرضها.</div>
                    )}
                    {isLoading && banners.filter(b => b.type === bannersSubTab).length === 0 && (
                      <div className="col-span-full text-gray-400 text-center mt-4">جاري تحميل البانرات...</div>
                    )}
                    {banners.filter(b => b.type === bannersSubTab).map((banner) => (
                      <div
                        key={banner.id}
                        className={`
                          relative group border border-gray-700/50 rounded-xl bg-gradient-to-br from-gray-800/60 to-gray-900/40 shadow-lg transition-all duration-300 overflow-hidden
                          ${editingBanner === banner.id ? `ring-2 ring-[#34C759] shadow-[0_0_16px_2px_#34C75933]` : 'hover:border-yellow-400/60 hover:shadow-yellow-400/10'}
                        `}
                      >
                        {/* Banner type indicator */}
                        <div className="absolute top-3 right-3 z-10">
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-500/20 text-blue-300">
                            {banner.type === 'text' ? 'نصي' : 'صورة'}
                          </span>
                        </div>
                        {/* Banner content */}
                        <div className="p-0 flex flex-col h-full">
                          {/* Banner image or icon */}
                          <div className="relative w-full h-40 flex items-center justify-center bg-gradient-to-tr from-yellow-100/10 to-black/10 rounded-t-xl overflow-hidden">
                            {banner.type === 'image' && banner.image_url ? (
                              <img
                                src={banner.image_url}
                                alt={banner.title || 'صورة البانر'}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center w-full h-full">
                                <Image className="w-12 h-12 text-yellow-400 opacity-60 mb-2" />
                                <span className="text-yellow-200 text-lg font-bold">{banner.title || 'بانر نصي'}</span>
                              </div>
                            )}

                          </div>
                          {/* Banner text content */}
                          <div className="flex-1 flex flex-col justify-between p-5">
                            <div>
                              <h4 className="font-bold text-white text-lg truncate" title={banner.title || ''}>
                                {banner.title || 'بدون عنوان'}
                              </h4>
                              {banner.description && (
                                <p className="text-gray-300 text-sm mt-1 line-clamp-2">{banner.description}</p>
                              )}
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                              <button
                                onClick={() => !isLoading && handleEditBanner(banner)}
                                title="تعديل البانر"
                                className={`text-blue-400 hover:text-blue-300 transition-colors p-1 rounded-full border border-blue-400/30 bg-blue-900/10 disabled:opacity-50 disabled:cursor-not-allowed`}
                                disabled={editingBanner === banner.id || isLoading}
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => !isLoading && handleDeleteBanner(banner.id)}
                                title="حذف البانر"
                                className="text-red-500 hover:text-red-400 transition-colors p-1 rounded-full border border-red-400/30 bg-red-900/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isLoading}
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'products' && (
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/40 border border-white/10 overflow-hidden">
                <div className="p-6 border-t border-white/10">
                  {/* تبويبات فرعية */}
                  <div className="flex mb-6 gap-2">
                    <button
                      onClick={() => setProductsSubTab('services')}
                      className={`flex-1 py-2 rounded-t-lg font-bold transition-colors ${
                        productsSubTab === 'services'
                          ? 'bg-[#34C759] text-white shadow-lg border-b-4 border-[#34C759]'
                          : 'bg-black/20 text-white hover:bg-[#34C759]/10 hover:text-[#34C759]'
                      }`}
                    >
                      المنتجات
                    </button>
                    <button
                      onClick={() => setProductsSubTab('categories')}
                      className={`flex-1 py-2 rounded-t-lg font-bold transition-colors ${
                        productsSubTab === 'categories'
                          ? 'bg-[#34C759] text-white shadow-lg border-b-4 border-[#34C759]'
                          : 'bg-black/20 text-white hover:bg-[#34C759]/10 hover:text-[#34C759]'
                      }`}
                    >
                      الأقسام
                    </button>
                  </div>

                  {/* المنتجات */}
                  {productsSubTab === 'services' && (
                    <>
                      <form onSubmit={editingService ? handleUpdateService : handleAddService} className="mb-8 space-y-4" id="service-form">
                        {/* عنوان المنتج */}
                        <input
                          type="text"
                          placeholder="عنوان المنتج"
                          value={newService.title}
                          onChange={(e) => setNewService({ ...newService, title: e.target.value })}
                          className={`w-full p-3 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#34C759] focus:border-transparent bg-black/20 backdrop-blur-sm border border-white/10 disabled:opacity-70 disabled:cursor-not-allowed`}
                          required
                          disabled={isLoading}
                        />
                        {/* الوصف */}
                        <textarea
                          placeholder="وصف المنتج (اختياري)"
                          value={newService.description}
                          onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                          rows={3}
                          className={`w-full p-3 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#34C759] focus:border-transparent bg-black/20 backdrop-blur-sm border border-white/10 disabled:opacity-70 disabled:cursor-not-allowed`}
                          disabled={isLoading}
                        />
                        {/* رفع الصورة */}
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="image-upload"
                            disabled={uploadingImage || isLoading}
                          />
                          <label
                            htmlFor="image-upload"
                            className={`w-full flex items-center justify-center px-4 py-2.5 rounded cursor-pointer transition-colors text-gray-300 bg-black/20 backdrop-blur-sm border border-white/10 hover:bg-black/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/30 focus:ring-[#34C759] ${uploadingImage || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <Upload className={`w-5 h-5 ml-2 text-[#34C759] ${uploadingImage ? 'animate-pulse' : ''}`} />
                            <label className="image-upload-label" style={{ textAlign: 'center' }}>
  <span style={{ fontSize: '1.2em', fontWeight: 'bold' }}>
    {uploadingImage ? 'جاري رفع الصورة...' : (newService.image_url ? 'تغيير الصورة' : 'اختر صورة للمنتج')}
  </span>
  <div style={{ lineHeight: '1.2' }}>
    <span style={{ fontSize: '0.8em', color: '#777', fontWeight: 'bold' }}>
      المقاس المناسب
    </span>
    <br />
    <span style={{ fontSize: '0.8em', color: '#777', fontWeight: 'bold' }}>
      (أبعاد أفقية 5:4)
    </span>
  </div>
</label>                          </label>
                          {newService.image_url && !uploadingImage && (
                            <div className="mt-3 flex items-center justify-center gap-4 bg-black/10 p-2 rounded border border-white/10">
                              <img
                                src={newService.image_url}
                                alt="معاينة"
                                className="w-16 h-16 object-cover rounded border border-gray-700"
                              />
                              <span className="text-gray-400 text-xs">صورة المنتج الحالية/الجديدة</span>
                              <button type="button" onClick={() => setNewService({...newService, image_url: ''})} className="text-red-500 hover:text-red-400 p-1" title="إزالة الصورة">
                                <X size={16}/>
                              </button>
                            </div>
                          )}
                        </div>
                        {/* اختيار القسم */}
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className={`w-full p-3 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#34C759] focus:border-transparent bg-black/20 backdrop-blur-sm border border-white/10 appearance-none disabled:opacity-70 disabled:cursor-not-allowed`}
                          required
                          disabled={isLoading || categories.length === 0}
                        >
                          <option value="" disabled className="text-gray-500">-- اختر القسم --</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id} className="bg-gray-800 text-white">
                              {category.name}
                            </option>
                          ))}
                          {categories.length === 0 && <option disabled>لا توجد أقسام</option>}
                        </select>
                        {/* السعر */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-white mb-1">السعر الأصلي</label>
                            <input
                              type="text"
                              placeholder=" اضف السعر فقط وسيتم اضافة العملة تلقائيا  "
                              value={newService.price}
                              onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                              className={`w-full p-3 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#34C759] focus:border-transparent bg-black/20 backdrop-blur-sm border border-white/10 disabled:opacity-70 disabled:cursor-not-allowed`}
                              disabled={isLoading}
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-white mb-1">سعر التخفيض (اختياري)</label>
                            <input
                              type="text"
                              placeholder="اضف السعر فقط وسيتم اضافة العملة تلقائيا)"
                              value={newService.sale_price}
                              onChange={(e) => setNewService({ ...newService, sale_price: e.target.value })}
                              className={`w-full p-3 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#34C759] focus:border-transparent bg-black/20 backdrop-blur-sm border border-white/10 disabled:opacity-70 disabled:cursor-not-allowed`}
                              disabled={isLoading}
                            />
                          </div>
                        </div>
                        {/* Latest Offers and Best Sellers Checkboxes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="is_featured"
                              checked={newService.is_featured || false}
                              onChange={(e) => setNewService({ ...newService, is_featured: e.target.checked })}
                              className="h-5 w-5 text-yellow-400 rounded focus:ring-yellow-400 border-gray-600 bg-gray-700"
                            />
                            <label htmlFor="is_featured" className="mr-2 text-sm font-medium text-white">
                              أحدث العروض
                            </label>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="is_best_seller"
                              checked={newService.is_best_seller || false}
                              onChange={(e) => setNewService({ ...newService, is_best_seller: e.target.checked })}
                              className="h-5 w-5 text-yellow-400 rounded focus:ring-yellow-400 border-gray-600 bg-gray-700"
                            />
                            <label htmlFor="is_best_seller" className="mr-2 text-sm font-medium text-white">
                              الأكثر مبيعاً
                            </label>
                          </div>
                        </div>
                        {/* رفع الصور الإضافية */}
                        <div>
                          <label className="block text-sm font-medium text-white mb-1">صور إضافية للمنتج <span className="text-gray-400">(اختياري)</span></label>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleGalleryUpload}
                            className="w-full p-2 rounded bg-black/20 text-white border border-white/10"
                            disabled={uploadingImage || isLoading}
                          />
                          {/* عرض الصور المصغرة مع خيار تحديد الرئيسية والحذف */}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {newService.gallery && newService.gallery.map((img, idx) => (
                              <div key={img} className="relative">
                                <img
                                  src={img}
                                  alt={`صورة إضافية ${idx + 1}`}
                                  className={`w-16 h-16 object-cover rounded border-2 ${newService.image_url === img ? 'border-yellow-400' : 'border-white/20'}`}
                                  onClick={() => setNewService(prev => {
                                    // إذا اختار المستخدم صورة من المعرض كصورة رئيسية، أزلها من المعرض
                                    const newGallery = (prev.gallery || []).filter(g => g !== img);
                                    return { ...prev, image_url: img, gallery: newGallery };
                                  })}
                                  style={{ cursor: 'pointer' }}
                                  title={newService.image_url === img ? 'الصورة الرئيسية' : 'تعيين كصورة رئيسية'}
                                />
                                <button
                                  type="button"
                                  className="absolute top-0 left-0 bg-black/60 text-white rounded-full p-1 text-xs"
                                  onClick={() => setNewService(prev => ({
                                    ...prev,
                                    gallery: prev.gallery.filter((g) => g !== img),
                                    image_url: prev.image_url === img ? '' : prev.image_url,
                                  }))}
                                  title="حذف الصورة"
                                >×</button>
                                {newService.image_url === img && (
                                  <span className="absolute bottom-0 right-0 bg-yellow-400 text-black text-xs px-1 rounded-tr rounded-bl">رئيسية</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* زر الإضافة/التعديل */}
                        <div className="flex gap-3">
                          <button
                            type="submit"
                            className={`flex-grow bg-[#34C759] text-white py-2.5 px-4 rounded font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/30 border border-yellow-400 transition-colors flex items-center justify-center gap-2
                        ${isLoading || (editingService ? false : !selectedCategory)
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-yellow-400 hover:text-black'}
                        `}
                        
                            disabled={isLoading || (editingService ? false : !selectedCategory)}
                          >
                            {editingService ? (
                              <> <Save size={20} /> حفظ التعديلات </>
                            ) : (
                              <> <Plus size={20} /> حفظ وإضافة المنتج </>
                            )}
                          </button>
                          {editingService && (
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="bg-gray-600 text-white px-4 py-2.5 rounded hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/30 focus:ring-gray-500 disabled:opacity-70 disabled:bg-gray-500 disabled:text-white disabled:cursor-not-allowed"
                              disabled={isLoading}
                            >
                              <X size={20} /> إلغاء
                            </button>
                          )}
                        </div>
                      </form>

                      <h3 className="text-lg font-semibold mb-4 text-white border-b border-gray-700 pb-2">المنتجات الحالية</h3>
                      <div className="space-y-3">
                        {!isLoading && services.length === 0 && <p className="text-gray-400 text-center mt-4">لا توجد منتجات لعرضها.</p>}
                        {isLoading && services.length === 0 && <p className="text-gray-400 text-center mt-4">جاري تحميل المنتجات...</p>}
                        {services.map((service) => (
                          <div key={service.id} className={`border border-gray-700/50 p-4 rounded-lg bg-gradient-to-r from-gray-800/40 to-gray-900/30 transition-all duration-300 ${editingService === service.id ? `ring-2 ring-[#34C759] shadow-lg shadow-[#34C759]/20` : 'hover:border-gray-600 hover:bg-gray-800/60'}`}>
                            <div className="flex justify-between items-start gap-4">
                              {/* صورة المنتج أولاً */}
                              {service.image_url && (
                                <img
                                  src={service.image_url}
                                  alt={service.title}
                                  className="w-16 h-16 object-cover rounded border border-gray-700 flex-shrink-0"
                                />
                              )}
                              <div className="flex-1 flex flex-col overflow-hidden">
                                <div className="text-xs text-gray-400 mb-1 font-medium truncate" title={service.category?.name || 'قسم غير محدد'}>
                                  {service.category?.name || 'قسم غير محدد'}
                                </div>
                                <h4 className="font-bold text-white text-lg truncate" title={service.title}>{service.title}</h4>
                                {service.description && <p className="text-gray-400 text-sm mt-1 line-clamp-2">{service.description}</p>}
                                {service.sale_price ? (
                                  <div className="flex items-center gap-3 mt-2">
                                    <span className="font-semibold text-[#34C759] text-lg">
                                      {service.sale_price}
                                    </span>
                                    {service.price && (
                                      <span className="text-sm text-gray-400 line-through">
                                        {service.price}
                                      </span>
                                    )}
                                  </div>
                                ) : service.price && (
                                  <p className="font-semibold mt-2 text-[#34C759] text-lg">
                                    {service.price}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-3 flex-shrink-0">
                                <button
                                  onClick={() => !isLoading && handleEditService(service)}
                                  title="تعديل المنتج"
                                  className={`text-blue-400 hover:text-blue-300 transition-colors p-1 disabled:opacity-50 disabled:cursor-not-allowed`}
                                  disabled={editingService === service.id || isLoading}
                                >
                                  <Edit size={18} />
                                </button>
                                <button
                                  onClick={() => !isLoading && handleDeleteService(service.id)}
                                  title="حذف المنتج"
                                  className="text-red-500 hover:text-red-400 transition-colors p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={isLoading}
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* الأقسام */}
                  {productsSubTab === 'categories' && (
                    <>
                      <form onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory} className="mb-8 space-y-4" id="category-form">
                        <input
                          type="text"
                          placeholder="اسم القسم"
                          value={newCategory.name}
                          onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                          className={`w-full p-3 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#34C759] focus:border-transparent bg-black/20 backdrop-blur-sm border border-white/10 disabled:opacity-50`}
                          required
                          disabled={isLoading}
                        />
                        <textarea
                          placeholder="وصف القسم (اختياري)"
                          value={newCategory.description}
                          onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                          rows={3}
                          className={`w-full p-3 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#34C759] focus:border-transparent bg-black/20 backdrop-blur-sm border border-white/10 disabled:opacity-50`}
                          disabled={isLoading}
                        />
                        <div className="flex gap-3">
                          <button
                            type="submit"
                            className={`flex-grow bg-[#34C759] text-white py-2.5 px-4 rounded hover:bg-[#34C759] transition-colors flex items-center justify-center gap-2 font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/30 focus:ring-[#34C759] disabled:opacity-50 disabled:cursor-not-allowed`}
                            disabled={isLoading}
                          >
                            {editingCategory ? (
                              <> <Save size={20} /> حفظ التعديلات </>
                            ) : (
                              <> <Plus size={20} /> إضافة قسم </>
                            )}
                          </button>
                          {editingCategory && (
                            <button
                              type="button"
                              onClick={handleCancelEditCategory}
                              className="bg-gray-600 text-white px-4 py-2.5 rounded hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/30 focus:ring-gray-500 disabled:opacity-50"
                              disabled={isLoading}
                            >
                              <X size={20} /> إلغاء
                            </button>
                          )}
                        </div>
                      </form>

                      <h3 className="text-lg font-semibold mb-4 text-white border-b border-gray-700 pb-2">الأقسام الحالية</h3>
                      <div className="space-y-3">
                        {!isLoading && categories.length === 0 && <p className="text-gray-400 text-center mt-4">لا توجد أقسام لعرضها.</p>}
                        {isLoading && categories.length === 0 && <p className="text-gray-400 text-center mt-4">جاري تحميل الأقسام...</p>}
                        {categories.map((category) => (
                          <div key={category.id} className={`border border-gray-700/50 p-4 rounded-lg bg-gradient-to-r from-gray-800/40 to-gray-900/30 transition-all duration-300 ${editingCategory === category.id ? `ring-2 ring-[#34C759] shadow-lg shadow-[#34C759]/20` : 'hover:border-gray-600 hover:bg-gray-800/60'}`}>
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1 overflow-hidden">
                                <h4 className="font-bold text-white text-lg truncate" title={category.name}>{category.name}</h4>
                                {category.description && <p className="text-gray-400 text-sm mt-1 line-clamp-2">{category.description}</p>}
                              </div>
                              <div className="flex gap-3 flex-shrink-0">
                                <button
                                  onClick={() => !isLoading && handleEditCategory(category)}
                                  title="تعديل القسم"
                                  className={`text-blue-400 hover:text-blue-300 transition-colors p-1 disabled:opacity-50 disabled:cursor-not-allowed`}
                                  disabled={editingCategory === category.id || isLoading}
                                >
                                  <Edit size={18} />
                                </button>
                                <button
                                  onClick={() => !isLoading && handleDeleteCategory(category.id)}
                                  title="حذف القسم"
                                  className="text-red-500 hover:text-red-400 transition-colors p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={isLoading}
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
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
      {/* تبويب آراء العملاء */}
      {activeTab === 'testimonials' && (
        <div className="bg-black/40 rounded-lg p-8 shadow-lg border border-gray-70000 mt-0">
          <div className="">
            {isLoading && <p className=""></p>}
            {!isLoading && testimonials.length === 0 && <p className="text-gray-400 text-center mt-4"></p>}
            {testimonials.map((t: Testimonial) => (
              <div key={t.id} className="">
                {t.image_url && <img src={t.image_url} alt={t.customer_name} className="w-0 h-16 rounded-full object-cover " />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* فوتر وزر العودة للصفحة الرئيسية بلون أبيض شفاف */}
      <footer className="w-full flex justify-center py-8 mt-10">
        <button
          onClick={() => {
        window.location.href = '/';
          }}
          className="bg-white/70 hover:bg-white text-black font-bold px-8 py-3 rounded-full shadow-lg transition-colors border-2 "
        >
        ← العودة للصفحة الرئيسية
        </button>
      </footer>

    </div>
  );
}
