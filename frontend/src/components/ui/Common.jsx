import React from 'react';
import { motion } from 'framer-motion';
import { FiInbox } from 'react-icons/fi';

export const Spinner = ({ size = 24 }) => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
    style={{ width: size, height: size }}
    className="border-2 border-primary/30 border-t-primary rounded-full"
  />
);

export const FullPageSpinner = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <Spinner size={40} />
  </div>
);

export const EmptyState = ({ icon: Icon = FiInbox, title, description, action }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center text-center py-16 px-4"
  >
    <div className="w-20 h-20 rounded-full bg-surfaceLight flex items-center justify-center mb-4">
      <Icon size={32} className="text-gray-400" />
    </div>
    <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
    {description && <p className="text-gray-400 text-sm mb-6 max-w-sm">{description}</p>}
    {action}
  </motion.div>
);
