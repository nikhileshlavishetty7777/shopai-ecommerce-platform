import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiHeart, FiShoppingCart, FiStar } from 'react-icons/fi';
import { addToCart } from '../../redux/slices/cartSlice';
import { toggleWishlistItem } from '../../redux/slices/wishlistSlice';
import { useNavigate } from 'react-router-dom';

const ProductCard = ({ product, index = 0 }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((s) => s.auth);
  const { items: wishlistItems } = useSelector((s) => s.wishlist);

  const isWishlisted = wishlistItems?.some((w) => w.product_id === product.id);
  const inStock = product.inventory ? product.inventory.is_in_stock : true;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    dispatch(addToCart({ productId: product.id, quantity: 1 }));
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    dispatch(toggleWishlistItem(product.id));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
    >
      <Link
        to={`/products/${product.slug || product.id}`}
        className="group block glass-card overflow-hidden card-hover relative"
      >
        <div className="relative aspect-square overflow-hidden bg-surfaceLight">
          <img
            src={product.thumbnail || 'https://via.placeholder.com/400x400?text=No+Image'}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {product.discount_percentage > 0 && (
            <span className="absolute top-3 left-3 badge bg-danger text-white">
              -{product.discount_percentage}%
            </span>
          )}
          {!inStock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="badge bg-surface text-white">Out of Stock</span>
            </div>
          )}
          <button
            onClick={handleWishlist}
            className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              isWishlisted ? 'bg-danger text-white' : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
            }`}
          >
            <FiHeart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div className="p-4">
          {product.brand && <p className="text-xs text-gray-400 mb-1">{product.brand}</p>}
          <h3 className="font-medium text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          <div className="flex items-center gap-1 mb-2">
            <FiStar className="text-warning fill-warning" size={14} />
            <span className="text-xs text-gray-400">
              {product.avg_rating?.toFixed(1) || '0.0'} ({product.review_count || 0})
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-lg">₹{Number(product.current_price ?? product.price).toLocaleString()}</span>
              {product.sale_price && (
                <span className="text-xs text-gray-500 line-through">₹{Number(product.price).toLocaleString()}</span>
              )}
            </div>
            <button
              onClick={handleAddToCart}
              disabled={!inStock}
              className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-white hover:shadow-glow transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FiShoppingCart size={15} />
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
