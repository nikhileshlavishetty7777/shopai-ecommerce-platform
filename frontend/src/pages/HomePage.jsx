import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiTrendingUp, FiStar, FiZap } from 'react-icons/fi';
import Hero from '../components/animations/Hero';
import ProductCard from '../components/products/ProductCard';
import { ProductGridSkeleton } from '../components/ui/Skeletons';
import { productService, categoryService, aiService } from '../services/endpoints';

const SectionHeader = ({ title, subtitle, link, icon: Icon }) => (
  <div className="flex items-end justify-between mb-8">
    <div>
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="text-primary" size={20} />}
        <h2 className="font-display font-bold text-2xl sm:text-3xl">{title}</h2>
      </div>
      {subtitle && <p className="text-gray-400 text-sm">{subtitle}</p>}
    </div>
    {link && (
      <Link to={link} className="hidden sm:flex items-center gap-1 text-primary text-sm font-medium hover:gap-2 transition-all">
        View All <FiArrowRight size={14} />
      </Link>
    )}
  </div>
);

const HomePage = () => {
  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [featuredRes, categoriesRes, trendingRes, newRes] = await Promise.all([
          productService.featured(8),
          categoryService.list(),
          aiService.trending({ limit: 8 }),
          aiService.newArrivals(4),
        ]);
        setFeatured(featuredRes.data);
        setCategories(categoriesRes.data);
        setTrending(trendingRes.data.products);
        setNewArrivals(newRes.data.products);
      } catch (err) {
        console.error('Failed to load home data', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div>
      <Hero />

      {/* Categories Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/products?category_id=${cat.id}`}
                className="flex flex-col items-center gap-2 min-w-[90px] glass-card p-4 hover:border-primary/50 transition-all card-hover"
              >
                <span className="text-3xl">{cat.icon}</span>
                <span className="text-xs font-medium text-center whitespace-nowrap">{cat.name}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <SectionHeader title="Featured Products" subtitle="Hand-picked items just for you" link="/products?featured=true" icon={FiZap} />
        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Trending Banner */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="glass-card p-8 sm:p-10 bg-gradient-primary relative overflow-hidden"
          >
            <div className="relative z-10 max-w-xl">
              <span className="badge bg-white/20 text-white mb-4 inline-block">🔥 Trending Now</span>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-white mb-3">
                Discover What's Hot Right Now
              </h2>
              <p className="text-white/80 mb-6">Our AI analyzes millions of interactions to surface what's trending today.</p>
              <Link to="/products">
                <button className="bg-white text-primary font-semibold px-6 py-3 rounded-xl hover:scale-105 transition-transform">
                  Explore Trending
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trending Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <SectionHeader title="Trending Products" subtitle="What everyone is buying" icon={FiTrendingUp} />
        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {trending.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <SectionHeader title="New Arrivals" subtitle="Fresh off the shelf" icon={FiStar} />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {newArrivals.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Trust Badges */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { title: 'Free Shipping', desc: 'On orders above ₹500', emoji: '🚚' },
            { title: 'Secure Payment', desc: '256-bit SSL encryption', emoji: '🔒' },
            { title: 'Easy Returns', desc: '7-day return policy', emoji: '↩️' },
            { title: '24/7 Support', desc: 'AI assistant always on', emoji: '🤖' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 text-center"
            >
              <div className="text-3xl mb-3">{item.emoji}</div>
              <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-gray-400">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
