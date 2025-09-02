import { useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import "./LoginPopup.css";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../Context/StoreContext";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Link } from "react-router-dom";

const LoginPopup = ({ setShowLogin }) => {
  const { url, setToken } = useContext(StoreContext);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => setShowLogin(false), 300);
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!acceptTerms) {
      setError("Please accept the terms and conditions to continue");
      return;
    }

    try {
      setLoading(true);
      setError(""); // Clear any previous errors
      const response = await axios.post(url + "/api/user/google-auth", {
        credential: credentialResponse.credential,
      });

      if (response.data.success) {
        setToken(response.data.token);
        localStorage.setItem("token", response.data.token);
        handleClose();
      } else {
        setError(response.data.message || "Google authentication failed");
      }
    } catch (error) {
      console.error("Google auth error:", error);
      setError(
        error.response?.data?.message || "An error occurred with Google Sign-In"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google Sign-In was unsuccessful. Please try again.");
  };

  return (
    <div
      className={`login-popup ${isClosing ? "fade-out" : ""}`}
      onClick={handleClose}
    >
      <div
        className="login-popup-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="login-popup-title">
          <h2>Login</h2>
          <img onClick={handleClose} src={assets.cross_icon} alt="Close" />
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="welcome-message">
          <p>Sign in to access your account and explore our Products</p>
        </div>

        <div className="login-popup-condition">
          <label className="terms-checkbox">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => {
                setAcceptTerms(e.target.checked);
                if (e.target.checked) {
                  setError(""); // Clear error when terms are accepted
                }
              }}
            />
            <span>
              By continuing, I agree to the{" "}
              <Link 
                to="/terms" 
                target="_blank" 
                onClick={(e) => e.stopPropagation()}
                className="terms-link"
              >
                terms of use
              </Link>{" "}
              &{" "}
              <Link 
                to="/privacy" 
                target="_blank"
                onClick={(e) => e.stopPropagation()}
                className="terms-link"
              >
                privacy policy
              </Link>
            </span>
          </label>
          {!acceptTerms && <p className="terms-warning">Please accept the terms to continue</p>}
        </div>

        <div className={`google-login-container ${!acceptTerms ? 'disabled' : ''}`}>
          <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <div className={!acceptTerms ? 'google-button-overlay' : ''}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                size="large"
                theme="filled_blue"
                shape="pill"
                width="100%"
                text="Continue with Google"
                useOneTap={false}
                disabled={!acceptTerms}
              />
            </div>
          </GoogleOAuthProvider>
        </div>
      </div>
    </div>
  );
};

LoginPopup.propTypes = {
  setShowLogin: PropTypes.func.isRequired,
};

export default LoginPopup;