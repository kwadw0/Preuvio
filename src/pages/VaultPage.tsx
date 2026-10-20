import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import "./DashboardPage.css"
import { ApiError } from "../lib/api"
import * as api from "../features/forms/api"
import type { EnrichedSubmissionResponse } from "../features/forms/types"

function toCsv(rows: EnrichedSubmissionResponse[]): string {
  const head = ["submission_id", "form_title", "partner_name", "partner_email", "status", "submitted_at", "reviewed_at"]
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`
  const lines = rows.map((s) => [s.id, s.form_title, s.partner_name, s.partner_email, s.status, s.submitted_at, s.reviewed_at].map(esc).join(","))
  return [head.join(","), ...lines].join("\n")
}

// Proof vault: org-wide evidence ledger. Every row is filed proof —
// who submitted, what form, when, and the review verdict. Export downloads
// the current filter as CSV for auditors.
export default function VaultPage() {
  const [q, setQ] = useState("")
  const [qInput, setQInput] = useState("")
  const [status, setStatus] = useState("")
  const [data, setData] = useState<EnrichedSubmissionResponse[]>([])
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, total_pages: 1 })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setQ(qInput.trim()), 380)
    return () => clearTimeout(t)
  }, [qInput])
  useEffect(() => { setPage(1) }, [q, status])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.listSubmissions({ q: q || undefined, status: status || undefined, page, limit: 20, sort: "submitted_at", order: "desc" })
      setData(res.data)
      setMeta(res.meta)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load vault")
    } finally {
      setLoading(false)
    }
  }, [q, status, page])
  useEffect(() => { void load() }, [load])

  async function handleExport() {
    setExporting(true)
    try {
      // fetch all pages under the current filter (cap 500 rows for sanity)
      const first = await api.listSubmissions({ q: q || undefined, status: status || undefined, page: 1, limit: 50, sort: "submitted_at", order: "desc" })
      let rows = [...first.data]
      const totalPages = Math.min(first.meta.total_pages, 10)
      for (let p = 2; p <= totalPages; p++) {
        const r = await api.listSubmissions({ q: q || undefined, status: status || undefined, page: p, limit: 50, sort: "submitted_at", order: "desc" })
        rows = rows.concat(r.data)
      }
      const blob = new Blob([toCsv(rows)], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `proof-vault-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Export failed")
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <header className="dash__top">
        <span className="dash__crumb"><span>PROOF</span><strong>Vault</strong></span>
        <div className="dash__top-actions">
          <button className="btn btn--primary" onClick={handleExport} disabled={exporting || data.length === 0} style={{ padding: "7px 12px" }}>{exporting ? "Exporting…" : "Export CSV →"}</button>
        </div>
      </header>
      <main className="dash__main">
        <div className="dash__ledger">
          <div className="dash__ledger-left">
            <span className="dash__ledger-kicker"><i /> Evidence • audit-ready</span>
            <h1 style={{ fontSize: 22, margin: "8px 0" }}>Proof vault</h1>
            <p>Every filed submission is proof — signer, form, timestamp, verdict. Filter and export the ledger for auditors.</p>
          </div>
          <div className="dash__ledger-actions">
            <span className="mono-muted" style={{ fontSize: 11, background: "var(--ivory)", border: "1px solid var(--warm-gray)", padding: "6px 8px", borderRadius: 8 }}>
              {meta.total} records • {data.filter((s) => s.status === "approved").length} approved on page
            </span>
          </div>
        </div>

        <section className="dash__card" aria-labelledby="vault-title">
          <div className="dash__card-head">
            <h2 id="vault-title">Ledger <em>{meta.total}</em></h2>
            <div className="filter-pills">
              {["", "pending", "approved", "rejected", "in_review"].map((s) => (
                <button key={s || "all"} className={status === s ? "is-active" : ""} onClick={() => setStatus(s)}>{s === "" ? "All" : s[0].toUpperCase() + s.slice(1)}</button>
              ))}
            </div>
          </div>
          <div className="dash__toolbar">
            <label className="dash__search" style={{ flex: 1 }} aria-label="Search vault">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" /></svg>
              <input placeholder="Search form, partner, response…" value={qInput} onChange={(e) => setQInput(e.target.value)} />
            </label>
            <span className="mono-muted" style={{ fontSize: 11 }}>{loading ? "Loading…" : `${data.length} on page`}</span>
          </div>

          {error && <div style={{ padding: "10px 14px", background: "#fdf0ef", borderBottom: "1px solid #e8c4c3", color: "#7a2e2c", fontFamily: "var(--mono)", fontSize: 12 }}>{error}</div>}

          <div style={{ overflowX: "auto" }}>
            <table className="dash__table">
              <thead>
                <tr>
                  <th>Proof</th>
                  <th>Form</th>
                  <th>Partner</th>
                  <th>Status</th>
                  <th>Filed</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: 24, color: "var(--muted)", fontFamily: "var(--mono)", fontSize: 12 }}>{loading ? "Loading vault…" : "No proof filed yet — assign a form to a partner to start the trail."}</td></tr>
                ) : (
                  data.map((s) => (
                    <tr key={s.id}>
                      <td><span className="mono-muted" style={{ fontSize: 11 }}>{s.id.slice(0, 8)}</span></td>
                      <td><strong style={{ fontSize: 13 }}>{s.form_title ?? s.form_id.slice(0, 8)}</strong></td>
                      <td><span className="mono-muted" style={{ fontSize: 12 }}>{s.partner_name ?? s.partner_email ?? "—"}</span></td>
                      <td><span className={`pill pill--${s.status === "approved" ? "approved" : s.status === "rejected" ? "expired" : s.status === "in_review" ? "submitted" : "pending"}`}>{s.status}</span></td>
                      <td><span className="mono-muted" style={{ fontSize: 12 }}>{s.submitted_at ? new Date(s.submitted_at).toLocaleDateString() : "—"}</span></td>
                      <td style={{ textAlign: "right" }}><Link className="btn btn--ghost btn--sm" to={`/submissions/${s.id}`}>View proof →</Link></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {meta.total_pages > 1 && (
            <div className="partners__pagination">
              <span className="partners__pagination-info">Page {meta.page} of {meta.total_pages} • {meta.total} total</span>
              <div className="partners__pagination-actions">
                <button className="partners__page-btn" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label="Previous page">‹</button>
                <button className="partners__page-btn" disabled={page === meta.total_pages} onClick={() => setPage((p) => Math.min(meta.total_pages, p + 1))} aria-label="Next page">›</button>
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  )
}
