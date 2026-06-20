import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiShoppingCart, FiHeart, FiUser, FiSearch, FiMenu, FiX,
  FiBell, FiLogOut, FiSettings, FiPackage, FiGrid,
} from 'react-icons/fi';
import { logout } from '../../redux/slices/authSlice';
import { toggleMobileMenu, closeMobileMenu } from '../../redux/slices/uiSlice';
import { resetCart } from '../../redux/slices/cartSlice';
import { resetWishlist } from '../../redux/slices/wishlistSlice';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isAuthenticated, user } = useSelector((s) => s.auth);
  const { totalItems } = useSelector((s) => s.cart);
  const { total: wishlistTotal } = useSelector((s) => s.wishlist);
  const { isMobileMenuOpen } = useSelector((s) => s.ui);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(resetCart());
    dispatch(resetWishlist());
    setShowUserMenu(false);
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      dispatch(closeMobileMenu());
    }
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass shadow-lg' : 'bg-background/80 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center font-display font-bold text-white"
            >
              S
            </motion.div>
            <span className="font-display font-bold text-xl gradient-text hidden sm:block">ShopAI</span>
          </Link>

          {/* Desktop Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for products, brands and more..."
              className="input-field pr-12 py-2.5"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary">
              <FiSearch size={18} />
            </button>
          </form>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
            <Link to="/products" className="hover:text-primary transition-colors">Shop</Link>
            <Link to="/categories" className="hover:text-primary transition-colors">Categories</Link>
            <Link to="/recommendations" className="hover:text-primary transition-colors">For You</Link>
          </nav>

          {/* Icons */}
          <div className="flex items-center gap-1 sm:gap-3">
            {isAuthenticated && (
              <Link to="/notifications" className="relative p-2 hover:bg-surface rounded-full transition-colors hidden sm:block">
                <FiBell size={20} />
              </Link>
            )}

            <Link to="/wishlist" className="relative p-2 hover:bg-surface rounded-full transition-colors">
              <FiHeart size={20} />
              {wishlistTotal > 0 && (
                <span className="absolute -top-1 -right-1 bg-danger text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistTotal}
                </span>
              )}
            </Link>

            <Link to="/cart" className="relative p-2 hover:bg-surface rounded-full transition-colors">
              <FiShoppingCart size={20} />
              {totalItems > 0 && (
                <motion.span
                  key={totalItems}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
                >
                  {totalItems}
                </motion.span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center font-semibold text-sm"
                >
                  {user?.full_name?.[0]?.toUpperCase() || 'U'}
                </button>
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-56 glass-card p-2 shadow-xl"
                    >
                      <div className="px-3 py-2 border-b border-white/10 mb-1">
                        <p className="font-semibold text-sm truncate">{user?.full_name}</p>
                        <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                      </div>
                      <Link to="/profile" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surfaceLight text-sm">
                        <FiUser size={16} /> Profile
                      </Link>
                      <Link to="/orders" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surfaceLight text-sm">
                        <FiPackage size={16} /> My Orders
                      </Link>
                      {user?.role === 'admin' && (
                        <Link to="/admin" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surfaceLight text-sm">
                          <FiGrid size={16} /> Admin Dashboard
                        </Link>
                      )}
                      <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-danger/10 text-danger text-sm">
                        <FiLogOut size={16} /> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/login" className="hidden sm:block btn-primary py-2 px-4 text-sm">
                Sign In
              </Link>
            )}

            <button
              onClick={() => dispatch(toggleMobileMenu())}
              className="lg:hidden p-2 hover:bg-surface rounded-full"
            >
              {isMobileMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden glass border-t border-white/10 overflow-hidden"
          >
            <div className="p-4 space-y-3">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="input-field pr-10"
                />
                <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </form>
              <Link to="/products" onClick={() => dispatch(closeMobileMenu())} className="block py-2 text-sm font-medium">Shop</Link>
              <Link to="/categories" onClick={() => dispatch(closeMobileMenu())} className="block py-2 text-sm font-medium">Categories</Link>
              <Link to="/recommendations" onClick={() => dispatch(closeMobileMenu())} className="block py-2 text-sm font-medium">For You</Link>
              {isAuthenticated ? (
                <>
                  <Link to="/profile" onClick={() => dispatch(closeMobileMenu())} className="block py-2 text-sm font-medium">Profile</Link>
                  <Link to="/orders" onClick={() => dispatch(closeMobileMenu())} className="block py-2 text-sm font-medium">My Orders</Link>
                  {user?.role === 'admin' && (
                    <Link to="/admin" onClick={() => dispatch(closeMobileMenu())} className="block py-2 text-sm font-medium">Admin Dashboard</Link>
                  )}
                  <button onClick={handleLogout} className="block w-full text-left py-2 text-sm font-medium text-danger">Logout</button>
                </>
              ) : (
                <Link to="/login" onClick={() => dispatch(closeMobileMenu())} className="btn-primary block text-center">Sign In</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Navbar;
