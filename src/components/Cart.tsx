import { X, ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { motion, AnimatePresence } from 'framer-motion';

// CartItem interface is defined in CartContext

// Animation variants
const overlayVariants = {
  hidden: { 
    opacity: 0,
  },
  visible: { 
    opacity: 1,
    transition: { 
      duration: 0.3,
      ease: 'easeInOut'
    }
  },
  exit: { 
    opacity: 0,
    transition: { 
      duration: 0.2,
      ease: 'easeInOut'
    }
  }
};

const cartVariants = {
  hidden: { 
    x: '100%',
    opacity: 0.5
  },
  visible: { 
    x: 0,
    opacity: 1,
    transition: { 
      type: 'spring',
      damping: 25,
      stiffness: 300,
      mass: 0.5
    }
  },
  exit: { 
    x: '100%',
    opacity: 0.5,
    transition: { 
      type: 'spring',
      damping: 25,
      stiffness: 300,
      mass: 0.5
    }
  }
};

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.98
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: 'easeOut'
    }
  }),
  exit: () => ({  // Removed unused 'i' parameter
    opacity: 0,
    y: -20,
    scale: 0.98,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  })
};

const Cart: React.FC = () => {
  const { 
    cartItems, 
    isCartOpen, 
    toggleCart, 
    removeFromCart, 
    updateQuantity,
    cartTotal 
  } = useCart();
  
  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Overlay with fade animation */}
          <motion.div
            className="absolute inset-0 bg-black/50"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={overlayVariants}
            onClick={() => toggleCart(false)}
          />
          
          {/* Cart panel with slide animation */}
          <motion.div
            className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-xl flex flex-col"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={cartVariants}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Shopping Cart</h2>
              <button
                onClick={() => toggleCart(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close Cart"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto p-4">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">Your cart is empty</h3>
                  <p className="mt-1 text-gray-500">Start by adding some products</p>
                </div>
              ) : (
                <motion.ul className="space-y-4">
                  {cartItems.map((item, index) => (
                    <motion.li
                      key={item.id}
                      className="flex items-center p-3 border rounded-md"
                      variants={itemVariants}
                      custom={index}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                    >
                      {item.imageUrl && (
                        <div className="w-20 h-20 flex-shrink-0 rounded-sm overflow-hidden border">
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="mr-3 flex-1">
                        <h3 className="font-medium">{item.title}</h3>
                        <p className="text-gray-600">{item.price} SAR</p>
                        <div className="flex items-center mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.quantity > 1) {
                                updateQuantity(item.id, item.quantity - 1);
                              } else {
                                removeFromCart(item.id);
                              }
                            }}
                            className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="mx-2 w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(item.id, item.quantity + 1);
                            }}
                            className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromCart(item.id);
                        }}
                        className="text-red-500 hover:text-red-700 p-2"
                        aria-label="Remove product"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </div>

            {/* Footer with total and checkout button */}
            {cartItems.length > 0 && (
              <div className="border-t p-4">
                <div className="flex justify-between text-lg font-medium mb-4">
                  <span>Total</span>
                  <span>{cartTotal} SAR</span>
                </div>
                <button
                  onClick={() => {
                    // Handle checkout
                    const message = cartItems
                      .map(item => `${item.title} - ${item.quantity} × ${item.price} SAR`)
                      .join('\n');
                    window.open(
                      `https://wa.me/201027381559?text=${encodeURIComponent(
                        `Order:\n${message}\n\nTotal: ${calculateTotal()} SAR`
                      )}`,
                      '_blank'
                    );
                    // Close cart after checkout
                    toggleCart(false);
                  }}
                  className="w-full bg-green-600 text-white py-3 rounded-sm hover:bg-green-700 transition-colors"
                >
                  Complete Order
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Cart;
