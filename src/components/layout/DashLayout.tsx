import { NavLink, Link, Outlet, useNavigate } from "react-router-dom"
import "../../pages/DashboardPage.css"
import { config } from "../../lib/config"
import { useAuth } from "../../features/auth/context"
import { setOnboardedCache } from "../../features/org/useOnboardingStatus"
import { usePartnerProfile, resetPartnerCache } from "../../features/partners/usePartnerProfile"
import { useUserProfile } from "../../features/user/useUserProfile"
import { getInitials } from "../../features/user/types"

export default function DashLayout() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { user } = useUserProfile()
  const { isPartner } = usePartnerProfile()

  function handleSignOut() {
    logout()
    setOnboardedCache(null)
    resetPartnerCache()
    try { sessionStorage.removeItem("preuvio_onboarding_draft") } catch { /* ignore */ }
    navigate("/login", { replace: true })
  }

  const initials = user ? getInitials(user.first_name, user.last_name) : "—"
  const fullName = user ? `${user.first_name} ${user.last_name}` : "—"

  // single source of truth — no counts
  return (
    <div className="dash">
      <aside className="dash__rail" aria-label="Primary">
        <div className="dash__rail-top">
          <span className="dash__logo" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 3l7 4v5c0 5-3.5 7.5-7 8-3.5-.5-7-3-7-8V7l7-4z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </span>
          <span className="dash__brand">Preuvio</span>
        </div>

        <nav className="dash__nav">
          {isPartner ? (
            <>
              <NavLink to="/assignments" className={({ isActive }) => (isActive ? "is-active" : "")}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>
                My work
              </NavLink>
              <NavLink to="/submissions" className={({ isActive }) => (isActive ? "is-active" : "")}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M12 12h6"/><path d="M12 16h6"/><path d="M12 8h6"/></svg>
                My submissions
              </NavLink>
              <NavLink to="/vault" className={({ isActive }) => (isActive ? "is-active" : "")}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 15h6"/><path d="M9 12h6"/></svg>
                Proof vault
              </NavLink>
              <Link to="/">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                Help
              </Link>
            </>
          ) : (
            <>
              <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "is-active" : "")}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>
                Overview
              </NavLink>
              <NavLink to="/forms" className={({ isActive }) => (isActive ? "is-active" : "")}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M12 3v6h6"/></svg>
                Forms
              </NavLink>
              <NavLink to="/templates" className={({ isActive }) => (isActive ? "is-active" : "")}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v15H6.5A2.5 2.5 0 0 1 4 14.5V4.5A2.5 2.5 0 0 1 6.5 2z"/></svg>
                Templates
              </NavLink>
              <NavLink to="/partners" className={({ isActive }) => (isActive ? "is-active" : "")}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Partners
              </NavLink>
              <NavLink to="/submissions" className={({ isActive }) => (isActive ? "is-active" : "")}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M12 12h6"/><path d="M12 16h6"/><path d="M12 8h6"/></svg>
                Submissions
              </NavLink>
              <NavLink to="/vault" className={({ isActive }) => (isActive ? "is-active" : "")}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 15h6"/><path d="M9 12h6"/></svg>
                Proof vault
              </NavLink>
              <Link to="/">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                Help
              </Link>
            </>
          )}
        </nav>

        <div className="dash__rail-bottom">
          {isPartner ? (
            <div className="dash__user">
              {user?.avatar_url ? <img src={user.avatar_url} alt="" /> : <span style={{ width: 32, height: 32, borderRadius: 999, background: "rgba(255,255,255,0.14)", display: "grid", placeItems: "center", fontFamily: "var(--mono)", fontSize: 11, color: "white", border: "1px solid rgba(255,255,255,0.14)" }}>{initials}</span>}
              <div>
                <strong>{user ? fullName : "—"}</strong>
                <span>{user?.email ?? "—"} • partner</span>
              </div>
            </div>
          ) : (
            <Link to="/profile" className="dash__user" aria-label="View profile">
              {user?.avatar_url ? <img src={user.avatar_url} alt="" /> : <span style={{ width: 32, height: 32, borderRadius: 999, background: "rgba(255,255,255,0.14)", display: "grid", placeItems: "center", fontFamily: "var(--mono)", fontSize: 11, color: "white", border: "1px solid rgba(255,255,255,0.14)" }}>{initials}</span>}
              <div>
                <strong>{user ? fullName : "—"}</strong>
                <span>{user?.email ?? "—"} • {config.apiBaseUrl.replace("https://", "")}</span>
              </div>
            </Link>
          )}
          <button className="btn btn--ghost" style={{ width: "100%", justifyContent: "center" }} onClick={handleSignOut}>Sign out</button>
        </div>
      </aside>

      <div style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Outlet />
      </div>
    </div>
  )
}
