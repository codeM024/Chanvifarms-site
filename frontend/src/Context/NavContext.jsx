import { createContext, useState } from 'react';
import PropTypes from 'prop-types';

export const NavContext = createContext(null);

const NavContextProvider = ({ children }) => {
  const [activeNav, setActiveNav] = useState('home');

  return (
    <NavContext.Provider value={{ activeNav, setActiveNav }}>
      {children}
    </NavContext.Provider>
  );
};

NavContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default NavContextProvider;