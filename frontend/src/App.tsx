import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DashboardPage } from "./pages/DashboardPage";
import { EmployeeDetailPage } from "./pages/EmployeeDetailPage";
import { EmployeesListPage } from "./pages/EmployeesListPage";
import { LoginPage } from "./pages/LoginPage";
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/employees" element={<EmployeesListPage />} />
        <Route path="/employees/:id" element={<EmployeeDetailPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Route>
      <Route path="/" element={<Navigate to="/employees" replace />} />
    </Routes>
  );
}
