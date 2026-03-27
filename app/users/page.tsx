"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Shield, 
  ShieldCheck, 
  Mail, 
  User as UserIcon, 
  Plus,
  Loader2,
  AlertCircle,
  X,
  CheckCircle2,
  Lock as LockIcon
} from "lucide-react";
import { authFetch } from "@/app/lib/auth-fetch";
import { useToast } from "@/app/_components/ToastProvider";
import { useConfirm } from "@/app/_components/ConfirmProvider";
import Cookies from "js-cookie";

interface User {
  _id: string;
  username: string;
  role: string;
  createdAt: string;
}

export default function UserManagementPage() {
  const { showToast } = useToast();
  const confirm = useConfirm();
  const router = useRouter();
  
  useEffect(() => {
    const role = Cookies.get("user-role");
    if (role !== "admin") {
      router.push("/");
    }
  }, [router]);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "staff",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      const res = await authFetch("/api/auth");
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server returned ${res.status}: ${text.slice(0, 100)}`);
      }
      const data = await res.json();
      setUsers(data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError("Network error fetching users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenModal = () => {
    setFormData({ username: "", password: "", role: "staff" });
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await authFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccess("User created successfully!");
        fetchUsers();
        setTimeout(() => setIsModalOpen(false), 1500);
      } else {
        const data = await res.json();
        setError(data.message || "Failed to create user");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string, username: string) => {
    if (username === Cookies.get("user-name")) {
      showToast('error', "You cannot delete your own account.");
      return;
    }

    const confirmed = await confirm({
      title: 'Delete User',
      message: `Are you sure you want to delete user "${username}"? This user will lose all access immediately.`,
      type: 'danger',
      confirmText: 'Delete User'
    });
    if (!confirmed) return;

    try {
      const res = await authFetch(`/api/auth/${id}`, { method: "DELETE" });

      if (res.ok) {
        setSuccess("User deleted successfully!");
        fetchUsers();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await res.json();
        setError(data.message || "Failed to delete user");
      }
    } catch (err) {
      setError("Network error");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">User Management</h1>
          <p className="text-slate-500 mt-1">Control who can access and manage the warehouse system.</p>
        </div>
        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95"
        >
          <UserPlus className="w-5 h-5" />
          Create New User
        </button>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            System Users
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-8 py-4">User</th>
                <th className="px-8 py-4">Role</th>
                <th className="px-8 py-4">Created At</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center text-slate-400">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors capitalize">
                          {user.username.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 capitalize">{user.username}</p>
                          <p className="text-xs text-slate-500">ID: {user._id.slice(-8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 w-fit ${
                        user.role === 'admin' 
                        ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                        : 'bg-slate-50 text-slate-600 border border-slate-200'
                      }`}>
                        {user.role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-sm text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-5 text-right">
                      {user.username !== Cookies.get("user-name") && (
                        <button 
                          onClick={() => handleDeleteUser(user._id, user.username)}
                          className="text-slate-400 hover:text-rose-500 p-2 rounded-lg hover:bg-rose-50 transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
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

      {/* Create User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => !submitting && setIsModalOpen(false)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-white/20 animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Add User</h2>
                  <p className="text-slate-500 text-sm">Create a new platform operator.</p>
                </div>
                {!submitting && (
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                )}
              </div>

              <form onSubmit={handleCreateUser} className="space-y-5">
                {error && (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm animate-fade-in">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}
                {success && (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-700 text-sm animate-fade-in">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <p>{success}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Username</label>
                    <div className="relative group">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="text"
                        required
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="john_doe"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Password</label>
                    <div className="relative group">
                      <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">System Role</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, role: "staff" })}
                        className={`py-3 rounded-2xl border-2 font-bold text-sm transition-all ${
                          formData.role === "staff" 
                          ? "bg-slate-900 text-white border-slate-900 shadow-md" 
                          : "bg-white text-slate-500 border-slate-100 hover:border-slate-200"
                        }`}
                      >
                        Staff
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, role: "admin" })}
                        className={`py-3 rounded-2xl border-2 font-bold text-sm transition-all ${
                          formData.role === "admin" 
                          ? "bg-blue-600 text-white border-blue-600 shadow-md" 
                          : "bg-white text-slate-500 border-slate-100 hover:border-slate-200"
                        }`}
                      >
                        Admin
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 px-1 mt-2 font-medium">
                      * Admins can create/delete users and access system settings.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2 mt-4"
                >
                  {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Confirm & Create"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
