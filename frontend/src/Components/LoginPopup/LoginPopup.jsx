import { useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './LoginPopup.css';
import { assets } from '../../assets/assets';
import { StoreContext } from '../../Context/StoreContext';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import { GoogleOAuthProvider } from '@react-oauth/google';

const LoginPopup = ({ setShowLogin }) => {
  const { url, setToken } = useContext(StoreContext);
  const [currState, setCurrState] = useState('Login');
  const [data, setData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => setShowLogin(false), 300);
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setData((prevData) => ({ ...prevData, [name]: value }));
    setError('');
  };

  const validateForm = () => {
    if (!data.email || !data.password) {
      setError('Please fill in all required fields');
      return false;
    }
    if (currState === 'Sign Up' && !data.name) {
      setError('Name is required for registration');
      return false;
    }
    if (data.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    return true;
  };

  const onLogin = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    const endpoint = currState === 'Login' ? '/api/user/login' : '/api/user/register';
    
    try {
      const response = await axios.post(url + endpoint, data);
      if (response.data.success) {
        setToken(response.data.token);
        localStorage.setItem('token', response.data.token);
        handleClose();
      } else {
        setError(response.data.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError(error.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchAuthMode = (newState) => {
    setError('');
    setData({ name: '', email: '', password: '' });
    setCurrState(newState);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      const response = await axios.post(url + '/api/user/google-auth', {
        credential: credentialResponse.credential
      });
      
      if (response.data.success) {
        setToken(response.data.token);
        localStorage.setItem('token', response.data.token);
        handleClose();
      } else {
        setError(response.data.message || 'Google authentication failed');
      }
    } catch (error) {
      console.error('Google auth error:', error);
      setError(error.response?.data?.message || 'An error occurred with Google Sign-In');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google Sign-In was unsuccessful. Please try again.');
  };

  return (
    <div className={`login-popup ${isClosing ? 'fade-out' : ''}`} onClick={handleClose}>
      <form onSubmit={onLogin} className="login-popup-container" onClick={e => e.stopPropagation()}>
        <div className="login-popup-title">
          <h2>{currState}</h2>
          <img onClick={handleClose} src={assets.cross_icon} alt="Close" />
        </div>
        
        {error && <div className="error-message">{error}</div>}

        <div className="login-popup-inputs">
          {currState !== 'Login' && (
            <input
              name="name"
              onChange={onChangeHandler}
              value={data.name}
              type="text"
              placeholder="Your name"
              required
              autoComplete="name"
            />
          )}
          <input
            name="email"
            onChange={onChangeHandler}
            value={data.email}
            type="email"
            placeholder="Your email"
            required
            autoComplete="email"
          />
          <input
            name="password"
            onChange={onChangeHandler}
            value={data.password}
            type="password"
            placeholder="Password"
            required
            minLength="8"
            autoComplete={currState === 'Login' ? 'current-password' : 'new-password'}
          />
          <div className="password-disclaimer">
            please remember or note down can&apos;t changeable
          </div>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? (
            <span className="loading-text">Please wait...</span>
          ) : (
            currState === 'Sign Up' ? 'Create account' : 'Login'
          )}
        </button>

        <div className="or-divider">
          <span>OR</span>
        </div>

        <div className="google-login-container">          <GoogleOAuthProvider clientId="567912748637-3l3tv43n7afd3asq4stipd4ajl2e091r.apps.googleusercontent.com">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              size="large"
              theme="outline"
              width="100%"
              text={currState === 'Login' ? 'Sign in with Google' : 'Sign up with Google'}
            />
          </GoogleOAuthProvider>
        </div>

        <div className="login-popup-condition">
          <label>
            <input type="checkbox" required />
            <span>By continuing, I agree to the terms of use & privacy policy</span>
          </label>
        </div>

        {currState === 'Login' ? (
          <p>
            Create a New Account?{' '}
            <span onClick={() => switchAuthMode('Sign Up')}>Click here</span>
          </p>
        ) : (
          <p>
            Already have an account?{' '}
            <span onClick={() => switchAuthMode('Login')}>Login here</span>
          </p>
        )}
      </form>
    </div>
  );
};

LoginPopup.propTypes = {
  setShowLogin: PropTypes.func.isRequired
};

export default LoginPopup;
