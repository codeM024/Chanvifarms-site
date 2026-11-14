import './Navbar.css'
import { assets } from "../../assets/assets"
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useEffect } from 'react'
import { FaSignOutAlt } from 'react-icons/fa'

const Navbar = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication status on mount and changes
    const auth = localStorage.getItem('adminAuth');
    if (!auth) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    try {
      // Clear all auth-related data
      localStorage.clear();
      sessionStorage.clear();

      // Show success message
      toast.success('Logged out successfully');

      // Force navigation to login
      setTimeout(() => {
        navigate('/login', { replace: true });
        window.location.reload(); // Force reload to clear any cached states
      }, 100);
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error during logout. Please try again.');
    }
  };

  const auth = JSON.parse(localStorage.getItem('adminAuth'));
  const initial = auth?.email ? auth.email.charAt(0).toUpperCase() : 'A';

  return (
    <header className="navbar">
      <div className="nav-brand">
        <img className='logo' src={assets.logo} alt="Chanvi Farms" width="44" height="44"/>
        <div className="nav-brand-text">
          <span className="nav-brand-name">Chanvi Farms</span>
          <span className="nav-brand-tag">Admin</span>
        </div>
      </div>
      <div className="nav-right">
        {auth?.email && (
          <div className="nav-user" title={auth.email}>
            <span className="nav-avatar" aria-hidden="true">{initial}</span>
            <span className="admin-email">{auth.email}</span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="logout-btn"
          type="button"
          aria-label="Logout"
        >
          <FaSignOutAlt />
          <span className="logout-label">Logout</span>
        </button>
      </div>
    </header>
  )
}

export default Navbar
