import React from "react";

export default function AddPopularServiceModal({
  newPopularService,
  setNewPopularService,
  handleAddPopularService,
  setIsAddingPopularService,
}) {
  return (
    <div
      className="admin-modal-overlay"
      onClick={() => setIsAddingPopularService(false)}
    >
      <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0, color: "var(--primary)" }}>
          Add New Popular Service
        </h3>
        <div className="admin-form-group">
          <label>Name</label>
          <input
            type="text"
            value={newPopularService.name}
            onChange={(e) =>
              setNewPopularService({
                ...newPopularService,
                name: e.target.value,
              })
            }
            placeholder="e.g. Full Home Cleaning"
          />
        </div>
        <div className="admin-form-group">
          <label>Price (₹)</label>
          <input
            type="number"
            value={newPopularService.price}
            onChange={(e) =>
              setNewPopularService({
                ...newPopularService,
                price: e.target.value,
              })
            }
            placeholder="e.g. 1499"
          />
        </div>
        <div className="admin-form-group">
          <label>Image URL</label>
          <input
            type="text"
            value={newPopularService.image_url}
            onChange={(e) =>
              setNewPopularService({
                ...newPopularService,
                image_url: e.target.value,
              })
            }
            placeholder="https://example.com/image.jpg"
          />
        </div>
        <div className="admin-modal-actions">
          <button
            className="admin-btn-secondary"
            onClick={() => setIsAddingPopularService(false)}
          >
            Cancel
          </button>
          <button
            className="admin-btn-primary"
            onClick={handleAddPopularService}
          >
            Add Popular Service
          </button>
        </div>
      </div>
    </div>
  );
}