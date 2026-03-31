import {
  FaChartBar,
  FaUsers,
  FaCalendarAlt,
  FaStar,
  FaCog,
  FaTools,
  FaFire,
  FaTags,
} from "react-icons/fa";

export default function AdminSidebar({ activeTab, setActiveTab }) {
  const handleClick = (e, tab) => {
    e.preventDefault();
    setActiveTab(tab);
  };

  return (
    <aside className="admin-sidebar">
      <ul className="admin-sidebar-menu">
        <li className={activeTab === "statistics" ? "active" : ""}>
          <a href="#statistics" onClick={(e) => handleClick(e, "statistics")}>
            <FaChartBar /> Statistics
          </a>
        </li>
        <li className={activeTab === "users" ? "active" : ""}>
          <a href="#users" onClick={(e) => handleClick(e, "users")}>
            <FaUsers /> Users
          </a>
        </li>
        <li className={activeTab === "services" ? "active" : ""}>
          <a href="#services" onClick={(e) => handleClick(e, "services")}>
            <FaTools /> Services
          </a>
        </li>
        <li className={activeTab === "bookings" ? "active" : ""}>
          <a href="#bookings" onClick={(e) => handleClick(e, "bookings")}>
            <FaCalendarAlt /> Bookings
          </a>
        </li>
        <li className={activeTab === "coupons" ? "active" : ""}>
          <a href="#coupons" onClick={(e) => handleClick(e, "coupons")}>
            <FaTags /> Coupons
          </a>
        </li>
        <li className={activeTab === "reviews" ? "active" : ""}>
          <a href="#reviews" onClick={(e) => handleClick(e, "reviews")}>
            <FaStar /> Reviews
          </a>
        </li>
        <li className={activeTab === "popular-services" ? "active" : ""}>
          <a href="#popular-services" onClick={(e) => handleClick(e, "popular-services")}>
            <FaFire /> Popular Services
          </a>
        </li>
      </ul>

      <div className="admin-sidebar-bottom">
        <ul className="admin-sidebar-menu">
          <li className={activeTab === "settings" ? "active" : ""}>
            <a href="#settings" onClick={(e) => handleClick(e, "settings")}>
              <FaCog /> Settings
            </a>
          </li>
        </ul>
      </div>
    </aside>
  );
}
