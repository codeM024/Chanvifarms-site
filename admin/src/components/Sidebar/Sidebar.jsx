import './Sidebar.css'
import { NavLink, useLocation } from 'react-router-dom'
import { FaList, FaPlus, FaShoppingBag, FaBox } from 'react-icons/fa'

const links = [
  { to: '/add', label: 'Add Items', Icon: FaPlus },
  { to: '/list', label: 'List Items', Icon: FaList },
  { to: '/boxes', label: 'Boxes', Icon: FaBox },
  { to: '/orders', label: 'Orders', Icon: FaShoppingBag },
]

const Sidebar = () => {
  const { pathname } = useLocation();
  const activeIndex = links.findIndex(l => pathname.startsWith(l.to));

  return (
    <nav className="sidebar" aria-label="Main navigation">
        <p className="sidebar-heading">Menu</p>
        <div
          className="sidebar-options"
          style={{ '--active-index': Math.max(activeIndex, 0), '--count': links.length }}
        >
            {activeIndex >= 0 && <span className="sidebar-indicator" aria-hidden="true" />}
            {links.map(({ to, label, Icon }) => (
              <NavLink key={to} to={to} className="sidebar-option">
                  <Icon className="icon" />
                  <p>{label}</p>
              </NavLink>
            ))}
        </div>
    </nav>
  )
}

export default Sidebar
