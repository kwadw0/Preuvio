import { useMemo, useState } from "react"
import "./BuilderLayout.css"
import type { RendererField, RendererSchema } from "../types"
import { FormRenderer } from "./FormRenderer"
import { FieldConfigPanel } from "./FieldConfigPanel"

type Props = {
  schema: RendererSchema
  onAddSection: (dto: { title: string; sort_order?: number; description?: string }) => void
  onUpdateSection: (sectionId: string, dto: { title: string; sort_order?: number; description?: string }) => void
  onDeleteSection: (sectionId: string) => void
  onReorderSections: (orderedIds: string[]) => void
  onAddField: (sectionId: string, payload: Record<string, unknown>) => void
  onUpdateField: (field: RendererField, payload: Record<string, unknown>) => void
  onDeleteField: (field: RendererField) => void
  onReorderFields: (sectionId: string, orderedIds: string[]) => void
  saveState: "saved" | "saving" | "unsaved"
  lastSavedAt?: string
}

export function BuilderLayout({ schema, onAddSection, onUpdateSection, onDeleteSection, onReorderSections, onAddField, onUpdateField, onDeleteField, onReorderFields, saveState, lastSavedAt }: Props) {
  const [activeSection, setActiveSection] = useState<string | null>(schema.sections[0]?.section.id ?? null)
  const [editingField, setEditingField] = useState<RendererField | null>(null)
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [newSectionTitle, setNewSectionTitle] = useState("")
  const [mobileTab, setMobileTab] = useState<"structure" | "preview">("structure")
  const [dragSectionId, setDragSectionId] = useState<string | null>(null)
  const [dragFieldId, setDragFieldId] = useState<string | null>(null)
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [editSectionTitle, setEditSectionTitle] = useState("")

  const allKeys = useMemo(() => schema.sections.flatMap((s) => s.fields.map((f) => f.key)), [schema])

  // autosave preview values — demo
  const [previewValues, setPreviewValues] = useState<Record<string, unknown>>({})
  const [previewMode, setPreviewMode] = useState<"single" | "stepper">("single")

  function handleSectionDragStart(id: string) {
    setDragSectionId(id)
  }
  function handleSectionDrop(targetId: string) {
    if (!dragSectionId || dragSectionId === targetId) return
    const ids = schema.sections.map((s) => s.section.id)
    const from = ids.indexOf(dragSectionId)
    const to = ids.indexOf(targetId)
    if (from === -1 || to === -1) return
    const next = [...ids]
    next.splice(from, 1)
    next.splice(to, 0, dragSectionId)
    onReorderSections(next)
    setDragSectionId(null)
  }

  function handleFieldDrop(sectionId: string, targetFieldId: string) {
    if (!dragFieldId || dragFieldId === targetFieldId) return
    const sec = schema.sections.find((s) => s.section.id === sectionId)
    if (!sec) return
    const ids = sec.fields.map((f) => f.id)
    const from = ids.indexOf(dragFieldId)
    const to = ids.indexOf(targetFieldId)
    if (from === -1 || to === -1) return
    const next = [...ids]
    next.splice(from, 1)
    next.splice(to, 0, dragFieldId)
    onReorderFields(sectionId, next)
    setDragFieldId(null)
  }

  const showStructure = mobileTab === "structure" || typeof window === "undefined" || window.innerWidth > 1100

  return (
    <div className="builder">
      {/* left */}
      <div className="builder__left" style={{ display: showStructure ? "grid" : "none" }}>
        <div className="builder__tabs">
          <button type="button" className={`dash__tab ${mobileTab === "structure" ? "is-active" : ""}`} onClick={() => setMobileTab("structure")}>
            Structure
          </button>
          <button type="button" className={`dash__tab ${mobileTab === "preview" ? "is-active" : ""}`} onClick={() => setMobileTab("preview")}>
            Preview
          </button>
        </div>

        <div className="builder__card">
          <div className="builder__card-head">
            <h3>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--verdant)", display: "inline-block" }} />
              Sections • {schema.sections.length}
            </h3>
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--slate-2)" }}>{allKeys.length} fields</span>
          </div>

          <div style={{ padding: 12, display: "grid", gap: 10 }}>
            {schema.sections.length === 0 ? (
              <div className="builder__empty">
                <span style={{ width: 40, height: 40, borderRadius: 10, border: "1px dashed var(--warm-gray-strong)", display: "grid", placeItems: "center", color: "var(--muted)" }}>＋</span>
                <strong style={{ fontFamily: "var(--display)", fontSize: 13 }}>Add your first section</strong>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>Sections group related fields. Start with one — you can reorder later.</span>
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <input value={newSectionTitle} onChange={(e) => setNewSectionTitle(e.target.value)} placeholder="Section title, e.g. Company details" style={{ minHeight: 44, padding: "8px 10px", border: "1px solid var(--warm-gray)", borderRadius: 8, fontSize: 13, minWidth: 180 }} />
                  <button
                    type="button"
                    className="btn btn--primary"
                    disabled={!newSectionTitle.trim()}
                    onClick={() => {
                      onAddSection({ title: newSectionTitle.trim(), sort_order: schema.sections.length * 10 })
                      setNewSectionTitle("")
                    }}
                    style={{ minHeight: 44 }}
                  >
                    Add
                  </button>
                </div>
              </div>
            ) : (
              <>
                {schema.sections.map((sec) => (
                  <div
                    key={sec.section.id}
                    className={`builder__section ${activeSection === sec.section.id ? "builder__section--active" : ""}`}
                    draggable
                    onDragStart={() => handleSectionDragStart(sec.section.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleSectionDrop(sec.section.id)}
                  >
                    <div className="builder__section-head" onClick={() => setActiveSection((p) => (p === sec.section.id ? null : sec.section.id))}>
                      <span
                        className="builder__drag"
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation()
                          handleSectionDragStart(sec.section.id)
                        }}
                        aria-label="Drag section"
                      >
                        ↕
                      </span>
                      <span className="builder__section-title">{sec.section.title}</span>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--slate-2)", whiteSpace: "nowrap" }}>
                        {sec.fields.length} • #{sec.section.sort_order}
                      </span>
                      <button
                        type="button"
                        className="dash__icon-btn"
                        style={{ width: 32, height: 32 }}
                        aria-label="Toggle"
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveSection((p) => (p === sec.section.id ? null : sec.section.id))
                        }}
                      >
                        {activeSection === sec.section.id ? "−" : "+"}
                      </button>
                    </div>

                    {activeSection === sec.section.id && (
                      <div style={{ display: "grid" }}>
                        {/* inline edit section */}
                        {editingSectionId === sec.section.id ? (
                          <div style={{ display: "flex", gap: 8, padding: 10, background: "var(--ivory)", borderBottom: "1px solid var(--warm-gray)" }}>
                            <input value={editSectionTitle} onChange={(e) => setEditSectionTitle(e.target.value)} style={{ flex: 1, minHeight: 36, padding: "8px 10px", border: "1px solid var(--warm-gray)", borderRadius: 8, fontSize: 13 }} />
                            <button
                              type="button"
                              className="btn btn--primary btn--sm"
                              onClick={() => {
                                if (!editSectionTitle.trim()) return
                                onUpdateSection(sec.section.id, { title: editSectionTitle.trim(), sort_order: sec.section.sort_order })
                                setEditingSectionId(null)
                              }}
                            >
                              Save
                            </button>
                            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEditingSectionId(null)}>
                              Cancel
                            </button>
                          </div>
                        ) : null}

                        <div style={{ display: "flex", gap: 6, padding: "8px 10px", borderBottom: "1px solid var(--warm-gray)", background: "var(--surface)", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => {
                              setEditSectionTitle(sec.section.title)
                              setEditingSectionId(sec.section.id)
                            }}
                          >
                            Edit section
                          </button>
                          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setAddingTo(sec.section.id)}>
                            + Add field
                          </button>
                          <button type="button" className="btn btn--ghost btn--sm" onClick={() => onDeleteSection(sec.section.id)} style={{ color: "var(--danger)" }}>
                            Delete
                          </button>
                        </div>

                        {sec.fields.length === 0 ? (
                          <div style={{ padding: 12, fontFamily: "var(--mono)", fontSize: 12, color: "var(--slate-2)", textAlign: "center", background: "var(--ivory)" }}>No fields yet — add one.</div>
                        ) : (
                          sec.fields.map((f) => (
                            <div
                              key={f.id}
                              className="builder__field-row"
                              draggable
                              onDragStart={() => setDragFieldId(f.id)}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={() => handleFieldDrop(sec.section.id, f.id)}
                            >
                              <span className="builder__drag" aria-hidden>
                                ↕
                              </span>
                              <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--ivory)", border: "1px solid var(--warm-gray)", display: "grid", placeItems: "center", fontFamily: "var(--mono)", fontSize: 10 }}>{f.field_type.slice(0, 2).toUpperCase()}</span>
                              <div className="builder__field-meta">
                                <strong>{f.label}</strong>
                                <span>
                                  {f.key} • {f.field_type}
                                  {f.is_required ? " • required" : ""}
                                </span>
                              </div>
                              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEditingField(f as RendererField)}>
                                Edit
                              </button>
                              <button type="button" className="btn btn--ghost btn--sm" style={{ color: "var(--danger)" }} onClick={() => onDeleteField(f as RendererField)}>
                                ✕
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))}

                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <input value={newSectionTitle} onChange={(e) => setNewSectionTitle(e.target.value)} placeholder="New section title" style={{ flex: 1, minHeight: 44, padding: "8px 10px", border: "1px solid var(--warm-gray)", borderRadius: 8, fontSize: 13 }} />
                  <button
                    type="button"
                    className="btn btn--ghost"
                    disabled={!newSectionTitle.trim()}
                    onClick={() => {
                      onAddSection({ title: newSectionTitle.trim(), sort_order: schema.sections.length * 10 })
                      setNewSectionTitle("")
                    }}
                    style={{ minHeight: 44 }}
                  >
                    Add section
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="builder__savebar">
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--mono)", fontSize: 11, color: saveState === "saving" ? "var(--copper)" : saveState === "unsaved" ? "var(--warn)" : "var(--verdant)" }}>
              <i style={{ width: 6, height: 6, borderRadius: 999, background: saveState === "saving" ? "var(--copper)" : saveState === "unsaved" ? "var(--warn)" : "var(--verdant)", display: "inline-block" }} />
              {saveState === "saving" ? "Saving…" : saveState === "unsaved" ? "Unsaved changes" : lastSavedAt ? `Saved • ${new Date(lastSavedAt).toLocaleTimeString()}` : "Saved"}
            </span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--slate-2)" }}>Shared renderer: preview == live</span>
          </div>
        </div>

        {(addingTo || editingField) && (
          <div style={{ display: "grid" }}>
            <FieldConfigPanel
              field={editingField}
              allKeys={allKeys}
              defaultSortOrder={
                editingField
                  ? editingField.sort_order
                  : schema.sections.find((s) => s.section.id === addingTo)?.fields.length ?? 0 * 10 + 10
              }
              onCancel={() => {
                setAddingTo(null)
                setEditingField(null)
              }}
              onSave={({ payload }) => {
                if (editingField) onUpdateField(editingField, payload)
                else if (addingTo) onAddField(addingTo, payload)
                setAddingTo(null)
                setEditingField(null)
              }}
            />
          </div>
        )}
      </div>

      {/* right preview — same FormRenderer as respondent */}
      <div className="builder__right" style={{ display: mobileTab === "preview" || window.innerWidth > 1100 ? "block" : "none" }}>
        <div className="builder__tabs" style={{ marginBottom: 12 }}>
          <button type="button" className={`dash__tab ${mobileTab === "structure" ? "is-active" : ""}`} onClick={() => setMobileTab("structure")}>
            Structure
          </button>
          <button type="button" className={`dash__tab ${mobileTab === "preview" ? "is-active" : ""}`} onClick={() => setMobileTab("preview")}>
            Preview
          </button>
          <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 11, color: "var(--slate-2)" }}>Same &lt;FormRenderer /&gt;</span>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <button type="button" className={`btn btn--sm ${previewMode === "single" ? "btn--primary" : "btn--ghost"}`} onClick={() => setPreviewMode("single")}>
            Single page
          </button>
          <button type="button" className={`btn btn--sm ${previewMode === "stepper" ? "btn--primary" : "btn--ghost"}`} onClick={() => setPreviewMode("stepper")}>
            Stepper
          </button>
        </div>

        <div className="preview-paper">
          <div className="preview-paper__bar" />
          <div style={{ padding: 16 }}>
            <FormRenderer schema={schema} values={previewValues} onChange={setPreviewValues} mode="preview" stepMode={previewMode} />
          </div>
        </div>
        <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--slate-2)", textAlign: "center", marginTop: 8 }}>Builder preview and respondent view import the exact same FormRenderer — no divergent styling.</p>
      </div>
    </div>
  )
}
