import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import "./DashboardPage.css"
import { ApiError } from "../lib/api"
import * as api from "../features/forms/api"
import type { FormDetailResponse, RendererSchema } from "../features/forms/types"
import { toRendererSchemaFromForm } from "../features/forms/types"
import { BuilderLayout } from "../features/forms/components/BuilderLayout"

export default function FormDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<FormDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<"saved" | "saving" | "unsaved">("saved")
  const [lastSaved, setLastSaved] = useState<string | undefined>()
  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")
  const [status, setStatus] = useState<"draft" | "active" | "archived">("draft")
  const [allowResubmit, setAllowResubmit] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const d = await api.getFormDetail(id)
      setDetail(d)
      setTitle(d.form.title)
      setDesc(d.form.description ?? "")
      setStatus(d.form.status as never)
      setAllowResubmit(d.form.allow_resubmit ?? false)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Load failed")
    } finally {
      setLoading(false)
    }
  }, [id])
  useEffect(() => { void load() }, [load])

  const schema: RendererSchema | null = detail ? toRendererSchemaFromForm(detail) : null

  async function saveMeta() {
    if (!id) return
    setSaveState("saving")
    try {
      await api.updateForm(id, { title: title.trim(), description: desc.trim() || undefined, status, allow_resubmit: allowResubmit })
      await load()
      setSaveState("saved")
      setLastSaved(new Date().toISOString())
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Save failed")
      setSaveState("unsaved")
    }
  }

  async function handleAddSection(dto: { title: string; sort_order?: number }) {
    if (!id) return
    setSaveState("saving")
    try { await api.createFormSection(id, dto); await load(); setSaveState("saved"); setLastSaved(new Date().toISOString()) } catch(e){ setError(e instanceof ApiError?e.message:"Add failed"); setSaveState("unsaved") }
  }
  async function handleUpdateSection(sectionId: string, dto: { title: string; sort_order?: number }) {
    setSaveState("saving")
    try { await api.updateSection(sectionId, dto); await load(); setSaveState("saved"); setLastSaved(new Date().toISOString()) } catch(e){ setError(e instanceof ApiError?e.message:"Update failed"); setSaveState("unsaved") }
  }
  async function handleDeleteSection(sectionId: string) {
    if(!confirm("Delete section and its fields?")) return
    setSaveState("saving")
    try{ await api.deleteSection(sectionId); await load(); setSaveState("saved"); setLastSaved(new Date().toISOString())}catch(e){ setError(e instanceof ApiError?e.message:"Delete failed"); setSaveState("unsaved")}
  }
  async function handleReorderSections(ids: string[]) {
    setSaveState("saving")
    try{
      for(let i=0;i<ids.length;i++){ const sec = detail?.sections.find(s=>s.section.id===ids[i])?.section; if(sec) await api.updateSection(ids[i], { title: sec.title, sort_order: i*10 })}
      await load(); setSaveState("saved"); setLastSaved(new Date().toISOString())
    }catch(e){ setError(e instanceof ApiError?e.message:"Reorder failed"); setSaveState("unsaved")}
  }
  async function handleAddField(sectionId: string, payload: Record<string, unknown>) {
    if(!id) return
    setSaveState("saving")
    try{
      const p = payload as unknown as { label: string; field_type: string; is_required?: boolean; sort_order?: number; placeholder?: string; description?: string; options?: unknown; validation?: unknown }
      await api.createFormField(id, { section_id: sectionId, label: p.label, field_type: p.field_type as never, is_required: p.is_required, sort_order: p.sort_order, placeholder: p.placeholder, description: p.description, options: p.options, validation: p.validation }); await load(); setSaveState("saved"); setLastSaved(new Date().toISOString())}catch(e){ setError(e instanceof ApiError?e.message:"Add field failed"); setSaveState("unsaved")}
  }
  async function handleUpdateField(field: { id: string }, payload: Record<string, unknown>) {
    if(!id) return
    setSaveState("saving")
    try{ await api.updateFormField(id, field.id, payload as never); await load(); setSaveState("saved"); setLastSaved(new Date().toISOString())}catch(e){ setError(e instanceof ApiError?e.message:"Update failed"); setSaveState("unsaved")}
  }
  async function handleDeleteField(field: { id: string }) {
    if(!confirm("Delete field?")) return
    if(!id) return
    setSaveState("saving")
    try{ await api.deleteFormField(id, field.id); await load(); setSaveState("saved"); setLastSaved(new Date().toISOString())}catch(e){ setError(e instanceof ApiError?e.message:"Delete failed"); setSaveState("unsaved")}
  }
  async function handleReorderFields(_sectionId: string, orderedIds: string[]) {
    if(!id) return
    setSaveState("saving")
    try{
      for(let i=0;i<orderedIds.length;i++){
        const fid = orderedIds[i]; const f = detail?.sections.flatMap(s=>s.fields).find(x=>x.id===fid); if(f) await api.updateFormField(id, fid, { label: f.label, field_type: f.field_type, is_required: f.is_required, sort_order: i*10, placeholder: f.placeholder ?? undefined, description: f.description ?? undefined, options: f.options ?? undefined, validation: f.validation ?? undefined} as never)
      }
      await load(); setSaveState("saved"); setLastSaved(new Date().toISOString())
    }catch(e){ setError(e instanceof ApiError?e.message:"Reorder failed"); setSaveState("unsaved")}
  }

  if(loading) return <div className="dash__main" style={{ padding: 24, fontFamily: "var(--mono)", color:"var(--slate)"}}>Loading form…</div>
  if(!detail || !schema) return <div className="dash__main"><div className="dash__card" style={{ padding: 16, color:"var(--danger)"}}>{error ?? "Not found"}</div><Link to="/forms">← Back</Link></div>

  const archived = detail.form.status === "archived"

  return (
    <>
        <header className="dash__top"><span className="dash__crumb"><Link to="/forms" style={{color:"inherit"}}>Forms</Link><strong>{detail.form.title}</strong></span><div className="dash__top-actions"><span className={`pill ${status==="active"?"pill--approved":status==="draft"?"pill--pending":"pill--expired"}`}>{status}</span><Link className="btn btn--ghost" to={`/forms/${detail.form.id}/fill`}>Fill view →</Link><Link className="btn btn--ghost" to={`/forms/${detail.form.id}/submissions`}>Submissions</Link></div></header>
        <main className="dash__main dash__main--wide">
          <div className="dash__ledger"><div className="dash__ledger-left"><span className="dash__ledger-kicker"><i/> Dossier • form</span><h1 style={{fontSize:22}}>{detail.form.title}</h1><p>Customize sections/fields. Reorder via drag. Preview is the same FormRenderer the partner sees.</p></div></div>

          <div className="dash__card" style={{ padding:14, display:"grid", gap:10 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
              <label className="field"><span>Title *</span><input value={title} onChange={e=>setTitle(e.target.value)} style={{minHeight:44}} disabled={archived}/></label>
              <label className="field"><span>Status</span><select value={status} onChange={e=>setStatus(e.target.value as never)} style={{minHeight:44}} disabled={archived}><option value="draft">draft — editing</option><option value="active">active — submittable</option><option value="archived">archived — read-only</option></select></label>
            </div>
            <label className="field"><span>Description</span><input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Optional" style={{minHeight:44}} disabled={archived}/></label>
            <label style={{ display: "flex", gap: 8, alignItems: "center", fontFamily: "var(--mono)", fontSize: 12, color: "var(--slate)" }}>
              <input type="checkbox" checked={allowResubmit} onChange={e=>setAllowResubmit(e.target.checked)} disabled={archived} />
              Allow resubmission (second submit allowed; otherwise 409)
            </label>
            {archived && <div style={{ fontFamily:"var(--mono)", fontSize:12, color:"var(--danger)", background:"#fdf0ef", border:"1px solid #e8c4c3", padding:8, borderRadius:8}}>Archived — read-only. Change status to draft to edit.</div>}
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end"}}>
              <button className="btn btn--ghost" onClick={()=>navigate("/forms")}>Back to forms</button>
              <button className="btn btn--ghost" style={{color:"var(--danger)"}} onClick={async()=>{ if(!confirm("Delete form?"))return; try{ await api.deleteForm(detail.form.id); navigate("/forms")}catch(e){ setError(e instanceof ApiError?e.message:"Delete failed")}}}>Delete form</button>
              <button className="btn btn--primary" onClick={saveMeta} disabled={archived || !title.trim()}>Save meta</button>
            </div>
            {error ? <div style={{ fontFamily:"var(--mono)", fontSize:12, color:"var(--danger)"}}>{error}</div>:null}
          </div>

          <div className="dash__card" style={{ padding:14, display:"flex", justifyContent:"space-between", alignItems:"center", gap:10 }}>
            <span className="mono-muted" style={{ fontSize:12 }}>Assign this form from a partner dossier — open Partners, pick a vendor, Assign form.</span>
            <Link className="btn btn--primary btn--sm" to="/partners">Assign from Partners →</Link>
          </div>

          {archived ? (
            <div className="preview-paper"><div className="preview-paper__bar"/><div style={{padding:16}}><div style={{ fontFamily:"var(--mono)", fontSize:12, color:"var(--slate-2)", textAlign:"center", padding:12, background:"var(--ivory)", border:"1px solid var(--warm-gray)", borderRadius:8, marginBottom:12}}>Archived — builder disabled. Preview is read-only.</div><div style={{ display:"grid", gap:12 }}><BuilderLayout schema={schema} onAddSection={()=>{}} onUpdateSection={()=>{}} onDeleteSection={()=>{}} onReorderSections={()=>{}} onAddField={()=>{}} onUpdateField={()=>{}} onDeleteField={()=>{}} onReorderFields={()=>{}} saveState="saved" lastSavedAt={lastSaved}/></div></div></div>
          ) : (
            <BuilderLayout schema={schema} onAddSection={handleAddSection} onUpdateSection={handleUpdateSection} onDeleteSection={handleDeleteSection} onReorderSections={handleReorderSections} onAddField={handleAddField} onUpdateField={handleUpdateField as never} onDeleteField={handleDeleteField as never} onReorderFields={handleReorderFields} saveState={saveState} lastSavedAt={lastSaved} />
          )}
        </main>
    </>
  )
}
