import './Sidebar.css'
import { NavLink, useLocation } from 'react-router-dom'
import { FaList, FaPlus, FaShoppingBag, FaBox, FaUtensils, FaConciergeBell } from 'react-icons/fa'

// `match` lists every path that should highlight the link; `short` is the label used in the phone tab bar.
const links = [
  { to: '/add', label: 'Add Items', short: 'Add', Icon: FaPlus },
  { to: '/list', label: 'List Items', short: 'Items', Icon: FaList },
  { to: '/boxes', label: 'Boxes', short: 'Boxes', Icon: FaBox },
  { to: '/orders', label: 'Orders', short: 'Orders', Icon: FaShoppingBag },
  { to: '/tiffins', label: 'Tiffins', short: 'Tiffins', Icon: FaUtensils, match: ['/tiffins', '/tiffin-settings'] },
  { to: '/tiffin-orders', label: 'Tiffin Orders', short: 'T-Orders', Icon: FaConciergeBell },
]

const isMatch = (pathname, link) => (link.match || [link.to]).some((p) => pathname === p || pathname.startsWith(`${p}/`))

const Sidebar = () => {
  const { pathname } = useLocation();
  const activeIndex = links.findIndex(l => isMatch(pathname, l));

  return (
    <nav className="sidebar" aria-label="Main navigation">
        <p className="sidebar-heading">Menu</p>
        <div
          className="sidebar-options"
          style={{ '--active-index': Math.max(activeIndex, 0), '--count': links.length }}
        >
            {activeIndex >= 0 && <span className="sidebar-indicator" aria-hidden="true" />}
            {links.map((link, i) => {
              const { to, label, short, Icon } = link;
              return (
                <NavLink
                  key={to}
                  to={to}
                  title={label}
                  aria-label={label}
                  className={() => `sidebar-option${i === activeIndex ? ' active' : ''}`}
                  aria-current={i === activeIndex ? 'page' : undefined}
                >
                    <Icon className="icon" />
                    <p className="sidebar-label">{label}</p>
                    <p className="sidebar-label-short" aria-hidden="true">{short}</p>
                </NavLink>
              );
            })}
        </div>
    </nav>
  )
}

export default Sidebar
