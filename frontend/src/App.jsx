import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from './store/auth'
import AppLayout from './components/layout/AppLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import VisitPage from './pages/VisitPage'
import ReportForm from './pages/ReportForm'
import ReviewPage from './pages/ReviewPage'
import ConfirmationPage from './pages/ConfirmationPage'

function RequireAuth({ children }) {
  const token = useAuthStore((s) => s.token)
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="visits/:visitId" element={<VisitPage />} />
          <Route path="visits/:visitId/report" element={<ReportForm />} />
          <Route path="visits/:visitId/report/review" element={<ReviewPage />} />
          <Route path="visits/:visitId/report/confirmation" element={<ConfirmationPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
