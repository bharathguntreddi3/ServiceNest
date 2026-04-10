import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Outlet,
} from "react-router-dom";

import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { lazy } from "react";
import {Suspense} from "react";

// Initial user loading components - loaded immediately when application is opened
import Landing from "./pages/Landing";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

//  These components to be loaded when their specific routes are accessed
const HomeSearch = lazy(()=> import("./pages/HomeSearch"));
const CategoryPage = lazy(()=>import("./pages/CategoryPage"));
const Cart = lazy(()=>import("./pages/Cart"));
const Schedule = lazy(()=>import("./pages/Schedule"));
const Payment = lazy(()=>import("./pages/Payment"));
const Login = lazy(()=>import("./pages/Login"));
const Register = lazy(()=>import("./pages/Register"));
const ForgotPassword = lazy(()=>import("./pages/ForgotPassword"));
const NotFound = lazy(()=>import("./pages/NotFound"));

const AdminLogin = lazy(()=>import("./pages/AdminLogin"));
const AdminDashboard = lazy(()=>import("./admin/AdminDashboard"));

const ProviderDashboard = lazy(()=>import("./provider/ProviderDashboard"));


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

// lazy() - loads components when needed
// suspense - wraps the lazy loaded components
// Layout component to include the Navbar on specific routes
function MainLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

// Loading.. shows when any routes takes too long to load/download
const PageLoader = () =>(
  <div className="loader-container">
    <div className="simple-spinner" aria-label="Loading..."></div>
  </div>
);

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
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
            fontSize: "15px",
            fontWeight: "500",
            padding: "12px 20px",
          },
        }}
      />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Routes wrapped in MainLayout will display the Navbar */}
          <Route element={<MainLayout />}>
            {/* Public and marketing pages */}
            <Route path="/" element={<Landing />} />

            {/* Core application pages */}
            <Route path="/search" element={<HomeSearch />} />
            <Route path="/category/:id" element={<CategoryPage />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/cart" element={<Cart />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/payment" element={<Payment />} />
            </Route>

            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/register" element={<Register />} />
          </Route>
          {/* Admin Dashboard route left outside of MainLayout so it won't display the Navbar */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/provider" element={<ProviderDashboard />} />
          {/* Route left outside of MainLayout will NOT display the Navbar */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
