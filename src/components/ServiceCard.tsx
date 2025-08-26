import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Sparkles, ShoppingCart, Check } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

interface ProductCardProps {
  title: string;
  description: string;
  imageUrl: string;
  price: string;
  salePrice?: string | null;
  id: string | number;
}

// Define the light gold color using the hex code from the Hero component
const lightGold = '#FFD700'; // This is standard gold color

export default function ProductCard({ title, description, imageUrl, price, salePrice, id }: ProductCardProps) {
  /**
   * Handles the click event for the "Contact Now" button.
   * Prevents the default link behavior and opens a WhatsApp chat
   * with a pre-filled message including product details.
   * @param e - The mouse event.
   */
  const handleContactClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent the default link behavior
    // Construct the URL for the specific product page
    const productUrl = `${window.location.origin}/product/${id}`;;
    // Create the pre-filled message for WhatsApp
    const message = `استفسار عن المنتج: ${title}
رابط المنتج: ${productUrl}`;
    // Open the WhatsApp chat link in a new tab
    window.open(`https://wa.me/201027381559?text=${encodeURIComponent(message)}`, '_blank');
  };

  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsAdding(true);
    
    // Add to cart
    addToCart({
      id,
      title,
      price: salePrice || price, // Use sale price if available
      imageUrl,
    });
    
    // Show added feedback
    setIsAdded(true);
    
    // Reset button state after animation
    setTimeout(() => {
      setIsAdding(false);
      setTimeout(() => setIsAdded(false), 2000);
    }, 1000);
  };

  return (
    <div className="group relative bg-secondary/5 backdrop-blur-md rounded-xl border border-secondary/20 overflow-hidden transition-all duration-150 hover:scale-105 hover:bg-secondary/10">
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
            <Sparkles className={`h-4 w-4 text-[${lightGold}]`} />
          </h3>
          <p className="text-secondary/70 mb-4">
            {description.split(/\r?\n/)[0]}
          </p>
        </div>
      </Link>
      
      <div className="px-6 pb-6 pt-0">
        <div className="flex justify-between items-center">
          <div className="flex flex-col items-end">
            {salePrice ? (
              <>
                <span className={`font-bold text-lg text-[${lightGold}]`}>{salePrice} ج</span>
                <span className="text-sm text-gray-400 line-through">{price} ج</span>
              </>
            ) : (
              <span className={`font-bold text-lg text-[${lightGold}]`}>{price} ج</span>
            )}
          </div>
          
          <div className="flex gap-2">
            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={isAdding || isAdded}
              className={`flex items-center justify-center p-2 rounded-lg transition-all duration-300 ${
                isAdded 
                  ? 'bg-green-500 text-white' 
                  : `bg-[${lightGold}]/90 hover:bg-[${lightGold}] text-secondary`
              } ${isAdding ? 'opacity-75' : ''}`}
              title={isAdded ? 'تمت الإضافة' : 'أضف إلى السلة'}
            >
              {isAdding ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : isAdded ? (
                <Check className="h-5 w-5" />
              ) : (
                <ShoppingCart className="h-5 w-5" />
              )}
            </button>
            
            {/* Contact Button */}
            <button
              onClick={handleContactClick}
              className={`bg-[${lightGold}]/90 hover:bg-yellow-500 text-secondary px-4 py-2 rounded-lg transition-colors duration-300 flex items-center gap-2 backdrop-blur-sm`}
            >
              <MessageCircle className="h-5 w-5" />
              <span className="hidden sm:inline">اطلب الآن</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}