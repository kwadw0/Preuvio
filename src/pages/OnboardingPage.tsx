import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ApiError } from "../lib/api"
import { createOrganization, extractOrg } from "../features/org/api"
import { CUSTOMER_TYPES, INDUSTRIES, OWNER_ROLES, TEAM_SIZES, humanizeEnum } from "../features/org/types"
import type { OrgCreateDto } from "../features/org/types"
import { validateOrgStep1, validateOrgStep2 } from "../features/org/validation"
import type { OrgErrors } from "../features/org/validation"
import { setOnboardedCache, useOnboardingStatus } from "../features/org/useOnboardingStatus"
import "./OnboardingPage.css"

const DRAFT_KEY = "preuvio_onboarding_draft"

function loadDraft(): Partial<OrgCreateDto> | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Partial<OrgCreateDto>
  } catch {
    return null
  }
}

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { isLoading: statusLoading, isOnboarded } = useOnboardingStatus()
  const draft = loadDraft()

  const [step, setStep] = useState<1 | 2>(1)
  const [form, setForm] = useState<Partial<OrgCreateDto>>(() => ({
    name: draft?.name ?? "",
    description: draft?.description ?? "",
    website_url: draft?.website_url ?? "",
    industry: draft?.industry ?? ("" as never),
    team_size: draft?.team_size ?? ("" as never),
    primary_customer_type: draft?.primary_customer_type ?? "b2b",
    owner_role: draft?.owner_role ?? ("" as never),
  }))
  const [errors, setErrors] = useState<OrgErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!statusLoading && isOnboarded) {
      navigate("/dashboard", { replace: true })
    }
  }, [statusLoading, isOnboarded, navigate])

  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form))
    } catch {
      // ignore
    }
  }, [form])

  useEffect(() => {
    if (step === 1) nameRef.current?.focus()
  }, [step])

  function setField<K extends keyof OrgCreateDto>(key: K, value: OrgCreateDto[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (touched[key]) {
      const v = step === 1 ? validateOrgStep1({ ...form, [key]: value }) : validateOrgStep2({ ...form, [key]: value })
      setErrors((prev) => ({ ...prev, [key]: v[key] }))
    }
    setApiError(null)
  }

  function handleNext() {
    if (step === 1) {
      const v = validateOrgStep1(form)
      setTouched((p) => ({ ...p, name: true, industry: true, owner_role: true }))
      setErrors((prev) => ({ ...prev, ...v }))
      if (Object.keys(v).length > 0) return
      setStep(2)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  function handleBack() {
    setStep(1)
    setApiError(null)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const v1 = validateOrgStep1(form)
    const v2 = validateOrgStep2(form)
    const all = { ...v1, ...v2 }
    setTouched({ name: true, industry: true, owner_role: true, team_size: true, primary_customer_type: true, website_url: true, description: true })
    setErrors(all)
    if (Object.keys(all).length > 0) {
      // jump to first invalid step
      if (Object.keys(v1).length > 0) setStep(1)
      return
    }

    setIsSubmitting(true)
    setApiError(null)
    try {
      const res = await createOrganization(form as OrgCreateDto)
      try {
        const created = extractOrg(res as never)
        if (created && (created as { id?: string }).id) {
          setOnboardedCache(created as never)
        } else {
          // optimistic fallback from form
          setOnboardedCache({
            id: "pending",
            name: form.name!.trim(),
            description: form.description?.trim() ?? null,
            website_url: form.website_url?.trim() ?? null,
            industry: form.industry!,
            team_size: form.team_size!,
            primary_customer_type: form.primary_customer_type!,
            owner_role: form.owner_role!,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as never)
        }
      } catch {
        setOnboardedCache({
          id: "pending",
          name: form.name!.trim(),
          description: form.description?.trim() ?? null,
          website_url: form.website_url?.trim() ?? null,
          industry: form.industry!,
          team_size: form.team_size!,
          primary_customer_type: form.primary_customer_type!,
          owner_role: form.owner_role!,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as never)
      }
      try {
        sessionStorage.removeItem(DRAFT_KEY)
      } catch {
        // ignore
      }
      navigate("/dashboard", { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setErrors((prev) => ({ ...prev, name: "Organization name already taken." }))
          setStep(1)
          setApiError(null)
          return
        }
        if (err.status === 400) {
          // try to surface field from payload message
          const msg = err.message || "Please check your details."
          // heuristic: map common backend field hints
          if (msg.toLowerCase().includes("name")) setErrors((p) => ({ ...p, name: msg }))
          else if (msg.toLowerCase().includes("website")) setErrors((p) => ({ ...p, website_url: msg }))
          else setApiError(msg)
          return
        }
        if (err.status === 0) setApiError("Network error. Please check your connection.")
        else setApiError(err.message || "Something went wrong. Please try again.")
      } else {
        setApiError("Something went wrong. Please try again.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (statusLoading) {
    return (
      <div style={{ minHeight: "100svh", display: "grid", placeItems: "center", color: "var(--muted)" }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 13 }}>Checking workspace…</span>
      </div>
    )
  }

  if (isOnboarded) return null

  return (
    <div className="onb">
      <div className="onb__left">
        <div className="onb__left-inner">
          <Link to="/" className="brand" aria-label="Preuvio home">
            <span className="brand__mark" aria-hidden>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3l7 4v5c0 5-3.5 7.5-7 8-3.5-.5-7-3-7-8V7l7-4z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </span>
            Preuvio
          </Link>
          <h1 className="onb__headline">
            Set up your
            <br />
            workspace.
          </h1>
          <p className="onb__tagline">
            Tell us about your organization. This helps tailor compliance workflows and appears on partner invitations.
          </p>
          <div className="onb__steps-side" aria-hidden>
            <div className={`onb__side-step ${step >= 1 ? "is-active" : ""} ${step > 1 ? "is-done" : ""}`}>
              <span className="onb__side-dot">{step > 1 ? "✓" : "1"}</span>
              <div>
                <strong>Identity</strong>
                <span>Name, industry, role</span>
              </div>
            </div>
            <div className={`onb__side-step ${step >= 2 ? "is-active" : ""}`}>
              <span className="onb__side-dot">2</span>
              <div>
                <strong>Scale & presence</strong>
                <span>Team, customers, web</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="onb__right">
        <div className="onb__form-wrap">
          <div className="onb__form-header">
            <span className="onb__kicker">
              <i aria-hidden /> ORG • ONBOARDING — STEP {step} OF 2
            </span>
            <h2>{step === 1 ? "Organization identity" : "Scale & presence"}</h2>
            <p>{step === 1 ? "Start with the basics. You can change this later in Organization." : "Almost done — tell us how you operate."}</p>
          </div>

          <div className="onb__progress" aria-label={`Step ${step} of 2`} role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={2}>
            <span className={`onb__progress-dot ${step >= 1 ? "is-active" : ""} ${step > 1 ? "is-done" : ""}`} aria-hidden>
              {step > 1 ? "✓" : "1"}
            </span>
            <span className={`onb__progress-line ${step > 1 ? "is-active" : ""}`} aria-hidden />
            <span className={`onb__progress-dot ${step >= 2 ? "is-active" : ""}`} aria-hidden>
              2
            </span>
          </div>

          <form className="onb__form" onSubmit={step === 1 ? (e) => { e.preventDefault(); handleNext() } : handleSubmit} noValidate>
            {apiError && (
              <div role="alert" className="onb__alert">
                {apiError}
              </div>
            )}

            {step === 1 && (
              <>
                <div className="onb__field">
                  <label htmlFor="onb-name">Organization name *</label>
                  <input
                    id="onb-name"
                    ref={nameRef}
                    type="text"
                    placeholder="Acme Vendor Guard"
                    value={form.name ?? ""}
                    onChange={(e) => setField("name", e.target.value)}
                    onBlur={() => setTouched((p) => ({ ...p, name: true }))}
                    aria-invalid={touched.name && !!errors.name}
                    aria-describedby={errors.name ? "err-onb-name" : undefined}
                    className={touched.name && errors.name ? "onb__input--error" : ""}
                    autoComplete="organization"
                  />
                  {touched.name && errors.name && <span className="onb__error" id="err-onb-name" role="alert">{errors.name}</span>}
                </div>

                <div className="onb__field">
                  <label htmlFor="onb-industry">Industry *</label>
                  <select
                    id="onb-industry"
                    value={form.industry ?? ""}
                    onChange={(e) => setField("industry", e.target.value as OrgCreateDto["industry"])}
                    onBlur={() => setTouched((p) => ({ ...p, industry: true }))}
                    aria-invalid={touched.industry && !!errors.industry}
                    className={touched.industry && errors.industry ? "onb__input--error" : ""}
                  >
                    <option value="" disabled>Select industry</option>
                    {INDUSTRIES.map((v) => (
                      <option key={v} value={v}>{humanizeEnum(v)}</option>
                    ))}
                  </select>
                  {touched.industry && errors.industry && <span className="onb__error" role="alert">{errors.industry}</span>}
                </div>

                <div className="onb__field">
                  <label htmlFor="onb-owner_role">Your role *</label>
                  <select
                    id="onb-owner_role"
                    value={form.owner_role ?? ""}
                    onChange={(e) => setField("owner_role", e.target.value as OrgCreateDto["owner_role"])}
                    onBlur={() => setTouched((p) => ({ ...p, owner_role: true }))}
                    aria-invalid={touched.owner_role && !!errors.owner_role}
                    className={touched.owner_role && errors.owner_role ? "onb__input--error" : ""}
                  >
                    <option value="" disabled>Select role</option>
                    {OWNER_ROLES.map((v) => (
                      <option key={v} value={v}>{humanizeEnum(v)}</option>
                    ))}
                  </select>
                  {touched.owner_role && errors.owner_role && <span className="onb__error" role="alert">{errors.owner_role}</span>}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="onb__field">
                  <label>Team size *</label>
                  <div className="onb__segment" role="radiogroup" aria-label="Team size">
                    {TEAM_SIZES.map((v) => (
                      <button
                        key={v}
                        type="button"
                        role="radio"
                        aria-checked={form.team_size === v}
                        className={`onb__segment-btn ${form.team_size === v ? "is-active" : ""} ${touched.team_size && errors.team_size && !form.team_size ? "is-error" : ""}`}
                        onClick={() => setField("team_size", v as OrgCreateDto["team_size"])}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  {touched.team_size && errors.team_size && <span className="onb__error" role="alert">{errors.team_size}</span>}
                </div>

                <div className="onb__field">
                  <label>Primary customer type *</label>
                  <div className="onb__segment" role="radiogroup" aria-label="Primary customer type">
                    {CUSTOMER_TYPES.map((v) => (
                      <button
                        key={v}
                        type="button"
                        role="radio"
                        aria-checked={form.primary_customer_type === v}
                        className={`onb__segment-btn ${form.primary_customer_type === v ? "is-active" : ""}`}
                        onClick={() => setField("primary_customer_type", v as OrgCreateDto["primary_customer_type"])}
                      >
                        {v === "both" ? "Both" : v.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  {touched.primary_customer_type && errors.primary_customer_type && <span className="onb__error" role="alert">{errors.primary_customer_type}</span>}
                </div>

                <div className="onb__field">
                  <label htmlFor="onb-website">Website <span className="onb__optional">Optional</span></label>
                  <input
                    id="onb-website"
                    type="url"
                    placeholder="https://acme.com"
                    value={form.website_url ?? ""}
                    onChange={(e) => setField("website_url", e.target.value)}
                    onBlur={() => setTouched((p) => ({ ...p, website_url: true }))}
                    aria-invalid={touched.website_url && !!errors.website_url}
                    className={touched.website_url && errors.website_url ? "onb__input--error" : ""}
                    inputMode="url"
                  />
                  {touched.website_url && errors.website_url ? (
                    <span className="onb__error" role="alert">{errors.website_url}</span>
                  ) : (
                    <span className="onb__hint">Must be a valid URL if provided.</span>
                  )}
                </div>

                <div className="onb__field">
                  <label htmlFor="onb-desc">Description <span className="onb__optional">Optional</span></label>
                  <textarea
                    id="onb-desc"
                    placeholder="Risk ops for vendors…"
                    value={form.description ?? ""}
                    onChange={(e) => setField("description", e.target.value)}
                    onBlur={() => setTouched((p) => ({ ...p, description: true }))}
                    aria-invalid={touched.description && !!errors.description}
                    className={touched.description && errors.description ? "onb__input--error" : ""}
                    rows={3}
                    maxLength={280}
                  />
                  <div className="onb__hint-row">
                    {touched.description && errors.description ? (
                      <span className="onb__error" role="alert">{errors.description}</span>
                    ) : (
                      <span className="onb__hint">Briefly describe what your org does.</span>
                    )}
                    <span className="onb__count">{(form.description ?? "").length}/280</span>
                  </div>
                </div>

              </>
            )}

            <div className="onb__actions">
              {step === 2 && (
                <button type="button" className="btn btn--ghost onb__btn" onClick={handleBack} disabled={isSubmitting}>
                  Back
                </button>
              )}
              {step === 1 ? (
                <button type="submit" className="btn btn--primary onb__btn onb__btn--primary">
                  Continue
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M5 12h14M13 5l7 7-7 7" /></svg>
                </button>
              ) : (
                <button type="submit" className="btn btn--primary onb__btn onb__btn--primary" disabled={isSubmitting}>
                  {isSubmitting ? "Creating…" : "Create workspace →"}
                </button>
              )}
            </div>
          </form>

          <p className="onb__footer">You can update these details later in Organization.</p>
        </div>
      </div>
    </div>
  )
}
