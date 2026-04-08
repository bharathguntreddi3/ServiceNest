import { Link, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

// After search this page pops up

function ImageWithSkeleton({ src, alt }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {!loaded && <div className="skeleton-placeholder"></div>}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.3s ease",
          position: "relative",
          zIndex: 2,
        }}
      />
    </div>
  );
}

export default function Home() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [services, setServices] = useState([]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/services");
        setServices(response.data);
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };
    fetchServices();
  }, []);

  const filtered = services.filter((cat) => {
    const matchCategory = cat.category
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchItems = cat.items?.some((item) =>
      (item.name || item.title || "")
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
    return matchCategory || matchItems;
  });

  return (
    <div
      className="container"
      style={{ padding: "40px 0", minHeight: "calc(100vh - 70px)" }}
    >
      <div style={{ textAlign: "center", marginBottom: "50px" }}>
        <h2
          style={{ color: "#1e6bb8", fontSize: "36px", margin: "0 0 15px 0" }}
          data-aos="fade-down"
        >
          Explore Services
        </h2>
        <p
          style={{ color: "#666", fontSize: "18px", marginBottom: "30px" }}
          data-aos="fade-up"
        >
          Find and book the best professionals for your home needs
        </p>

        {/* Reusing the beautiful hero-search styling from styles.css */}
        <div
          className="hero-search"
          data-aos="zoom-in"
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          }}
        >
          <input
            placeholder="Search for cleaning, plumbing, etc..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {/* <button style={{ pointerEvents: "none" }}>Search</button> */}
        </div>
      </div>

      <div className="grid">
        {filtered.length > 0 ? (
          filtered.map((cat, index) => (
            <div
              className="card"
              key={index}
              style={{ padding: 0, display: "flex", flexDirection: "column" }}
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              <div
                style={{
                  height: "200px",
                  width: "100%",
                  overflow: "hidden",
                  borderRadius: "12px 12px 0 0",
                }}
              >
                <ImageWithSkeleton src={cat.image} alt={cat.category} />
              </div>

              <div
                style={{
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  flexGrow: 1,
                }}
              >
                <h3
                  style={{
                    margin: "0 0 20px 0",
                    color: "#333",
                    textAlign: "center",
                    fontSize: "22px",
                  }}
                >
                  {cat.category}
                </h3>

                <Link
                  to={`/category/${cat.id}`}
                  style={{ textDecoration: "none", marginTop: "auto" }}
                >
                  <button
                    style={{
                      width: "100%",
                      padding: "12px",
                      fontSize: "16px",
                      fontWeight: "600",
                    }}
                  >
                    View Services
                  </button>
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div
            className="empty-cart"
            style={{ gridColumn: "1 / -1", marginTop: "20px" }}
          >
            <h3>No Services Found</h3>
            <p>We couldn't find any services matching "{search}".</p>
            <button className="login-btn" onClick={() => setSearch("")}>
              Clear Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
