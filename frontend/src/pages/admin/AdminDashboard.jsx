import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { FiDollarSign, FiShoppingBag, FiUsers, FiBox, FiTrendingUp, FiTrendingDown, FiAlertTriangle } from 'react-icons/fi';
import { analyticsService } from '../../services/endpoints';
import { FullPageSpinner } from '../../components/ui/Common';

const COLORS = ['#4F46E5', '#7C3AED', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

const StatCard = ({ title, value, growth, icon: Icon, prefix = '' }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
    <div className="flex items-center justify-between mb-3">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon className="text-primary" size={18} />
      </div>
      {growth !== undefined && (
        <span className={`flex items-center gap-1 text-xs font-medium ${growth >= 0 ? 'text-success' : 'text-danger'}`}>
          {growth >= 0 ? <FiTrendingUp size={12} /> : <FiTrendingDown size={12} />} {Math.abs(growth)}%
        </span>
      )}
    </div>
    <p className="text-gray-400 text-xs mb-1">{title}</p>
    <p className="font-display font-bold text-2xl">{prefix}{typeof value === 'number' ? value.toLocaleString() : value}</p>
  </motion.div>
);

const AdminDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [categoryPerf, setCategoryPerf] = useState([]);
  const [orderDist, setOrderDist] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [ov, rt, cp, od, tp, ls] = await Promise.all([
          analyticsService.overview(),
          analyticsService.revenueTrend(30),
          analyticsService.categoryPerformance(),
          analyticsService.orderDistribution(),
          analyticsService.topProducts(5),
          analyticsService.lowStock(),
        ]);
        setOverview(ov.data);
        setRevenueTrend(rt.data);
        setCategoryPerf(cp.data);
        setOrderDist(od.data);
        setTopProducts(tp.data);
        setLowStock(ls.data.products);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <FullPageSpinner />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-bold text-2xl mb-1">Dashboard Overview</h1>
        <p className="text-gray-400 text-sm">Welcome back! Here's what's happening with your store.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Revenue (30d)" value={overview.revenue.current} growth={overview.revenue.growth} icon={FiDollarSign} prefix="₹" />
        <StatCard title="Orders (30d)" value={overview.orders.current} growth={overview.orders.growth} icon={FiShoppingBag} />
        <StatCard title="New Users (30d)" value={overview.users.current} growth={overview.users.growth} icon={FiUsers} />
        <StatCard title="Total Products" value={overview.total_products} icon={FiBox} />
      </div>

      {/* Revenue Trend */}
      <div className="glass-card p-6">
        <h3 className="font-semibold mb-4">Revenue Trend (Last 30 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={revenueTrend}>
            <defs>
              <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickFormatter={(d) => d.slice(5)} />
            <YAxis stroke="#94A3B8" fontSize={11} />
            <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8 }} />
            <Area type="monotone" dataKey="revenue" stroke="#4F46E5" fill="url(#revGradient)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Category Performance */}
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Category Performance</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={categoryPerf} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" stroke="#94A3B8" fontSize={11} />
              <YAxis dataKey="category" type="category" stroke="#94A3B8" fontSize={11} width={100} />
              <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8 }} />
              <Bar dataKey="revenue" fill="#7C3AED" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Distribution */}
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Order Status Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={orderDist} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} label>
                {orderDist.map((entry, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8 }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Top Selling Products</h3>
          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <img src={p.thumbnail} className="w-10 h-10 rounded-lg object-cover" alt="" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.units_sold} units sold</p>
                </div>
                <p className="font-semibold text-sm">₹{p.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FiAlertTriangle className="text-warning" /> Low Stock Alerts
          </h3>
          {lowStock.length === 0 ? (
            <p className="text-gray-400 text-sm">All products well stocked! 🎉</p>
          ) : (
            <div className="space-y-3">
              {lowStock.slice(0, 6).map((p, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1">{p.product_name}</span>
                  <span className="badge bg-warning/10 text-warning">{p.current_stock} left</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
