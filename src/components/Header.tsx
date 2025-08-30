import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, Search, X, ShoppingCart, Trash2, ChevronUp, Menu, X as Close } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Category, StoreSettings, Service } from '../types/database';
import { useCart } from '../contexts/CartContext';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  storeSettings?: StoreSettings | null;
}

export default function Header({ storeSettings }: HeaderProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Service[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isCartHovered, setIsCartHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCartPreview, setShowCartPreview] = useState(false);
  const cartPreviewTimer = useRef<NodeJS.Timeout | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const cartRef = useRef<HTMLLIElement>(null);
  const cartButtonRef = useRef<HTMLButtonElement>(null);
  const cartDropdownRef = useRef<HTMLDivElement>(null);
  const { 
    toggleCart, 
    itemCount, 
    cartItems, 
    removeFromCart, 
    updateQuantity, 
    isCartOpen,
    cartTotal,
    sendOrderViaWhatsApp,
    isAutoShowing
  } = useCart();
  
  // Toggle mobile search and focus the input when opened
  const toggleMobileSearch = () => {
    setIsMobileSearchOpen(!isMobileSearchOpen);
    if (!isMobileSearchOpen && searchInputRef.current) {
      // Small delay to ensure the input is visible before focusing
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setSearchQuery('');
      setSearchResults([]);
    }
  };



  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      // Search in both name and description using ilike for case-insensitive partial matching
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select(`
          *,
          category:categories(*),
          product_images(image_url)
        `)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(10);

      if (servicesError) throw servicesError;
      
      if (!services) {
        setSearchResults([]);
        return;
      }
      
      // Transform the data to handle images properly
      const formattedServices = services.map(service => ({
        ...service,
        // Use the first product image if available, otherwise fallback to the main image_url
        displayImage: service.product_images?.[0]?.image_url || service.image_url || '/placeholder-product.jpg'
      }));
      
      setSearchResults(formattedServices);
    } catch (error) {
      console.error('Error searching products:', error);
      setSearchResults([]);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchFocused(false);
  };

  // Fetch categories for the mobile menu
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name');

        if (error) throw error;
        setCategories(data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoadingCategories(false);
      }
    };

    if (isMenuOpen) {
      fetchCategories();
    }
  }, [isMenuOpen]);

  // Handle cart preview timeout
  useEffect(() => {
    if (showCartPreview) {
      // Clear any existing timer
      if (cartPreviewTimer.current) {
        clearTimeout(cartPreviewTimer.current);
      }
      
      // Set new timer to hide cart preview after 2 seconds
      cartPreviewTimer.current = setTimeout(() => {
        setShowCartPreview(false);
      }, 2000);
    }
    
    // Cleanup timer on unmount
    return () => {
      if (cartPreviewTimer.current) {
        clearTimeout(cartPreviewTimer.current);
      }
    };
  }, [showCartPreview]);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      // Close mobile menu when clicking outside
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && 
          !(event.target as HTMLElement).closest('.mobile-menu-button')) {
        setIsMenuOpen(false);
      }
      // Skip if it's a touch event on mobile
      if ('touches' in event) {
        const target = event.target as HTMLElement;
        // Only handle touch events for the search input
        if (searchInputRef.current && searchInputRef.current.contains(target)) {
          return;
        }
      } else {
        const target = event.target as HTMLElement;
        
        // Close desktop search dropdown
        if (searchRef.current && !searchRef.current.contains(target)) {
          setIsSearchFocused(false);
        }
        
        // Close mobile search when clicking outside
        if (isMobileSearchOpen && !target.closest('.mobile-search-container')) {
          const isSearchIcon = target.closest('button[aria-label="Search"]');
          const isSearchInput = target.closest('input[type="text"]');
          
          if (!isSearchIcon && !isSearchInput) {
            setIsMobileSearchOpen(false);
            setSearchQuery('');
            setSearchResults([]);
          }
        }
      }
    }

    // Add both mouse and touch events
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobileSearchOpen]);

  useEffect(() => {
    if (isMobileSearchOpen && searchInputRef.current) {
      // Small timeout to ensure the input is visible before focusing
      const timer = setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          // For mobile devices, we need to explicitly open the keyboard
          if ('virtualKeyboard' in navigator) {
            // @ts-ignore - VirtualKeyboard API is experimental
            navigator.virtualKeyboard.show();
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isMobileSearchOpen]);

  // Remove mouse hover effects since we're using click now

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-[#12182b] backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button 
              className="md:hidden text-white p-2 -ml-2 mobile-menu-button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Menu"
            >
              {isMenuOpen ? <Close className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            
            <Link to="/" className="flex-shrink-0">
              <img 
                src={storeSettings?.logo_url || '/logo.svg'}
                alt={storeSettings?.store_name || 'Logo'} 
                className="h-16 md:h-20 w-auto logo-glow"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== '/logo.svg') {
                    target.src = '/logo.svg';
                  }
                }}
              />
            </Link>
          </div>
          
          {/* Desktop Search Bar - Hidden on mobile */}
          <div className="hidden md:block relative flex-1 max-w-xl mx-8" ref={searchRef}>
            <div className="relative hidden md:block flex-1 max-w-2xl">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => {
                  setIsSearchFocused(true);
                  // Close cart when search input is focused
                  if (isCartOpen) {
                    toggleCart(false);
                  }
                }}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                placeholder="Search for a product..." className="text-glow w-full bg-white/10 text-white placeholder-white/50 rounded-lg py-2 pr-10 pl-4 focus:outline-none focus:ring-2 focus:ring-[#1b82ae] transition-all duration-300"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
              {searchQuery && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearSearch();
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {/* Search Results Dropdown */}
            {isSearchFocused && (searchResults.length > 0 || (searchQuery.length >= 2 && searchResults.length === 0)) && (
              <div className="absolute mt-2 w-full bg-black/90 backdrop-blur-md rounded-md shadow-xl border border-white/10 overflow-hidden z-50">
                {searchResults.map((product) => (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    className="flex items-center p-3 hover:bg-white/10 transition-colors duration-200 border-b border-white/5 last:border-0"
                    onClick={clearSearch}
                  >
                    <div className="w-12 h-12 flex-shrink-0 rounded-sm overflow-hidden bg-white/5 flex items-center justify-center">
                      <img 
                        src={product.displayImage} 
                        alt={product.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to placeholder if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-product.jpg';
                        }}
                      />
                    </div>
                    <div className="flex-1 text-right pr-2">
                      <h4 className="text-white font-medium">{product.title}</h4>
                      <p className="text-xs text-white/60">
                        {product.category?.name || ''}
                      </p>
                    </div>
                  </Link>
                ))}
                
                {searchResults.length === 0 && searchQuery.length >= 2 && (
                  <div className="p-4 text-center text-white/70">
                    No results for "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {/* Mobile Search Toggle Button */}
            <button 
              onClick={() => {
                const wasOpen = isMobileSearchOpen;
                setIsMobileSearchOpen(!wasOpen);
                // Close cart if it's open
                if (isCartOpen) {
                  toggleCart(false);
                }
                // If we're opening the search, focus will be handled by the effect
                // If we're closing it, blur any active element
                if (wasOpen && document.activeElement) {
                  (document.activeElement as HTMLElement).blur();
                }
              }}
              className="md:hidden p-2 text-white hover:text-[#FFD700] transition-colors"
              aria-label="Search"
            >
              <Search className="h-6 w-6" />
            </button>
            
            <nav>
              <ul className="flex gap-4 md:gap-6 items-center">
                <li className="hidden md:block">
                  <Link to="/" className="text-white hover:text-[#FFD700] transition-colors duration-300 text-glow">
                    Home
                  </Link>
                </li>
                <li>
                  <a href="#contact" className="text-white hover:text-[#FFD700] transition-colors duration-300 text-glow">
                    Contact Us
                  </a>
                </li>
                <li className="relative" ref={cartRef}>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCart(!isCartOpen);
                      }}
                      className="relative p-2 text-white hover:text-[#FFD700] transition-colors"
                      aria-label="View Cart"
                      aria-expanded={isCartOpen}
                    >
                      <div className="relative">
                        <ShoppingCart className="h-6 w-6" />
                        {itemCount > 0 && (
                          <span className="absolute -top-2 -right-2 bg-[#FFD700] text-black text-xs font-bold rounded-md h-5 min-w-[20px] flex items-center justify-center px-1 border-2 border-black/10 shadow-sm">
                            {itemCount > 9 ? '9+' : itemCount}
                          </span>
                        )}
                      </div>
                    </button>
                    
                    {/* Cart Preview Dropdown */}
                    {isCartOpen && (
                      <div 
                        className="fixed left-1/2 transform -translate-x-1/2 mt-2 w-[90vw] max-w-2xl max-h-[calc(100vh-8rem)] bg-black/95 backdrop-blur-md rounded-md shadow-2xl border border-white/10 z-50 p-4 overflow-y-auto"
                        style={{
                          top: 'calc(var(--header-height, 5rem) + 1rem)'
                        }}
                      >
                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/10">
                          <h3 className="text-white font-bold text-lg">
                            Shopping Cart
                          </h3>
                          <span className="text-sm text-white/60">
                            {itemCount} {itemCount === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                        <div className="max-h-96 overflow-y-auto pr-2">
                          {cartItems.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
                              <div className="w-16 h-16 flex-shrink-0 rounded-sm overflow-hidden bg-white/5">
                                <img 
                                  src={item.imageUrl} 
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/placeholder-product.jpg';
                                  }}
                                />
                              </div>
                              <div className="flex-1 text-right">
                                <h4 className="text-white text-sm font-medium line-clamp-1">{item.title}</h4>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-[#FFD700] font-bold">{item.price} EGP</span>
                                  <div className="flex items-center gap-2">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (item.quantity > 1) {
                                          updateQuantity(item.id, item.quantity - 1);
                                        } else {
                                          removeFromCart(item.id);
                                          toast.success('Product removed from cart');
                                        }
                                      }}
                                      className="w-6 h-6 flex items-center justify-center bg-white/10 rounded hover:bg-white/20 transition-colors"
                                    >
                                      <span className="text-white text-lg">-</span>
                                    </button>
                                    <span className="text-white w-6 text-center">{item.quantity}</span>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateQuantity(item.id, item.quantity + 1);
                                      }}
                                      className="w-6 h-6 flex items-center justify-center bg-white/10 rounded hover:bg-white/20 transition-colors"
                                    >
                                      <span className="text-white text-lg">+</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFromCart(item.id);
                                  toast.success('Product removed from cart');
                                }}
                                className="text-white/50 hover:text-red-500 transition-colors p-1"
                                aria-label="Remove from cart"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 pt-3 border-t border-white/10">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-white/70">Total:</span>
                            <div className="text-right">
                              <div className="text-[#FFD700] font-bold text-lg">
                                {(() => {
                                  try {
                                    const numericValue = parseFloat(cartTotal);
                                    if (isNaN(numericValue)) {
                                      console.error('Invalid cart total value:', cartTotal);
                                      return '0.00 EGP';
                                    }
                                    return new Intl.NumberFormat('en-US', { 
                                      style: 'decimal',
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2
                                    }).format(numericValue) + ' EGP';
                                  } catch (error) {
                                    console.error('Error formatting cart total:', error);
                                    return '0.00 EGP';
                                  }
                                })()}
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              sendOrderViaWhatsApp();
                              setIsCartHovered(false);
                            }}
                            className="w-full bg-[#FFD700] hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded-md transition-colors duration-300 flex items-center justify-center gap-2"
                          >
                            <ShoppingCart className="h-5 w-5" />
                            Complete Order
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              </ul>
              </nav>
            </div>
            
            {/* Mobile Search Bar - Only shown when toggled */}
            {isMobileSearchOpen && (
              <div className="fixed top-20 left-0 right-0 bg-black/90 backdrop-blur-md p-4 z-40 border-b border-white/10 md:hidden">
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search for a product..."
                    className="w-full bg-white/10 text-white placeholder-white/50 rounded-lg py-3 px-5 pr-12 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                  />
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  
                  {/* Mobile Search Results */}
                  {searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 mt-2 bg-black/90 rounded-md shadow-xl border border-white/10 overflow-hidden z-50 max-h-80 overflow-y-auto">
                      {searchResults.map((product) => (
                        <Link
                          key={product.id}
                          to={`/product/${product.id}`}
                          className="flex items-center p-3 hover:bg-white/10 transition-colors duration-200 border-b border-white/5 last:border-0"
                          onClick={() => {
                            clearSearch();
                            setIsMobileSearchOpen(false);
                          }}
                        >
                          <div className="w-10 h-10 flex-shrink-0 rounded-sm overflow-hidden bg-white/5 flex items-center justify-center">
                            <img 
                              src={product.displayImage} 
                              alt={product.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/placeholder-product.jpg';
                              }}
                            />
                          </div>
                          <div className="flex-1 text-right pr-2">
                            <h4 className="text-white font-medium text-sm">{product.title}</h4>
                            {product.category?.name && (
                              <p className="text-xs text-white/60">{product.category.name}</p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', ease: 'easeInOut' }}
              className="fixed inset-y-0 left-0 w-72 bg-black/95 backdrop-blur-lg z-50 shadow-2xl md:hidden pt-16 flex flex-col"
              ref={menuRef}
            >
              <nav className="p-4 flex-1 overflow-y-auto">
                <ul className="space-y-1">
                  <li className="bg-white/2 rounded-lg shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                    <Link 
                      to="/" 
                      className="block px-5 py-4 text-lg text-white hover:bg-white/10 rounded-lg transition-colors font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Home Page
                    </Link>
                  </li>
                  
                  <li className="mt-6 bg-white/5 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
                    <div className="px-5 py-1.5 text-white/60 text-sm font-normal border-b border-white/10">
                      Categories
                    </div>
                    {loadingCategories ? (
                      <div className="px-5 py-4 text-white/50 text-base text-center">Loading...</div>
                    ) : categories.length > 0 ? (
                      <ul className="mt-1">
                        {categories.map((category) => (
                          <li key={category.id} className="border-b border-white/5 last:border-0">
                            <Link 
                              to={`/category/${category.id}`}
                              className="block px-5 py-4 text-white hover:bg-white/10 transition-colors text-base font-medium"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              {category.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="px-5 py-4 text-white/50 text-base text-center">No categories available</div>
                    )}
                  </li>
                </ul>
              </nav>
              
              {/* Close button at the bottom */}
              <div className="p-4 border-t border-white/10">
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                  <span>Close Menu</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overlay when menu is open */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
        )}
      </>
    );
  }
