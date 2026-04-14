import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { removeFromCart, setCart } from "../redux/cartSlice";
import { useNavigate } from "react-router-dom";
import AxiosInstance from "../Utils/AxiosInstance";
import CheckoutStepper from "../components/CheckoutStepper";
import toast from "react-hot-toast";

/**
 * Cart component
 * Displays the items in the cart, their total price and a checkout button
 * @returns {JSX.Element} Cart component
 */
export default function Cart() {
  const cart = useSelector((state) => state.cart.items);
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [couponMessage, setCouponMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const response = await AxiosInstance.get("/api/coupons");
        setAvailableCoupons(response.data);
      } catch (error) {
        console.error("Failed to fetch coupons:", error);
      }
    };
    fetchCoupons();
  }, []);

  // calculate total cost and quantity of the cart
  const subtotal = cart.reduce(
    (a, b) => a + (b.price + b.visit) * (b.quantity || 1),
    0,
  );
  const totalItems = cart.reduce((a, b) => a + (b.quantity || 1), 0);
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const finalTotal = subtotal + 9 - discountAmount;

  const handleApplyCoupon = async (codeToApply) => {
    const code = (typeof codeToApply === "string" ? codeToApply : couponCode)
      .trim()
      .toUpperCase();

    if (!code) return;

    try {
      const response = await AxiosInstance.post("/api/coupons/validate", {
        code,
      });
      const { discount_percent } = response.data;
      setCouponCode(code);
      setDiscountPercent(discount_percent);
      setCouponMessage({
        type: "success",
        text: `Hurray! Coupon applied! You got ${discount_percent}% off.`,
      });
    } catch (error) {
      setDiscountPercent(0);
      setCouponMessage({
        type: "error",
        text: error.response?.data?.error || "Invalid coupon code.",
      });
    }
  };

  const handleUpdateQuantity = async (action, item) => {
    if (!user) return;
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
          const existingItem = cart.find((i) => i.id === dbItem.service_id);
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
      await AxiosInstance.delete(
        `/api/cart/remove/${user.id}/${serviceId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      dispatch(removeFromCart(serviceId));
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Failed to remove item!");
    }
  };

  return (
    <div className="container cart-page">
      <CheckoutStepper currentStep={1} />
      <h2 className="cart-header" data-aos="fade-down">
        Your Cart
      </h2>
      {cart.length === 0 ? (
        <div className="empty-cart" data-aos="zoom-in">
          <h3>Your cart is empty!</h3>
          <p>Looks like you haven't added any services yet.</p>
          <button className="login-btn" onClick={() => navigate("/")}>
            Browse Services
          </button>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {cart.map((item) => (
              <div
                className="cart-item-card"
                key={item.id}
                data-aos="fade-right"
              >
                <div className="cart-item-info">
                  <h3>{item.name}</h3>
                  <p>Service</p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginTop: "10px",
                      backgroundColor: "#fff",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      border: "1px solid #e0e0e0",
                      width: "fit-content",
                    }}
                  >
                    <button
                      onClick={() => handleUpdateQuantity("decrement", item)}
                      style={{
                        width: "28px",
                        height: "28px",
                        padding: "0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        fontSize: "16px",
                        cursor: "pointer",
                        background: "#ff9800",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        transition: "all 0.2s",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = "#f57c00";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = "#ff9800";
                      }}
                    >
                      -
                    </button>
                    <span
                      style={{
                        fontSize: "16px",
                        fontWeight: "700",
                        minWidth: "20px",
                        textAlign: "center",
                        color: "#333",
                      }}
                    >
                      {item.quantity || 1}
                    </span>
                    <button
                      onClick={() => handleUpdateQuantity("increment", item)}
                      style={{
                        width: "28px",
                        height: "28px",
                        padding: "0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        fontSize: "16px",
                        cursor: "pointer",
                        background: "#ff9800",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        transition: "all 0.2s",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = "#f57c00";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = "#ff9800";
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="cart-item-price">
                  ₹{(item.price + item.visit) * (item.quantity || 1)}
                </div>
                <button
                  className="remove-btn"
                  onClick={() => handleRemoveItem(item.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary" data-aos="fade-left">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>Items ({totalItems})</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="summary-row">
              <span>Convenience Fee</span>
              <span>₹9</span>
            </div>
            {discountAmount > 0 && (
              <div
                className="summary-row"
                style={{ color: "#2e7d32", fontWeight: "500" }}
              >
                <span>Discount ({discountPercent}%)</span>
                <span>-₹{discountAmount}</span>
              </div>
            )}
            <div className="summary-total">
              <span>Total</span>
              <span>₹{finalTotal}</span>
            </div>

            <div
              style={{
                margin: "20px 0",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="text"
                  placeholder="Enter Coupon Code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "5px",
                    border: "1px solid #ccc",
                    textTransform: "uppercase",
                  }}
                />
                <button
                  className="login-btn"
                  style={{ width: "auto", padding: "10px 20px" }}
                  onClick={() => handleApplyCoupon()}
                >
                  Apply
                </button>
              </div>
              {couponMessage.text && (
                <span
                  style={{
                    fontSize: "14px",
                    display: "block",
                    marginTop: "10px",
                    color:
                      couponMessage.type === "success" ? "#2e7d32" : "#d32f2f",
                    fontWeight: "500",
                  }}
                >
                  {couponMessage.text}
                </span>
              )}
            </div>

            <div className="available-coupons">
              <h4>Available Coupons & Offers</h4>
              {availableCoupons.map((coupon) => (
                <div className="coupon-card" key={coupon.code}>
                  <div className="coupon-details">
                    <span className="coupon-code-badge">{coupon.code}</span>
                    <p>{coupon.description}</p>
                  </div>
                  <button onClick={() => handleApplyCoupon(coupon.code)}>
                    Apply
                  </button>
                </div>
              ))}
            </div>

            <button
              className="login-btn checkout-btn mobile-hide"
              onClick={() => navigate("/schedule")}
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}

      {cart.length > 0 && (
        <div className="mobile-floating-footer desktop-hide">
          <div className="price-info">
            <span>Total Amount</span>
            <strong>₹{finalTotal}</strong>
          </div>
          <button className="login-btn" onClick={() => navigate("/schedule")}>
            Checkout
          </button>
        </div>
      )}
      <style>{`
        .available-coupons {
          margin-top: 20px;
          border-top: 1px solid #eee;
          padding-top: 20px;
          margin-bottom: 20px;
        }
        .available-coupons h4 {
          margin: 0 0 15px 0;
          font-size: 16px;
          color: #333;
        }
        .coupon-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: #fdf8e6;
          border: 1px dashed #fbc02d;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 10px;
          transition: box-shadow 0.2s ease;
        }
        .coupon-card:hover {
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }
        .coupon-details {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .coupon-code-badge {
          background-color: #fff8e1;
          color: #f57f17;
          padding: 5px 10px;
          border-radius: 5px;
          font-weight: bold;
          font-family: monospace;
          font-size: 14px;
          border: 1px solid #fbc02d;
          text-transform: uppercase;
        }
        .coupon-details p {
          margin: 0;
          font-size: 14px;
          color: #555;
        }
        .coupon-card button {
          background: none;
          border: none;
          color: #007bff;
          font-weight: bold;
          cursor: pointer;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}
