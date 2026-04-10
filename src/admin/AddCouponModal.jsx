import React from "react";

export default function AddCouponModal({
  newCoupon,
  setNewCoupon,
  handleAddCoupon,
  setIsAddingCoupon,
}) {
  return (
    <div
      className="admin-modal-overlay"
      onClick={() => setIsAddingCoupon(false)}
    >
      <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0, color: "var(--primary)" }}>
          Add New Coupon
        </h3>
        <div className="admin-form-group">
          <label>Coupon Code</label>
          <input
            type="text"
            value={newCoupon.code}
            onChange={(e) =>
              setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })
            }
            placeholder="e.g. SUMMER20"
          />
        </div>
        <div className="admin-form-group">
          <label>Description</label>
          <input
            type="text"
            value={newCoupon.description}
            onChange={(e) =>
              setNewCoupon({ ...newCoupon, description: e.target.value })
            }
            placeholder="e.g. 20% off on all services"
          />
        </div>
        <div className="admin-form-group">
          <label>Discount Percent (%)</label>
          <input
            type="number"
            value={newCoupon.discount_percent}
            onChange={(e) =>
              setNewCoupon({ ...newCoupon, discount_percent: e.target.value })
            }
            placeholder="e.g. 20"
          />
        </div>
        <div className="admin-modal-actions">
          <button
            className="admin-btn-secondary"
            onClick={() => setIsAddingCoupon(false)}
          >
            Cancel
          </button>
          <button className="admin-btn-primary" onClick={handleAddCoupon}>
            Add Coupon
          </button>
        </div>
      </div>
    </div>
  );
}
