const fetchStoreSettings = async () => {
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching store settings:", error);
      // Set default settings if fetch fails
      setStoreSettings({
        id: '00000000-0000-0000-0000-000000000001',
        store_name: 'سمار هوم',
        store_description: 'أفضل المنتجات المنزلية الذكية والمريحة',
        logo_url: null,
        meta_title: 'سمار هوم',
        meta_description: 'أفضل المنتجات المنزلية الذكية والمريحة',
        theme_settings: {
          primaryColor: '#c7a17a',
          secondaryColor: '#fff',
          fontFamily: 'Cairo, sans-serif',
          backgroundColor: '#000',
          backgroundGradient: 'linear-gradient(135deg, #232526 0%, #414345 100%)'
        }
      } as StoreSettings);
      return;
    }
    
    if (data) {
      setStoreSettings(data);
    } else {
      // No data found, set default settings
      setStoreSettings({
        id: '00000000-0000-0000-0000-000000000001',
        store_name: 'سمار هوم',
        store_description: 'أفضل المنتجات المنزلية الذكية والمريحة',
        logo_url: null,
        meta_title: 'سمار هوم',
        meta_description: 'أفضل المنتجات المنزلية الذكية والمريحة',
        theme_settings: {
          primaryColor: '#c7a17a',
          secondaryColor: '#fff',
          fontFamily: 'Cairo, sans-serif',
          backgroundColor: '#000',
          backgroundGradient: 'linear-gradient(135deg, #232526 0%, #414345 100%)'
        }
      } as StoreSettings);
    }
  } catch (error) {
    console.error("Unexpected error fetching store settings:", error);
    // Set default settings on any unexpected error
    setStoreSettings({
      id: '00000000-0000-0000-0000-000000000001',
      store_name: 'سمار هوم',
      store_description: 'أفضل المنتجات المنزلية الذكية والمريحة',
      logo_url: null,
      meta_title: 'سمار هوم',
      meta_description: 'أفضل المنتجات المنزلية الذكية والمريحة',
      theme_settings: {
        primaryColor: '#c7a17a',
        secondaryColor: '#fff',
        fontFamily: 'Cairo, sans-serif',
        backgroundColor: '#000',
        backgroundGradient: 'linear-gradient(135deg, #232526 0%, #414345 100%)'
      }
    } as StoreSettings);
  }
};
