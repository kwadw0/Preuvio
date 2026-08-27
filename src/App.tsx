import { Routes, Route } from "react-router-dom"
import LandingPage from "./pages/LandingPage"
import SignupPage from "./pages/SignupPage"
import SigninPage from "./pages/SigninPage"
import DashboardPage from "./pages/DashboardPage"
import OrgPage from "./pages/OrgPage"
import ProfilePage from "./pages/ProfilePage"
import OnboardingPage from "./pages/OnboardingPage"
import ForgotPasswordPage from "./pages/ForgotPasswordPage"
import { ProtectedRoute, PublicRoute } from "./features/auth/ProtectedRoute"

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Auth pages — redirect to dashboard if already authenticated */}
      <Route element={<PublicRoute />}>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<SigninPage />} />
        <Route path="/signin" element={<SigninPage />} />
      </Route>

      {/* Protected — requires Bearer token */}
      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/org" element={<OrgPage />} />
      </Route>
    </Routes>
  )
}

export default App
