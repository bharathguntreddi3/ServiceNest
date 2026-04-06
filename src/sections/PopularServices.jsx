import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setCart } from "../redux/cartSlice";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

// In-case if the fetching from database fails then these data will be displayed on front
// like a safe failure switch
const fallbackServices = [
  {
    name: "Full Home Cleaning",
    price: "₹1499",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952",
  },
  {
    name: "Kitchen Deep Cleaning",
    price: "₹899",
    image:
      "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
  },
  {
    name: "Men Haircut",
    price: "₹299",
    image:
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
  },
  {
    name: "Women Spa",
    price: "₹999",
    image:
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
  },
  {
    name: "AC Repair",
    price: "₹499",
    image:
      "https://media.istockphoto.com/id/2206342744/photo/technician-repairing-air-conditioner-at-home.jpg?s=1024x1024&w=is&k=20&c=oPvjz7vd_3OTSZ2BV-Mf6kJR3rnP4X9VM71lJRoG9QY=",
  },
  {
    name: "Bike Oil Change",
    price: "₹399",
    image:
      "https://media.istockphoto.com/id/833171812/photo/we-look-forward-to-serving-you.jpg?s=1024x1024&w=is&k=20&c=1VOCBkDc0RSqQSGKz0Jf80_F1vse_gTM8SyLw6HK2VE=",
  },
];

export default function PopularServices() {
  const [services, setServices] = useState(fallbackServices);
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPopularServices = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/api/popular-services",
        );
        if (Array.isArray(response.data) && response.data.length > 0) {
          setServices(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch popular services", error);
      }
    };
    fetchPopularServices();
  }, []);

  const handleUpdateQuantity = async (action, service, index) => {
    if (!user) {
      toast.error("Please login to add services to cart!");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
      return;
    }

    const serviceId = service.id || 1000 + index;
    const cartItem = cartItems.find((item) => item.id === serviceId);
    const quantity = cartItem ? cartItem.quantity || 1 : 0;

    const serviceObj = {
      id: serviceId,
      name: service.name,
      price:
        typeof service.price === "string"
          ? parseInt(service.price.replace("₹", ""))
          : service.price || 0,
      visit: 0,
    };

    try {
      const token = localStorage.getItem("token");
      let response;
      if (action === "increment") {
        response = await axios.post(
          "http://localhost:3000/api/cart/add",
          { userId: user.id, service: serviceObj },
          { headers: { Authorization: `Bearer ${token}` } },
        );
      } else if (action === "decrement") {
        response = await axios.put(
          "http://localhost:3000/api/cart/decrement",
          { userId: user.id, serviceId: serviceId },
          { headers: { Authorization: `Bearer ${token}` } },
        );
      }

      if (response && response.data.cart) {
        const frontendCart = response.data.cart.map((dbItem) => {
          const existingItem = cartItems.find(
            (i) => i.id === dbItem.service_id,
          );
          return {
            id: dbItem.service_id,
            name: dbItem.service_name,
            price: Number(dbItem.price),
            visit: existingItem ? existingItem.visit : 0,
            quantity: dbItem.quantity,
          };
        });
        dispatch(setCart(frontendCart));

        if (action === "increment" && quantity === 0) {
          toast.success("Service Successfully added to cart!");
        }
      }
    } catch (error) {
      console.error(
        "Error adding to database cart:",
        error.response?.data || error,
      );
      toast.error(error.response?.data?.error || "Failed to save to database!");
    }
  };

  return (
    <section id="services" className="services">
      <div className="container">
        <h2 className="section-title" data-aos="fade-up">
          Popular Services
        </h2>
        <div className="service-grid">
          {services.map((service, index) => {
            const serviceId = service.id || 1000 + index;
            const cartItem = cartItems.find((item) => item.id === serviceId);
            const quantity = cartItem ? cartItem.quantity || 1 : 0;

            return (
              <div
                className="service-card"
                key={index}
                data-aos="fade-up"
                data-aos-delay={index * 100}
              >
                <div className="service-image">
                  <img
                    src={service.image_url || service.image}
                    alt={service.name}
                  />
                </div>
                <div className="service-info">
                  <h3>{service.name}</h3>
                  <p className="price">
                    ₹
                    {typeof service.price === "number"
                      ? `₹${service.price}`
                      : service.price}
                  </p>
                  {quantity > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                        marginTop: "10px",
                      }}
                    >
                      <button
                        onClick={() =>
                          handleUpdateQuantity("decrement", service, index)
                        }
                        style={{
                          width: "32px",
                          height: "32px",
                          padding: "0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "bold",
                          fontSize: "18px",
                          background: "#ff9800",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
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
                        {quantity}
                      </span>
                      <button
                        onClick={() =>
                          handleUpdateQuantity("increment", service, index)
                        }
                        style={{
                          width: "32px",
                          height: "32px",
                          padding: "0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "bold",
                          fontSize: "18px",
                          background: "#ff9800",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                        }}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() =>
                        handleUpdateQuantity("increment", service, index)
                      }
                      style={{ marginTop: "10px" }}
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
