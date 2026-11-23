import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthLoader from "./components/AuthLoader";
import Login from "./pages/Login";
import ProtectedRoute from "./ProtectedRoute";

const CreateAccount = lazy(() => import("./pages/CreateAccount"));
const CompleteRegistration = lazy(() => import("./pages/Completeregistration.jsx"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const StaffDashboard = lazy(() => import("./pages/StaffDashboard"));
const CustomerDashboard = lazy(() => import("./pages/CustomerDashboard"));

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<AuthLoader message="Loading Perez Printing Shop..." />}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/create-account" element={<CreateAccount />} />
        <Route path="/complete-registration" element={<CompleteRegistration />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/staff"
          element={
            <ProtectedRoute allowedRoles={["staff"]}>
              <StaffDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}