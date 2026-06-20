import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { FiUser, FiMapPin, FiLock, FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';
import { fetchCurrentUser } from '../redux/slices/authSlice';
import { userService, authService } from '../services/endpoints';
import { toast } from 'react-toastify';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const [activeTab, setActiveTab] = useState('profile');
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);

  const profileForm = useForm({ defaultValues: { full_name: user?.full_name, phone: user?.phone } });
  const addressForm = useForm();
  const passwordForm = useForm();

  useEffect(() => {
    if (activeTab === 'addresses') {
      userService.getAddresses().then((res) => setAddresses(res.data.addresses));
    }
  }, [activeTab]);

  const onUpdateProfile = async (data) => {
    try {
      await userService.updateProfile(data);
      toast.success('Profile updated!');
      dispatch(fetchCurrentUser());
    } catch (err) {
      toast.error('Failed to update profile');
    }
  };

  const onAddAddress = async (data) => {
    try {
      await userService.createAddress(data);
      toast.success('Address added!');
      const res = await userService.getAddresses();
      setAddresses(res.data.addresses);
      setShowAddressForm(false);
      addressForm.reset();
    } catch (err) {
      toast.error('Failed to add address');
    }
  };

  const onDeleteAddress = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    await userService.deleteAddress(id);
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    toast.success('Address deleted');
  };

  const onChangePassword = async (data) => {
    try {
      await authService.changePassword(data);
      toast.success('Password changed successfully!');
      passwordForm.reset();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to change password');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FiUser },
    { id: 'addresses', label: 'Addresses', icon: FiMapPin },
    { id: 'security', label: 'Security', icon: FiLock },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display font-bold text-2xl sm:text-3xl mb-8">My Account</h1>

      <div className="flex gap-2 mb-8 border-b border-white/10 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-400'
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 max-w-lg">
          <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Full Name</label>
              <input {...profileForm.register('full_name')} className="input-field" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Email</label>
              <input value={user?.email} disabled className="input-field opacity-60" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Phone</label>
              <input {...profileForm.register('phone')} className="input-field" />
            </div>
            <button type="submit" className="btn-primary">Save Changes</button>
          </form>
        </motion.div>
      )}

      {activeTab === 'addresses' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <button onClick={() => setShowAddressForm(!showAddressForm)} className="btn-primary flex items-center gap-2 mb-6 text-sm py-2.5">
            <FiPlus size={16} /> Add New Address
          </button>

          {showAddressForm && (
            <form onSubmit={addressForm.handleSubmit(onAddAddress)} className="glass-card p-6 grid grid-cols-2 gap-3 mb-6">
              <input {...addressForm.register('full_name', { required: true })} placeholder="Full Name" className="input-field col-span-2" />
              <input {...addressForm.register('phone', { required: true })} placeholder="Phone" className="input-field col-span-2" />
              <input {...addressForm.register('address_line1', { required: true })} placeholder="Address Line 1" className="input-field col-span-2" />
              <input {...addressForm.register('city', { required: true })} placeholder="City" className="input-field" />
              <input {...addressForm.register('state', { required: true })} placeholder="State" className="input-field" />
              <input {...addressForm.register('postal_code', { required: true })} placeholder="Postal Code" className="input-field" />
              <input {...addressForm.register('country')} defaultValue="India" placeholder="Country" className="input-field" />
              <button type="submit" className="btn-primary col-span-2">Save Address</button>
            </form>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div key={addr.id} className="glass-card p-5">
                <div className="flex justify-between items-start mb-2">
                  <span className="badge bg-primary/10 text-primary">{addr.label}</span>
                  <button onClick={() => onDeleteAddress(addr.id)} className="text-danger hover:bg-danger/10 p-1.5 rounded-lg">
                    <FiTrash2 size={14} />
                  </button>
                </div>
                <p className="font-medium text-sm">{addr.full_name}</p>
                <p className="text-xs text-gray-400 mt-1">{addr.address_line1}, {addr.city}, {addr.state} {addr.postal_code}</p>
                <p className="text-xs text-gray-400">{addr.phone}</p>
              </div>
            ))}
            {addresses.length === 0 && <p className="text-gray-400 text-sm">No addresses saved yet.</p>}
          </div>
        </motion.div>
      )}

      {activeTab === 'security' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 max-w-lg">
          <h3 className="font-semibold mb-4">Change Password</h3>
          <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Current Password</label>
              <input {...passwordForm.register('current_password', { required: true })} type="password" className="input-field" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">New Password</label>
              <input {...passwordForm.register('new_password', { required: true, minLength: 8 })} type="password" className="input-field" />
            </div>
            <button type="submit" className="btn-primary">Update Password</button>
          </form>
        </motion.div>
      )}
    </div>
  );
};

export default ProfilePage;
