import React, { useEffect, useState } from 'react';
import ServiceCard from './ServiceCard';
import { supabase } from '../lib/supabase';
import type { Service, Category } from '../types/database';
import { motion, AnimatePresence } from 'framer-motion';

const lightGold = '#FFD700';
const brownDark = '#3d2c1d';
const accentColor = '#d99323'; // New accent color for selected categories

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          category:categories(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // عرض تدريجي للمنتجات مع زر "إظهار المزيد"
  const [visibleCount, setVisibleCount] = useState(10);
  const filteredServices = selectedCategory
    ? services.filter(service => service.category_id === selectedCategory)
    : services;
  const visibleServices = filteredServices.slice(0, visibleCount);
  const canShowMore = visibleCount < filteredServices.length;
  const handleShowMore = () => setVisibleCount(c => c + 10);

  if (isLoading) {
    return (
      <div className={`py-16 bg-gradient-to-br from-[${brownDark}] to-black`}>
        <div className="container mx-auto px-4 text-center text-secondary">
          
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`py-16 bg-gradient-to-br from-[${brownDark}] to-black`}>
        <div className="container mx-auto px-4 text-center text-red-600">
          حدث خطأ أثناء تحميل العطور
        </div>
      </div>
    );
  }

  return (
    <section className={`py-16 bg-gradient-to-br from-[${brownDark}] to-black`} id="products">
      <motion.div
        className="container mx-auto px-4 bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl shadow-black/40"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.11
            }
          }
        }}
      >
        {/* العنوان */}
        <motion.h2
          className={`text-3xl font-bold text-center mb-12 text-[${lightGold}]`}
          initial={{ opacity: 0, y: -32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
           منتجاتنا
        </motion.h2>
        {/* الفاصل */}
        <motion.div
          className={`w-full h-1 bg-[${lightGold}] mb-8`}
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut', delay: 0.13 }}
        />

        {/* الفئات */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-22"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: 0.06 }
            }
          }}
        >
          <motion.button
            onClick={() => setSelectedCategory(null)}
            className={`p-4 rounded-xl transition-all duration-300 ${
              !selectedCategory
                ? `bg-[var(--color-secondary,#34C759)] text-black font-bold shadow-md`
                : 'bg-black/20 text-white hover:bg-black/30 hover:shadow-md'
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            جميع العطور
          </motion.button>
          <AnimatePresence>
            {categories.map((category, idx) => (
              <motion.button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`p-4 rounded-xl transition-all duration-300 ${
                  category.id === selectedCategory
                    ? `bg-[var(--color-secondary,#34C759)] text-black font-bold shadow-md`
                    : 'bg-black/20 text-white hover:bg-black/30 hover:shadow-md'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.23, delay: 0.06 + idx * 0.05 }}
              >
                <h3 className="text-lg font-semibold mb-1">{category.name}</h3>
                {category.description && (
                  <p className="text-sm opacity-80">{category.description}</p>
                )}
              </motion.button>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* الخدمات */}
        <motion.div
  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
  initial="hidden"
  animate="visible"
  variants={{
    hidden: { opacity: 0, y: 50 }, // Starts invisible and 50px below its final position
    visible: {
      opacity: 1,
      y: 0, // Slides to its final position
      transition: {
        staggerChildren: 0.1,
        // You can also add a transition for the individual child here if needed
      }
    }
  }}
>
        >
          <AnimatePresence>
            {visibleServices.map((service, idx) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                transition={{ duration: 0.28, delay: 0.08 + idx * 0.06, ease: 'easeOut' }}
              >
                <ServiceCard
                  id={service.id}
                  title={service.title}
                  description={service.description || ''}
                  imageUrl={service.image_url || ''}
                  price={service.price || ''}
                  salePrice={service.sale_price || null}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          {canShowMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={handleShowMore}
                className="px-8 py-3 rounded-lg bg-[var(--color-secondary,#FFD700)] text-black font-bold text-lg shadow hover:bg-yellow-400 transition-colors duration-200"
              >
                إظهار المزيد
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </section>
  );
}