import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from "react-icons/fa";
import { useSettings } from "../context/SettingsContext";

const footerStyle = {
  backgroundColor: "#1a1a1a",
  color: "#f5f5f5",
  padding: "60px 0 0 0",
};

const containerStyle = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "0 20px",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "40px",
  marginBottom: "40px",
};

const colStyle = {
  display: "flex",
  flexDirection: "column",
};

const brandStyle = {
  fontSize: "24px",
  fontWeight: "bold",
  marginBottom: "15px",
  color: "#fff",
};

const headingStyle = {
  fontSize: "18px",
  fontWeight: "600",
  marginBottom: "20px",
  color: "#fff",
};

const textStyle = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#aaa",
  marginBottom: "10px",
};

const listStyle = {
  listStyle: "none",
  padding: 0,
  margin: 0,
};

const listItemStyle = {
  marginBottom: "10px",
};

const linkStyle = {
  color: "#aaa",
  textDecoration: "none",
  fontSize: "14px",
  transition: "color 0.3s ease",
};

const socialStyle = {
  display: "flex",
  gap: "15px",
  marginTop: "20px",
};

const iconStyle = {
  fontSize: "20px",
  color: "#aaa",
  cursor: "pointer",
  transition: "color 0.3s ease",
};

const bottomStyle = {
  borderTop: "1px solid #333",
  padding: "20px 0",
  textAlign: "center",
  backgroundColor: "#111",
};

const bottomTextStyle = {
  fontSize: "14px",
  color: "#888",
  margin: 0,
};

/**
 * Footer component
 * Displays the footer with links to home, services, categories, cart, about us, contact us and copyright information
 * @returns {JSX.Element} Footer component
 */
export default function Footer() {
  const { settings } = useSettings();

  return (
    <footer style={footerStyle}>
      <div className="container" style={containerStyle} data-aos="fade-up">
        <div style={gridStyle}>
          <div style={colStyle}>
            <h3 style={brandStyle}>{settings?.siteName || "ServiceNest"}</h3>
            <p style={textStyle}>
              Trusted home services at your doorstep. We provide professional
              and background-verified experts for all your home needs.
            </p>
            <div style={socialStyle}>
              <FaFacebook style={iconStyle} />
              <FaTwitter style={iconStyle} />
              <FaInstagram style={iconStyle} />
              <FaLinkedin style={iconStyle} />
            </div>
          </div>

          <div style={colStyle}>
            <h4 style={headingStyle}>Quick Links</h4>
            <ul style={listStyle}>
              <li style={listItemStyle}>
                <a href="/" style={linkStyle}>
                  Home
                </a>
              </li>
              <li style={listItemStyle}>
                <a href="/#services" style={linkStyle}>
                  Services
                </a>
              </li>
              <li style={listItemStyle}>
                <a href="/#categories" style={linkStyle}>
                  Categories
                </a>
              </li>
              <li style={listItemStyle}>
                <a href="/cart" style={linkStyle}>
                  Cart
                </a>
              </li>
            </ul>
          </div>

          <div style={colStyle}>
            <h4 style={headingStyle}>Contact Us</h4>
            <p style={textStyle}>
              Email: {settings?.supportEmail || "servicenest358@gmail.com"}
            </p>
            <p style={textStyle}>
              Phone: {settings?.supportPhone || "+91 93929 57585"}
            </p>
            <p style={textStyle}>Address: 123, ASoft, Visakhapatnam, India</p>
          </div>
        </div>
      </div>
      <div style={bottomStyle}>
        <p style={bottomTextStyle}>
          &copy; 2026 ServiceNest. All rights reserved under ServiceNest | Terms
          of Service | Privacy
        </p>
      </div>
    </footer>
  );
}
