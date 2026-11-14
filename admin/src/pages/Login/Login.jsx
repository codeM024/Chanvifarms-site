import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { assets } from '../../assets/assets';
import loginBg from '../../assets/adminloginBG.webp';
import './Login.css';

const validCredentials = [
  { email: 'lovelyboyarun91@gmail.com', password: 'vali@18024' },
  { email: 'manisake28@gmail.com', password: 'mani@18024' },
  { email: 'chanvifarms9@gmail.com', password: 'Chanvifarms@99' },
];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setSubmitting(true);

    const isValidUser = validCredentials.some(
      cred => cred.email === email && cred.password === password
    );

    if (isValidUser) {
      // Store auth state
      localStorage.setItem('adminAuth', JSON.stringify({ email, isAuthenticated: true }));
      toast.success('Login successful!');
      navigate('/list');
    } else {
      toast.error('Invalid credentials!');
      setSubmitting(false);
    }
  };

  return (
    <div className="login-container" style={{ '--login-bg': `url(${loginBg})` }}>
      <div className="login-card">
        <img src={assets.logo} alt="Chanvi Farms Logo" className="login-logo" width="88" height="88" />
        <h2>Welcome back</h2>
        <p className="login-subtitle">Sign in to the Chanvi Farms admin panel</p>
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="login-email">Email</label>
            <div className="input-with-icon">
              <FaEnvelope className="input-icon" aria-hidden="true" />
              <input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="input-group">
            <label htmlFor="login-password">Password</label>
            <div className="input-with-icon">
              <FaLock className="input-icon" aria-hidden="true" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(s => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <button type="submit" className="login-button" disabled={submitting}>
            {submitting && <span className="spinner" aria-hidden="true" />}
            {submitting ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
