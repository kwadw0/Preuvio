import { useCallback, useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import "./DashboardPage.css"
import { ApiError, getErrorCode } from "../lib/api"
import * as api from "../features/forms/api"
import type { FormDetailResponse, RendererSchema } from "../features/forms/types"
import { toRendererSchemaFromForm } from "../features/forms/types"
import { FormRenderer } from "../features/forms/components/FormRenderer"
import { validateAll, validateField } from "../features/forms/validation"
import type { RendererField } from "../features/forms/types"
import { usePartnerProfile } from "../features/partners/usePartnerProfile"

export default function FormFillPage() {
  const { id } = useParams<{ id: string }>()
  const { isPartner } = usePartnerProfile()
  const [detail, setDetail] = useState<FormDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)
  const [successId, setSuccessId] = useState<string | null>(null)
  const [stepMode, setStepMode] = useState<"single" | "stepper">("single")

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const d = await api.getFormDetail(id)
      setDetail(d)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Load failed")
    } finally {
      setLoading(false)
    }
  }, [id])
  useEffect(() => { void load() }, [load])

  const schema: RendererSchema | null = detail ? toRendererSchemaFromForm(detail) : null
  const allFields: RendererField[] = (schema?.sections.flatMap((s) => s.fields) as RendererField[]) ?? []

  function handleBlur(key: string) {
    setTouched((p) => ({ ...p, [key]: true }))
    const field = allFields.find((f) => f.key === key)
    if (field) {
      const msg = validateField(field, values[key])
      setErrors((p) => {
        const n = { ...p }
        if (msg) n[key] = msg
        else delete n[key]
        return n
      })
    }
  }

  function submitErrorMessage(err: unknown): string {
    const code = getErrorCode(err)
    if (code === "ASSIGNMENT_REQUIRED") return "Not assigned to you — ask your org to assign this form before submitting."
    if (code === "PARTNER_INACTIVE") return "This vendor account is inactive or suspended — submitting is disabled. Contact your org."
    if (code === "FORM_NOT_ACTIVE") return "This form is not active — submissions are closed."
    if (code === "ALREADY_SUBMITTED") return "Already submitted — resubmission is disabled for this form."
    return err instanceof ApiError ? err.message : "Submit failed"
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!id || !schema) return
    const errs = validateAll(allFields, values)
    setErrors(errs)
    setTouched(Object.fromEntries(allFields.map((f) => [f.key, true])))
    if (Object.keys(errs).length > 0) {
      setError("Fix validation errors before submitting")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const sub = await api.createSubmission(id, values)
      setSuccessId(sub.id)
    } catch (err) {
      setError(submitErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="dash__main" style={{ padding: 24, fontFamily: "var(--mono)", color: "var(--slate)" }}>Loading form…</div>
  if (error && !detail) return <div className="dash__main"><div className="dash__card" style={{ padding: 16, color: "var(--danger)" }}>{error}</div></div>
  if (!detail || !schema) return null

  const isArchived = detail.form.status === "archived"
  const isDraft = detail.form.status === "draft"
  const allowResubmit = detail.form.allow_resubmit ?? false

  return (
    <>
        <header className="dash__top"><span className="dash__crumb"><Link to={isPartner ? "/assignments" : "/forms"} style={{ color: "inherit" }}>{isPartner ? "My work" : "Forms"}</Link><strong>{detail.form.title}</strong></span><div className="dash__top-actions"><span className={`pill ${detail.form.status === "active" ? "pill--approved" : detail.form.status === "draft" ? "pill--pending" : "pill--expired"}`}>{detail.form.status}</span>{isPartner ? <Link className="btn btn--ghost" to="/assignments">Back to queue</Link> : <><Link className="btn btn--ghost" to={`/forms/${detail.form.id}`}>Edit dossier</Link><Link className="btn btn--ghost" to={`/forms/${detail.form.id}/submissions`}>Submissions</Link></>}</div></header>
        <main className="dash__main">
          <div className="dash__ledger"><div className="dash__ledger-left"><span className="dash__ledger-kicker"><i /> Respondent • fill dossier</span><h1 style={{ fontSize: 22 }}>{detail.form.title}</h1><p>{detail.form.description ?? "Fill the dossier. Conditional fields animate in smoothly."}</p></div><div className="dash__ledger-actions"><button className={`btn btn--sm ${stepMode === "single" ? "btn--primary" : "btn--ghost"}`} onClick={() => setStepMode("single")}>Single page</button><button className={`btn btn--sm ${stepMode === "stepper" ? "btn--primary" : "btn--ghost"}`} onClick={() => setStepMode("stepper")}>Stepper</button></div></div>

          {isDraft && <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "#7a5a2a", background: "#fdf8f0", border: "1px solid #e8d9b8", padding: 10, borderRadius: 8 }}>Draft — not visible to partners. Set to active when structure is final.</div>}
          {isArchived && <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "#7a2e2c", background: "#fdf0ef", border: "1px solid #e8c4c3", padding: 10, borderRadius: 8 }}>Archived — read-only, no new submissions.</div>}

          {successId ? (
            <div className="dash__card" style={{ padding: 20, textAlign: "center", display: "grid", gap: 10, placeItems: "center" }}>
              <span style={{ width: 40, height: 40, borderRadius: 999, background: "var(--verdant)", color: "white", display: "grid", placeItems: "center" }}>✓</span>
              <strong style={{ fontFamily: "var(--display)", fontSize: 15 }}>Submitted — pending review</strong>
              <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--slate)" }}>ID {successId}</span>
              <Link className="btn btn--ghost" to={`/submissions/${successId}`}>View submission →</Link>
              {allowResubmit ? (
                <button className="btn btn--ghost" onClick={() => { setSuccessId(null); setValues({}); setErrors({}) }}>Submit another</button>
              ) : (
                <span className="mono-muted" style={{ fontSize: 11 }}>Resubmission disabled for this form.</span>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate style={{ display: "grid", gap: 16 }}>
              {/* Shared renderer — same as builder preview */}
              <FormRenderer schema={schema} values={values} onChange={setValues} errors={Object.fromEntries(Object.entries(errors).filter(([k]) => touched[k]))} onBlurField={handleBlur} mode={isArchived ? "readonly" : "fill"} stepMode={stepMode} />

              {error && <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--danger)", background: "#fdf0ef", border: "1px solid #e8c4c3", padding: 10, borderRadius: 8 }}>{error}</div>}

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" className="btn btn--ghost" onClick={() => setValues({})} style={{ minHeight: 44 }}>Clear</button>
                <button type="submit" className="btn btn--primary" disabled={submitting || isArchived} style={{ minHeight: 44, minWidth: 140 }}>{submitting ? "Submitting…" : "Submit dossier"}</button>
              </div>
              <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--slate-2)", textAlign: "center" }}>Keys map field.key → value. Values freeform — API only checks responses exists. Client enforces required/type before submit.</p>
            </form>
          )}
        </main>
    </>
  )
}
