import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, ShoppingCart, Check } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';

interface ServiceCardProps {
  title: string;
  description: string;
  description_en?: string | null;
  imageUrl: string;
  price: string;
  salePrice?: string | null;
  id: string | number;
}

export default function ServiceCard({ title, description, description_en, imageUrl, price, salePrice, id }: ServiceCardProps) {
  const { t, language } = useLanguage();
  const [currentDescription, setCurrentDescription] = useState(description);

  useEffect(() => {
    setCurrentDescription(language === 'en' && description_en ? description_en : description);
  }, [language, description, description_en]);

  const handleContactClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const productUrl = `${window.location.origin}/product/${id}`;
    const message = t('whatsapp.orderMessage') + `\n${title}\n${t('products.price')}: ${price}\n${productUrl}`;
    window.open(`https://wa.me/201557777587?text=${encodeURIComponent(message)}`, '_blank');
  };

  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsAdding(true);
    
    addToCart({
      id,
      title,
      price: salePrice || price,
      imageUrl,
    });
    
    setIsAdded(true);
    
    setTimeout(() => {
      setIsAdding(false);
      setTimeout(() => setIsAdded(false), 2000);
    }, 1000);
  };

  return (
    <div className="group relative bg-secondary/5 backdrop-blur-md rounded-lg border border-secondary/20 overflow-hidden transition-all duration-150 hover:scale-105 hover:bg-secondary/10">
      <Link to={`/product/${id}`} className="block">
        <div className="relative aspect-[4/3] w-full">
          <img
            src={imageUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
        </div>
        <div className="p-6">
          <h3 className="text-xl font-bold mb-2 text-secondary flex items-center gap-2">
            {title}
          </h3>
          <p className="text-secondary/70 mb-4">
            {currentDescription.split(/\r?\n/)[0]}
          </p>
        </div>
      </Link>
      
      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        {/* Contact Now Button */}
        <button
          onClick={handleContactClick}
          className="p-2 rounded-full bg-primary text-white hover:bg-primary/80 transition-colors"
          title={t('products.contactNow')}
        >
          <MessageCircle size={20} />
        </button>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={isAdding || isAdded}
          className={`p-2 rounded-full transition-all duration-300 transform 
            ${isAdded 
              ? 'bg-green-500 text-white scale-110' 
              : isAdding 
                ? 'bg-primary/50 text-white scale-95'
                : 'bg-primary text-white hover:bg-primary/80'
            }`}
          title={t('products.addToCart')}
        >
          {isAdded ? (
            <Check size={20} />
          ) : (
            <ShoppingCart size={20} className={isAdding ? 'animate-bounce' : ''} />
          )}
        </button>
      </div>
    </div>
  );
}