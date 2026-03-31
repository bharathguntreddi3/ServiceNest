import React from "react";

export default function EditPopularServiceModal({
  editingPopularService,
  setEditingPopularService,
  handleSavePopularServiceEdit,
}) {
  if (!editingPopularService) return null;

  return (
    <div
      className="admin-modal-overlay"
      onClick={() => setEditingPopularService(null)}
    >
      <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0, color: "var(--primary)" }}>
          Edit Popular Service
        </h3>
        <div className="admin-form-group">
          <label>Name</label>
          <input
            type="text"
            value={editingPopularService.name || ""}
            onChange={(e) =>
              setEditingPopularService({
                ...editingPopularService,
                name: e.target.value,
              })
            }
          />
        </div>

        <div className="admin-form-group">
          <label>Price (₹)</label>
          <input
            type="number"
            value={editingPopularService.price || ""}
            onChange={(e) =>
              setEditingPopularService({
                ...editingPopularService,
                price: e.target.value,
              })
            }
          />
        </div>

        <div className="admin-form-group">
          <label>Image URL</label>
          <input
            type="text"
            value={editingPopularService.image_url || ""}
            onChange={(e) =>
              setEditingPopularService({
                ...editingPopularService,
                image_url: e.target.value,
              })
            }
          />
        </div>

        <div className="admin-modal-actions">
          <button
            className="admin-btn-secondary"
            onClick={() => setEditingPopularService(null)}
          >
            Cancel
          </button>
          <button
            className="admin-btn-primary"
            onClick={handleSavePopularServiceEdit}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
