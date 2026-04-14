import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import AxiosInstance from "../Utils/AxiosInstance";
import ServiceCard from "../components/ServiceCard";

// if any user searches the url with category/:id then this page shows up

export default function CategoryPage() {
  const { id } = useParams();
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const response = await AxiosInstance.get(
          `/api/categories/${id}/services`,
        );
        if (response.data) {
          setCategory(response.data);
        }
      } catch (error) {
        console.error("Error fetching category:", error);
        setError("Failed to load category services. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchCategory();
  }, [id]);

  // Refresh AOS animations whenever category data is fetched and drawn to the DOM
  useEffect(() => {
    if (category && window.AOS) {
      setTimeout(() => window.AOS.refresh(), 100);
    }
  }, [category]);

  if (loading) {
    return (
      <div
        className="container"
        style={{
          padding: "40px 0",
          textAlign: "center",
          minHeight: "calc(100vh - 70px)",
        }}
      >
        <h2>Loading Category...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="container"
        style={{
          padding: "40px 0",
          textAlign: "center",
          minHeight: "calc(100vh - 70px)",
          color: "red",
        }}
      >
        <h2>{error}</h2>
      </div>
    );
  }

  if (!category) {
    return (
      <div
        className="container"
        style={{
          padding: "40px 0",
          textAlign: "center",
          minHeight: "calc(100vh - 70px)",
        }}
      >
        <h2>Category not found</h2>
      </div>
    );
  }

  return (
    <div
      className="container"
      style={{ padding: "40px 0", minHeight: "calc(100vh - 70px)" }}
    >
      <h2
        style={{
          textAlign: "center",
          color: "#1e6bb8",
          fontSize: "36px",
          marginBottom: "40px",
        }}
      >
        {category.name ||
          category.category ||
          category.title ||
          "Category Services"}
      </h2>
      <div className="grid">
        {(category.items || category.services || []).length > 0 ? (
          (category.items || category.services).map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))
        ) : (
          <div
            className="empty-cart"
            style={{ gridColumn: "1 / -1", marginTop: "20px" }}
          >
            <h3>No Services Available</h3>
            <p>There are currently no services listed under this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
