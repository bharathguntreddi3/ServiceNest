import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { logout } from "../redux/authSlice";
import { clearCart } from "../redux/cartSlice";
import logo from "../assets/logo.png";
import { FaBars } from "react-icons/fa";

export default function AdminNavbar({ toggleSidebar, showAlert }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearCart());
    localStorage.removeItem("token");
    navigate("/");
  };

  // session timeout auto logout in admin panel

  useEffect(() => {
    let timeoutId;
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const expTime = payload.exp * 1000;
        const currentTime = Date.now();
        const timeLeft = expTime - currentTime;

        const handleSessionExpired = () => {
          dispatch(logout());
          dispatch(clearCart());
          localStorage.removeItem("token");
          navigate("/admin/login");
        };

        const triggerAutoLogout = () => {
          showAlert(
            "Your admin session has expired. Please log in again.",
            handleSessionExpired,
          );
        };

        if (timeLeft <= 0) {
          triggerAutoLogout();
        } else {
          timeoutId = setTimeout(triggerAutoLogout, timeLeft);
        }
      } catch (error) {
        console.error("Error parsing token for expiration", error);
      }
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [dispatch, navigate]);

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <div className="logo" style={{ display: "flex", alignItems: "center" }}>
          <button className="admin-sidebar-toggle" onClick={toggleSidebar}>
            <FaBars />
          </button>
          <Link
            to="/admin"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "15px",
              textDecoration: "none",
            }}
          >
            <img
              className="admin-logo-img"
              src={logo}
              alt="logo"
              style={{ height: "140px", width: "140px", margin: "-30px 0" }}
            />
            <span
              className="admin-logo-text"
              style={{
                fontSize: "26px",
                fontWeight: "800",
                color: "white",
                letterSpacing: "1px",
              }}
            >
              ServiceNest Admin
            </span>
          </Link>
        </div>
        <div className="nav-actions">
          <button onClick={handleLogout} className="login-btn">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
