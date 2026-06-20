import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiPackage, FiTruck, FiCheckCircle, FiXCircle, FiClock, FiMapPin } from 'react-icons/fi';
import { orderService } from '../services/endpoints';
import { EmptyState, FullPageSpinner } from '../components/ui/Common';
import { toast } from 'react-toastify';

const STATUS_CONFIG = {
  pending: { icon: FiClock, color: 'text-warning', bg: 'bg-warning/10' },
  confirmed: { icon: FiCheckCircle, color: 'text-accent', bg: 'bg-accent/10' },
  processing: { icon: FiPackage, color: 'text-primary', bg: 'bg-primary/10' },
  shipped: { icon: FiTruck, color: 'text-secondary', bg: 'bg-secondary/10' },
  delivered: { icon: FiCheckCircle, color: 'text-success', bg: 'bg-success/10' },
  cancelled: { icon: FiXCircle, color: 'text-danger', bg: 'bg-danger/10' },
};

export const OrdersListPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useSelector((s) => s.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) return navigate('/login');
    orderService.list({ page: 1, per_page: 20 })
      .then((res) => setOrders(res.data.orders))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (loading) return <FullPageSpinner />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display font-bold text-2xl sm:text-3xl mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <EmptyState
          icon={FiPackage}
          title="No orders yet"
          description="When you place an order, it will appear here."
          action={<Link to="/products" className="btn-primary">Start Shopping</Link>}
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order, i) => {
            const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const Icon = config.icon;
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={`/orders/${order.id}`} className="glass-card p-5 flex items-center justify-between hover:border-primary/30 transition-colors block">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center`}>
                      <Icon className={config.color} size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">#{order.order_number}</p>
                      <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">₹{Number(order.total_amount).toLocaleString()}</p>
                    <span className={`badge ${config.bg} ${config.color} capitalize`}>{order.status}</span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const OrderDetailPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderService.get(orderId)
      .then((res) => setOrder(res.data))
      .catch(() => toast.error('Order not found'))
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    try {
      await orderService.cancel(orderId);
      toast.success('Order cancelled');
      const { data } = await orderService.get(orderId);
      setOrder(data);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to cancel order');
    }
  };

  if (loading) return <FullPageSpinner />;
  if (!order) return null;

  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const Icon = config.icon;
  const canCancel = ['pending', 'confirmed'].includes(order.status);

  const timeline = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
  const currentIdx = timeline.indexOf(order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl mb-1">Order #{order.order_number}</h1>
          <p className="text-gray-400 text-sm">Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <span className={`badge ${config.bg} ${config.color} capitalize text-sm`}>{order.status}</span>
      </div>

      {/* Timeline */}
      {order.status !== 'cancelled' && (
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-surfaceLight">
              <div
                className="h-full bg-gradient-primary transition-all duration-500"
                style={{ width: `${(currentIdx / (timeline.length - 1)) * 100}%` }}
              />
            </div>
            {timeline.map((step, i) => (
              <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  i <= currentIdx ? 'bg-gradient-primary text-white' : 'bg-surfaceLight text-gray-500'
                }`}>
                  {i <= currentIdx ? <FiCheckCircle size={14} /> : i + 1}
                </div>
                <span className="text-xs capitalize text-gray-400">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="glass-card p-6">
          <h3 className="font-semibold flex items-center gap-2 mb-3"><FiMapPin /> Delivery Address</h3>
          {order.shipping_address ? (
            <div className="text-sm text-gray-400">
              <p className="text-textMain">{order.shipping_address.full_name}</p>
              <p>{order.shipping_address.address_line1}</p>
              <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}</p>
              <p>{order.shipping_address.phone}</p>
            </div>
          ) : <p className="text-gray-400 text-sm">Address not available</p>}
        </div>

        <div className="glass-card p-6">
          <h3 className="font-semibold mb-3">Payment Details</h3>
          <div className="text-sm space-y-1 text-gray-400">
            <p>Method: <span className="text-textMain capitalize">{order.payment_method}</span></p>
            <p>Status: <span className="text-textMain capitalize">{order.payment_status}</span></p>
            {order.tracking_number && <p>Tracking: <span className="text-textMain">{order.tracking_number}</span></p>}
          </div>
        </div>
      </div>

      <div className="glass-card p-6 mb-6">
        <h3 className="font-semibold mb-4">Order Items</h3>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-4 items-center">
              <img src={item.product_image} className="w-16 h-16 rounded-xl object-cover" alt="" />
              <div className="flex-1">
                <p className="font-medium text-sm">{item.product_name}</p>
                <p className="text-xs text-gray-400">Qty: {item.quantity} × ₹{Number(item.unit_price).toLocaleString()}</p>
              </div>
              <p className="font-bold">₹{Number(item.subtotal).toLocaleString()}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 mt-4 pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-gray-400"><span>Subtotal</span><span className="text-textMain">₹{Number(order.subtotal).toLocaleString()}</span></div>
          {Number(order.discount_amount) > 0 && <div className="flex justify-between text-success"><span>Discount</span><span>-₹{Number(order.discount_amount).toLocaleString()}</span></div>}
          <div className="flex justify-between text-gray-400"><span>Tax</span><span className="text-textMain">₹{Number(order.tax_amount).toLocaleString()}</span></div>
          <div className="flex justify-between text-gray-400"><span>Shipping</span><span className="text-textMain">{Number(order.shipping_amount) === 0 ? 'Free' : `₹${order.shipping_amount}`}</span></div>
          <div className="flex justify-between font-bold text-base pt-2 border-t border-white/10"><span>Total</span><span className="gradient-text">₹{Number(order.total_amount).toLocaleString()}</span></div>
        </div>
      </div>

      {canCancel && (
        <button onClick={handleCancel} className="btn-secondary text-danger border border-danger/30">Cancel Order</button>
      )}
    </div>
  );
};
