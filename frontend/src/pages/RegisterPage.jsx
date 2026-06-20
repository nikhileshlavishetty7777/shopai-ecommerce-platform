import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiUser, FiPhone, FiArrowRight } from 'react-icons/fi';
import { register as registerUser, login } from '../redux/slices/authSlice';
import { toast } from 'react-toastify';

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((s) => s.auth);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('password');

  const onSubmit = async (data) => {
    const result = await dispatch(registerUser(data));
    if (registerUser.fulfilled.match(result)) {
      toast.success('Account created successfully!');
      const loginResult = await dispatch(login({ email: data.email, password: data.password }));
      if (login.fulfilled.match(loginResult)) {
        navigate('/');
      } else {
        navigate('/login');
      }
    } else {
      toast.error(result.payload || 'Registration failed');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center font-display font-bold text-white text-xl mx-auto mb-4">S</div>
          <h1 className="font-display font-bold text-2xl mb-2">Create Account</h1>
          <p className="text-gray-400 text-sm">Join us and start shopping smarter</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <div className="relative">
              <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input {...register('full_name', { required: 'Full name is required' })} placeholder="Full Name" className="input-field pl-11" />
            </div>
            {errors.full_name && <p className="text-danger text-xs mt-1">{errors.full_name.message}</p>}
          </div>

          <div>
            <div className="relative">
              <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input {...register('username', { required: 'Username is required', minLength: { value: 3, message: 'Min 3 characters' } })} placeholder="Username" className="input-field pl-11" />
            </div>
            {errors.username && <p className="text-danger text-xs mt-1">{errors.username.message}</p>}
          </div>

          <div>
            <div className="relative">
              <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input {...register('email', { required: 'Email is required' })} type="email" placeholder="Email address" className="input-field pl-11" />
            </div>
            {errors.email && <p className="text-danger text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <div className="relative">
              <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input {...register('phone')} placeholder="Phone Number (optional)" className="input-field pl-11" />
            </div>
          </div>

          <div>
            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Min 8 characters' } })} type="password" placeholder="Password" className="input-field pl-11" />
            </div>
            {errors.password && <p className="text-danger text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                {...register('confirm_password', {
                  required: 'Please confirm password',
                  validate: (v) => v === password || 'Passwords do not match',
                })}
                type="password"
                placeholder="Confirm Password"
                className="input-field pl-11"
              />
            </div>
            {errors.confirm_password && <p className="text-danger text-xs mt-1">{errors.confirm_password.message}</p>}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'} <FiArrowRight />
          </motion.button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
