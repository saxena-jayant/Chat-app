import React, { useEffect, useState } from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../shared/routes";

const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Load user from session storage when the app starts
  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Handle Google Login Success
  const handleLoginSuccess = (response) => {
    const decodedUser = jwtDecode(response.credential);

    // Store user data in session storage
    api
      .post("/user/login", {
        user_name: decodedUser.name,
        email: decodedUser.email,
        picture: decodedUser.picture,
      })
      .then(({ data }) => {
        const updatedUserData = { ...decodedUser, user_id: data.user_id };
        setUser(updatedUserData);
        sessionStorage.setItem("user", JSON.stringify(updatedUserData));
        navigate(ROUTES.HOME.path);
      })
      .catch((err) => console.log(err));
  };

  // Handle Logout
  const handleLogout = () => {
    sessionStorage.removeItem("user"); // Clear session storage
    setUser(null);
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <section
        className="d-flex align-items-center justify-content-center flex-column"
        style={{ minHeight: "70vh", gap: "100px" }}
      >
        <h2>Welcome to Varta</h2>
        <div style={{ width: "300px" }}>
          <p className="text-center font-20 font-medium mb-40">
            Log in to continue
          </p>
          {user ? (
            <div>
              <h3>Welcome, {user.name}!</h3>
              <img src={user.picture} alt="User profile" width="50" />
              <p>Email: {user.email}</p>
              <button onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <GoogleLogin
              onSuccess={handleLoginSuccess}
              onError={() => console.log("Login Failed")}
            />
          )}
        </div>
      </section>
    </GoogleOAuthProvider>
  );
};

export default Index;
