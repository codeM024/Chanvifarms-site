import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { getAdminAuth } from '../auth';

const ProtectedRoute = ({ children }) => {
  const auth = getAdminAuth();

  if (!auth) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired
};

export default ProtectedRoute;