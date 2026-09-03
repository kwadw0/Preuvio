import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import "./DashboardPage.css"
import { ApiError } from "../lib/api"
import * as formsApi from "../features/forms/api"
import type { FormTemplateResponse } from "../features/forms/types"

export default function TemplatesPage() {
  const navigate = useNavigate()
  const [mobileNav, setMobileNav] = useState(false)
  const [items, setItems] = useState<FormTemplateResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState("")
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [creating, setCreating] = useState(false)
  const [cloneTitle, setCloneTitle] = useState("")
  const [cloningId, setCloningId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FormTemplateResponse | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await formsApi.listTemplates()
      setItems(data)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load templates")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function handleCreate() {
    if (!title.trim()) return
    setCreating(true)
    try {
      const t = await formsApi.createTemplate({ title: title.trim(), description: description.trim() || undefined, category: category.trim() || undefined })
      setItems((p) => [t, ...p])
      setShowCreate(false)
      setTitle("")
      setDescription("")
      setCategory("")
      navigate(`/templates/${t.id}`)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Create failed")
    } finally {
      setCreating(false)
    }
  }

  const [cloning, setCloning] = useState(false)

  function cloneErr(e: unknown): string {
    if (e instanceof ApiError) {
      if (e.status === 404) return "Template not found."
      if (e.status === 403) return "You need an organization to clone templates."
      return e.message
    }
    return "Clone failed — please try again."
  }

  async function handleClone(id: string) {
    if (!cloneTitle.trim()) {
      setError("Clone title required")
      return
    }
    setCloning(true)
    setError(null)
    try {
      const form = await formsApi.cloneTemplate(id, { title: cloneTitle.trim() })
      // clone is atomic — on success redirect to draft form detail for editing
      navigate(`/forms/${form.id}`)
    } catch (e) {
      setError(cloneErr(e))
    } finally {
      setCloning(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeletingId(deleteTarget.id)
    setError(null)
    try {
      await formsApi.deleteTemplate(deleteTarget.id)
      setItems((prev) => prev.filter((t) => t.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) setError("Template not found — already deleted.")
      else setError(e instanceof ApiError ? e.message : "Delete failed")
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = useMemo(() => {
    if (!q.trim()) return items
    const s = q.toLowerCase()
    return items.filter((t) => `${t.title} ${t.description ?? ""} ${t.category ?? ""}`.toLowerCase().includes(s))
  }, [items, q])

  return (
    <>
        <header className="dash__top">
          <button className="dash__icon-btn" aria-label="Toggle menu" onClick={() => setMobileNav((v) => !v)}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{mobileNav ? <path d="M18 6L6 18M6 6l12 12"/> : <><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></>}</svg></button>
          <span className="dash__crumb"><span>LIBRARY</span><strong>Templates</strong></span>
          <label className="dash__search" style={{ maxWidth: 320 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg><input placeholder="Search templates…" value={q} onChange={(e) => setQ(e.target.value)} /></label>
          <div className="dash__top-actions"><button className="btn btn--primary" onClick={() => setShowCreate(true)} style={{ padding: "7px 12px" }}>Create template</button></div>
        </header>
        {mobileNav && <nav className="dash__mobile-nav"><Link to="/dashboard" onClick={() => setMobileNav(false)}>Overview</Link><Link to="/forms" onClick={() => setMobileNav(false)}>Forms</Link></nav>}

        <main className="dash__main">
          <div className="dash__ledger">
            <div className="dash__ledger-left">
              <span className="dash__ledger-kicker"><i /> Library • reusable blueprints</span>
              <h1>Templates</h1>
              <p>Global blueprints — clone to create an org form. Editing a form never mutates its template.</p>
            </div>
            <div className="dash__ledger-actions"><button className="btn btn--primary" onClick={() => setShowCreate(true)}>Create template →</button></div>
          </div>

          {error && <div className="dash__card" style={{ padding: 12, borderColor: "var(--danger)", background: "#fdf0ef", color: "#7a2e2c", fontFamily: "var(--mono)", fontSize: 12 }}>{error}</div>}

          {loading ? (
            <div className="dash__card" style={{ padding: 24, textAlign: "center", fontFamily: "var(--mono)", fontSize: 13, color: "var(--slate)" }}>Loading templates…</div>
          ) : filtered.length === 0 ? (
            <div className="dash__card" style={{ padding: 24 }}>
              <div className="builder__empty">
                <span style={{ width: 40, height: 40, borderRadius: 10, border: "1px dashed var(--warm-gray-strong)", display: "grid", placeItems: "center", color: "var(--slate)" }}>⟡</span>
                <strong style={{ fontFamily: "var(--display)", fontSize: 14 }}>No templates yet</strong>
                <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--slate)" }}>Create your first reusable blueprint — add sections and fields, then clone to a form.</span>
                <button className="btn btn--primary" onClick={() => setShowCreate(true)}>Create template</button>
              </div>
            </div>
          ) : (
            <div className="dash__forms">
              {filtered.map((t) => (
                <article key={t.id} className="form-card">
                  <div className="form-card__top"><span className={`pill ${t.is_active ? "pill--approved" : "pill--expired"}`}>{t.is_active ? "Active" : "Inactive"}</span><span className="mono-muted" style={{ fontSize: 11 }}>{t.category ?? "General"} • {new Date(t.updated_at).toLocaleDateString()}</span></div>
                  <div className="form-card__title">{t.title}</div>
                  {t.description ? <div className="form-card__meta" style={{ color: "var(--slate)", fontFamily: "var(--sans)", fontSize: 13, textTransform: "none", letterSpacing: 0 }}>{t.description}</div> : null}
                  <div className="form-card__actions">
                    <Link className="btn btn--ghost btn--sm" to={`/templates/${t.id}`}>Open builder</Link>
                    <button className="btn btn--ghost btn--sm" onClick={() => setCloningId((p) => (p === t.id ? null : t.id))}>Clone</button>
                    <button className="btn btn--ghost btn--sm" style={{ color: "var(--danger)", borderColor: "transparent" }} onClick={() => setDeleteTarget(t)} aria-label={`Delete ${t.title}`}>Delete</button>
                  </div>
                  {cloningId === t.id && (
                    <div style={{ display: "flex", gap: 6, marginTop: 8, alignItems: "center" }}>
                      <input value={cloneTitle} onChange={(e) => setCloneTitle(e.target.value)} placeholder="New form title" style={{ flex: 1, minHeight: 36, padding: "8px 10px", border: "1px solid var(--warm-gray)", borderRadius: 8, fontSize: 13 }} />
                      <button className="btn btn--primary btn--sm" onClick={() => handleClone(t.id)} disabled={!cloneTitle.trim() || cloning}>{cloning ? "Cloning…" : "Create form"}</button>
                    </div>
                  )}
                </article>
              ))}
              <button className="form-card form-card--create" onClick={() => setShowCreate(true)}><span style={{ display: "grid", gap: 8, justifyItems: "center" }}><span style={{ width: 36, height: 36, borderRadius: 10, border: "1px dashed var(--line)", display: "grid", placeItems: "center", color: "var(--muted)" }}>+</span><strong style={{ fontFamily: "var(--display)", fontSize: 13 }}>Create template</strong><span style={{ fontSize: 12, color: "var(--muted)" }}>Reusable blueprint</span></span></button>
            </div>
          )}
        </main>

      {deleteTarget && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__head"><h3>Delete template</h3><button className="dash__icon-btn" aria-label="Close" onClick={() => setDeleteTarget(null)}>✕</button></div>
            <div className="modal__body">
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "var(--graphite)" }}>Permanently delete <strong>{deleteTarget.title}</strong>? Sections and fields inside will be removed. Forms already cloned from it are not affected. This cannot be undone.</p>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}><button className="btn btn--ghost" onClick={() => setDeleteTarget(null)} disabled={!!deletingId}>Cancel</button><button className="btn btn--primary" style={{ background: "var(--danger)", borderColor: "var(--danger)" }} onClick={handleDelete} disabled={!!deletingId}>{deletingId ? "Deleting…" : "Delete permanently"}</button></div>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__head"><h3>Create template</h3><button className="dash__icon-btn" aria-label="Close" onClick={() => setShowCreate(false)}>✕</button></div>
            <div className="modal__body">
              <label className="field"><span>Title *</span><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. SOC 2 Type II" style={{ minHeight: 44 }} /></label>
              <label className="field"><span>Description</span><textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this for?" rows={3} /></label>
              <label className="field"><span>Category</span><input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Security" style={{ minHeight: 44 }} /></label>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}><button className="btn btn--ghost" onClick={() => setShowCreate(false)}>Cancel</button><button className="btn btn--primary" onClick={handleCreate} disabled={!title.trim() || creating}>{creating ? "Creating…" : "Create"}</button></div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
