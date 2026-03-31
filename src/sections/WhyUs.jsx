import {
  FaUserShield,
  FaMoneyBillWave,
  FaHome,
  FaHeadset,
} from "react-icons/fa";

export default function WhyUs() {
  return (
    <section style={{ padding: "60px 0" }}>
      <div className="container">
        <h2 style={{ textAlign: "center" }} data-aos="fade-up">
          Why Choose ServiceNest
        </h2>
        <div className="grid">
          <div
            className="card"
            style={{ textAlign: "center" }}
            data-aos="fade-up"
            data-aos-delay="100"
          >
            <div
              style={{
                fontSize: "40px",
                color: "#ff7a00",
                marginBottom: "15px",
              }}
            >
              <FaUserShield />
            </div>
            <h3>Verified Professionals</h3>
            <p>All servicemen are background verified.</p>
          </div>
          <div
            className="card"
            style={{ textAlign: "center" }}
            data-aos="fade-up"
            data-aos-delay="200"
          >
            <div
              style={{
                fontSize: "40px",
                color: "#ff7a00",
                marginBottom: "15px",
              }}
            >
              <FaMoneyBillWave />
            </div>
            <h3>Affordable Pricing</h3>
            <p>Transparent pricing with no hidden charges.</p>
          </div>
          <div
            className="card"
            style={{ textAlign: "center" }}
            data-aos="fade-up"
            data-aos-delay="300"
          >
            <div
              style={{
                fontSize: "40px",
                color: "#ff7a00",
                marginBottom: "15px",
              }}
            >
              <FaHome />
            </div>
            <h3>Doorstep Service</h3>
            <p>Professional service delivered at your home.</p>
          </div>
          <div
            className="card"
            style={{ textAlign: "center" }}
            data-aos="fade-up"
            data-aos-delay="400"
          >
            <div
              style={{
                fontSize: "40px",
                color: "#ff7a00",
                marginBottom: "15px",
              }}
            >
              <FaHeadset />
            </div>
            <h3>24/7 Support</h3>
            <p>Customer support anytime.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
