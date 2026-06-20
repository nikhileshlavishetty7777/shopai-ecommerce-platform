import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag, FiArrowRight } from 'react-icons/fi';
import { fetchCart, updateCartItem, removeCartItem } from '../redux/slices/cartSlice';
import { EmptyState, FullPageSpinner } from '../components/ui/Common';

const CartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, subtotal, loading } = useSelector((s) => s.cart);
  const { isAuthenticated } = useSelector((s) => s.auth);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    dispatch(fetchCart()).finally(() => setInitialLoad(false));
  }, [isAuthenticated]);

  if (initialLoad) return <FullPageSpinner />;

  const shipping = subtotal > 500 ? 0 : 49;
  const tax = Math.round((subtotal - 0) * 0.18 * 100) / 100;
  const total = subtotal + shipping + tax;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display font-bold text-2xl sm:text-3xl mb-8">Shopping Cart</h1>

      {items.length === 0 ? (
        <EmptyState
          icon={FiShoppingBag}
          title="Your cart is empty"
          description="Looks like you haven't added anything to your cart yet."
          action={<Link to="/products" className="btn-primary">Start Shopping</Link>}
        />
      ) : (
        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          <div className="space-y-4">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="glass-card p-4 flex gap-4"
                >
                  <img
                    src={item.product_thumbnail || 'https://via.placeholder.com/100'}
                    alt={item.product_name}
                    className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium mb-1 truncate">{item.product_name}</h3>
                    <p className="text-primary font-bold mb-3">₹{Number(item.price_at_addition).toLocaleString()}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center glass-card px-1">
                        <button
                          onClick={() => dispatch(updateCartItem({ itemId: item.id, quantity: item.quantity - 1 }))}
                          className="p-2 hover:text-primary"
                        >
                          <FiMinus size={12} />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => dispatch(updateCartItem({ itemId: item.id, quantity: item.quantity + 1 }))}
                          className="p-2 hover:text-primary"
                        >
                          <FiPlus size={12} />
                        </button>
                      </div>
                      <button
                        onClick={() => dispatch(removeCartItem(item.id))}
                        className="text-danger hover:bg-danger/10 p-2 rounded-lg transition-colors"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="text-right font-bold flex-shrink-0">
                    ₹{Number(item.subtotal).toLocaleString()}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 h-fit lg:sticky lg:top-24">
            <h3 className="font-display font-semibold text-lg mb-5">Order Summary</h3>
            <div className="space-y-3 text-sm mb-5">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span className="text-textMain">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Shipping</span>
                <span className="text-textMain">{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Tax (18% GST)</span>
                <span className="text-textMain">₹{tax.toLocaleString()}</span>
              </div>
            </div>
            <div className="border-t border-white/10 pt-4 mb-6 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="gradient-text">₹{total.toLocaleString()}</span>
            </div>
            <Link to="/checkout">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-primary w-full flex items-center justify-center gap-2">
                Proceed to Checkout <FiArrowRight />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
