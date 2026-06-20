import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiBell, FiCheckCircle, FiZap } from 'react-icons/fi';
import { categoryService, aiService, notificationService } from '../services/endpoints';
import ProductCard from '../components/products/ProductCard';
import { ProductGridSkeleton } from '../components/ui/Skeletons';
import { EmptyState, FullPageSpinner } from '../components/ui/Common';

export const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoryService.list().then((res) => setCategories(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <FullPageSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display font-bold text-2xl sm:text-3xl mb-8">Shop by Category</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
        {categories.map((cat, i) => (
          <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link to={`/products?category_id=${cat.id}`} className="glass-card p-8 flex flex-col items-center gap-3 hover:border-primary/40 transition-all card-hover">
              <span className="text-5xl">{cat.icon}</span>
              <span className="font-semibold">{cat.name}</span>
              {cat.description && <p className="text-xs text-gray-400 text-center">{cat.description}</p>}
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export const RecommendationsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useSelector((s) => s.auth);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    aiService.personalizedRecommendations(20)
      .then((res) => setProducts(res.data.products))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <FiZap className="mx-auto text-primary mb-4" size={40} />
        <h2 className="font-display font-bold text-2xl mb-3">Personalized Recommendations</h2>
        <p className="text-gray-400 mb-6">Sign in to get AI-powered product recommendations tailored just for you.</p>
        <Link to="/login" className="btn-primary">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-2 mb-2">
        <FiZap className="text-primary" size={22} />
        <h1 className="font-display font-bold text-2xl sm:text-3xl">Recommended For You</h1>
      </div>
      <p className="text-gray-400 mb-8">Curated by our AI based on your shopping behavior</p>

      {loading ? (
        <ProductGridSkeleton count={12} />
      ) : products.length === 0 ? (
        <EmptyState
          icon={FiZap}
          title="Building your recommendations"
          description="Start shopping and browsing products to get personalized suggestions!"
          action={<Link to="/products" className="btn-primary">Browse Products</Link>}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      )}
    </div>
  );
};

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    notificationService.list().then((res) => setNotifications(res.data.notifications)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleMarkRead = async (id) => {
    await notificationService.markRead(id);
    load();
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllRead();
    load();
  };

  if (loading) return <FullPageSpinner />;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display font-bold text-2xl sm:text-3xl">Notifications</h1>
        {notifications.some((n) => !n.is_read) && (
          <button onClick={handleMarkAllRead} className="text-primary text-sm hover:underline">Mark all read</button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={FiBell} title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => !n.is_read && handleMarkRead(n.id)}
              className={`glass-card p-4 cursor-pointer transition-colors ${!n.is_read ? 'border-primary/40' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${!n.is_read ? 'bg-primary/20' : 'bg-surfaceLight'}`}>
                  {n.is_read ? <FiCheckCircle size={16} className="text-gray-400" /> : <FiBell size={16} className="text-primary" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{n.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{n.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
