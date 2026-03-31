import { useState } from "react";
import { useNavigate } from "react-router-dom";
import hero from "../assets/hero.png"

export default function Hero() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  function handleSearch() {
    if (search.trim() === "") {
      return;
    }

    navigate(`/search?search=${search}`);
  }

  return (
    <section className="hero">
      <div className="hero-container">
        <div className="hero-left" data-aos="fade-right">
          <h1>
            Trusted Home Services <br />
            at Your Doorstep
          </h1>
          <p>
            Book professional services like cleaning, repairs, salon, pest
            control and more.
          </p>
          <div className="hero-search">
            <input
              type="text"
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button onClick={handleSearch}>Search</button>
          </div>
        </div>
        <div className="hero-right" data-aos="fade-left">
          <img
            src={hero}
            alt="service"
            className="hero-image"
          />
        </div>
      </div>
    </section>
  );
}
