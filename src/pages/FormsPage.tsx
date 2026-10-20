import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import "./DashboardPage.css"
import { ApiError } from "../lib/api"
import * as api from "../features/forms/api"
import type { FormResponse, FormTemplateResponse } from "../features/forms/types"

export default function FormsPage() {
  const navigate = useNavigate()
  const [forms, setForms] = useState<FormResponse[]>([])
  const [templates, setTemplates] = useState<FormTemplateResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "draft" | "active" | "archived">("all")
  const [q, setQ] = useState("")
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")
  const [allowResubmit, setAllowResubmit] = useState(false)
  const [templateId, setTemplateId] = useState("")
  const [cloneMode, setCloneMode] = useState(true)
  const [mobileNav, setMobileNav] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<FormResponse | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [f, t] = await Promise.all([api.listForms(), api.listTemplates()])
      setForms(f)
      setTemplates(t)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load forms")
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { void load() }, [])

  const filtered = useMemo(() => {
    return forms.filter((f) => {
      if (filter !== "all" && f.status !== filter) return false
      if (q.trim() && !`${f.title} ${f.description ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false
      return true
    })
  }, [forms, filter, q])

  const [creating, setCreating] = useState(false)

  function cloneErrorMessage(e: unknown): string {
    if (e instanceof ApiError) {
      if (e.status === 404) return "Template not found — it may have been removed."
      if (e.status === 403) return "You need an organization to clone templates."
      return e.message
    }
    return "Create failed"
  }

  async function handleCreate() {
    if (!title.trim()) return
    setCreating(true)
    setError(null)
    try {
      if (cloneMode && templateId) {
        const form = await api.cloneTemplate(templateId, { title: title.trim() })
        if (desc.trim() || allowResubmit) {
          try {
            await api.updateForm(form.id, { description: desc.trim() || undefined, allow_resubmit: allowResubmit || undefined })
          } catch {
            // description patch is optional — clone already succeeded
          }
        }
        // invalidate + redirect to detail for editing (form is draft until active)
        navigate(`/forms/${form.id}`)
      } else {
        // Scratch — never send template_id (POST /forms no longer accepts it)
        const form = await api.createForm({ title: title.trim(), description: desc.trim() || undefined, allow_resubmit: allowResubmit || undefined })
        navigate(`/forms/${form.id}`)
      }
    } catch (e) {
      setError(cloneErrorMessage(e))
    } finally {
      setCreating(false)
    }
  }

  function deleteErrorMessage(e: unknown): string {
    if (e instanceof ApiError) {
      if (e.status === 404) return "Form not found — already deleted."
      if (e.status === 403) return "Access denied — you don't own this form."
      return e.message
    }
    return "Delete failed"
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeletingId(deleteTarget.id)
    setError(null)
    try {
      await api.deleteForm(deleteTarget.id)
      setForms((prev) => prev.filter((f) => f.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (e) {
      setError(deleteErrorMessage(e))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <header className="dash__top">
        <button className="dash__icon-btn" aria-label="Toggle menu" onClick={() => setMobileNav((v) => !v)}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{mobileNav ? <path d="M18 6L6 18M6 6l12 12"/> : <><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></>}</svg></button>
        <span className="dash__crumb"><span>FORMS</span><strong>Org forms</strong></span>
        <label className="dash__search" style={{ maxWidth: 300 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg><input placeholder="Search forms…" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <div className="dash__top-actions"><button className="btn btn--primary" onClick={() => setShowCreate(true)} style={{ padding: "7px 12px" }}>Create form</button></div>
      </header>
      {mobileNav && <nav className="dash__mobile-nav"><Link to="/dashboard" onClick={() => setMobileNav(false)}>Overview</Link><Link to="/templates" onClick={() => setMobileNav(false)}>Templates</Link><Link to="/forms" onClick={() => setMobileNav(false)}>Forms</Link></nav>}

      <main className="dash__main">
        <div className="dash__ledger">
          <div className="dash__ledger-left"><span className="dash__ledger-kicker"><i /> Dossiers • org-owned</span><h1>Forms</h1><p>Draft → Active → Archived. Use a template to deep-copy sections &amp; fields atomically; or start blank and build sections/fields from scratch.</p></div>
          <div className="dash__ledger-actions">
            <button className="btn btn--ghost" onClick={() => { setCloneMode(false); setTemplateId(""); setShowCreate(true)}}>Create blank form</button>
            <button className="btn btn--primary" onClick={() => { setCloneMode(true); setShowCreate(true)}}>Use template →</button>
          </div>
        </div>

        {error && <div className="dash__card" style={{ padding: 12, color: "var(--danger)", fontFamily: "var(--mono)", fontSize: 12, background: "#fdf0ef" }}>{error}</div>}

        <div className="dash__card">
          <div className="dash__card-head">
            <h2>Forms <em>{filtered.length} dossiers</em></h2>
            <div className="filter-pills">
              {(["all", "draft", "active", "archived"] as const).map((s) => (
                <button key={s} className={filter === s ? "is-active" : ""} onClick={() => setFilter(s)}>{s === "all" ? "All" : s[0].toUpperCase() + s.slice(1)}</button>
              ))}
            </div>
          </div>
          {loading ? (
            <div style={{ padding: 24, textAlign: "center", fontFamily: "var(--mono)", fontSize: 13, color: "var(--slate)" }}>Loading forms…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 24 }}><div className="builder__empty"><span style={{ width: 36, height: 36, borderRadius: 10, border: "1px dashed var(--line)", display: "grid", placeItems: "center" }}>＋</span><strong>Create new form</strong><span style={{ fontSize: 12, color: "var(--muted)" }}>Blank or clone a public template</span><button className="btn btn--primary" onClick={() => setShowCreate(true)}>Create form</button></div></div>
          ) : (
            <div className="dash__forms">
              {filtered.map((f) => (
                <article key={f.id} className="form-card">
                  <div className="form-card__top"><span className={`pill ${f.status === "active" ? "pill--approved" : f.status === "draft" ? "pill--pending" : "pill--expired"}`}>{f.status}</span><span className="mono-muted" style={{ fontSize: 11 }}>{new Date(f.updated_at).toLocaleDateString()}</span></div>
                  <div className="form-card__title">{f.title}</div>
                  {f.description ? <div className="mono-muted" style={{ fontSize: 13, textTransform: "none", letterSpacing: 0 }}>{f.description}</div> : null}
                  <div className="mono-muted" style={{ fontSize: 11 }}>{f.template_id ? `template ${f.template_id.slice(0, 8)}` : "blank"}</div>
                  <div className="form-card__actions">
                    <Link className="btn btn--ghost btn--sm" to={`/forms/${f.id}`}>Edit</Link>
                    <Link className="btn btn--ghost btn--sm" to={`/forms/${f.id}/fill`}>Fill</Link>
                    <Link className="btn btn--ghost btn--sm" to={`/forms/${f.id}/submissions`}>Submissions</Link>
                    <button
                      className="btn btn--ghost btn--sm"
                      style={{ color: "var(--danger)", borderColor: "transparent" }}
                      onClick={() => setDeleteTarget(f)}
                      aria-label={`Delete ${f.title}`}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
              <button className="form-card form-card--create" onClick={() => setShowCreate(true)}><span style={{ display: "grid", gap: 8, justifyItems: "center" }}><span style={{ width: 36, height: 36, borderRadius: 10, border: "1px dashed var(--line)", display: "grid", placeItems: "center", color: "var(--muted)" }}>+</span><strong style={{ fontFamily: "var(--display)", fontSize: 13 }}>Create new form</strong><span style={{ fontSize: 12, color: "var(--muted)" }}>Blank or from template</span></span></button>
            </div>
          )}
        </div>
      </main>

      {deleteTarget && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__head"><h3>Delete form</h3><button className="dash__icon-btn" aria-label="Close" onClick={() => setDeleteTarget(null)}>✕</button></div>
            <div className="modal__body">
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "var(--graphite)" }}>
                Permanently delete <strong>{deleteTarget.title}</strong>? This removes its sections, fields and submissions. This cannot be undone.
              </p>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center" }}>
                <button className="btn btn--ghost" onClick={() => setDeleteTarget(null)} disabled={!!deletingId}>Cancel</button>
                <button
                  className="btn btn--primary"
                  style={{ background: "var(--danger)", borderColor: "var(--danger)" }}
                  onClick={handleDelete}
                  disabled={!!deletingId}
                >
                  {deletingId ? "Deleting…" : "Delete permanently"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__head"><h3>Create form</h3><button className="dash__icon-btn" aria-label="Close" onClick={() => setShowCreate(false)}>✕</button></div>
            <div className="modal__body">
              {/* Explicit entry-point toggle — makes scratch vs clone obvious */}
              <div role="tablist" aria-label="Form creation mode" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, padding: 4, background: "var(--ivory)", border: "1px solid var(--warm-gray)", borderRadius: 10 }}>
                <button
                  role="tab"
                  aria-selected={!cloneMode}
                  onClick={() => setCloneMode(false)}
                  style={{
                    padding: "10px 12px", borderRadius: 8, border: "1px solid", fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600, cursor: "pointer",
                    background: !cloneMode ? "var(--surface)" : "transparent",
                    borderColor: !cloneMode ? "var(--warm-gray-strong)" : "transparent",
                    color: !cloneMode ? "var(--forest)" : "var(--slate)",
                    boxShadow: !cloneMode ? "0 1px 4px rgba(0,0,0,.06)" : "none",
                  }}
                >
                  Blank form
                </button>
                <button
                  role="tab"
                  aria-selected={cloneMode}
                  onClick={() => setCloneMode(true)}
                  style={{
                    padding: "10px 12px", borderRadius: 8, border: "1px solid", fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600, cursor: "pointer",
                    background: cloneMode ? "var(--surface)" : "transparent",
                    borderColor: cloneMode ? "var(--warm-gray-strong)" : "transparent",
                    color: cloneMode ? "var(--forest)" : "var(--slate)",
                    boxShadow: cloneMode ? "0 1px 4px rgba(0,0,0,.06)" : "none",
                  }}
                >
                  Use template
                </button>
              </div>
              <p className="mono-muted" style={{ fontSize: 11, margin: "-4px 0 0", background: cloneMode ? "#EEF5F1" : "var(--ivory)", border: `1px solid ${cloneMode ? "#C8DDD6" : "var(--warm-gray)"}`, padding: "8px 10px", borderRadius: 8, color: "var(--slate)" }}>
                {cloneMode ? "Clone deep-copies all sections & fields atomically — form starts as draft, independent of template." : "Start blank and add sections & fields after creation."}
              </p>

              <label className="field"><span>Title *</span><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={cloneMode ? "e.g. Vendor KYC — Acme" : "e.g. Custom KYC Request"} style={{ minHeight: 44 }} /></label>
              <label className="field"><span>Description</span><input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Optional" style={{ minHeight: 44 }} /></label>
              <label style={{ display: "flex", gap: 8, alignItems: "center", fontFamily: "var(--mono)", fontSize: 12, color: "var(--slate)" }}>
                <input type="checkbox" checked={allowResubmit} onChange={(e) => setAllowResubmit(e.target.checked)} />
                Allow resubmission (vendors may submit more than once)
              </label>

              {cloneMode ? (
                <label className="field"><span>Template to clone *</span>
                  <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} style={{ minHeight: 44 }}>
                    <option value="">Select template</option>
                    {templates.map((t) => <option key={t.id} value={t.id}>{t.title} — {t.category ?? "General"}</option>)}
                  </select>
                </label>
              ) : null}

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center" }}>
                {creating && <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--slate)" }}>{cloneMode ? "Cloning…" : "Creating…"}</span>}
                <button className="btn btn--ghost" onClick={() => setShowCreate(false)} disabled={creating}>Cancel</button>
                <button className="btn btn--primary" onClick={handleCreate} disabled={!title.trim() || (cloneMode && !templateId) || creating}>
                  {creating ? (cloneMode ? "Cloning…" : "Creating…") : cloneMode ? "Clone → draft" : "Create blank form"}
                </button>
              </div>
              {!cloneMode && <span className="mono-muted" style={{ fontSize: 11, textAlign: "right" }}>After creation you’ll edit sections & fields on the form detail page.</span>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
