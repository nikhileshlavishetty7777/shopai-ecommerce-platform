import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiHeart, FiShoppingCart, FiTrash2 } from 'react-icons/fi';
import { fetchWishlist, toggleWishlistItem } from '../redux/slices/wishlistSlice';
import { wishlistService } from '../services/endpoints';
import { fetchCart } from '../redux/slices/cartSlice';
import { EmptyState, FullPageSpinner } from '../components/ui/Common';
import { toast } from 'react-toastify';

const WishlistPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items } = useSelector((s) => s.wishlist);
  const { isAuthenticated } = useSelector((s) => s.auth);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    dispatch(fetchWishlist()).finally(() => setLoading(false));
  }, [isAuthenticated]);

  const handleMoveToCart = async (productId) => {
    try {
      await wishlistService.moveToCart(productId);
      toast.success('Moved to cart!');
      dispatch(fetchWishlist());
      dispatch(fetchCart());
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to move to cart');
    }
  };

  if (loading) return <FullPageSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display font-bold text-2xl sm:text-3xl mb-8">My Wishlist</h1>

      {items.length === 0 ? (
        <EmptyState
          icon={FiHeart}
          title="Your wishlist is empty"
          description="Save items you love for later."
          action={<Link to="/products" className="btn-primary">Browse Products</Link>}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card overflow-hidden"
            >
              <Link to={`/products/${item.product_id}`} className="block aspect-square overflow-hidden">
                <img src={item.product_thumbnail} alt={item.product_name} className="w-full h-full object-cover" />
              </Link>
              <div className="p-4">
                <h3 className="font-medium text-sm line-clamp-2 mb-2">{item.product_name}</h3>
                <p className="font-bold mb-3">₹{Number(item.product_sale_price || item.product_price).toLocaleString()}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleMoveToCart(item.product_id)}
                    disabled={!item.is_in_stock}
                    className="flex-1 btn-primary py-2 text-xs flex items-center justify-center gap-1 disabled:opacity-40"
                  >
                    <FiShoppingCart size={12} /> {item.is_in_stock ? 'Move to Cart' : 'Out of Stock'}
                  </button>
                  <button
                    onClick={() => dispatch(toggleWishlistItem(item.product_id))}
                    className="p-2 rounded-xl border border-white/10 hover:border-danger hover:text-danger transition-colors"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
