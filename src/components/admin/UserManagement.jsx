import { useState } from "react";
import { useAdmin } from "../../context/AdminContext";
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Mail,
  Lock,
  User,
} from "lucide-react";

const UserManagement = () => {
  const { adminData, addUser, updateUser, deleteUser } = useAdmin();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    fullName: "",
    email: "",
    role: "staff",
  });

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: "",
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: "",
        password: "",
        fullName: "",
        email: "",
        role: "staff",
      });
    }
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingUser) {
      updateUser(editingUser.id, formData);
    } else {
      addUser(formData);
    }
    setShowModal(false);
  };

  const handleDelete = (userId) => {
    if (confirm("Bạn có chắc muốn xóa user này?")) {
      deleteUser(userId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Users className="w-8 h-8" />
            Quản Lý User
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Thêm, sửa, xóa tài khoản người dùng
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn-primary px-4 py-2 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Thêm User
        </button>
      </div>

      {/* Users List */}
      <div className="card p-6">
        <div className="grid gap-4">
          {adminData.users.map((user) => (
            <div
              key={user.id}
              className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-coffee-600 dark:hover:border-coffee-400 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-coffee-600 flex items-center justify-center text-white font-bold text-lg">
                    {user.fullName[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100">
                      {user.fullName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      @{user.username} • {user.email}
                    </p>
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold mt-1 ${
                        user.role === "admin"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}
                    >
                      {user.role === "admin" ? "Admin" : "Staff"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenModal(user)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="card max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
              {editingUser ? "Chỉnh sửa User" : "Thêm User Mới"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Họ tên
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="input w-full pl-10"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tên đăng nhập
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="input w-full pl-10"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mật khẩu {editingUser && "(để trống nếu không đổi)"}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="input w-full pl-10"
                    required={!editingUser}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Vai trò
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="input w-full"
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Lưu
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary px-6 py-3"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
