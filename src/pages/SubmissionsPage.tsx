import { useCallback, useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import "./DashboardPage.css"
import { ApiError } from "../lib/api"
import * as api from "../features/forms/api"
import type { FormDetailResponse, FormSubmissionResponse } from "../features/forms/types"

export default function SubmissionsPage() {
  const { formId, id } = useParams<{ formId: string; id: string }>()
  const resolvedFormId = formId ?? id

  const [formDetail, setFormDetail] = useState<FormDetailResponse | null>(null)
  const [subs, setSubs] = useState<FormSubmissionResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<FormSubmissionResponse | null>(null)
  const [reviewStatus, setReviewStatus] = useState<"approved" | "rejected" | "revision_required">("approved")
  const [reviewing, setReviewing] = useState(false)

  const load = useCallback(async () => {
    if (!resolvedFormId) return
    setLoading(true)
    try {
      const [fd, list] = await Promise.all([api.getFormDetail(resolvedFormId), api.listFormSubmissions(resolvedFormId)])
      setFormDetail(fd)
      setSubs(list)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Load failed")
    } finally {
      setLoading(false)
    }
  }, [resolvedFormId])
  useEffect(() => { void load() }, [load])

  async function openSubmission(subId: string) {
    try {
      const s = await api.getSubmission(subId)
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
      setSelected(updated)
      await load()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Review failed (org only)")
    } finally {
      setReviewing(false)
    }
  }

  const keyToLabel = (() => {
    if (!formDetail) return new Map<string, string>()
    const m = new Map<string, string>()
    for (const sec of formDetail.sections) for (const f of sec.fields) m.set(f.key, f.label)
    return m
  })()

  if (loading) return <div className="dash__main" style={{ padding: 24, fontFamily: "var(--mono)", color: "var(--slate)" }}>Loading submissions…</div>

  return (
    <>
      <header className="dash__top"><span className="dash__crumb"><Link to="/forms" style={{ color: "inherit" }}>Forms</Link><strong>{formDetail?.form.title ?? "Submissions"}</strong></span><div className="dash__top-actions"><Link className="btn btn--ghost" to={resolvedFormId ? `/forms/${resolvedFormId}/fill` : "/forms"}>Fill view</Link><Link className="btn btn--ghost" to={resolvedFormId ? `/forms/${resolvedFormId}` : "/forms"}>Edit</Link></div></header>
      <main className="dash__main">
        <div className="dash__ledger"><div className="dash__ledger-left"><span className="dash__ledger-kicker"><i /> Review • submissions</span><h1 style={{ fontSize: 22 }}>Submissions {subs.length ? `• ${subs.length}` : ""}</h1><p>List all submissions for a form. Review transitions pending → approved | rejected | revision_required. Only org members can review.</p></div></div>
        {error && <div className="dash__card" style={{ padding: 10, color: "var(--danger)", background: "#fdf0ef", fontFamily: "var(--mono)", fontSize: 12 }}>{error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 420px" : "1fr", gap: 16, alignItems: "start" }}>
          <div className="dash__card" style={{ overflow: "hidden" }}>
            <div className="dash__card-head"><h2>Submissions <em>{subs.length}</em></h2><span className="pill pill--pending" style={{ fontSize: 11 }}>{subs.filter(s=>s.status==="pending").length} pending</span></div>
            <div style={{ overflowX: "auto" }}>
              <table className="dash__table">
                <thead><tr><th>Status</th><th>Key → value (preview)</th><th>Submitted</th><th></th></tr></thead>
                <tbody>
                  {subs.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: "center", padding: 24, color: "var(--muted)", fontFamily: "var(--mono)", fontSize: 12 }}>No submissions yet — fill the form to create one.</td></tr>
                  ) : (
                    subs.map((s) => (
                      <tr key={s.id} style={selected?.id===s.id ? { background:"var(--ivory)"} : undefined}>
                        <td><span className={`pill pill--${s.status==="approved"?"approved": s.status==="pending"?"pending": s.status==="rejected"?"expired":"pending"}`}>{s.status}</span></td>
                        <td><span className="mono-muted" style={{ display: "block", maxWidth: 360, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{Object.entries(s.responses).slice(0,3).map(([k,v])=> `${keyToLabel.get(k) ?? k}: ${String(v)}`).join(" • ") || "—"}</span></td>
                        <td><span className="mono-muted">{s.submitted_at ? new Date(s.submitted_at).toLocaleString(): s.created_at ? new Date(s.created_at).toLocaleString():"—"}</span></td>
                        <td style={{ textAlign:"right"}}><button className="btn btn--ghost btn--sm" onClick={()=>openSubmission(s.id)}>View</button></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {selected && (
            <div className="dash__card" style={{ position:"sticky", top:72 }}>
              <div className="dash__card-head"><h2>Submission <em>{selected.id.slice(0,8)}</em></h2><button className="dash__icon-btn" aria-label="Close" onClick={()=>setSelected(null)}>✕</button></div>
              <div style={{ padding:14, display:"grid", gap:12 }}>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center"}}><span className={`pill pill--${selected.status==="approved"?"approved": selected.status==="pending"?"pending": selected.status==="rejected"?"expired":"pending"}`}>{selected.status}</span><span className="mono-muted" style={{fontSize:11}}>{selected.submitted_at ? new Date(selected.submitted_at).toLocaleString() : ""}</span>{selected.reviewed_at ? <span className="mono-muted" style={{fontSize:11}}>reviewed {new Date(selected.reviewed_at).toLocaleString()} by {selected.reviewed_by?.slice(0,8) ?? "—"}</span>:null}</div>

                <div style={{ display:"grid", gap:8 }}>
                  {Object.entries(selected.responses).map(([k,v])=> (
                    <div key={k} style={{ display:"grid", gap:4, padding:10, border:"1px solid var(--warm-gray)", borderRadius:8, background:"var(--ivory)"}}>
                      <span style={{ fontFamily:"var(--mono)", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:".04em", color:"var(--graphite)"}}>{keyToLabel.get(k) ?? k}<span style={{ fontWeight:400, textTransform:"none", color:"var(--slate-2)", marginLeft:6}}>{k}</span></span>
                      <span style={{ fontSize:13, color:"var(--graphite)", wordBreak:"break-word"}}>{Array.isArray(v) ? (v as unknown[]).join(", ") : String(v ?? "—")}</span>
                    </div>
                  ))}
                  {Object.keys(selected.responses).length===0 && <span className="mono-muted">No responses</span>}
                </div>

                <div style={{ borderTop:"1px solid var(--warm-gray)", paddingTop:12, display:"grid", gap:8 }}>
                  <span style={{ fontFamily:"var(--mono)", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:".04em"}}>Review</span>
                  <select value={reviewStatus} onChange={e=>setReviewStatus(e.target.value as never)} style={{ minHeight:44, padding:"8px 10px", border:"1px solid var(--warm-gray)", borderRadius:8 }}>
                    <option value="approved">approved</option>
                    <option value="rejected">rejected</option>
                    <option value="revision_required">revision_required — needs changes</option>
                  </select>
                  <button className="btn btn--primary" onClick={handleReview} disabled={reviewing} style={{ minHeight:44}}>{reviewing ? "Reviewing…" : "Submit review"}</button>
                  <p className="mono-muted" style={{ fontSize:11, margin:0}}>Pending → approved | rejected | revision_required. Only org members can review. revision_required signals partner to fix and resubmit.</p>
                </div>

                <Link className="btn btn--ghost" to={`/submissions/${selected.id}`} style={{ justifyContent:"center", minHeight:44}}>Open standalone page</Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}

export function SingleSubmissionPage() {
  const { id } = useParams<{ id: string }>()
  const [sub, setSub] = useState<FormSubmissionResponse | null>(null)
  const [formDetail, setFormDetail] = useState<FormDetailResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<"approved"|"rejected"|"revision_required">("approved")
  const [saving, setSaving] = useState(false)

  useEffect(()=>{
    if(!id) return
    api.getSubmission(id).then(async (s)=>{
      setSub(s)
      try{ const fd = await api.getFormDetail(s.form_id); setFormDetail(fd)}catch{}
    }).catch(e=> setError(e instanceof ApiError?e.message:"Load failed"))
  }, [id])

  async function review(){
    if(!sub) return
    setSaving(true)
    try{ const u = await api.reviewSubmission(sub.id, status); setSub(u)}catch(e){ setError(e instanceof ApiError?e.message:"Review failed")}
    finally{ setSaving(false)}
  }

  if(error && !sub) return <div className="dash__main"><div className="dash__card" style={{ padding:16, color:"var(--danger)"}}>{error}</div></div>
  if(!sub) return <div className="dash__main" style={{ padding:24, fontFamily:"var(--mono)", color:"var(--slate)"}}>Loading submission…</div>

  const keyToLabel = formDetail ? new Map(formDetail.sections.flatMap(sec=> sec.fields.map(f=> [f.key, f.label] as const))) : new Map<string,string>()

  return (
    <>
      <header className="dash__top"><span className="dash__crumb"><Link to="/forms" style={{color:"inherit"}}>Forms</Link><strong>Submission {sub.id.slice(0,8)}</strong></span><div className="dash__top-actions"><Link className="btn btn--ghost" to={`/forms/${sub.form_id}/submissions`}>Back to list</Link><Link className="btn btn--ghost" to={`/forms/${sub.form_id}/fill`}>Fill form</Link></div></header>
      <main className="dash__main" style={{ maxWidth:820}}>
        <div className="dash__card" style={{ padding:16, display:"grid", gap:12}}>
          <div style={{ display:"flex", gap:8, alignItems:"center"}}><span className={`pill pill--${sub.status==="approved"?"approved": sub.status==="pending"?"pending": sub.status==="rejected"?"expired":"pending"}`}>{sub.status}</span><span className="mono-muted" style={{fontSize:11}}>{sub.submitted_at ? new Date(sub.submitted_at).toLocaleString(): new Date(sub.created_at).toLocaleString()}</span></div>
          {Object.entries(sub.responses).map(([k,v])=> (
            <div key={k} style={{ padding:10, border:"1px solid var(--warm-gray)", borderRadius:8, background:"var(--ivory)", display:"grid", gap:4}}>
              <span style={{ fontFamily:"var(--mono)", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:".04em"}}>{keyToLabel.get(k) ?? k}<span style={{fontWeight:400, textTransform:"none", color:"var(--slate-2)", marginLeft:6}}>{k}</span></span>
              <span style={{ fontSize:13}}>{Array.isArray(v) ? (v as unknown[]).join(", ") : String(v ?? "—")}</span>
            </div>
          ))}
          {error && <div style={{ color:"var(--danger)", fontFamily:"var(--mono)", fontSize:12}}>{error}</div>}
          <div style={{ borderTop:"1px solid var(--warm-gray)", paddingTop:12, display:"grid", gap:8}}>
            <span style={{ fontFamily:"var(--mono)", fontSize:11, fontWeight:700, textTransform:"uppercase"}}>Review</span>
            <select value={status} onChange={e=>setStatus(e.target.value as never)} style={{ minHeight:44, padding:"8px 10px", border:"1px solid var(--warm-gray)", borderRadius:8}}><option value="approved">approved</option><option value="rejected">rejected</option><option value="revision_required">revision_required</option></select>
            <button className="btn btn--primary" onClick={review} disabled={saving} style={{ minHeight:44}}>{saving?"Reviewing…":"Submit review"}</button>
          </div>
        </div>
      </main>
    </>
  )
}
