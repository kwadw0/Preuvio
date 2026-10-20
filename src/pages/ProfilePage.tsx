import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import "./DashboardPage.css"
import "./ProfilePage.css"
import { useOnboardingStatus } from "../features/org/useOnboardingStatus"
import { humanizeEnum } from "../features/org/types"
import { useUserProfile } from "../features/user/useUserProfile"
import { formatMemberSince, getInitials } from "../features/user/types"
import { ApiError } from "../lib/api"
import * as orgApi from "../features/org/api"

function ProfilePage() {
  const [mobileNav, setMobileNav] = useState(false)
  const { isLoading: orgLoading, org, error: orgError, isOnboarded, refresh } = useOnboardingStatus() as { isLoading: boolean; org: import("../features/org/types").OrganizationResponseDto | null; error: string | null; isOnboarded: boolean; refresh?: () => void }
  const { isLoading: userLoading, user, isPlaceholder } = useUserProfile()
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [editDesc, setEditDesc] = useState("")
  const [editWebsite, setEditWebsite] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (org) {
      setEditName(org.name ?? "")
      setEditDesc(org.description ?? "")
      setEditWebsite(org.website_url ?? "")
    }
  }, [org])

  const initials = user ? getInitials(user.first_name, user.last_name) : "—"
  const fullName = user ? `${user.first_name} ${user.last_name}` : "—"
  const isLoading = userLoading || orgLoading

  return (
    <>
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
            <Link to="/forms" onClick={()=>setMobileNav(false)}>Forms</Link>
            <Link to="/templates" onClick={()=>setMobileNav(false)}>Templates</Link>
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
                      {!editing ? (
                        <button className="btn btn--ghost btn--sm" onClick={() => { setSaveError(null); setEditing(true) }}>Edit workspace</button>
                      ) : (
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault()
                            if (!org) return
                            setSaving(true)
                            setSaveError(null)
                            try {
                              const patch: Record<string, string> = {}
                              if (editName.trim() && editName.trim() !== org.name) patch.name = editName.trim()
                              if (editDesc.trim() !== (org.description ?? "")) patch.description = editDesc.trim()
                              if (editWebsite.trim() !== (org.website_url ?? "")) patch.website_url = editWebsite.trim()
                              if (Object.keys(patch).length === 0) {
                                setEditing(false)
                                return
                              }
                              await orgApi.updateOrganization(org.id, patch)
                              setEditing(false)
                              refresh?.()
                            } catch (err) {
                              setSaveError(err instanceof ApiError ? err.message : "Update failed")
                            } finally {
                              setSaving(false)
                            }
                          }}
                          style={{ display: "grid", gap: 8, marginTop: 12 }}
                        >
                          <label className="field"><span>Name</span><input value={editName} onChange={(e) => setEditName(e.target.value)} style={{ minHeight: 40 }} /></label>
                          <label className="field"><span>Description</span><input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} style={{ minHeight: 40 }} /></label>
                          <label className="field"><span>Website</span><input value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)} placeholder="https://…" style={{ minHeight: 40 }} /></label>
                          {saveError && <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--danger)" }}>{saveError}</div>}
                          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEditing(false)} disabled={saving}>Cancel</button>
                            <button type="submit" className="btn btn--primary btn--sm" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
                          </div>
                          <span className="mono-muted" style={{ fontSize: 11 }}>Partial update — only changed fields are sent.</span>
                        </form>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </section>

          <p style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--slate-2)", textAlign:"center", margin:"6px 0 0"}}>Profile and workspace stay in sync — edits here apply across compliance workflows.</p>
        </main>
      </>
  )
}

export default ProfilePage
