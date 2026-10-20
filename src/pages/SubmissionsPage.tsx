import { useCallback, useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import "./DashboardPage.css"
import { ApiError } from "../lib/api"
import * as api from "../features/forms/api"
import type { EnrichedSubmissionResponse, FormDetailResponse, PaginationMeta } from "../features/forms/types"

export default function SubmissionsPage() {
  const { formId, id } = useParams<{ formId: string; id: string }>()
  const resolvedFormId = formId ?? id

  const [formDetail, setFormDetail] = useState<FormDetailResponse | null>(null)
  const [subs, setSubs] = useState<EnrichedSubmissionResponse[]>([])
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, total_pages: 1 })
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [q, setQ] = useState("")
  const [qInput, setQInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { const t = setTimeout(() => setQ(qInput.trim()), 320); return () => clearTimeout(t) }, [qInput])

  const load = useCallback(async () => {
    if (!resolvedFormId) return
    setLoading(true)
    try {
      const [fd, paged] = await Promise.all([
        api.getFormDetail(resolvedFormId),
        api.listSubmissions({ form_id: resolvedFormId, status: statusFilter || undefined, q: q || undefined, page, limit, sort: "submitted_at", order: "desc" }),
      ])
      setFormDetail(fd)
      setSubs(paged.data)
      setMeta(paged.meta)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Load failed")
    } finally {
      setLoading(false)
    }
  }, [resolvedFormId, statusFilter, q, page, limit])
  useEffect(() => { void load() }, [load])

  const keyToLabel = (() => {
    if (!formDetail) return new Map<string, string>()
    const m = new Map<string, string>()
    for (const sec of formDetail.sections) for (const f of sec.fields) m.set(f.key, f.label)
    return m
  })()

  if (loading && !formDetail) return <div className="dash__main" style={{ padding: 24, fontFamily: "var(--mono)", color: "var(--slate)" }}>Loading submissions…</div>

  return (
    <>
      <header className="dash__top">
        <span className="dash__crumb">
          <Link to="/forms" style={{ color: "inherit" }}>Forms</Link>
          <span aria-hidden>/</span>
          <strong>{formDetail?.form.title ?? "Submissions"}</strong>
        </span>
        <div className="dash__top-actions">
          <Link className="btn btn--ghost" to={resolvedFormId ? `/forms/${resolvedFormId}` : "/forms"}>Open form</Link>
          <Link className="btn btn--ghost" to="/submissions">All submissions</Link>
        </div>
      </header>

      <main className="dash__main">
        <div className="dash__ledger">
          <div className="dash__ledger-left">
            <span className="dash__ledger-kicker"><i /> Responses • {formDetail?.form.title ?? "form"}</span>
            <h1 style={{ fontSize: 26 }}>Submissions {meta.total ? `• ${meta.total}` : ""}</h1>
            <p>Every response to this form. Open one to read its answers in full and record a decision on its own page.</p>
          </div>
          <div className="dash__ledger-actions">
            <span className="mono-muted" style={{ fontSize: 11, background: "var(--ivory)", border: "1px solid var(--warm-gray)", padding: "6px 8px", borderRadius: 8 }}>{formDetail?.form.status ?? "form"}</span>
          </div>
        </div>

        {error && <div className="dash__card" style={{ padding: 10, color: "var(--danger)", background: "#fdf0ef", fontFamily: "var(--mono)", fontSize: 12 }}>{error}</div>}

        <div className="dash__card" style={{ overflow: "hidden" }}>
          <div className="dash__toolbar" style={{ gap: 8 }}>
            <label className="dash__search" style={{ flex: 1, minWidth: 180 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg><input placeholder="Search responses…" value={qInput} onChange={(e) => { setQInput(e.target.value); setPage(1) }} /></label>
            <div className="filter-pills">
              {(["all","pending","in_review","approved","rejected","revision_required"] as const).map((s) => (
                <button key={s} className={(s==="all"? !statusFilter : statusFilter===s) ? "is-active": ""} onClick={() => { setStatusFilter(s==="all"?"":s); setPage(1) }}>{s==="all"?"All":s.replace("_"," ")}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="dash__card" style={{ overflow: "hidden" }}>
          <div className="dash__card-head"><h2>Submissions <em>{meta.total}</em></h2><span className="pill pill--pending" style={{ fontSize: 11 }}>{subs.filter(s=>s.status==="pending").length} pending on page</span></div>
          <div style={{ overflowX: "auto" }}>
            <table className="dash__table">
              <thead><tr><th>Status</th><th>Partner</th><th>Key → value (preview)</th><th>Submitted</th><th></th></tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ textAlign: "center", padding: 24, color: "var(--slate)", fontFamily: "var(--mono)", fontSize: 12 }}>Loading…</td></tr>
                ) : subs.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: "center", padding: 24, color: "var(--muted)", fontFamily: "var(--mono)", fontSize: 12 }}>No submissions yet — fill the form to create one.</td></tr>
                ) : (
                  subs.map((s) => (
                    <tr key={s.id}>
                      <td><span className={`pill pill--${s.status==="approved"?"approved": s.status==="pending"?"pending": s.status==="rejected"?"expired": s.status==="in_review"?"submitted":"pending"}`}>{s.status.replace("_"," ")}</span></td>
                      <td><span className="mono-muted" style={{ fontSize: 12, display: "block", maxWidth: 160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{s.partner_name ?? s.partner_email ?? s.partner_id?.slice(0,8) ?? "—"}</span></td>
                      <td><span className="mono-muted" style={{ display: "block", maxWidth: 320, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{Object.entries(s.responses).slice(0,3).map(([k,v])=> `${keyToLabel.get(k) ?? k}: ${String(v)}`).join(" • ") || "—"}</span></td>
                      <td><span className="mono-muted">{s.submitted_at ? new Date(s.submitted_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : s.created_at ? new Date(s.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—"}</span></td>
                      <td style={{ textAlign:"right"}}><Link className="btn btn--ghost btn--sm" to={`/submissions/${s.id}`}>View →</Link></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="partners__pagination" style={{ borderTop: "1px solid var(--warm-gray)", padding: "10px 14px" }}>
            <span className="partners__pagination-info">Page {meta.page} of {meta.total_pages} • {meta.total} total</span>
            <div className="partners__pagination-actions">
              <button className="partners__page-btn" disabled={page<=1 || loading} onClick={()=>setPage(p=>Math.max(1,p-1))}>‹</button>
              <span className="mono-muted" style={{ padding: "6px 8px", fontSize: 12, background: "var(--ivory)", border: "1px solid var(--warm-gray)", borderRadius: 6 }}>{page} / {meta.total_pages}</span>
              <button className="partners__page-btn" disabled={page>=meta.total_pages || loading} onClick={()=>setPage(p=>Math.min(meta.total_pages,p+1))}>›</button>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
