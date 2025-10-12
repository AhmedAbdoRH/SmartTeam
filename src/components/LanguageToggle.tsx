import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe } from 'lucide-react';
import { useLanguage, Language } from '../contexts/LanguageContext';

interface LanguageToggleProps {
  className?: string;
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({ className = '' }) => {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  const getLanguageLabel = (lang: Language) => {
    return lang === 'ar' ? 'العربية' : 'English';
  };

  return (
    <motion.button
      onClick={toggleLanguage}
      className={`relative flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all duration-300 group ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={t('common.switchLanguage', { language: getLanguageLabel(language === 'ar' ? 'en' : 'ar') })}
    >
      {/* Globe Icon with rotation animation */}
      <motion.div
        animate={{ rotate: language === 'ar' ? 180 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="relative"
      >
        <Globe className="h-5 w-5 text-[#FFD700] group-hover:text-yellow-400 transition-colors" />
      </motion.div>

      {/* Language Label */}
      <AnimatePresence mode="wait">
        <motion.span
          key={language}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="text-sm font-medium hidden sm:block"
        >
          {getLanguageLabel(language)}
        </motion.span>
      </AnimatePresence>

      {/* Hover Effect Background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-[#FFD700]/20 to-yellow-400/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        initial={false}
        animate={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
      />

      {/* Pulse Effect */}
      <motion.div
        className="absolute inset-0 rounded-lg border-2 border-[#FFD700]/30"
        animate={{
          scale: [1, 1.02, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.button>
  );
};

export default LanguageToggle;
