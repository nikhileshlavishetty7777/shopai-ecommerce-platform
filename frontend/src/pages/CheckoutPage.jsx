import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiMapPin, FiPlus, FiTag, FiCreditCard, FiTruck, FiCheck } from 'react-icons/fi';
import { fetchCart, resetCart } from '../redux/slices/cartSlice';
import { userService, orderService, couponService } from '../services/endpoints';
import { FullPageSpinner } from '../components/ui/Common';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';

const CheckoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, subtotal } = useSelector((s) => s.cart);
  const { isAuthenticated } = useSelector((s) => s.auth);

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (!isAuthenticated) return navigate('/login');
    if (items.length === 0) {
      dispatch(fetchCart()).then(() => loadAddresses());
    } else {
      loadAddresses();
    }
  }, [isAuthenticated]);

  const loadAddresses = async () => {
    try {
      const { data } = await userService.getAddresses();
      setAddresses(data.addresses);
      const def = data.addresses.find((a) => a.is_default) || data.addresses[0];
      if (def) setSelectedAddress(def.id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onAddAddress = async (formData) => {
    try {
      const { data } = await userService.createAddress(formData);
      toast.success('Address added!');
      await loadAddresses();
      setSelectedAddress(data.address_id);
      setShowAddressForm(false);
      reset();
    } catch (err) {
      toast.error('Failed to add address');
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const { data } = await couponService.validate({ code: couponCode, cart_total: subtotal });
      setAppliedCoupon(data);
      toast.success(`Coupon applied! You saved ₹${data.discount_amount}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid coupon');
      setAppliedCoupon(null);
    }
  };

  const shipping = appliedCoupon?.coupon_type === 'free_shipping' ? 0 : (subtotal > 500 ? 0 : 49);
  const discount = appliedCoupon?.discount_amount || 0;
  const tax = Math.round((subtotal - discount) * 0.18 * 100) / 100;
  const total = subtotal - discount + tax + shipping;

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error('Please select a delivery address');
      return;
    }
    setPlacing(true);
    try {
      const { data } = await orderService.create({
        address_id: selectedAddress,
        payment_method: paymentMethod,
        coupon_code: appliedCoupon?.code || undefined,
      });
      dispatch(resetCart());
      toast.success('Order placed successfully! 🎉');
      navigate(`/orders/${data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <FullPageSpinner />;

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="font-display font-bold text-2xl mb-4">Your cart is empty</h2>
        <Link to="/products" className="btn-primary">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display font-bold text-2xl sm:text-3xl mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-[1fr_380px] gap-8">
        <div className="space-y-6">
          {/* Address Section */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2"><FiMapPin /> Delivery Address</h3>
              <button onClick={() => setShowAddressForm(!showAddressForm)} className="text-primary text-sm flex items-center gap-1 hover:underline">
                <FiPlus size={14} /> Add New
              </button>
            </div>

            {showAddressForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                onSubmit={handleSubmit(onAddAddress)}
                className="grid grid-cols-2 gap-3 mb-5 p-4 bg-surfaceLight/30 rounded-xl"
              >
                <input {...register('full_name', { required: true })} placeholder="Full Name" className="input-field py-2 text-sm col-span-2" />
                <input {...register('phone', { required: true })} placeholder="Phone Number" className="input-field py-2 text-sm col-span-2" />
                <input {...register('address_line1', { required: true })} placeholder="Address Line 1" className="input-field py-2 text-sm col-span-2" />
                <input {...register('address_line2')} placeholder="Address Line 2 (optional)" className="input-field py-2 text-sm col-span-2" />
                <input {...register('city', { required: true })} placeholder="City" className="input-field py-2 text-sm" />
                <input {...register('state', { required: true })} placeholder="State" className="input-field py-2 text-sm" />
                <input {...register('postal_code', { required: true })} placeholder="Postal Code" className="input-field py-2 text-sm" />
                <input {...register('country')} placeholder="Country" defaultValue="India" className="input-field py-2 text-sm" />
                <button type="submit" className="btn-primary py-2 text-sm col-span-2">Save Address</button>
              </motion.form>
            )}

            <div className="space-y-3">
              {addresses.map((addr) => (
                <label
                  key={addr.id}
                  className={`block p-4 rounded-xl border cursor-pointer transition-colors ${
                    selectedAddress === addr.id ? 'border-primary bg-primary/5' : 'border-white/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      checked={selectedAddress === addr.id}
                      onChange={() => setSelectedAddress(addr.id)}
                      className="mt-1 accent-primary"
                    />
                    <div>
                      <p className="font-medium text-sm">{addr.full_name} <span className="badge bg-surfaceLight ml-2">{addr.label}</span></p>
                      <p className="text-xs text-gray-400 mt-1">{addr.address_line1}, {addr.city}, {addr.state} {addr.postal_code}</p>
                      <p className="text-xs text-gray-400">{addr.phone}</p>
                    </div>
                  </div>
                </label>
              ))}
              {addresses.length === 0 && !showAddressForm && (
                <p className="text-gray-400 text-sm">No saved addresses. Please add one to continue.</p>
              )}
            </div>
          </div>

          {/* Payment Method */}
          <div className="glass-card p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4"><FiCreditCard /> Payment Method</h3>
            <div className="space-y-3">
              {[
                { value: 'cod', label: 'Cash on Delivery', desc: 'Pay when your order arrives' },
                { value: 'online', label: 'Online Payment', desc: 'UPI, Cards, Net Banking' },
              ].map((method) => (
                <label
                  key={method.value}
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                    paymentMethod === method.value ? 'border-primary bg-primary/5' : 'border-white/10'
                  }`}
                >
                  <input
                    type="radio"
                    checked={paymentMethod === method.value}
                    onChange={() => setPaymentMethod(method.value)}
                    className="accent-primary"
                  />
                  <div>
                    <p className="font-medium text-sm">{method.label}</p>
                    <p className="text-xs text-gray-400">{method.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="glass-card p-6 h-fit lg:sticky lg:top-24">
          <h3 className="font-display font-semibold text-lg mb-5">Order Summary</h3>

          <div className="space-y-3 mb-5 max-h-48 overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3 text-sm">
                <img src={item.product_thumbnail} className="w-12 h-12 rounded-lg object-cover" alt="" />
                <div className="flex-1">
                  <p className="line-clamp-1">{item.product_name}</p>
                  <p className="text-gray-400">Qty: {item.quantity}</p>
                </div>
                <p className="font-medium">₹{Number(item.subtotal).toLocaleString()}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mb-5">
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Coupon code"
              className="input-field py-2 text-sm flex-1"
            />
            <button onClick={applyCoupon} className="btn-secondary py-2 px-4 text-sm flex items-center gap-1">
              <FiTag size={14} /> Apply
            </button>
          </div>
          {appliedCoupon && (
            <div className="flex items-center justify-between text-success text-xs mb-4 bg-success/10 p-2 rounded-lg">
              <span className="flex items-center gap-1"><FiCheck size={12} /> {appliedCoupon.code} applied</span>
              <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }}>×</button>
            </div>
          )}

          <div className="space-y-3 text-sm mb-5 border-t border-white/10 pt-4">
            <div className="flex justify-between text-gray-400">
              <span>Subtotal</span><span className="text-textMain">₹{subtotal.toLocaleString()}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-success">
                <span>Discount</span><span>-₹{discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-400">
              <span className="flex items-center gap-1"><FiTruck size={12} /> Shipping</span>
              <span className="text-textMain">{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Tax (18% GST)</span><span className="text-textMain">₹{tax.toLocaleString()}</span>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 mb-6 flex justify-between font-bold text-lg">
            <span>Total</span><span className="gradient-text">₹{total.toLocaleString()}</span>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePlaceOrder}
            disabled={placing || !selectedAddress}
            className="btn-primary w-full disabled:opacity-50"
          >
            {placing ? 'Placing Order...' : 'Place Order'}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
