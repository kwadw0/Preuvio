import { Routes, Route } from "react-router-dom"
import LandingPage from "./pages/LandingPage"
import SignupPage from "./pages/SignupPage"
import SigninPage from "./pages/SigninPage"
import DashboardPage from "./pages/DashboardPage"
import OrgPage from "./pages/OrgPage"
import ProfilePage from "./pages/ProfilePage"
import OnboardingPage from "./pages/OnboardingPage"
import ForgotPasswordPage from "./pages/ForgotPasswordPage"
import TemplatesPage from "./pages/TemplatesPage"
import TemplateDetailPage from "./pages/TemplateDetailPage"
import FormsPage from "./pages/FormsPage"
import FormDetailPage from "./pages/FormDetailPage"
import FormFillPage from "./pages/FormFillPage"
import SubmissionsPage, { SingleSubmissionPage } from "./pages/SubmissionsPage"
import PartnersPage from "./pages/PartnersPage"
import DashLayout from "./components/layout/DashLayout"
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
        <Route path="/org" element={<OrgPage />} />
        <Route element={<DashLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/partners" element={<PartnersPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/templates/:id" element={<TemplateDetailPage />} />
          <Route path="/forms" element={<FormsPage />} />
          <Route path="/forms/:id" element={<FormDetailPage />} />
          <Route path="/forms/:id/fill" element={<FormFillPage />} />
          <Route path="/forms/:formId/submissions" element={<SubmissionsPage />} />
          <Route path="/forms/:id/submissions" element={<SubmissionsPage />} />
          <Route path="/submissions/:id" element={<SingleSubmissionPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
