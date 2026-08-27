import { Navigate } from "react-router-dom"

// Legacy route — organization now lives inside /profile
export default function OrgPage() {
  return <Navigate to="/profile" replace />
}
