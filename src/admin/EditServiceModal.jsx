import React from "react";

export default function EditServiceModal({
  editingService,
  setEditingService,
  handleSaveServiceEdit,
}) {
  if (!editingService) return null;

  return (
    <div
      className="admin-modal-overlay"
      onClick={() => setEditingService(null)}
    >
      <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0, color: "var(--primary)" }}>Edit Service</h3>
        <div className="admin-form-group">
          <label>Name</label>
          <input
            type="text"
            value={editingService.name || ""}
            onChange={(e) =>
              setEditingService({ ...editingService, name: e.target.value })
            }
          />
        </div>
        <div className="admin-form-group">
          <label>Price (₹)</label>
          <input
            type="number"
            value={editingService.price || ""}
            onChange={(e) =>
              setEditingService({ ...editingService, price: e.target.value })
            }
          />
        </div>
        <div className="admin-form-group">
          <label>Visit Price (₹)</label>
          <input
            type="number"
            value={editingService.visit_price || ""}
            onChange={(e) =>
              setEditingService({
                ...editingService,
                visit_price: e.target.value,
              })
            }
          />
        </div>
        <div className="admin-modal-actions">
          <button
            className="admin-btn-secondary"
            onClick={() => setEditingService(null)}
          >
            Cancel
          </button>
          <button className="admin-btn-primary" onClick={handleSaveServiceEdit}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
