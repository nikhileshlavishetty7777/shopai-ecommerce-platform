import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import { categoryService } from '../../services/endpoints';
import { toast } from 'react-toastify';

const AdminCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const { register, handleSubmit, reset } = useForm();

  const load = () => {
    setLoading(true);
    categoryService.list().then((res) => setCategories(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', description: '', icon: '', image_url: '' });
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    reset(cat);
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    try {
      if (editing) {
        await categoryService.update(editing.id, data);
        toast.success('Category updated!');
      } else {
        await categoryService.create(data);
        toast.success('Category created!');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save category');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    await categoryService.delete(id);
    toast.success('Category deleted');
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl">Categories</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm py-2.5">
          <FiPlus size={16} /> Add Category
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="glass-card p-5">
            <div className="flex items-start justify-between mb-3">
              <span className="text-3xl">{cat.icon}</span>
              <div className="flex gap-1">
                <button onClick={() => openEdit(cat)} className="p-2 hover:bg-surfaceLight rounded-lg"><FiEdit2 size={14} /></button>
                <button onClick={() => handleDelete(cat.id)} className="p-2 hover:bg-danger/10 text-danger rounded-lg"><FiTrash2 size={14} /></button>
              </div>
            </div>
            <h3 className="font-semibold mb-1">{cat.name}</h3>
            <p className="text-xs text-gray-400">{cat.description}</p>
          </div>
        ))}
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
              className="glass-card p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-bold text-xl">{editing ? 'Edit Category' : 'Add Category'}</h2>
                <button onClick={() => setShowModal(false)}><FiX size={20} /></button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <input {...register('name', { required: true })} placeholder="Category Name" className="input-field" />
                <input {...register('icon')} placeholder="Icon (emoji)" className="input-field" />
                <textarea {...register('description')} placeholder="Description" rows={3} className="input-field" />
                <input {...register('image_url')} placeholder="Image URL (optional)" className="input-field" />
                <button type="submit" className="btn-primary w-full">{editing ? 'Update' : 'Create'}</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCategoriesPage;
