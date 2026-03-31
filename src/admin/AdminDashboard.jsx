import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AxiosInstance from "../Utils/AxiosInstance";
import AdminNavbar from "./AdminNavbar";
import AdminSidebar from "./AdminSidebar";
import AdminStatistics from "./AdminStatistics";
import AdminUsers from "./AdminUsers";
import AdminServices from "./AdminServices";
import AdminBookings from "./AdminBookings";
import AdminPopularServices from "./AdminPopularServices";
import AdminReviews from "./AdminReviews";
import AdminCoupons from "./AdminCoupons";
import AdminSettings from "./AdminSettings";
import EditUserModal from "./EditUserModal";
import EditServiceModal from "./EditServiceModal";
import EditPopularServiceModal from "./EditPopularServiceModal";
import AddServiceModal from "./AddServiceModal";
import AddPopularServiceModal from "./AddPopularServiceModal";
import "./AdminStyling.css";
import AddCouponModal from "./AddCouponModal";
import EditCouponModal from "./EditCouponModal";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [popularServices, setPopularServices] = useState([]);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [settings, setSettings] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null); // Added error state
  const [activeTab, setActiveTab] = useState("users");
  const [editingUser, setEditingUser] = useState(null);
  const [editingService, setEditingService] = useState(null);
  const [editingPopularService, setEditingPopularService] = useState(null);
  const [editingCoupon, setEditingCoupon] = useState(null);

  const [isAddingPopularService, setIsAddingPopularService] = useState(false);
  const [newPopularService, setNewPopularService] = useState({
    name: "",
    price: "",
    image_url: "",
  });

  const [isAddingService, setIsAddingService] = useState(false);
  const [newService, setNewService] = useState({
    category_id: "",
    name: "",
    price: "",
    visit_price: "",
  });

  const [isAddingCoupon, setIsAddingCoupon] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    description: "",
    discount_percent: "",
  });
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [filterDate, setFilterDate] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 992) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check on component mount
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      let datePass = true;
      if (filterDate !== "all" && b.booking_date) {
        const bDate = new Date(b.booking_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (filterDate === "today") {
          datePass = bDate >= today;
        } else if (filterDate === "week") {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          datePass = bDate >= weekAgo;
        } else if (filterDate === "month") {
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          datePass = bDate >= monthAgo;
        } else if (filterDate === "custom") {
          if (customStartDate && bDate < new Date(customStartDate))
            datePass = false;
          if (customEndDate) {
            const eDate = new Date(customEndDate);
            eDate.setHours(23, 59, 59, 999);
            if (bDate > eDate) datePass = false;
          }
        }
      }

      let locPass = true;
      if (filterLocation) {
        const loc = (b.city || b.location || b.address || "").toLowerCase();
        locPass = loc.includes(filterLocation.toLowerCase());
      }

      let catPass = true;
      if (filterCategory) {
        const service = services.find((s) => s.name === b.service_name);
        const serviceCategory = service ? service.category : null;
        if (serviceCategory !== filterCategory) {
          catPass = false;
        }
      }

      return datePass && locPass && catPass;
    });
  }, [
    bookings,
    filterDate,
    customStartDate,
    customEndDate,
    filterLocation,
    filterCategory,
    services,
  ]);

  // --- Data Fetching ---

  useEffect(() => {
    const fetchAdminData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Access Denied: Admins only. Please log in first.");
        setError("Authentication failed. Please log in as an admin."); // Set error state
        navigate("/admin/login");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      try {
        // Fetch Users
        try {
          const resUsers = await AxiosInstance.get(
            "http://localhost:3000/api/admin/users",
            { headers },
          );
          setUsers(Array.isArray(resUsers.data) ? resUsers.data : []);
        } catch (error) {
          console.error("Error fetching users:", error);
          const msg =
            error.response?.data?.error || "Access Denied: Admins only.";
          alert(msg);
          navigate("/admin/login");
          return;
        }

        // Fetch Bookings
        try {
          const resBookings = await AxiosInstance.get(
            "http://localhost:3000/api/admin/bookings",
            { headers },
          );
          setBookings(Array.isArray(resBookings.data) ? resBookings.data : []);
        } catch (error) {
          console.error("Error fetching bookings:", error);
        }

        // Fetch Reviews
        try {
          const resReviews = await AxiosInstance.get(
            "http://localhost:3000/api/admin/reviews",
            { headers },
          );
          setReviews(Array.isArray(resReviews.data) ? resReviews.data : []);
        } catch (error) {
          console.error("Error fetching reviews:", error);
        }

        // Fetch Popular Services
        try {
          const resPopularServices = await AxiosInstance.get(
            "http://localhost:3000/api/popular-services",
            { headers },
          );
          setPopularServices(
            Array.isArray(resPopularServices.data)
              ? resPopularServices.data
              : [],
          );
        } catch (error) {
          console.error("Error fetching popular services:", error);
        }

        // Fetch Services
        try {
          const resServices = await AxiosInstance.get(
            "http://localhost:3000/api/admin/services",
            { headers },
          );
          setServices(Array.isArray(resServices.data) ? resServices.data : []);
        } catch (error) {
          console.error("Error fetching services:", error);
        }

        // Fetch Coupons
        try {
          const resCoupons = await AxiosInstance.get(
            "http://localhost:3000/api/admin/coupons",
            { headers },
          );
          setCoupons(Array.isArray(resCoupons.data) ? resCoupons.data : []);
        } catch (error) {
          console.error("Error fetching coupons:", error);
        }

        // Fetch Categories for the "Add Service" dropdown
        try {
          const resCategories = await AxiosInstance.get(
            "http://localhost:3000/api/categories",
          );
          setCategories(
            Array.isArray(resCategories.data) ? resCategories.data : [],
          );
        } catch (error) {
          console.error("Error fetching categories:", error);
        }

        // Fetch Settings
        try {
          const resSettings = await AxiosInstance.get(
            "http://localhost:3000/api/settings",
          );
          setSettings(resSettings.data);
        } catch (error) {
          console.error("Error fetching settings:", error);
        }

        // Fetch Statistics
        try {
          const resStatistics = await AxiosInstance.get(
            "http://localhost:3000/api/admin/statistics",
            { headers },
          );
          setStatistics(resStatistics.data);
        } catch (error) {
          console.error("Error fetching statistics:", error);
        }
      } catch (error) {
        console.error("Error during initial data fetch:", error);
        setError("Failed to load admin data. Please check server connection."); // Set error state for general fetch issues
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();

    return () => {
      // Cleanup if needed
    };
  }, [navigate]);

  const handleDeleteUser = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const token = localStorage.getItem("token");
        await AxiosInstance.delete(
          `http://localhost:3000/api/admin/users/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setUsers(users.filter((user) => user.id !== id));
      } catch (error) {
        console.error("Error deleting user:", error);
        setError("Failed to delete user."); // Set error state for user feedback
        alert("Failed to delete user.");
      }
    }
  };

  const handleSaveEdit = async () => {
    if (window.confirm("Do you confirm saving these changes?")) {
      try {
        const token = localStorage.getItem("token");
        await AxiosInstance.put(
          `http://localhost:3000/api/admin/users/${editingUser.id}`,
          editingUser,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setUsers(users.map((u) => (u.id === editingUser.id ? editingUser : u)));
        setEditingUser(null);
      } catch (error) {
        setError("Failed to update user."); // Set error state for user feedback
        console.error("Error updating user:", error);
        alert("Failed to update user.");
      }
    }
  };

  const handleBlockUser = async (user) => {
    const action = user.is_blocked ? "unblock" : "block";
    if (window.confirm(`Are you sure you want to ${action} this user?`)) {
      try {
        const token = localStorage.getItem("token");
        const updatedUser = { ...user, is_blocked: !user.is_blocked };
        await AxiosInstance.put(
          `http://localhost:3000/api/admin/users/${user.id}`,
          updatedUser,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setUsers(users.map((u) => (u.id === user.id ? updatedUser : u)));
      } catch (error) {
        setError(`Failed to ${action} user.`);
        console.error(`Error ${action}ing user:`, error);
        alert(`Failed to ${action} user.`);
      }
    }
  };

  const handleDeleteService = async (id) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      try {
        const token = localStorage.getItem("token");
        await AxiosInstance.delete(
          `http://localhost:3000/api/admin/services/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setServices(services.filter((svc) => svc.id !== id));
      } catch (error) {
        setError("Failed to delete service."); // Set error state for user feedback
        console.error("Error deleting service:", error);
        alert("Failed to delete service.");
      }
    }
  };

  const handleSaveServiceEdit = async () => {
    if (window.confirm("Do you confirm saving these changes?")) {
      try {
        const token = localStorage.getItem("token");
        await AxiosInstance.put(
          `http://localhost:3000/api/admin/services/${editingService.id}`,
          editingService,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setServices(
          services.map((s) =>
            s.id === editingService.id ? editingService : s,
          ),
        );
        setEditingService(null);
        alert("Service updated successfully!");
      } catch (error) {
        console.error("Error updating service:", error);
        alert("Failed to update service.");
      }
    }
  };

  const handleDeletePopularService = async (id) => {
    if (
      window.confirm("Are you sure you want to delete this popular service?")
    ) {
      try {
        const token = localStorage.getItem("token");
        await AxiosInstance.delete(
          `http://localhost:3000/api/admin/popular-services/${id}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setPopularServices(popularServices.filter((svc) => svc.id !== id));
      } catch (error) {
        setError("Failed to delete popular service.");
        console.error("Error deleting popular service:", error);
        alert("Failed to delete popular service.");
      }
    }
  };

  const handleSavePopularServiceEdit = async () => {
    if (!editingPopularService) return;
    if (
      window.confirm("Do you confirm saving changes to this popular service?")
    ) {
      try {
        const token = localStorage.getItem("token");
        const response = await AxiosInstance.put(
          `http://localhost:3000/api/admin/popular-services/${editingPopularService.id}`,
          editingPopularService,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setPopularServices(
          popularServices.map((svc) =>
            svc.id === editingPopularService.id ? response.data : svc,
          ),
        );
        setEditingPopularService(null);
        alert("Popular service updated successfully!");
      } catch (error) {
        console.error("Error updating popular service:", error);
        alert("Failed to update popular service.");
      }
    }
  };

  const handleAddPopularService = async () => {
    if (
      !newPopularService.name ||
      !newPopularService.price ||
      !newPopularService.image_url
    ) {
      alert("Please fill in all fields.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await AxiosInstance.post(
        "http://localhost:3000/api/admin/popular-services",
        newPopularService,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // Refetch to see the new service
      const resPopularServices = await AxiosInstance.get(
        "http://localhost:3000/api/popular-services",
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setPopularServices(
        Array.isArray(resPopularServices.data) ? resPopularServices.data : [],
      );

      setIsAddingPopularService(false);
      setNewPopularService({ name: "", price: "", image_url: "" });
      alert("Popular service added successfully!");
    } catch (error) {
      setError("Failed to add popular service.");
      console.error("Error adding popular service:", error);
      alert("Failed to add popular service.");
    }
  };

  const handleAddService = async () => {
    if (
      !newService.category_id ||
      !newService.name ||
      !newService.price ||
      !newService.visit_price
    ) {
      alert("Please fill in all fields before adding the service.");
      return;
    }

    try {
      let token = localStorage.getItem("token");
      // Save to database
      const response = await AxiosInstance.post(
        "http://localhost:3000/api/admin/services",
        newService,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // If the backend issues a new token on mutation, update it.
      if (response.data?.token) {
        token = response.data.token;
        localStorage.setItem("token", token);
      }

      // Refetch services to instantly show the new addition with the correct category name
      const resServices = await AxiosInstance.get(
        "http://localhost:3000/api/admin/services",
        { headers: { Authorization: `Bearer ${token}` } }, // Use the potentially new token
      );
      setServices(Array.isArray(resServices.data) ? resServices.data : []);

      // Close modal and reset form
      setIsAddingService(false);
      setNewService({ category_id: "", name: "", price: "", visit_price: "" });

      alert("Service added successfully!");
    } catch (error) {
      setError("Failed to add service."); // Set error state for user feedback
      console.error("Error adding service:", error);
      alert("Failed to add service.");
    }
  };

  const handleAddCoupon = async () => {
    if (!newCoupon.code || newCoupon.discount_percent === "") {
      alert("Please fill in code and discount percent.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await AxiosInstance.post(
        "http://localhost:3000/api/admin/coupons",
        newCoupon,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setCoupons([response.data, ...coupons]);
      setIsAddingCoupon(false);
      setNewCoupon({ code: "", description: "", discount_percent: "" });
      alert("Coupon added successfully!");
    } catch (error) {
      console.error("Error adding coupon:", error);
      alert(error.response?.data?.error || "Failed to add coupon.");
    }
  };

  const handleToggleCouponStatus = async (coupon) => {
    const action = coupon.is_active ? "deactivate" : "activate";
    if (window.confirm(`Are you sure you want to ${action} this coupon?`)) {
      try {
        const token = localStorage.getItem("token");
        // The backend expects a boolean or 0/1. Let's send the opposite of current.
        const updatedCoupon = { ...coupon, is_active: !coupon.is_active };
        await AxiosInstance.put(
          `http://localhost:3000/api/admin/coupons/${coupon.id}`,
          updatedCoupon,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setCoupons(
          coupons.map((c) => (c.id === coupon.id ? updatedCoupon : c)),
        );
        alert(`Coupon ${action}d successfully!`);
      } catch (error) {
        console.error(`Error ${action}ing coupon:`, error);
        alert(`Failed to ${action} coupon.`);
      }
    }
  };

  const handleUpdateCoupon = async () => {
    if (!editingCoupon) return;
    try {
      const token = localStorage.getItem("token");
      const response = await AxiosInstance.put(
        `http://localhost:3000/api/admin/coupons/${editingCoupon.id}`,
        editingCoupon,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setCoupons(
        coupons.map((c) => (c.id === editingCoupon.id ? response.data : c)),
      );
      setEditingCoupon(null);
      alert("Coupon updated successfully!");
    } catch (error) {
      console.error("Error updating coupon:", error);
      alert(error.response?.data?.error || "Failed to update coupon.");
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (window.confirm("Are you sure you want to delete this coupon?")) {
      try {
        const token = localStorage.getItem("token");
        await AxiosInstance.delete(
          `http://localhost:3000/api/admin/coupons/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setCoupons(coupons.filter((c) => c.id !== id));
        alert("Coupon deleted successfully.");
      } catch (error) {
        console.error("Error deleting coupon:", error);
        alert("Failed to delete coupon.");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="admin-page-wrapper">
        <AdminNavbar />
        <div className="container admin-loading-container">
          <h2>Loading Dashboard...</h2>
        </div>
      </div>
    );
  }

  // Display error message if an error occurred
  if (error) {
    return (
      <div className="admin-page-wrapper">
        <AdminNavbar />
        <div
          className="container admin-loading-container"
          style={{ color: "red", textAlign: "center", padding: "50px" }}
        >
          <h2>Error: {error}</h2>
          <p>
            Please check the console for more details or try refreshing the
            page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-wrapper">
      <AdminNavbar toggleSidebar={toggleSidebar} />
      <div className={`admin-layout ${isSidebarOpen ? "sidebar-open" : ""}`}>
        <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {isSidebarOpen && window.innerWidth < 992 && (
          <div className="admin-sidebar-overlay" onClick={toggleSidebar}></div>
        )}
        <main className="admin-main-content">
          <div className="admin-content-container">
            {["statistics", "bookings"].includes(activeTab) && (
              <div className="dashboard-filters">
                <div className="filter-group">
                  <label>Date Range</label>
                  <select
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>

                {filterDate === "custom" && (
                  <>
                    <div className="filter-group">
                      <label>Start Date</label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                      />
                    </div>
                    <div className="filter-group">
                      <label>End Date</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div className="filter-group">
                  <label>City / Location</label>
                  <input
                    type="text"
                    placeholder="Search location..."
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                  />
                </div>

                <div className="filter-group">
                  <label>Service Category</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {(filterDate !== "all" ||
                  filterLocation !== "" ||
                  filterCategory !== "") && (
                  <div className="filter-group">
                    <label>&nbsp;</label>
                    <button
                      className="admin-btn-secondary"
                      onClick={() => {
                        setFilterDate("all");
                        setCustomStartDate("");
                        setCustomEndDate("");
                        setFilterLocation("");
                        setFilterCategory("");
                      }}
                      style={{
                        padding: "10px 15px",
                        borderRadius: "8px",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: "600",
                      }}
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "statistics" && (
              <AdminStatistics
                statistics={statistics}
                bookings={filteredBookings}
                users={users}
              />
            )}
            {activeTab === "users" && (
              <AdminUsers
                users={users}
                handleDeleteUser={handleDeleteUser}
                setEditingUser={setEditingUser}
                handleBlockUser={handleBlockUser}
              />
            )}
            {activeTab === "services" && (
              <AdminServices
                services={services}
                handleDeleteService={handleDeleteService}
                setEditingService={setEditingService}
                setIsAddingService={setIsAddingService}
              />
            )}
            {activeTab === "coupons" && (
              <AdminCoupons
                coupons={coupons}
                setIsAddingCoupon={setIsAddingCoupon}
                setEditingCoupon={setEditingCoupon}
                handleDeleteCoupon={handleDeleteCoupon}
                handleToggleCouponStatus={handleToggleCouponStatus}
              />
            )}
            {activeTab === "bookings" && (
              <AdminBookings bookings={filteredBookings} />
            )}
            {activeTab === "reviews" && <AdminReviews reviews={reviews} />}
            {activeTab === "popular-services" && (
              <AdminPopularServices
                popularServices={popularServices}
                handleDeletePopularService={handleDeletePopularService}
                setEditingPopularService={setEditingPopularService}
                setIsAddingPopularService={setIsAddingPopularService}
              />
            )}
            {activeTab === "settings" && (
              <AdminSettings
                initialSettings={settings}
                onSettingsSave={setSettings}
              />
            )}
          </div>
        </main>
      </div>

      {editingUser && (
        <EditUserModal
          editingUser={editingUser}
          setEditingUser={setEditingUser}
          handleSaveEdit={handleSaveEdit}
        />
      )}

      {editingService && (
        <EditServiceModal
          editingService={editingService}
          setEditingService={setEditingService}
          handleSaveServiceEdit={handleSaveServiceEdit}
        />
      )}

      {editingPopularService && (
        <EditPopularServiceModal
          editingPopularService={editingPopularService}
          setEditingPopularService={setEditingPopularService}
          handleSavePopularServiceEdit={handleSavePopularServiceEdit}
        />
      )}

      {isAddingService && (
        <AddServiceModal
          newService={newService}
          setNewService={setNewService}
          categories={categories}
          handleAddService={handleAddService}
          setIsAddingService={setIsAddingService}
        />
      )}

      {isAddingPopularService && (
        <AddPopularServiceModal
          newPopularService={newPopularService}
          setNewPopularService={setNewPopularService}
          handleAddPopularService={handleAddPopularService}
          setIsAddingPopularService={setIsAddingPopularService}
        />
      )}

      {isAddingCoupon && (
        <AddCouponModal
          newCoupon={newCoupon}
          setNewCoupon={setNewCoupon}
          handleAddCoupon={handleAddCoupon}
          setIsAddingCoupon={setIsAddingCoupon}
        />
      )}

      {editingCoupon && (
        <EditCouponModal
          editingCoupon={editingCoupon}
          setEditingCoupon={setEditingCoupon}
          handleUpdateCoupon={handleUpdateCoupon}
        />
      )}

      <style>{`
        .admin-sidebar-toggle {
            display: block;
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            margin-right: 15px;
        }

        .admin-sidebar-overlay {
            display: none;
        }

        /* Mobile & Tablet */
        @media (max-width: 992px) {
            .admin-sidebar {
                position: fixed;
                left: 0;
                top: 0;
                height: 100%;
                transform: translateX(-100%);
                transition: transform 0.3s ease-in-out;
                z-index: 1001;
            }
            .admin-layout.sidebar-open .admin-sidebar {
                transform: translateX(0);
            }
            .admin-main-content {
                margin-left: 0 !important;
                padding: 15px;
            }
            .admin-sidebar-overlay {
                display: block;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                z-index: 1000;
            }
            .admin-content-container {
                padding: 0;
            }
            .admin-header {
                font-size: 20px;
            }
            .admin-table-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 15px; /* Reduced gap, margin on child is more reliable */
            }
            .admin-search-input {
                width: 100%;
            }
            .admin-table-controls {
                width: 100%;
            }
            .admin-logo-text {
                display: none;
            }
            .admin-logo-img {
                height: 80px !important;
                width: 80px !important;
                margin: -15px 0 !important;
            }
        }

        /* Desktop toggle behavior */
        @media (min-width: 993px) {
            .admin-layout:not(.sidebar-open) .admin-sidebar {
                margin-left: -250px;
            }
            .admin-layout:not(.sidebar-open) .admin-main-content {
                margin-left: 0;
            }
        }
      `}</style>
    </div>
  );
}
