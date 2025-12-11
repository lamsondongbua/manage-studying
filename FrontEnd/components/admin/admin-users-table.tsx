'use client';

import { useState } from 'react';
import { useAdmin } from '@/contexts/admin-context';
import { Shield, Ban, Check, Trash2, Eye } from 'lucide-react';
import AdminUsersDetail from './admin-users-detail';
import { formatDateVN } from "../../util/date";


export default function AdminUsersTable() {
  const { users, updateUserStatus, deleteUser } = useAdmin();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'inactive': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-effect p-6 rounded-xl border border-white/10 overflow-x-auto animate-slide-up">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">Danh Sách Người Dùng ({users.length})</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-4 px-4 text-slate-400 font-semibold">Username</th>
              <th className="text-left py-4 px-4 text-slate-400 font-semibold">Email</th>
              <th className="text-left py-4 px-4 text-slate-400 font-semibold">Role</th>
              <th className="text-left py-4 px-4 text-slate-400 font-semibold">Status</th>
              <th className="text-left py-4 px-4 text-slate-400 font-semibold">Create At</th>
              <th className="text-left py-4 px-4 text-slate-400 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr
                key={user.id}
                className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <td className="py-4 px-4">
                  <div className="font-medium text-white">{user.email}</div>
                </td>
                <td className="py-4 px-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(user.status)}`}>
                    {user.status === 'active' && <Check size={14} className="mr-1" />}
                    {user.status === 'active' ? 'Hoạt Động' : user.status === 'inactive' ? 'Không Hoạt Động' : 'Bị Khóa'}
                  </span>
                </td>
                <td className="py-4 px-4 text-purple-400 font-semibold">{user.stats.completedTasks}</td>
                <td className="py-4 px-4 text-slate-400 text-xs">{formatDateVN(user.createdAt)}</td>
                <td className="py-4 px-4 text-slate-400 text-xs">
                </td>
                <td className="py-4 px-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedUserId(user.id)}
                      className="p-2 hover:bg-slate-600/50 rounded-lg transition-colors duration-200 hover:scale-110"
                      title="Xem chi tiết"
                    >
                      <Eye size={16} className="text-cyan-400" />
                    </button>
                    <select
                      value={user.status}
                      onChange={(e) => updateUserStatus(user.id, e.target.value as any)}
                      className="px-2 py-1 bg-slate-700 rounded text-sm border border-slate-600 text-white cursor-pointer hover:border-purple-500 transition-colors"
                    >
                      <option value="active">Hoạt Động</option>
                      <option value="inactive">Không Hoạt Động</option>
                      <option value="suspended">Bị Khóa</option>
                    </select>
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors duration-200 hover:scale-110"
                      title="Xóa"
                    >
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUserId && (
        <AdminUsersDetail userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      )}
    </div>
  );
}
