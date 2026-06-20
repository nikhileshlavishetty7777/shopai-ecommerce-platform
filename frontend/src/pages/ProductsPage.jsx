import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFilter, FiX, FiChevronDown } from 'react-icons/fi';
import ProductCard from '../components/products/ProductCard';
import { ProductGridSkeleton } from '../components/ui/Skeletons';
import { EmptyState } from '../components/ui/Common';
import { productService, categoryService } from '../services/endpoints';
import { FiPackage } from 'react-icons/fi';

const SORT_OPTIONS = [
  { value: 'created_at-desc', label: 'Newest First' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'avg_rating-desc', label: 'Highest Rated' },
];

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category_id: searchParams.get('category_id') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    sort: searchParams.get('sort') || 'created_at-desc',
    featured: searchParams.get('featured') || '',
  });

  useEffect(() => {
    categoryService.list().then((res) => setCategories(res.data));
  }, []);

  const loadProducts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const [sort_by, sort_order] = filters.sort.split('-');
      const params = {
        page,
        per_page: 12,
        search: filters.search || undefined,
        category_id: filters.category_id || undefined,
        min_price: filters.min_price || undefined,
        max_price: filters.max_price || undefined,
        sort_by,
        sort_order,
        featured: filters.featured || undefined,
      };
      const { data } = await productService.list(params);
      setProducts(data.items);
      setPagination({ page: data.page, pages: data.pages, total: data.total });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadProducts(1);
  }, [loadProducts]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setFilters({ search: '', category_id: '', min_price: '', max_price: '', sort: 'created_at-desc', featured: '' });
    setSearchParams({});
  };

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => v && k !== 'sort').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl">
            {filters.search ? `Results for "${filters.search}"` : 'All Products'}
          </h1>
          <p className="text-gray-400 text-sm mt-1">{pagination.total} products found</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="lg:hidden btn-secondary flex items-center gap-2 py-2 px-4 text-sm"
        >
          <FiFilter size={16} /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
        </button>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-8">
        {/* Filters Sidebar */}
        <AnimatePresence>
          {(showFilters || true) && (
            <motion.aside
              initial={false}
              className={`${showFilters ? 'block' : 'hidden'} lg:block glass-card p-5 h-fit lg:sticky lg:top-24`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Filters</h3>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="text-xs text-primary hover:underline">Clear all</button>
                )}
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium mb-3">Category</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      checked={!filters.category_id}
                      onChange={() => updateFilter('category_id', '')}
                      className="accent-primary"
                    />
                    All Categories
                  </label>
                  {categories.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        checked={filters.category_id === String(cat.id)}
                        onChange={() => updateFilter('category_id', String(cat.id))}
                        className="accent-primary"
                      />
                      {cat.icon} {cat.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium mb-3">Price Range</h4>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.min_price}
                    onChange={(e) => updateFilter('min_price', e.target.value)}
                    className="input-field py-2 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.max_price}
                    onChange={(e) => updateFilter('max_price', e.target.value)}
                    className="input-field py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.featured === 'true'}
                    onChange={(e) => updateFilter('featured', e.target.checked ? 'true' : '')}
                    className="accent-primary"
                  />
                  Featured Only
                </label>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Products Grid */}
        <div>
          <div className="flex justify-end mb-4">
            <div className="relative">
              <select
                value={filters.sort}
                onChange={(e) => updateFilter('sort', e.target.value)}
                className="input-field py-2 pr-8 text-sm appearance-none cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" size={14} />
            </div>
          </div>

          {loading ? (
            <ProductGridSkeleton count={12} />
          ) : products.length === 0 ? (
            <EmptyState
              icon={FiPackage}
              title="No products found"
              description="Try adjusting your filters or search terms"
              action={<button onClick={clearFilters} className="btn-primary">Clear Filters</button>}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
                {products.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>

              {pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  {Array.from({ length: pagination.pages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => loadProducts(i + 1)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                        pagination.page === i + 1 ? 'bg-gradient-primary text-white' : 'bg-surfaceLight hover:bg-surfaceLight/70'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
