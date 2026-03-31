import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import { useNavigate } from "react-router-dom";
import axios from "axios";

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
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const timeoutRef = useRef(null);

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

  const handleAddToCart = async (service, index) => {
    if (!user) {
      setIsError(true);
      setMessage("Please login to add services to cart!");
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setMessage("");
        navigate("/login");
      }, 1500);
      return;
    }

    // numbered service id to store service id in db
    const serviceId = service.id || 1000 + index;
    const isAlreadyInCart = cartItems.some((item) => item.id === serviceId);

    if (isAlreadyInCart) {
      setIsError(true);
      setMessage("Service Already added to the cart!");
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setMessage(""), 1500);
    } else {
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
        // 1. Save to the database
        const token = localStorage.getItem("token");
        await axios.post(
          "http://localhost:3000/api/cart/add",
          {
            userId: user.id,
            service: serviceObj,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        // 2. Update Redux state
        dispatch(addToCart(serviceObj));
        setIsError(false);
        setMessage("Service Successfully added to cart!");
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setMessage(""), 1500);
      } catch (error) {
        console.error(
          "Error adding to database cart:",
          error.response?.data || error,
        );
        setIsError(true);
        setMessage(
          error.response?.data?.error || "Failed to save to database!",
        );
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setMessage(""), 1500);
      }
    }
  };

  return (
    <section id="services" className="services">
      <div className="container">
        <h2 className="section-title" data-aos="fade-up">
          Popular Services
        </h2>
        <div className="service-grid">
          {services.map((service, index) => (
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
                <p className="price">₹ 
                  {typeof service.price === "number"
                    ? `₹${service.price}`
                    : service.price}
                </p>
                <button onClick={() => handleAddToCart(service, index)}>
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
        {message && (
          <div
            style={{
              position: "fixed",
              bottom: "30px",
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: isError ? "#dc3545" : "#28a745",
              color: "white",
              padding: "10px 20px",
              borderRadius: "5px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              zIndex: 1000,
            }}
          >
            {message}
          </div>
        )}
      </div>
    </section>
  );
}
