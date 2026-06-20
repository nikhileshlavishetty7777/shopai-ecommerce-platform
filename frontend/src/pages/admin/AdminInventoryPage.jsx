import React, { useEffect, useState } from 'react';
import { FiAlertTriangle, FiPackage } from 'react-icons/fi';
import { analyticsService } from '../../services/endpoints';
import { TableRowSkeleton } from '../../components/ui/Skeletons';

const AdminInventoryPage = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  useEffect(() => {
    analyticsService.inventory({ page: 1, per_page: 100 })
      .then((res) => setInventory(res.data.inventory))
      .finally(() => setLoading(false));
  }, []);

  const filtered = showLowStockOnly ? inventory.filter((i) => i.is_low_stock) : inventory;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="font-display font-bold text-2xl flex items-center gap-2"><FiPackage /> Inventory</h1>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={showLowStockOnly} onChange={(e) => setShowLowStockOnly(e.target.checked)} className="accent-primary" />
          Show low stock only
        </label>
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-gray-400">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Total Qty</th>
              <th className="px-4 py-3 font-medium">Reserved</th>
              <th className="px-4 py-3 font-medium">Available</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} columns={6} />)
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">No items found</td></tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.product_id} className="border-b border-white/5 hover:bg-surfaceLight/30">
                  <td className="px-4 py-3 font-medium">{item.product_name}</td>
                  <td className="px-4 py-3 text-gray-400">{item.sku}</td>
                  <td className="px-4 py-3">{item.quantity}</td>
                  <td className="px-4 py-3 text-gray-400">{item.reserved}</td>
                  <td className="px-4 py-3 font-semibold">{item.available}</td>
                  <td className="px-4 py-3">
                    {!item.is_in_stock ? (
                      <span className="badge bg-danger/10 text-danger">Out of Stock</span>
                    ) : item.is_low_stock ? (
                      <span className="badge bg-warning/10 text-warning flex items-center gap-1 w-fit"><FiAlertTriangle size={10} /> Low Stock</span>
                    ) : (
                      <span className="badge bg-success/10 text-success">In Stock</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminInventoryPage;
