import { useState, useEffect } from "react";
import {
  FaBroom,
  FaSpa,
  FaPaintRoller,
  FaBolt,
  FaSnowflake,
  FaMotorcycle,
  FaBug,
  FaTv,
  FaUtensils,
  FaTools,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import AxiosInstance from "../Utils/AxiosInstance";

const categoryIcons = {
  "Home Cleaning": FaBroom,
  "Pest Control": FaBug,
  "Salon & Spa": FaSpa,
  Painting: FaPaintRoller,
  "Electrician & Plumber": FaBolt,
  "AC & Fridge Repair": FaSnowflake,
  "Bike Service": FaMotorcycle,
  "Appliance Repair": FaTv,
  "Chef Service": FaUtensils,
};

export default function Categories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await AxiosInstance.get("/api/categories");
        // Ensure that we only set an array to the state
        if (Array.isArray(response.data)) {
          setCategories(response.data);
        } else if (response.data && Array.isArray(response.data.categories)) {
          setCategories(response.data.categories); // Sometimes APIs wrap the array inside an object
        } else {
          setCategories([]); // Fallback to an empty array
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  return (
    <section id="categories" className="categories">
      <div className="container">
        <h2 className="section-title" data-aos="fade-up">
          Popular Categories
        </h2>

        <div className="category-grid">
          {/* Defensively check if categories is an array before mapping */}
          {Array.isArray(categories) &&
            categories.map((cat, index) => {
              const Icon = categoryIcons[cat.name] || FaTools;

              return (
                <div
                  className="category-card"
                  key={cat.id}
                  onClick={() => navigate(`/category/${cat.id}`)}
                  style={{ cursor: "pointer" }}
                  data-aos="zoom-in"
                  data-aos-delay={index * 100}
                >
                  <img src={cat.image} alt={cat.name} />

                  <div className="category-overlay">
                    <div className="category-icon">
                      <Icon />
                    </div>

                    <h3>{cat.name}</h3>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </section>
  );
}
