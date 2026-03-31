import React from "react";

export default function EditCouponModal({
  editingCoupon,
  setEditingCoupon,
  handleUpdateCoupon,
}) {
  if (!editingCoupon) return null;

  return (
    <div
      className="admin-modal-overlay"
      onClick={() => setEditingCoupon(null)}
    >
      <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0, color: "var(--primary)" }}>Edit Coupon</h3>
        <div className="admin-form-group">
          <label>Coupon Code</label>
          <input
            type="text"
            value={editingCoupon.code}
            onChange={(e) =>
              setEditingCoupon({
                ...editingCoupon,
                code: e.target.value.toUpperCase(),
              })
            }
          />
        </div>
        <div className="admin-form-group">
          <label>Description</label>
          <input
            type="text"
            value={editingCoupon.description}
            onChange={(e) =>
              setEditingCoupon({ ...editingCoupon, description: e.target.value })
            }
          />
        </div>
        <div className="admin-form-group">
          <label>Discount Percent (%)</label>
          <input
            type="number"
            value={editingCoupon.discount_percent}
            onChange={(e) =>
              setEditingCoupon({
                ...editingCoupon,
                discount_percent: e.target.value,
              })
            }
          />
        </div>
        <div className="admin-form-group">
          <label>Status</label>
          <select
            value={editingCoupon.is_active}
            onChange={(e) =>
              setEditingCoupon({
                ...editingCoupon,
                is_active: Number(e.target.value),
              })
            }
          >
            <option value={1}>Active</option>
            <option value={0}>Inactive</option>
          </select>
        </div>
        <div className="admin-modal-actions">
          <button
            className="admin-btn-secondary"
            onClick={() => setEditingCoupon(null)}
          >
            Cancel
          </button>
          <button className="admin-btn-primary" onClick={handleUpdateCoupon}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}