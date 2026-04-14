import React, { useState, useEffect } from "react";
import { formatCurrency } from "../Utils/formatters";
import { FaEdit, FaBan, FaUnlock, FaTrash, FaDownload } from "react-icons/fa";

export default function AdminUsers({
  users,
  handleDeleteUser,
  setEditingUser,
  handleBlockUser,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionMenuId, setActionMenuId] = useState(null);

  const formatShortDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Effect to close the action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionMenuId !== null && !event.target.closest(".actions-cell")) {
        setActionMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [actionMenuId]);

  const handleExportCSV = () => {
    if (filteredUsers.length === 0) return;
    const csvData = filteredUsers.map((u) => ({
      ID: u.id,
      Name: u.name || "N/A",
      Email: u.email,
      "Total Bookings": u.total_bookings,
      "Total Spent": u.total_spent,
      "Last Booking": formatShortDate(u.last_booking_date),
      "Joined Date": formatShortDate(u.created_at),
      "Last Login": formatShortDate(u.last_login),
      Role: u.role || "user",
      Status: u.is_blocked ? "Blocked" : "Active",
    }));

    const headers = Object.keys(csvData[0]).join(",");
    const rows = csvData
      .map((row) =>
        Object.values(row)
          .map((val) => `"${String(val).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([`${headers}\n${rows}`], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "users_export.csv";
    link.click();
  };

  return (
    <>
      <div className="admin-table-header">
        <h2 className="admin-header" style={{ marginBottom: 0 }}>
          Registered Users
        </h2>
        <div className="admin-table-controls">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-search-input"
          />
          <div className="admin-table-actions">
            <button
              className="admin-btn-primary"
              style={{
                backgroundColor: "#28a745",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
              onClick={handleExportCSV}
            >
              <FaDownload /> Download CSV
            </button>
          </div>
        </div>
      </div>
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th
                style={{
                  width: "80px",
                  whiteSpace: "normal",
                  textAlign: "center",
                  lineHeight: "1.2",
                }}
              >
                Total Bookings
              </th>
              <th>Total Spent</th>
              <th>Last Booking</th>
              <th>Joined Date</th>
              <th>Last Login</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>
                    <strong>{user.name || "N/A"}</strong>
                  </td>
                  <td>{user.email}</td>
                  <td style={{ textAlign: "center" }}>{user.total_bookings}</td>
                  <td>{formatCurrency(user.total_spent)}</td>
                  <td>{formatShortDate(user.last_booking_date)}</td>
                  <td>{formatShortDate(user.created_at)}</td>
                  <td>{formatShortDate(user.last_login)}</td>
                  <td>
                    <span
                      className={`role-badge ${
                        user.role?.toLowerCase() === "admin"
                          ? "role-admin"
                        : user.role?.toLowerCase() === "provider"
                        ? "role-provider"
                          : "role-user"
                      }`}
                    >
                      {user.role || "user"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${
                        user.is_blocked ? "status-blocked" : "status-active"
                      }`}
                    >
                      {user.is_blocked ? "Blocked" : "Active"}
                    </span>
                  </td>
                  <td
                    className="actions-cell"
                    style={
                      actionMenuId === user.id
                        ? { position: "relative", zIndex: 100 }
                        : {}
                    }
                  >
                    <button
                      className="admin-action-btn"
                      onClick={() =>
                        setActionMenuId(
                          actionMenuId === user.id ? null : user.id,
                        )
                      }
                    >
                      Actions &#9662;
                    </button>
                    {actionMenuId === user.id && (
                      <div className="actions-dropdown">
                        <button
                          onClick={() => {
                            setEditingUser(user);
                            setActionMenuId(null);
                          }}
                        >
                          <FaEdit
                            className="dropdown-icon"
                            style={{ color: "#007bff" }}
                          />{" "}
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            handleBlockUser(user);
                            setActionMenuId(null);
                          }}
                        >
                          {user.is_blocked ? (
                            <>
                              <FaUnlock
                                className="dropdown-icon"
                                style={{ color: "#28a745" }}
                              />{" "}
                              Unblock
                            </>
                          ) : (
                            <>
                              <FaBan
                                className="dropdown-icon"
                                style={{ color: "#fd7e14" }}
                              />{" "}
                              Block
                            </>
                          )}
                        </button>
                        <div className="dropdown-divider"></div>
                        <button
                          className="delete"
                          onClick={() => {
                            handleDeleteUser(user.id);
                            setActionMenuId(null);
                          }}
                        >
                          <FaTrash className="dropdown-icon" /> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr className="no-users-row">
                <td colSpan="11">No users found in the database.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <style>{`
        .status-badge {
          padding: 5px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
          color: white;
          display: inline-block;
        }
        .status-active { background-color: #28a745; }
        .status-blocked { background-color: #dc3545; }
        .role-provider { 
          background-color: #ffc107; /* Yellow */
          color: #212529; /* Dark text for contrast */
        }
        .admin-table-wrapper {
          overflow-x: auto; /* Makes table scrollable on small screens */
        }
        .admin-table {
          width: 100%;
          min-width: 1200px; /* Force scrollbar if viewport is too narrow */
        }
        .admin-table td, .admin-table th {
          white-space: nowrap; /* Prevents text from wrapping */
          padding: 12px 15px;
        }
        .actions-cell .admin-action-btn {
          background-color: #6c757d;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        .actions-dropdown {
          position: absolute;
          right: 0;
          top: calc(100% + 5px);
          background-color: white;
          border: 1px solid #eaeaea;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          width: 140px;
          padding: 5px 0;
          overflow: hidden;
          animation: dropdownFade 0.2s ease forwards;
        }
        .actions-dropdown button {
          background: none;
          border: none;
          text-align: left;
          padding: 10px 15px;
          cursor: pointer;
          width: 100%;
          font-size: 13px;
          font-weight: 500;
          color: #495057;
          display: flex;
          align-items: center;
          transition: background-color 0.2s ease, color 0.2s ease;
        }
        .dropdown-icon {
          margin-right: 10px;
          font-size: 14px;
        }
        .dropdown-divider {
          height: 1px;
          background-color: #f1f1f1;
          margin: 4px 0;
        }
        .actions-dropdown button:hover {
          background-color: #f8f9fa;
          color: #212529;
        }
        .actions-dropdown button.delete {
          color: #dc3545;
        }
        .actions-dropdown button.delete:hover {
          background-color: #fff5f5;
          color: #c82333;
        }
        @keyframes dropdownFade {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
