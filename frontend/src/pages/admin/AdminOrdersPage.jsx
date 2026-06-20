import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiTruck } from 'react-icons/fi';
import { orderService } from '../../services/endpoints';
import { TableRowSkeleton } from '../../components/ui/Skeletons';
import { toast } from 'react-toastify';

const STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const STATUS_COLORS = {
  pending: 'bg-warning/10 text-warning',
  confirmed: 'bg-accent/10 text-accent',
  processing: 'bg-primary/10 text-primary',
  shipped: 'bg-secondary/10 text-secondary',
  delivered: 'bg-success/10 text-success',
  cancelled: 'bg-danger/10 text-danger',
};

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const load = () => {
    setLoading(true);
    orderService.adminList({ page: 1, per_page: 50, status: filterStatus || undefined })
      .then((res) => setOrders(res.data.orders))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filterStatus]);

  const openUpdateModal = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setTrackingInput(order.tracking_number || '');
  };

  const handleUpdateStatus = async () => {
    try {
      await orderService.updateStatus(selectedOrder.id, { status: newStatus, tracking_number: trackingInput || undefined });
      toast.success('Order status updated!');
      setSelectedOrder(null);
      load();
    } catch (err) {
      toast.error('Failed to update order');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="font-display font-bold text-2xl">Orders</h1>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-field py-2 text-sm w-44">
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-gray-400">
              <th className="px-4 py-3 font-medium">Order #</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Items</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} columns={7} />)
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-b border-white/5 hover:bg-surfaceLight/30">
                  <td className="px-4 py-3 font-medium">#{order.order_number}</td>
                  <td className="px-4 py-3 text-gray-400">{order.user?.full_name || order.user?.email || '—'}</td>
                  <td className="px-4 py-3">{order.items?.length || 0}</td>
                  <td className="px-4 py-3 font-semibold">₹{Number(order.total_amount).toLocaleString()}</td>
                  <td className="px-4 py-3"><span className={`badge ${STATUS_COLORS[order.status]} capitalize`}>{order.status}</span></td>
                  <td className="px-4 py-3 text-gray-400">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openUpdateModal(order)} className="btn-secondary py-1.5 px-3 text-xs">Update</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-bold text-xl flex items-center gap-2"><FiTruck /> Update Order</h2>
                <button onClick={() => setSelectedOrder(null)}><FiX size={20} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1.5">Order Status</label>
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="input-field">
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">Tracking Number</label>
                  <input value={trackingInput} onChange={(e) => setTrackingInput(e.target.value)} placeholder="Enter tracking number" className="input-field" />
                </div>
                <button onClick={handleUpdateStatus} className="btn-primary w-full">Update Order</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminOrdersPage;
