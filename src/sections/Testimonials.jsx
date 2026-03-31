import { useState, useEffect, useRef } from "react";
import { FaStar, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useSelector } from "react-redux";
import AxiosInstance from "../Utils/AxiosInstance";

export default function Testimonials() {
  const authState = useSelector((state) => state.auth);
  // Safely grab the user whether it's stored as state.auth.user or state.auth directly
  const user = authState?.user || (authState?.id ? authState : null);

  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState("");
  const scrollRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await AxiosInstance.get(
        "http://localhost:3000/api/reviews",
      );
      setReviews(response.data);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    }
  };

  useEffect(() => {
    // Refresh AOS animations whenever reviews are fetched and drawn to the DOM
    if (window.AOS) {
      setTimeout(() => window.AOS.refresh(), 100);
    }
  }, [reviews]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newReview.trim()) return;

    try {
      await AxiosInstance.post("http://localhost:3000/api/reviews", {
        userId: user.id,
        name: user.name,
        review: newReview,
        rating: rating,
      });
      setMessage("Thank you for your review!");
      setNewReview("");
      setRating(5);
      fetchReviews(); // Refresh the list of reviews
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Failed to post review:", error);
      setMessage("Failed to submit review. Please try again.");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  // Auto-scrolling effect for an infinite feel
  useEffect(() => {
    if (reviews.length === 0 || isPaused) return;

    const intervalId = setInterval(() => {
      scroll("right");
    }, 3500); // Auto scrolls every 3.5 seconds

    return () => clearInterval(intervalId);
  }, [reviews.length, isPaused]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = direction === "left" ? -350 : 350;

      // Infinite loop effect: wrap around smoothly when reaching the ends
      if (direction === "left" && current.scrollLeft <= 10) {
        current.scrollTo({ left: current.scrollWidth, behavior: "smooth" });
      } else if (
        direction === "right" &&
        current.scrollLeft >= current.scrollWidth - current.clientWidth - 10
      ) {
        current.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    }
  };

  return (
    <section
      style={{
        background: "#1e6bb8",
        color: "white",
        padding: "60px 0",
      }}
    >
      <div className="container">
        <h2 style={{ textAlign: "center" }} data-aos="fade-up">
          What Our Customers Say
        </h2>

        {user ? (
          <div className="add-review-container" data-aos="fade-up">
            <h3>Leave a Review, {user.name}</h3>
            <form onSubmit={handleSubmit} className="review-form">
              <textarea
                value={newReview}
                onChange={(e) => setNewReview(e.target.value)}
                placeholder="Write your experience with ServiceNest..."
                required
                rows="4"
              ></textarea>
              <div className="review-actions">
                <div className="star-rating-input">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FaStar
                      key={star}
                      className={`star ${star <= (hoverRating || rating) ? "selected" : ""}`}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                    />
                  ))}
                </div>
                <button type="submit" className="login-btn">
                  Submit Review
                </button>
              </div>
              {message && <p className="review-message">{message}</p>}
            </form>
          </div>
        ) : (
          <p className="login-prompt" data-aos="fade-up">
            Please{" "}
            <a href="/login" style={{ color: "#ff7a00" }}>
              log in
            </a>{" "}
            to leave a review.
          </p>
        )}

        {reviews.length > 0 ? (
          <div
            className="reviews-wrapper"
            data-aos="fade-up"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          >
            <button
              className="scroll-arrow left"
              onClick={() => scroll("left")}
            >
              <FaChevronLeft />
            </button>
            <div className="reviews-scroll-container" ref={scrollRef}>
              {reviews.map((review, index) => (
                <div className="card" key={review.id || index}>
                  <div className="stars">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        color={i < (review.rating || 5) ? "#ffb400" : "#e4e5e9"}
                      />
                    ))}
                  </div>
                  <p>"{review.review}"</p>
                  <h4>- {review.name}</h4>
                </div>
              ))}
            </div>
            <button
              className="scroll-arrow right"
              onClick={() => scroll("right")}
            >
              <FaChevronRight />
            </button>
          </div>
        ) : (
          <p style={{ textAlign: "center", width: "100%" }}>
            No reviews yet. Be the first to leave one!
          </p>
        )}
      </div>
    </section>
  );
}
