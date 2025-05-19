import Navbar from './components/Navbar/Navbar'
import Sidebar from './components/Sidebar/Sidebar'
import {Routes, Route, Navigate} from 'react-router-dom'
import PropTypes from 'prop-types'
import Add from './pages/Add/Add'
import List from './pages/List/List'
import Orders from './pages/Orders/Orders'
import Login from './pages/Login/Login'
import ProtectedRoute from './components/ProtectedRoute'
import { ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
  const auth = JSON.parse(localStorage.getItem('adminAuth'));
  const AuthenticatedLayout = ({ children }) => (
    <>
      <Navbar />
      <hr/>
      <div className="app-content">
        <Sidebar/>
        {children}
      </div>
    </>
  );

  AuthenticatedLayout.propTypes = {
    children: PropTypes.node.isRequired
  };

  return (
    <div>
      <ToastContainer/>
      <Routes>
        <Route path="/login" element={
          auth?.isAuthenticated ? <Navigate to="/list" replace /> : <Login />
        } />
        <Route path="/" element={<Navigate to={auth?.isAuthenticated ? "/list" : "/login"} replace />} />
        
        <Route path="/add" element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Add />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }/>
        <Route path="/list" element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <List />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }/>
        <Route path="/orders" element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Orders />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }/>
      </Routes>
    </div>
  )
}

export default App