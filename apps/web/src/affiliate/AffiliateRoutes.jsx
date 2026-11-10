import { Routes, Route, Navigate } from "react-router-dom";
import { AffiliateAuthProvider } from "./AffiliateAuth.jsx";
import { AffiliateRegister } from "./Register.jsx";
import { AffiliateLogin } from "./Login.jsx";
import { AffiliateDashboard } from "./Dashboard.jsx";

export function AffiliateRoutes() {
  return (
    <AffiliateAuthProvider>
      <Routes>
        <Route path="/register" element={<AffiliateRegister />} />
        <Route path="/login" element={<AffiliateLogin />} />
        <Route path="/dashboard" element={<AffiliateDashboard />} />
        <Route path="*" element={<Navigate to="/affiliate/login" replace />} />
      </Routes>
    </AffiliateAuthProvider>
  );
}
