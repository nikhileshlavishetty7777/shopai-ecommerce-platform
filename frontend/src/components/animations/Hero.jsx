import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiZap, FiShield, FiTruck } from 'react-icons/fi';

const Hero = () => {
  return (
    <section className="relative overflow-hidden">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-20 -left-20 w-96 h-96 bg-primary/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-40 right-0 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-0 left-1/3 w-72 h-72 bg-accent/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 badge bg-primary/10 text-primary-400 border border-primary/30 mb-6"
            >
              <FiZap size={12} /> AI-Powered Shopping Experience
            </motion.span>

            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl leading-tight mb-6">
              Shop Smarter with{' '}
              <span className="gradient-text">AI Recommendations</span>
            </h1>

            <p className="text-gray-400 text-lg mb-8 max-w-lg">
              Discover personalized products curated just for you. Powered by machine learning, designed for the future of e-commerce.
            </p>

            <div className="flex flex-wrap gap-4 mb-10">
              <Link to="/products">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="btn-primary flex items-center gap-2">
                  Shop Now <FiArrowRight />
                </motion.button>
              </Link>
              <Link to="/recommendations">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="btn-secondary">
                  View Recommendations
                </motion.button>
              </Link>
            </div>

            <div className="flex flex-wrap gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <FiTruck className="text-accent" /> Free shipping over ₹500
              </div>
              <div className="flex items-center gap-2">
                <FiShield className="text-success" /> Secure checkout
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <motion.div animate={{ y: [0, -16, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
              <div className="glass-card p-2 shadow-glow">
                <img
                  src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&h=600&fit=crop"
                  alt="Shopping"
                  className="rounded-xl w-full h-[440px] object-cover"
                />
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -bottom-6 -left-10 glass-card p-4 w-52"
            >
              <p className="text-xs text-gray-400 mb-1">AI Recommended</p>
              <p className="font-semibold text-sm">98% Match for You</p>
              <div className="w-full bg-surfaceLight rounded-full h-1.5 mt-2">
                <div className="bg-gradient-primary h-1.5 rounded-full" style={{ width: '98%' }} />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
