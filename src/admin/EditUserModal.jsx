import React from "react";

export default function EditUserModal({
  editingUser,
  setEditingUser,
  handleSaveEdit,
}) {
  if (!editingUser) return null;

  return (
    <div className="admin-modal-overlay" onClick={() => setEditingUser(null)}>
      <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0, color: "var(--primary)" }}>Edit User</h3>
        <div className="admin-form-group">
          <label>Name</label>
          <input
            type="text"
            value={editingUser.name || ""}
            onChange={(e) =>
              setEditingUser({ ...editingUser, name: e.target.value })
            }
          />
        </div>
        <div className="admin-form-group">
          <label>Email</label>
          <input
            type="email"
            value={editingUser.email || ""}
            onChange={(e) =>
              setEditingUser({ ...editingUser, email: e.target.value })
            }
          />
        </div>
        <div className="admin-form-group">
          <label>Role</label>
          <select
            value={editingUser.role || "user"}
            onChange={(e) =>
              setEditingUser({ ...editingUser, role: e.target.value })
            }
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="admin-modal-actions">
          <button
            className="admin-btn-secondary"
            onClick={() => setEditingUser(null)}
          >
            Cancel
          </button>
          <button className="admin-btn-primary" onClick={handleSaveEdit}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
