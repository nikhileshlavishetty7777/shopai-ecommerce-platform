import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiStar, FiHeart, FiShoppingCart, FiCheck, FiTruck, FiShield, FiMinus, FiPlus } from 'react-icons/fi';
import { productService, reviewService, aiService } from '../services/endpoints';
import { addToCart } from '../redux/slices/cartSlice';
import { toggleWishlistItem } from '../redux/slices/wishlistSlice';
import { FullPageSpinner } from '../components/ui/Common';
import ProductCard from '../components/products/ProductCard';
import { toast } from 'react-toastify';

const ProductDetailPage = () => {
  const { idOrSlug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((s) => s.auth);
  const { items: wishlistItems } = useSelector((s) => s.wishlist);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [activeTab, setActiveTab] = useState('description');

  const isWishlisted = wishlistItems?.some((w) => w.product_id === product?.id);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const isNumeric = /^\d+$/.test(idOrSlug);
        const { data } = isNumeric
          ? await productService.get(idOrSlug)
          : await productService.getBySlug(idOrSlug);
        setProduct(data);

        const [reviewsRes, similarRes] = await Promise.all([
          reviewService.getForProduct(data.id),
          aiService.similarProducts(data.id, 4),
        ]);
        setReviews(reviewsRes.data.reviews);
        setSimilar(similarRes.data.products);
      } catch (err) {
        toast.error('Product not found');
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };
    load();
    window.scrollTo(0, 0);
  }, [idOrSlug]);

  if (loading) return <FullPageSpinner />;
  if (!product) return null;

  const images = product.images?.length ? product.images : [product.thumbnail];
  const inStock = product.inventory?.is_in_stock ?? true;
  const maxQty = product.inventory?.available_quantity ?? 10;

  const handleAddToCart = () => {
    if (!isAuthenticated) return navigate('/login');
    dispatch(addToCart({ productId: product.id, quantity }));
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) return navigate('/login');
    dispatch(addToCart({ productId: product.id, quantity }));
    navigate('/cart');
  };

  const handleWishlist = () => {
    if (!isAuthenticated) return navigate('/login');
    dispatch(toggleWishlistItem(product.id));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-400 mb-6 flex items-center gap-2">
        <Link to="/" className="hover:text-primary">Home</Link> /
        <Link to="/products" className="hover:text-primary">Products</Link> /
        <span className="text-textMain truncate">{product.name}</span>
      </div>

      <div className="grid lg:grid-cols-2 gap-10 mb-16">
        {/* Images */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="glass-card aspect-square overflow-hidden mb-4">
            <img
              src={images[activeImage] || 'https://via.placeholder.com/600'}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-3">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                    activeImage === i ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Info */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          {product.brand && <p className="text-primary text-sm font-medium mb-2">{product.brand}</p>}
          <h1 className="font-display font-bold text-2xl sm:text-3xl mb-3">{product.name}</h1>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <FiStar key={i} size={16} className={i < Math.round(product.avg_rating) ? 'text-warning fill-warning' : 'text-gray-600'} />
              ))}
            </div>
            <span className="text-sm text-gray-400">{product.avg_rating?.toFixed(1)} ({product.review_count} reviews)</span>
          </div>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="font-display font-bold text-3xl">₹{Number(product.current_price).toLocaleString()}</span>
            {product.sale_price && (
              <>
                <span className="text-lg text-gray-500 line-through">₹{Number(product.price).toLocaleString()}</span>
                <span className="badge bg-success/20 text-success">{product.discount_percentage}% OFF</span>
              </>
            )}
          </div>

          <p className="text-gray-400 text-sm mb-6">{product.short_description}</p>

          <div className="flex items-center gap-2 mb-6">
            {inStock ? (
              <span className="flex items-center gap-1.5 text-success text-sm font-medium">
                <FiCheck /> In Stock {product.inventory?.is_low_stock && `(Only ${product.inventory.available_quantity} left!)`}
              </span>
            ) : (
              <span className="text-danger text-sm font-medium">Out of Stock</span>
            )}
          </div>

          {inStock && (
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm font-medium">Quantity:</span>
              <div className="flex items-center glass-card px-1">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-2.5 hover:text-primary"
                >
                  <FiMinus size={14} />
                </button>
                <span className="w-10 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                  className="p-2.5 hover:text-primary"
                >
                  <FiPlus size={14} />
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3 mb-8">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddToCart}
              disabled={!inStock}
              className="btn-secondary flex-1 flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <FiShoppingCart /> Add to Cart
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleBuyNow}
              disabled={!inStock}
              className="btn-primary flex-1 disabled:opacity-40"
            >
              Buy Now
            </motion.button>
            <button
              onClick={handleWishlist}
              className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${
                isWishlisted ? 'bg-danger text-white border-danger' : 'border-white/10 hover:border-danger hover:text-danger'
              }`}
            >
              <FiHeart fill={isWishlisted ? 'currentColor' : 'none'} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <FiTruck className="text-accent" /> Free shipping over ₹500
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <FiShield className="text-success" /> 7-day easy returns
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="mb-16">
        <div className="flex gap-6 border-b border-white/10 mb-6">
          {['description', 'reviews'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium capitalize border-b-2 transition-colors ${
                activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-400'
              }`}
            >
              {tab} {tab === 'reviews' && `(${reviews.length})`}
            </button>
          ))}
        </div>

        {activeTab === 'description' ? (
          <p className="text-gray-300 leading-relaxed max-w-3xl">{product.description}</p>
        ) : (
          <div className="space-y-5 max-w-2xl">
            {reviews.length === 0 ? (
              <p className="text-gray-400 text-sm">No reviews yet. Be the first to review this product!</p>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="glass-card p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{r.username}</span>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <FiStar key={i} size={12} className={i < r.rating ? 'text-warning fill-warning' : 'text-gray-600'} />
                      ))}
                    </div>
                  </div>
                  {r.title && <p className="font-medium text-sm mb-1">{r.title}</p>}
                  <p className="text-gray-400 text-sm">{r.body}</p>
                  {r.is_verified_purchase && (
                    <span className="badge bg-success/10 text-success mt-2 inline-block">Verified Purchase</span>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Similar Products */}
      {similar.length > 0 && (
        <div>
          <h2 className="font-display font-bold text-2xl mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {similar.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
