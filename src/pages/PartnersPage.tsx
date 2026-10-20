import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import "./DashboardPage.css"
import "./PartnersPage.css"
import { ApiError } from "../lib/api"
import * as partnersApi from "../features/partners/api"
import * as assignmentsApi from "../features/assignments/api"
import * as rolesApi from "../features/roles/api"
import type { RoleResponseDto } from "../features/roles/types"
import { listForms, listSubmissions } from "../features/forms/api"
import type { EnrichedSubmissionResponse } from "../features/forms/types"
import { enrichPartner, formatDate, formatRelative, type EnrichedPartner } from "../features/partners/types"

type StatusFilter = "all" | "pending" | "submitted" | "active" | "expired" | "inactive" | "suspended"

const PAGE_SIZE = 10

export default function PartnersPage() {
  const [mobileNav, setMobileNav] = useState(false)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<StatusFilter>("all")
  const [sortBy, setSortBy] = useState<"recent" | "name" | "status">("recent")
  const [partners, setPartners] = useState<EnrichedPartner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<EnrichedPartner | null>(null)
  const [submissions, setSubmissions] = useState<unknown[] | null>(null)
  const [invitations, setInvitations] = useState<import("../features/partners/types").InvitationResponse[] | null>(null)
  const [invitationsError, setInvitationsError] = useState<string | null>(null)
  const [partnerAssignments, setPartnerAssignments] = useState<import("../features/assignments/types").AssignmentResponse[] | null>(null)
  const [vaultProof, setVaultProof] = useState<EnrichedSubmissionResponse[] | null>(null)
  const [lifecycleWorking, setLifecycleWorking] = useState(false)
  const [lifecycleError, setLifecycleError] = useState<string | null>(null)

  // create partner
  const [showCreate, setShowCreate] = useState(false)
  const [createName, setCreateName] = useState("")
  const [createEmail, setCreateEmail] = useState("")
  const [createPhone, setCreatePhone] = useState("")
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // invite user
  const [inviteFor, setInviteFor] = useState<EnrichedPartner | null>(null)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("")
  const [inviteRoles, setInviteRoles] = useState<RoleResponseDto[]>([])
  const [inviteRolesLoading, setInviteRolesLoading] = useState(false)
  const [inviteRolesError, setInviteRolesError] = useState<string | null>(null)
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  async function openInvite(partner: EnrichedPartner) {
    setInviteFor(partner)
    setInviteEmail("")
    setInviteRole("")
    setInviteError(null)
    setInviteRolesError(null)
    setInviteRoles([])
    setInviteRolesLoading(true)
    try {
      const { data } = await rolesApi.listRoles()
      const assignable = rolesApi.assignableRoles(data)
      setInviteRoles(assignable)
      const preferred = assignable.find((r) => r.name.toLowerCase() === "member") ?? assignable[0]
      setInviteRole(preferred?.id ?? "")
    } catch (e) {
      setInviteRolesError(
        e instanceof ApiError && e.status === 403
          ? "Your role cannot list roles — ask an owner or admin to send this invite."
          : "Could not load roles — try again."
      )
    } finally {
      setInviteRolesLoading(false)
    }
  }

  // partner-centric assign: org assigns compliance forms to this partner
  const [assignOpen, setAssignOpen] = useState(false)
  const [formOptions, setFormOptions] = useState<{ id: string; title: string; status: string }[]>([])
  const [assignFormIds, setAssignFormIds] = useState<string[]>([])
  const [assignDueAt, setAssignDueAt] = useState("")
  const [assigning, setAssigning] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)
  const [assignResult, setAssignResult] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  async function openAssign(partner: EnrichedPartner) {
    setSelected(partner)
    setAssignOpen(true)
    setAssignError(null)
    setAssignResult(null)
    setAssignFormIds([])
    try {
      const forms = await listForms()
      setFormOptions(forms.map((f) => ({ id: f.id, title: f.title, status: f.status })))
    } catch {
      setFormOptions([])
      setAssignError("Could not load forms — try again.")
    }
  }

  async function handleAssign() {
    if (!selected || assignFormIds.length === 0) return
    setAssigning(true)
    setAssignError(null)
    setAssignResult(null)
    try {
      const notes: string[] = []
      for (const formId of assignFormIds) {
        const res = await assignmentsApi.assignForm(formId, { partner_ids: [selected.id], due_at: assignDueAt || undefined })
        const ok = res.assigned.length
        const skipped = res.skipped?.length ? ` • ${res.skipped.length} skipped: ${res.skipped.map((s) => s.reason).join("; ")}` : ""
        const title = formOptions.find((f) => f.id === formId)?.title ?? formId.slice(0, 8)
        notes.push(`${title}: assigned ${ok}${skipped}`)
      }
      setAssignResult(notes.join(" | "))
      setAssignFormIds([])
      const refreshed = await assignmentsApi.listPartnerAssignments(selected.id, { limit: 20 })
      setPartnerAssignments(refreshed.data)
    } catch (e) {
      setAssignError(e instanceof ApiError ? e.message : "Assign failed — form must be active and partner must belong to your org.")
    } finally {
      setAssigning(false)
    }
  }

  async function handleRevoke(formId: string) {
    if (!selected || !confirm("Revoke this assignment? History is kept, future submits are blocked.")) return
    setRevokingId(formId)
    try {
      await assignmentsApi.revokeAssignment(formId, selected.id)
      const refreshed = await assignmentsApi.listPartnerAssignments(selected.id, { limit: 20 })
      setPartnerAssignments(refreshed.data)
    } catch (e) {
      setAssignError(e instanceof ApiError ? e.message : "Revoke failed")
    } finally {
      setRevokingId(null)
    }
  }

  // Fetch live partners — API is the source of truth (no mock fallback)
  const [reloadKey, setReloadKey] = useState(0)
  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    partnersApi.listPartners()
      .then((data) => {
        if (!alive) return
        setPartners(Array.isArray(data) ? data.map((p) => enrichPartner(p)) : [])
      })
      .catch((e) => {
        if (!alive) return
        setPartners([])
        setError(e instanceof ApiError ? e.message : "Failed to load partners")
      })
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [reloadKey])

  const filtered = useMemo(() => {
    let arr = partners.filter((p) => {
      const norm = (p.status ?? "").toLowerCase()
      const byStatus = status === "all" ? true : status === "active" ? (norm === "active" || norm === "approved") : norm === status
      const q = search.trim().toLowerCase()
      const bySearch = q === "" ? true : `${p.name} ${p.email ?? ""} ${p.phone ?? ""}`.toLowerCase().includes(q)
      return byStatus && bySearch
    })
    if (sortBy === "name") arr = [...arr].sort((a, b) => a.name.localeCompare(b.name))
    else if (sortBy === "status") arr = [...arr].sort((a, b) => (a.status ?? "").localeCompare(b.status ?? ""))
    else arr = [...arr].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    return arr
  }, [partners, status, search, sortBy])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paged = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, currentPage])

  useEffect(() => { setPage(1) }, [search, status, sortBy])
  useEffect(() => {
    if (selected) {
      setSubmissions(null)
      setInvitations(null)
      setInvitationsError(null)
      setPartnerAssignments(null)
      setVaultProof(null)
      partnersApi.listPartnerSubmissions(selected.id).then((data) => setSubmissions(Array.isArray(data) ? data : [])).catch(() => setSubmissions([]))
      partnersApi.listPartnerInvitations(selected.id).then((data) => setInvitations(Array.isArray(data) ? data : [])).catch((e) => setInvitationsError(e instanceof ApiError ? e.message : "Invitations unavailable"))
      assignmentsApi.listPartnerAssignments(selected.id, { limit: 20 }).then((r) => setPartnerAssignments(r.data)).catch(() => setPartnerAssignments([]))
      // Proof vault: enriched submissions for this partner (server-filtered, one call)
      listSubmissions({ partner_id: selected.id, limit: 50 }).then((r) => setVaultProof(r.data)).catch(() => setVaultProof([]))
    }
  }, [selected])

  // Close modal on Escape
  useEffect(() => {
    if (!selected) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSelected(null) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [selected])

  return (
    <>
      <header className="dash__top">
        <button className="dash__icon-btn" style={{ display: "grid" }} aria-label="Toggle menu" onClick={() => setMobileNav((v) => !v)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileNav ? <path d="M18 6L6 18M6 6l12 12" /> : <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>}
          </svg>
        </button>

        <span className="dash__crumb">
          <span style={{ width: 1, height: 12, background: "var(--warm-gray)", display: "inline-block" }} aria-hidden />
          <span>DIRECTORY</span>
          <strong>Partners</strong>
        </span>

        <label className="dash__search" aria-label="Search partners">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" /></svg>
          <input placeholder="Search partners, email, docs…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>

        <div className="dash__top-actions">
          <Link to="/dashboard" className="btn btn--ghost" style={{ padding: "7px 12px" }}>Overview</Link>
          <Link to="/submissions" className="btn btn--ghost" style={{ padding: "7px 12px", display: "none" } as React.CSSProperties}>Submissions</Link>
          <button className="btn btn--primary" onClick={() => { setCreateError(null); setShowCreate(true) }} style={{ padding: "7px 12px" }}>Add partner</button>
        </div>
      </header>

      {mobileNav && (
        <nav className="dash__mobile-nav" aria-label="Mobile">
          <Link to="/dashboard" onClick={() => setMobileNav(false)}>Overview</Link>
          <Link to="/partners" onClick={() => setMobileNav(false)}>Partners</Link>
          <Link to="/forms" onClick={() => setMobileNav(false)}>Forms</Link>
          <Link to="/templates" onClick={() => setMobileNav(false)}>Templates</Link>
        </nav>
      )}

      <main className="dash__main">
        {/* Thesis header — ledger */}
        <div className="dash__ledger">
          <div className="dash__ledger-left">
            <span className="dash__ledger-kicker"><i /> Directory • verified partners</span>
            <h1 style={{ fontSize: 22, margin: "8px 0 8px" }}>Partners</h1>
            <p>A detailed directory of every partner — verification, contact, documents and audit trail. Click any row for the full dossier. Same table as overview, enriched for review.</p>
          </div>
          <div className="dash__ledger-actions" style={{ gap: 8 }}>
            <span className="mono-muted" style={{ fontSize: 11, background: "var(--ivory)", border: "1px solid var(--warm-gray)", padding: "6px 8px", borderRadius: 8 }}>{filtered.length} partners • page {currentPage} of {totalPages}</span>
            <button className="btn btn--primary" onClick={() => { setCreateError(null); setShowCreate(true) }} style={{ padding: "7px 12px" }}>Add partner →</button>
          </div>
        </div>

        {/* Stats — subtle dossier summary */}
        <section className="partners__stats" aria-label="Partners overview">
          <article className="dash__stat"><span className="dash__stat-label">Total partners</span><span className="dash__stat-value">{partners.length}</span><span className="dash__stat-hint hint--down"><i /> Live directory</span></article>
          <article className="dash__stat"><span className="dash__stat-label">Active</span><span className="dash__stat-value">{partners.filter(p => { const s = (p.status ?? "").toLowerCase(); return s === "active" || s === "approved" }).length}</span><span className="dash__stat-hint hint--up"><i /> Verified</span></article>
          <article className="dash__stat"><span className="dash__stat-label">Pending review</span><span className="dash__stat-value">{partners.filter(p => p.status === "pending" || p.status === "submitted").length}</span><span className="dash__stat-hint hint--warn"><i /> Needs attention</span></article>
          <article className="dash__stat"><span className="dash__stat-label">Inactive</span><span className="dash__stat-value">{partners.filter(p => ["inactive", "suspended", "expired"].includes((p.status ?? "").toLowerCase())).length}</span><span className="dash__stat-hint hint--down"><i /> Offboarded</span></article>
        </section>

        <section className="dash__card" aria-labelledby="partners-title">
          <div className="dash__card-head">
            <h2 id="partners-title">Directory <em>{filtered.length} of {partners.length}</em></h2>
            <div className="filter-pills">
              {(["all", "pending", "submitted", "active", "expired", "inactive", "suspended"] as const).map((s) => (
                <button key={s} className={status === s ? "is-active" : ""} onClick={() => setStatus(s)}>{s === "all" ? "All" : s[0].toUpperCase() + s.slice(1)}</button>
              ))}
            </div>
          </div>

          <div className="dash__toolbar">
            <label className="dash__search" style={{ flex: 1 }} aria-label="Filter partners">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" /></svg>
              <input placeholder="Filter by name, email or docs…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </label>
            <div className="partners__view-toggle">
              <label className="mono-muted" style={{ fontSize: 11 }}>Sort</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as never)} style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid var(--warm-gray)", fontSize: 12, background: "white", minHeight: 36 }}>
                <option value="recent">Recent</option>
                <option value="name">Name</option>
                <option value="status">Status</option>
              </select>
            </div>
            <span className="mono-muted" style={{ fontSize: 11 }}>{loading ? "Loading…" : `${filtered.length} matches`}</span>
          </div>

          {error && <div style={{ padding: "10px 14px", background: "#fdf0ef", borderBottom: "1px solid #e8c4c3", color: "#7a2e2c", fontFamily: "var(--mono)", fontSize: 12, display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" }}><span>{error}</span><button className="btn btn--ghost btn--sm" onClick={() => setReloadKey((k) => k + 1)}>Retry</button></div>}

          <div style={{ overflowX: "auto" }}>
            <table className="dash__table">
              <thead>
                <tr>
                  <th>Partner</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: "center", padding: 24, color: "var(--muted)", fontFamily: "var(--mono)", fontSize: 12 }}>{loading ? "Loading directory…" : partners.length === 0 ? "No partners yet — add your first partner to assign compliance forms." : "No partners match your filter."}</td></tr>
                ) : (
                  paged.map((p) => (
                    <tr key={p.id} onClick={() => setSelected(p)} style={{ cursor: "pointer" }} className={selected?.id === p.id ? "is-selected" : ""}>
                      <td><span className="partner"><span className="partner__avatar">{p.initials}</span><span style={{ display: "grid" }}><strong style={{ fontSize: 13, lineHeight: 1.1 }}>{p.name}</strong></span></span></td>
                      <td><span className="mono-muted" style={{ fontSize: 12 }}>{p.email ?? "—"}</span></td>
                      <td><span className={`pill pill--${p.status === "active" || p.status === "approved" ? "approved" : p.status === "pending" ? "pending" : p.status === "submitted" ? "submitted" : "expired"}`}>{(p.status ?? "pending")}</span></td>
                      <td><span className="mono-muted" title={formatDate(p.updated_at)}>{formatRelative(p.updated_at)}</span></td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="dash__icon-btn"
                          aria-label={`View ${p.name} dossier`}
                          title="View dossier"
                          onClick={(e) => { e.stopPropagation(); setSelected(p); }}
                          style={{ minHeight: 32, minWidth: 32 }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="partners__pagination">
            <span className="partners__pagination-info">Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} • {totalPages} pages</span>
            <div className="partners__pagination-actions">
              <button className="partners__page-btn" disabled={currentPage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label="Previous page">‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2)).map((n) => (
                <button key={n} className={`partners__page-btn ${n === currentPage ? "is-active" : ""}`} onClick={() => setPage(n)} aria-label={`Go to page ${n}`} aria-current={n === currentPage ? "page" : undefined}>{n}</button>
              ))}
              {totalPages > 5 && currentPage < totalPages - 2 && <span className="mono-muted" style={{ padding: "0 4px" }}>…</span>}
              {totalPages > 5 && currentPage < totalPages - 2 && <button className="partners__page-btn" onClick={() => setPage(totalPages)}>{totalPages}</button>}
              <button className="partners__page-btn" disabled={currentPage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} aria-label="Next page">›</button>
            </div>
            <span className="mono-muted" style={{ fontSize: 11 }}>10 per page</span>
          </div>
        </section>

        <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--slate-2)", textAlign: "center", margin: "6px 0 0" }}>Directory is the source of truth — overview shows a preview, this page is the detailed ledger with pagination.</p>
      </main>

      {selected && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="partner-title" onClick={() => setSelected(null)}>
          <div className="partner-modal" onClick={(e) => e.stopPropagation()}>
            <div className="partner-modal__head">
              <span className="partner-modal__avatar" aria-hidden>{selected.initials}</span>
              <div className="partner-modal__title">
                <h3 id="partner-title">{selected.name} <span className={`pill pill--${selected.status === "active" || selected.status === "approved" ? "approved" : selected.status === "pending" ? "pending" : selected.status === "submitted" ? "submitted" : "expired"}`} style={{ fontSize: 11 }}>{selected.status ?? "pending"}</span></h3>
                <p>
                  <span>{selected.email ?? "—"}</span>
                  <span>•</span>
                  <span>{selected.phone ?? "—"}</span>
                  <span>•</span>
                  <span>{formatDate(selected.created_at)} → {formatRelative(selected.updated_at)}</span>
                </p>
              </div>
              <button className="dash__icon-btn" aria-label="Close" onClick={() => setSelected(null)} style={{ flexShrink: 0 }}>✕</button>
            </div>

            <div className="partner-modal__body">
              <div className="partner-modal__grid">
                <div className="partner-modal__section">
                  <div className="partner-modal__section-head"><span>Profile</span></div>
                  <div className="partner-modal__section-body">
                    <div className="partner-modal__field"><span className="partner-modal__label">Legal name</span><span className="partner-modal__value">{selected.name}</span></div>
                    <div className="partner-modal__field"><span className="partner-modal__label">Email</span><a href={`mailto:${selected.email ?? ""}`} className="partner-modal__value" style={{ color: "var(--verdant)", textDecoration: "underline" }}>{selected.email ?? "—"}</a></div>
                    <div className="partner-modal__field"><span className="partner-modal__label">Phone</span><a href={`tel:${selected.phone ?? ""}`} className="partner-modal__value" style={{ color: "var(--verdant)", textDecoration: "underline" }}>{selected.phone ?? "—"}</a></div>
                    <div className="partner-modal__field"><span className="partner-modal__label">Member since</span><span className="partner-modal__value--mono">{formatDate(selected.created_at)}</span></div>
                    <div className="partner-modal__field">
                      <span className="partner-modal__label">Coverage</span>
                      {partnerAssignments === null || vaultProof === null ? (
                        <span className="mono-muted" style={{ fontSize: 12 }}>Loading coverage…</span>
                      ) : partnerAssignments.length === 0 ? (
                        <span className="mono-muted" style={{ fontSize: 12 }}>No assigned forms — coverage not defined.</span>
                      ) : (() => {
                        const approvedForms = new Set(
                          vaultProof
                            .filter((s) => s.status === "approved" && partnerAssignments.some((a) => a.form_id === s.form_id))
                            .map((s) => s.form_id)
                        )
                        const pct = Math.round((approvedForms.size / partnerAssignments.length) * 100)
                        return (
                          <div style={{ display: "grid", gap: 6 }}>
                            <div className="verify-bar"><i style={{ width: `${pct}%`, background: pct >= 80 ? "var(--verdant)" : pct >= 50 ? "var(--copper)" : "var(--danger)" }} /></div>
                            <span className="partner-modal__value--mono">{approvedForms.size} of {partnerAssignments.length} forms approved • {pct}%</span>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                </div>

                <div className="partner-modal__section">
                  <div className="partner-modal__section-head"><span>Proof vault</span><span className="mono-muted" style={{ fontSize: 10 }}>{vaultProof ? `${vaultProof.length} filed` : ""}</span></div>
                  <div className="partner-modal__section-body">
                    {partnerAssignments === null || vaultProof === null ? (
                      <span className="mono-muted" style={{ fontSize: 12 }}>Loading vault…</span>
                    ) : partnerAssignments.length === 0 ? (
                      <div style={{ display: "grid", gap: 8, justifyItems: "start" }}>
                        <span className="mono-muted" style={{ fontSize: 12 }}>No compliance forms assigned yet — assigning defines what proof is required.</span>
                        <button className="btn btn--primary btn--sm" onClick={() => selected && openAssign(selected)}>Assign the first form →</button>
                      </div>
                    ) : (
                      <div style={{ display: "grid", gap: 8 }}>
                        {partnerAssignments.slice(0, 4).map((a) => {
                          const proof = vaultProof
                            .filter((s) => s.form_id === a.form_id)
                            .sort((x, y) => new Date(y.submitted_at ?? y.created_at).getTime() - new Date(x.submitted_at ?? x.created_at).getTime())
                          const latest = proof[0]
                          return (
                            <div key={a.id} style={{ display: "grid", gap: 6, padding: "8px 10px", border: "1px solid var(--warm-gray)", borderRadius: 8, background: "var(--ivory)", minWidth: 0 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, minWidth: 0 }}>
                                <span style={{ fontSize: 12, fontWeight: 600, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.form_title ?? a.form_id.slice(0, 8)}</span>
                                <span className={`pill pill--${a.status === "submitted" ? "approved" : a.status === "revoked" ? "expired" : "submitted"}`} style={{ fontSize: 10, flexShrink: 0 }}>{a.status}</span>
                              </div>
                              {proof.length === 0 ? (
                                <span className="mono-muted" style={{ fontSize: 11 }}>No proof filed yet{a.due_at ? ` — due ${new Date(a.due_at).toLocaleDateString()}` : ""}</span>
                              ) : (
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                                  <span className="mono-muted" style={{ fontSize: 11 }}>{proof.length} filed • latest {latest.status} {latest.submitted_at ? new Date(latest.submitted_at).toLocaleDateString() : ""}</span>
                                  <Link to={`/submissions/${latest.id}`} className="btn btn--ghost btn--sm" onClick={() => setSelected(null)}>View proof →</Link>
                                </div>
                              )}
                            </div>
                          )
                        })}
                        {partnerAssignments.length > 4 && <span className="mono-muted" style={{ fontSize: 11 }}>+{partnerAssignments.length - 4} more in Assigned forms below</span>}
                        <div className="vault-total">
                          <span>Vault</span><span>{partnerAssignments.length} required • {vaultProof.length} filed • {vaultProof.filter((s) => s.status === "approved").length} approved</span>
                        </div>
                        <Link to="/vault" style={{ fontSize: 11, color: "var(--verdant)", textDecoration: "underline" }}>Open the vault →</Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="partner-modal__section partner-modal__section--flat">
                <div className="partner-modal__section-head"><span>Audit trail • last activity</span><span className="mono-muted" style={{ fontSize: 10 }}>{formatRelative(selected.updated_at)}</span></div>
                <div className="partner-modal__section-body">
                  <div className="partner-modal__timeline">
                    <div className="partner-modal__timeline-item"><span className="partner-modal__timeline-dot">✓</span><div className="partner-modal__timeline-copy"><strong>Partner record updated</strong><br /><span>{formatDate(selected.updated_at)} • {selected.status}</span></div></div>
                    <div className="partner-modal__timeline-item"><span className="partner-modal__timeline-dot">—</span><div className="partner-modal__timeline-copy"><strong>Created</strong><br /><span>{formatDate(selected.created_at)}</span></div></div>
                    <div className="partner-modal__timeline-item"><span className="partner-modal__timeline-dot">◷</span><div className="partner-modal__timeline-copy"><strong>Next step</strong><br /><span>{selected.status === "active" || selected.status === "approved" ? "No action — verified" : selected.status === "submitted" ? "Awaiting review by your org" : "Auto-reminder scheduled"}</span></div></div>
                  </div>
                </div>
              </div>

              <div className="partner-modal__section partner-modal__section--flat">
                <div className="partner-modal__section-head"><span>Invitations</span><span className="mono-muted" style={{ fontSize: 10 }}>{invitations ? `${invitations.length} sent` : " "} </span></div>
                <div className="partner-modal__section-body">
                  {(selected.status ?? "").toLowerCase() !== "active" && (selected.status ?? "").toLowerCase() !== "approved" && (
                    <button className="btn btn--primary" style={{ width: "100%", justifyContent: "center", minHeight: 36, fontSize: 12 }} onClick={() => openInvite(selected)}>Invite user →</button>
                  )}
                  {invitationsError && <div style={{ padding: "8px 10px", background: "#fdf0ef", border: "1px solid #e8c4c3", color: "#7a2e2c", fontFamily: "var(--mono)", fontSize: 11, borderRadius: 8 }}>{invitationsError}</div>}
                  {invitations === null && !invitationsError ? (
                    <span className="mono-muted" style={{ fontSize: 12 }}>Loading invitations…</span>
                  ) : invitations && invitations.length === 0 ? (
                    <span className="mono-muted" style={{ fontSize: 12 }}>{(selected.status ?? "").toLowerCase() === "active" || (selected.status ?? "").toLowerCase() === "approved" ? "No invitations sent." : "No invitations sent — invite a user to give them access."}</span>
                  ) : invitations && invitations.length > 0 ? (
                    <div style={{ display: "grid", gap: 8 }}>
                      {invitations.slice(0, 5).map((inv) => {
                        const isExpired = inv.status.toLowerCase() === "expired" || (inv.expires_at && new Date(inv.expires_at).getTime() < Date.now())
                        const pill = isExpired ? "expired" : inv.status.toLowerCase() === "accepted" ? "approved" : "pending"
                        const exp = inv.expires_at ? (() => { const d = new Date(inv.expires_at); const diff = d.getTime() - Date.now(); if (diff <= 0) return "Expired"; const hrs = Math.floor(diff / 3600000); if (hrs < 24) return `Expires in ${hrs}h`; const days = Math.floor(hrs/24); return `Expires in ${days}d` })() : ""
                        return (
                          <div key={inv.id} style={{ display: "grid", gap: 6, padding: "10px", border: "1px solid var(--warm-gray)", borderRadius: 8, background: "var(--ivory)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{inv.email}</span>
                              <span className={`pill pill--${pill}`} style={{ fontSize: 10 }}>{inv.status}</span>
                            </div>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                              <span className="mono-muted" style={{ fontSize: 10, background: "var(--surface)", border: "1px solid var(--warm-gray)", padding: "2px 6px", borderRadius: 6 }}>{inv.role_id}</span>
                              {exp && <span className="mono-muted" style={{ fontSize: 10, color: isExpired ? "var(--danger)" : "var(--slate-2)" }}>{exp}</span>}
                              <span className="mono-muted" style={{ fontSize: 10, marginLeft: "auto" }}>{formatDate(inv.created_at)}</span>
                            </div>
                          </div>
                        )
                      })}
                      {invitations.length > 5 && <span className="mono-muted" style={{ fontSize: 11 }}>+{invitations.length - 5} more</span>}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="partner-modal__section partner-modal__section--flat">
                <div className="partner-modal__section-head"><span>Lifecycle</span><span className="mono-muted" style={{ fontSize: 10 }}>{selected.status ?? "pending"}</span></div>
                <div className="partner-modal__section-body">
                  {lifecycleError && <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--danger)" }}>{lifecycleError}</div>}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {(selected.status ?? "").toLowerCase() !== "active" && (
                      <button className="btn btn--ghost btn--sm" disabled={lifecycleWorking} onClick={async () => {
                        setLifecycleWorking(true); setLifecycleError(null)
                        try {
                          const updated = await partnersApi.updatePartner(selected.id, { status: "active" })
                          const enriched = enrichPartner(updated)
                          setSelected(enriched)
                          setPartners((prev) => prev.map((p) => p.id === enriched.id ? enriched : p))
                        } catch (e) { setLifecycleError(e instanceof ApiError ? e.message : "Activate failed") }
                        finally { setLifecycleWorking(false) }
                      }}>Activate</button>
                    )}
                    <button className="btn btn--ghost btn--sm" disabled={lifecycleWorking} onClick={async () => {
                      setLifecycleWorking(true); setLifecycleError(null)
                      try {
                        const updated = await partnersApi.updatePartner(selected.id, { status: "suspended" })
                        const enriched = enrichPartner(updated)
                        setSelected(enriched)
                        setPartners((prev) => prev.map((p) => p.id === enriched.id ? enriched : p))
                      } catch (e) { setLifecycleError(e instanceof ApiError ? e.message : "Suspend failed") }
                      finally { setLifecycleWorking(false) }
                    }}>Suspend</button>
                    <button className="btn btn--ghost btn--sm" style={{ color: "var(--danger)" }} disabled={lifecycleWorking} onClick={async () => {
                      if (!confirm(`Offboard ${selected.name}? They will become inactive.`)) return
                      setLifecycleWorking(true); setLifecycleError(null)
                      try {
                        const updated = await partnersApi.updatePartner(selected.id, { status: "inactive" })
                        const enriched = enrichPartner(updated)
                        setSelected(enriched)
                        setPartners((prev) => prev.map((p) => p.id === enriched.id ? enriched : p))
                      } catch (e) { setLifecycleError(e instanceof ApiError ? e.message : "Offboard failed") }
                      finally { setLifecycleWorking(false) }
                    }}>Offboard → inactive</button>
                  </div>
                  <span className="mono-muted" style={{ fontSize: 11 }}>Suspended vendors can log in but cannot submit. PUT /partners/{"{id}"} {"{status}"}.</span>
                </div>
              </div>

              <div className="partner-modal__section partner-modal__section--flat">
                <div className="partner-modal__section-head">
                  <span>Assigned forms</span>
                  <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                    <span className="mono-muted" style={{ fontSize: 10 }}>{partnerAssignments ? `${partnerAssignments.length}` : ""}</span>
                    <button className="btn btn--primary btn--sm" onClick={() => { setAssignError(null); setAssignResult(null); setAssignOpen(true); if (formOptions.length === 0 && selected) openAssign(selected) }} style={{ minHeight: 30 }}>Assign form →</button>
                  </span>
                </div>
                <div className="partner-modal__section-body">
                  {(selected.status ?? "").toLowerCase() !== "active" && (selected.status ?? "").toLowerCase() !== "approved" && (
                    <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#7a5a2a", background: "#fdf8f0", border: "1px solid #e8d9b8", padding: "8px 10px", borderRadius: 8 }}>Partner is {selected.status ?? "pending"} — assignments require an active partner and an active form, or submits will be blocked.</div>
                  )}
                  {assignResult && <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--verdant)" }}>{assignResult}</div>}
                  {assignError && <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--danger)" }}>{assignError}</div>}
                  {partnerAssignments === null ? (
                    <span className="mono-muted" style={{ fontSize: 12 }}>Loading assignments…</span>
                  ) : partnerAssignments.length === 0 ? (
                    <div style={{ display: "grid", gap: 8, justifyItems: "start" }}>
                      <span className="mono-muted" style={{ fontSize: 12 }}>No compliance forms assigned yet.</span>
                      <button className="btn btn--primary btn--sm" onClick={() => selected && openAssign(selected)}>Assign the first form →</button>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: 8 }}>
                      {partnerAssignments.slice(0, 5).map((a) => (
                        <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", border: "1px solid var(--warm-gray)", borderRadius: 8, background: "var(--ivory)" }}>
                          <span style={{ fontSize: 12 }}><strong>{a.form_title ?? a.form_id.slice(0, 8)}</strong> <span className="mono-muted">• {a.status}{a.due_at ? ` • due ${new Date(a.due_at).toLocaleDateString()}` : ""}</span></span>
                          <span style={{ display: "inline-flex", gap: 6 }}>
                            <Link to={`/forms/${a.form_id}`} className="btn btn--ghost btn--sm" onClick={() => setSelected(null)}>Open</Link>
                            <button className="btn btn--ghost btn--sm" style={{ color: "var(--danger)" }} disabled={revokingId === a.form_id} onClick={() => handleRevoke(a.form_id)} title="Revoke — history kept, future submits blocked">{revokingId === a.form_id ? "Revoking…" : "Revoke"}</button>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="partner-modal__section partner-modal__section--flat">
                <div className="partner-modal__section-head"><span>Submissions</span><Link to={`/submissions?partner_id=${selected.id}`} style={{ fontSize: 11, color: "var(--verdant)", textDecoration: "underline" }} onClick={() => setSelected(null)}>Open filtered view →</Link></div>
                <div className="partner-modal__section-body">
                  {submissions === null ? (
                    <span className="mono-muted" style={{ fontSize: 12 }}>Loading submissions…</span>
                  ) : submissions.length === 0 ? (
                    <span className="mono-muted" style={{ fontSize: 12 }}>No submissions yet for this partner.</span>
                  ) : (
                    <div style={{ display: "grid", gap: 8 }}>
                      {(submissions as { id: string; status: string; created_at: string }[]).slice(0, 3).map((s) => (
                        <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", border: "1px solid var(--warm-gray)", borderRadius: 8, background: "var(--ivory)" }}>
                          <span style={{ fontFamily: "var(--mono)", fontSize: 11 }}>{s.id.slice(0, 8)} • {s.status}</span>
                          <Link to={`/submissions/${s.id}`} className="btn btn--ghost btn--sm" onClick={() => setSelected(null)}>View</Link>
                        </div>
                      ))}
                      {submissions.length > 3 && <span className="mono-muted" style={{ fontSize: 11 }}>+{submissions.length - 3} more • open full list</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="partner-modal__foot">
              {(selected.status ?? "").toLowerCase() !== "active" && (selected.status ?? "").toLowerCase() !== "approved" && (
                <button className="btn btn--ghost" onClick={() => { openInvite(selected) }} style={{ flex: 1, justifyContent: "center" }}>Invite user</button>
              )}
              <button className="btn btn--primary" onClick={() => selected && openAssign(selected)} style={{ flex: 1, justifyContent: "center" }}>Assign form →</button>
            </div>
          </div>
        </div>
      )}

      {assignOpen && selected && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={() => setAssignOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__head"><h3>Assign form — {selected.name}</h3><button className="dash__icon-btn" aria-label="Close" onClick={() => setAssignOpen(false)}>✕</button></div>
            <div className="modal__body">
              <label className="field"><span>Compliance forms * (only active forms can be assigned)</span>
                <select multiple value={assignFormIds} onChange={(e) => setAssignFormIds(Array.from(e.target.selectedOptions, (o) => o.value))} style={{ minHeight: 132 }}>
                  {formOptions.map((f) => (
                    <option key={f.id} value={f.id} disabled={f.status !== "active"}>{f.title} — {f.status}{f.status !== "active" ? " (must be active)" : ""}</option>
                  ))}
                </select>
                <span className="mono-muted" style={{ fontSize: 11 }}>{assignFormIds.length} selected. Already-assigned pairs are reported as skipped, nothing is duplicated.</span>
              </label>
              <label className="field"><span>Due date (optional)</span><input type="date" value={assignDueAt} onChange={(e) => setAssignDueAt(e.target.value)} style={{ minHeight: 44 }} /></label>
              {assignResult && <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--verdant)" }}>{assignResult}</div>}
              {assignError && <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--danger)" }}>{assignError}</div>}
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button className="btn btn--ghost" onClick={() => setAssignOpen(false)} disabled={assigning}>Cancel</button>
                <button className="btn btn--primary" onClick={handleAssign} disabled={assignFormIds.length === 0 || assigning}>{assigning ? "Assigning…" : `Assign ${assignFormIds.length || ""} to ${selected.name.split(" ")[0]}`}</button>
              </div>
              <p className="mono-muted" style={{ fontSize: 11, margin: 0 }}>The partner fills the form from their side. Revoke anytime from Assigned forms — history is kept, future submits are blocked.</p>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__head"><h3>Add partner</h3><button className="dash__icon-btn" aria-label="Close" onClick={() => setShowCreate(false)}>✕</button></div>
            <div className="modal__body">
              <label className="field"><span>Name *</span><input value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="e.g. Acme Vendors LLC" style={{ minHeight: 44 }} /></label>
              <label className="field"><span>Email</span><input value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} placeholder="ops@acme.co" style={{ minHeight: 44 }} /></label>
              <label className="field"><span>Phone</span><input value={createPhone} onChange={(e) => setCreatePhone(e.target.value)} placeholder="+1 415 555 01…" style={{ minHeight: 44 }} /></label>
              {createError && <div style={{ padding: "8px 10px", background: "#fdf0ef", border: "1px solid #e8c4c3", color: "#7a2e2c", fontFamily: "var(--mono)", fontSize: 12, borderRadius: 8 }}>{createError}</div>}
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button className="btn btn--ghost" onClick={() => setShowCreate(false)} disabled={creating}>Cancel</button>
                <button
                  className="btn btn--primary"
                  disabled={!createName.trim() || creating}
                  onClick={async () => {
                    if (!createName.trim()) return
                    setCreating(true); setCreateError(null)
                    try {
                      const p = await partnersApi.createPartner({ name: createName.trim(), email: createEmail.trim() || undefined, phone: createPhone.trim() || undefined })
                      setPartners((prev) => [enrichPartner(p), ...prev])
                      setShowCreate(false); setCreateName(""); setCreateEmail(""); setCreatePhone("")
                      setSelected(enrichPartner(p))
                    } catch (e) { setCreateError(e instanceof ApiError ? e.message : "Create failed") }
                    finally { setCreating(false) }
                  }}
                >{creating ? "Creating…" : "Create partner"}</button>
              </div>
              <p className="mono-muted" style={{ fontSize: 11, margin: 0 }}>Creates a partner under your organization. You can invite users after.</p>
            </div>
          </div>
        </div>
      )}

      {inviteFor && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={() => setInviteFor(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__head"><h3>Invite user — {inviteFor.name}</h3><button className="dash__icon-btn" aria-label="Close" onClick={() => setInviteFor(null)}>✕</button></div>
            <div className="modal__body">
              <label className="field"><span>Email *</span><input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="user@partner.co" style={{ minHeight: 44 }} /></label>
              <label className="field">
                <span>Role *</span>
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} style={{ minHeight: 44 }} disabled={inviteRolesLoading || inviteRoles.length === 0}>
                  {inviteRolesLoading && <option value="">Loading roles…</option>}
                  {!inviteRolesLoading && inviteRoles.length === 0 && <option value="">No assignable roles</option>}
                  {inviteRoles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
                <span className="mono-muted" style={{ fontSize: 11 }}>Sends the role UUID to the API.</span>
              </label>
              {inviteRolesError && <div style={{ padding: "8px 10px", background: "#fdf0ef", border: "1px solid #e8c4c3", color: "#7a2e2c", fontFamily: "var(--mono)", fontSize: 12, borderRadius: 8 }}>{inviteRolesError}</div>}
              {inviteError && <div style={{ padding: "8px 10px", background: "#fdf0ef", border: "1px solid #e8c4c3", color: "#7a2e2c", fontFamily: "var(--mono)", fontSize: 12, borderRadius: 8 }}>{inviteError}</div>}
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button className="btn btn--ghost" onClick={() => setInviteFor(null)} disabled={inviting}>Cancel</button>
                <button
                  className="btn btn--primary"
                  disabled={!inviteEmail.trim() || !inviteRole.trim() || inviting}
                  onClick={async () => {
                    if (!inviteEmail.trim() || !inviteRole.trim()) return
                    setInviting(true); setInviteError(null)
                    try {
                      const inv = await partnersApi.invitePartnerUser(inviteFor.id, { email: inviteEmail.trim(), role_id: inviteRole.trim() })
                      if (selected && selected.id === inviteFor.id) setInvitations((prev) => prev ? [inv, ...prev] : [inv])
                      setInviteFor(null); setInviteEmail(""); setInviteRole("")
                    } catch (e) { setInviteError(e instanceof ApiError ? e.message : "Invite failed — check org role") }
                    finally { setInviting(false) }
                  }}
                >{inviting ? "Sending…" : "Send invite"}</button>
              </div>
              <p className="mono-muted" style={{ fontSize: 11, margin: 0 }}>Creates an invitation for this partner. The user accepts via email link and creates their account.</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
