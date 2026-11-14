import { useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";
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
    setTimeout(() => setShowLogin(false), 220);
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
    <motion.div
      className="login-popup"
      onClick={handleClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: isClosing ? 0 : 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <motion.div
        className="login-popup-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-popup-heading"
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={
          isClosing
            ? { opacity: 0, scale: 0.96, y: 8 }
            : { opacity: 1, scale: 1, y: 0 }
        }
        transition={
          isClosing
            ? { duration: 0.18, ease: "easeIn" }
            : { type: "spring", stiffness: 420, damping: 30 }
        }
      >
        <div className="login-popup-title">
          <div className="login-popup-brand">
            <img src={assets.Chanvifarmlogo} alt="" className="login-popup-logo" />
            <h2 id="login-popup-heading">Login</h2>
          </div>
          <button
            type="button"
            className="login-popup-close"
            onClick={handleClose}
            aria-label="Close"
          >
            <img src={assets.cross_icon} alt="" />
          </button>
        </div>

        <div className="welcome-message">
          <p>Sign in to access your account and explore our Products</p>
        </div>

        <AnimatePresence initial={false}>
          {error && (
            <motion.div
              className="error-message"
              role="alert"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <i className="fas fa-exclamation-circle"></i>
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

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
          <AnimatePresence initial={false}>
            {!acceptTerms && (
              <motion.p
                className="terms-warning"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
              >
                Please accept the terms to continue
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className={`google-login-container ${!acceptTerms ? 'disabled' : ''} ${loading ? 'is-loading' : ''}`}>
          {loading && (
            <div className="google-login-loading" aria-live="polite">
              <span className="login-spinner" aria-hidden="true"></span>
              Signing you in…
            </div>
          )}
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
      </motion.div>
    </motion.div>
  );
};

LoginPopup.propTypes = {
  setShowLogin: PropTypes.func.isRequired,
};

export default LoginPopup;