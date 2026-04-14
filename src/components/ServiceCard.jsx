// import { useState, useRef } from "react";
// import { createPortal } from "react-dom";
// import { useDispatch, useSelector } from "react-redux";
// import { addToCart } from "../redux/cartSlice";
// import { useNavigate } from "react-router-dom";
// import toast from "react-hot-toast";
// import AxiosInstance from "../Utils/AxiosInstance";

// // service card displays when a user clicks on a specific category

// /**
//  * ServiceCard component.
//  * Displays the service details and a button to add the service to the cart.
//  * @param {object} service - The service object containing the name, price and visiting charges.
//  * @example
//  * <ServiceCard service={{name:"Item 1",price:10,visit:5}} />
//  * @returns {JSX.Element} ServiceCard component.
//  *
//  * /*******  6afa4933-9cad-41ea-ad13-f8ea8d89aa27  ******/
// export default function ServiceCard({ service }) {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const cartItems = useSelector((state) => state.cart.items);
//   const user = useSelector((state) => state.auth.user);
//   const [isError, setIsError] = useState(false);
//   const [message, setMessage] = useState("");
//   const timeoutRef = useRef(null);

//   const handleAddToCart = async () => {
//     if (!user) {
//       setIsError(true);
//       setMessage("Please login to add services to cart!");
//       if (timeoutRef.current) clearTimeout(timeoutRef.current);
//       timeoutRef.current = setTimeout(() => {
//         setMessage("");
//         navigate("/login");
//       }, 1500);
//       return;
//     }

//     const isAlreadyInCart = cartItems.some((item) => item.id === service.id);

//     if (isAlreadyInCart) {
//       setIsError(true);
//       setMessage("Service Already added to the cart!");
//       if (timeoutRef.current) clearTimeout(timeoutRef.current);
//       timeoutRef.current = setTimeout(() => setMessage(""), 2000);
//     } else {
//       try {
//         const token = localStorage.getItem("token");
//         await AxiosInstance.post(
//           "/api/cart/add",
//           {
//             userId: user.id,
//             service: service, // The service object from props is already in the correct format
//           },
//           {
//             headers: { Authorization: `Bearer ${token}` },
//           },
//         );

//         dispatch(addToCart(service));
//         setIsError(false);
//         setMessage("Service Successfully added to cart!");
//         if (timeoutRef.current) clearTimeout(timeoutRef.current);
//         timeoutRef.current = setTimeout(() => setMessage(""), 2000);
//       } catch (error) {
//         console.error(
//           "Error adding to database cart:",
//           error.response?.data || error,
//         );
//         setIsError(true);
//         setMessage(
//           error.response?.data?.error || "Failed to save to database!",
//         );
//         if (timeoutRef.current) clearTimeout(timeoutRef.current);
//         timeoutRef.current = setTimeout(() => setMessage(""), 2000);
//       }
//     }
//   };

//   return (
//     <div className="card">
//       <h3>{service.name}</h3>
//       <p>Price: ₹{service.price}</p>
//       <p>Visiting Charges: ₹{service.visit}</p>
//       <button onClick={handleAddToCart}>Add to Cart</button>

//       {message &&
//         createPortal(
//           <div
//             style={{
//               position: "fixed",
//               bottom: "30px",
//               left: "50%",
//               transform: "translateX(-50%)",
//               backgroundColor: isError ? "#dc3545" : "#28a745",
//               color: "white",
//               padding: "10px 20px",
//               borderRadius: "5px",
//               boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
//               zIndex: 1000,
//             }}
//           >
//             {message}
//           </div>,
//           document.body,
//         )}
//     </div>
//   );
// }

import { useDispatch, useSelector } from "react-redux";
import { setCart } from "../redux/cartSlice";
import { useNavigate, useLocation } from "react-router-dom";
import AxiosInstance from "../Utils/AxiosInstance";
import toast from "react-hot-toast";

export default function ServiceCard({ service }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const cartItems = useSelector((state) => state.cart.items);
  const user = useSelector((state) => state.auth.user);

  const cartItem = cartItems.find((item) => item.id === service.id);
  const quantity = cartItem ? cartItem.quantity || 1 : 0;

  const handleUpdateQuantity = async (action) => {
    if (!user) {
      toast.error("Please login to add services to cart!");
      setTimeout(() => {
        navigate("/login", {
          state: {
            returnTo: location.pathname + location.search,
            action: "addToCart",
            service: service,
          },
        });
      }, 1500);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      let response;

      if (action === "increment") {
        response = await AxiosInstance.post(
          "/api/cart/add",
          { userId: user.id, service: service },
          { headers: { Authorization: `Bearer ${token}` } },
        );
      } else if (action === "decrement") {
        response = await AxiosInstance.put(
          "/api/cart/decrement",
          { userId: user.id, serviceId: service.id },
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
            // Preserve the visit price local state if available
            visit: existingItem
              ? existingItem.visit
              : service.id === dbItem.service_id
                ? service.visit
                : 0,
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <div className="card">
      <h3>{service.name}</h3>
      <p>Price: {formatCurrency(service.price)}</p>
      <p>Visiting Charges: {formatCurrency(service.visit)}</p>
      {quantity > 0 ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "15px",
            marginTop: "10px",
          }}
        >
          <button
            onClick={() => handleUpdateQuantity("decrement")}
            style={{
              width: "40px",
              padding: "5px",
              fontWeight: "bold",
              fontSize: "18px",
            }}
          >
            -
          </button>
          <span style={{ fontSize: "18px", fontWeight: "600" }}>
            {quantity}
          </span>
          <button
            onClick={() => handleUpdateQuantity("increment")}
            style={{
              width: "40px",
              padding: "5px",
              fontWeight: "bold",
              fontSize: "18px",
            }}
          >
            +
          </button>
        </div>
      ) : (
        <button
          onClick={() => handleUpdateQuantity("increment")}
          style={{ marginTop: "10px" }}
        >
          Add to Cart
        </button>
      )}

      {/*  Deleted the above entire {message && createPortal(...)} block! */}
    </div>
  );
}
