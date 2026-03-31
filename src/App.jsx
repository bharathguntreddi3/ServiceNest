import { BrowserRouter, Routes, Route, useLocation, Outlet } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./components/Navbar";

import HomeSearch from "./pages/HomeSearch";
import CategoryPage from "./pages/CategoryPage";
import Cart from "./pages/Cart";
import Schedule from "./pages/Schedule";
import Payment from "./pages/Payment";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Landing from "./pages/Landing";
import AdminLogin from "./pages/AdminLogin";
import ForgotPassword from "./pages/ForgotPassword"
import NotFound from "./pages/NotFound"; // Assuming you have a 404 page component

import AdminDashboard from "./admin/AdminDashboard";


// Utility component to handle scrolling to top and refreshing AOS animations on route change
function ScrollAndAOS() {
  const location = useLocation();

  useEffect(() => {
    // Scroll to the top of the page on route change
    window.scrollTo(0, 0);
    // Initialize and refresh Animate On Scroll (AOS) for dynamically injected elements
    if (window.AOS) {
      window.AOS.refresh();
    }
  }, [location.pathname]);
  return null;
}

// Layout component to include the Navbar on specific routes
function MainLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

function App() {
  // Initialize AOS once when the app component mounts
  useEffect(() => {
    if (window.AOS) {
      window.AOS.init({ duration: 800, once: true, offset: 100 });
    }
  }, []);

  return (
    <BrowserRouter>
      <ScrollAndAOS />
      <Routes>
        {/* Routes wrapped in MainLayout will display the Navbar */}
        <Route element={<MainLayout />}>
          {/* Public and marketing pages */}
          <Route path="/" element={<Landing />} />

          {/* Core application pages */}
          <Route path="/search" element={<HomeSearch />} />
          <Route path="/category/:id" element={<CategoryPage />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/register" element={<Register />} />
        </Route>
        {/* Admin Dashboard route left outside of MainLayout so it won't display the Navbar */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
        {/* Route left outside of MainLayout will NOT display the Navbar */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
