import React from "react";

export default function AddServiceModal({
  newService,
  setNewService,
  categories,
  handleAddService,
  setIsAddingService,
}) {
  return (
    <div
      className="admin-modal-overlay"
      onClick={() => setIsAddingService(false)}
    >
      <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0, color: "var(--primary)" }}>
          Add New Service
        </h3>
        <div className="admin-form-group">
          <label>Name</label>
          <input
            type="text"
            value={newService.name}
            onChange={(e) =>
              setNewService({ ...newService, name: e.target.value })
            }
            placeholder="e.g. Sofa Cleaning"
          />
        </div>
        <div className="admin-form-group">
          <label>Category</label>
          <select
            value={newService.category_id}
            onChange={(e) =>
              setNewService({ ...newService, category_id: e.target.value })
            }
          >
            <option value="">-- Select Category --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div className="admin-form-group">
          <label>Price (₹)</label>
          <input
            type="number"
            value={newService.price}
            onChange={(e) =>
              setNewService({ ...newService, price: e.target.value })
            }
            placeholder="e.g. 1499"
          />
        </div>
        <div className="admin-form-group">
          <label>Visit Price (₹)</label>
          <input
            type="number"
            value={newService.visit_price}
            onChange={(e) =>
              setNewService({ ...newService, visit_price: e.target.value })
            }
            placeholder="e.g. 99"
          />
        </div>
        <div className="admin-modal-actions">
          <button
            className="admin-btn-secondary"
            onClick={() => setIsAddingService(false)}
          >
            Cancel
          </button>
          <button className="admin-btn-primary" onClick={handleAddService}>
            Add Service
          </button>
        </div>
      </div>
    </div>
  );
}
