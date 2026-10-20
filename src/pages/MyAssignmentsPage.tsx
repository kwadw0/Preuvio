import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import "./DashboardPage.css"
import { ApiError } from "../lib/api"
import * as assignmentsApi from "../features/assignments/api"
import * as formsApi from "../features/forms/api"
import { usePartnerProfile } from "../features/partners/usePartnerProfile"
import { formatRelative } from "../features/partners/types"
import type { AssignmentResponse } from "../features/assignments/types"
import type { EnrichedSubmissionResponse } from "../features/forms/types"

type QueueFilter = "all" | "assigned" | "submitted" | "overdue" | "revoked"

const PAGE_SIZE = 8

function isOverdue(a: AssignmentResponse): boolean {
  if (a.status === "submitted" || a.status === "revoked") return false
  if (a.status === "overdue") return true
  if (!a.due_at) return false
  return new Date(a.due_at).getTime() < Date.now()
}

function submissionPill(status: string): { cls: string; label: string } {
  switch (status) {
    case "approved": return { cls: "pill--approved", label: "Approved" }
    case "rejected": return { cls: "pill--expired", label: "Rejected" }
    case "revision_required": return { cls: "pill--pending", label: "Revision" }
    case "in_review": return { cls: "pill--submitted", label: "In review" }
    default: return { cls: "pill--pending", label: "Pending" }
  }
}

/** Partner work queue + personal dashboard — same shell as the org overview, partner-safe data only. */
export default function MyAssignmentsPage() {
  const { partner } = usePartnerProfile()
  const [filter, setFilter] = useState<QueueFilter>("all")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [assignments, setAssignments] = useState<AssignmentResponse[]>([])
  const [submissions, setSubmissions] = useState<EnrichedSubmissionResponse[]>([])
  const [submissionTotal, setSubmissionTotal] = useState(0)
  const [approvedTotal, setApprovedTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Assignments: page through so the KPI counts stay exact past the API page cap.
      const first = await assignmentsApi.listMyAssignments({ page: 1, limit: 50 })
      const all = [...first.data]
      const pages = Math.min(first.meta.total_pages ?? 1, 10)
      for (let p = 2; p <= pages; p++) {
        const next = await assignmentsApi.listMyAssignments({ page: p, limit: 50 })
        all.push(...next.data)
      }
      setAssignments(all)
    } catch (e) {
      setAssignments([])
      setError(
        e instanceof ApiError && e.status === 403
          ? "This dashboard is for partner accounts. Your organization account uses the org overview."
          : e instanceof Error ? e.message : "Failed to load your work queue"
      )
    } finally {
      setLoading(false)
    }

    try {
      // Recent submissions for the activity list, plus an exact approved count
      // from the server-side total (the API caps each page at 50).
      const [subs, approved] = await Promise.all([
        formsApi.listSubmissions({ page: 1, limit: 50, sort: "submitted_at", order: "desc" }),
        formsApi.listSubmissions({ status: "approved", page: 1, limit: 1 }),
      ])
      setSubmissions(subs.data)
      setSubmissionTotal(subs.meta.total)
      setApprovedTotal(approved.meta.total)
    } catch {
      setSubmissions([])
      setSubmissionTotal(0)
      setApprovedTotal(0)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const stats = useMemo(() => {
    const open = assignments.filter((a) => a.status === "assigned" && !isOverdue(a)).length
    const overdue = assignments.filter(isOverdue).length
    const submitted = assignments.filter((a) => a.status === "submitted").length
    const approved = approvedTotal
    const actionable = open + overdue
    const completion = actionable + submitted > 0 ? Math.round((submitted / (actionable + submitted)) * 100) : 0
    return { open, overdue, submitted, approved, completion }
  }, [assignments, approvedTotal])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return assignments.filter((a) => {
      const matchesFilter =
        filter === "all" ? true : filter === "overdue" ? isOverdue(a) : filter === "assigned" ? a.status === "assigned" && !isOverdue(a) : a.status === filter
      const matchesSearch = q === "" ? true : (a.form_title ?? "").toLowerCase().includes(q)
      return matchesFilter && matchesSearch
    })
  }, [assignments, filter, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const recentSubmissions = submissions.slice(0, 5)

  return (
    <>
      <header className="dash__top">
        <span className="dash__crumb">
          <span style={{ width: 1, height: 12, background: "var(--line)", display: "inline-block" }} aria-hidden />
          <span>PARTNER • WORK QUEUE</span>
          <strong>{partner?.name ?? "Partner dashboard"}</strong>
        </span>
        <div className="dash__top-actions">
          <button className="btn btn--ghost" style={{ padding: "7px 12px" }} onClick={() => void load()} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <Link to="/submissions" className="btn btn--primary" style={{ padding: "7px 12px" }}>My submissions</Link>
        </div>
      </header>

      <main className="dash__main">
        <div className="dash__ledger">
          <div className="dash__ledger-left">
            <span className="dash__ledger-kicker"><i /> Partner portal • assigned dossiers</span>
            <h1 style={{ fontSize: 22, margin: "8px 0" }}>Partner dashboard</h1>
            <p>Forms your organization assigned to you. Open a dossier, fill it, submit. A second submission is only allowed when the form permits resubmission.</p>
          </div>
          <div className="dash__ledger-actions">
            {partner?.status ? (
              <span className={`pill pill--${partner.status === "active" ? "approved" : partner.status === "suspended" || partner.status === "inactive" ? "expired" : "pending"}`}>
                Vendor {partner.status}
              </span>
            ) : null}
            <span className="mono-muted" style={{ fontSize: 11, background: "var(--ivory)", border: "1px solid var(--warm-gray)", padding: "6px 8px", borderRadius: 8 }}>
              {stats.completion}% complete
            </span>
          </div>
        </div>

        <section className="dash__stats" aria-label="Work queue overview">
          <article className="dash__stat">
            <span className="dash__stat-label">Open assignments</span>
            <span className="dash__stat-value">{stats.open}</span>
            <span className="dash__stat-hint hint--warn"><i aria-hidden /> not yet overdue</span>
          </article>
          <article className="dash__stat">
            <span className="dash__stat-label">Overdue</span>
            <span className="dash__stat-value">{stats.overdue}</span>
            <span className="dash__stat-hint hint--down"><i aria-hidden /> past the due date</span>
          </article>
          <article className="dash__stat">
            <span className="dash__stat-label">Submitted</span>
            <span className="dash__stat-value">{stats.submitted}</span>
            <span className="dash__stat-hint hint--up"><i aria-hidden /> awaiting review or done</span>
          </article>
          <article className="dash__stat">
            <span className="dash__stat-label">Approved</span>
            <span className="dash__stat-value">{stats.approved}</span>
            <span className="dash__stat-hint hint--up"><i aria-hidden /> accepted by your org</span>
          </article>
        </section>

        <section className="dash__card" aria-labelledby="queue-title">
          <div className="dash__card-head">
            <h2 id="queue-title">Assigned forms <em>{filtered.length} of {assignments.length}</em></h2>
            <div className="filter-pills">
              {(["all", "assigned", "submitted", "overdue", "revoked"] as const).map((s) => (
                <button key={s} className={filter === s ? "is-active" : ""} onClick={() => { setFilter(s); setPage(1) }}>
                  {s === "all" ? "All" : s[0].toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="dash__toolbar">
            <label className="dash__search" style={{ flex: 1 }} aria-label="Filter assigned forms">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" /></svg>
              <input placeholder="Filter by form…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
            </label>
            <span className="mono-muted" style={{ fontSize: 11 }}>Newest assignments first</span>
          </div>

          {error && (
            <div style={{ padding: "10px 14px", background: "#fdf0ef", borderBottom: "1px solid #e8c4c3", color: "#7a2e2c", fontFamily: "var(--mono)", fontSize: 12 }}>
              {error} <Link to="/dashboard" style={{ textDecoration: "underline" }}>Open org overview →</Link>
            </div>
          )}

          <div style={{ overflowX: "auto" }}>
            <table className="dash__table">
              <thead>
                <tr>
                  <th>Form</th>
                  <th>Status</th>
                  <th>Due</th>
                  <th>Submitted</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ textAlign: "center", padding: 24, color: "var(--muted)", fontFamily: "var(--mono)", fontSize: 12 }}>Loading your queue…</td></tr>
                ) : pageItems.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: "center", padding: 24, color: "var(--muted)", fontFamily: "var(--mono)", fontSize: 12 }}>
                    {assignments.length === 0 ? "No assignments yet — your organization has not assigned a form to you." : "Nothing matches this filter."}
                  </td></tr>
                ) : pageItems.map((a) => {
                  const overdue = isOverdue(a)
                  return (
                    <tr key={a.id} style={overdue ? { borderLeft: "3px solid var(--copper)" } : undefined}>
                      <td>
                        <span style={{ display: "grid" }}>
                          <strong style={{ fontSize: 13 }}>{a.form_title ?? a.form_id.slice(0, 8)}</strong>
                          <span className="mono-muted" style={{ fontSize: 11 }}>{a.form_status ?? ""}{a.submissions_count ? ` • ${a.submissions_count} submission${a.submissions_count === 1 ? "" : "s"}` : ""}</span>
                        </span>
                      </td>
                      <td>
                        <span className={`pill pill--${a.status === "submitted" ? "approved" : a.status === "revoked" ? "expired" : overdue ? "pending" : "submitted"}`}>
                          {overdue && a.status !== "overdue" ? "overdue" : a.status}
                        </span>
                      </td>
                      <td><span className="mono-muted" style={{ fontSize: 12, color: overdue ? "var(--copper)" : undefined }}>{a.due_at ? new Date(a.due_at).toLocaleDateString() : "—"}</span></td>
                      <td><span className="mono-muted" style={{ fontSize: 12 }}>{a.submitted_at ? new Date(a.submitted_at).toLocaleDateString() : "—"}</span></td>
                      <td style={{ textAlign: "right" }}>
                        {a.status === "revoked" ? (
                          <span className="mono-muted" style={{ fontSize: 11 }}>Revoked — submit blocked</span>
                        ) : (
                          <Link className="btn btn--ghost btn--sm" to={`/forms/${a.form_id}/fill`}>
                            Open dossier →
                          </Link>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10, padding: "10px 14px" }}>
              <button className="btn btn--ghost btn--sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</button>
              <span className="mono-muted" style={{ fontSize: 11 }}>page {page} of {totalPages}</span>
              <button className="btn btn--ghost btn--sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
            </div>
          )}
        </section>

        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: 14 }}>
          <section className="dash__card" aria-labelledby="recent-title">
            <div className="dash__card-head">
              <h2 id="recent-title">Recent submissions <em>{submissionTotal} total</em></h2>
              <Link to="/submissions" className="btn btn--ghost btn--sm">View all →</Link>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="dash__table">
                <thead>
                  <tr>
                    <th>Form</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {recentSubmissions.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: "center", padding: 24, color: "var(--muted)", fontFamily: "var(--mono)", fontSize: 12 }}>No submissions yet.</td></tr>
                  ) : recentSubmissions.map((s) => {
                    const pill = submissionPill(s.status)
                    return (
                      <tr key={s.id}>
                        <td><strong style={{ fontSize: 13 }}>{s.form_title ?? s.form_id.slice(0, 8)}</strong></td>
                        <td><span className={`pill ${pill.cls}`}>{pill.label}</span></td>
                        <td><span className="mono-muted" style={{ fontSize: 12 }}>{s.submitted_at ? formatRelative(s.submitted_at) : "—"}</span></td>
                        <td style={{ textAlign: "right" }}><Link className="btn btn--ghost btn--sm" to={`/submissions/${s.id}`}>View →</Link></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="dash__card" aria-labelledby="vendor-title">
            <div className="dash__card-head">
              <h2 id="vendor-title">Vendor profile <em>Read-only</em></h2>
            </div>
            <div style={{ padding: 14, display: "grid", gap: 12, fontSize: 13 }}>
              <div style={{ display: "grid", gap: 2 }}>
                <span className="mono-muted" style={{ fontSize: 10, letterSpacing: ".06em", textTransform: "uppercase" }}>Vendor</span>
                <strong style={{ fontFamily: "var(--display)", fontSize: 15 }}>{partner?.name ?? "—"}</strong>
              </div>
              <div style={{ display: "grid", gap: 2 }}>
                <span className="mono-muted" style={{ fontSize: 10, letterSpacing: ".06em", textTransform: "uppercase" }}>Contact</span>
                <span>{partner?.email ?? "—"}</span>
                {partner?.phone ? <span className="mono-muted" style={{ fontSize: 12 }}>{partner.phone}</span> : null}
              </div>
              <div style={{ display: "grid", gap: 2 }}>
                <span className="mono-muted" style={{ fontSize: 10, letterSpacing: ".06em", textTransform: "uppercase" }}>Status</span>
                <span className={`pill pill--${partner?.status === "active" ? "approved" : partner?.status === "suspended" || partner?.status === "inactive" ? "expired" : "pending"}`} style={{ justifySelf: "start" }}>
                  {partner?.status ?? "unknown"}
                </span>
              </div>
              <p className="mono-muted" style={{ fontSize: 11, margin: 0, lineHeight: 1.5 }}>
                Your organization manages this profile. Ask them to update your details or your vendor status.
              </p>
            </div>
          </section>
        </div>

        <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted-2)", textAlign: "center", margin: "6px 0 0" }}>
          Every submission keeps its timestamp and reviewer trail. Approved evidence stays in your proof vault.
        </p>
      </main>
    </>
  )
}
