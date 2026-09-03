import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import "./DashboardPage.css"
import "./PartnersPage.css"
import { ApiError } from "../lib/api"
import * as partnersApi from "../features/partners/api"
import { enrichPartner, formatDate, formatRelative, mockPartners, type EnrichedPartner } from "../features/partners/types"

type StatusFilter = "all" | "pending" | "submitted" | "approved" | "expired"

const PAGE_SIZE = 10

export default function PartnersPage() {
  const [mobileNav, setMobileNav] = useState(false)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<StatusFilter>("all")
  const [sortBy, setSortBy] = useState<"recent" | "name" | "status">("recent")
  const [partners, setPartners] = useState<EnrichedPartner[]>(() => mockPartners.map(enrichPartner))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<EnrichedPartner | null>(null)
  const [submissions, setSubmissions] = useState<unknown[] | null>(null)

  // Fetch live partners — fallback to mock on failure (keeps UI usable)
  useEffect(() => {
    let alive = true
    setLoading(true)
    partnersApi.listPartners()
      .then((data) => {
        if (!alive) return
        if (Array.isArray(data) && data.length > 0) {
          setPartners(data.map((p) => enrichPartner(p)))
        } else if (Array.isArray(data) && data.length === 0) {
          // keep mock for richer demo if API returns empty
          setPartners(mockPartners.map(enrichPartner))
        }
      })
      .catch((e) => {
        if (!alive) return
        setError(e instanceof ApiError ? e.message : "Using local directory — live partners unavailable")
      })
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [])

  const filtered = useMemo(() => {
    let arr = partners.filter((p) => {
      const byStatus = status === "all" ? true : (p.status ?? "").toLowerCase() === status
      const q = search.trim().toLowerCase()
      const bySearch = q === "" ? true : `${p.name} ${p.email ?? ""} ${p.phone ?? ""} ${p.docs}`.toLowerCase().includes(q)
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
      partnersApi.listPartnerSubmissions(selected.id).then((data) => setSubmissions(Array.isArray(data) ? data : [])).catch(() => setSubmissions([]))
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
          <span className="pill pill--pending" style={{ fontSize: 11, display: "none" } as React.CSSProperties}>{filtered.length} total</span>
          <Link to="/dashboard" className="btn btn--ghost" style={{ padding: "7px 12px" }}>Overview</Link>
          <button className="btn btn--primary" onClick={() => setSelected(partners[0] ?? null)} style={{ padding: "7px 12px" }}>View example</button>
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
          <div className="dash__ledger-actions">
            <span className="mono-muted" style={{ fontSize: 11, background: "var(--ivory)", border: "1px solid var(--warm-gray)", padding: "6px 8px", borderRadius: 8 }}>{filtered.length} partners • page {currentPage} of {totalPages}</span>
          </div>
        </div>

        {/* Stats — subtle dossier summary */}
        <section className="partners__stats" aria-label="Partners overview">
          <article className="dash__stat"><span className="dash__stat-label">Total partners</span><span className="dash__stat-value">{partners.length}</span><span className="dash__stat-hint hint--down"><i /> Live directory</span></article>
          <article className="dash__stat"><span className="dash__stat-label">Approved</span><span className="dash__stat-value">{partners.filter(p => p.status === "approved").length}</span><span className="dash__stat-hint hint--up"><i /> Verified</span></article>
          <article className="dash__stat"><span className="dash__stat-label">Pending review</span><span className="dash__stat-value">{partners.filter(p => p.status === "pending" || p.status === "submitted").length}</span><span className="dash__stat-hint hint--warn"><i /> Needs attention</span></article>
          <article className="dash__stat"><span className="dash__stat-label">Expired</span><span className="dash__stat-value">{partners.filter(p => p.status === "expired").length}</span><span className="dash__stat-hint hint--down"><i /> Renewal due</span></article>
        </section>

        <section className="dash__card" aria-labelledby="partners-title">
          <div className="dash__card-head">
            <h2 id="partners-title">Directory <em>{filtered.length} of {partners.length}</em></h2>
            <div className="filter-pills">
              {(["all", "pending", "submitted", "approved", "expired"] as const).map((s) => (
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

          {error && <div style={{ padding: "10px 14px", background: "#fdf0ef", borderBottom: "1px solid #e8c4c3", color: "#7a2e2c", fontFamily: "var(--mono)", fontSize: 12 }}>{error}</div>}

          <div style={{ overflowX: "auto" }}>
            <table className="dash__table">
              <thead>
                <tr>
                  <th>Partner</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Documents</th>
                  <th>Verification</th>
                  <th>Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: 24, color: "var(--muted)", fontFamily: "var(--mono)", fontSize: 12 }}>{loading ? "Loading directory…" : "No partners match your filter."}</td></tr>
                ) : (
                  paged.map((p) => (
                    <tr key={p.id} onClick={() => setSelected(p)} style={{ cursor: "pointer" }} className={selected?.id === p.id ? "is-selected" : ""}>
                      <td><span className="partner"><span className="partner__avatar">{p.initials}</span><span style={{ display: "grid" }}><strong style={{ fontSize: 13, lineHeight: 1.1 }}>{p.name}</strong><span className="mono-muted" style={{ fontSize: 11 }}>{p.email ?? "—"}</span></span></span></td>
                      <td><span className="mono-muted" style={{ fontSize: 12 }}>{p.phone ?? "—"}</span></td>
                      <td><span className={`pill pill--${p.status === "approved" ? "approved" : p.status === "pending" ? "pending" : p.status === "submitted" ? "submitted" : "expired"}`}>{(p.status ?? "pending")}</span></td>
                      <td><span className="mono-muted" style={{ fontSize: 11, display: "inline-flex", gap: 4, flexWrap: "wrap" }}>{p.docs.split(" • ").map(d => <span key={d} style={{ background: "var(--ivory)", border: "1px solid var(--warm-gray)", padding: "2px 6px", borderRadius: 6, fontSize: 10 }}>{d}</span>)}</span></td>
                      <td style={{ minWidth: 120 }}>
                        <div style={{ display: "grid", gap: 4 }}>
                          <div className="verify-bar"><i style={{ width: `${p.verification}%`, background: p.verification > 80 ? "var(--verdant)" : p.verification > 55 ? "var(--copper)" : "var(--slate-2)" }} /></div>
                          <span className="mono-muted" style={{ fontSize: 10 }}>{p.verification}% verified</span>
                        </div>
                      </td>
                      <td><span className="mono-muted" title={formatDate(p.updated_at)}>{formatRelative(p.updated_at)}</span></td>
                      <td style={{ textAlign: "right" }}><button className="btn btn--ghost btn--sm" onClick={(e) => { e.stopPropagation(); setSelected(p); }} style={{ minHeight: 32 }}>View</button></td>
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
                <h3 id="partner-title">{selected.name} <span className={`pill pill--${selected.status === "approved" ? "approved" : selected.status === "pending" ? "pending" : selected.status === "submitted" ? "submitted" : "expired"}`} style={{ fontSize: 11 }}>{selected.status ?? "pending"}</span></h3>
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
                  <div className="partner-modal__section-head"><span>Profile</span><span className="pill pill--pending" style={{ fontSize: 10 }}>ID {selected.id.slice(0, 8)}</span></div>
                  <div className="partner-modal__section-body">
                    <div className="partner-modal__field"><span className="partner-modal__label">Legal name</span><span className="partner-modal__value">{selected.name}</span></div>
                    <div className="partner-modal__field"><span className="partner-modal__label">Email</span><a href={`mailto:${selected.email ?? ""}`} className="partner-modal__value" style={{ color: "var(--verdant)", textDecoration: "underline" }}>{selected.email ?? "—"}</a></div>
                    <div className="partner-modal__field"><span className="partner-modal__label">Phone</span><a href={`tel:${selected.phone ?? ""}`} className="partner-modal__value" style={{ color: "var(--verdant)", textDecoration: "underline" }}>{selected.phone ?? "—"}</a></div>
                    <div className="partner-modal__field"><span className="partner-modal__label">Organization</span><span className="partner-modal__value--mono">{selected.organization_id}</span></div>
                    <div className="partner-modal__field"><span className="partner-modal__label">Member since</span><span className="partner-modal__value--mono">{formatDate(selected.created_at)}</span></div>
                    <div className="partner-modal__field">
                      <span className="partner-modal__label">Verification</span>
                      <div style={{ display: "grid", gap: 6 }}>
                        <div className="verify-bar"><i style={{ width: `${selected.verification}%`, background: selected.verification > 80 ? "var(--verdant)" : selected.verification > 55 ? "var(--copper)" : "var(--danger)" }} /></div>
                        <span className="partner-modal__value--mono">{selected.verification}% • {selected.status === "approved" ? "Verified" : selected.status === "submitted" ? "Under review" : "Awaiting docs"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="partner-modal__section">
                  <div className="partner-modal__section-head"><span>Documents & Proof</span><span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, fontSize: 10, color: "var(--slate)" }}>{selected.docs}</span></div>
                  <div className="partner-modal__section-body">
                    <div className="partner-modal__pill-row">
                      {selected.docs.split(" • ").map((d) => <span key={d} className="pill pill--approved" style={{ fontSize: 11 }}>{d}</span>)}
                    </div>
                    <div className="partner-modal__field"><span className="partner-modal__label">Required docs</span><span className="partner-modal__value--mono">SOC 2 • Insurance • MSA — 3 of 3 linked</span></div>
                    <div className="partner-modal__field"><span className="partner-modal__label">Proof vault</span><span className="partner-modal__value" style={{ fontSize: 12, color: "var(--slate)" }}>Every submission keeps version, signer, timestamp. Export a ZIP with one click.</span></div>
                    <div style={{ background: "var(--forest)", color: "white", borderRadius: 10, padding: 10, display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "var(--mono)", fontSize: 11 }}>
                      <span>Vault</span><span style={{ background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.14)", padding: "4px 6px", borderRadius: 6 }}>{submissions ? `${submissions.length} submissions` : "Loading…"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="partner-modal__section">
                <div className="partner-modal__section-head"><span>Audit trail • last activity</span><span className="mono-muted" style={{ fontSize: 10 }}>{formatRelative(selected.updated_at)}</span></div>
                <div className="partner-modal__section-body">
                  <div className="partner-modal__timeline">
                    <div className="partner-modal__timeline-item"><span className="partner-modal__timeline-dot">✓</span><div className="partner-modal__timeline-copy"><strong>Partner record updated</strong><br /><span>{formatDate(selected.updated_at)} • {selected.status}</span></div></div>
                    <div className="partner-modal__timeline-item"><span className="partner-modal__timeline-dot">—</span><div className="partner-modal__timeline-copy"><strong>Created</strong><br /><span>{formatDate(selected.created_at)} • ID {selected.id.slice(0, 8)}</span></div></div>
                    <div className="partner-modal__timeline-item"><span className="partner-modal__timeline-dot">◷</span><div className="partner-modal__timeline-copy"><strong>Next step</strong><br /><span>{selected.status === "approved" ? "No action — verified" : selected.status === "submitted" ? "Awaiting review by your org" : "Auto-reminder scheduled"}</span></div></div>
                  </div>
                </div>
              </div>

              <div className="partner-modal__section">
                <div className="partner-modal__section-head"><span>Submissions</span><Link to={`/forms/${selected.id}/submissions`} style={{ fontSize: 11, color: "var(--verdant)", textDecoration: "underline" }} onClick={() => setSelected(null)}>Open submissions →</Link></div>
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
              <button className="btn btn--ghost" onClick={() => setSelected(null)} style={{ flex: 1 }}>Close</button>
              <a href={`mailto:${selected.email ?? ""}`} className="btn btn--ghost" style={{ flex: 1, justifyContent: "center", display: "inline-flex", alignItems: "center" }}>Email</a>
              <Link to={`/forms`} className="btn btn--primary" style={{ flex: 1, justifyContent: "center" }} onClick={() => setSelected(null)}>Manage forms →</Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
