import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import "./DashboardPage.css"
import { ApiError } from "../lib/api"
import * as api from "../features/forms/api"
import { usePartnerProfile } from "../features/partners/usePartnerProfile"
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
  return <span className={`pill ${cls}`}>{status.replace("_", " ")}</span>
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
}

export default function SubmissionsListPage() {
  const { isPartner } = usePartnerProfile()
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
  const [mobileNav, setMobileNav] = useState(false)

  // debounce search q -> q filter
  useEffect(() => {
    const t = setTimeout(() => setQ(qInput.trim()), 380)
    return () => clearTimeout(t)
  }, [qInput])  // Form filter is an org capability; partners see only their own submissions.
  useEffect(() => {
    if (isPartner) return
    void api.listForms().then(setForms).catch(() => {/* silent */})
  }, [isPartner])

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

  const pendingCount = useMemo(() => data.filter((s) => s.status === "pending").length, [data])

  return (
    <>
      <header className="dash__top">
        <button className="dash__icon-btn" aria-label="Toggle menu" onClick={() => setMobileNav((v) => !v)}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{mobileNav ? <path d="M18 6L6 18M6 6l12 12"/> : <><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></>}</svg></button>
        <span className="dash__crumb"><span>{isPartner ? "SUBMISSIONS" : "REVIEW"}</span><strong>{isPartner ? "My submissions" : "Submissions"}</strong></span>
        <div className="dash__top-actions">
          <button className="btn btn--ghost" onClick={() => setOrder((o) => (o === "desc" ? "asc" : "desc"))} style={{ padding: "7px 12px" }}>{order === "desc" ? "Newest ↓" : "Oldest ↑"}</button>
          {!isPartner && <Link className="btn btn--ghost" to="/forms" style={{ padding: "7px 12px" }}>Forms</Link>}
        </div>
      </header>
      {mobileNav && (
        <nav className="dash__mobile-nav">
          {isPartner ? (
            <>
              <Link to="/assignments" onClick={() => setMobileNav(false)}>My work</Link>
              <Link to="/submissions" onClick={() => setMobileNav(false)}>My submissions</Link>
              <Link to="/vault" onClick={() => setMobileNav(false)}>Proof vault</Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" onClick={() => setMobileNav(false)}>Overview</Link>
              <Link to="/forms" onClick={() => setMobileNav(false)}>Forms</Link>
              <Link to="/submissions" onClick={() => setMobileNav(false)}>Submissions</Link>
              <Link to="/templates" onClick={() => setMobileNav(false)}>Templates</Link>
            </>
          )}
        </nav>
      )}

      <main className="dash__main">
        <div className="dash__ledger">
          <div className="dash__ledger-left">
            <span className="dash__ledger-kicker"><i /> {isPartner ? "Your record • submissions" : "Review • enriched"}</span>
            <h1>{isPartner ? "My submissions" : "Submissions"}</h1>
            <p>
              {isPartner
                ? "Everything you have submitted to this organization. Open a submission to see your answers exactly as they were recorded, plus the review status."
                : "Every answer your partners have submitted, searchable by form, partner, or response content. Open one to review it in full — the decision is recorded on its own page."}
            </p>
          </div>
          <div className="dash__ledger-actions">
            <span className="mono-muted" style={{ fontSize: 11, background: "var(--ivory)", border: "1px solid var(--warm-gray)", padding: "6px 8px", borderRadius: 8 }}>{meta.total} total • page {meta.page} of {meta.total_pages}</span>
          </div>
        </div>

        <div className="dash__card">
          <div className="dash__card-head" style={{ flexWrap: "wrap", gap: 12 }}>
            <h2>Submissions <em>{meta.total}</em></h2>
            <div className="filter-pills">
              {(["all", "pending", "in_review", "approved", "rejected", "revision_required"] as const).map((s) => (
                <button key={s} className={(s === "all" ? !status : status === s) ? "is-active" : ""} onClick={() => { setStatus(s === "all" ? "" : s); setPage(1) }}>{s === "all" ? "All" : s.replace("_", " ")}</button>
              ))}
            </div>
          </div>

          <div className="dash__toolbar" style={{ gap: 8 }}>
            <label className="dash__search" style={{ flex: 1, minWidth: 180 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
              <input placeholder="Filter submissions (form, partner, value)…" value={qInput} onChange={(e) => setQInput(e.target.value)} />
            </label>
            {!isPartner && (
              <select value={formId} onChange={(e) => { setFormId(e.target.value); setPage(1) }} style={{ minHeight: 36, padding: "6px 8px", borderRadius: 8, border: "1px solid var(--warm-gray)", fontSize: 12, background: "white", minWidth: 160 }}>
                <option value="">All forms</option>
                {forms.map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}
              </select>
            )}
            <span className="mono-muted" style={{ fontSize: 11 }}>{loading ? "Loading…" : `${data.length} on page • ${pendingCount} pending`}</span>
          </div>

          {error && <div style={{ padding: "10px 14px", background: "#fdf0ef", borderBottom: "1px solid #e8c4c3", color: "#7a2e2c", fontFamily: "var(--mono)", fontSize: 12 }}>{error}</div>}

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
                    <tr key={s.id}>
                      <td>
                        <div style={{ display: "grid", gap: 2 }}>
                          <Link to={`/submissions/${s.id}`} style={{ fontSize: 13, fontWeight: 600, color: "var(--graphite)", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.form_title ?? s.form_id.slice(0, 8)}</Link>
                          <span className="mono-muted" style={{ fontSize: 11 }}>{s.form_status ?? "—"} • {s.form_id.slice(0, 8)}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "grid" }}>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{s.partner_name ?? "—"}</span>
                          <span className="mono-muted" style={{ fontSize: 11, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.partner_email ?? s.partner_id?.slice(0, 8) ?? "—"}</span>
                        </div>
                      </td>
                      <td><Pill status={s.status} /></td>
                      <td><span className="mono-muted" style={{ fontSize: 11 }}>{formatDate(s.submitted_at ?? s.created_at)}</span></td>
                      <td style={{ textAlign: "right" }}><Link className="btn btn--ghost btn--sm" to={`/submissions/${s.id}`}>View →</Link></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="partners__pagination" style={{ borderTop: "1px solid var(--warm-gray)", padding: "10px 14px" }}>
            <span className="partners__pagination-info">Page {meta.page} of {meta.total_pages} • {meta.total} submissions</span>
            <div className="partners__pagination-actions">
              <button className="partners__page-btn" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button>
              <span className="mono-muted" style={{ padding: "6px 8px", fontSize: 12, background: "var(--ivory)", border: "1px solid var(--warm-gray)", borderRadius: 6, minWidth: 72, textAlign: "center" }}>{page} / {meta.total_pages}</span>
              <button className="partners__page-btn" disabled={page >= meta.total_pages || loading} onClick={() => setPage((p) => Math.min(meta.total_pages, p + 1))}>›</button>
            </div>
            <span className="mono-muted" style={{ fontSize: 11, opacity: 0.6 }}>{limit} per page</span>
          </div>
        </div>
      </main>
    </>
  )
}
