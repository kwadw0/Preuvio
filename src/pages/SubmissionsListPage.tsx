import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import "./DashboardPage.css"
import { ApiError } from "../lib/api"
import * as api from "../features/forms/api"
import type { EnrichedSubmissionResponse, FormResponse, PaginationMeta, SubmissionStatus } from "../features/forms/types"

function Pill({ status }: { status: string }) {
  const cls =
    status === "approved"
      ? "pill--approved"
      : status === "rejected"
        ? "pill--expired"
        : status === "pending"
          ? "pill--pending"
          : status === "in_review"
            ? "pill--submitted"
            : "pill--pending"
  return <span className={`pill ${cls}`}>{status}</span>
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return String(iso)
  }
}

export default function SubmissionsListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialStatus = (searchParams.get("status") as SubmissionStatus | null) ?? ""
  const initialQ = searchParams.get("q") ?? ""
  const initialForm = searchParams.get("form_id") ?? ""
  const initialPage = Number(searchParams.get("page") ?? "1")
  const initialLimit = Number(searchParams.get("limit") ?? "20")

  const [status, setStatus] = useState<string>(initialStatus)
  const [q, setQ] = useState(initialQ)
  const [qInput, setQInput] = useState(initialQ)
  const [formId, setFormId] = useState(initialForm)
  const [page, setPage] = useState(Number.isFinite(initialPage) && initialPage > 0 ? initialPage : 1)
  const [limit] = useState(Number.isFinite(initialLimit) && initialLimit > 0 ? initialLimit : 20)
  const [sort] = useState<"submitted_at" | "created_at">("submitted_at")
  const [order, setOrder] = useState<"asc" | "desc">("desc")

  const [forms, setForms] = useState<FormResponse[]>([])
  const [data, setData] = useState<EnrichedSubmissionResponse[]>([])
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, total_pages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<EnrichedSubmissionResponse | null>(null)
  const [reviewStatus, setReviewStatus] = useState<"approved" | "rejected" | "revision_required">("approved")
  const [reviewing, setReviewing] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)

  // debounce search q -> q filter
  useEffect(() => {
    const t = setTimeout(() => setQ(qInput.trim()), 380)
    return () => clearTimeout(t)
  }, [qInput])

  // load forms for filter dropdown (paginated helper, first page)
  useEffect(() => {
    void api.listForms().then(setForms).catch(() => {/* silent */})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.listSubmissions({
        status: status || undefined,
        form_id: formId || undefined,
        q: q || undefined,
        page,
        limit,
        sort,
        order,
      })
      setData(res.data)
      setMeta(res.meta)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load submissions")
    } finally {
      setLoading(false)
    }
  }, [status, formId, q, page, limit, sort, order])

  useEffect(() => {
    void load()
  }, [load])

  // sync URL
  useEffect(() => {
    const p = new URLSearchParams()
    if (status) p.set("status", status)
    if (formId) p.set("form_id", formId)
    if (q) p.set("q", q)
    if (page !== 1) p.set("page", String(page))
    if (limit !== 20) p.set("limit", String(limit))
    setSearchParams(p, { replace: true })
  }, [status, formId, q, page, limit, setSearchParams])

  // reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [status, formId, q])

  async function openSubmission(id: string) {
    try {
      const s = await api.getSubmission(id)
      setSelected(s)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Open failed")
    }
  }

  async function handleReview() {
    if (!selected) return
    setReviewing(true)
    try {
      const updated = await api.reviewSubmission(selected.id, reviewStatus)
      // enriched fields not returned by review — keep them from selected
      setSelected((prev) => (prev ? { ...prev, status: updated.status, reviewed_at: updated.reviewed_at, reviewed_by: updated.reviewed_by } as EnrichedSubmissionResponse : updated as unknown as EnrichedSubmissionResponse))
      await load()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Review failed — org members only")
    } finally {
      setReviewing(false)
    }
  }

  const pendingCount = useMemo(() => data.filter((s) => s.status === "pending").length, [data])

  return (
    <>
      <header className="dash__top">
        <button className="dash__icon-btn" aria-label="Toggle menu" onClick={() => setMobileNav((v) => !v)}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{mobileNav ? <path d="M18 6L6 18M6 6l12 12"/> : <><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></>}</svg></button>
        <span className="dash__crumb"><span>REVIEW</span><strong>Submissions</strong></span>
        <label className="dash__search" style={{ maxWidth: 360 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg><input placeholder="Search form, partner, responses…" value={qInput} onChange={(e) => setQInput(e.target.value)} /></label>
        <div className="dash__top-actions">
          <button className="btn btn--ghost" onClick={() => setOrder((o) => (o === "desc" ? "asc" : "desc"))} style={{ padding: "7px 12px" }}>{order === "desc" ? "Newest ↓" : "Oldest ↑"}</button>
          <Link className="btn btn--ghost" to="/forms" style={{ padding: "7px 12px" }}>Forms</Link>
        </div>
      </header>
      {mobileNav && <nav className="dash__mobile-nav"><Link to="/dashboard" onClick={() => setMobileNav(false)}>Overview</Link><Link to="/forms" onClick={() => setMobileNav(false)}>Forms</Link><Link to="/submissions" onClick={() => setMobileNav(false)}>Submissions</Link><Link to="/templates" onClick={() => setMobileNav(false)}>Templates</Link></nav>}

      <main className="dash__main">
        <div className="dash__ledger">
          <div className="dash__ledger-left"><span className="dash__ledger-kicker"><i /> Review • enriched</span><h1>Submissions</h1><p>Org-wide enriched submissions — search by form, partner, or response content. Single query with server pagination. Filter by status, form, or date — review stays pending → approved | rejected | revision_required.</p></div>
          <div className="dash__ledger-actions">
            <span className="mono-muted" style={{ fontSize: 11, background: "var(--ivory)", border: "1px solid var(--warm-gray)", padding: "6px 8px", borderRadius: 8 }}>{meta.total} total • page {meta.page} of {meta.total_pages}</span>
          </div>
        </div>

        <div className="dash__card">
          <div className="dash__card-head" style={{ flexWrap: "wrap", gap: 12 }}>
            <h2>Submissions <em>{meta.total}</em></h2>
            <div className="filter-pills">
              {(["all", "pending", "in_review", "approved", "rejected", "revision_required"] as const).map((s) => (
                <button key={s} className={(s === "all" ? !status : status === s) ? "is-active" : ""} onClick={() => setStatus(s === "all" ? "" : s)}>{s === "all" ? "All" : s}</button>
              ))}
            </div>
          </div>

          <div className="dash__toolbar" style={{ gap: 8 }}>
            <label className="dash__search" style={{ flex: 1, minWidth: 180 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
              <input placeholder="Filter submissions (form, partner, value)…" value={qInput} onChange={(e) => setQInput(e.target.value)} />
            </label>
            <select value={formId} onChange={(e) => setFormId(e.target.value)} style={{ minHeight: 36, padding: "6px 8px", borderRadius: 8, border: "1px solid var(--warm-gray)", fontSize: 12, background: "white", minWidth: 160 }}>
              <option value="">All forms</option>
              {forms.map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}
            </select>
            <span className="mono-muted" style={{ fontSize: 11 }}>{loading ? "Loading…" : `${data.length} on page • ${pendingCount} pending`}</span>
          </div>

          {error && <div style={{ padding: "10px 14px", background: "#fdf0ef", borderBottom: "1px solid #e8c4c3", color: "#7a2e2c", fontFamily: "var(--mono)", fontSize: 12 }}>{error}</div>}

          <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 420px" : "1fr", gap: 16, alignItems: "start", padding: selected ? 16 : 0, background: selected ? "var(--ivory)" : undefined }}>
            <div className="dash__card" style={{ overflow: "hidden", margin: selected ? 0 : undefined }}>
              <div style={{ overflowX: "auto" }}>
                <table className="dash__table">
                  <thead><tr><th>Form</th><th>Partner</th><th>Status</th><th>Submitted</th><th></th></tr></thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={5} style={{ textAlign: "center", padding: 24, color: "var(--slate)", fontFamily: "var(--mono)", fontSize: 12 }}>Loading submissions…</td></tr>
                    ) : data.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: "center", padding: 24, color: "var(--muted)", fontFamily: "var(--mono)", fontSize: 12 }}>No submissions match your filters.</td></tr>
                    ) : (
                      data.map((s) => (
                        <tr key={s.id} style={selected?.id === s.id ? { background: "var(--ivory)" } : undefined}>
                          <td>
                            <div style={{ display: "grid", gap: 2 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--graphite)", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.form_title ?? s.form_id.slice(0, 8)}</span>
                              <span className="mono-muted" style={{ fontSize: 11 }}>{s.form_status ?? "—"} • {s.form_id.slice(0, 8)}</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: "grid" }}>
                              <span style={{ fontSize: 13, fontWeight: 600 }}>{s.partner_name ?? "—"}</span>
                              <span className="mono-muted" style={{ fontSize: 11, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.partner_email ?? s.partner_id?.slice(0, 8) ?? "—"}</span>
                            </div>
                          </td>
                          <td><Pill status={s.status} /></td>
                          <td><span className="mono-muted" style={{ fontSize: 11 }}>{formatDate(s.submitted_at ?? s.created_at)}</span></td>
                          <td style={{ textAlign: "right" }}><button className="btn btn--ghost btn--sm" onClick={() => openSubmission(s.id)}>View</button></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* pagination */}
              <div className="partners__pagination" style={{ borderTop: "1px solid var(--warm-gray)", padding: "10px 14px" }}>
                <span className="partners__pagination-info">Page {meta.page} of {meta.total_pages} • {meta.total} submissions</span>
                <div className="partners__pagination-actions">
                  <button className="partners__page-btn" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button>
                  <span className="mono-muted" style={{ padding: "6px 8px", fontSize: 12, background: "var(--ivory)", border: "1px solid var(--warm-gray)", borderRadius: 6, minWidth: 72, textAlign: "center" }}>{page} / {meta.total_pages}</span>
                  <button className="partners__page-btn" disabled={page >= meta.total_pages || loading} onClick={() => setPage((p) => Math.min(meta.total_pages, p + 1))}>›</button>
                </div>
                <Link to={`/submissions/${data[0]?.id ?? ""}`} className="mono-muted" style={{ fontSize: 11, opacity: 0.5, pointerEvents: "none" }}>{limit} per page</Link>
              </div>
            </div>

            {selected && (
              <div className="dash__card" style={{ position: "sticky", top: 72 }}>
                <div className="dash__card-head"><h2>Submission <em>{selected.id.slice(0, 8)}</em></h2><button className="dash__icon-btn" aria-label="Close" onClick={() => setSelected(null)}>✕</button></div>
                <div style={{ padding: 14, display: "grid", gap: 12 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}><Pill status={selected.status} /><span className="mono-muted" style={{ fontSize: 11 }}>{formatDate(selected.submitted_at)}</span>{selected.reviewed_at ? <span className="mono-muted" style={{ fontSize: 11 }}>reviewed {formatDate(selected.reviewed_at)} by {selected.reviewed_by?.slice(0, 8) ?? "—"}</span> : null}</div>
                  <div style={{ display: "grid", gap: 2 }}>
                    <span style={{ fontSize: 12, color: "var(--slate-2)", fontFamily: "var(--mono)" }}>Form</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{selected.form_title ?? selected.form_id}</span>
                    <span style={{ fontSize: 11, color: "var(--slate)" }}>{selected.partner_name ? `${selected.partner_name} • ${selected.partner_email ?? ""}` : selected.partner_id ?? "—"}</span>
                  </div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {Object.entries(selected.responses).map(([k, v]) => (
                      <div key={k} style={{ display: "grid", gap: 4, padding: 10, border: "1px solid var(--warm-gray)", borderRadius: 8, background: "var(--ivory)" }}>
                        <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: "var(--graphite)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k}</span>
                        <span style={{ fontSize: 13, color: "var(--graphite)", wordBreak: "break-word" }}>{Array.isArray(v) ? (v as unknown[]).join(", ") : String(v ?? "—")}</span>
                      </div>
                    ))}
                    {Object.keys(selected.responses).length === 0 && <span className="mono-muted">No responses</span>}
                  </div>
                  <div style={{ borderTop: "1px solid var(--warm-gray)", paddingTop: 12, display: "grid", gap: 8 }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Review</span>
                    <select value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value as never)} style={{ minHeight: 44, padding: "8px 10px", border: "1px solid var(--warm-gray)", borderRadius: 8 }}>
                      <option value="approved">approved</option>
                      <option value="rejected">rejected</option>
                      <option value="revision_required">revision_required — needs changes</option>
                    </select>
                    <button className="btn btn--primary" onClick={handleReview} disabled={reviewing} style={{ minHeight: 44 }}>{reviewing ? "Reviewing…" : "Submit review"}</button>
                  </div>
                  <div style={{ display: "grid", gap: 8 }}>
                    <Link className="btn btn--ghost" to={`/submissions/${selected.id}`} style={{ justifyContent: "center", minHeight: 44 }}>Open standalone</Link>
                    <Link className="btn btn--ghost" to={`/forms/${selected.form_id}/submissions`} style={{ justifyContent: "center", minHeight: 36, fontSize: 12 }}>View form submissions</Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
