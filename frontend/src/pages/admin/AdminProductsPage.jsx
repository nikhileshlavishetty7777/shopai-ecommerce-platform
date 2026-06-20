import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSearch } from 'react-icons/fi';
import { productService, categoryService } from '../../services/endpoints';
import { TableRowSkeleton } from '../../components/ui/Skeletons';
import { toast } from 'react-toastify';

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [search, setSearch] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data } = await productService.list({ search: search || undefined, per_page: 50, active_only: false });
      setProducts(data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    categoryService.list().then((res) => setCategories(res.data));
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadProducts, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const openCreateModal = () => {
    setEditingProduct(null);
    reset({ name: '', sku: '', price: '', category_id: '', brand: '', thumbnail: '', initial_stock: 0 });
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    reset({
      name: product.name,
      sku: product.sku,
      price: product.price,
      sale_price: product.sale_price,
      category_id: product.category_id,
      brand: product.brand,
      thumbnail: product.thumbnail,
      short_description: product.short_description,
      description: product.description,
    });
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        price: parseFloat(data.price),
        sale_price: data.sale_price ? parseFloat(data.sale_price) : null,
        category_id: parseInt(data.category_id),
        images: data.thumbnail ? [data.thumbnail] : [],
        initial_stock: parseInt(data.initial_stock || 0),
      };

      if (editingProduct) {
        await productService.update(editingProduct.id, payload);
        toast.success('Product updated!');
      } else {
        await productService.create(payload);
        toast.success('Product created!');
      }
      setShowModal(false);
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save product');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await productService.delete(id);
      toast.success('Product deleted');
      loadProducts();
    } catch (err) {
      toast.error('Failed to delete product');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="font-display font-bold text-2xl">Products</h1>
        <button onClick={openCreateModal} className="btn-primary flex items-center gap-2 text-sm py-2.5">
          <FiPlus size={16} /> Add Product
        </button>
      </div>

      <div className="relative mb-6 max-w-md">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="input-field pl-11" />
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-gray-400">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} columns={6} />)
            ) : products.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">No products found</td></tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-surfaceLight/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.thumbnail} className="w-10 h-10 rounded-lg object-cover" alt="" />
                      <span className="font-medium truncate max-w-[200px]">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{p.sku}</td>
                  <td className="px-4 py-3">₹{Number(p.current_price).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={p.inventory?.is_low_stock ? 'text-warning' : ''}>
                      {p.inventory?.quantity ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${p.is_active ? 'bg-success/10 text-success' : 'bg-gray-500/10 text-gray-400'}`}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEditModal(p)} className="p-2 hover:bg-surfaceLight rounded-lg mr-1">
                      <FiEdit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-2 hover:bg-danger/10 text-danger rounded-lg">
                      <FiTrash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-bold text-xl">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                <button onClick={() => setShowModal(false)}><FiX size={20} /></button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
                <input {...register('name', { required: true })} placeholder="Product Name" className="input-field col-span-2" />
                <input {...register('sku', { required: true })} placeholder="SKU" className="input-field" disabled={!!editingProduct} />
                <select {...register('category_id', { required: true })} className="input-field">
                  <option value="">Select Category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input {...register('price', { required: true })} type="number" step="0.01" placeholder="Price" className="input-field" />
                <input {...register('sale_price')} type="number" step="0.01" placeholder="Sale Price (optional)" className="input-field" />
                <input {...register('brand')} placeholder="Brand" className="input-field" />
                {!editingProduct && <input {...register('initial_stock')} type="number" placeholder="Initial Stock" className="input-field" />}
                <input {...register('thumbnail')} placeholder="Thumbnail Image URL" className="input-field col-span-2" />
                <textarea {...register('short_description')} placeholder="Short Description" rows={2} className="input-field col-span-2" />
                <textarea {...register('description')} placeholder="Full Description" rows={4} className="input-field col-span-2" />

                <div className="col-span-2 flex gap-3 mt-2">
                  <button type="submit" className="btn-primary flex-1">{editingProduct ? 'Update Product' : 'Create Product'}</button>
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminProductsPage;
