import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import "./DashboardPage.css"
import { ApiError } from "../lib/api"
import * as api from "../features/forms/api"
import type { RendererSchema, TemplateDetailResponse } from "../features/forms/types"
import { toRendererSchemaFromTemplate } from "../features/forms/types"
import { BuilderLayout } from "../features/forms/components/BuilderLayout"

export default function TemplateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<TemplateDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<"saved" | "saving" | "unsaved">("saved")
  const [lastSaved, setLastSaved] = useState<string | undefined>(undefined)
  const [metaTitle, setMetaTitle] = useState("")
  const [metaDesc, setMetaDesc] = useState("")

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const d = await api.getTemplateDetail(id)
      setDetail(d)
      setMetaTitle(d.template.title)
      setMetaDesc(d.template.description ?? "")
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const schema: RendererSchema | null = detail ? toRendererSchemaFromTemplate(detail) : null

  async function handleAddSection(dto: { title: string; sort_order?: number; description?: string }) {
    if (!id) return
    setSaveState("saving")
    try {
      await api.createTemplateSection(id, dto)
      await load()
      setSaveState("saved")
      setLastSaved(new Date().toISOString())
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Add section failed")
      setSaveState("unsaved")
    }
  }
  async function handleUpdateSection(sectionId: string, dto: { title: string; sort_order?: number; description?: string }) {
    setSaveState("saving")
    try {
      await api.updateSection(sectionId, dto)
      await load()
      setSaveState("saved")
      setLastSaved(new Date().toISOString())
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Update failed")
      setSaveState("unsaved")
    }
  }
  async function handleDeleteSection(sectionId: string) {
    if (!confirm("Delete section and its fields?")) return
    setSaveState("saving")
    try {
      await api.deleteSection(sectionId)
      await load()
      setSaveState("saved")
      setLastSaved(new Date().toISOString())
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Delete failed")
      setSaveState("unsaved")
    }
  }
  async function handleReorderSections(orderedIds: string[]) {
    setSaveState("saving")
    try {
      for (let i = 0; i < orderedIds.length; i++) {
        const secId = orderedIds[i]
        const sec = detail?.sections.find((s) => s.section.id === secId)?.section
        if (sec) await api.updateSection(secId, { title: sec.title, sort_order: i * 10 })
      }
      await load()
      setSaveState("saved")
      setLastSaved(new Date().toISOString())
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Reorder failed")
      setSaveState("unsaved")
    }
  }

  async function handleAddField(sectionId: string, payload: Record<string, unknown>) {
    if (!id) return
    setSaveState("saving")
    try {
      const p = payload as unknown as { label: string; field_type: string; is_required?: boolean; sort_order?: number; placeholder?: string; description?: string; options?: unknown; validation?: unknown }
      await api.createTemplateField(id, { section_id: sectionId, label: p.label, field_type: p.field_type as never, is_required: p.is_required, sort_order: p.sort_order, placeholder: p.placeholder, description: p.description, options: p.options, validation: p.validation })
      await load()
      setSaveState("saved")
      setLastSaved(new Date().toISOString())
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Add field failed")
      setSaveState("unsaved")
    }
  }
  async function handleUpdateField(field: { id: string }, payload: Record<string, unknown>) {
    setSaveState("saving")
    try {
      await api.updateTemplateField(field.id, payload as never)
      await load()
      setSaveState("saved")
      setLastSaved(new Date().toISOString())
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Update field failed")
      setSaveState("unsaved")
    }
  }
  async function handleDeleteField(field: { id: string }) {
    if (!confirm("Delete field?")) return
    setSaveState("saving")
    try {
      await api.deleteTemplateField(field.id)
      await load()
      setSaveState("saved")
      setLastSaved(new Date().toISOString())
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Delete failed")
      setSaveState("unsaved")
    }
  }
  async function handleReorderFields(sectionId: string, orderedIds: string[]) {
    setSaveState("saving")
    try {
      for (let i = 0; i < orderedIds.length; i++) {
        const fid = orderedIds[i]
        const field = detail?.sections.flatMap((s) => s.fields).find((f) => f.id === fid)
        if (field) {
          await api.updateTemplateField(fid, {
            label: field.label,
            field_type: field.field_type,
            is_required: field.is_required,
            sort_order: i * 10,
            placeholder: field.placeholder ?? undefined,
            description: field.description ?? undefined,
            options: field.options ?? undefined,
            validation: field.validation ?? undefined,
          } as never)
        }
        void sectionId
      }
      await load()
      setSaveState("saved")
      setLastSaved(new Date().toISOString())
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Reorder failed")
      setSaveState("unsaved")
    }
  }

  async function handleSaveMeta() {
    if (!id || !detail) return
    setSaveState("saving")
    try {
      await api.updateTemplate(id, { title: metaTitle.trim(), description: metaDesc.trim() || undefined, category: detail.template.category ?? undefined })
      await load()
      setSaveState("saved")
      setLastSaved(new Date().toISOString())
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Save failed")
      setSaveState("unsaved")
    }
  }

  if (loading) return <div className="dash__main" style={{ padding: 24, fontFamily: "var(--mono)", color: "var(--slate)" }}>Loading template…</div>
  if (error && !detail) return <div className="dash__main"><div className="dash__card" style={{ padding: 16, color: "var(--danger)" }}>{error}</div><Link to="/templates" className="btn btn--ghost" style={{ marginTop: 12 }}>← Back</Link></div>
  if (!detail || !schema) return null

  return (
    <>
        <header className="dash__top">
          <span className="dash__crumb"><Link to="/templates" style={{ color: "inherit" }}>Templates</Link><strong>{detail.template.title}</strong></span>
          <div className="dash__top-actions">
            <span className={`pill ${detail.template.is_active ? "pill--approved" : "pill--pending"}`} style={{ fontSize: 11 }}>{detail.template.is_active ? "Active" : "Inactive"}</span>
            <button className="btn btn--ghost" onClick={() => navigate("/templates")}>Back</button>
            <button
              className="btn btn--primary"
              onClick={async () => {
                const t = prompt("New form title (clone)", `${detail.template.title} — copy`)
                if (!t?.trim()) return
                setError(null)
                try {
                  const form = await api.cloneTemplate(detail.template.id, { title: t.trim() })
                  navigate(`/forms/${form.id}`)
                } catch (e) {
                  if (e instanceof ApiError) {
                    if (e.status === 404) setError("Template not found.")
                    else if (e.status === 403) setError("You need an organization to clone templates.")
                    else setError(e.message)
                  } else setError("Clone failed — please try again.")
                }
              }}
            >
              Clone to form →
            </button>
          </div>
        </header>
        <main className="dash__main dash__main--wide">
          <div className="dash__ledger">
            <div className="dash__ledger-left"><span className="dash__ledger-kicker"><i /> Builder • template</span><h1 style={{ fontSize: 22 }}>{detail.template.title}</h1><p>Drag to reorder. Field config opens inline. Preview uses the same FormRenderer as the respondent.</p></div>
          </div>

          <div className="dash__card" style={{ padding: 14, display: "grid", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label className="field"><span>Title</span><input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} style={{ minHeight: 44 }} /></label>
              <label className="field"><span>Category</span><input value={detail.template.category ?? ""} disabled style={{ minHeight: 44, opacity: 0.7 }} /></label>
            </div>
            <label className="field"><span>Description</span><input value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} placeholder="Optional" style={{ minHeight: 44 }} /></label>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn btn--ghost" onClick={() => navigate("/templates")}>Back to library</button>
              <button className="btn btn--primary" onClick={handleSaveMeta}>Save meta</button>
              <button className="btn btn--ghost" style={{ color: "var(--danger)" }} onClick={async () => { if (!confirm("Delete template?")) return; try { await api.deleteTemplate(detail.template.id); navigate("/templates")} catch(e){ setError(e instanceof ApiError?e.message:"Delete failed")}}}>Delete template</button>
            </div>
            {error ? <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--danger)" }}>{error}</div> : null}
          </div>

          <BuilderLayout
            schema={schema}
            onAddSection={handleAddSection}
            onUpdateSection={handleUpdateSection}
            onDeleteSection={handleDeleteSection}
            onReorderSections={handleReorderSections}
            onAddField={handleAddField}
            onUpdateField={handleUpdateField as never}
            onDeleteField={handleDeleteField as never}
            onReorderFields={handleReorderFields}
            saveState={saveState}
            lastSavedAt={lastSaved}
          />
        </main>
    </>
  )
}
