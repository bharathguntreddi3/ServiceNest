import { Link, useSearchParams } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
// import axios from "axios";
import AxiosInstance from "../Utils/AxiosInstance";
import { FiSearch, FiX } from "react-icons/fi";

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
  const [searchParams, setSearchParams] = useSearchParams();
  // Initialize search state from URL query parameter "search"
  const [search, setSearch] = useState(searchParams.get("search") || "");

  // for heavy filtering, we can debounce the search input to avoid too many renders
  const [debouncedSearch, setDebouncedSearch] = useState(
    searchParams.get("search") || "",
  );

  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // fetch data only once
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setIsLoading(true);
        const response = await AxiosInstance.get("/api/services");
        setServices(response.data);
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchServices();
  }, []);

  // debounce logic and url sync
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      // update url without reloading the page
      if (search) {
        setSearchParams({ search });
      } else {
        setSearchParams({});
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, setSearchParams]);

  // multi - word filter by useMemo
  const filtered = useMemo(() => {
    if (!debouncedSearch) return services;
    // split the search term into individual words and remove extra spaces
    const searchTerms = debouncedSearch
      .toLowerCase()
      .split(" ")
      .filter(Boolean);

    return services.filter((cat) => {
      const categoryName = cat.category.toLowerCase();
      // check for the matching category
      const matchCategroy = searchTerms.every((term) =>
        categoryName.includes(term),
      );
      // check for the matching items
      const matchItems = cat.items?.some((item) => {
        const itemName = (item.name || item.title || "").toLowerCase();
        return searchTerms.every((term) => itemName.includes(term));
      });
      return matchCategroy || matchItems;
    });
  }, [services, debouncedSearch]);

  //
  // const filtered = services.filter((cat) => {
  //   const matchCategory = cat.category
  //     .toLowerCase()
  //     .includes(search.toLowerCase());
  //   const matchItems = cat.items?.some((item) =>
  //     (item.name || item.title || "")
  //       .toLowerCase()
  //       .includes(search.toLowerCase()),
  //   );
  //   return matchCategory || matchItems;
  // });

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

        {/* Search Input UI */}
        <div
          // className="hero-search"     // old search css
          data-aos="zoom-in"
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            display: "flex",
            alignItems: "center",
            padding: "5px 15px",
            backgroundColor: "#fff",
            borderRadius: "50px",
            border: "1px solid #e0e0e0",
          }}
        >
          <FiSearch size={20} color="orange" style={{ marginRight: "10px" }} />
          <input
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              padding: "12px 0",
              fontSize: "16px",
            }}
            placeholder="Search for cleaning, plumbing, etc..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "5px",
                display: "flex",
                alignItems: "center",
                color: "black",
              }}
              aria-label="Clear search"
            >
              <FiX size={20} />
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
          {/* Add a simple loading spinner or skeleton here if desired */}
          <p>Loading services...</p>
        </div>
      ) : (
        <div className="grid">
          {filtered.length > 0 ? (
            filtered.map((cat, index) => (
              <div
                className="card"
                key={cat.id || index}
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
                        cursor: "pointer",
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
              style={{
                gridColumn: "1 / -1",
                marginTop: "20px",
                textAlign: "center",
              }}
            >
              <h3>No Services Found</h3>
              <p>We couldn't find any services matching "{search}".</p>
              <button
                style={{
                  padding: "10px 20px",
                  cursor: "pointer",
                  marginTop: "10px",
                }}
                onClick={() => setSearch("")}
              >
                Clear Search
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
