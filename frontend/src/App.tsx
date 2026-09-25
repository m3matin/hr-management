import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";

const Layout = lazy(() =>
  import("./components/Layout").then(({ Layout: component }) => ({
    default: component,
  })),
);
const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then(({ DashboardPage: component }) => ({
    default: component,
  })),
);
const EmployeeDetailPage = lazy(() =>
  import("./pages/EmployeeDetailPage").then(
    ({ EmployeeDetailPage: component }) => ({ default: component }),
  ),
);
const EmployeesListPage = lazy(() =>
  import("./pages/EmployeesListPage").then(
    ({ EmployeesListPage: component }) => ({ default: component }),
  ),
);
const LoginPage = lazy(() =>
  import("./pages/LoginPage").then(({ LoginPage: component }) => ({
    default: component,
  })),
);

function RouteFallback() {
  return (
    <div
      role="status"
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
      }}
    >
      Loading…
    </div>
  );
}
export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
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
    </Suspense>
  );
}
