import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "./components/ToastContext";

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      try {
        // Save token
        localStorage.setItem("token", token);
        
        // Decode token to get role
        // A simple base64 decode of the JWT payload
        const payloadBase64 = token.split(".")[1];
        const decodedPayload = JSON.parse(atob(payloadBase64));
        
        // We might not have the full user object, so we'll mock what we need or fetch it later
        // But we have the role at least
        localStorage.setItem("user", JSON.stringify({
          _id: decodedPayload.id,
          role: decodedPayload.role || "user"
        }));

        addToast("Successfully logged in with OAuth!", "success");

        const role = decodedPayload.role;
        if (role === "admin") {
          navigate("/admin");
        } else if (role === "employer") {
          navigate("/employer-dashboard");
        } else {
          navigate("/user-dashboard");
        }

      } catch (err) {
        console.error("Error parsing OAuth token", err);
        addToast("OAuth login failed.", "error");
        navigate("/login");
      }
    } else {
      addToast("No token received from OAuth.", "error");
      navigate("/login");
    }
  }, [searchParams, navigate, addToast]);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <h2>Authenticating...</h2>
    </div>
  );
}
