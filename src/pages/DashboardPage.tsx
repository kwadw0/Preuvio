import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import "./DashboardPage.css"
import { config } from "../lib/config"
import { useAuth } from "../features/auth/context"
import { setOnboardedCache } from "../features/org/useOnboardingStatus"

// Types aligned with api.ts + landing mock
type PartnerStatus = "pending" | "submitted" | "approved" | "expired"
type PartnerRow = {
  id: string
  name: string
  initials: string
  docs: string
  status: PartnerStatus
  updated: string
}
type FormItem = {
  id: string
  title: string
  visibility: "public" | "private"
  status: "active" | "closed"
  updated: string
  partners: number
  docs: string[]
}

const initialPartners: PartnerRow[] = [
  { id: "1", name: "Avenor Logistics", initials: "AV", docs: "SOC 2 • Insurance", status: "approved", updated: "2h ago" },
  { id: "2", name: "Northstar Supply", initials: "NS", docs: "NDA • ISO 27001", status: "submitted", updated: "Needs review" },
  { id: "3", name: "Quantum Coop", initials: "QC", docs: "W-9 • COI", status: "pending", updated: "Reminded" },
  { id: "4", name: "Floren & Co", initials: "FL", docs: "MSA • DPA", status: "expired", updated: "Overdue 3d" },
  { id: "5", name: "Sable Systems", initials: "SA", docs: "SOC 2 • DPA", status: "pending", updated: "1d ago" },
  { id: "6", name: "Veridian Ltd", initials: "VE", docs: "COI • W-9", status: "approved", updated: "5h ago" },
]

const initialForms: FormItem[] = [
  { id: "f1", title: "Vendor compliance 2026", visibility: "private", status: "active", updated: "2h ago", partners: 24, docs: ["SOC 2", "Insurance", "MSA"] },
  { id: "f2", title: "SOC 2 Type II — public template", visibility: "public", status: "active", updated: "1d ago", partners: 18, docs: ["SOC 2", "ISO 27001"] },
  { id: "f3", title: "Insurance COI collection", visibility: "private", status: "active", updated: "3d ago", partners: 9, docs: ["COI", "W-9"] },
  { id: "f4", title: "DPA + MSA bundle", visibility: "public", status: "closed", updated: "1w ago", partners: 31, docs: ["DPA", "MSA"] },
  { id: "f5", title: "ISO 27001 evidence", visibility: "public", status: "active", updated: "5h ago", partners: 7, docs: ["ISO 27001", "Policy"] },
]

const audit = [
  { id: "a1", icon: "✓", text: "Avenor Logistics approved", meta: "by you • SOC 2 packet", time: "2h ago" },
  { id: "a2", icon: "↗", text: "Quantum Coop submitted W-9 • COI", meta: "auto-reminded yesterday", time: "5h ago" },
  { id: "a3", icon: "◷", text: "Floren & Co expired", meta: "MSA overdue 3d", time: "1d ago" },
  { id: "a4", icon: "+", text: "You created “Vendor compliance 2026”", meta: "cloned from SOC 2 template", time: "2d ago" },
]

function DashboardPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [mobileNav, setMobileNav] = useState(false)
  const [activeTab, setActiveTab] = useState<"all" | "forms" | "templates" | "public">("all")
  const [filter, setFilter] = useState<PartnerStatus | "all">("all")
  const [search, setSearch] = useState("")
  const [partners, setPartners] = useState<PartnerRow[]>(initialPartners)
  const [forms, setForms] = useState<FormItem[]>(initialForms)
  const [showCreate, setShowCreate] = useState<null | "form" | "template">(null)
  const [newTitle, setNewTitle] = useState("")
  const [newVis, setNewVis] = useState<"private" | "public">("private")
  const [newDocs, setNewDocs] = useState<string[]>(["SOC 2"])
  const [docInput, setDocInput] = useState("")

  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      const matchesStatus = filter === "all" ? true : p.status === filter
      const matchesSearch = search.trim() === "" ? true : `${p.name} ${p.docs}`.toLowerCase().includes(search.toLowerCase())
      return matchesStatus && matchesSearch
    })
  }, [partners, filter, search])

  const filteredForms = useMemo(() => {
    if (activeTab === "all") return forms
    if (activeTab === "forms") return forms.filter((f) => f.visibility === "private")
    if (activeTab === "templates") return forms.filter((f) => f.visibility === "private" ? false : true) // placeholder split
    if (activeTab === "public") return forms.filter((f) => f.visibility === "public")
    return forms
  }, [forms, activeTab])

  function handleCreate() {
    if (!newTitle.trim()) return
    const item: FormItem = {
      id: `f${Date.now()}`,
      title: newTitle.trim(),
      visibility: newVis,
      status: "active",
      updated: "now",
      partners: 0,
      docs: newDocs,
    }
    // Mock — log like signup/signin, keep API shape ready
    console.log(`Create ${showCreate} payload:`, item)
    // Future: await api("/forms", { method:"POST", body: JSON.stringify(item), authToken: localStorage.getItem("token") ?? undefined })
    setForms((prev) => [item, ...prev])
    setNewTitle("")
    setNewDocs(["SOC 2"])
    setShowCreate(null)
  }

  function handleStatusChange(id: string, next: PartnerStatus) {
    setPartners((prev) => prev.map((p) => (p.id === id ? { ...p, status: next, updated: "now" } : p)))
  }

  function handleSignOut() {
    logout()
    setOnboardedCache(null)
    try { sessionStorage.removeItem("preuvio_onboarding_draft") } catch { /* ignore */ }
    navigate("/login", { replace: true })
  }

  return (
    <>
      <header className="dash__top">
          <button className="dash__icon-btn" style={{ display:"grid"}} aria-label="Toggle menu" onClick={()=>setMobileNav(v=>!v)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileNav ? <path d="M18 6L6 18M6 6l12 12"/> : <><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></>}
            </svg>
          </button>


          <span className="dash__crumb">
            <span style={{ width:1, height:12, background:"var(--line)", display:"inline-block"}} aria-hidden />
            <span>FILE • PREUVIO-2026</span>
            <strong>Evidence desk</strong>
          </span>
          <label className="dash__search" aria-label="Search partners and forms">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
            <input placeholder="Search partners, docs, forms…" value={search} onChange={(e)=>setSearch(e.target.value)} />
          </label>

          <div className="dash__top-actions">
            <button className="dash__icon-btn" aria-label="Notifications">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 8a6 6 0 0 1 12 0c0 7-6 9-6 9s-6-2-6-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
            </button>
            <Link to="/" className="btn btn--ghost" style={{ padding:"7px 12px"}}>View site</Link>
            <Link to="/templates" className="btn btn--ghost" style={{ padding:"7px 12px"}}>Templates</Link>
            <Link to="/forms" className="btn btn--primary" style={{ padding:"7px 12px"}}>Forms</Link>
          </div>
        </header>

        {mobileNav && (
          <nav className="dash__mobile-nav" aria-label="Mobile">
            <Link to="/dashboard" onClick={()=>setMobileNav(false)}>Overview</Link>
            <button type="button" onClick={()=>{ setActiveTab("all"); setMobileNav(false)}}>Forms</button>
            <button type="button" onClick={()=>{ setActiveTab("public"); setMobileNav(false)}}>Templates</button>
            <button type="button" onClick={handleSignOut}>Sign out</button>
          </nav>
        )}

        <main className="dash__main">
          {/* Ledger header — thesis */}
          <div className="dash__ledger">
            <div className="dash__ledger-left">
              <span className="dash__ledger-kicker"><i /> Dossiers • evidence desk</span>
              <h1 style={{ fontSize: 22, margin: "8px 0 8px" }}>Evidence desk</h1>
              <p>Build reusable blueprints, clone to org forms, collect proof — all rendered by the same &lt;FormRenderer /&gt;. Draft → Active → Archived.</p>
            </div>
            <div className="dash__ledger-actions">
              <Link to="/templates" className="btn btn--ghost">Browse templates</Link>
              <Link to="/forms" className="btn btn--primary">Manage forms →</Link>
            </div>
          </div>

          {/* Stats */}
          <section className="dash__stats" aria-label="Compliance overview">
            <article className="dash__stat">
              <span className="dash__stat-label">Compliance rate</span>
              <span className="dash__stat-value">94.2%</span>
              <span className="dash__stat-hint hint--up"><i aria-hidden/> ↑ 12% this month</span>
            </article>
            <article className="dash__stat">
              <span className="dash__stat-label">Pending review</span>
              <span className="dash__stat-value">18</span>
              <span className="dash__stat-hint hint--warn"><i aria-hidden/> 6 expiring soon</span>
            </article>
            <article className="dash__stat">
              <span className="dash__stat-label">Templates active</span>
              <span className="dash__stat-value">12</span>
              <span className="dash__stat-hint hint--down"><i aria-hidden/> 4 public • 8 private</span>
            </article>
            <article className="dash__stat">
              <span className="dash__stat-label">Avg. time to submit</span>
              <span className="dash__stat-value">1.8d</span>
              <span className="dash__stat-hint hint--down"><i aria-hidden/> ↓ from 9.4 days</span>
            </article>
          </section>

          {/* Forms & Templates */}
          <section className="dash__card" aria-labelledby="forms-title">
            <div className="dash__card-head">
              <h2 id="forms-title">Forms & templates <em>{filteredForms.length} dossiers</em></h2>
              <div className="dash__tabs" role="tablist">
                {(["all","forms","templates","public"] as const).map((t) => (
                  <button key={t} role="tab" aria-selected={activeTab===t} className={`dash__tab ${activeTab===t?"is-active":""}`} onClick={()=>setActiveTab(t)}>
                    {t==="all" ? "All" : t==="forms" ? "Forms" : t==="templates" ? "My templates" : "Public library"}
                  </button>
                ))}
              </div>
            </div>

            <div className="dash__forms">
              {filteredForms.map((f) => (
                <article key={f.id} className="form-card">
                  <div className="form-card__top">
                    <span className={`pill ${f.status==="active"?"pill--approved":"pill--expired"}`} style={{ fontSize:11}}>{f.status==="active"?"Active":"Closed"}</span>
                    <span className="mono-muted" style={{ fontSize:11}}>{f.visibility === "public" ? "Public" : "Private"} • {f.updated}</span>
                  </div>
                  <div className="form-card__title">{f.title}</div>
                  <div className="form-card__meta">
                    <span>{f.partners} partners</span>
                    <span>•</span>
                    <span>{f.docs.join(" • ")}</span>
                  </div>
                  <div className="form-card__docs">
                    {f.docs.map((d) => <span key={d}>{d}</span>)}
                  </div>
                  <div className="form-card__actions">
                    <button className="btn btn--ghost btn--sm" onClick={()=>console.log("Clone", f.id)}>Clone</button>
                    <button className="btn btn--ghost btn--sm" onClick={()=>console.log("Edit", f.id)}>Edit</button>
                    <button className="btn btn--ghost btn--sm" onClick={()=> setForms(prev=> prev.map(x=> x.id===f.id ? {...x, status: x.status==="active"?"closed":"active"}:x))}>
                      {f.status==="active" ? "Close" : "Reopen"}
                    </button>
                  </div>
                </article>
              ))}

              {/* Create tile — the invitation to act */}
              <button className="form-card form-card--create" onClick={()=>setShowCreate("form")}>
                <span style={{ display:"grid", gap:8, justifyItems:"center"}}>
                  <span style={{ width:36, height:36, borderRadius:10, border:"1px dashed var(--line)", display:"grid", placeItems:"center", color:"var(--muted)"}}>+</span>
                  <strong style={{ fontFamily:"var(--display)", fontSize:13}}>Create new form</strong>
                  <span style={{ fontSize:12, color:"var(--muted)"}}>Blank or from public template</span>
                </span>
              </button>
            </div>
          </section>

          {/* Partners & requests */}
          <section id="partners" className="dash__card" aria-labelledby="partners-title">
            <div className="dash__card-head">
              <h2 id="partners-title">Partners & requests <em>{filteredPartners.length} of {partners.length}</em></h2>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <div className="filter-pills">
                  {(["all","pending","submitted","approved","expired"] as const).map((s) => (
                    <button key={s} className={filter===s?"is-active":""} onClick={()=>setFilter(s as any)}>{s === "all" ? "All" : s[0].toUpperCase()+s.slice(1)}</button>
                  ))}
                </div>
                <Link to="/partners" className="btn btn--ghost btn--sm">View all →</Link>
              </div>
            </div>

            <div className="dash__toolbar">
              <label className="dash__search" style={{ flex:1}} aria-label="Filter partners">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
                <input placeholder="Filter by partner or doc…" value={search} onChange={(e)=>setSearch(e.target.value)} />
              </label>
              <span className="mono-muted" style={{ fontSize:11}}>Auto-reminders ON</span>
              <button className="btn btn--primary btn--sm" onClick={()=> console.log("Remind", filteredPartners.filter(p=>p.status==="pending").map(p=>p.id))}>Remind pending</button>
              <button className="btn btn--ghost btn--sm" onClick={()=> console.log("Export proof", config.apiBaseUrl + "/compliance/proof")}>Export proof</button>
            </div>

            <div style={{ overflowX:"auto"}}>
              <table className="dash__table">
                <thead>
                  <tr>
                    <th>Partner</th>
                    <th>Required docs</th>
                    <th>Status</th>
                    <th>Updated</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPartners.map((p) => (
                    <tr key={p.id}>
                      <td><span className="partner"><span className="partner__avatar">{p.initials}</span>{p.name}</span></td>
                      <td><span className="mono-muted">{p.docs}</span></td>
                      <td><span className={`pill pill--${p.status}`}>{p.status[0].toUpperCase()+p.status.slice(1)}</span></td>
                      <td><span className="mono-muted">{p.updated}</span></td>
                      <td style={{ textAlign:"right"}}>
                        <select
                          aria-label={`Change status for ${p.name}`}
                          value={p.status}
                          onChange={(e)=>handleStatusChange(p.id, e.target.value as PartnerStatus)}
                          style={{ padding:"6px 8px", borderRadius:8, border:"1px solid var(--line)", fontSize:12, background:"white"}}
                        >
                          <option value="pending">Pending</option>
                          <option value="submitted">Submitted</option>
                          <option value="approved">Approved</option>
                          <option value="expired">Expired</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {filteredPartners.length===0 && (
                    <tr><td colSpan={5} style={{ textAlign:"center", padding:24, color:"var(--muted)"}}>No partners match your filter.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Proof vault + Audit trail side-by-side on desktop */}
          <div style={{ display:"grid", gridTemplateColumns:"1.3fr 0.7fr", gap:14}}>
            <section className="dash__card" aria-labelledby="vault-title">
              <div className="dash__card-head">
                <h2 id="vault-title">Proof vault <em>Export-ready</em></h2>
                <span className="pill pill--approved">Audit trail on</span>
              </div>
              <div style={{ padding:14, display:"grid", gap:10, fontSize:13, color:"var(--muted)"}}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"var(--bg-soft)", border:"1px solid var(--line)", borderRadius:10, padding:12}}>
                  <span><strong style={{color:"var(--ink)"}}>Retention & expiry</strong><br/><span style={{fontFamily:"var(--mono)", fontSize:11}}>Auto-expire & request re-upload</span></span>
                  <span className="pill pill--approved">Active</span>
                </div>
                <div style={{ background:"var(--ink)", color:"white", borderRadius:10, padding:12, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10}}>
                  <span style={{ fontSize:13, fontWeight:600}}>External API</span>
                  <code style={{ background:"rgba(255,255,255,.12)", border:"1px solid rgba(255,255,255,.18)", padding:"6px 8px", borderRadius:8, fontSize:11}}>{config.apiBaseUrl}/compliance/proof</code>
                </div>
                <p style={{ fontSize:12, margin:0}}>Every submission keeps version, signer, timestamp. Export a ZIP with one click.</p>
              </div>
            </section>

            <section className="dash__card" aria-labelledby="audit-title">
              <div className="dash__card-head">
                <h2 id="audit-title">Audit trail <em>Last 24h</em></h2>
                <Link to="/" className="mono-muted" style={{ fontSize:11, textDecoration:"underline"}}>View all</Link>
              </div>
              <div className="audit">
                {audit.map((a) => (
                  <div key={a.id} className="audit__row">
                    <span className="audit__dot" aria-hidden>{a.icon}</span>
                    <div>
                      <strong>{a.text}</strong><br/><span>{a.meta}</span>
                    </div>
                    <span className="audit__time">{a.time}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <p style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--muted-2)", textAlign:"center", margin:"6px 0 0"}}>Preuvio keeps every version, comment, and approval for audit. No spreadsheet needed.</p>
        </main>

      {/* Create modal */}
      {showCreate && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="create-title" onClick={()=>setShowCreate(null)}>
          <div className="modal" onClick={(e)=>e.stopPropagation()}>
            <div className="modal__head">
              <h3 id="create-title">Create {showCreate === "template" ? "template" : "form"}</h3>
              <button className="dash__icon-btn" aria-label="Close" onClick={()=>setShowCreate(null)}>✕</button>
            </div>
            <div className="modal__body">
              <div className="field">
                <label htmlFor="f-title">Title</label>
                <input id="f-title" placeholder={showCreate==="template" ? "e.g. SOC 2 Type II" : "e.g. Vendor compliance 2026"} value={newTitle} onChange={(e)=>setNewTitle(e.target.value)} />
              </div>
              <div className="field" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14}}>
                <label>Visibility
                  <select value={newVis} onChange={(e)=>setNewVis(e.target.value as any)} style={{ width:"100%", marginTop:6}}>
                    <option value="private">Private — only your org</option>
                    <option value="public">Public — reusable template</option>
                  </select>
                </label>
                <label>Source
                  <select style={{ width:"100%", marginTop:6}}>
                    <option>Blank</option>
                    <option>Clone SOC 2 public</option>
                    <option>Clone COI template</option>
                  </select>
                </label>
              </div>
              <div className="field">
                <label>Required docs</label>
                <div className="chips">
                  {newDocs.map((d) => (
                    <span key={d} className="chip">{d}<button aria-label={`Remove ${d}`} onClick={()=>setNewDocs(prev=>prev.filter(x=>x!==d))}>✕</button></span>
                  ))}
                  <input
                    placeholder="Add doc + Enter"
                    value={docInput}
                    onChange={(e)=>setDocInput(e.target.value)}
                    onKeyDown={(e)=>{
                      if (e.key==="Enter" && docInput.trim()){
                        e.preventDefault();
                        setNewDocs(prev=> [...prev, docInput.trim()]);
                        setDocInput("");
                      }
                    }}
                    style={{ flex:"1 1 120px", border:"none", outline:"none", fontSize:13}}
                  />
                </div>
              </div>
              <div style={{ display:"flex", gap:10, justifyContent:"flex-end"}}>
                <button className="btn btn--ghost" onClick={()=>setShowCreate(null)}>Cancel</button>
                <button className="btn btn--primary" onClick={handleCreate} disabled={!newTitle.trim()}>Create {showCreate}</button>
              </div>
              <p className="mono-muted" style={{ fontSize:11, margin:0}}>
                {showCreate==="template" ? "Templates are reusable. Closing a template does not delete forms that cloned it." : "Forms can be closed/archived anytime — history stays audit-ready."}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default DashboardPage
