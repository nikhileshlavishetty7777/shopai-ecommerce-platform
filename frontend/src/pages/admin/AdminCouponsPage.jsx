import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { FiPlus, FiTrash2, FiX, FiPercent } from 'react-icons/fi';
import { couponService } from '../../services/endpoints';
import { toast } from 'react-toastify';

const AdminCouponsPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: { coupon_type: 'percentage' },
  });
  const couponType = watch('coupon_type');

  const load = () => {
    setLoading(true);
    couponService.adminList().then((res) => setCoupons(res.data.coupons)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        discount_value: parseFloat(data.discount_value),
        min_purchase_amount: parseFloat(data.min_purchase_amount || 0),
        max_discount_amount: data.max_discount_amount ? parseFloat(data.max_discount_amount) : undefined,
        usage_limit: data.usage_limit ? parseInt(data.usage_limit) : undefined,
        valid_from: new Date(data.valid_from).toISOString(),
        valid_until: new Date(data.valid_until).toISOString(),
      };
      await couponService.adminCreate(payload);
      toast.success('Coupon created!');
      setShowModal(false);
      reset();
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create coupon');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this coupon?')) return;
    await couponService.adminDelete(id);
    toast.success('Coupon deactivated');
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl flex items-center gap-2"><FiPercent /> Coupons</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm py-2.5">
          <FiPlus size={16} /> Create Coupon
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)
        ) : (
          coupons.map((c) => (
            <div key={c.id} className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="font-display font-bold text-primary">{c.code}</span>
                <button onClick={() => handleDelete(c.id)} className="text-danger hover:bg-danger/10 p-1.5 rounded-lg">
                  <FiTrash2 size={14} />
                </button>
              </div>
              <p className="text-sm text-gray-400 mb-3">{c.description}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="badge bg-primary/10 text-primary capitalize">{c.type.replace('_', ' ')}</span>
                <span className={`badge ${c.is_active ? 'bg-success/10 text-success' : 'bg-gray-500/10 text-gray-400'}`}>
                  {c.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2">Used: {c.usage_count}{c.usage_limit ? ` / ${c.usage_limit}` : ''}</p>
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-bold text-xl">Create Coupon</h2>
                <button onClick={() => setShowModal(false)}><FiX size={20} /></button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <input {...register('code', { required: true })} placeholder="Coupon Code (e.g. SAVE20)" className="input-field uppercase" />
                <input {...register('description')} placeholder="Description" className="input-field" />
                <select {...register('coupon_type')} className="input-field">
                  <option value="percentage">Percentage Discount</option>
                  <option value="fixed">Fixed Amount</option>
                  <option value="free_shipping">Free Shipping</option>
                </select>
                <input
                  {...register('discount_value', { required: true })}
                  type="number"
                  step="0.01"
                  placeholder={couponType === 'percentage' ? 'Discount % (e.g. 10)' : 'Discount Amount (₹)'}
                  className="input-field"
                />
                <input {...register('min_purchase_amount')} type="number" placeholder="Min Purchase Amount" className="input-field" />
                {couponType === 'percentage' && (
                  <input {...register('max_discount_amount')} type="number" placeholder="Max Discount Cap (optional)" className="input-field" />
                )}
                <input {...register('usage_limit')} type="number" placeholder="Total Usage Limit (optional)" className="input-field" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Valid From</label>
                    <input {...register('valid_from', { required: true })} type="date" className="input-field" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Valid Until</label>
                    <input {...register('valid_until', { required: true })} type="date" className="input-field" />
                  </div>
                </div>
                <button type="submit" className="btn-primary w-full">Create Coupon</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCouponsPage;
