import React from "react";
import { FaEdit, FaTrash, FaToggleOn, FaToggleOff } from "react-icons/fa";

export default function AdminCoupons({
  coupons,
  setIsAddingCoupon,
  setEditingCoupon,
  handleDeleteCoupon,
  handleToggleCouponStatus,
}) {
  return (
    <>
      <div className="admin-table-header">
        <h2 className="admin-header" style={{ marginBottom: 0 }}>
          Coupon Management
        </h2>
        <div className="admin-table-controls">
          <div className="admin-table-actions">
            <button
              className="admin-btn-primary"
              onClick={() => setIsAddingCoupon(true)}
            >
              + Add Coupon
            </button>
          </div>
        </div>
      </div>
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Code</th>
              <th>Description</th>
              <th>Discount %</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length > 0 ? (
              coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td>{coupon.id}</td>
                  <td>
                    <strong>{coupon.code}</strong>
                  </td>
                  <td>{coupon.description}</td>
                  <td>{coupon.discount_percent}%</td>
                  <td>
                    <span
                      className={`status-badge ${
                        coupon.is_active ? "status-active" : "status-blocked"
                      }`}
                    >
                      {coupon.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="admin-action-btn edit"
                      onClick={() => setEditingCoupon(coupon)}
                    >
                      <FaEdit /> Edit
                    </button>
                    <button
                      className={`admin-action-btn ${
                        coupon.is_active ? "block" : "unblock"
                      }`}
                      onClick={() => handleToggleCouponStatus(coupon)}
                    >
                      {coupon.is_active ? (
                        <>
                          <FaToggleOff /> Deactivate
                        </>
                      ) : (
                        <>
                          <FaToggleOn /> Activate
                        </>
                      )}
                    </button>
                    <button
                      className="admin-action-btn delete"
                      onClick={() => handleDeleteCoupon(coupon.id)}
                    >
                      <FaTrash /> Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="no-users-row">
                <td colSpan="6">No coupons found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
