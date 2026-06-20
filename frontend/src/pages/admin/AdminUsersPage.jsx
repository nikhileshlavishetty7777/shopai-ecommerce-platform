import React, { useEffect, useState } from 'react';
import { FiSearch, FiUserX, FiUserCheck, FiTrash2 } from 'react-icons/fi';
import { userService } from '../../services/endpoints';
import { TableRowSkeleton } from '../../components/ui/Skeletons';
import { toast } from 'react-toastify';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    userService.adminList({ page: 1, per_page: 50, search: search || undefined })
      .then((res) => setUsers(res.data.users))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleToggleActive = async (id) => {
    try {
      await userService.adminToggleActive(id);
      toast.success('User status updated');
      load();
    } catch (err) {
      toast.error('Failed to update user');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    try {
      await userService.adminDelete(id);
      toast.success('User deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete user');
    }
  };

  return (
    <div>
      <h1 className="font-display font-bold text-2xl mb-6">Users</h1>

      <div className="relative mb-6 max-w-md">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="input-field pl-11" />
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-gray-400">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} columns={6} />)
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-surfaceLight/30">
                  <td className="px-4 py-3 font-medium">{u.full_name}</td>
                  <td className="px-4 py-3 text-gray-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${u.role === 'admin' ? 'bg-secondary/10 text-secondary' : 'bg-surfaceLight'}`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${u.is_active ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleToggleActive(u.id)} className="p-2 hover:bg-surfaceLight rounded-lg mr-1" title={u.is_active ? 'Deactivate' : 'Activate'}>
                      {u.is_active ? <FiUserX size={14} /> : <FiUserCheck size={14} />}
                    </button>
                    {u.role !== 'admin' && (
                      <button onClick={() => handleDelete(u.id)} className="p-2 hover:bg-danger/10 text-danger rounded-lg">
                        <FiTrash2 size={14} />
                      </button>
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

export default AdminUsersPage;
