import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar/Navbar'
import Sidebar from './components/Sidebar/Sidebar'
import ProtectedRoute from './components/ProtectedRoute'
import { RouteLoader } from './components/Feedback/Feedback'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Route-level code splitting: each page is downloaded only when first visited.
const Add = lazy(() => import('./pages/Add/Add'))
const List = lazy(() => import('./pages/List/List'))
const Boxes = lazy(() => import('./pages/Boxes/Boxes'))
const Orders = lazy(() => import('./pages/Orders/Orders'))
const Login = lazy(() => import('./pages/Login/Login'))

// Shared shell for every authenticated page. Rendered once as a layout route so the
// navbar/sidebar persist between pages and only the content area transitions.
const AuthenticatedLayout = () => {
  const { pathname } = useLocation();
  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-content">
        <Sidebar />
        <main className="app-main">
          <Suspense fallback={<RouteLoader />}>
            <div key={pathname} className="route-view">
              <Outlet />
            </div>
          </Suspense>
        </main>
      </div>
    </div>
  );
};

const App = () => {
  const auth = JSON.parse(localStorage.getItem('adminAuth'));

  return (
    <div>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={
          auth?.isAuthenticated ? <Navigate to="/list" replace /> : (
            <Suspense fallback={<RouteLoader full />}>
              <Login />
            </Suspense>
          )
        } />
        <Route path="/" element={<Navigate to={auth?.isAuthenticated ? "/list" : "/login"} replace />} />

        <Route element={
          <ProtectedRoute>
            <AuthenticatedLayout />
          </ProtectedRoute>
        }>
          <Route path="/add" element={<Add />} />
          <Route path="/list" element={<List />} />
          <Route path="/boxes" element={<Boxes />} />
          <Route path="/orders" element={<Orders />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App
