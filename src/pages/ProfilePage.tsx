import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import "./DashboardPage.css"
import "./ProfilePage.css"
import { config } from "../lib/config"
import { useAuth } from "../features/auth/context"
import { setOnboardedCache, useOnboardingStatus } from "../features/org/useOnboardingStatus"
import { humanizeEnum } from "../features/org/types"
import { useUserProfile } from "../features/user/useUserProfile"
import { formatMemberSince, getInitials } from "../features/user/types"

function ProfilePage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [mobileNav, setMobileNav] = useState(false)
  const { isLoading: orgLoading, org, error: orgError, isOnboarded } = useOnboardingStatus()
  const { isLoading: userLoading, user, isPlaceholder } = useUserProfile()

  function handleSignOut() {
    logout()
    setOnboardedCache(null)
    try { sessionStorage.removeItem("preuvio_onboarding_draft") } catch { /* ignore */ }
    navigate("/login", { replace: true })
  }

  const initials = user ? getInitials(user.first_name, user.last_name) : "—"
  const fullName = user ? `${user.first_name} ${user.last_name}` : "—"
  const isLoading = userLoading || orgLoading

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
          <Link to="/dashboard">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>
            Overview
          </Link>
          <Link to="/dashboard">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M12 3v6h6"/></svg>
            Forms
          </Link>
          <Link to="/dashboard">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v15H6.5A2.5 2.5 0 0 1 4 14.5V4.5A2.5 2.5 0 0 1 6.5 2z"/></svg>
            Templates
          </Link>
          <Link to="/dashboard">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Partners
          </Link>
          <Link to="/dashboard">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 15h6"/><path d="M9 12h6"/></svg>
            Proof vault
          </Link>
          <Link to="/">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            Help
          </Link>
        </nav>

        <div className="dash__rail-bottom">
          <Link to="/profile" className="dash__user is-active" aria-label="View profile" aria-current="page">
            {user?.avatar_url ? <img src={user.avatar_url} alt="" /> : <span style={{ width:32, height:32, borderRadius:999, background:"rgba(255,255,255,0.14)", display:"grid", placeItems:"center", fontFamily:"var(--mono)", fontSize:11, color:"white", border:"1px solid rgba(255,255,255,0.14)" }}>{initials}</span>}
            <div>
              <strong>{userLoading ? "…" : fullName}</strong>
              <span>{user?.email ?? "—"} • {config.apiBaseUrl.replace("https://","")}</span>
            </div>
          </Link>
          <button className="btn btn--ghost" style={{ width:"100%", justifyContent:"center"}} onClick={handleSignOut}>Sign out</button>
        </div>
      </aside>

      <div style={{ minWidth:0, display:"flex", flexDirection:"column"}}>
        <header className="dash__top">
          <button className="dash__icon-btn" style={{ display:"grid"}} aria-label="Toggle menu" onClick={()=>setMobileNav(v=>!v)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileNav ? <path d="M18 6L6 18M6 6l12 12"/> : <><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></>}
            </svg>
          </button>

          <span className="dash__crumb">
            <span style={{ width:1, height:12, background:"var(--warm-gray)", display:"inline-block"}} aria-hidden />
            <span>ACCOUNT</span>
            <strong>Profile</strong>
          </span>

          <div className="dash__top-actions">
            <button className="dash__icon-btn" aria-label="Notifications">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 8a6 6 0 0 1 12 0c0 7-6 9-6 9s-6-2-6-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
            </button>
            <Link to="/" className="btn btn--ghost" style={{ padding:"7px 12px"}}>View site</Link>
          </div>
        </header>

        {mobileNav && (
          <nav className="dash__mobile-nav" aria-label="Mobile">
            <Link to="/dashboard" onClick={()=>setMobileNav(false)}>Overview</Link>
            <button type="button" onClick={handleSignOut}>Sign out</button>
          </nav>
        )}

        <main className="dash__main">
          <div className="dash__ledger">
            <div className="dash__ledger-left">
              <span className="dash__ledger-kicker"><i aria-hidden/> ACCOUNT • PROFILE & WORKSPACE</span>
              <h1>Profile</h1>
              <p>Your account and workspace in one place — verify identity, contact and the organization linked to every proof you send.</p>
            </div>
          </div>

          {/* Unified dossier — user + org in one card */}
          <section className="dossier" aria-label="Profile and workspace">
            {isLoading ? (
              <div className="dossier__loading">
                <span className="dossier__loading-dot" aria-hidden />
                <span style={{ fontFamily:"var(--mono)", fontSize:13, color:"var(--slate)" }}>Loading profile…</span>
              </div>
            ) : !user ? (
              <div className="dossier__empty">
                <p style={{ fontFamily:"var(--mono)", fontSize:13, color:"var(--slate)" }}>Unable to load profile.</p>
              </div>
            ) : (
              <>
                {/* User zone */}
                <div className="dossier__user">
                  <div className="dossier__user-top">
                    <div className="dossier__avatar" aria-hidden>
                      {user.avatar_url ? <img src={user.avatar_url} alt="" /> : <span>{initials}</span>}
                    </div>
                    <div className="dossier__user-head">
                      <h2 className="dossier__name">
                        {fullName}
                        <span className="pill pill--approved">Active</span>
                      </h2>
                      <p className="dossier__email">{user.email}</p>
                      {isPlaceholder && <span className="dossier__preview">Preview — live data when GET /api/users/me is ready</span>}
                    </div>
                    <button className="btn btn--ghost dossier__edit" disabled title="Editing coming soon">Edit profile</button>
                  </div>

                  <div className="dossier__fields">
                    <div className="dossier__field">
                      <span className="dossier__label">Email</span>
                      <a href={`mailto:${user.email}`} className="dossier__value dossier__value--link">{user.email}</a>
                    </div>
                    <div className="dossier__field">
                      <span className="dossier__label">Phone</span>
                      <a href={`tel:${user.phone}`} className="dossier__value dossier__value--link">{user.phone || "—"}</a>
                    </div>
                    <div className="dossier__field">
                      <span className="dossier__label">Full name</span>
                      <span className="dossier__value">{fullName}</span>
                    </div>
                    <div className="dossier__field">
                      <span className="dossier__label">Member since</span>
                      <span className="dossier__value">{formatMemberSince(user.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Linked divider — signature */}
                <div className="dossier__divider" aria-hidden>
                  <span className="dossier__divider-label">
                    <i className="dossier__divider-dot" />
                    Linked workspace
                  </span>
                  <span className="dossier__divider-line" />
                </div>

                {/* Org zone — embedded */}
                <div className="dossier__org">
                  {orgError ? (
                    <p style={{ fontFamily:"var(--mono)", fontSize:13, color:"var(--danger)", margin:0 }}>{orgError}</p>
                  ) : !isOnboarded || !org ? (
                    <div className="dossier__org-empty">
                      <p style={{ fontFamily:"var(--mono)", fontSize:13, color:"var(--slate)", margin:0 }}>
                        No workspace yet. <Link to="/onboarding" style={{ color:"var(--verdant)", fontWeight:600 }}>Complete onboarding →</Link>
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="dossier__org-head">
                        <span className="dossier__org-icon" aria-hidden>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <path d="M9 22V12h6v10" />
                          </svg>
                        </span>
                        <div className="dossier__org-title">
                          <h3>{org.name}</h3>
                          <span className="pill pill--approved">{org.is_active ? "Active workspace" : "Inactive"}</span>
                        </div>
                      </div>
                      {org.description && <p className="dossier__org-desc">{org.description}</p>}
                      <div className="dossier__org-grid">
                        <div className="dossier__field">
                          <span className="dossier__label">Industry</span>
                          <span className="dossier__value">{humanizeEnum(org.industry)}</span>
                        </div>
                        <div className="dossier__field">
                          <span className="dossier__label">Team size</span>
                          <span className="dossier__value">{org.team_size}</span>
                        </div>
                        <div className="dossier__field">
                          <span className="dossier__label">Customer type</span>
                          <span className="dossier__value">{org.primary_customer_type === "both" ? "Both" : org.primary_customer_type.toUpperCase()}</span>
                        </div>
                        <div className="dossier__field">
                          <span className="dossier__label">Owner role</span>
                          <span className="dossier__value">{humanizeEnum(org.owner_role)}</span>
                        </div>
                        {org.website_url && (
                          <div className="dossier__field dossier__field--wide">
                            <span className="dossier__label">Website</span>
                            <a href={org.website_url} target="_blank" rel="noopener noreferrer" className="dossier__value dossier__value--link">
                              {org.website_url.replace(/^https?:\/\//, "")}
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                              </svg>
                            </a>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </section>

          <p style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--slate-2)", textAlign:"center", margin:"6px 0 0"}}>Profile and workspace stay in sync — edits here apply across compliance workflows.</p>
        </main>
      </div>
    </div>
  )
}

export default ProfilePage
