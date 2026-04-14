import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaShoppingCart, FaUserCircle, FaBars, FaTimes } from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import { logout, login } from "../redux/authSlice";
import { clearCart, removeFromCart, setCart } from "../redux/cartSlice";
import logo from "../assets/logo.png";
import AxiosInstance from "../Utils/AxiosInstance";
import { useSettings } from "../context/SettingsContext";
import toast from "react-hot-toast";

/**
 * Navbar component
 * Displays the ServiceNest logo, navigation links and cart icon
 * @returns {JSX.Element} Navbar component
 */

export default function Navbar() {
  const cartItems = useSelector((state) => state.cart.items);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { settings } = useSettings();

  // Read user directly from Redux state
  const user = useSelector((state) => state.auth.user);
  const username = user?.name || user?.email?.split("@")[0];

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showMyServicesModal, setShowMyServicesModal] = useState(false);
  const [bookedServices, setBookedServices] = useState([]);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [showPromoBanner, setShowPromoBanner] = useState(true);
  const [timeLeft, setTimeLeft] = useState(7200); // 2 hours in seconds
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [updateOtp, setUpdateOtp] = useState("");
  const [showUpdateOtpInput, setShowUpdateOtpInput] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!showPromoBanner) return;
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [showPromoBanner]);

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  useEffect(() => {
    const syncLogout = (event) => {
      // When the token or user is removed from localStorage in another tab, log out this tab.
      if ((event.key === "token" || event.key === "user") && !event.newValue) {
        dispatch(logout());
        dispatch(clearCart());
      }
    };

    window.addEventListener("storage", syncLogout);

    return () => {
      window.removeEventListener("storage", syncLogout);
    };
  }, [dispatch]);

  // Session timeout on user side
  useEffect(() => {
    let timeoutId;
    const token = localStorage.getItem("token");

    if (user && token) {
      try {
        // Decode JWT payload to get expiration time
        const payload = JSON.parse(atob(token.split(".")[1]));
        const expTime = payload.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        const timeLeft = expTime - currentTime;

        const performAutoLogout = () => {
          dispatch(logout());
          dispatch(clearCart());
          localStorage.removeItem("token");
          navigate("/login");
          toast.error("Your session has expired. Please log in again.");
        };

        if (timeLeft <= 0) {
          performAutoLogout();
        } else {
          timeoutId = setTimeout(performAutoLogout, timeLeft);
        }
      } catch (error) {
        console.error("Error parsing token for expiration", error);
      }
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user, dispatch, navigate]);

  useEffect(() => {
    if (user) {
      setEditName(user.name || "");
      setEditEmail(user.email || "");
      setEditPhone(user.phone || "");
    }
  }, [user]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  useEffect(() => {
    setDropdownOpen(false); // Close dropdown when user navigates to another page
  }, [location.pathname]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearCart());
    localStorage.removeItem("token"); // Clear the JWT token on logout
    navigate("/");
  };

  useEffect(() => {
    if (showMyServicesModal && user) {
      const fetchBookedServices = async () => {
        setIsLoadingServices(true);
        try {
          const token = localStorage.getItem("token");
          const response = await AxiosInstance.get(`/api/bookings/${user.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setBookedServices(response.data);
        } catch (error) {
          console.error("Error fetching booked services:", error);
        } finally {
          setIsLoadingServices(false);
        }
      };
      fetchBookedServices();
    }
  }, [showMyServicesModal, user]);

  const handleCancelBooking = (bookingId) => {
    setBookingToCancel(bookingId);
  };

  const confirmCancelBooking = async () => {
    if (!bookingToCancel) return;
    try {
      const token = localStorage.getItem("token");
      await AxiosInstance.delete(
        `/api/bookings/${user.id}/${bookingToCancel}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setBookedServices((prev) => prev.filter((b) => b.id !== bookingToCancel));
      toast.success("Booking cancelled successfully!");
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error(error.response?.data?.error || "Failed to cancel booking.");
    } finally {
      setBookingToCancel(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone.",
      )
    ) {
      try {
        const token = localStorage.getItem("token");
        await AxiosInstance.delete(`/api/user/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        handleLogout();
        setShowSettingsModal(false);
      } catch (error) {
        console.error("Error deleting account:", error);
        toast.error("Failed to delete account. Please try again.");
      }
    }
  };

  const handleUpdateProfile = async () => {
    if (!editName.trim() || !editEmail.trim() || !editPhone.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }

    const isEmailOrPhoneChanged =
      editEmail.trim() !== (user.email || "") ||
      editPhone.trim() !== (user.phone || "");
    if (
      isEmailOrPhoneChanged &&
      settings?.requireOtpForUpdates &&
      !showUpdateOtpInput
    ) {
      setIsUpdatingProfile(true);
      try {
        const token = localStorage.getItem("token");
        await AxiosInstance.post(
          `/api/user/${user.id}/send-update-otp`,
          {},
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setShowUpdateOtpInput(true);
        setResendTimer(60); // Start timer
        toast.success(
          "An OTP has been sent to your registered email to verify this change.",
        );
      } catch (error) {
        console.error("Error sending OTP:", error);
        toast.error(error.response?.data?.error || "Failed to send OTP.");
      } finally {
        setIsUpdatingProfile(false);
      }
      return;
    }

    if (showUpdateOtpInput && !updateOtp.trim()) {
      toast.error("Please enter the OTP sent to your email.");
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const token = localStorage.getItem("token");
      const response = await AxiosInstance.put(
        `/api/user/${user.id}`,
        { name: editName, email: editEmail, phone: editPhone, otp: updateOtp },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      dispatch(login(response.data.user));
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }
      toast.success("Profile updated successfully!");
      setShowUpdateOtpInput(false);
      setUpdateOtp("");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.error || "Failed to update profile.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleResendUpdateOtp = async () => {
    setIsResending(true);
    try {
      const token = localStorage.getItem("token");
      await AxiosInstance.post(
        `/api/user/${user.id}/send-update-otp`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setResendTimer(60); // Restart timer
      toast.success("A new OTP has been sent to your registered email.");
    } catch (error) {
      console.error("Error resending OTP:", error);
      toast.error(error.response?.data?.error || "Failed to resend OTP.");
    } finally {
      setIsResending(false);
    }
  };

  // Function to determine if a booking can be cancelled (only if pending and > 2 hours before slot)
  const isCancellationAllowed = (booking) => {
    // Allow cancellation if Pending or Accepted. Do not allow if Completed or Cancelled.
    if (booking.status === "Completed" || booking.status === "Cancelled") {
      return false;
    }

    if (!booking.schedule_date || !booking.schedule_time) {
      // If schedule info is missing, assume not cancellable via this logic (or can add a different policy)
      return false;
    }

    const [timePart, modifier] = booking.schedule_time
      .split(" - ")[0]
      .split(" "); // e.g., "09:00 AM" -> ["09:00", "AM"]
    let [hours, minutes] = timePart.split(":").map(Number);

    if (modifier === "PM" && hours < 12) {
      hours += 12;
    } else if (modifier === "AM" && hours === 12) {
      hours = 0; // Midnight 12 AM
    }

    const scheduleDateTime = new Date(booking.schedule_date);
    scheduleDateTime.setHours(hours, minutes, 0, 0); // Set to the start of the scheduled slot

    const twoHoursBefore = new Date(
      scheduleDateTime.getTime() - 2 * 60 * 60 * 1000,
    ); // 2 hours in milliseconds
    const now = new Date();

    // Allow cancellation if the current time is before the 2-hour window prior to the service
    return now < twoHoursBefore;
  };

  const subtotal = cartItems.reduce(
    (a, b) => a + (b.price + (b.visit || 0)) * (b.quantity || 1),
    0,
  );

  const handleUpdateQuantity = async (action, item) => {
    if (!user) {
      toast.error("Please login to update quantities.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      let response;
      if (action === "increment") {
        response = await AxiosInstance.post(
          "/api/cart/add",
          { userId: user.id, service: item },
          { headers: { Authorization: `Bearer ${token}` } },
        );
      } else if (action === "decrement") {
        response = await AxiosInstance.put(
          "/api/cart/decrement",
          { userId: user.id, serviceId: item.id },
          { headers: { Authorization: `Bearer ${token}` } },
        );
      }
      if (response && response.data.cart) {
        const frontendCart = response.data.cart.map((dbItem) => {
          const existingItem = cartItems.find(
            (i) => i.id === dbItem.service_id,
          );
          return {
            ...existingItem,
            id: dbItem.service_id,
            name: dbItem.service_name,
            price: Number(dbItem.price),
            quantity: dbItem.quantity,
          };
        });
        dispatch(setCart(frontendCart));
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Failed to update quantity!");
    }
  };

  const handleRemoveItem = async (serviceId) => {
    if (!user) {
      dispatch(removeFromCart(serviceId));
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await AxiosInstance.delete(`/api/cart/remove/${user.id}/${serviceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      dispatch(removeFromCart(serviceId));
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Failed to remove item!");
    }
  };

  return (
    <>
      {settings?.enablePromoBanner && showPromoBanner && (
        <div style={promoBannerStyle} data-aos="fade-down">
          <span>
            ⚡ <strong>Flash Sale!</strong> Flat <strong>50% OFF</strong> on{" "}
            <strong>Deep Cleaning</strong> & <strong>AC Repair</strong>.
            <span style={timerBadgeStyle}>Ends in: {formatTime(timeLeft)}</span>
          </span>
          <button
            onClick={() => setShowPromoBanner(false)}
            style={promoCloseStyle}
            title="Dismiss"
          >
            &times;
          </button>
        </div>
      )}

      <nav className="navbar" key={location.pathname} data-aos="fade-down">
        <div className="container navbar-inner">
          {/* 1. LOGO SECTION - Inline styles removed so CSS can control it */}
          <div className="logo">
            <Link to="/" className="brand-link">
              <img src={logo} alt="logo" className="nav-logo-img" />
              <span className="nav-logo-text">ServiceNest</span>
            </Link>
          </div>

          {/* 2. NAV LINKS */}
          <div
            className={`nav-links ${isMobileMenuOpen ? "mobile-active" : ""}`}
          >
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
              Home
            </Link>
            <a href="/#services" onClick={() => setIsMobileMenuOpen(false)}>
              Services
            </a>
            <a href="/#categories" onClick={() => setIsMobileMenuOpen(false)}>
              Categories
            </a>
          </div>

          {/* 3. RIGHT SIDE (Actions + Hamburger grouped together) */}
          <div className="nav-right">
            <div className="nav-actions">
              {user ? (
                <>
                  <div
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <div
                      title={username || "Profile"}
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      onMouseEnter={() => setIsHovered(true)}
                      onMouseLeave={() => setIsHovered(false)}
                      style={{
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <FaUserCircle size={28} color="white" />
                    </div>

                    {isHovered && !dropdownOpen && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: "35px",
                          right: "50%",
                          transform: "translateX(50%)",
                          backgroundColor: "#333",
                          color: "#fff",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          whiteSpace: "nowrap",
                          zIndex: 1000,
                        }}
                      >
                        {username || "Profile"}
                      </div>
                    )}

                    {dropdownOpen && (
                      <div
                        style={{
                          position: "absolute",
                          top: "40px",
                          right: "0",
                          backgroundColor: "white",
                          borderRadius: "8px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                          display: "flex",
                          flexDirection: "column",
                          minWidth: "170px",
                          overflow: "hidden",
                          zIndex: 1000,
                          padding: "5px 0",
                        }}
                      >
                        <div
                          style={{
                            padding: "10px 20px",
                            fontWeight: "bold",
                            borderBottom: "1px solid #eee",
                          }}
                        >
                          {username}
                        </div>
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            setShowMyServicesModal(true);
                          }}
                          style={{
                            ...dropdownItemStyle,
                            border: "none",
                            background: "none",
                            textAlign: "left",
                            width: "100%",
                            cursor: "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          My Services
                        </button>
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            setShowHelpModal(true);
                          }}
                          style={{
                            ...dropdownItemStyle,
                            border: "none",
                            background: "none",
                            textAlign: "left",
                            width: "100%",
                            cursor: "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          Help & Support
                        </button>
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            setShowSettingsModal(true);
                          }}
                          style={{
                            ...dropdownItemStyle,
                            border: "none",
                            background: "none",
                            textAlign: "left",
                            width: "100%",
                            cursor: "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          Settings
                        </button>
                        <div
                          style={{
                            height: "1px",
                            backgroundColor: "#eee",
                            margin: "5px 0",
                          }}
                        ></div>
                        <button
                          onClick={handleLogout}
                          style={{
                            ...dropdownItemStyle,
                            border: "none",
                            background: "none",
                            textAlign: "left",
                            width: "100%",
                            cursor: "pointer",
                            color: "#d9534f",
                            fontFamily: "inherit",
                          }}
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <Link to="/login" className="login-btn">
                  Login
                </Link>
              )}
              <a
                className="cart-icon"
                onClick={() => setIsCartOpen(true)}
                style={{ cursor: "pointer" }}
              >
                <FaShoppingCart />
                <span className="cart-badge">{cartItems.length}</span>
              </a>
            </div>

            <button
              className="mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>

        {/* 4. UNIFIED STYLES - Handles both desktop and mobile sizings safely */}
        <style>{`
          .navbar-inner {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          
          .brand-link {
            display: flex;
            align-items: center;
            gap: 15px;
            text-decoration: none;
          }

          /* Move Desktop inline styles here */
          .nav-logo-img {
            height: 140px;
            width: 140px;
            margin: -30px 0;
            object-fit: contain;
          }

          .nav-logo-text {
            font-size: 26px;
            font-weight: 800;
            color: white;
            letter-spacing: 1px;
          }

          .nav-right, .nav-actions {
            display: flex;
            align-items: center;
            gap: 15px;
          }

          .mobile-menu-toggle {
            display: none;
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            padding: 0;
          }

          /* Mobile adjustments */
          @media (max-width: 768px) {
            .navbar-inner {
              flex-wrap: wrap !important;
            }

            /* Now the CSS can successfully shrink the logo! */
            .nav-logo-img {
              height: 60px !important;
              width: 60px !important;
              margin: 0 !important;
            }

            .nav-logo-text {
              font-size: 20px !important;
            }

            .brand-link {
              gap: 10px !important;
            }

            .mobile-menu-toggle {
              display: block !important;
              margin-left: 10px;
            }

            .nav-links {
              display: none !important;
              width: 100%;
              flex-direction: column;
              background: rgba(11, 60, 112, 0.95);
              padding: 15px;
              border-radius: 8px;
              margin-top: 15px;
              order: 3;
              gap: 15px;
              text-align: center;
            }

            .nav-links.mobile-active {
              display: flex !important;
            }
            
            .nav-right, .nav-actions {
              gap: 10px !important;
            }
          }

          @media (max-width: 400px) {
            .nav-logo-img {
              height: 50px !important;
              width: 50px !important;
            }
            .nav-logo-text {
              font-size: 16px !important;
            }
            .nav-right, .nav-actions {
              gap: 8px !important;
            }
          }
        `}</style>
      </nav>

      {showHelpModal && (
        <div style={modalOverlayStyle} onClick={() => setShowHelpModal(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowHelpModal(false)}
              style={modalCloseButtonStyle}
              onMouseEnter={(e) => (e.target.style.color = "#333")}
              onMouseLeave={(e) => (e.target.style.color = "#888")}
            >
              &times;
            </button>
            <h2
              style={{
                marginBottom: "15px",
                color: "#333",
                borderBottom: "1px solid #eee",
                paddingBottom: "10px",
              }}
            >
              Help & Support
            </h2>
            <p
              style={{ marginBottom: "10px", color: "#555", fontSize: "16px" }}
            >
              Welcome to the ServiceNest Help & Support center.
            </p>
            <p
              style={{ marginBottom: "10px", color: "#555", fontSize: "16px" }}
            >
              If you have any questions or issues, please reach out to us at:
            </p>
            <ul
              style={{
                margin: "15px 0 20px 20px",
                color: "#555",
                lineHeight: "1.8",
                fontSize: "16px",
              }}
            >
              <li>
                <strong>Email:</strong>{" "}
                {settings?.supportEmail || "servicenest358@gmail.com"}
              </li>
              <li>
                <strong>Phone:</strong>{" "}
                {settings?.supportPhone || "+91 93929 57585"}
              </li>
            </ul>
            <p style={{ color: "#555", fontSize: "15px", fontStyle: "italic" }}>
              Our support team is available 24/7 to assist you.
            </p>
          </div>
        </div>
      )}

      {showSettingsModal && (
        <div
          style={modalOverlayStyle}
          onClick={() => {
            setShowSettingsModal(false);
            setShowUpdateOtpInput(false);
            setUpdateOtp("");
          }}
        >
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => {
                setShowSettingsModal(false);
                setShowUpdateOtpInput(false);
                setUpdateOtp("");
              }}
              style={modalCloseButtonStyle}
              onMouseEnter={(e) => (e.target.style.color = "#333")}
              onMouseLeave={(e) => (e.target.style.color = "#888")}
            >
              &times;
            </button>
            <h2
              style={{
                marginBottom: "15px",
                color: "#333",
                borderBottom: "1px solid #eee",
                paddingBottom: "10px",
              }}
            >
              Settings
            </h2>
            <p
              style={{ marginBottom: "20px", color: "#555", fontSize: "16px" }}
            >
              Manage your preferences and account settings.
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "15px",
                color: "#555",
              }}
            >
              <p style={{ margin: "0", fontSize: "14px", color: "#888" }}>
                Profile Details
              </p>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Full Name"
                style={inputStyle}
              />
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="Email Address"
                style={inputStyle}
              />
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="Phone Number"
                style={inputStyle}
              />
              {showUpdateOtpInput && (
                <>
                  <input
                    type="text"
                    value={updateOtp}
                    onChange={(e) => setUpdateOtp(e.target.value)}
                    placeholder="Enter OTP sent to your email"
                    style={inputStyle}
                  />
                  <div
                    style={{
                      textAlign: "right",
                      fontSize: "12px",
                      marginTop: "5px",
                      marginBottom: "10px",
                    }}
                  >
                    <button
                      onClick={handleResendUpdateOtp}
                      disabled={resendTimer > 0 || isResending}
                      style={{
                        background: "none",
                        border: "none",
                        color:
                          resendTimer > 0 || isResending
                            ? "#6c757d"
                            : "#007bff",
                        cursor: "pointer",
                        padding: 0,
                        fontSize: "12px",
                        textDecoration: "underline",
                      }}
                    >
                      {isResending
                        ? "Sending..."
                        : resendTimer > 0
                          ? `Resend in ${resendTimer}s`
                          : "Resend OTP"}
                    </button>
                  </div>
                </>
              )}
              <button
                onClick={handleUpdateProfile}
                disabled={isUpdatingProfile}
                style={{ ...actionButtonStyle, backgroundColor: "#28a745" }}
              >
                {isUpdatingProfile
                  ? "Processing..."
                  : showUpdateOtpInput
                    ? "Verify & Save Changes"
                    : "Save Changes"}
              </button>
              <hr
                style={{
                  border: "0",
                  borderTop: "1px solid #eee",
                  margin: "10px 0",
                }}
              />
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                }}
              >
                <input type="checkbox" defaultChecked /> Receive email
                notifications
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                }}
              >
                <input type="checkbox" defaultChecked /> Receive SMS
                notifications
              </label>
              <hr
                style={{
                  border: "0",
                  borderTop: "1px solid #eee",
                  margin: "10px 0",
                }}
              />
              <p style={{ margin: "0", fontSize: "14px", color: "#888" }}>
                Account Management
              </p>
              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  setShowUpdateOtpInput(false);
                  setUpdateOtp("");
                  navigate("/forgot-password");
                }}
                style={{
                  ...actionButtonStyle,
                  backgroundColor: "#007bff",
                }}
              >
                Reset Password
              </button>
              <button
                onClick={handleDeleteAccount}
                style={{
                  ...actionButtonStyle,
                  backgroundColor: "#dc3545",
                }}
              >
                Delete Account
              </button>
              {/* Add more setting options here later as needed */}
            </div>
          </div>
        </div>
      )}

      {showMyServicesModal && (
        <div
          style={modalOverlayStyle}
          onClick={() => setShowMyServicesModal(false)}
        >
          <div
            style={{ ...modalContentStyle, maxWidth: "600px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowMyServicesModal(false)}
              style={modalCloseButtonStyle}
              onMouseEnter={(e) => (e.target.style.color = "#333")}
              onMouseLeave={(e) => (e.target.style.color = "#888")}
            >
              &times;
            </button>
            <h2
              style={{
                marginBottom: "15px",
                color: "#333",
                borderBottom: "1px solid #eee",
                paddingBottom: "10px",
              }}
            >
              My Services
            </h2>
            {isLoadingServices ? (
              <p style={{ color: "#555", fontSize: "16px" }}>
                Loading your services...
              </p>
            ) : bookedServices.length > 0 ? (
              <ul
                style={{
                  listStyleType: "none",
                  padding: 0,
                  margin: 0,
                  maxHeight: "400px",
                  overflowY: "auto",
                }}
              >
                {bookedServices.map((item, index) => (
                  <li
                    key={index}
                    style={{
                      padding: "15px 10px",
                      borderBottom: "1px solid #eaeaea",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      color: "#333",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "5px",
                      }}
                    >
                      <span style={{ fontSize: "18px", fontWeight: "600" }}>
                        {item.name || item.service_name || "Unknown Service"}
                      </span>
                      {item.booking_date && (
                        <span style={{ fontSize: "14px", color: "#777" }}>
                          Booked on:{" "}
                          {new Date(item.booking_date).toLocaleDateString(
                            undefined,
                            { year: "numeric", month: "short", day: "numeric" },
                          )}
                        </span>
                      )}
                      {item.status === "Accepted" ? (
                        <span
                          style={{
                            fontSize: "14px",
                            color: "#28a745",
                            fontWeight: "500",
                            marginTop: "4px",
                          }}
                        >
                          ✅ Provider Assigned - Arriving on{" "}
                          {item.schedule_date
                            ? new Date(item.schedule_date).toLocaleDateString(
                                undefined,
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                },
                              )
                            : "the scheduled date"}{" "}
                          between {item.schedule_time || "the scheduled time"}
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: "14px",
                            color: "#d39e00",
                            fontWeight: "500",
                            marginTop: "4px",
                          }}
                        >
                          ⏳ Service Pending
                        </span>
                      )}
                      {(item.status === "Pending" ||
                        item.status === "Accepted" ||
                        !item.status) && (
                        <button
                          onClick={() => handleCancelBooking(item.id)}
                          disabled={!isCancellationAllowed(item)}
                          style={{
                            marginTop: "8px",
                            padding: "6px 12px",
                            backgroundColor: isCancellationAllowed(item)
                              ? "#dc3545"
                              : "#cccccc",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            cursor: isCancellationAllowed(item)
                              ? "pointer"
                              : "not-allowed",
                            fontSize: "12px",
                            fontWeight: "bold",
                            alignSelf: "flex-start",
                          }}
                          title={
                            isCancellationAllowed(item)
                              ? "Cancel this booking"
                              : "Cancellations are only allowed up to 2 hours before the scheduled time"
                          }
                        >
                          Cancel Booking
                        </button>
                      )}
                    </div>
                    <strong style={{ fontSize: "18px", color: "#2e7d32" }}>
                      ₹{item.price}
                    </strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: "#555", fontSize: "16px" }}>
                You have not booked any services yet.
              </p>
            )}
          </div>
        </div>
      )}

      {bookingToCancel && (
        <div style={modalOverlayStyle} onClick={() => setBookingToCancel(null)}>
          <div
            style={{
              ...modalContentStyle,
              maxWidth: "400px",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, marginBottom: "15px", color: "#333" }}>
              Confirm Cancellation
            </h3>
            <p style={{ margin: "0 0 25px", fontSize: "16px", color: "#555" }}>
              Are you sure you want to cancel this booking?
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "15px",
                width: "100%",
              }}
            >
              <button
                onClick={confirmCancelBooking}
                style={{
                  ...actionButtonStyle,
                  flex: 1,
                  backgroundColor: "#dc3545",
                  padding: "10px",
                }}
              >
                Yes
              </button>
              <button
                onClick={() => setBookingToCancel(null)}
                style={{
                  ...actionButtonStyle,
                  flex: 2,
                  backgroundColor: "#6c757d",
                  padding: "10px",
                }}
              >
                No, Keep it
              </button>
            </div>
          </div>
        </div>
      )}

      {isCartOpen && (
        <>
          <div
            className="cart-drawer-overlay"
            onClick={() => setIsCartOpen(false)}
          ></div>
          <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="cart-drawer-header">
              <h2>Your Cart ({cartItems.length})</h2>
              <button
                className="cart-drawer-close"
                onClick={() => setIsCartOpen(false)}
              >
                &times;
              </button>
            </div>
            <div className="cart-drawer-body">
              {cartItems.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    color: "#777",
                    marginTop: "40px",
                  }}
                >
                  <FaShoppingCart
                    size={40}
                    style={{ opacity: 0.3, marginBottom: "15px" }}
                  />
                  <p style={{ margin: 0, fontSize: "16px" }}>
                    Your cart is empty!
                  </p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "20px",
                      borderBottom: "1px solid #eee",
                      paddingBottom: "15px",
                    }}
                  >
                    <div>
                      <h4
                        style={{
                          margin: "0 0 5px 0",
                          color: "#333",
                          fontSize: "16px",
                        }}
                      >
                        {item.name}
                      </h4>
                      <p
                        style={{
                          margin: "0 0 10px 0",
                          color: "#ff7a00",
                          fontWeight: "bold",
                        }}
                      >
                        ₹
                        {(item.price + (item.visit || 0)) *
                          (item.quantity || 1)}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          backgroundColor: "#fff",
                          border: "1px solid #e0e0e0",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          width: "fit-content",
                        }}
                      >
                        <button
                          onClick={() =>
                            handleUpdateQuantity("decrement", item)
                          }
                          style={{
                            width: "24px",
                            height: "24px",
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "#ff9800",
                            border: "none",
                            color: "white",
                            fontWeight: "bold",
                            cursor: "pointer",
                            borderRadius: "4px",
                          }}
                        >
                          -
                        </button>
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: "700",
                            minWidth: "16px",
                            textAlign: "center",
                            color: "#333",
                          }}
                        >
                          {item.quantity || 1}
                        </span>
                        <button
                          onClick={() =>
                            handleUpdateQuantity("increment", item)
                          }
                          style={{
                            width: "24px",
                            height: "24px",
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "#ff9800",
                            border: "none",
                            color: "white",
                            fontWeight: "bold",
                            cursor: "pointer",
                            borderRadius: "4px",
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ff4d4d",
                        cursor: "pointer",
                        alignSelf: "flex-start",
                        fontSize: "14px",
                        fontWeight: "500",
                        padding: "5px",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
            {cartItems.length > 0 && (
              <div className="cart-drawer-footer">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "15px",
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#333",
                  }}
                >
                  <span>Subtotal:</span>
                  <span>₹{subtotal}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <button
                    className="login-btn"
                    style={{
                      width: "100%",
                      padding: "12px",
                      fontSize: "16px",
                      textAlign: "center",
                      backgroundColor: "#f5f7fb",
                      color: "#1e6bb8",
                      border: "1px solid #1e6bb8",
                      boxShadow: "none",
                    }}
                    onClick={() => {
                      setIsCartOpen(false);
                      navigate("/cart");
                    }}
                  >
                    View Full Cart
                  </button>
                  <button
                    className="login-btn"
                    style={{
                      width: "100%",
                      padding: "12px",
                      fontSize: "16px",
                      textAlign: "center",
                      backgroundColor: "#28a745",
                      boxShadow: "0 4px 15px rgba(40,167,69,0.3)",
                    }}
                    onClick={() => {
                      setIsCartOpen(false);
                      navigate("/schedule");
                    }}
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

const dropdownItemStyle = {
  padding: "10px 20px",
  textDecoration: "none",
  color: "#333",
  fontSize: "15px",
  display: "block",
};

const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 2000,
};

const modalContentStyle = {
  backgroundColor: "#fff",
  padding: "30px",
  borderRadius: "8px",
  width: "90%",
  maxWidth: "500px",
  position: "relative",
  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
  textAlign: "left",
};

const modalCloseButtonStyle = {
  position: "absolute",
  top: "10px",
  right: "15px",
  background: "none",
  border: "none",
  fontSize: "24px",
  fontWeight: "bold",
  cursor: "pointer",
  color: "#888",
  transition: "color 0.2s ease",
};

const actionButtonStyle = {
  width: "100%",
  padding: "10px",
  border: "none",
  borderRadius: "5px",
  color: "white",
  fontSize: "15px",
  fontWeight: "bold",
  cursor: "pointer",
  transition: "background-color 0.2s ease",
};

const promoBannerStyle = {
  backgroundColor: "#ff9800",
  backgroundImage: "linear-gradient(90deg, #ff8a00, #e52e71)",
  color: "white",
  textAlign: "center",
  padding: "10px 40px",
  fontSize: "15px",
  fontWeight: "500",
  position: "relative",
  zIndex: 2001,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  letterSpacing: "0.5px",
};

const promoCloseStyle = {
  position: "absolute",
  right: "15px",
  background: "none",
  border: "none",
  color: "white",
  fontSize: "22px",
  cursor: "pointer",
};

const timerBadgeStyle = {
  marginLeft: "15px",
  backgroundColor: "white",
  color: "#e52e71",
  padding: "4px 12px",
  borderRadius: "20px",
  fontWeight: "bold",
  boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
};

const inputStyle = {
  padding: "10px",
  borderRadius: "5px",
  border: "1px solid #ccc",
  fontSize: "14px",
  width: "100%",
  boxSizing: "border-box",
};
