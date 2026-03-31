import React from "react";
import { Link } from "react-router-dom";

const notFoundStyles = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh", // Changed to 100vh since Navbar is no longer here
    textAlign: "center",
    padding: "20px",
    backgroundColor: "#f4f7f9",
};

const buttonStyles = {
    display: "inline-block",
    padding: "15px 35px",
    fontSize: "1.1rem",
    fontWeight: "bold",
    color: "#ffffff",
    backgroundColor: "#1e6bb8",
    borderRadius: "50px",
    textDecoration: "none",
    boxShadow: "0 10px 20px rgba(30, 107, 184, 0.3)",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    marginTop: "10px",
};

const NotFound = () => {
    return (
        <div style={notFoundStyles}>
            <img
                src="https://www.youstable.com/blog/wp-content/uploads/2023/09/404-Error.jpg"
                alt="404 Page Not Found"
                style={{
                    maxWidth: "100%",
                    width: "450px",
                    marginBottom: "20px",
                    mixBlendMode: "multiply",
                }}
            />
            <p
                style={{
                    marginBottom: "30px",
                    color: "#555",
                    fontSize: "1.2rem",
                    maxWidth: "500px",
                }}
            >
                Oops! The page you are looking for does not exist. It might have been
                moved or deleted.
            </p>
            <Link
                to="/"
                style={buttonStyles}
                onMouseOver={(e) => (e.target.style.transform = "translateY(-3px)")}
                onMouseOut={(e) => (e.target.style.transform = "translateY(0)")}
            >
                Go to Homepage
            </Link>
        </div>
    );
};

export default NotFound;
