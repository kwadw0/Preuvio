import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import "./BuilderLayout.css"
import type { RendererField, RendererSchema } from "../types"
import { FormRenderer } from "./FormRenderer"
import { FieldConfigPanel } from "./FieldConfigPanel"

const LS_KEY = "preuvio:builder:leftW"
const DEFAULT_W = 560
const BUILDER_MIN = 420
const BUILDER_MAX = 680
const PREVIEW_MIN = 480
const SPLITTER = 14
const STEP = 24

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

  // --- resizable splitter (clamped) ---
  const containerRef = useRef<HTMLDivElement>(null)
  const [leftW, setLeftW] = useState<number>(() => {
    if (typeof window === "undefined") return DEFAULT_W
    const saved = Number(localStorage.getItem(LS_KEY))
    return saved >= BUILDER_MIN && saved <= BUILDER_MAX ? saved : DEFAULT_W
  })
  const [dragging, setDragging] = useState(false)
  const clamp = useCallback((desired: number, containerWidth: number) => {
    const maxByPreview = containerWidth - PREVIEW_MIN - SPLITTER
    const max = Math.min(BUILDER_MAX, maxByPreview)
    const min = Math.min(BUILDER_MIN, max) // when container very narrow, prefer preview min
    return Math.max(min, Math.min(max, Math.round(desired)))
  }, [])

  const pct = useMemo(() => {
    // for aria-valuenow
    const range = BUILDER_MAX - BUILDER_MIN
    return Math.round(((leftW - BUILDER_MIN) / range) * 100)
  }, [leftW])

  useEffect(() => {
    // keep persisted width valid on resize
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const w = el.getBoundingClientRect().width
      setLeftW((prev) => {
        const c = clamp(prev, w)
        if (c !== prev) localStorage.setItem(LS_KEY, String(c))
        return c
      })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [clamp])

  const handleSplitterPointerDown = useCallback((e: React.PointerEvent) => {
    if (window.innerWidth <= 1100) return
    const el = containerRef.current
    if (!el) return
    setDragging(true)
    const pointerId = e.pointerId
    ;(e.currentTarget as HTMLElement).setPointerCapture(pointerId)
    const rect = el.getBoundingClientRect()
    const onMove = (ev: PointerEvent) => {
      const desired = ev.clientX - rect.left
      const w = el.getBoundingClientRect().width
      const c = clamp(desired, w)
      setLeftW(c)
    }
    const onUp = (ev: PointerEvent) => {
      const target = ev.target as HTMLElement | null
      try { target?.releasePointerCapture?.(pointerId) } catch { /* ignore */ }
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      setDragging(false)
      const current = (el as HTMLElement).getBoundingClientRect().width // re-read not needed
      void current
      // persist final
      const finalW = clamp((ev.clientX - rect.left), el.getBoundingClientRect().width)
      localStorage.setItem(LS_KEY, String(finalW))
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp, { once: true })
  }, [clamp])

  const nudge = useCallback((dir: -1 | 1, large = false) => {
    const el = containerRef.current
    if (!el) return
    const delta = (large ? STEP * 1.8 : STEP) * dir
    const w = el.getBoundingClientRect().width
    setLeftW((prev) => {
      const c = clamp(prev + delta, w)
      localStorage.setItem(LS_KEY, String(c))
      return c
    })
  }, [clamp])

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
    <div ref={containerRef} className={`builder ${dragging ? "builder--dragging" : ""}`} style={{ ["--left-w" as never]: `${leftW}px` } as React.CSSProperties}>
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

      {/* splitter — desktop only, clamped 420↔680 vs preview min 480 */}
      <div
        className={`builder__splitter ${dragging ? "builder__splitter--dragging" : ""}`}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize builder and preview"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={window.innerWidth > 1100 ? 0 : -1}
        onPointerDown={handleSplitterPointerDown}
        onDoubleClick={() => {
          setLeftW(DEFAULT_W)
          localStorage.setItem(LS_KEY, String(DEFAULT_W))
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") { e.preventDefault(); nudge(-1, e.shiftKey) }
          else if (e.key === "ArrowRight") { e.preventDefault(); nudge(1, e.shiftKey) }
          else if (e.key === "Home") { e.preventDefault(); const el = containerRef.current; if (el) { const w = el.getBoundingClientRect().width; const c = clamp(BUILDER_MIN, w); setLeftW(c); localStorage.setItem(LS_KEY, String(c)) } }
          else if (e.key === "End") { e.preventDefault(); const el = containerRef.current; if (el) { const w = el.getBoundingClientRect().width; const c = clamp(BUILDER_MAX, w); setLeftW(c); localStorage.setItem(LS_KEY, String(c)) } }
        }}
        title="Drag to resize — double-click to reset. Limits keep both panes readable."
      />

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
