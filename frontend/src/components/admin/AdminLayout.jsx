import React from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  FiGrid, FiBox, FiTag, FiShoppingBag, FiUsers, FiPackage,
  FiBarChart2, FiTrendingUp, FiPercent, FiAlertCircle,
} from 'react-icons/fi';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: FiGrid, end: true },
  { to: '/admin/products', label: 'Products', icon: FiBox },
  { to: '/admin/categories', label: 'Categories', icon: FiTag },
  { to: '/admin/orders', label: 'Orders', icon: FiShoppingBag },
  { to: '/admin/users', label: 'Users', icon: FiUsers },
  { to: '/admin/inventory', label: 'Inventory', icon: FiPackage },
  { to: '/admin/coupons', label: 'Coupons', icon: FiPercent },
  { to: '/admin/analytics', label: 'Analytics', icon: FiBarChart2 },
  { to: '/admin/forecast', label: 'AI Forecast', icon: FiTrendingUp },
];

const AdminLayout = () => {
  const { user, isAuthenticated } = useSelector((s) => s.auth);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid lg:grid-cols-[240px_1fr] gap-8">
        <aside className="glass-card p-4 h-fit lg:sticky lg:top-24">
          <div className="flex items-center gap-2 px-2 py-3 mb-2">
            <FiAlertCircle className="text-primary" />
            <span className="font-display font-semibold text-sm">Admin Panel</span>
          </div>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive ? 'bg-gradient-primary text-white' : 'text-gray-400 hover:bg-surfaceLight hover:text-textMain'
                  }`
                }
              >
                <item.icon size={16} /> {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0">
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
};

export default AdminLayout;
